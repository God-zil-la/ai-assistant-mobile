import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAssistant, assistantApiErrors } from '../src/utils/assistantValidation.js';
import { defaultPreferences, preferencesFor, assistantIcon } from '../src/config/assistantPreferences.js';

const valid = { name: 'Travel guide', description: '', personality: 'Be helpful.', category: 'travel', ...defaultPreferences };

test('assistant validation accepts optional description and trims required text', () => {
  assert.deepEqual(validateAssistant({ ...valid, name: '  Trip  ', personality: ' Be helpful. ' }), {});
  assert.deepEqual(Object.keys(validateAssistant({ ...valid, name: ' ', personality: '\n' })), ['name', 'personality']);
});
test('name limit counts Unicode characters like the backend and rejects overlength', () => {
  assert.deepEqual(validateAssistant({ ...valid, name: '😀'.repeat(100) }), {});
  assert.ok(validateAssistant({ ...valid, name: '😀'.repeat(101) }).name);
});
test('invalid category and configuration choices are field errors', () => {
  for (const field of ['category', 'response_tone', 'response_length', 'avatar_icon']) {
    assert.deepEqual(Object.keys(validateAssistant({ ...valid, [field]: 'invalid' })), [field]);
  }
});
test('old API data uses neutral defaults and known preferences round trip', () => {
  assert.deepEqual(preferencesFor({ name: 'Old bot' }), defaultPreferences);
  assert.deepEqual(preferencesFor({ response_tone: 'friendly', response_length: 'detailed', avatar_icon: 'book' }),
    { response_tone: 'friendly', response_length: 'detailed', avatar_icon: 'book' });
  assert.equal(assistantIcon('default'), '');
  assert.equal(assistantIcon('unknown'), '');
  assert.equal(assistantIcon('book'), '📚');
});
test('server validation retains field identity without converting plan or network errors', () => {
  assert.deepEqual(assistantApiErrors({ status: 400, data: { name: ['Already exists.'], avatar_icon: ['Invalid choice.'] } }),
    { name: 'Already exists.', avatar_icon: 'Invalid choice.' });
  assert.deepEqual(assistantApiErrors({ status: 403, data: { detail: 'Plan limit reached.' } }), {});
  assert.deepEqual(assistantApiErrors(new Error('Offline')), {});
});
