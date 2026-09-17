export const API_BASE_URL =
  'https://www.myaiassistantapp.se';

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/accounts/api/login/`,
  register: `${API_BASE_URL}/accounts/api/register/`,
  me: `${API_BASE_URL}/accounts/api/me/`,
  bots: `${API_BASE_URL}/bots/api/bots/`,
  conversations:
    `${API_BASE_URL}/bots/api/conversations/`,
};

export function getConversationEndpoint(
  conversationId,
) {
  return (
    `${API_ENDPOINTS.conversations}` +
    `${encodeURIComponent(conversationId)}/`
  );
}

export function getBotChatEndpoint(botId) {
  return (
    `${API_BASE_URL}/bots/api/bot/` +
    `${encodeURIComponent(botId)}/chat/`
  );
}