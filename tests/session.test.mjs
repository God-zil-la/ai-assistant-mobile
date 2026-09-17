import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreSession } from '../src/services/sessionRestore.js';

test('offline launch retains credentials; retry restores the same user', async () => {
  let cleared = false;
  const dependencies = { getToken: async () => 'saved', clear: async () => { cleared = true; },
    getUser: async () => { throw new Error('Offline'); } };
  await assert.rejects(restoreSession(dependencies), /Offline/);
  assert.equal(cleared, false);
  dependencies.getUser = async (token) => { assert.equal(token, 'saved'); return { username: 'Tester' }; };
  assert.deepEqual(await restoreSession(dependencies), { username: 'Tester' });
});
test('401 clears credentials; server and permission failures do not', async () => {
  for (const status of [401, 403, 500]) {
    let cleared = false;
    const operation = restoreSession({ getToken: async () => 'saved',
      getUser: async () => { throw Object.assign(new Error('Rejected'), { status }); },
      clear: async () => { cleared = true; } });
    if (status === 401) assert.equal(await operation, null);
    else await assert.rejects(operation);
    assert.equal(cleared, status === 401);
  }
});
