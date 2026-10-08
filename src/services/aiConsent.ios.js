import { Alert, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getAuthToken } from './tokenService';
import { openAccountLink } from './externalLinks';
import { AI_CONSENT_DISCLOSURE, createConsentGate } from './aiConsentCore';

const key = 'ios_openai_consent';
const gate = createConsentGate({
  read: () => SecureStore.getItemAsync(key),
  write: value => SecureStore.setItemAsync(key, value),
  currentToken: getAuthToken,
  active: () => AppState.currentState === 'active',
  ask: () => new Promise(resolve => {
    Alert.alert('Share content with OpenAI?', AI_CONSENT_DISCLOSURE, [
      { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Privacy policy', onPress: () => {
        resolve(false);
        openAccountLink('privacy').catch(error => Alert.alert('Privacy policy', error.message));
      } },
      { text: 'Allow sharing', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  }),
});

export const requireAIConsent = token => gate.require(token);
export const revokeAIConsent = () => gate.revoke();
