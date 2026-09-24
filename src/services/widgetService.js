import { API_ENDPOINTS } from '../config/api.js';
import { request } from './apiClient.js';
const endpoint = (id) => `${API_ENDPOINTS.bots}${encodeURIComponent(id)}/widget/`;
export const getWidgetSettings = (token, id) => request(endpoint(id), { token });
export const saveWidgetSettings = (token, id, enabled) =>
  request(endpoint(id), { token, method: 'PATCH', body: { widget_enabled: enabled } });
