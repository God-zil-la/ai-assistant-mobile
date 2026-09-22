import { categories } from '../config/categories.js';
import { preferenceFields } from '../config/assistantPreferences.js';

export const assistantFieldLabels = {
  name: 'Name', description: 'Description', personality: 'Personality & instructions',
  category: 'Category',
  ...Object.fromEntries(preferenceFields.map(field => [field.key, field.label])),
};

export function validateAssistant(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please enter a name for your assistant.';
  else if ([...values.name.trim()].length > 100) errors.name = 'Use 100 characters or fewer for the assistant name.';
  if (!values.personality.trim()) errors.personality = 'Please enter personality and instructions for your assistant.';
  if (!categories.some(item => item.value === values.category)) errors.category = 'Select a valid category.';
  for (const field of preferenceFields) {
    if (!field.options.some(option => option.value === values[field.key])) errors[field.key] = `Select a valid ${field.label.toLowerCase()}.`;
  }
  return errors;
}

export function assistantApiErrors(error) {
  if (error.status !== 400 || !error.data || typeof error.data !== 'object') return {};
  return Object.fromEntries(Object.entries(error.data)
    .filter(([field]) => field in assistantFieldLabels)
    .map(([field, messages]) => [field, Array.isArray(messages) ? messages.join(' ') : String(messages)]));
}
