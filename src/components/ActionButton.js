import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemedStyles, radius, spacing } from '../styles/theme';

export default function ActionButton({ title, onPress, disabled, secondary, destructive, accessibilityLabel }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, destructive && styles.destructive, (pressed || disabled) && styles.dim]}>
      <Text style={[styles.text, secondary && styles.secondaryText, destructive && styles.destructiveText]}>{title}</Text>
    </Pressable>
  );
}
const makeStyles = (colors) => StyleSheet.create({
  button: { minHeight: 48, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.button, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  destructive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error },
  text: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  secondaryText: { color: colors.primary }, destructiveText: { color: colors.error }, dim: { opacity: 0.55 },
});
