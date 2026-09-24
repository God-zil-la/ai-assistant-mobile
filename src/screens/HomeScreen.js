import ThemeControl from '../components/ThemeControl';
import CompactGrid from '../components/CompactGrid';
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

import { deleteBot, getBots } from '../services/botService';
import {
  clearAuthSession,
  getAuthToken,
} from '../services/tokenService';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';
import { confirmDelete } from '../utils/confirm';

export default function HomeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bots, setBots] = useState([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [botsError, setBotsError] = useState('');
  const [deletingBotId, setDeletingBotId] = useState(null);

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

  function handleWidget(bot) {
    if (user?.plan === 'pro') {
      navigation.navigate('WidgetSettings', {
        bot,
        plan: user.plan,
      });
      return;
    }

    openLink('billing');
  }

  async function performDeleteAssistant(bot) {
    if (!bot?.id || deletingBotId !== null) return;

    setDeletingBotId(bot.id);
    setBotsError('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Your session has expired.');
      }

      await deleteBot(token, bot.id);

      setBots((items) =>
        items.filter((item) => item.id !== bot.id),
      );
    } catch (err) {
      setBotsError(
        err.message || 'Unable to delete the assistant.',
      );
    } finally {
      setDeletingBotId(null);
    }
  }

  function handleDeleteAssistant(bot) {
    if (!bot?.id) {
      setBotsError('Unable to find this assistant.');
      return;
    }

    confirmDelete(
      'Delete Assistant',
      `Delete "${bot.name}"? This cannot be undone.`,
      () => performDeleteAssistant(bot),
    );
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
          <View style={styles.profileCard}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={styles.title}>AI Assistant</Text>
              <Text style={styles.subtitle}>Signed in as {user?.username || 'User'}</Text>
              <Text selectable style={styles.profileValue}>{user?.email || '—'}</Text>
              <Text style={styles.planText}>Plan · {planName}</Text>
            </View>
            <ThemeControl />
          </View>

          <View style={{ marginBottom: spacing.md }}><CompactGrid>
            <ActionButton title="Dashboard" secondary onPress={() => navigation.navigate('Dashboard')} />
            <ActionButton title="Analytics" secondary onPress={() => navigation.navigate('Analytics')} />
            <ActionButton title="Information Guide (PDF)" secondary onPress={() => openLink('guide')} />
            <ActionButton title="All conversations" secondary onPress={() => navigation.navigate('Conversations')} />
            <ActionButton title="Account & Help" secondary onPress={() => navigation.navigate('Account', { user })} />
          </CompactGrid></View>
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
            <CompactGrid columns={1} tabletColumns={2}>{bots.map((bot) => (
              <View
                key={bot.id}
                style={styles.botCard}
              >
                <View style={styles.botHeader}>
                  <Text style={styles.botName}>
                    {assistantIcon(bot.avatar_icon) ? `${assistantIcon(bot.avatar_icon)} ` : ''}{bot.name}
                  </Text>

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

                <View style={{ marginTop: 8 }}>
                  <CompactGrid>
                    <ActionButton
                      title={'\uD83D\uDCAC Chat'}
                      disabled={deletingBotId === bot.id}
                      onPress={() => handleOpenConversations(bot)}
                    />

                    <ActionButton
                      title={'\u270F\uFE0F Edit Assistant'}
                      secondary
                      disabled={deletingBotId === bot.id}
                      onPress={() => handleEditAssistant(bot)}
                    />

                    <ActionButton
                      title={'\uD83D\uDCDA Knowledge Base'}
                      secondary
                      disabled={deletingBotId === bot.id}
                      onPress={() =>
                        navigation.navigate('Knowledge', { bot })
                      }
                    />

                    <ActionButton
                      title={
                        user?.plan === 'pro'
                          ? '\uD83C\uDFAE Discord Setup'
                          : '\uD83D\uDD12 Discord - Pro'
                      }
                      secondary
                      disabled={deletingBotId === bot.id}
                      onPress={() =>
                        user?.plan === 'pro'
                          ? openLink(null, bot.id)
                          : openLink('billing')
                      }
                    />

                    <ActionButton
                      title={
                        user?.plan === 'pro'
                          ? '\uD83C\uDF10 Website Widget'
                          : '\uD83D\uDD12 Widget - Pro'
                      }
                      secondary
                      disabled={deletingBotId === bot.id}
                      onPress={() => handleWidget(bot)}
                    />

                    <ActionButton
                      title={
                        deletingBotId === bot.id
                          ? 'Deleting...'
                          : '\uD83D\uDDD1\uFE0F Delete'
                      }
                      destructive
                      disabled={deletingBotId !== null}
                      onPress={() => handleDeleteAssistant(bot)}
                    />
                  </CompactGrid>
                </View>

                <Text style={styles.botDescription}>
                  Discord setup opens our website and requires browser sign-in.
                </Text>
              </View>
            ))}</CompactGrid>}

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
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.md },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  profileValue: { color: colors.textMuted, fontSize: 12 },
  planText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  botCountText: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  createButton: { backgroundColor: colors.button, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, minHeight: 48, justifyContent: 'center' },
  createButtonText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  loadingBots: { alignItems: 'center', paddingVertical: spacing.lg },
  loadingText: { color: colors.textMuted, marginTop: spacing.sm },
  errorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.error, fontSize: 15, marginBottom: spacing.sm },
  retryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  retryButtonText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  botCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  botHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  botName: { flex: 1, color: colors.primary, fontSize: 18, fontWeight: '800' },
  botDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  botMetaText: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  personalityText: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  signOutButton: { backgroundColor: colors.button, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  buttonDisabled: { opacity: 0.6 },
  signOutButtonText: { color: colors.text, fontSize: 14, fontWeight: '800' },
});
