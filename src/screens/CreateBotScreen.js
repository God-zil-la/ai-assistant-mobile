import CategoryPicker from '../components/CategoryPicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { createBot } from '../services/botService';
import { getAuthToken } from '../services/tokenService';
import { colors, radius, spacing } from '../styles/theme';

export default function CreateBotScreen({ navigation }) {
  const [category, setCategory] = useState('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState(
    'I am a helpful and friendly assistant.',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');

    if (!name.trim()) {
      setError('Please enter a name for your assistant.');
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Your session has expired.');
      }

      await createBot(token, {
        name: name.trim(),
        description: description.trim(),
        personality: personality.trim(),
        category,
      });

      navigation.popTo('Home', {
        refreshBots: Date.now(),
      });
    } catch (err) {
      setError(
        err.message || 'Unable to create your assistant.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            Create Assistant
          </Text>

          <Text style={styles.subtitle}>
            Build a new AI assistant for your account.
          </Text>

          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Assistant name"
            placeholderTextColor={colors.textMuted}
            maxLength={100}
            editable={!loading}
          />

          <Text style={styles.label}>
            Description
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="What does this assistant do?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!loading}
          />

          <Text style={styles.label}>
            Personality
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            value={personality}
            onChangeText={setPersonality}
            placeholder="Describe how the assistant should behave."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!loading}
          />

<CategoryPicker value={category} onChange={setCategory} disabled={loading} />

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading
                ? 'Creating...'
                : 'Create Assistant'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
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
    maxWidth: 620,
    alignSelf: 'center',
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },

  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
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
    marginBottom: spacing.lg,
  },

  multilineInput: {
    minHeight: 110,
  },

  categoryText: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xl,
  },

  errorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
  },

  createButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  createButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  cancelButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});