import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStoreBilling, offerFor } from '../src/services/storeBillingCore.js';

const owner = 'f5e0a6f0-2353-4ce6-9561-1c15a939a9af';

function fixture(provider = 'apple') {
  const calls = [];
  let token = 'account-a';
  let update;
  let failVerification = false;
  let purchases = [];
  let verificationResult = { verified: true, effective_plan: 'pro' };
  let verifyHook;
  let intentOwner = owner;
  let catalogResult = { products: [{ plan: 'pro', product_id: 'pro' }] };
  const adapter = {
    purchaseUpdatedListener(fn) { update = fn; calls.push('listener'); return { remove() {} }; },
    purchaseErrorListener() { return { remove() {} }; },
    async initConnection() { calls.push('connect'); return true; },
    async endConnection() {},
    async fetchProducts() { return [{ id: 'pro', displayPrice: '599,00 kr' }]; },
    async getAvailablePurchases() { return purchases; },
    async restorePurchases() { calls.push('restore'); },
    async finishTransaction() { calls.push('finish'); },
    async requestPurchase(value) { calls.push(value); },
    async deepLinkToSubscriptions() { calls.push('manage'); },
  };
  const api = async (path, body, account) => {
    calls.push({ path, body, account });
    if (path.startsWith('catalog')) return catalogResult;
    if (path === 'intent') return { account_token: intentOwner };
    if (path === 'verify') {
      if (failVerification) throw new Error('wrong account or unavailable');
      if (verifyHook) await verifyHook(account);
      return verificationResult;
    }
    return { effective_plan: 'pro' };
  };
  const billing = createStoreBilling({ adapter, api, getToken: async () => token, provider });
  return { billing, calls, adapter, update: p => update(p), setToken: t => { token = t; },
    setPurchases: p => { purchases = p; }, fail: () => { failVerification = true; },
    setVerification: value => { verificationResult = value; },
    setVerifyHook: fn => { verifyHook = fn; },
    setIntentOwner: value => { intentOwner = value; },
    setCatalog: value => { catalogResult = value; } };
}
const purchased = { id: 'tx', purchaseToken: 'google-token', productId: 'pro', purchaseState: 'purchased' };

test('listeners precede connection and purchase carries immutable Apple owner', async () => {
  const f = fixture();
  const catalog = await f.billing.catalog();
  assert.equal(catalog.products[0].offer.price, '599,00 kr');
  assert.ok(f.calls.indexOf('listener') < f.calls.indexOf('connect'));
  await f.billing.purchase(catalog.products[0]);
  const request = f.calls.find(x => x.type === 'subs');
  assert.equal(request.request.apple.appAccountToken, owner);
  assert.equal(request.request.apple.andDangerouslyFinishTransactionAutomatically, false);
});

test('restore verifies server-side before finishing and refreshing', async () => {
  const f = fixture();
  f.setPurchases([purchased]);
  await f.billing.restore();
  const verifyIndex = f.calls.findIndex(x => x.path === 'verify');
  assert.ok(verifyIndex < f.calls.indexOf('finish'));
  assert.equal(f.calls[verifyIndex].body.reference, 'tx');
  assert.equal(f.calls[verifyIndex].account, 'account-a');
});

test('wrong account or network failure leaves transaction unfinished for retry', async () => {
  const f = fixture();
  f.setPurchases([purchased]); f.fail();
  await assert.rejects(f.billing.restore(), /wrong account/);
  assert.ok(!f.calls.includes('finish'));
});

test('pending payment never grants or finishes', async () => {
  const f = fixture();
  const events = [];
  f.billing.subscribe(value => events.push(value));
  f.setPurchases([{ ...purchased, purchaseState: 'pending' }]);
  await f.billing.restore();
  assert.ok(events.some(x => /pending approval/.test(x.message)));
  assert.ok(!f.calls.some(x => x.path === 'verify'));
  assert.ok(!f.calls.includes('finish'));
});

test('existing store purchase blocks another purchase sheet', async () => {
  const f = fixture();
  f.setPurchases([purchased]);
  await assert.rejects(f.billing.purchase({ product_id: 'pro', offer: { price: '$59.99' } }), /existing store purchase/);
  assert.ok(!f.calls.some(x => x.path === 'intent' || x.type === 'subs'));
});

test('Google request uses configured offer and obfuscated owner', async () => {
  const f = fixture('google');
  await f.billing.purchase({ product_id: 'pro', offer: { price: '€59.99', token: 'offer' } });
  const request = f.calls.find(x => x.type === 'subs');
  assert.equal(request.request.google.obfuscatedAccountId, owner);
  assert.equal(request.request.google.subscriptionOffers[0].offerToken, 'offer');
  f.setPurchases([purchased]);
  await f.billing.restore();
  assert.equal(f.calls.find(x => x.path === 'verify').body.reference, 'google-token');
});

test('Google offer selection rejects mismatched base plan and ambiguous offers', () => {
  const offer = { basePlanIdAndroid: 'monthly', offerTokenAndroid: 'offer',
    pricingPhasesAndroid: { pricingPhaseList: [{ billingPeriod: 'P1M', recurrenceMode: 1, formattedPrice: '599 kr' }] } };
  assert.equal(offerFor({ subscriptionOffers: [offer] }, { base_plan_id: 'monthly' }, 'google').price, '599 kr');
  assert.equal(offerFor({ subscriptionOffers: [offer] }, { base_plan_id: 'annual' }, 'google'), null);
  assert.equal(offerFor({ subscriptionOffers: [offer, offer] }, { base_plan_id: 'monthly' }, 'google'), null);
});

test('signed-out client cannot restore or purchase', async () => {
  const f = fixture(); f.setToken(null);
  await assert.rejects(f.billing.purchase({}), /Sign in/);
  await assert.rejects(f.billing.restore(), /Sign in/);
  assert.equal(f.calls.length, 0);
});

test('session change before native payment prevents purchase', async () => {
  const f = fixture();
  f.adapter.getAvailablePurchases = async () => { f.setToken('account-b'); return []; };
  await assert.rejects(f.billing.purchase({ product_id: 'pro', offer: { price: '$59.99' } }), /account changed/);
  assert.ok(!f.calls.some(x => x.type === 'subs'));
});

for (const provider of ['apple', 'google']) {
  test(`${provider}: pending and unverified restores never report success or finish`, async () => {
    for (const mode of ['pending', 'server-pending', 'unverified', 'truthy-unverified']) {
      const f = fixture(provider);
      const events = [];
      f.billing.subscribe(value => events.push(value));
      f.setPurchases([{ ...purchased, purchaseState: mode === 'pending' ? 'pending' : 'purchased' }]);
      if (mode === 'server-pending') f.setVerification({ verified: true, pending: true });
      if (mode === 'unverified') f.setVerification({ verified: false });
      if (mode === 'truthy-unverified') f.setVerification({ verified: 'false' });
      if (mode.includes('unverified')) await assert.rejects(f.billing.restore(), /could not be verified/);
      else await f.billing.restore();
      assert.ok(!events.some(value => /Purchases verified|Purchase verified|Purchases restored/.test(value.message || '')), mode);
      assert.ok(!f.calls.includes('finish'), mode);
    }
  });

  test(`${provider}: account switch during verification cannot finish or publish A status to B`, async () => {
    const f = fixture(provider);
    const events = [];
    f.billing.subscribe(value => events.push(value));
    f.setPurchases([purchased]);
    f.setVerifyHook(async account => { assert.equal(account, 'account-a'); f.setToken('account-b'); });
    await assert.rejects(f.billing.restore(), /account changed/);
    assert.ok(!f.calls.includes('finish'));
    assert.ok(!events.some(value => value.status));
    assert.equal(f.calls.find(value => value.path === 'verify').account, 'account-a');
  });

  test(`${provider}: B restore rejection does not finish or announce success`, async () => {
    const f = fixture(provider);
    const events = [];
    f.billing.subscribe(value => events.push(value));
    f.setToken('account-b'); f.setPurchases([purchased]); f.fail();
    await assert.rejects(f.billing.restore(), /wrong account/);
    assert.ok(!f.calls.includes('finish'));
    assert.ok(!events.some(value => value.status || /restored|verified/.test(value.message || '')));
  });
}

test('listener verification errors are retained for the same account, without poisoning retries', async () => {
  const f = fixture();
  await f.billing.catalog();
  f.setVerification({ verified: false });
  f.update(purchased);
  await new Promise(resolve => setImmediate(resolve));
  const events = [];
  const unsubscribe = f.billing.subscribe(value => events.push(value));
  await new Promise(resolve => setImmediate(resolve));
  assert.match(events.at(-1).error, /could not be verified/);
  assert.equal(events.at(-1).message, '');
  unsubscribe();
  f.setToken('account-b');
  const other = [];
  const unsubscribeOther = f.billing.subscribe(value => other.push(value));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(other.length, 0);
  unsubscribeOther();
  f.setToken('account-a');
  f.setVerification({ verified: true, effective_plan: 'pro' });
  f.setPurchases([purchased]);
  await f.billing.restore();
  assert.ok(f.calls.includes('finish'));
});

test('queued listener events retain their arrival account after a switch', async () => {
  const f = fixture();
  await f.billing.catalog();
  let finish;
  f.setVerifyHook(() => new Promise(resolve => { finish = resolve; }));
  f.update(purchased);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof finish, 'function');
  f.update({ ...purchased, id: 'second' });
  await new Promise(resolve => setImmediate(resolve));
  f.setToken('account-b');
  finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(f.calls.filter(value => value.path === 'verify').map(value => value.account), ['account-a']);
  assert.ok(!f.calls.includes('finish'));
});

test('malformed purchase owner prevents both store payment sheets', async () => {
  for (const provider of ['apple', 'google']) {
    const f = fixture(provider); f.setIntentOwner(undefined);
    await assert.rejects(f.billing.purchase({ product_id: 'pro', offer: { price: '$1', token: 'offer' } }), /account could not be verified/);
    assert.ok(!f.calls.some(value => value.type === 'subs'));
  }
});

test('unconfigured catalog remains readable without connecting to the store', async () => {
  const f = fixture();
  f.setCatalog({ available: false, products: [{ product_id: 'pro' }] });
  const result = await f.billing.catalog();
  assert.equal(result.products[0].offer, null);
  assert.ok(!f.calls.includes('connect'));
});

test('double taps start only one payment sheet', async () => {
  const f = fixture();
  let finish;
  f.adapter.requestPurchase = async () => new Promise(resolve => { finish = resolve; });
  const purchase = f.billing.purchase({ product_id: 'pro', offer: { price: '$1' } });
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(f.billing.purchase({}), /already in progress/);
  finish(); await purchase;
});

for (const plan of ['premium', 'pro']) {
  test(`Google ${plan}: catalog SKU and monthly offer reach native billing unchanged`, async () => {
    const f = fixture('google');
    const productId = `com.mrhusse.aiassistant.${plan}.monthly`;
    const events = [];
    f.billing.subscribe(value => events.push(value));
    f.setCatalog({ available: true, products: [{ plan, product_id: productId, base_plan_id: 'monthly' }] });
    f.adapter.fetchProducts = async request => {
      assert.deepEqual(request, { skus: [productId], type: 'subs' });
      return [{ id: productId, subscriptionOffers: [{ basePlanIdAndroid: 'monthly', offerTokenAndroid: 'play-offer-token',
        pricingPhasesAndroid: { pricingPhaseList: [{ billingPeriod: 'P1M', recurrenceMode: 1, formattedPrice: 'Store price' }] } }] }];
    };
    const catalog = await f.billing.catalog();
    await f.billing.purchase(catalog.products[0]);
    const intent = f.calls.find(value => value.path === 'intent');
    assert.deepEqual(intent.body, { provider: 'google', product_id: productId });
    assert.deepEqual(f.calls.find(value => value.type === 'subs'), {
      type: 'subs', request: { google: { skus: [productId], obfuscatedAccountId: owner,
        subscriptionOffers: [{ sku: productId, offerToken: 'play-offer-token' }] } },
    });
    // Opening or resolving the payment sheet is not proof of payment.
    assert.ok(!events.some(value => value.status || /verified/.test(value.message || '')));
    assert.ok(!f.calls.includes('finish'));
    f.update({ ...purchased, productId, purchaseToken: 'verified-play-token' });
    await f.billing.disconnect();
    assert.deepEqual(f.calls.find(value => value.path === 'verify').body,
      { provider: 'google', reference: 'verified-play-token' });
    assert.ok(f.calls.includes('finish'));
  });
}

test('Google payment-sheet rejection does not grant or finish and permits retry', async () => {
  const f = fixture('google');
  const events = [];
  f.billing.subscribe(value => events.push(value));
  f.adapter.requestPurchase = async () => { throw new Error('Payment canceled'); };
  const item = { product_id: 'com.mrhusse.aiassistant.pro.monthly', offer: { price: 'Store price', token: 'offer' } };
  await assert.rejects(f.billing.purchase(item), /Payment canceled/);
  assert.ok(!events.some(value => value.status));
  assert.ok(!f.calls.includes('finish'));
  f.adapter.requestPurchase = async value => { f.calls.push(value); };
  await f.billing.purchase(item);
  assert.equal(f.calls.filter(value => value.type === 'subs').length, 1);
});
