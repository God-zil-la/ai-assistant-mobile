import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import ActionButton from './ActionButton';
import { reportAssistantResponse } from '../services/chatService';
import { getAuthToken } from '../services/tokenService';
import { useTheme } from '../styles/theme';

export default function ReportResponseButton({ conversationId, messageId }) {
  const { colors } = useTheme();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (pending.current || reported) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      await reportAssistantResponse(token, conversationId, messageId);
      setReported(true);
    } catch (err) {
      setError(err.message + (err.retryAfter ? ` Try again in ${err.retryAfter} seconds.` : ' You can retry reporting this response.'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function confirm() {
    Alert.alert(
      'Report AI response?',
      'Flag this response as offensive or unsafe. A copy of this response will be sent to the developers for review.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Report', onPress: submit }],
      { cancelable: true },
    );
  }

  return (
    <View>
      <ActionButton
        title={reported ? 'Response reported' : busy ? 'Reporting...' : 'Report response'}
        secondary
        disabled={busy || reported}
        onPress={confirm}
      />
      {reported ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>Thank you. Your report was received for review.</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    </View>
  );
}
