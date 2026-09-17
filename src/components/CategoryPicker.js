import { useState } from 'react';
import { Modal, FlatList, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from './ActionButton';
import { categories } from '../config/categories';
import { colors, radius, spacing } from '../styles/theme';

export default function CategoryPicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const label = categories.find((item) => item.value === value)?.label || value;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ActionButton title={label} secondary disabled={disabled} onPress={() => { setQuery(''); setOpen(true); }} accessibilityLabel={`Choose category, currently ${label}`} />
      <Text style={styles.hint}>The category shapes your assistant’s area of expertise.</Text>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.heading}>Choose a category</Text>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search categories" placeholderTextColor={colors.textMuted} accessibilityLabel="Search categories" autoCorrect={false} />
          <FlatList data={categories.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))}
            keyExtractor={(item) => item.value} keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={<Text style={styles.hint}>No matching categories.</Text>}
            renderItem={({ item }) => <ActionButton title={`${item.value === value ? '✓ ' : ''}${item.label}`} secondary onPress={() => { onChange(item.value); setOpen(false); }} />} />
          <ActionButton title="Cancel" secondary onPress={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl, gap: spacing.sm },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.textMuted, lineHeight: 21 },
  heading: { color: colors.text, fontSize: 24, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg },
  input: { color: colors.text, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md, fontSize: 16 },
});
