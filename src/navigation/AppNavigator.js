import DashboardScreen from '../screens/DashboardScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import KnowledgeScreen from '../screens/KnowledgeScreen';
import ThemeControl from '../components/ThemeControl';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatScreen from '../screens/ChatScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import CreateBotScreen from '../screens/CreateBotScreen';
import EditBotScreen from '../screens/EditBotScreen';
import WidgetSettingsScreen from '../screens/WidgetSettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AccountScreen from '../screens/AccountScreen';
import ActionButton from '../components/ActionButton';
import { onUnauthorized } from '../services/apiClient';
import { restoreSession } from '../services/sessionRestore';
import { getCurrentUser } from '../services/authService';
import {
  clearAuthSession,
  getAuthToken,
} from '../services/tokenService';
import { useTheme, useThemedStyles } from '../styles/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { colors, mode } = useTheme();
  const navigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const styles = useThemedStyles(makeStyles);
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialUser, setInitialUser] = useState(null);
  const [startupError, setStartupError] = useState('');
  const navigationRef = useNavigationContainerRef();
  const invalidating = useRef(false);

  const checkAuthSession = useCallback(() => restoreSession({
    getToken: getAuthToken, getUser: getCurrentUser, clear: clearAuthSession,
  }).then((user) => {
    setInitialUser(user);
    setInitialRoute(user ? 'Home' : 'Welcome');
  }).catch((error) => {
    setStartupError(error.message || 'Unable to restore your session. Please try again.');
  }), []);

  useEffect(() => {
    checkAuthSession();
  }, [checkAuthSession]);

  useEffect(() => onUnauthorized(async (rejectedToken) => {
    if (!navigationRef.isReady() || invalidating.current) return;
    invalidating.current = true;
    try {
      // An old request must not sign out a newly authenticated account.
      if (await getAuthToken() !== rejectedToken) return;
      await clearAuthSession();
      navigationRef.resetRoot({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      navigationRef.resetRoot({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      invalidating.current = false;
    }
  }), [navigationRef]);

  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        {startupError ? <View style={{ padding: 24, gap: 20, maxWidth: 500 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Unable to connect</Text>
          <Text style={{ color: colors.textMuted, lineHeight: 22 }} accessibilityRole="alert">{startupError}</Text>
          <Text style={{ color: colors.textMuted }}>Your saved sign-in has been kept on this device.</Text>
          <ActionButton title="Try again" onPress={() => { setStartupError(''); checkAuthSession(); }} />
        </View> : <ActivityIndicator
          size="large"
          color={colors.primary}
        />}
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={{ ...navigationTheme, colors: { ...navigationTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.surfaceBorder } }}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerRight: () => <ThemeControl />,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Knowledge" component={KnowledgeScreen} />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account & Help' }} />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{
            user: initialUser,
          }}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="CreateBot"
          component={CreateBotScreen}
          options={{
            title: 'Create Assistant',
          }}
        />

        <Stack.Screen
          name="EditBot"
          component={EditBotScreen}
          options={{
            title: 'Edit Assistant',
          }}
        />

        <Stack.Screen
        name="WidgetSettings"
        component={WidgetSettingsScreen}
        options={{
          title: 'Website Widget',
        }}
      />

      <Stack.Screen
          name="Conversations"
          component={ConversationsScreen}
          options={{
            title: 'Conversations',
          }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'Chat',
          }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Sign In',
          }}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Create Account',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
