import { Text, View } from 'react-native';
import { useTheme } from '../styles/theme';
import ActionButton from './ActionButton';
export default function ThemeControl() {
  const { mode, toggleTheme, error, saving, colors } = useTheme();
  return <View style={{ gap: 8 }}><ActionButton title={mode === 'dark' ? 'Light theme' : 'Dark theme'} secondary onPress={toggleTheme} disabled={saving} />
    {error ? <Text style={{ color: colors.error }} accessibilityRole="alert">{error}</Text> : null}</View>;
}
