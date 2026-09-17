import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const palettes = {
  dark: { background: '#0a0f1f', surface: '#0b1b3f', surfaceBorder: '#6ab0c1', border: '#6ab0c1',
    primary: '#15839d', primaryText: '#ffffff', text: '#e0e6f0', textMuted: '#b9c6db', textSubtle: '#a7b6cf',
    button: '#162447', buttonHover: '#1f3268', error: '#ff8585', success: '#78dfa7', gradient: ['#0b1b3f', '#0a1026'] },
  light: { background: '#f6f2eb', surface: '#ebe4d8', surfaceBorder: '#281a08', border: '#281a08',
    primary: '#3a3228', primaryText: '#ffffff', text: '#3a3228', textMuted: '#605547', textSubtle: '#6b5d4e',
    button: '#e9dfcf', buttonHover: '#d8cdbb', error: '#a72121', success: '#166534', gradient: ['#ebe4d8', '#ebe4d8'] },
};
const ThemeContext = createContext(null);
const key = 'theme';
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const writing = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key))
      .then(value => { if (active && (value === 'dark' || value === 'light')) setChoice(value); })
      .catch(() => { if (active) setError('Unable to read your saved theme.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const mode = choice || system || 'light';
  async function toggleTheme() {
    if (writing.current) return;
    writing.current = true;
    setSaving(true);
    const next = mode === 'dark' ? 'light' : 'dark';
    try {
      if (Platform.OS === 'web') localStorage.setItem(key, next);
      else await SecureStore.setItemAsync(key, next);
      setChoice(next);
      setError('');
    } catch { setError('Unable to save your theme. Please try again.'); }
    finally { writing.current = false; setSaving(false); }
  }
  return <ThemeContext.Provider value={{ colors: palettes[mode], mode, ready, toggleTheme, error, saving }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
export function useThemedStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 16 };
