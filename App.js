import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';

import { ThemeProvider, useTheme } from './src/styles/theme';
import AppNavigator from './src/navigation/AppNavigator';

function Content() {
  const { colors, mode, ready } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);

    NavigationBar.setStyle(
      mode === 'dark' ? 'light' : 'dark'
    );
  }, [colors.background, mode]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Content />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
