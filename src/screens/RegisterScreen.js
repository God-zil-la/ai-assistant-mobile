import { useHeaderHeight } from '@react-navigation/elements';
import ActionButton from '../components/ActionButton';
import { openAccountLink } from '../services/externalLinks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { registerUser } from '../services/authService';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function openHelp(key) {
    try { await openAccountLink(key); } catch (err) { setError(err.message); }
  }

  async function handleRegister() {
    if (loading || success) return;
    setError('');
    setSuccess('');

    if (!username.trim() || !email.trim() || !password || !password2) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
        password2,
      });

      setSuccess(
        data.message ||
          'Account created. Please check your email to verify your account.'
      );

      setPassword('');
      setPassword2('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
      <ScrollView
        contentContainerStyle={[styles.container, { width: '100%', maxWidth: 760, alignSelf: 'center' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Create your AI Assistant account.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>

            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <Text style={styles.label}>Confirm Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password2}
              onChangeText={setPassword2}
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {success ? <Text style={styles.success}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading || !!success}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : success ? 'Check your email' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <ActionButton title="Privacy policy" secondary onPress={() => openHelp('privacy')} />
              {success ? <>
                <ActionButton title="Continue to sign in" onPress={() => navigation.replace('Login')} />
                <ActionButton title="Resend verification email" secondary onPress={() => openHelp('verification')} />
              </> : null}
            </View>
          </View>
        </View>

        <Text style={styles.footer}>AI Assistant</Text>
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
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
  },

  form: {
    marginTop: spacing.xxl,
  },

  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },

  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.md,
  },

  success: {
    color: colors.success,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  button: {
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

  footer: {
    color: colors.textSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});