const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { validSignature, parseMessages } = require('../dist/modules/whatsapp/whatsapp.security');
const { WhatsappService } = require('../dist/modules/whatsapp/whatsapp.service');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const id = '11111111-1111-4111-8111-111111111111';
const lease = '22222222-2222-4222-8222-222222222222';
const configValues = { WHATSAPP_VERIFY_TOKEN: 'v'.repeat(40), WHATSAPP_APP_SECRET: 'app-secret',
  WHATSAPP_PHONE_NUMBER_ID: '123456', WHATSAPP_ACCESS_TOKEN: 'access-token', WHATSAPP_GRAPH_VERSION: 'v25.0',
  WHATSAPP_BOT_ENABLED: 'true' };
const config = { get: (key) => configValues[key] };
const conversation = { id, phone_number_id: '123456', customer_wa_id: '51999999999', mode: 'HUMAN',
  assigned_to: 'admin', last_customer_at: new Date(), lease_token: lease };
function payload(overrides = {}, phone = '123456') {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
    metadata: { phone_number_id: phone }, messages: [{ id: 'wamid.incoming', from: '51999999999',
      timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'Hola' }, ...overrides }],
  } }] }] };
}

test('validates signature against exact bytes, rejecting changed content and missing signatures', () => {
  const raw = Buffer.from('{ "message": "hola" }');
  const signature = 'sha256=' + createHmac('sha256', 'app-secret').update(raw).digest('hex');
  assert.equal(validSignature(raw, signature, 'app-secret'), true);
  assert.equal(validSignature(Buffer.from('{"message":"hola"}'), signature, 'app-secret'), false);
  assert.equal(validSignature(raw, undefined, 'app-secret'), false);
  assert.equal(validSignature(raw, signature, undefined), false);
});

test('handshake returns the exact challenge, fails closed with wrong or missing secret', () => {
  const service = new WhatsappService({}, config, {});
  assert.equal(service.verify('subscribe', configValues.WHATSAPP_VERIFY_TOKEN, '12345'), '12345');
  assert.throws(() => service.verify('subscribe', 'wrong', '12345'), (error) => error.getStatus() === 403);
  assert.throws(() => new WhatsappService({}, { get: () => undefined }, {}).verify('subscribe', 'x', '1'),
    (error) => error.getStatus() === 503);
});

test('ignores statuses, other phone numbers and malformed sender or timestamp', () => {
  assert.equal(parseMessages(payload(), '123456').length, 1);
  assert.equal(parseMessages(payload({}, 'different'), '123456').length, 0);
  assert.equal(parseMessages(payload({ from: '../someone' }), '123456').length, 0);
  assert.equal(parseMessages(payload({ timestamp: 'invalid' }), '123456').length, 0);
  assert.equal(parseMessages({ object: 'whatsapp_business_account', entry: [] }, '123456').length, 0);
});

test('media and overlong text require a vendor without exposing unsupported payload data', () => {
  for (const input of [{ type: 'image', image: { id: 'private-image' } }, { text: { body: 'x'.repeat(2001) } }]) {
    const message = parseMessages(payload(input), '123456')[0];
    assert.equal(message.text, false);
    assert.ok(!message.body.includes('private-image'));
  }
});

test('duplicate incoming message is acknowledged without inserting or running the bot', async () => {
  let calls = 0;
  const db = { $transaction: async (fn) => fn({ $queryRaw: async () => { calls++; return [{ id }]; } }) };
  const service = new WhatsappService(db, config, { preview: () => assert.fail('must not call bot during webhook') });
  const data = payload(), raw = Buffer.from(JSON.stringify(data));
  const signature = 'sha256=' + createHmac('sha256', 'app-secret').update(raw).digest('hex');
  assert.deepEqual(await service.receive(raw, signature, data), { received: true });
  assert.equal(calls, 1);
});

test('unsigned webhook cannot write to the database', async () => {
  const service = new WhatsappService({ $transaction: () => assert.fail('must not write') }, config, {});
  await assert.rejects(service.receive(Buffer.from('{}'), 'invalid', payload()), (error) => error.getStatus() === 403);
});

test('manual reply requires the current assigned human and always releases its own lease', async () => {
  let released = false, queried = 0;
  const db = { $queryRaw: async () => { queried++; return [{ ...conversation, mode: 'BOT' }]; },
    $executeRaw: async (sql, ...values) => { released = sql.join('').includes('lease_token = NULL') && values.includes(lease); return 1; } };
  global.fetch = async () => assert.fail('must not send while bot owns conversation');
  await assert.rejects(new WhatsappService(db, config, {}).manualReply(id, 'hola', 'admin'), (error) => error.getStatus() === 409);
  assert.equal(queried, 2);
  assert.equal(released, true);
});

test('messages outside the service window do not call Meta', async () => {
  const expired = { ...conversation, last_customer_at: new Date(Date.now() - 25 * 3600_000) };
  const db = { $queryRaw: async () => [expired], $executeRaw: async () => 1 };
  global.fetch = async () => assert.fail('must not send outside 24 hours');
  await assert.rejects(new WhatsappService(db, config, {}).manualReply(id, 'hola', 'admin'), (error) => error.getStatus() === 409);
});

test('persists an outgoing attempt before calling Meta and marks ambiguous errors UNKNOWN', async () => {
  const events = [];
  const db = { $queryRaw: async () => [conversation], $executeRaw: async (sql) => { events.push(sql.join('')); return 1; } };
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://graph.facebook.com/v25.0/123456/messages');
    assert.equal(options.headers.Authorization, 'Bearer access-token');
    assert.equal(JSON.parse(options.body).to, conversation.customer_wa_id);
    assert.ok(events.some((sql) => sql.includes("'SENDING'")));
    throw new Error('network timeout');
  };
  await assert.rejects(new WhatsappService(db, config, {}).manualReply(id, 'hola', 'admin'), (error) => error.getStatus() === 503);
  assert.ok(events.some((sql) => sql.includes("'UNKNOWN'")));
});

test('disabled bot never fetches pending jobs or sends messages', async () => {
  const settings = { get: (key) => key === 'WHATSAPP_BOT_ENABLED' ? 'false' : config.get(key) };
  const service = new WhatsappService({ $queryRaw: () => assert.fail('must not query') }, settings, {});
  assert.deepEqual(await service.processQueue(), { processed: 0, enabled: false });
});

test('expired or replaced lease cannot send a message', async () => {
  const db = { $queryRaw: async () => [conversation], $executeRaw: async (sql) => {
    assert.ok(!sql.join('').includes('INSERT INTO public.wa_messages'));
    return 0;
  } };
  global.fetch = async () => assert.fail('must not send without lease');
  await assert.rejects(new WhatsappService(db, config, {}).manualReply(id, 'hola', 'admin'), (error) => error.getStatus() === 409);
});

test('worker handoff pauses conversation and a successful response completes the job', async () => {
  const events = [];
  const db = {
    $queryRaw: async (sql) => sql.join('').includes('SELECT m.*') ? [{ id, conversation_id: id, body: 'un vendedor' }] : [{ ...conversation, mode: 'BOT' }],
    $executeRaw: async (sql) => { events.push(sql.join('')); return 1; },
  };
  global.fetch = async () => ({ ok: true, json: async () => ({ messages: [{ id: 'wamid.sent' }] }) });
  const service = new WhatsappService(db, config, { preview: async () => ({ action: 'handoff', answer: 'Requiere vendedor', suggestions: [] }) });
  assert.deepEqual(await service.processQueue(), { processed: 1, enabled: true });
  assert.ok(events.some((sql) => sql.includes("mode = 'WAITING'")));
  assert.ok(events.some((sql) => sql.includes("state = 'SENT'")));
  assert.ok(events.some((sql) => sql.includes("state = 'RECEIVED'")));
});
