import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import Screen from '../components/Screen';
import Panel from '../components/Panel';
import ActionButton from '../components/ActionButton';
import { getKnowledge, uploadKnowledge, deleteKnowledge } from '../services/parityService';
import { confirmDelete } from '../utils/confirm';
import { useTheme } from '../styles/theme';

export default function KnowledgeScreen({ route }) {
  const bot = route.params?.bot;
  const { colors } = useTheme();
  const [files, setFiles] = useState([]);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [info, setInfo] = useState(false);
  const mutation = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const id = ++generation.current;
    setLoading(true); setError('');
    try {
      if (!bot?.id) throw new Error('Choose an assistant to manage its knowledge.');
      const data = await getKnowledge(bot.id);
      if (id === generation.current) { setFiles(data.files); setRecovery(false); }
    } catch (err) { if (id === generation.current) setError(err.message); }
    finally { if (id === generation.current) setLoading(false); }
  }, [bot]);
  useFocusEffect(useCallback(() => { load(); return () => { generation.current++; }; }, [load]));
  async function pick() {
    setError(''); setNotice('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true, multiple: false });
      if (!result.canceled) {
        const selected = result.assets[0];
        if (!/\.(txt|pdf|docx)$/i.test(selected.name)) throw new Error('Only .txt, .pdf, and .docx files are allowed.');
        setAsset(selected);
      }
    } catch (err) { setError(err.message || 'Unable to choose a document.'); }
  }
  async function upload() {
    if (!asset || mutation.current || recovery) return;
    mutation.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const row = await uploadKnowledge(bot.id, asset);
      generation.current++;
      setFiles(items => [row, ...items]); setAsset(null);
      setNotice('Knowledge uploaded and processed successfully!');
    } catch (err) {
      if (!err.status || err.status >= 500) {
        setRecovery(true);
        setError('Upload could not be confirmed. Refresh and check Uploaded Knowledge before trying again.');
      } else setError(err.message);
    } finally { mutation.current = false; setBusy(false); }
  }
  async function remove(item) {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(''); setNotice('');
    try {
      await deleteKnowledge(bot.id, item.id);
      generation.current++;
      setFiles(items => items.filter(row => row.id !== item.id));
      setNotice('Knowledge deleted successfully.');
    } catch (err) { setError(err.message); }
    finally { mutation.current = false; setBusy(false); }
  }
  const text = { color: colors.text, fontSize: 16, lineHeight: 25 };
  return <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { if (!busy) load(); }} tintColor={colors.primary} />}>
    <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>Knowledge for {bot?.name || 'Assistant'}</Text>
    <Text style={text}>Add documents your assistant can use when answering your questions.</Text>
    <ActionButton title="What is Knowledge?" secondary onPress={() => setInfo(true)} />
    {loading ? <ActivityIndicator color={colors.primary} /> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.success }}>{notice}</Text> : null}
    <Panel><Text style={{ ...text, fontSize: 22, fontWeight: '700' }}>Uploaded Knowledge</Text>
      {!loading && !files.length ? <Text style={text}>No uploaded knowledge yet.</Text> : null}
      {files.map(item => <View key={item.id} style={{ gap: 10, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 12 }}>
        <Text style={text}>{item.name}</Text>
        <ActionButton title="Delete" accessibilityLabel={`Delete ${item.name}`} destructive disabled={busy || loading}
          onPress={() => confirmDelete('Delete knowledge', `Delete "${item.name}" from this assistant?`, () => remove(item))} />
      </View>)}
      <ActionButton title="Refresh knowledge" secondary disabled={busy || loading} onPress={load} />
    </Panel>
    <Panel><Text style={text}>Upload File (.txt, .pdf, .docx)</Text>
      <ActionButton title="Choose document" secondary disabled={busy || loading} onPress={pick} />
      {asset ? <Text style={text}>{asset.name}</Text> : null}
      <ActionButton title={busy ? 'Processing…' : 'Upload Knowledge'} disabled={!asset || busy || loading || recovery} onPress={upload} />
    </Panel>
    <Modal visible={info} animationType="slide" onRequestClose={() => setInfo(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
          <Text style={{ ...text, fontSize: 26, fontWeight: '800' }}>What is Knowledge?</Text>
          <Text style={text}>Knowledge lets you teach your AI Assistant about your business, products, documents or anything else you want this bot to know.</Text>
          <Text style={text}>Upload a PDF, DOCX or TXT file. Your assistant reads the content and can use it to give more relevant answers.</Text>
          <Text style={{ ...text, fontWeight: '700' }}>Simple example</Text>
          <Text style={text}>Upload your products, prices, delivery information, return policy and frequently asked questions. Then ask “How long does delivery take?” Your assistant can use your document to answer.</Text>
          <Text style={text}>You can upload FAQs, instructions, manuals, company information, policies, guides, notes and reference material.</Text>
          <Text style={text}>Each bot can know different things. Uploading or deleting knowledge from this bot does not change knowledge used by your other bots. You can add or delete documents whenever you want.</Text>
          <Text style={text}>Only upload information you have permission to use. Do not upload passwords, API keys, access tokens, payment details or other secrets.</Text>
          <ActionButton title="Got it" onPress={() => setInfo(false)} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </Screen>;
}
