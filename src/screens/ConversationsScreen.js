import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ActionButton from '../components/ActionButton';
import { createConversation, deleteConversation, getConversations } from '../services/conversationService';
import { getAuthToken } from '../services/tokenService';
import { confirmDelete } from '../utils/confirm';
import { filterConversations, formatDate } from '../utils/conversations';
import { colors, radius, spacing } from '../styles/theme';

export default function ConversationsScreen({ navigation, route }) {
  const bot = route.params?.bot;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const mutation = useRef(false);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Your session has expired.');
      const data = await getConversations(token);
      if (id === requestId.current) setConversations(Array.isArray(data) ? data : []);
    } catch (err) { if (id === requestId.current) setError(err.message); }
    finally { if (id === requestId.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]));
  async function create() {
    if (!bot?.id || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Your session has expired.');
      const item = await createConversation(token, bot.id);
      navigation.navigate('Chat', { bot, conversationId: item.conversation_id });
    } catch (err) { setError(err.message + ' Refresh the list before trying again.'); }
    finally { mutation.current = false; setBusy(false); }
  }
  async function remove(item) {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Your session has expired.');
      await deleteConversation(token, item.conversation_id);
      setConversations((items) => items.filter((row) => row.conversation_id !== item.conversation_id));
    } catch (err) { setError(err.message); }
    finally { mutation.current = false; setBusy(false); }
  }
  const visible = filterConversations(conversations, query, bot?.id);
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <FlatList data={visible} keyExtractor={(item) => item.conversation_id}
        contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={<View style={styles.header}>
          <Text style={styles.title}>{bot?.name || 'All conversations'}</Text>
          <Text style={styles.muted}>Continue a chat, or find it by title or assistant name.</Text>
          {bot ? <ActionButton title={busy ? 'Please wait…' : '+ New conversation'} disabled={busy || loading} onPress={create} /> : null}
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search conversations"
            placeholderTextColor={colors.textMuted} accessibilityLabel="Search conversations" autoCorrect={false} />
          {error ? <><Text style={styles.error} accessibilityRole="alert">{error}</Text><ActionButton title="Refresh conversations" secondary disabled={loading || busy} onPress={load} /></> : null}
          {loading && !conversations.length ? <ActivityIndicator color={colors.primary} /> : null}
        </View>}
        ListEmptyComponent={!loading && !error ? <Text style={styles.muted}>{query ? 'No matching conversations.' : bot ? 'Start your first conversation with this assistant.' : 'Your conversations will appear here.'}</Text> : null}
        renderItem={({ item }) => <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.title || 'Untitled conversation'}</Text>
          <Text style={styles.muted}>{item.bot_name} · {item.message_count} messages</Text>
          <Text style={styles.date}>{formatDate(item.updated_at)}</Text>
          <ActionButton title="Open conversation" secondary disabled={busy} onPress={() => navigation.navigate('Chat', {
            bot: { id: item.bot_id, name: item.bot_name }, conversationId: item.conversation_id,
          })} accessibilityLabel={`Open ${item.title || 'untitled conversation'}`} />
          <ActionButton title="Delete" destructive disabled={busy} onPress={() => confirmDelete('Delete conversation',
            `Delete "${item.title || 'Untitled conversation'}" and its messages? This cannot be undone.`, () => remove(item))} />
        </View>} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, width: '100%', maxWidth: 760, alignSelf: 'center', flexGrow: 1 },
  header: { gap: spacing.lg, marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  muted: { color: colors.textMuted, lineHeight: 22 }, date: { color: colors.textMuted, fontSize: 12 },
  input: { color: colors.text, fontSize: 16, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.surfaceBorder },
  error: { color: colors.error, lineHeight: 22 },
  card: { gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
