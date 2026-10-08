import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'username';
const sessionListeners = new Set();

export function onAuthSessionChange(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function notifySessionChange() {
  sessionListeners.forEach(listener => {
    // A recovery listener must not turn a completed sign-in into a failure.
    try { listener(); } catch { /* The listener owns its recovery errors. */ }
  });
}

function isWeb() {
  return Platform.OS === 'web';
}

export async function saveAuthSession(token, username) {
  if (isWeb()) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    notifySessionChange();
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(USERNAME_KEY, username);
  notifySessionChange();
}

export async function getAuthToken() {
  if (isWeb()) {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getStoredUsername() {
  if (isWeb()) {
    return localStorage.getItem(USERNAME_KEY);
  }

  return SecureStore.getItemAsync(USERNAME_KEY);
}

export async function clearAuthSession() {
  if (isWeb()) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    notifySessionChange();
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USERNAME_KEY);
  notifySessionChange();
}
