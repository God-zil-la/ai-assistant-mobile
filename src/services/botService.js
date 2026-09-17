import { API_ENDPOINTS } from '../config/api.js';
import { request } from './apiClient.js';
export const getBots = (token) => request(API_ENDPOINTS.bots, { token });
export const createBot = (token, body) =>
  request(API_ENDPOINTS.bots, { token, method: 'POST', body });
export const updateBot = (token, id, body) =>
  request(`${API_ENDPOINTS.bots}${encodeURIComponent(id)}/`, { token, method: 'PATCH', body });
export const deleteBot = (token, id) =>
  request(`${API_ENDPOINTS.bots}${encodeURIComponent(id)}/`, { token, method: 'DELETE' });
