import { useCallback, useRef, useState } from 'react';
import { AppState, Platform, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Panel from '../components/Panel';
import ActionButton from '../components/ActionButton';
import { storeBilling } from '../services/storeBilling';
import { getAuthToken } from '../services/tokenService';
import { openAccountLink } from '../services/externalLinks';
import { useTheme } from '../styles/theme';

export default function PlansScreen({ navigation }) {
  const { colors } = useTheme();
  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const focused = useRef(false);
  const requestId = useRef(0);
  const statusRevision = useRef(0);
  const session = useRef(null);
  const actionPending = useRef(false);
  const text = { color: colors.text, lineHeight: 24 };
  const load = useCallback(async () => {
    const id = ++requestId.current;
    const revision = statusRevision.current;
    const current = () => focused.current && requestId.current === id;
    setError('');
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!current()) return;
      if (session.current !== token) {
        session.current = token;
        setCatalog(null); setStatus(null); setMessage('');
      }
      setSignedIn(Boolean(token));
      if (!token || !storeBilling) return;
      const result = await storeBilling.catalog();
      if (!current() || await getAuthToken() !== token) return;
      setCatalog(result);
      if (statusRevision.current === revision) setStatus(result);
    } catch (err) { if (current()) setError(err.message); }
    finally { if (current()) setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    setActing(actionPending.current);
    void load();
    const unsubscribe = storeBilling?.subscribe(value => {
      void getAuthToken().then(token => {
        if (!focused.current || !token || value.token !== token) return;
        if (value.status) { statusRevision.current++; setStatus(value.status); }
        if ('error' in value) setError(value.error);
        if ('message' in value) setMessage(value.message);
      }).catch(() => {});
    });
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { focused.current = false; requestId.current++; unsubscribe?.(); listener.remove(); };
  }, [load]));
  async function act(action) {
    if (actionPending.current) return;
    actionPending.current = true;
    const token = session.current;
    setActing(true); setError(''); setMessage('');
    try { await action(); }
    catch (err) { if (focused.current && session.current === token) setError(err.message); }
    finally { actionPending.current = false; if (focused.current) setActing(false); }
  }
  const disabled = busy || acting;
  return <Screen>
    <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '800' }}>AI Assistant Plans</Text>
    <Text style={text}>Start with Free. Choose Premium or Pro to unlock more on this same AI Assistant account.</Text>
    {status ? <Text style={text}>Current plan: {status.effective_plan?.toUpperCase() || 'Unavailable'}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={text}>{message}</Text> : null}
    {!signedIn ? <ActionButton title="Sign in to choose a plan" onPress={() => navigation.navigate('Login')} /> : null}
    {Platform.OS === 'web' ? <>
      <ActionButton title="Plans & Pricing" onPress={() => act(() => openAccountLink('plans'))} />
      {signedIn ? <ActionButton title="Manage website subscription" secondary onPress={() => act(() => openAccountLink('billing'))} /> : null}
    </> : <>
      {status?.purchase_block ? <Text style={text}>{status.purchase_block}</Text> : null}
      {status?.pending_intent ? <Text style={text}>A purchase is awaiting confirmation. Restore purchases or retry the same plan. Contact support if it remains unresolved.</Text> : null}
      {(catalog?.products || [{ plan: 'premium' }, { plan: 'pro' }]).map(item => <Panel key={item.plan}>
        <Text style={{ ...text, fontSize: 21, fontWeight: '700' }}>AI Assistant {item.plan === 'pro' ? 'Pro' : 'Premium'}</Text>
        <Text style={text}>{item.plan === 'pro' ? 'Higher usage limits, Discord, API access and Website Widget / Public Chatbot.' : 'More AI assistants, monthly messages and Knowledge Base storage.'}</Text>
        <Text style={text}>{item.offer ? `${item.offer.price} / month` : 'Store price currently unavailable'}</Text>
        <ActionButton title={`Choose ${item.plan === 'pro' ? 'Pro' : 'Premium'}`}
          disabled={disabled || !signedIn || !catalog?.available || !item.offer || Boolean(status?.purchase_block) ||
            Boolean(status?.pending_intent && (status.pending_intent.product_id !== item.product_id ||
              status.pending_intent.provider !== (Platform.OS === 'ios' ? 'apple' : 'google')))}
          onPress={() => act(() => storeBilling.purchase(item))} />
      </Panel>)}
      <Text style={text}>Monthly subscription, automatically renewed until canceled. Payment is charged to your {Platform.OS === 'ios' ? 'Apple' : 'Google Play'} account. Manage or cancel in your store subscription settings.</Text>
      <ActionButton title="Restore purchases" secondary disabled={disabled || !signedIn} onPress={() => act(() => storeBilling.restore())} />
      <ActionButton title="Manage store subscription" secondary disabled={disabled} onPress={() => act(() => storeBilling.manage())} />
      {[...new Set((status?.subscriptions || []).map(item => item.provider))].filter(provider =>
        provider !== (Platform.OS === 'ios' ? 'apple' : 'google')).map(provider =>
        <ActionButton key={provider} title={`Manage ${provider === 'apple' ? 'Apple' : 'Google Play'} subscription`}
          secondary onPress={() => act(() => openAccountLink(`${provider}Subscriptions`))} />)}
      <ActionButton title="Refresh account" secondary disabled={disabled || !signedIn} onPress={() => act(async () => { await storeBilling.refresh(); await load(); })} />
      {status?.stripe_managed ? <Text style={text}>This account has website billing. Contact support for help with that subscription.</Text> : null}
    </>}
    <ActionButton title="Privacy policy" secondary onPress={() => act(() => openAccountLink('privacy'))} />
    {Platform.OS === 'ios' ? <ActionButton title="Terms of use" secondary onPress={() => act(() => openAccountLink('terms'))} /> : null}
    <Text selectable style={text}>support@myaiassistantapp.se</Text>
  </Screen>;
}
