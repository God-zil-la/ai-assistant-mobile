import { getBotChatEndpoint } from '../config/api.js';
import { request } from './apiClient.js';
export function sendChatMessage(token, botId, message, conversationId) {
  return request(getBotChatEndpoint(botId), {
    token, method: 'POST', timeout: 90000,
    body: { message, ...(conversationId ? { conversation_id: conversationId } : {}) },
  });
}
