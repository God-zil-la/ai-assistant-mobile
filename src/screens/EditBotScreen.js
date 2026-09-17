import { useState } from 'react';

import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  deleteBot,
  updateBot,
} from '../services/botService';
import { getAuthToken } from '../services/tokenService';
import { colors, radius, spacing } from '../styles/theme';

export default function EditBotScreen({
  navigation,
  route,
}) {
  const bot = route.params?.bot;

  const [name, setName] = useState(bot?.name || '');
  const [description, setDescription] = useState(
    bot?.description || '',
  );
  const [personality, setPersonality] = useState(
    bot?.personality ||
      'I am a helpful and friendly assistant.',
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');

    if (!bot?.id) {
      setError('Unable to find this assistant.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a name for your assistant.');
      return;
    }

    setSaving(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Your session has expired.');
      }

      await updateBot(
        token,
        bot.id,
        {
          name: name.trim(),
          description: description.trim(),
          personality: personality.trim(),
          category: bot.category || 'general',
        },
      );

      navigation.navigate('Home', {
        refreshBots: Date.now(),
      });
    } catch (err) {
      setError(
        err.message || 'Unable to update the assistant.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    setError('');
    setDeleting(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Your session has expired.');
      }

      await deleteBot(token, bot.id);

      navigation.navigate('Home', {
        refreshBots: Date.now(),
      });
    } catch (err) {
      setError(
        err.message || 'Unable to delete the assistant.',
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleDelete() {
    if (!bot?.id) {
      setError('Unable to find this assistant.');
      return;
    }

    if (
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function'
    ) {
      const confirmed = window.confirm(
        `Delete "${bot.name}"? This cannot be undone.`,
      );

      if (confirmed) {
        performDelete();
      }

      return;
    }

    Alert.alert(
      'Delete Assistant',
      `Delete "${bot.name}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ],
    );
  }

  const busy = saving || deleting;

  if (!bot) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingContainer}>
          <Text style={styles.errorText}>
            Unable to find this assistant.
          </Text>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            Edit Assistant
          </Text>

          <Text style={styles.subtitle}>
            Update your assistant or delete it.
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
            editable={!busy}
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
            editable={!busy}
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
            editable={!busy}
          />

          <Text style={styles.categoryText}>
            Category:{' '}
            {bot.category
              ? bot.category.charAt(0).toUpperCase() +
                bot.category.slice(1)
              : 'General'}
          </Text>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.saveButton,
              busy && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={busy}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              busy && styles.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleDelete}
            disabled={busy}
          >
            <Text style={styles.deleteButtonText}>
              {deleting
                ? 'Deleting...'
                : 'Delete Assistant'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            disabled={busy}
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

  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
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

  saveButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  saveButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },

  deleteButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  deleteButtonText: {
    color: colors.error,
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