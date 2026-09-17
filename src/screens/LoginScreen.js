import ActionButton from '../components/ActionButton';
import { openAccountLink } from '../services/externalLinks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getCurrentUser,
  loginUser,
} from '../services/authService';
import { saveAuthSession } from '../services/tokenService';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openHelp(key) {
    try { await openAccountLink(key); } catch (err) { setError(err.message); }
  }

  async function handleLogin() {
    if (loading) return;
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(
        username.trim(),
        password,
      );

      await saveAuthSession(
        data.token,
        data.username,
      );

      const user = await getCurrentUser(data.token);

      navigation.reset({ index: 0, routes: [{ name: 'Home', params: { user } }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={[styles.container, { flex: undefined, flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>

          <Text style={styles.subtitle}>
            Sign in to your AI Assistant account.
          </Text>

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <ActionButton title="Forgot password?" secondary onPress={() => openHelp('passwordReset')} />
            <ActionButton title="Resend verification email" secondary onPress={() => openHelp('verification')} />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    width: '100%',
    maxWidth: 420,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },

  input: {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: spacing.md,
  },

  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.md,
  },

  button: {
    width: '100%',
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});