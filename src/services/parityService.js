import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { request } from './apiClient';
import { getAuthToken } from './tokenService';
async function authenticated(path, options) {
  const token = await getAuthToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  return request(`${API_BASE_URL}/bots/api/${path}`, { ...options, token });
}
export const getDashboard = () => authenticated('dashboard/');
export const getAnalytics = () => authenticated('analytics/');
const knowledgePath = (botId) => `bots/${encodeURIComponent(botId)}/knowledge/`;
export const getKnowledge = (botId) => authenticated(knowledgePath(botId));
export const deleteKnowledge = (botId, id) => authenticated(`${knowledgePath(botId)}${encodeURIComponent(id)}/`, { method: 'DELETE' });
export function uploadKnowledge(botId, asset) {
  const body = new FormData();
  body.append('file', Platform.OS === 'web' ? asset.file : { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
  return authenticated(knowledgePath(botId), { method: 'POST', body, multipart: true, timeout: 180000 });
}
