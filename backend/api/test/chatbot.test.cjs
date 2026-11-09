const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { ChatbotService } = require('../dist/modules/chatbot/chatbot.service');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function fixture(overrides = {}) {
  const settings = { CHATBOT_SERVICE_URL: 'https://bot.example', CHATBOT_API_KEY: 'a'.repeat(40),
    NODE_ENV: 'production', ...overrides };
  const queries = [];
  return { queries, service: new ChatbotService({ get: (key) => settings[key] }, {
    faq: { findMany: async (query) => {
      queries.push(query);
      return [{ id: 'faq-a', question: 'Cuál es el catálogo', answer: 'Respuesta aprobada' }];
    } },
  }) };
}

test('sends only active database FAQs and authenticates the Python request', async () => {
  const { service, queries } = fixture();
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://bot.example/chat');
    assert.equal(options.headers.Authorization, `Bearer ${'a'.repeat(40)}`);
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.articles, [{ id: 'faq-a', title: 'Cuál es el catálogo',
      questions: ['Cuál es el catálogo'], answer: 'Respuesta aprobada' }]);
    return { ok: true, json: async () => ({ answer: 'Respuesta aprobada', action: 'answer',
      reason: 'knowledge_match', sources: ['faq-a'], suggestions: [], similarity: 1 }) };
  };
  assert.equal((await service.preview('catálogo')).action, 'answer');
  assert.deepEqual(queries[0].where, { isActive: true });
});

test('does not expose a service secret or upstream error on failure', async () => {
  const { service } = fixture();
  global.fetch = async () => { throw new Error('private upstream details'); };
  await assert.rejects(service.preview('hola'), (error) => {
    assert.equal(error.getStatus(), 503);
    assert.ok(!error.message.includes('private'));
    return true;
  });
});

test('rejects missing configuration and plain HTTP in production before contacting provider', async () => {
  global.fetch = async () => { assert.fail('must not contact provider'); };
  for (const overrides of [{ CHATBOT_API_KEY: '' }, { CHATBOT_SERVICE_URL: 'http://localhost:8000' }]) {
    await assert.rejects(fixture(overrides).service.preview('hola'), (error) => error.getStatus() === 503);
  }
});

test('rejects invalid upstream actions', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ action: 'execute-command' }) });
  await assert.rejects(fixture().service.preview('hola'), (error) => error.getStatus() === 503);
});
