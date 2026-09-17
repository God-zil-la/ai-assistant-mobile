import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, radius, spacing } from '../styles/theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <Text style={styles.logo}>AI</Text>

          <Text style={styles.title}>AI Assistant</Text>

          <Text style={styles.subtitle}>
            Your intelligent assistants, wherever you are.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>

          <Text style={styles.cardText}>
            Sign in to access your assistants, chats and knowledge base.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },

  brand: {
    alignItems: 'center',
    marginTop: 50,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.primary,
    color: colors.primaryText,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 20,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },

  cardText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    color: colors.textSubtle,
    fontSize: 13,
    textAlign: 'center',
  },
});