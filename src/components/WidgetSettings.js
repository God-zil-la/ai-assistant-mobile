import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { getWidgetSettings, saveWidgetSettings } from '../services/widgetService';
import { getAuthToken } from '../services/tokenService';
import { useTheme } from '../styles/theme';
import ActionButton from './ActionButton';

export default function WidgetSettings({ botId, disabled }) {
  const { colors, mode } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    getAuthToken().then(token => getWidgetSettings(token, botId))
      .then(value => { if (active) { setData(value); setError(''); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [botId, reload]);
  async function toggle() {
    setBusy(true); setError('');
    try {
      const token = await getAuthToken();
      setData(await saveWidgetSettings(token, botId, !data.widget_enabled));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const themedPublicUrl = data?.public_url
    ? `${data.public_url}${data.public_url.includes('?') ? '&' : '?'}theme=${mode}`
    : '';

  const themedEmbedCode = data?.embed_code && data?.public_url
    ? data.embed_code.replace(data.public_url, themedPublicUrl)
    : '';

  async function open() {
    try { await Linking.openURL(themedPublicUrl); }
    catch { setError('Unable to open the public chatbot.'); }
  }

  return <View style={{ paddingVertical: 16, gap: 10 }}>
    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Website Widget / Public Chatbot</Text>
    <Text style={{ color: colors.textMuted }}>Pro only. Visitors use your assistant’s instructions and Knowledge. Their chats appear in Conversations and count toward your AI usage limits. Enable only for content you want to make public.</Text>
    {data ? <>
      <Text style={{ color: colors.text }}>{data.active ? 'Active' : 'Inactive'}{!data.allowed ? ' — Pro is required to activate.' : ''}</Text>
      <ActionButton title={data.widget_enabled ? 'Disable widget' : 'Enable widget'} onPress={toggle}
        disabled={busy || disabled || (!data.allowed && !data.widget_enabled)} />
      {data.active ? <>
        <ActionButton title="Open public chatbot" secondary onPress={open} disabled={busy || disabled} />
        <Text style={{ color: colors.textMuted }}>Public link (select to copy)</Text>
        <Text selectable style={{ color: colors.text }}>{themedPublicUrl}</Text>
        <Text style={{ color: colors.textMuted }}>Website embed code (select to copy)</Text>
        <Text selectable style={{ color: colors.text }}>{themedEmbedCode}</Text>
      </> : null}
    </> : busy ? <Text style={{ color: colors.textMuted }}>Loading widget settings…</Text> : null}
    {error ? <><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>
      <ActionButton title="Refresh widget settings" secondary disabled={busy || disabled} onPress={() => { setBusy(true); setReload(value => value + 1); }} /></> : null}
  </View>;
}
