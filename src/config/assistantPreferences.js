
// Keep keys/defaults aligned with bots/customization.py.
// Neutral defaults preserve existing assistant behavior.

export const defaultPreferences = {
  response_tone: 'default',
  response_length: 'default',
  avatar_icon: 'default',
  knowledge_activation_mode: 'automatic',
  communication_style: 'default',
  response_structure: 'default',
  default_language: 'auto',
  proactivity: 'default',
  custom_instructions: '',
};

const defaultInstructionOption = [
  { value: 'default', label: 'Use existing instructions' },
];

const languageOptions = [
  ['auto', 'Automatic'],
  ['en', 'English'],
  ['sv', 'Swedish'],
  ['af', 'Afrikaans'],
  ['sq', 'Albanian'],
  ['am', 'Amharic'],
  ['ar', 'Arabic'],
  ['hy', 'Armenian'],
  ['az', 'Azerbaijani'],
  ['eu', 'Basque'],
  ['be', 'Belarusian'],
  ['bn', 'Bengali'],
  ['bs', 'Bosnian'],
  ['bg', 'Bulgarian'],
  ['my', 'Burmese'],
  ['ca', 'Catalan'],
  ['zh-hans', 'Chinese (Simplified)'],
  ['zh-hant', 'Chinese (Traditional)'],
  ['hr', 'Croatian'],
  ['cs', 'Czech'],
  ['da', 'Danish'],
  ['nl', 'Dutch'],
  ['et', 'Estonian'],
  ['tl', 'Filipino'],
  ['fi', 'Finnish'],
  ['fr', 'French'],
  ['ka', 'Georgian'],
  ['de', 'German'],
  ['el', 'Greek'],
  ['gu', 'Gujarati'],
  ['ha', 'Hausa'],
  ['he', 'Hebrew'],
  ['hi', 'Hindi'],
  ['hu', 'Hungarian'],
  ['is', 'Icelandic'],
  ['ig', 'Igbo'],
  ['id', 'Indonesian'],
  ['ga', 'Irish'],
  ['it', 'Italian'],
  ['ja', 'Japanese'],
  ['kn', 'Kannada'],
  ['kk', 'Kazakh'],
  ['km', 'Khmer'],
  ['ko', 'Korean'],
  ['lo', 'Lao'],
  ['lv', 'Latvian'],
  ['lt', 'Lithuanian'],
  ['mk', 'Macedonian'],
  ['ms', 'Malay'],
  ['ml', 'Malayalam'],
  ['mr', 'Marathi'],
  ['ne', 'Nepali'],
  ['nb', 'Norwegian Bokmal'],
  ['ps', 'Pashto'],
  ['fa', 'Persian'],
  ['pl', 'Polish'],
  ['pt', 'Portuguese'],
  ['pt-br', 'Portuguese (Brazil)'],
  ['pa', 'Punjabi'],
  ['ro', 'Romanian'],
  ['ru', 'Russian'],
  ['sr', 'Serbian'],
  ['si', 'Sinhala'],
  ['sk', 'Slovak'],
  ['sl', 'Slovenian'],
  ['so', 'Somali'],
  ['es', 'Spanish'],
  ['sw', 'Swahili'],
  ['ta', 'Tamil'],
  ['te', 'Telugu'],
  ['th', 'Thai'],
  ['tr', 'Turkish'],
  ['uk', 'Ukrainian'],
  ['ur', 'Urdu'],
  ['uz', 'Uzbek'],
  ['vi', 'Vietnamese'],
  ['cy', 'Welsh'],
  ['yo', 'Yoruba'],
  ['zu', 'Zulu'],
].map(([value, label]) => ({ value, label }));

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
  {
    key: 'response_tone',
    label: 'Response tone',
    help: 'Choose a default tone. More specific personality instructions or chat requests take priority.',
    options: [
      { value: 'default', label: 'Use personality & instructions' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'professional', label: 'Professional' },
    ],
  },
  {
    key: 'response_length',
    label: 'Response length',
    help: 'Choose a default level of detail. Existing response limits still apply.',
    options: [
      { value: 'default', label: 'Use personality & instructions' },
      { value: 'concise', label: 'Concise' },
      { value: 'detailed', label: 'Detailed' },
    ],
  },
  {
    key: 'avatar_icon',
    label: 'Assistant icon',
    help: 'Shown in your assistant list and chat. This does not change its replies.',
    options: [
  { value: 'default', label: 'None (current appearance)' },
  { value: 'robot', label: '🤖 Robot' },
  { value: 'sparkles', label: '✨ Sparkles' },
  { value: 'book', label: '📚 Books' },
  { value: 'briefcase', label: '💼 Briefcase' },

  { value: 'art', label: '🎨 Art' },
  { value: 'business', label: '🏢 Business' },
  { value: 'career', label: '🎯 Career' },
  { value: 'community', label: '👥 Community' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'affairs', label: '🌍 Current Affairs' },
  { value: 'education', label: '🎓 Education' },
  { value: 'startup', label: '🚀 Entrepreneurship' },
  { value: 'entertain', label: '🍿 Entertainment' },
  { value: 'environ', label: '🌳 Environment' },
  { value: 'events', label: '🎉 Events' },
  { value: 'fashion', label: '👗 Fashion' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'fitness', label: '🏋️ Fitness' },
  { value: 'food', label: '🍳 Food' },
  { value: 'funny', label: '😂 Funny' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'garden', label: '🌱 Gardening' },
  { value: 'general', label: '💬 General' },
  { value: 'hobbies', label: '🧩 Hobbies' },
  { value: 'history', label: '🏛️ History' },
  { value: 'home', label: '🏠 Home Improvement' },
  { value: 'innovate', label: '💡 Innovation' },
  { value: 'interview', label: '🤝 Interview Preparation' },
  { value: 'jobsearch', label: '🔎 Job Search' },
  { value: 'language', label: '🗣️ Language' },
  { value: 'leader', label: '👑 Leadership' },
  { value: 'lifestyle', label: '🌞 Lifestyle' },
  { value: 'local', label: '📍 Local' },
  { value: 'manage', label: '📋 Management' },
  { value: 'marketing', label: '📣 Marketing' },
  { value: 'mental', label: '🧠 Mental Health' },
  { value: 'music', label: '🎵 Music' },
  { value: 'news', label: '📰 News' },
  { value: 'other', label: '⭐ Other' },
  { value: 'parenting', label: '👶 Parenting' },
  { value: 'pets', label: '🐾 Pets' },
  { value: 'philos', label: '🤔 Philosophy' },
  { value: 'politics', label: '🗳️ Politics' },
  { value: 'product', label: '⚡ Productivity' },
  { value: 'relation', label: '❤️ Relationships' },
  { value: 'resume', label: '📄 Resume Building' },
  { value: 'sales', label: '📈 Sales' },
  { value: 'science', label: '🔬 Science' },
  { value: 'self', label: '🌟 Self Improvement' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'society', label: '🌐 Society' },
  { value: 'spirit', label: '🕊️ Spirituality' },
  { value: 'sports', label: '🏆 Sports' },
  { value: 'support', label: '🎧 Support' },
  { value: 'sustain', label: '♻️ Sustainability' },
  { value: 'tech', label: '💻 Tech' },
  { value: 'technol', label: '⚙️ Technology' },
  { value: 'therapy', label: '🫂 Therapy' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'wellbeing', label: '🌻 Wellbeing' },
  { value: 'wellness', label: '🧘 Wellness' },
  { value: 'print3d', label: '🖨️ 3-D Printing' },
    ],
  },
  {
    key: 'communication_style',
    label: 'Communication style',
    help: 'Choose how your assistant communicates.',
    options: [
      ...defaultInstructionOption,
      { value: 'formal', label: 'Formal' },
      { value: 'casual', label: 'Casual' },
      { value: 'educational', label: 'Educational' },
      { value: 'technical', label: 'Technical' },
    ],
  },
  {
    key: 'response_structure',
    label: 'Response structure',
    help: 'Choose how your assistant organizes its replies.',
    options: [
      { value: 'default', label: 'Automatic' },
      { value: 'paragraphs', label: 'Paragraphs' },
      { value: 'bullet_points', label: 'Bullet points' },
      { value: 'step_by_step', label: 'Step by step' },
    ],
  },
  {
    key: 'default_language',
    label: 'Default language',
    help: 'Automatic follows the user message language. A selected language is used for replies.',
    options: languageOptions,
  },
  {
    key: 'proactivity',
    label: 'Proactivity',
    help: 'Choose how often your assistant offers suggestions and next steps.',
    options: [
      ...defaultInstructionOption,
      { value: 'minimal', label: 'Minimal' },
      { value: 'balanced', label: 'Balanced' },
      { value: 'proactive', label: 'Proactive' },
    ],
  },
];


export const assistantIcon = value => {
  const iconPreference = preferenceFields.find(
    field => field.key === 'avatar_icon',
  );

  const option = iconPreference?.options.find(
    item => item.value === value,
  );

  if (!option || value === 'default') {
    return '';
  }

  return option.label.split(' ')[0];
};


export const preferencesFor = bot =>
  Object.fromEntries(
    Object.entries(defaultPreferences).map(([key, fallback]) => [
      key,
      bot?.[key] ?? fallback,
    ]),
  );


// Advanced Customization is available to Premium and Pro.
export const advancedPreferenceKeys = [
  'communication_style',
  'response_structure',
  'default_language',
  'proactivity',
  'custom_instructions',
];

export const hasAdvancedCustomization = plan =>
  ['premium', 'pro'].includes(String(plan || '').toLowerCase());

// Keep saved advanced preferences untouched when a user downgrades.
export const preferencesForPlan = (preferences, plan) => {
  if (hasAdvancedCustomization(plan)) return { ...preferences };

  return Object.fromEntries(
    Object.entries(preferences).filter(
      ([key]) => !advancedPreferenceKeys.includes(key),
    ),
  );
};
