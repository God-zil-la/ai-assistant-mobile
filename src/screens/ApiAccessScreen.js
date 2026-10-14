import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ActionButton from '../components/ActionButton';
import Screen from '../components/Screen';
import { useTheme } from '../styles/theme';
import { getAuthToken } from '../services/tokenService';
import { getApiAccess, updateApiAccess } from '../services/u5Service';

export default function ApiAccessScreen({ navigation }) {
  const { colors } = useTheme();
  const [isPro, setIsPro] = useState(false);
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; getAuthToken().then(getApiAccess).then((data) => { if (active) setIsPro(data.is_pro); }).catch((e) => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  async function act(action) {
    setBusy(true); setError(''); setSecret('');
    try { const token = await getAuthToken(); const data = await updateApiAccess(token, action); if (data.key) setSecret(data.key); else Alert.alert('API Access', data.message); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function confirm(action) { Alert.alert(action === 'rotate' ? 'Replace API key?' : 'Revoke API key?', 'Existing credentials will stop working immediately.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', style: 'destructive', onPress: () => act(action) }]); }
  return <Screen><ScrollView contentContainerStyle={{ gap: 16 }}>
    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>API Access</Text>
    <Text style={{ color: colors.textMuted }}>API keys provide programmatic access. A new key is shown only once.</Text>
    {!isPro && <ActionButton title="View Pro plan" onPress={() => navigation.navigate('Plans')} />}
    {isPro && <ActionButton title="Create / Rotate API key" disabled={busy} onPress={() => confirm('rotate')} />}
    <ActionButton title="Revoke API key" destructive disabled={busy} onPress={() => confirm('revoke')} />
    {!!secret && <View style={{ gap: 10 }}><Text style={{ color: colors.text, fontWeight: '700' }}>Save this key now. It will not appear again.</Text><Text selectable style={{ color: colors.text }}>{secret}</Text><ActionButton title="Copy key" onPress={() => Clipboard.setStringAsync(secret)} /><ActionButton title="Hide key" secondary onPress={() => setSecret('')} /></View>}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
  </ScrollView></Screen>;
}
