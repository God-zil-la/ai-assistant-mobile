import { useEffect, useState } from 'react';
import { Linking, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getWidgetSettings, saveWidgetSettings, saveWidgetBranding, uploadWidgetBrandLogo, removeWidgetBrandLogo } from '../services/widgetService';
import { getAuthToken } from '../services/tokenService';
import { useTheme } from '../styles/theme';
import ActionButton from './ActionButton';

export default function WidgetSettings({ botId, disabled }) {
  const { colors, mode } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const [branding, setBranding] = useState(null);
  const [notice, setNotice] = useState('');
  const [logoAsset, setLogoAsset] = useState(null);
  useEffect(() => {
    let active = true;
    getAuthToken().then(token => getWidgetSettings(token, botId))
      .then(value => { if (active) { setData(value); setBranding(value.branding ?? null); setError(''); } })
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
  async function saveBranding() {
    if (!branding || busy || disabled || !data?.allowed) return;
    const fields = ['background_color', 'text_color', 'accent_color'];
    if (branding.company_name.length > 100) {
      setError('Company name must be at most 100 characters.');
      return;
    }
    if (fields.some(field => branding[field] && !/^#[0-9a-fA-F]{6}$/.test(branding[field]))) {
      setError('Colors must use #RRGGBB format.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const token = await getAuthToken();
      const updated = await saveWidgetBranding(token, botId, {
        company_name: branding.company_name,
        background_color: branding.background_color,
        text_color: branding.text_color,
        accent_color: branding.accent_color,
        hide_powered_by: branding.hide_powered_by,
      });
      setBranding(updated);
      setData(previous => ({ ...previous, branding: updated }));
      setNotice('Custom Branding saved.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const updateBranding = (key, value) =>
    setBranding(previous => ({ ...previous, [key]: value }));

  async function chooseLogo() {
    if (busy || disabled || !data?.allowed) return;
    setError(''); setNotice('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/webp'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset?.name) throw new Error('Invalid image selection.');
      if (!/\.(png|jpe?g|webp)$/i.test(asset.name)) {
        throw new Error('Choose a PNG, JPEG or WebP image.');
      }
      if (typeof asset.size !== 'number' || asset.size > 512 * 1024) {
        throw new Error('Logo must be no larger than 512 KB.');
      }
      setLogoAsset(asset);
    } catch (err) { setError(err.message || 'Unable to choose a logo.'); }
  }

  async function uploadLogo() {
    if (!logoAsset || busy || disabled || !data?.allowed) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const token = await getAuthToken();
      const updated = await uploadWidgetBrandLogo(token, botId, logoAsset);
      setBranding(updated);
      setData(previous => ({ ...previous, branding: updated }));
      setLogoAsset(null);
      setNotice('Company logo uploaded.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function removeLogo() {
    if (busy || disabled || !data?.allowed || !branding?.has_logo) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const token = await getAuthToken();
      const updated = await removeWidgetBrandLogo(token, botId);
      setBranding(updated);
      setData(previous => ({ ...previous, branding: updated }));
      setLogoAsset(null);
      setNotice('Company logo removed.');
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
    {data?.allowed && branding ? <View style={{ gap: 10, paddingTop: 16 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Custom Branding - Pro</Text>
      {[
        ['company_name', 'Company name', 'Your company'],
        ['background_color', 'Background color', '#FFFFFF'],
        ['text_color', 'Text color', '#111111'],
        ['accent_color', 'Accent color', '#FF5733'],
      ].map(([key, label, placeholder]) => <View key={key} style={{ gap: 5 }}>
        <Text style={{ color: colors.text }}>{label}</Text>
        <TextInput
          value={branding[key] ?? ''}
          onChangeText={value => updateBranding(key, value)}
          editable={!busy && !disabled}
          maxLength={key === 'company_name' ? 100 : 7}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          style={{ color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12 }}
        />
      </View>)}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: colors.text, flex: 1 }}>Hide Powered by AI Assistant</Text>
        <Switch
          value={!!branding.hide_powered_by}
          onValueChange={value => updateBranding('hide_powered_by', value)}
          disabled={busy || disabled}
          accessibilityLabel="Hide Powered by AI Assistant"
        />
      </View>
      <View style={{ gap: 8, paddingTop: 8 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Company logo</Text>
        <Text style={{ color: colors.textMuted }}>
          PNG, JPEG or WebP. Maximum 512 KB.
        </Text>
        <Text style={{ color: colors.textMuted }}>
          {branding.has_logo ? 'A company logo is uploaded.' : 'No company logo uploaded.'}
        </Text>
        <ActionButton
          title="Choose company logo"
          secondary
          onPress={chooseLogo}
          disabled={busy || disabled}
        />
        {logoAsset ? <>
          <Text style={{ color: colors.text }} numberOfLines={2}>
            Selected: {logoAsset.name}
          </Text>
          <ActionButton
            title="Upload company logo"
            onPress={uploadLogo}
            disabled={busy || disabled}
          />
        </> : null}
        {branding.has_logo ? (
          <ActionButton
            title="Remove company logo"
            secondary
            onPress={removeLogo}
            disabled={busy || disabled}
          />
        ) : null}
      </View>
      <ActionButton title="Save Custom Branding" onPress={saveBranding} disabled={busy || disabled} />
      {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{notice}</Text> : null}
    </View> : null}
    {error ? <><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>
      <ActionButton title="Refresh widget settings" secondary disabled={busy || disabled} onPress={() => { setBusy(true); setReload(value => value + 1); }} /></> : null}
  </View>;
}
