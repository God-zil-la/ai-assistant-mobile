import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/styles/theme';
import AppNavigator from './src/navigation/AppNavigator';
function Content() {
  const { mode, ready } = useTheme();
  if (!ready) return null;
  return <><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><AppNavigator /></>;
}
export default function App() {
  return <SafeAreaProvider><ThemeProvider><Content /></ThemeProvider></SafeAreaProvider>;
}
