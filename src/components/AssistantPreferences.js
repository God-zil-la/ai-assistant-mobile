import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CompactGrid from './CompactGrid';
import ActionButton from './ActionButton';
import { preferenceFields } from '../config/assistantPreferences';
import { useThemedStyles, spacing } from '../styles/theme';

export default function AssistantPreferences({ values, onChange, disabled }) {
  const styles = useThemedStyles(makeStyles);
  const [active, setActive] = useState(null);
  const field = preferenceFields.find(item => item.key === active);
  return <View style={styles.container}>
    <Text style={styles.heading}>Response preferences & appearance</Text>
    <CompactGrid>{preferenceFields.map(item => <View key={item.key} style={styles.field}>
      <Text style={styles.label}>{item.label}</Text>
      <ActionButton secondary disabled={disabled} accessibilityLabel={`Choose ${item.label.toLowerCase()}`}
        title={item.options.find(option => option.value === values[item.key])?.label || values[item.key]}
        onPress={() => setActive(item.key)} />
      <Text style={styles.help}>{item.help}</Text>
    </View>)}</CompactGrid>
    <Modal visible={!!field} animationType="slide" onRequestClose={() => setActive(null)}>
      <SafeAreaView style={styles.modal}>
        <ScrollView contentContainerStyle={styles.choices}>
          <Text style={styles.heading}>{field?.label}</Text>
          {field?.options.map(option => <ActionButton key={option.value} secondary
            title={`${values[field.key] === option.value ? '✓ ' : ''}${option.label}`}
            accessibilityLabel={option.label}
            onPress={() => { onChange({ ...values, [field.key]: option.value }); setActive(null); }} />)}
          <ActionButton title="Cancel" secondary onPress={() => setActive(null)} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}
const makeStyles = colors => StyleSheet.create({
  container: { marginBottom: spacing.md, gap: spacing.sm },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800' },
  help: { color: colors.textMuted, lineHeight: 18, fontSize: 13 },
  modal: { flex: 1, backgroundColor: colors.background },
  choices: { padding: spacing.xl, gap: spacing.lg },
});
