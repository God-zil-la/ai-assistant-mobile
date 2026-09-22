import ThemeControl from '../components/ThemeControl';
import { assistantIcon } from '../config/assistantPreferences';
import Footer from '../components/Footer';
import { openAccountLink, openDiscordSetup } from '../services/externalLinks';
import { useFocusEffect } from '@react-navigation/native';
import ActionButton from '../components/ActionButton';
import { getCurrentUser } from '../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getBots } from '../services/botService';
import {
  clearAuthSession,
  getAuthToken,
} from '../services/tokenService';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function HomeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bots, setBots] = useState([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [botsError, setBotsError] = useState('');

  const [user, setUser] = useState(route.params?.user);

  const loadBots = useCallback(async () => {
    setLoadingBots(true);
    setBotsError('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Your session has expired.');
      }

      const [data, profile] = await Promise.all([getBots(token), getCurrentUser(token)]);
      setUser(profile);

      setBots(Array.isArray(data) ? data : []);
    } catch (err) {
      setBotsError(
        err.message || 'Unable to load your assistants.',
      );
    } finally {
      setLoadingBots(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadBots();
  }, [loadBots]));

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await clearAuthSession();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch {
      setBotsError('Unable to sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  function handleCreateAssistant() {
    navigation.navigate('CreateBot');
  }

  function handleEditAssistant(bot) {
    navigation.navigate('EditBot', {
      bot,
    });
  }

  function handleOpenConversations(bot) {
    navigation.navigate('Conversations', {
      bot,
    });
  }

  async function openLink(key, botId) { try { if (botId) await openDiscordSetup(botId); else await openAccountLink(key); } catch (err) { setBotsError(err.message); } }
  const planName = user?.plan?.toUpperCase() || 'Unavailable';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loadingBots} onRefresh={loadBots} tintColor={colors.primary} />}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            AI Assistant
          </Text>

          <Text style={styles.subtitle}>
            Signed in as {user?.username || 'User'}
          </Text>

          <ThemeControl />
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>
              Email
            </Text>

            <Text style={styles.profileValue}>
              {user?.email || '—'}
            </Text>

            <Text style={styles.profileLabel}>
              Plan
            </Text>

            <Text style={styles.planText}>
              {planName}
            </Text>
          </View>

          <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            <ActionButton title="Dashboard" secondary onPress={() => navigation.navigate('Dashboard')} />
            <ActionButton title="Analytics" secondary onPress={() => navigation.navigate('Analytics')} />
            <ActionButton title="Information Guide (PDF)" secondary onPress={() => openLink('guide')} />
            <ActionButton title="All conversations" secondary onPress={() => navigation.navigate('Conversations')} />
            <ActionButton title="Account & Help" secondary onPress={() => navigation.navigate('Account', { user })} />
          </View>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                My Assistants
              </Text>

              {!loadingBots && !botsError ? (
                <Text style={styles.botCountText}>
                  {bots.length}{' '}
                  {bots.length === 1
                    ? 'assistant'
                    : 'assistants'}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={handleCreateAssistant}
            >
              <Text style={styles.createButtonText}>
                + Create
              </Text>
            </TouchableOpacity>
          </View>

          {loadingBots ? (
            <View style={styles.loadingBots}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Loading assistants...
              </Text>
            </View>
          ) : null}

          {!loadingBots && botsError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {botsError}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={loadBots}
              >
                <Text style={styles.retryButtonText}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loadingBots &&
          !botsError &&
          bots.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No assistants yet
              </Text>

              <Text style={styles.emptyText}>
                Create your first AI assistant to get
                started.
              </Text>
            </View>
          ) : null}

          {!loadingBots &&
            !botsError &&
            bots.map((bot) => (
              <View
                key={bot.id}
                style={styles.botCard}
              >
                <View style={styles.botHeader}>
                  <Text style={styles.botName}>
                    {assistantIcon(bot.avatar_icon) ? `${assistantIcon(bot.avatar_icon)} ` : ''}{bot.name}
                  </Text>

                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      handleEditAssistant(bot)
                    }
                  >
                    <Text style={styles.editButtonText}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>

                {bot.description ? (
                  <Text style={styles.botDescription}>
                    {bot.description}
                  </Text>
                ) : null}

                {bot.created_at ? <Text style={styles.botDescription}>Created on {new Date(bot.created_at).toLocaleDateString()}</Text> : null}
                <Text style={styles.botMetaText}>
                  {bot.category || 'general'}
                </Text>

                {bot.personality ? (
                  <Text style={styles.personalityText}>
                    {bot.personality}
                  </Text>
                ) : null}

                <View style={{ gap: 10, marginTop: 16 }}>
                  <ActionButton title="Knowledge Base" secondary onPress={() => navigation.navigate('Knowledge', { bot })} />
                  <ActionButton title={user?.plan === 'pro' ? 'Discord Setup' : 'Discord — Pro'} secondary onPress={() => user?.plan === 'pro' ? openLink(null, bot.id) : openLink('billing')} />
                  <Text style={styles.botDescription}>Discord setup opens our website and requires browser sign-in.</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    handleOpenConversations(bot)
                  }
                >
                  <Text style={styles.chatButtonText}>
                    Open Chat
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

          <TouchableOpacity
            style={[
              styles.signOutButton,
              loggingOut && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text style={styles.signOutButtonText}>
              {loggingOut
                ? 'Signing Out...'
                : 'Sign Out'}
            </Text>
          </TouchableOpacity>
          <Footer />
        </View>
      </ScrollView>
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
    backgroundColor: colors.background,
    padding: spacing.xl,
  },

  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },

  profileLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },

  profileValue: {
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.md,
  },

  planText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },

  botCountText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },

  createButton: {
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },

  createButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  loadingBots: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },

  errorText: {
    color: colors.error,
    fontSize: 15,
    marginBottom: spacing.md,
  },

  retryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },

  retryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },

  botCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  botName: {
    flex: 1,
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  editButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },

  editButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  botDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.md,
  },

  botMetaText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },

  personalityText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  chatButton: {
    width: '100%',
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  chatButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  signOutButton: {
    width: '100%',
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  signOutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
