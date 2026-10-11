import { API_ENDPOINTS } from '../config/api.js';
import { request } from './apiClient.js';
const endpoint = (id) => `${API_ENDPOINTS.bots}${encodeURIComponent(id)}/widget/`;
export const getWidgetSettings = (token, id) => request(endpoint(id), { token });
export const saveWidgetSettings = (token, id, enabled) =>
  request(endpoint(id), { token, method: 'PATCH', body: { widget_enabled: enabled } });

const brandingEndpoint = (id) => `${endpoint(id)}branding/`;

export const saveWidgetBranding = (token, id, branding) =>
  request(brandingEndpoint(id), {
    token,
    method: 'PATCH',
    body: branding,
  });

export const uploadWidgetBrandLogo = async (token, id, asset) => {
  const body = new FormData();
  if (asset.file) {
    body.append('logo', asset.file);
  } else {
    const { File } = await import('expo-file-system');
    const file = new File(asset.uri);
    body.append('logo', file, asset.name);
  }
  return request(`${brandingEndpoint(id)}logo/`, {
    token,
    method: 'POST',
    body,
    multipart: true,
  });
};

export const removeWidgetBrandLogo = (token, id) =>
  request(`${brandingEndpoint(id)}logo/`, {
    token,
    method: 'DELETE',
  });
