import { API_ENDPOINTS } from '../config/api.js';
import { request } from './apiClient.js';
export const loginUser = (username, password) =>
  request(API_ENDPOINTS.login, { method: 'POST', body: { username, password } });
export const registerUser = (body) =>
  request(API_ENDPOINTS.register, { method: 'POST', body });
export const getCurrentUser = (token) => request(API_ENDPOINTS.me, { token });
