import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { API_BASE_URL } from '../config/api';
import { request } from './apiClient';
import { getAuthToken } from './tokenService';
import { requireAIConsent } from './aiConsent';
async function authenticated(path, options) {
  const token = await getAuthToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  if (options?.method === 'POST' && path.endsWith('/knowledge/')) await requireAIConsent(token);
  return request(`${API_BASE_URL}/bots/api/${path}`, { ...options, token });
}
export const getDashboard = () => authenticated('dashboard/');
export const getAnalytics = () => authenticated('analytics/');
const knowledgePath = (botId) => `bots/${encodeURIComponent(botId)}/knowledge/`;
export const getKnowledge = (botId) => authenticated(knowledgePath(botId), { expectedStatus: 200 });
export const deleteKnowledge = (botId, id) => authenticated(`${knowledgePath(botId)}${encodeURIComponent(id)}/`, { method: 'DELETE', expectedStatus: 204 });
export function uploadKnowledge(botId, asset) {
  const body = new FormData();
  if (Platform.OS === 'web') {
    body.append('file', asset.file);
  } else {
    const file = new File(asset.uri);
    body.append('file', file, asset.name);
  }
  return authenticated(knowledgePath(botId), { method: 'POST', body, multipart: true, timeout: 180000, expectedStatus: 201 });
}
