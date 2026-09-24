import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../styles/theme';
export default function ThemeControl() {
  const { mode, toggleTheme, error, saving, colors } = useTheme();
  return <View style={{ gap: 4, maxWidth: 180 }}><Pressable accessibilityRole="button"
    accessibilityLabel={mode === 'dark' ? 'Light theme' : 'Dark theme'} accessibilityState={{ disabled: saving }}
    onPress={toggleTheme} disabled={saving} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
    {mode === 'dark' ? <Text style={{ fontSize: 24, color: colors.text }}>{'\u2600'}</Text> :
      <View accessible={false} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: 22, height: 22, borderRadius: 11, left: 8, top: -4, backgroundColor: colors.background }} />
      </View>}
  </Pressable>
    {error ? <Text style={{ color: colors.error }} accessibilityRole="alert">{error}</Text> : null}</View>;
}
