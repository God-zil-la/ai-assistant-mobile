import { Text, View, StyleSheet } from 'react-native';
import { assistantFieldLabels } from '../utils/assistantValidation';
import { useThemedStyles, spacing } from '../styles/theme';

export default function AssistantErrors({ errors }) {
  const styles = useThemedStyles(makeStyles);
  if (!Object.keys(errors).length) return null;
  return <View accessibilityRole="alert" style={styles.container}>
    {Object.entries(errors).map(([field, message]) =>
      <Text key={field} style={styles.text}>{assistantFieldLabels[field]}: {message}</Text>)}
  </View>;
}
const makeStyles = colors => StyleSheet.create({
  container: { marginBottom: spacing.lg, gap: spacing.sm },
  text: { color: colors.error, fontSize: 14, lineHeight: 21 },
});
