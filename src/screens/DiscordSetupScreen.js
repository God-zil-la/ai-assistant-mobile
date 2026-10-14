import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ActionButton from '../components/ActionButton';
import Screen from '../components/Screen';
import { useTheme } from '../styles/theme';
import { getAuthToken } from '../services/tokenService';
import { getDiscord, createDiscordBridge, revokeDiscord } from '../services/u5Service';

export default function DiscordSetupScreen({ route, navigation }) {
  const bot = route.params?.bot;
  const { colors } = useTheme();
  const [isPro, setIsPro] = useState(false);
  const [items, setItems] = useState([]);
  const [discordToken, setDiscordToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { if (!bot?.id) return; try { const token = await getAuthToken(); const data = await getDiscord(token, bot.id); setItems(data.integrations || []); setIsPro(data.is_pro); } catch (e) { setError(e.message); } }, [bot?.id]);
  useEffect(() => { load(); }, [load]);
  async function create() {
    if (!discordToken.trim()) return setError('Enter your Discord bot token.');
    setBusy(true); setError('');
    let path;
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
      const token = await getAuthToken();
      const data = await createDiscordBridge(token, bot.id, discordToken.trim());
      setDiscordToken('');
      path = `${FileSystem.cacheDirectory}discord_bridge_${bot.id}_${data.integration_id}.zip`;
      await FileSystem.writeAsStringAsync(path, data.zip_base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(path, { mimeType: 'application/zip', dialogTitle: 'Save Discord bridge', UTI: 'public.zip-archive' });
      await load();
    } catch (e) { setError(e.message || 'Unable to create Discord bridge. If the server created an integration, revoke it before retrying.'); await load(); }
    finally { if (path) await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {}); setBusy(false); }
  }
  function confirmRevoke(id) { Alert.alert('Revoke Discord integration?', 'The bridge using this credential will stop working.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Revoke', style: 'destructive', onPress: async () => { setBusy(true); try { await revokeDiscord(await getAuthToken(), bot.id, id); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } } }]); }
  if (!bot?.id) return <Screen><Text style={{ color: colors.error }}>Assistant not found.</Text></Screen>;
  return <Screen><ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: colors.text, fontSize: 23, fontWeight: '800' }}>Discord Setup · {bot.name}</Text>
    <Text style={{ color: colors.textMuted }}>1. Create a Discord application and bot. Enable Message Content Intent. Grant only View Channels and Send Messages (plus Threads if needed). Never grant Administrator.</Text>
    <ActionButton title="Open Discord Developer Portal" secondary onPress={() => Linking.openURL('https://discord.com/developers/applications')} />
    <Text style={{ color: colors.textMuted }}>2. Paste your Discord bot token below. Your private ZIP will contain credentials: keep it secure. Bot ID: {bot.id}</Text>
    {!isPro && <ActionButton title="View Pro plan" onPress={() => navigation.navigate('Plans')} />}
    {isPro && <><TextInput value={discordToken} onChangeText={setDiscordToken} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Discord bot token" placeholderTextColor={colors.textMuted} style={{ color: colors.text, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 12, borderRadius: 8 }} />
      <ActionButton title={busy ? 'Preparing...' : 'Create and share Discord bridge ZIP'} disabled={busy} onPress={() => Alert.alert('Create private bridge?', 'The ZIP contains secret credentials. Store it privately.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Create', onPress: create }])} /></>}
    <Text style={{ color: colors.text, fontWeight: '800' }}>Active integrations</Text>
    {!items.length && <Text style={{ color: colors.textMuted }}>No active integrations.</Text>}
    {items.map((item) => <View key={item.id} style={{ gap: 8 }}><Text style={{ color: colors.text }}>Integration {item.id} · {new Date(item.created_at).toLocaleDateString()}</Text><ActionButton title="Revoke integration" destructive disabled={busy} onPress={() => confirmRevoke(item.id)} /></View>)}
    <Text style={{ color: colors.textMuted }}>3. Extract the ZIP on a computer/server and follow README.txt. Keep .env private. Discord chat requires an active Pro subscription.</Text>
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
  </ScrollView></Screen>;
}
