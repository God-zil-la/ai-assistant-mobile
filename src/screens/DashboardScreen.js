import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Panel from '../components/Panel';
import CompactGrid from '../components/CompactGrid';
import ActionButton from '../components/ActionButton';
import { getDashboard } from '../services/parityService';
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
  function billing() { navigation.navigate('Plans'); }
  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
    <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800' }}>Dashboard</Text>
    <Text style={{ color: colors.text, lineHeight: 24 }}>Manage your AI assistants, usage, knowledge, and subscription.</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text><ActionButton title="Retry dashboard" onPress={load} disabled={loading} /></> : null}
    {data ? <>
      <Panel><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>Current Plan</Text>
        <Text style={{ color: colors.text, fontSize: 18 }}>{data.current_plan.toUpperCase()}</Text></View>
        <Text style={{ color: colors.text, lineHeight: 20 }}>
          {data.bot_limit} AI assistants, {data.message_limit} AI messages per month, {data.knowledge_limit_display} Knowledge Base, and unlimited chats{data.current_plan === 'pro' ? ', plus Website Widget / Public Chatbot.' : '.'}
        </Text>
        <ActionButton title={data.current_plan === 'free' ? 'Upgrade Plan' : 'Manage Plan'} onPress={billing} />
        <Text style={{ color: colors.textMuted }}>Choose a plan, restore purchases or manage your current subscription.</Text>
      </Panel>
      <CompactGrid tabletColumns={4}>
        {[
          ['AI Messages', `${data.message_count} / ${data.message_limit} this month`],
          ['AI Assistants', `${data.bot_count} / ${data.bot_limit}`],
          ['Knowledge Base', `${data.knowledge_used_display} / ${data.knowledge_limit_display}`],
          ['Chats', 'Unlimited'],
          ['Website Widget', data.current_plan === 'pro' ? 'Available' : '?? Pro required'],
        ].map(([label, value]) => <Panel key={label}>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: colors.text }}>{value}</Text>
        </Panel>)}
      </CompactGrid>
    </> : null}
    <CompactGrid><ActionButton title="My AI Assistants" secondary onPress={() => navigation.navigate('Home')} />
    <ActionButton title="Analytics" secondary onPress={() => navigation.navigate('Analytics')} />
    <ActionButton title="Account settings" secondary onPress={() => navigation.navigate('Account')} />
    </CompactGrid>
  </Screen>;
}
