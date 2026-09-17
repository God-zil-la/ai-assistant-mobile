import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterConversations, conversationTranscript, formatDate } from '../src/utils/conversations.js';

test('search filters by assistant and title and sorts without changing source', () => {
  const rows = [
    { conversation_id: 'old', title: 'Trip', bot_id: 1, bot_name: 'Travel', updated_at: '2026-01-01' },
    { conversation_id: 'new', title: 'Trip plan', bot_id: '1', bot_name: 'Travel', updated_at: '2026-09-01' },
    { conversation_id: 'other', title: 'Trip budget', bot_id: 2, bot_name: 'Finance', updated_at: '2026-09-02' },
  ];
  assert.deepEqual(filterConversations(rows, ' TRIP ', 1).map((x) => x.conversation_id), ['new', 'old']);
  assert.equal(filterConversations(rows, 'finance')[0].conversation_id, 'other');
  assert.equal(rows[0].conversation_id, 'old');
  assert.equal(filterConversations(rows, 'unmatched').length, 0);
});
test('sharing includes only the chosen transcript and does not include account metadata', () => {
  const transcript = conversationTranscript({ title: 'Plan', bot_name: 'Coach', token: 'secret', email: 'private',
    messages: [{ sender: 'user', message: 'Hello' }, { sender: 'bot', message: 'Hi' }] });
  assert.equal(transcript, 'Plan\n\nYou:\nHello\n\nCoach:\nHi');
  assert.equal(conversationTranscript({}), 'Untitled conversation');
  assert.equal(formatDate('invalid'), '');
});
