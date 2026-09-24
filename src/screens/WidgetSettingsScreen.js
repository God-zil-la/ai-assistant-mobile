import { useState } from 'react';
import { Text, View } from 'react-native';

import ActionButton from '../components/ActionButton';
import Screen from '../components/Screen';
import WidgetSettings from '../components/WidgetSettings';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';

export default function WidgetSettingsScreen({ route }) {
  const { colors } = useTheme();
  const bot = route.params?.bot;
  const plan = route.params?.plan;
  const [error, setError] = useState('');

  async function openBilling() {
    setError('');

    try {
      await openAccountLink('billing');
    } catch (err) {
      setError(err.message || 'Unable to open billing.');
    }
  }

  if (!bot?.id) {
    return (
      <Screen>
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.error,
            fontSize: 16,
          }}
        >
          Unable to find this assistant.
        </Text>
      </Screen>
    );
  }

  if (plan !== 'pro') {
    return (
      <Screen>
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: '800',
            }}
          >
            Website Widget / Public Chatbot
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            Website Widget / Public Chatbot is available with the Pro plan.
          </Text>

          <ActionButton
            title="View Pro plan"
            onPress={openBilling}
          />

          {error ? (
            <Text
              accessibilityRole="alert"
              style={{ color: colors.error }}
            >
              {error}
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <WidgetSettings
        key={bot.id}
        botId={bot.id}
      />
    </Screen>
  );
}
