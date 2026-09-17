import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createConversation,
  deleteConversation,
  getConversations,
} from '../services/conversationService';
import { getAuthToken } from '../services/tokenService';
import {
  colors,
  radius,
  spacing,
} from '../styles/theme';

export default function ConversationsScreen({
  navigation,
  route,
}) {
  const bot = route.params?.bot;

  const [conversations, setConversations] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] =
    useState(null);
  const [error, setError] = useState('');

  const loadConversations = useCallback(
    async () => {
      if (!bot?.id) {
        setError('Unable to find this assistant.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = await getAuthToken();

        if (!token) {
          throw new Error(
            'Your session has expired.',
          );
        }

        const data = await getConversations(token);

        const botConversations = Array.isArray(data)
          ? data.filter(
              (conversation) =>
                conversation.bot_id === bot.id,
            )
          : [];

        setConversations(botConversations);
      } catch (err) {
        setError(
          err.message ||
            'Unable to load conversations.',
        );
      } finally {
        setLoading(false);
      }
    },
    [bot?.id],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  async function handleNewConversation() {
    if (!bot?.id) {
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(
          'Your session has expired.',
        );
      }

      const conversation =
        await createConversation(
          token,
          bot.id,
          '',
        );

      navigation.navigate('Chat', {
        bot,
        conversationId:
          conversation.conversation_id,
      });
    } catch (err) {
      setError(
        err.message ||
          'Unable to create a conversation.',
      );
    } finally {
      setCreating(false);
    }
  }

  function openConversation(conversation) {
    navigation.navigate('Chat', {
      bot,
      conversationId:
        conversation.conversation_id,
    });
  }

  async function performDelete(conversationId) {
    setDeletingId(conversationId);
    setError('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(
          'Your session has expired.',
        );
      }

      await deleteConversation(
        token,
        conversationId,
      );

      await loadConversations();
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete the conversation.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleDelete(conversation) {
    const title =
      conversation.title || 'Untitled conversation';

    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      const confirmed = window.confirm(
        `Delete "${title}"? This cannot be undone.`,
      );

      if (confirmed) {
        performDelete(
          conversation.conversation_id,
        );
      }

      return;
    }

    Alert.alert(
      'Delete Conversation',
      `Delete "${title}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            performDelete(
              conversation.conversation_id,
            ),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {bot?.name || 'Assistant'}
          </Text>

          <Text style={styles.subtitle}>
            Conversations
          </Text>

          <TouchableOpacity
            style={[
              styles.newButton,
              creating && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleNewConversation}
            disabled={creating}
          >
            <Text style={styles.newButtonText}>
              {creating
                ? 'Creating...'
                : '+ New Conversation'}
            </Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.loadingText}>
                Loading conversations...
              </Text>
            </View>
          ) : null}

          {!loading &&
          !error &&
          conversations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No conversations yet
              </Text>

              <Text style={styles.emptyText}>
                Start a new conversation with this
                assistant.
              </Text>
            </View>
          ) : null}

          {!loading &&
            conversations.map((conversation) => (
              <View
                key={conversation.conversation_id}
                style={styles.conversationCard}
              >
                <TouchableOpacity
                  style={styles.conversationContent}
                  activeOpacity={0.8}
                  onPress={() =>
                    openConversation(conversation)
                  }
                >
                  <Text style={styles.conversationTitle}>
                    {conversation.title ||
                      'Untitled conversation'}
                  </Text>

                  <Text style={styles.messageCount}>
                    {conversation.message_count}{' '}
                    {conversation.message_count === 1
                      ? 'message'
                      : 'messages'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  activeOpacity={0.8}
                  disabled={
                    deletingId ===
                    conversation.conversation_id
                  }
                  onPress={() =>
                    handleDelete(conversation)
                  }
                >
                  <Text style={styles.deleteButtonText}>
                    {deletingId ===
                    conversation.conversation_id
                      ? '...'
                      : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: 700,
    alignSelf: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  newButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  newButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
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

  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },

  conversationContent: {
    flex: 1,
    padding: spacing.lg,
  },

  conversationTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
  },

  messageCount: {
    color: colors.textMuted,
    fontSize: 13,
  },

  deleteButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  deleteButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});