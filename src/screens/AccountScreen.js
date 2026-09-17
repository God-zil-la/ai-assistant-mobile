import { useCallback, useState } from 'react';
import { AppState, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import ActionButton from '../components/ActionButton';
import { getCurrentUser } from '../services/authService';
import { getAuthToken, clearAuthSession } from '../services/tokenService';
import { openAccountLink } from '../services/externalLinks';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function AccountScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [user, setUser] = useState(route.params?.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Please sign in again.');
      setUser(await getCurrentUser(token));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => subscription.remove();
  }, [refresh]));
  async function open(key) {
    setError('');
    try { await openAccountLink(key); } catch (err) { setError(err.message); }
  }
  async function signOut() {
    setLeaving(true);
    try {
      await clearAuthSession();
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch { setError('Unable to sign out. Please try again.'); }
    finally { setLeaving(false); }
  }
  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}>
      <Text style={styles.title}>Account & Help</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text><Text selectable style={styles.value}>{user?.username || '—'}</Text>
        <Text style={styles.label}>Email</Text><Text selectable style={styles.value}>{user?.email || '—'}</Text>
        <Text style={styles.label}>Current plan</Text><Text style={styles.plan}>{user?.plan?.toUpperCase() || 'Unavailable'}</Text>
        <Text style={styles.body}>Your account, assistants and conversations are shared with AI Assistant on the web.</Text>
        <ActionButton title={loading ? 'Refreshing…' : 'Refresh account'} secondary disabled={loading} onPress={refresh} />
      </View>
      <ActionButton title="Manage plan on website" secondary onPress={() => open('billing')} />
      <Text style={styles.body}>Plan management opens our secure website. Sign in there to continue.</Text>
      <ActionButton title="Information Guide (PDF)" secondary onPress={() => open('guide')} />
      <ActionButton title="Resend verification email" secondary onPress={() => open('verification')} />
      <Text style={styles.heading}>Privacy & Support</Text>
      <ActionButton title="Privacy policy" secondary onPress={() => open('privacy')} />
      <ActionButton title="Contact support" secondary onPress={() => open('support')} />
      <Text selectable style={styles.body}>support@myaiassistantapp.se</Text>
      <ActionButton title="Reset password" secondary onPress={() => open('passwordReset')} />
      <Text style={styles.body}>Password recovery opens our secure website in your browser.</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Delete account</Text>
        <Text style={styles.body}>Permanently delete your account and application data using our secure website. You will need to sign in there and confirm with your password. Opening the page does not delete anything.</Text>
        <ActionButton title="Continue to account deletion" destructive onPress={() => open('deleteAccount')} />
        <Text style={styles.body}>After deleting your account, return here and sign out. The app also checks your session when you return.</Text>
      </View>
      <ActionButton title={leaving ? 'Signing out…' : 'Sign out'} disabled={leaving} onPress={signOut} />
    </Screen>
  );
}
const makeStyles = (colors) => StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700' },
  card: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1, gap: spacing.md },
  label: { color: colors.textMuted, fontSize: 13 }, value: { color: colors.text, fontSize: 17 },
  plan: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  body: { color: colors.textMuted, lineHeight: 22 }, error: { color: colors.error, lineHeight: 22 },
});
