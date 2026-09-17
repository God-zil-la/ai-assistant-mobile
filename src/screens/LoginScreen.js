import { useState } from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import { loginUser } from '../services/authService';
import { saveAuthSession } from '../services/tokenService';
import { colors, radius, spacing } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(username.trim(), password);

      await saveAuthSession(data.token, data.username);

      navigation.replace('Home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>Sign In</Text>

          <Text style={styles.subtitle}>
            Sign in to your AI Assistant account.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSubtle}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

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
          </View>
        </View>

        <Text style={styles.footer}>AI Assistant</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
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
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  footer: {
    color: colors.textSubtle,
    fontSize: 13,
    textAlign: 'center',
  },
});