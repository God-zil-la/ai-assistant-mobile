import { useHeaderHeight } from '@react-navigation/elements';
import CategoryPicker from '../components/CategoryPicker';
import AssistantPreferences from '../components/AssistantPreferences';
import AssistantErrors from '../components/AssistantErrors';
import { defaultPreferences } from '../config/assistantPreferences';
import { validateAssistant, assistantApiErrors } from '../utils/assistantValidation';
import { descriptionHelp, personalityHelp } from '../config/assistantHelp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { createBot } from '../services/botService';
import { getAuthToken } from '../services/tokenService';
import { useTheme, useThemedStyles, radius, spacing } from '../styles/theme';

export default function CreateBotScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [category, setCategory] = useState('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState(
    'I am a helpful and friendly assistant.',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [preferences, setPreferences] = useState(defaultPreferences);

  async function handleCreate() {
    setError('');

    const errors = validateAssistant({ name, description, personality, category, ...preferences });
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
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
        ...preferences,
      });

      navigation.popTo('Home', {
        refreshBots: Date.now(),
      });
    } catch (err) {
      const errors = assistantApiErrors(err);
      setFieldErrors(errors);
      setError(Object.keys(errors).length ? '' : err.message || 'Unable to create your assistant.');
    } finally {
      setLoading(false);
    }
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
            accessibilityLabel="Assistant name"
            onChangeText={setName}
            placeholder="Assistant name"
            placeholderTextColor={colors.textMuted}
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
            accessibilityLabel="Description"
            accessibilityHint={descriptionHelp}
            onChangeText={setDescription}
            placeholder="What does this assistant do?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!loading}
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
            editable={!loading}
          />

          <Text style={styles.help}>{personalityHelp}</Text>

<CategoryPicker value={category} onChange={setCategory} disabled={loading} />
          <AssistantPreferences values={preferences} onChange={setPreferences} disabled={loading} />
          <AssistantErrors errors={fieldErrors} />

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

  createButton: {
    width: '100%',
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },

  createButtonText: {
    color: colors.text,
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
