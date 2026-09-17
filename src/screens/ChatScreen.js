import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { sendChatMessage } from '../services/chatService';
import { getConversation } from '../services/conversationService';
import { getAuthToken } from '../services/tokenService';
import {
  colors,
  radius,
  spacing,
} from '../styles/theme';

export default function ChatScreen({ route }) {
  const bot = route.params?.bot;
  const conversationId =
    route.params?.conversationId;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const scrollViewRef = useRef(null);

  const loadConversation = useCallback(
    async () => {
      if (!conversationId) {
        setError(
          'Unable to find this conversation.',
        );
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

        const data = await getConversation(
          token,
          conversationId,
        );

        setMessages(
          Array.isArray(data.messages)
            ? data.messages
            : [],
        );
      } catch (err) {
        setError(
          err.message ||
            'Unable to load the conversation.',
        );
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  async function handleSend() {
    const text = message.trim();

    if (!text || sending || !bot?.id) {
      return;
    }

    setSending(true);
    setError('');
    setMessage('');

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(
          'Your session has expired.',
        );
      }

      await sendChatMessage(
        token,
        bot.id,
        text,
        conversationId,
      );

      await loadConversation();
    } catch (err) {
      setMessage(text);

      setError(
        err.message ||
          'Unable to send your message.',
      );
    } finally {
      setSending(false);
    }
  }

  function getSenderLabel(sender) {
    if (sender === 'user') {
      return 'You';
    }

    return bot?.name || 'Assistant';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {bot?.name || 'Assistant'}
            </Text>

            <Text style={styles.subtitle}>
              AI Chat
            </Text>
          </View>

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
                Loading chat...
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messages}
              contentContainerStyle={
                styles.messagesContent
              }
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({
                  animated: true,
                });
              }}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    Start the conversation
                  </Text>

                  <Text style={styles.emptyText}>
                    Send a message to{' '}
                    {bot?.name || 'your assistant'}.
                  </Text>
                </View>
              ) : null}

              {messages.map((chatMessage) => {
                const isUser =
                  chatMessage.sender === 'user';

                return (
                  <View
                    key={chatMessage.id}
                    style={[
                      styles.messageRow,
                      isUser
                        ? styles.userMessageRow
                        : styles.botMessageRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser
                          ? styles.userBubble
                          : styles.botBubble,
                      ]}
                    >
                      <Text style={styles.sender}>
                        {getSenderLabel(
                          chatMessage.sender,
                        )}
                      </Text>

                      <Text style={styles.messageText}>
                        {chatMessage.message}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {sending ? (
                <View style={styles.botMessageRow}>
                  <View
                    style={[
                      styles.messageBubble,
                      styles.botBubble,
                    ]}
                  >
                    <Text style={styles.sender}>
                      {bot?.name || 'Assistant'}
                    </Text>

                    <Text style={styles.thinkingText}>
                      Thinking...
                    </Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Message your assistant..."
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!sending}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || sending) &&
                  styles.buttonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSend}
              disabled={!message.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 3,
  },

  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  messages: {
    flex: 1,
  },

  messagesContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
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

  messageRow: {
    width: '100%',
    marginBottom: spacing.md,
  },

  userMessageRow: {
    alignItems: 'flex-end',
  },

  botMessageRow: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '85%',
    borderRadius: radius.md,
    padding: spacing.md,
  },

  userBubble: {
    backgroundColor: colors.primary,
  },

  botBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sender: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },

  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },

  thinkingText: {
    color: colors.textMuted,
    fontSize: 15,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  input: {
    flex: 1,
    maxHeight: 130,
    minHeight: 48,
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },

  sendButton: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },

  sendButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});