import { API_ENDPOINTS, getConversationEndpoint } from '../config/api.js';
import { request } from './apiClient.js';
export const getConversations = (token) => request(API_ENDPOINTS.conversations, { token });
export const createConversation = (token, botId, title = '') =>
  request(API_ENDPOINTS.conversations, { token, method: 'POST', body: { bot_id: botId, title: title.trim() } });
export const getConversation = (token, id) => request(getConversationEndpoint(id), { token });
export const renameConversation = (token, id, title) =>
  request(getConversationEndpoint(id), { token, method: 'PATCH', body: { title: title.trim() } });
export const deleteConversation = (token, id) =>
  request(getConversationEndpoint(id), { token, method: 'DELETE' });
