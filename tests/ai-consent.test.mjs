import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AI_CONSENT_VERSION, createConsentGate } from '../src/services/aiConsentCore.js';

function setup(overrides = {}) {
  const state = { value: null, token: 'account-a', asks: 0, writes: 0, sends: 0 };
  const gate = createConsentGate({
    read: async () => state.value,
    write: async value => { state.writes++; state.value = value; },
    currentToken: async () => state.token,
    ask: async () => { state.asks++; return true; },
    ...overrides,
  });
  const send = async () => { await gate.require(state.token); state.sends++; };
  return { state, gate, send };
}

test('permission is saved before sending and reused only for the same account and version', async () => {
  const { state, send } = setup();
  await send(); await send();
  assert.equal(state.asks, 1);
  assert.equal(state.sends, 2);
  assert.equal(JSON.parse(state.value).version, AI_CONSENT_VERSION);
  state.token = 'account-b';
  await send();
  assert.equal(state.asks, 2);
  state.value = JSON.stringify({ token: state.token, version: 0, allowed: true });
  await send();
  assert.equal(state.asks, 3);
});

test('decline, cancellation and privacy-details choice never save or send', async () => {
  for (const choice of [false, undefined, null]) {
    const { state, send } = setup({ ask: async () => choice });
    await assert.rejects(send(), error => error.status === 400 && /Nothing was sent/.test(error.message));
    assert.equal(state.writes, 0);
    assert.equal(state.sends, 0);
  }
});

test('storage read/write failures and malformed records fail closed', async () => {
  for (const overrides of [
    { read: async () => { throw new Error('locked'); } },
    { write: async () => { throw new Error('full'); } },
    { read: async () => '{invalid' },
  ]) {
    const { state, send } = setup(overrides);
    await assert.rejects(send(), /Nothing was sent/);
    assert.equal(state.sends, 0);
  }
});

test('withdrawal persists and requires a new affirmative choice', async () => {
  const { state, gate, send } = setup();
  await send(); await gate.revoke(); await send();
  assert.equal(state.asks, 2);
  const restored = setup({ read: async () => state.value, ask: async () => { throw new Error('must reuse'); } });
  await restored.send();
});

test('account switch, withdrawal, or backgrounding while prompt is open prevents sending', async () => {
  for (const change of ['account', 'revoke', 'background']) {
    let finish;
    let active = true;
    const { state, gate, send } = setup({ ask: () => new Promise(resolve => { finish = resolve; }), active: () => active });
    const pending = send();
    while (!finish) await new Promise(resolve => setImmediate(resolve));
    if (change === 'account') state.token = 'account-b';
    if (change === 'revoke') await gate.revoke();
    if (change === 'background') active = false;
    finish(true);
    await assert.rejects(pending, /Nothing was sent/);
    assert.equal(state.sends, 0);
  }
});

test('simultaneous operations do not share an unresolved prompt', async () => {
  let finish;
  const { state, send } = setup({ ask: () => new Promise(resolve => { finish = resolve; }) });
  const pending = send();
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(send(), /finish the OpenAI permission/);
  finish(false);
  await assert.rejects(pending);
  assert.equal(state.sends, 0);
});

test('withdrawal during a pending grant write cannot leave a persisted grant', async () => {
  let finish;
  let stored;
  const { gate, state, send } = setup({ write: async value => {
    if (JSON.parse(value).allowed) await new Promise(resolve => { finish = resolve; });
    stored = value;
  } });
  const pending = send();
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  await gate.revoke();
  finish();
  await assert.rejects(pending, /Nothing was sent/);
  assert.equal(JSON.parse(stored).allowed, false);
  assert.equal(state.sends, 0);
});
