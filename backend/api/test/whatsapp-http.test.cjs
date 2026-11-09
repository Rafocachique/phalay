const { test } = require('node:test');
const assert = require('node:assert/strict');
const { WhatsappWebhookController } = require('../dist/modules/whatsapp/whatsapp.controller');

test('webhook handshake is sent as plain text with no JSON envelope', () => {
  const response = { contentType: null, body: null,
    type(value) { this.contentType = value; return this; }, send(value) { this.body = value; return this; } };
  const controller = new WhatsappWebhookController({ verify: () => '0012345' }, { get: () => undefined });
  controller.verify('subscribe', 'token', '0012345', response);
  assert.equal(response.contentType, 'text/plain');
  assert.equal(response.body, '0012345');
});

test('worker endpoint rejects missing cron authentication', () => {
  const controller = new WhatsappWebhookController({ processQueue: () => assert.fail('must not process') },
    { get: () => 'a'.repeat(40) });
  assert.throws(() => controller.process(undefined), (error) => error.getStatus() === 403);
  assert.throws(() => controller.process('Bearer wrong'), (error) => error.getStatus() === 403);
});

test('worker endpoint processes only with the separate scheduler secret', async () => {
  const controller = new WhatsappWebhookController({ processQueue: async () => ({ processed: 0 }) },
    { get: () => 'a'.repeat(40) });
  assert.deepEqual(await controller.process(`Bearer ${'a'.repeat(40)}`), { processed: 0 });
});
