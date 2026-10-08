import { useState } from 'react';
import { Text, View } from 'react-native';
import ActionButton from './ActionButton';
import { revokeAIConsent } from '../services/aiConsent';
import { AI_CONSENT_DISCLOSURE } from '../services/aiConsentCore';
import { useTheme } from '../styles/theme';

export default function AIConsentControl() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function revoke() {
    setBusy(true);
    try {
      await revokeAIConsent();
      setNotice('Permission withdrawn on this device. Your next chat or upload will ask again. Requests already sent may finish. Previously shared data is not erased.');
    } catch { setNotice('Unable to save your choice. Please try again before using chat or uploading.'); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 12 }}>
    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>OpenAI data sharing</Text>
    <Text style={{ color: colors.textMuted, lineHeight: 22 }}>{AI_CONSENT_DISCLOSURE}</Text>
    <ActionButton title="Withdraw OpenAI permission" secondary disabled={busy} onPress={revoke} />
    {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{notice}</Text> : null}
  </View>;
}
