import { useEffect } from 'react';
import { AppState } from 'react-native';
import { storeBilling } from '../services/storeBilling';
import { getAuthToken, onAuthSessionChange } from '../services/tokenService';

export default function StorePurchaseObserver() {
  useEffect(() => {
    let active = true;
    let queue = Promise.resolve();
    const recover = () => {
      queue = queue.then(async () => {
        if (active && storeBilling && await getAuthToken()) await storeBilling.restore(false);
      }).catch(() => {
        // Billing retains account-scoped errors for the next visit to Plans.
      });
    };
    // Leave unfinished transactions available for the next authenticated retry.
    recover();
    const unsubscribe = onAuthSessionChange(recover);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') recover();
    });
    return () => { active = false; unsubscribe(); listener.remove(); };
  }, []);
  return null;
}
