import { useState } from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { clearAuthSession } from '../services/tokenService';
import { colors, radius, spacing } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await clearAuthSession();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>AI Assistant</Text>

          <Text style={styles.subtitle}>
            You are signed in.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              loggingOut && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text style={styles.buttonText}>
              {loggingOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: spacing.xxl,
  },

  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
});