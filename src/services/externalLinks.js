import { Linking, Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';

export const canOpenPurchaseLinks = Platform.OS === 'web';

export const accountLinks = {
  appleSubscriptions: 'https://apps.apple.com/account/subscriptions',
  googleSubscriptions: 'https://play.google.com/store/account/subscriptions?package=com.mrhusse.aiassistant',
  website: 'https://www.myaiassistantapp.se',
  billing: `${API_BASE_URL}/payments/`,
  plans: `${API_BASE_URL}/#pricing`,
  guide: `${API_BASE_URL}/static/pdf/ai_assistant_setup_guide_v2.pdf`,
  deleteInformation: `${API_BASE_URL}/delete-account/`,
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacy: `${API_BASE_URL}/privacy/`,
  passwordReset: `${API_BASE_URL}/accounts/password-reset/`,
  verification: `${API_BASE_URL}/accounts/resend-verification/`,
  deleteAccount: `${API_BASE_URL}/accounts/delete/`,
  support: 'mailto:support@myaiassistantapp.se',
};

export async function openAccountLink(key) {
  if (!canOpenPurchaseLinks && ['billing', 'plans', 'website'].includes(key)) {
    throw new Error('Use Plans in the app to manage store purchases. Contact support for website billing help.');
  }
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
