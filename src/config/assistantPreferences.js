// Keep keys/defaults aligned with bots/customization.py; older API data is neutral.
export const defaultPreferences = { response_tone: 'default', response_length: 'default', avatar_icon: 'default', knowledge_activation_mode: 'automatic' };
export const preferenceFields = [
  {
    key: 'knowledge_activation_mode',
    label: 'Knowledge Base activation',
    help: 'Choose when your assistant searches its uploaded knowledge documents.',
    options: [
      { value: 'automatic', label: 'Automatic' },
      { value: 'on_request', label: 'On Request' },
      { value: 'always', label: 'Always' },
    ],
  },

  { key: 'response_tone', label: 'Response tone', help: 'Choose a default tone. More specific personality instructions or chat requests take priority.', options: [
    { value: 'default', label: 'Use personality & instructions' },
    { value: 'friendly', label: 'Friendly' }, { value: 'professional', label: 'Professional' },
  ] },
  { key: 'response_length', label: 'Response length', help: 'Choose a default level of detail. Existing response limits still apply.', options: [
    { value: 'default', label: 'Use personality & instructions' },
    { value: 'concise', label: 'Concise' }, { value: 'detailed', label: 'Detailed' },
  ] },
  { key: 'avatar_icon', label: 'Assistant icon', help: 'Shown in your assistant list and chat. This does not change its replies.', options: [
    { value: 'default', label: 'None (current appearance)' },
    { value: 'robot', label: '🤖 Robot' }, { value: 'sparkles', label: '✨ Sparkles' },
    { value: 'book', label: '📚 Books' }, { value: 'briefcase', label: '💼 Briefcase' },
  ] },
];
export const assistantIcon = value => ({ robot: '🤖', sparkles: '✨', book: '📚', briefcase: '💼' }[value] || '');
export const preferencesFor = bot => Object.fromEntries(Object.entries(defaultPreferences)
  .map(([key, fallback]) => [key, bot?.[key] ?? fallback]));
