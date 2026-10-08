import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import * as core from '../src/services/aiConsentCore.js';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
function load(file, modules) {
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
  const { code } = transformSync(source, { configFile: false, babelrc: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] });
  const exports = {};
  runInNewContext(code, { exports, FormData: class { append() {} }, require: name => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  return exports;
}

test('Metro selects iOS gates and settings only on iOS', () => {
  const { resolve } = require('metro-resolver');
  const context = {
    originModulePath: fileURLToPath(new URL('../src/services/chatService.js', import.meta.url)),
    assetExts: new Set(), sourceExts: ['js'], preferNativePlatform: true,
    getPackageForModule: () => null,
    fileSystemLookup: path => existsSync(path)
      ? { exists: true, type: statSync(path).isDirectory() ? 'd' : 'f', realPath: path }
      : { exists: false },
  };
  for (const platform of ['ios', 'android', 'web']) {
    for (const specifier of ['./aiConsent', '../components/AIConsentControl']) {
      const result = resolve(context, specifier, platform);
      assert.equal(result.filePath.endsWith('.ios.js'), platform === 'ios');
    }
  }
});

test('real iOS adapter gates chat and multipart Knowledge; reads, deletes and reports stay available', async () => {
  let alert;
  let stored = null;
  let links = 0;
  const requests = [];
  const tokenModule = { getAuthToken: async () => 'account-a' };
  const consent = load('services/aiConsent.ios.js', {
    'react-native': { Alert: { alert: (...args) => { alert = args; } }, AppState: { currentState: 'active' } },
    'expo-secure-store': { getItemAsync: async () => stored, setItemAsync: async (_key, value) => { stored = value; } },
    './tokenService': tokenModule,
    './externalLinks': { openAccountLink: async () => { links++; } },
    './aiConsentCore': core,
  });
  const api = { request: async (...args) => { requests.push(args); return { id: 1, reported: true }; } };
  const chat = load('services/chatService.js', {
    '../config/api.js': { getBotChatEndpoint: () => '/chat/', getConversationEndpoint: () => '/conversation/' },
    './apiClient.js': api, './aiConsent': consent,
  });
  const knowledge = load('services/parityService.js', {
    'react-native': { Platform: { OS: 'ios' } }, 'expo-file-system': { File: class {} },
    '../config/api': { API_BASE_URL: '' }, './apiClient': api,
    './tokenService': tokenModule, './aiConsent': consent,
  });
  for (const action of [() => chat.sendChatMessage('account-a', 1, 'private draft'), () => knowledge.uploadKnowledge(1, { uri: 'local', name: 'private.pdf' })]) {
    for (const choice of ['Not now', 'Privacy policy', 'dismiss']) {
      alert = null;
      const pending = action();
      while (!alert) await new Promise(resolve => setImmediate(resolve));
      assert.match(alert[1], /OpenAI/);
      assert.equal(requests.length, 0);
      if (choice === 'dismiss') alert[3].onDismiss();
      else alert[2].find(button => button.text === choice).onPress();
      await assert.rejects(pending, /Nothing was sent/);
      assert.equal(stored, null);
      assert.equal(requests.length, 0);
    }
  }
  assert.equal(links, 2);
  const pending = chat.sendChatMessage('account-a', 1, 'approved');
  alert = null;
  while (!alert) await new Promise(resolve => setImmediate(resolve));
  alert[2].find(button => button.text === 'Allow sharing').onPress();
  await pending;
  assert.equal(requests.length, 1);
  assert.equal(JSON.parse(stored).allowed, true);
  await knowledge.uploadKnowledge(1, { uri: 'local', name: 'file.pdf' });
  assert.equal(requests.length, 2);
  await consent.revokeAIConsent();
  await knowledge.getKnowledge(1);
  await knowledge.deleteKnowledge(1, 2);
  await chat.reportAssistantResponse('account-a', 1, 2);
  assert.equal(requests.length, 5);
  assert.equal(JSON.parse(stored).allowed, false);
});
