import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/api';

export const accountLinks = {
  billing: `${API_BASE_URL}/payments/`,
  plans: `${API_BASE_URL}/#pricing`,
  guide: `${API_BASE_URL}/static/pdf/ai_assistant_setup_guide_v2.pdf`,
  deleteInformation: `${API_BASE_URL}/delete-account/`,
  privacy: `${API_BASE_URL}/privacy/`,
  passwordReset: `${API_BASE_URL}/accounts/password-reset/`,
  verification: `${API_BASE_URL}/accounts/resend-verification/`,
  deleteAccount: `${API_BASE_URL}/accounts/delete/`,
  support: 'mailto:support@myaiassistantapp.se',
};

export async function openAccountLink(key) {
  try {
    await Linking.openURL(accountLinks[key]);
  } catch {
    throw new Error(key === 'support'
      ? 'No email app is available. Email support@myaiassistantapp.se for help.'
      : 'Unable to open the browser. Please try again.');
  }
}

export async function openDiscordSetup(botId) {
  try { await Linking.openURL(`${API_BASE_URL}/bots/${encodeURIComponent(botId)}/discord/setup/`); }
  catch { throw new Error('Unable to open Discord setup in your browser.'); }
}
