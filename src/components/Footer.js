import { useState } from 'react';
import { Text, View } from 'react-native';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';
import ActionButton from './ActionButton';
export default function Footer() {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  async function open(key) { try { await openAccountLink(key); setError(''); } catch (err) { setError(err.message); } }
  return <View style={{ marginTop: 24, paddingTop: 20, gap: 10, borderTopWidth: 1, borderColor: colors.primary }}>
    <ActionButton title="Contact support" secondary onPress={() => open('support')} />
    <ActionButton title="Privacy Policy" secondary onPress={() => open('privacy')} />
    <ActionButton title="Delete account information" secondary onPress={() => open('deleteInformation')} />
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    <Text style={{ color: colors.textMuted, textAlign: 'center' }}>© {new Date().getFullYear()} AI Assistant. All rights reserved.</Text>
  </View>;
}
