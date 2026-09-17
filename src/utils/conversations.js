export function filterConversations(conversations, query = '', botId) {
  const search = query.trim().toLowerCase();
  return conversations.filter((item) =>
    (botId == null || String(item.bot_id) === String(botId)) &&
    `${item.title || 'Untitled conversation'} ${item.bot_name || ''}`.toLowerCase().includes(search),
  ).sort((a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0));
}

export function conversationTranscript(conversation) {
  const title = conversation.title || 'Untitled conversation';
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  return [title, ...messages.map((item) =>
    `${item.sender === 'user' ? 'You' : conversation.bot_name || 'Assistant'}:\n${item.message}`,
  )].join('\n\n');
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}
