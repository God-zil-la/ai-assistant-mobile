// Exercise the real component's handlers with native primitives and hooks mocked.
// No browser substitutes for Android Alert behavior or new runtime dependencies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
const source = readFileSync(new URL('../src/components/ReportResponseButton.js', import.meta.url), 'utf8');
const { code } = transformSync(source, {
  configFile: false, babelrc: false,
  plugins: [
    [require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }],
    require.resolve('@babel/plugin-transform-modules-commonjs'),
  ],
});

function mount({ report = async () => ({ id: 1, reported: true }), token = 'test-token' } = {}) {
  const slots = [];
  let cursor = 0;
  let alert;
  const calls = [];
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: {
      useRef(value) {
        const index = cursor++;
        slots[index] ??= { current: value };
        return slots[index];
      },
      useState(value) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = value;
        return [slots[index], next => { slots[index] = next; }];
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Alert: { alert: (...args) => { alert = args; } } },
    './ActionButton': { __esModule: true, default: 'ActionButton' },
    '../styles/theme': { useTheme: () => ({ colors: { textMuted: '#888', error: '#f00' } }) },
    '../services/tokenService': { getAuthToken: async () => token },
    '../services/chatService': { reportAssistantResponse: async (...args) => { calls.push(args); return report(...args); } },
  };
  runInNewContext(code, { exports, require: name => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  const render = () => { cursor = 0; return exports.default({ conversationId: 'conversation-id', messageId: 42 }); };
  const button = () => render().props.children[0].props;
  const confirm = () => { button().onPress(); return alert[2].find(action => action.text === 'Report').onPress; };
  return { render, button, confirm, calls, get alert() { return alert; } };
}

test('report opens an in-app confirmation and cancel performs no write', () => {
  const ui = mount();
  ui.button().onPress();
  assert.equal(ui.alert[0], 'Report AI response?');
  assert.match(ui.alert[1], /copy of this response/);
  assert.equal(ui.alert[2].find(action => action.text === 'Cancel').style, 'cancel');
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.button().disabled, false);
});

test('confirmed report locks repeated taps then acknowledges successful delivery', async () => {
  let resolve;
  const ui = mount({ report: () => new Promise(done => { resolve = done; }) });
  const submit = ui.confirm();
  const pending = submit();
  await Promise.resolve();
  assert.equal(ui.button().title, 'Reporting...');
  assert.equal(ui.button().disabled, true);
  await submit();
  assert.deepEqual(ui.calls, [['test-token', 'conversation-id', 42]]);
  resolve({ id: 1, reported: true });
  await pending;
  assert.equal(ui.button().title, 'Response reported');
  assert.equal(ui.button().disabled, true);
  assert.match(ui.render().props.children[1].props.children, /received for review/);
});

test('failure keeps report retryable and shows server retry delay without false success', async () => {
  let fail = true;
  const ui = mount({ report: async () => {
    if (fail) throw Object.assign(new Error('Daily report limit reached.'), { retryAfter: 60 });
    return { id: 1, reported: true };
  } });
  await ui.confirm()();
  assert.equal(ui.button().disabled, false);
  assert.equal(ui.button().title, 'Report response');
  assert.match(ui.render().props.children[2].props.children, /Try again in 60 seconds/);
  fail = false;
  await ui.confirm()();
  assert.equal(ui.button().title, 'Response reported');
  assert.equal(ui.calls.length, 2);
});

test('expired session does not send an unauthenticated report', async () => {
  const ui = mount({ token: null });
  await ui.confirm()();
  assert.equal(ui.calls.length, 0);
  assert.match(ui.render().props.children[2].props.children, /session has expired/);
  assert.equal(ui.button().disabled, false);
});
