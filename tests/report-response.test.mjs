import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { reportAssistantResponse } from '../src/services/chatService.js';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });

test('report submits only identifiers using authenticated in-app API; new and duplicate succeed', async () => {
  for (const status of [201, 200]) {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://www.myaiassistantapp.se/bots/api/conversations/abc/messages/42/report/');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Token test-token');
      assert.deepEqual(JSON.parse(options.body), {});
      return json({ id: 7, reported: true }, status);
    };
    assert.deepEqual(await reportAssistantResponse('test-token', 'abc', 42), { id: 7, reported: true });
  }
});

test('report failures preserve auth, access and rate limit errors', async () => {
  for (const status of [401, 404, 429, 500]) {
    global.fetch = async () => json({ detail: 'Report failed' }, status, { 'Retry-After': '60' });
    await assert.rejects(reportAssistantResponse('token', 'abc', 42), err => err.status === status && err.retryAfter === 60);
  }
});

test('lost report response is never automatically retried', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('offline'); };
  await assert.rejects(reportAssistantResponse('token', 'abc', 42), /Unable to connect/);
  assert.equal(calls, 1);
});

test('ambiguous successes never show false report confirmation', async () => {
  for (const body of [{}, { reported: false, id: 7 }, { reported: true }, { reported: true, id: -1 }]) {
    global.fetch = async () => json(body);
    await assert.rejects(reportAssistantResponse('token', 'abc', 42), /could not be confirmed/);
  }
});
