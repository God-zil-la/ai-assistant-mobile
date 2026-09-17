import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Panel from '../components/Panel';
import Footer from '../components/Footer';
import ThemeControl from '../components/ThemeControl';
import ActionButton from '../components/ActionButton';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';
export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24, width: '100%', maxWidth: 800, alignSelf: 'center' }}>
      <ThemeControl />
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>AI Assistant</Text>
      <Panel><Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>Powerful AI assistants. Simple pricing.</Text>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>Create AI assistants for your personal projects, studies, documents, customer support, or business. Add your own knowledge, keep your conversations organized, and start chatting in minutes.</Text>
        <ActionButton title="Sign In" onPress={() => navigation.navigate('Login')} />
        <ActionButton title="Create Account" secondary onPress={() => navigation.navigate('Register')} />
      </Panel>
      {[
        ['Create your own AI assistants', 'Build personalized AI assistants for work, studies, hobbies, customer support, or your business.'],
        ['Add your own knowledge', 'Upload documents so your assistants can answer using knowledge that matters to you.'],
        ['Keep unlimited conversations', 'Start separate conversations and return to your chat history whenever you need it.'],
        ['Understand your AI usage', 'View usage and conversation analytics to understand how your assistants are being used.'],
      ].map(([title, description]) => <Panel key={title}><Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>{title}</Text><Text style={{ color: colors.text, lineHeight: 24 }}>{description}</Text></Panel>)}
      <ActionButton title="Plans & Pricing" secondary onPress={async () => { try { await openAccountLink('plans'); } catch (err) { setError(err.message); } }} />
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
      <Footer />
    </ScrollView>
  </SafeAreaView>;
}
