import { useState } from 'react';
import { Text, View } from 'react-native';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';
import ActionButton from './ActionButton';
import CompactGrid from './CompactGrid';
export default function Footer() {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  async function open(key) { try { await openAccountLink(key); setError(''); } catch (err) { setError(err.message); } }
  return <View style={{ marginTop: 12, paddingTop: 12, gap: 8, borderTopWidth: 1, borderColor: colors.primary }}>
    <CompactGrid>
    <ActionButton title="Contact support" secondary onPress={() => open('support')} />
    <ActionButton title="Privacy Policy" secondary onPress={() => open('privacy')} />
    <ActionButton title="Delete account information" secondary onPress={() => open('deleteInformation')} />
    </CompactGrid>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12 }}>© {new Date().getFullYear()} AI Assistant. All rights reserved.</Text>
  </View>;
}
