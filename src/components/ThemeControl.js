import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../styles/theme';
export default function ThemeControl() {
  const { mode, toggleTheme, error, saving, colors } = useTheme();
  return <View style={{ gap: 4, maxWidth: 180 }}><Pressable accessibilityRole="button"
    accessibilityLabel={mode === 'dark' ? 'Light theme' : 'Dark theme'} accessibilityState={{ disabled: saving }}
    onPress={toggleTheme} disabled={saving} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20, color: colors.text }}>{mode === 'dark' ? '\u2600' : '\u263E'}</Text>
  </Pressable>
    {error ? <Text style={{ color: colors.error }} accessibilityRole="alert">{error}</Text> : null}</View>;
}
