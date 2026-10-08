import { getBotChatEndpoint, getConversationEndpoint } from '../config/api.js';
import { ApiError, request } from './apiClient.js';
import { requireAIConsent } from './aiConsent';

export async function reportAssistantResponse(token, conversationId, messageId) {
  const data = await request(
    `${getConversationEndpoint(conversationId)}messages/${encodeURIComponent(messageId)}/report/`,
    { token, method: 'POST', body: {} },
  );
  if (data?.reported !== true || !Number.isInteger(data.id) || data.id <= 0) {
    throw new ApiError('The report could not be confirmed. Please try again.');
  }
  return data;
}
export async function sendChatMessage(token, botId, message, conversationId) {
  await requireAIConsent(token);
  return request(getBotChatEndpoint(botId), {
    token, method: 'POST', timeout: 90000,
    body: { message, ...(conversationId ? { conversation_id: conversationId } : {}) },
  });
}
