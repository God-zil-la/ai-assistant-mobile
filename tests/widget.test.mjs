import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getWidgetSettings, saveWidgetSettings } from '../src/services/widgetService.js';
import { getConversation } from '../src/services/conversationService.js';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('widget settings use owner authentication and dedicated endpoint', async () => {
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://www.myaiassistantapp.se/bots/api/bots/7/widget/');
    assert.equal(options.headers.Authorization, 'Token owner-token');
    assert.equal(options.method, 'GET');
    return json({ allowed: true, widget_enabled: false, active: false });
  };
  assert.equal((await getWidgetSettings('owner-token', 7)).allowed, true);
});

test('activation and deactivation send only a boolean setting', async () => {
  for (const enabled of [true, false]) {
    global.fetch = async (url, options) => {
      assert.equal(options.method, 'PATCH');
      assert.deepEqual(JSON.parse(options.body), { widget_enabled: enabled });
      return json({ widget_enabled: enabled, active: enabled });
    };
    assert.equal((await saveWidgetSettings('owner', 7, enabled)).active, enabled);
  }
});

test('downgrade rejection is preserved and mutation is never retried', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return json({ detail: 'Website Widget / Public Chatbot requires Pro.' }, 403); };
  await assert.rejects(saveWidgetSettings('owner', 7, true), err => err.status === 403 && /requires Pro/.test(err.message));
  assert.equal(calls, 1);
});

test('visitor conversations retain read-only flag and messages in normal Conversations API', async () => {
  global.fetch = async () => json({ conversation_id: 'abc', is_widget: true, messages: [{ sender: 'user', message: 'Visitor question' }] });
  const result = await getConversation('owner', 'abc');
  assert.equal(result.is_widget, true);
  assert.equal(result.messages[0].message, 'Visitor question');
});
