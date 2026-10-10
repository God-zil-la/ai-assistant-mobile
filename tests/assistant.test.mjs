
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAssistant,
  assistantApiErrors,
} from '../src/utils/assistantValidation.js';
import {
  defaultPreferences,
  preferencesFor,
  assistantIcon,
  preferenceFields,
  advancedPreferenceKeys,
  hasAdvancedCustomization,
  preferencesForPlan,
} from '../src/config/assistantPreferences.js';

const valid = {
  name: 'Travel guide',
  description: '',
  personality: 'Be helpful.',
  category: 'travel',
  ...defaultPreferences,
};

test('assistant validation accepts optional description and trims required text', () => {
  assert.deepEqual(
    validateAssistant({ ...valid, name: '  Trip  ', personality: ' Be helpful. ' }),
    {},
  );
  assert.deepEqual(
    Object.keys(validateAssistant({ ...valid, name: ' ', personality: '\n' })),
    ['name', 'personality'],
  );
});

test('name limit counts Unicode characters like the backend and rejects overlength', () => {
  assert.deepEqual(validateAssistant({ ...valid, name: '😀'.repeat(100) }), {});
  assert.ok(validateAssistant({ ...valid, name: '😀'.repeat(101) }).name);
});

test('invalid category and configuration choices are field errors', () => {
  for (const field of ['category', ...preferenceFields.map(item => item.key)]) {
    assert.deepEqual(
      Object.keys(validateAssistant({ ...valid, [field]: 'invalid' })),
      [field],
    );
  }
});

test('old API data uses neutral defaults and known preferences round trip', () => {
  assert.deepEqual(preferencesFor({ name: 'Old bot' }), defaultPreferences);

  assert.deepEqual(
    preferencesFor({
      response_tone: 'friendly',
      response_length: 'detailed',
      avatar_icon: 'book',
    }),
    {
      ...defaultPreferences,
      response_tone: 'friendly',
      response_length: 'detailed',
      avatar_icon: 'book',
    },
  );

  assert.equal(assistantIcon('default'), '');
  assert.equal(assistantIcon('unknown'), '');
  assert.equal(assistantIcon('book'), '📚');
});

test('server validation retains field identity without converting plan or network errors', () => {
  assert.deepEqual(
    assistantApiErrors({
      status: 400,
      data: { name: ['Already exists.'], avatar_icon: ['Invalid choice.'] },
    }),
    { name: 'Already exists.', avatar_icon: 'Invalid choice.' },
  );
  assert.deepEqual(
    assistantApiErrors({ status: 403, data: { detail: 'Plan limit reached.' } }),
    {},
  );
  assert.deepEqual(assistantApiErrors(new Error('Offline')), {});
});

test('Knowledge Base activation modes validate and round trip', () => {
  for (const mode of ['automatic', 'on_request', 'always']) {
    assert.deepEqual(validateAssistant({ ...valid, knowledge_activation_mode: mode }), {});
    assert.equal(
      preferencesFor({ knowledge_activation_mode: mode }).knowledge_activation_mode,
      mode,
    );
  }

  assert.equal(preferencesFor({}).knowledge_activation_mode, 'automatic');
  assert.ok(validateAssistant({ ...valid, knowledge_activation_mode: 'invalid' }).knowledge_activation_mode);
});

test('Knowledge Base API validation retains field identity', () => {
  assert.deepEqual(
    assistantApiErrors({
      status: 400,
      data: { knowledge_activation_mode: ['Invalid choice.'] },
    }),
    { knowledge_activation_mode: 'Invalid choice.' },
  );
});

test('U4.1 customization defaults match the backend', () => {
  assert.equal(defaultPreferences.communication_style, 'default');
  assert.equal(defaultPreferences.response_structure, 'default');
  assert.equal(defaultPreferences.default_language, 'auto');
  assert.equal(defaultPreferences.proactivity, 'default');
  assert.equal(defaultPreferences.custom_instructions, '');
});

test('U4.1 communication style validates and round trips', () => {
  for (const value of ['default', 'formal', 'casual', 'educational', 'technical']) {
    assert.deepEqual(validateAssistant({ ...valid, communication_style: value }), {});
    assert.equal(preferencesFor({ communication_style: value }).communication_style, value);
  }
});

test('U4.1 response structure validates and round trips', () => {
  for (const value of ['default', 'paragraphs', 'bullet_points', 'step_by_step']) {
    assert.deepEqual(validateAssistant({ ...valid, response_structure: value }), {});
    assert.equal(preferencesFor({ response_structure: value }).response_structure, value);
  }
});

test('U4.1 default language validates and round trips for every configured language', () => {
  const languageField = preferenceFields.find(field => field.key === 'default_language');
  assert.ok(languageField);
  assert.ok(languageField.options.length > 70);

  for (const option of languageField.options) {
    assert.deepEqual(validateAssistant({ ...valid, default_language: option.value }), {});
    assert.equal(
      preferencesFor({ default_language: option.value }).default_language,
      option.value,
    );
  }

  assert.equal(preferencesFor({}).default_language, 'auto');
});

test('U4.1 proactivity validates and round trips', () => {
  for (const value of ['default', 'minimal', 'balanced', 'proactive']) {
    assert.deepEqual(validateAssistant({ ...valid, proactivity: value }), {});
    assert.equal(preferencesFor({ proactivity: value }).proactivity, value);
  }
});

test('U4.1 custom instructions preserve multiline Unicode text', () => {
  const instructions = 'Answer clearly.\nAnvänd svenska när det passar. 🤖';

  assert.deepEqual(
    validateAssistant({ ...valid, custom_instructions: instructions }),
    {},
  );

  assert.equal(
    preferencesFor({ custom_instructions: instructions }).custom_instructions,
    instructions,
  );

  assert.equal(preferencesFor({}).custom_instructions, '');
});

test('U4.1 backend field errors retain their identities', () => {
  assert.deepEqual(
    assistantApiErrors({
      status: 400,
      data: {
        communication_style: ['Invalid choice.'],
        default_language: ['Unsupported language.'],
        custom_instructions: ['Invalid instructions.'],
      },
    }),
    {
      communication_style: 'Invalid choice.',
      default_language: 'Unsupported language.',
      custom_instructions: 'Invalid instructions.',
    },
  );
});


test('U4.2 Free excludes advanced customization from API payloads', () => {
  const preferences = {
    ...defaultPreferences,
    communication_style: 'formal',
    custom_instructions: 'Keep this saved.',
  };

  const filtered = preferencesForPlan(preferences, 'free');

  for (const key of advancedPreferenceKeys) {
    assert.equal(Object.hasOwn(filtered, key), false, key);
  }

  assert.equal(filtered.response_tone, preferences.response_tone);
  assert.equal(filtered.knowledge_activation_mode, preferences.knowledge_activation_mode);
  assert.equal(hasAdvancedCustomization('free'), false);
});

test('U4.2 Premium and Pro retain advanced customization', () => {
  for (const plan of ['premium', 'pro']) {
    assert.equal(hasAdvancedCustomization(plan), true);
    assert.deepEqual(preferencesForPlan(defaultPreferences, plan), defaultPreferences);
  }
});

test('U4.2 Free filtering preserves original saved preferences', () => {
  const preferences = {
    ...defaultPreferences,
    custom_instructions: 'Restore after upgrade.',
  };

  preferencesForPlan(preferences, 'free');

  assert.equal(preferences.custom_instructions, 'Restore after upgrade.');
  assert.equal(
    preferencesForPlan(preferences, 'pro').custom_instructions,
    'Restore after upgrade.',
  );
});
