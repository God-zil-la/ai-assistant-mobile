import { useHeaderHeight } from '@react-navigation/elements';
import Footer from './Footer';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles, spacing } from '../styles/theme';

export default function Screen({ children, refreshControl }) {
  const styles = useThemedStyles(makeStyles);
  const headerHeight = useHeaderHeight();
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={headerHeight}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={refreshControl}>
          {children}
          <Footer />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xl, width: '100%', maxWidth: 760, alignSelf: 'center', gap: spacing.lg },
});
