import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../styles/theme';
export default function Panel({ children, style }) {
  const { colors } = useTheme();
  return <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={[{ padding: 20, gap: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      boxShadow: '0 6px 20px rgba(0,0,0,0.10)' }, style]}>{children}</LinearGradient>;
}
