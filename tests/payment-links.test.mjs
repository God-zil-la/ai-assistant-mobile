import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
function load(file, modules) {
  const { code } = transformSync(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
    configFile: false, babelrc: false,
    plugins: [[require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const exports = {};
  runInNewContext(code, { exports, require: name => {
    assert.ok(name in modules, `Unexpected dependency ${name}`);
    return modules[name];
  } });
  return exports;
}

for (const platform of ['ios', 'android', 'web']) {
  test(`${platform}: web purchases are restricted to web; support remains available`, async () => {
    const opened = [];
    const links = load('services/externalLinks.js', {
      'react-native': { Platform: { OS: platform }, Linking: { openURL: async url => opened.push(url) } },
      '../config/api': { API_BASE_URL: 'https://example.test' },
    });
    for (const key of ['billing', 'plans', 'website']) {
      if (platform === 'web') await links.openAccountLink(key);
      else await assert.rejects(links.openAccountLink(key), /Use Plans in the app/);
    }
    assert.deepEqual(opened, platform === 'web' ? [links.accountLinks.billing, links.accountLinks.plans, links.accountLinks.website] : []);
    for (const key of ['privacy', 'support', 'passwordReset', 'verification', 'deleteAccount', 'guide']) await links.openAccountLink(key);
    await links.openDiscordSetup(12);
    assert.equal(opened.length, platform === 'web' ? 10 : 7);
    assert.equal(opened.at(-1), 'https://example.test/bots/12/discord/setup/');
  });
}

function render(file, web, plan = 'free') {
  let cursor = 0;
  const calls = [];
  const bot = { id: 12, name: 'Assistant' };
  const user = { plan, username: 'test' };
  const states = file === 'screens/HomeScreen.js' ? [false, [bot], false, '', null, user]
    : file === 'screens/DashboardScreen.js' ? [{ current_plan: plan }, false, ''] : [];
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState: initial => [cursor in states ? states[cursor++] : (cursor++, initial), () => {}], useCallback: fn => fn },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': Object.fromEntries(['ActivityIndicator', 'RefreshControl', 'ScrollView', 'Text', 'View', 'TouchableOpacity', 'AppState'].map(x => [x, x])),
    '@react-navigation/native': { useFocusEffect: () => {} },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../services/externalLinks': { canOpenPurchaseLinks: web, openAccountLink: async key => calls.push(key), openDiscordSetup: async id => calls.push(`discord:${id}`) },
    '../services/authService': {}, '../services/botService': {}, '../services/tokenService': {}, '../services/parityService': {},
    '../utils/confirm': {}, '../config/assistantPreferences': { assistantIcon: () => '' },
    '../styles/theme': { useTheme: () => ({ colors: {} }), useThemedStyles: () => ({}), radius: {}, spacing: {} },
  };
  modules['react-native'].StyleSheet = { create: value => value };
  for (const name of ['ActionButton', 'Screen', 'Panel', 'CompactGrid', 'Footer', 'ThemeControl', 'AIConsentControl', 'WidgetSettings']) {
    modules[`../components/${name}`] = { __esModule: true, default: name };
    modules[`./${name}`] = { __esModule: true, default: name };
  }
  const component = load(file, modules).default;
  const tree = component({ route: { params: { user, bot, plan } }, navigation: { navigate: (...args) => calls.push(args) } });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return { nodes, calls, buttons: nodes.filter(n => n.type === 'ActionButton').map(n => n.props) };
}

test('upgrade and plan entry points remain visible for native and web accounts', () => {
  const screens = ['screens/AccountScreen.js', 'screens/DashboardScreen.js', 'screens/WelcomeScreen.js', 'screens/WidgetSettingsScreen.js', 'components/Footer.js'];
  const purchase = /Upgrade Plan|Manage Plan|Manage plan on website|Plans & Pricing|View Pro plan|www.myaiassistantapp.se/;
  for (const plan of ['free', 'premium', 'pro']) {
    for (const file of screens) {
      if (file !== 'screens/WidgetSettingsScreen.js' || plan !== 'pro') {
        assert.equal(render(file, false, plan).buttons.some(b => purchase.test(b.title)), file !== 'components/Footer.js', `${file}:${plan}`);
        assert.equal(render(file, true, plan).buttons.some(b => purchase.test(b.title)), true, `${file}:${plan}`);
      }
    }
  }
});

test('locked native features lead to upgrades; Pro features keep their working destinations', async () => {
  for (const plan of ['free', 'premium', 'pro']) {
    const { buttons, calls } = render('screens/HomeScreen.js', false, plan);
    const discord = buttons.find(b => /Discord/.test(b.title));
    const widget = buttons.find(b => /Widget/.test(b.title));
    assert.equal(discord.disabled, false);
    await widget.onPress();
    await discord.onPress();
    if (plan === 'pro') {
      assert.equal(calls[0][0], 'WidgetSettings');
      assert.equal(calls[0][1].plan, plan);
      assert.equal(calls[1], 'discord:12');
    } else {
      assert.deepEqual(calls, [['Plans'], ['Plans']]);
    }
  }
  const web = render('screens/HomeScreen.js', true);
  await web.buttons.find(b => /Discord/.test(b.title)).onPress();
  assert.deepEqual(web.calls, [['Plans']]);
});
