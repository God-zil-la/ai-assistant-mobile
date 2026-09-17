import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { request, onUnauthorized } from '../src/services/apiClient.js';
import { renameConversation, deleteConversation } from '../src/services/conversationService.js';
import { sendChatMessage } from '../src/services/chatService.js';
import { updateBot } from '../src/services/botService.js';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', ...headers },
});

test('rename uses the production conversation PATCH contract and trims title', async () => {
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://www.myaiassistantapp.se/bots/api/conversations/abc/');
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers.Authorization, 'Token test-token');
    assert.deepEqual(JSON.parse(options.body), { title: 'Project plan' });
    return json({ title: 'Project plan' });
  };
  assert.deepEqual(await renameConversation('test-token', 'abc', ' Project plan '), { title: 'Project plan' });
});
test('delete accepts an empty 204 response', async () => {
  global.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await deleteConversation('test-token', 'abc'), null);
});
test('only an authenticated 401 invalidates the session, not a plan 403', async () => {
  const rejected = [];
  const unsubscribe = onUnauthorized((token) => rejected.push(token));
  try {
    global.fetch = async () => json({ detail: 'Plan limit reached' }, 403);
    await assert.rejects(request('https://example.test', { token: 'valid' }), (err) => err.status === 403);
    assert.deepEqual(rejected, []);
    global.fetch = async () => json({ detail: 'Invalid token' }, 401);
    await assert.rejects(request('https://example.test', { token: 'expired' }));
    await assert.rejects(request('https://example.test'));
    assert.deepEqual(rejected, ['expired']);
  } finally { unsubscribe(); }
});
test('non-JSON 401 still invalidates the session', async () => {
  let token;
  const unsubscribe = onUnauthorized((value) => { token = value; });
  try {
    global.fetch = async () => new Response('Unauthorized', { status: 401 });
    await assert.rejects(request('https://example.test', { token: 'expired' }));
    assert.equal(token, 'expired');
  } finally { unsubscribe(); }
});
test('field validation and rate limit metadata survive parsing', async () => {
  global.fetch = async () => json({ name: ['Already exists.'] }, 400);
  await assert.rejects(updateBot('token', 1, { name: 'Existing' }), /Already exists/);
  global.fetch = async () => json({ error: 'Slow down', retry_after_seconds: 12 }, 429);
  await assert.rejects(request('https://example.test'), (err) => err.status === 429 && err.retryAfter === 12);
});
test('chat includes the existing conversation and never retries a failed POST', async () => {
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://www.myaiassistantapp.se/bots/api/bot/7/chat/');
    assert.deepEqual(JSON.parse(options.body), { message: 'Hello', conversation_id: 'abc' });
    throw new TypeError('Connection lost');
  };
  await assert.rejects(sendChatMessage('token', 7, 'Hello', 'abc'), (err) => err.status === 0);
  assert.equal(calls, 1);
});
test('timeout aborts the request without invalidating a session', async () => {
  global.fetch = async (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
  await assert.rejects(request('https://example.test', { token: 'valid', timeout: 5 }), /timed out/);
});
test('invalid success JSON is a recoverable error', async () => {
  global.fetch = async () => new Response('<html>Proxy</html>');
  await assert.rejects(request('https://example.test'), /invalid response/);
});
