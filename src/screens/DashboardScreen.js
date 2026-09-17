import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Panel from '../components/Panel';
import ActionButton from '../components/ActionButton';
import { getDashboard } from '../services/parityService';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';
export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getDashboard()); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function billing() { try { await openAccountLink('billing'); } catch (err) { setError(err.message); } }
  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
    <Text style={{ color: colors.primary, fontSize: 30, fontWeight: '800' }}>Dashboard</Text>
    <Text style={{ color: colors.text, lineHeight: 24 }}>Manage your AI assistants, usage, knowledge, and subscription.</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text><ActionButton title="Retry dashboard" onPress={load} disabled={loading} /></> : null}
    {data ? <>
      <Panel><Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>Current Plan</Text>
        <Text style={{ color: colors.text, fontSize: 20 }}>{data.current_plan.toUpperCase()}</Text>
        <Text style={{ color: colors.text, lineHeight: 24 }}>{data.bot_limit} AI assistants, {data.message_limit} AI messages per month, {data.knowledge_limit_display} Knowledge Base, and unlimited chats.</Text>
        <ActionButton title={data.current_plan === 'free' ? 'Upgrade Plan' : 'Manage Plan'} onPress={billing} />
        <Text style={{ color: colors.textMuted }}>Plan management opens the website. Sign in there to continue.</Text>
      </Panel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {[
          ['AI Messages', `${data.message_count} / ${data.message_limit} this month`],
          ['AI Assistants', `${data.bot_count} / ${data.bot_limit}`],
          ['Knowledge Base', `${data.knowledge_used_display} / ${data.knowledge_limit_display}`],
          ['Chats', 'Unlimited'],
        ].map(([label, value]) => <Panel key={label} style={{ flexGrow: 1, flexBasis: 220 }}>
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: colors.text }}>{value}</Text>
        </Panel>)}
      </View>
    </> : null}
    <ActionButton title="My AI Assistants" secondary onPress={() => navigation.navigate('Home')} />
    <ActionButton title="Analytics" secondary onPress={() => navigation.navigate('Analytics')} />
    <ActionButton title="Account settings" secondary onPress={() => navigation.navigate('Account')} />
  </Screen>;
}
