import { useHeaderHeight } from '@react-navigation/elements';
import WidgetSettings from '../components/WidgetSettings';
import CategoryPicker from '../components/CategoryPicker';
import AssistantPreferences from '../components/AssistantPreferences';
import AssistantErrors from '../components/AssistantErrors';
import { preferencesFor } from '../config/assistantPreferences';
import { validateAssistant, assistantApiErrors } from '../utils/assistantValidation';
import { descriptionHelp, personalityHelp } from '../config/assistantHelp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function EditBotScreen({
  navigation,
  route,
}) {
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const bot = route.params?.bot;

  const [category, setCategory] = useState(bot?.category || 'general');
  const [name, setName] = useState(bot?.name || '');
  const [description, setDescription] = useState(
    bot?.description || '',
  );
  const [personality, setPersonality] = useState(
    bot?.personality ??
      'I am a helpful and friendly assistant.',
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [preferences, setPreferences] = useState(() => preferencesFor(bot));

  async function handleSave() {
    setError('');

    if (!bot?.id) {
      setError('Unable to find this assistant.');
      return;
    }

    const errors = validateAssistant({ name, description, personality, category, ...preferences });
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
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
          category,
          ...preferences,
        },
      );

      navigation.popTo('Home', {
        refreshBots: Date.now(),
      });
    } catch (err) {
      const errors = assistantApiErrors(err);
      setFieldErrors(errors);
      setError(Object.keys(errors).length ? '' : err.message || 'Unable to update the assistant.');
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
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
      <ScrollView
        contentContainerStyle={[styles.container, { width: '100%', maxWidth: 760, alignSelf: 'center' }]}
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
            accessibilityLabel="Assistant name"
            onChangeText={setName}
            placeholder="Assistant name"
            placeholderTextColor={colors.textMuted}
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
            accessibilityLabel="Description"
            accessibilityHint={descriptionHelp}
            onChangeText={setDescription}
            placeholder="What does this assistant do?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!busy}
          />

          <Text style={styles.help}>{descriptionHelp}</Text>

          <Text style={styles.label}>
            Personality & instructions
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            value={personality}
            accessibilityLabel="Personality & instructions"
            accessibilityHint={personalityHelp}
            onChangeText={setPersonality}
            placeholder="Describe how the assistant should behave."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!busy}
          />

          <Text style={styles.help}>{personalityHelp}</Text>

<CategoryPicker value={category} onChange={setCategory} disabled={busy} />
          <AssistantPreferences values={preferences} onChange={setPreferences} disabled={busy} />
          <AssistantErrors errors={fieldErrors} />
          <WidgetSettings key={bot.id} botId={bot.id} disabled={busy} />

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
    backgroundColor: colors.background,
    padding: spacing.md,
  },

  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'left',
    marginTop: 0,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'left',
    marginBottom: spacing.md,
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
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: spacing.md,
  },

  multilineInput: {
    minHeight: 80,
  },

  help: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
  },

  saveButton: {
    width: '100%',
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  saveButtonText: {
    color: colors.text,
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
