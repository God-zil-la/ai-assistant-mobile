import { API_BASE_URL } from '../config/api';
import { request } from './apiClient';
const accountUrl = `${API_BASE_URL}/accounts/api/u5/api-access/`;
const discordUrl = (id) => `${API_BASE_URL}/bots/api/u5/bots/${encodeURIComponent(id)}/discord/`;
export const getApiAccess = (token) => request(accountUrl, { token });
export const updateApiAccess = (token, action) => request(accountUrl, { token, method: 'POST', body: { action } });
export const getDiscord = (token, id) => request(discordUrl(id), { token });
export const createDiscordBridge = (token, id, discord_token) => request(discordUrl(id), { token, method: 'POST', body: { discord_token }, timeout: 60000 });
export const revokeDiscord = (token, id, integrationId) => request(`${discordUrl(id)}${encodeURIComponent(integrationId)}/revoke/`, { token, method: 'POST', body: {} });
