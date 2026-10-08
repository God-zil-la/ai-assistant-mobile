import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
const flush = () => new Promise(resolve => setImmediate(resolve));
function load(file, modules, globals = {}) {
  const { code } = transformSync(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
    configFile: false, babelrc: false,
    plugins: [[require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const exports = {};
  runInNewContext(code, { exports, ...globals, require: name => {
    assert.ok(name in modules, `Unexpected dependency ${name}`);
    return modules[name];
  } });
  return exports;
}

for (const platform of ['ios', 'android', 'web']) {
  test(`${platform}: persisted sign-in and sign-out notify recovery listeners`, async () => {
    const values = new Map();
    const storage = { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) || null, removeItem: key => values.delete(key) };
    const tokens = load('services/tokenService.js', {
      'react-native': { Platform: { OS: platform } },
      'expo-secure-store': { setItemAsync: async (...args) => storage.setItem(...args), getItemAsync: async key => storage.getItem(key), deleteItemAsync: async key => storage.removeItem(key) },
    }, { localStorage: storage });
    let notifications = 0;
    tokens.onAuthSessionChange(() => { throw new Error('A failing screen must not undo authentication'); });
    const unsubscribe = tokens.onAuthSessionChange(() => { notifications++; });
    await tokens.saveAuthSession('account-a', 'A');
    assert.equal(await tokens.getAuthToken(), 'account-a');
    await tokens.clearAuthSession();
    assert.equal(await tokens.getAuthToken(), null);
    assert.equal(notifications, 2);
    unsubscribe();
    await tokens.saveAuthSession('account-b', 'B');
    assert.equal(notifications, 2);
  });
}

test('purchase recovery runs after fresh login and removes subscriptions on unmount', async () => {
  let effect, authChange, appChange, token = null;
  let restores = 0;
  const observer = load('components/StorePurchaseObserver.js', {
    react: { useEffect: fn => { effect = fn; } },
    'react-native': { AppState: { addEventListener: (_name, fn) => { appChange = fn; return { remove() {} }; } } },
    '../services/storeBilling': { storeBilling: { restore: async explicit => { assert.equal(explicit, false); restores++; } } },
    '../services/tokenService': { getAuthToken: async () => token, onAuthSessionChange: fn => { authChange = fn; return () => { authChange = null; }; } },
  }).default;
  observer(); const cleanup = effect(); await flush();
  assert.equal(restores, 0);
  token = 'account-a'; authChange(); await flush();
  assert.equal(restores, 1);
  token = null; authChange(); await flush();
  assert.equal(restores, 1);
  token = 'account-b'; authChange(); await flush();
  assert.equal(restores, 2);
  cleanup(); appChange('active'); await flush();
  assert.equal(authChange, null);
  assert.equal(restores, 2);
});

function plansFixture(platform = 'ios') {
  const states = [], refs = [];
  let stateIndex, refIndex, focus, appChange, subscriber, cleanup;
  let token = 'account-a';
  const result = { effective_plan: 'free', available: true, products: [{ plan: 'pro', product_id: 'pro', offer: { price: '$1', token: 'offer' } }] };
  const calls = [];
  const billing = { catalog: async () => result, subscribe: fn => { subscriber = fn; return () => {}; },
    purchase: async () => { calls.push('purchase'); }, restore: async () => {}, manage: async () => {}, refresh: async () => {} };
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
      useRef: initial => refs[refIndex++] ||= { current: initial }, useCallback: fn => fn },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { Platform: { OS: platform }, Text: 'Text', AppState: { addEventListener: (_name, fn) => { appChange = fn; return { remove() {} }; } } },
    '@react-navigation/native': { useFocusEffect: fn => { focus = fn; } },
    '../services/storeBilling': { storeBilling: platform === 'web' ? null : billing },
    '../services/tokenService': { getAuthToken: async () => token },
    '../services/externalLinks': { openAccountLink: async key => calls.push(key) },
    '../styles/theme': { useTheme: () => ({ colors: {} }) },
  };
  for (const name of ['Screen', 'Panel', 'ActionButton']) modules[`../components/${name}`] = { __esModule: true, default: name };
  const component = load('screens/PlansScreen.js', modules).default;
  function render() {
    stateIndex = 0; refIndex = 0;
    const tree = component({ navigation: { navigate: route => calls.push(route) } });
    const nodes = [];
    function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== 'object') return; nodes.push(node); visit(node.props?.children); }
    visit(tree);
    return nodes;
  }
  return { billing, result, calls, states, render,
    mount: () => { render(); cleanup = focus(); }, unmount: () => cleanup(),
    foreground: () => appChange('active'), emit: value => subscriber(value), setToken: value => { token = value; },
    button: title => render().find(node => node.type === 'ActionButton' && node.props.title === title)?.props };
}

test('foreground catalog refresh cannot re-enable duplicate purchases during payment', async () => {
  const f = plansFixture(); f.mount(); await flush();
  let finish;
  f.billing.purchase = () => { f.calls.push('purchase'); return new Promise(resolve => { finish = resolve; }); };
  const pending = f.button('Choose Pro').onPress();
  f.foreground(); await flush();
  assert.equal(f.button('Choose Pro').disabled, true);
  await f.button('Choose Pro').onPress();
  assert.equal(f.calls.length, 1);
  finish(); await pending; f.unmount();
});

test('late catalog and purchase events cannot show A subscription after B signs in', async () => {
  const f = plansFixture();
  let finish;
  f.billing.catalog = () => new Promise(resolve => { finish = resolve; });
  f.mount(); await flush();
  f.setToken('account-b');
  finish({ ...f.result, effective_plan: 'pro' });
  f.emit({ token: 'account-a', status: { effective_plan: 'pro' }, message: 'Purchase verified.' });
  await flush();
  assert.equal(f.states[1], null);
  assert.equal(f.states[5], '');
  f.unmount();
});

test('sign-out clears catalog and disables purchases on foreground', async () => {
  const f = plansFixture(); f.mount(); await flush();
  assert.equal(f.button('Choose Pro').disabled, false);
  f.setToken(null); f.foreground(); await flush();
  assert.equal(f.states[0], null);
  assert.equal(f.states[1], null);
  assert.equal(f.button('Choose Pro').disabled, true);
  assert.equal(f.button('Restore purchases').disabled, true);
  f.unmount();
});

test('native Plans has no website purchase link; web retains pricing and billing', async () => {
  for (const platform of ['ios', 'android', 'web']) {
    const f = plansFixture(platform); f.result.stripe_managed = true; f.mount(); await flush();
    if (platform === 'web') {
      await f.button('Plans & Pricing').onPress();
      await f.button('Manage website subscription').onPress();
      assert.deepEqual(f.calls, ['plans', 'billing']);
    } else {
      assert.equal(f.button('Manage existing website subscription'), undefined);
      assert.equal(f.button('Plans & Pricing'), undefined);
      assert.ok(f.button('Manage store subscription'));
    }
    f.unmount();
  }
});
