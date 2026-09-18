import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Panel from '../components/Panel';
import ActionButton from '../components/ActionButton';
import { getAnalytics } from '../services/parityService';
import { useTheme } from '../styles/theme';
function Chart({ title, data, color, dateLabels = false }) {
  const { colors } = useTheme();
  const maximum = Math.max(1, ...data.counts);
  return <Panel><Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{title}</Text>
    {!data.labels.length ? <Text style={{ color: colors.textMuted }}>No messages yet.</Text> :
      <ScrollView horizontal accessibilityLabel={title}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, padding: 8 }}>
          {data.labels.map((label, index) => <View key={`${label}-${index}`} accessible accessibilityLabel={`${label}: ${data.counts[index]} messages`} style={{ width: 96, gap: 8, alignItems: 'center' }}>
            <Text style={{ color: colors.text }}>{data.counts[index]}</Text>
            <View style={{ height: 200, width: 48, justifyContent: 'flex-end', borderBottomWidth: 1, borderColor: colors.border }}>
              <View style={{ height: 200 * data.counts[index] / maximum, backgroundColor: color, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
            </View>
            <Text numberOfLines={dateLabels ? 1 : undefined} adjustsFontSizeToFit={dateLabels} style={{ color: colors.text, textAlign: 'center', minHeight: 48, width: '100%' }}>{label}</Text>
          </View>)}
        </View>
      </ScrollView>}
    <Text style={{ color: colors.textMuted }}>Message Count: {data.counts.reduce((total, count) => total + count, 0)}</Text>
  </Panel>;
}
export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getAnalytics()); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}>
    <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>Analytics Dashboard</Text>
    <Text style={{ color: colors.textMuted }}>Insights into your AI assistants and conversations.</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <><Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text><ActionButton title="Retry analytics" onPress={load} disabled={loading} /></> : null}
    {data ? <><Chart title="Messages by Assistant" data={data.bot_data} color="rgba(240,165,0,0.85)" />
      <Chart title="Messages Over Time" data={data.time_data} color="rgba(54,162,235,0.85)" dateLabels /></> : null}
  </Screen>;
}
