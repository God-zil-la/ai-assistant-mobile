// The provider adapter is injected so lifecycle and ownership behavior can be tested.
export function offerFor(product, item, provider) {
  if (provider === 'apple') return product?.displayPrice ? { price: product.displayPrice } : null;
  const offers = product?.subscriptionOffers?.filter(offer =>
    offer.basePlanIdAndroid === item.base_plan_id && offer.offerTokenAndroid &&
    offer.pricingPhasesAndroid?.pricingPhaseList?.length === 1 &&
    offer.pricingPhasesAndroid.pricingPhaseList[0].billingPeriod === 'P1M' &&
    offer.pricingPhasesAndroid.pricingPhaseList[0].recurrenceMode === 1) || [];
  // This release sells the regular monthly base plan, without introductory offers.
  return offers.length === 1 ? {
    price: offers[0].pricingPhasesAndroid.pricingPhaseList[0].formattedPrice,
    token: offers[0].offerTokenAndroid,
  } : null;
}

export function createStoreBilling({ adapter, api, getToken, provider }) {
  let connection;
  let updateListener;
  let errorListener;
  let queue = Promise.resolve();
  let purchasing = false;
  let lastEvent;
  const observers = new Set();
  const notify = (fn, value) => {
    // A screen failure must not break transaction processing or retry recovery.
    try { fn(value); } catch { /* The screen owns its rendering errors. */ }
  };
  async function emit(value, token) {
    if (!token || await getToken() !== token) return;
    lastEvent = { ...value, token };
    observers.forEach(fn => notify(fn, lastEvent));
  }

  async function tokenNow() {
    const token = await getToken();
    if (!token) throw new Error('Sign in to your AI Assistant account to continue.');
    return token;
  }

  async function sameSession(token) {
    if (!token || await getToken() !== token) {
      throw new Error('Your account changed. Sign in again before continuing.');
    }
  }

  async function deliver(purchase, token) {
    await sameSession(token);
    if (purchase.purchaseState === 'pending') {
      await emit({ error: '', message: 'Payment is pending approval. Your plan unlocks after the store confirms payment.' }, token);
      return 'pending';
    }
    if (purchase.purchaseState !== 'purchased') return 'unconfirmed';
    const reference = provider === 'apple' ? purchase.id : purchase.purchaseToken;
    if (!reference) throw new Error('The store did not return a purchase reference. Try Restore purchases.');
    const result = await api('verify', { provider, reference }, token);
    await sameSession(token);
    if (result?.verified !== true) throw new Error('The purchase could not be verified. Try Restore purchases again.');
    if (result.pending) {
      await emit({ error: '', message: 'Payment is pending verification. Your plan has not been confirmed.' }, token);
      return 'pending';
    }
    // The backend durably owns the entitlement before finishing the native transaction.
    await adapter.finishTransaction({ purchase, isConsumable: false });
    await sameSession(token);
    await emit({ status: result, error: '', message: 'Purchase verified. Your account has been refreshed.' }, token);
    return 'verified';
  }

  function enqueue(purchase, session) {
    const result = queue.then(async () => {
      const token = await session;
      try { return await deliver(purchase, token); }
      catch (error) {
        await emit({ error: error.message, message: '' }, token);
        throw error;
      }
    });
    // Retain the error for this account while keeping later retries runnable.
    queue = result.catch(() => {});
    return result;
  }

  async function connect() {
    if (!connection) {
      updateListener = adapter.purchaseUpdatedListener(purchase => {
        // Capture the session when the event arrives, not when the queue drains.
        const session = getToken().catch(() => null);
        void enqueue(purchase, session).catch(() => {});
      });
      errorListener = adapter.purchaseErrorListener(error => {
        purchasing = false;
        if (['pending', 'deferred-payment'].includes(error.code)) {
          void getToken().then(token => emit({ error: '', message: 'Payment is pending approval. Your plan unlocks after the store confirms payment.' }, token)).catch(() => {});
          return;
        }
        void getToken().then(token => emit({ error: error.code === 'user-cancelled' ? '' : error.message,
          message: error.code === 'user-cancelled' ? 'Purchase canceled. You have not been upgraded.' : '' }, token)).catch(() => {});
      });
      connection = adapter.initConnection().then(result => {
        if (!result) throw new Error('Unable to connect to the store.');
      }).catch(error => {
        updateListener?.remove(); errorListener?.remove(); connection = null;
        throw error;
      });
    }
    await connection;
  }

  async function restore(explicit = true) {
    const token = await tokenNow();
    try {
      await connect();
      await sameSession(token);
      if (explicit) await adapter.restorePurchases();
      const purchases = await adapter.getAvailablePurchases();
      const outcomes = [];
      for (const purchase of purchases) outcomes.push(await enqueue(purchase, token));
      await sameSession(token);
      const status = await api('status', {}, token);
      await sameSession(token);
      const confirmed = outcomes.length > 0 && outcomes.every(outcome => outcome === 'verified');
      const message = confirmed ? 'Purchases verified and account refreshed.'
        : outcomes.length ? 'Some purchases are still awaiting confirmation. Your plan has not been confirmed.'
          : 'No purchases found for this store account.';
      await emit({ status, error: '', message }, token);
      return status;
    } catch (error) {
      await emit({ error: error.message, message: '' }, token);
      throw error;
    }
  }

  return {
    subscribe(fn) {
      observers.add(fn);
      void getToken().then(token => {
        if (observers.has(fn) && lastEvent?.token === token) notify(fn, lastEvent);
      }).catch(() => {});
      return () => observers.delete(fn);
    },
    async catalog() {
      const token = await tokenNow();
      const catalog = await api(`catalog?provider=${provider}`, undefined, token);
      await sameSession(token);
      if (!Array.isArray(catalog?.products)) throw new Error('The store catalog is unavailable. Please try again.');
      if (catalog.available === false) return { ...catalog, products: catalog.products.map(item => ({ ...item, offer: null })) };
      await connect();
      const products = await adapter.fetchProducts({ skus: catalog.products.map(p => p.product_id), type: 'subs' });
      await sameSession(token);
      return { ...catalog, products: catalog.products.map(item => ({ ...item,
        offer: offerFor(products.find(p => p.id === item.product_id), item, provider) })) };
    },
    async purchase(item) {
      if (purchasing) throw new Error('A purchase is already in progress.');
      purchasing = true;
      try {
        const token = await tokenNow();
        await connect();
        // Detect purchases made on this store account before launching a new sheet.
        const existing = await adapter.getAvailablePurchases();
        for (const purchase of existing) await enqueue(purchase, token);
        if (existing.some(p => ['pending', 'purchased'].includes(p.purchaseState))) {
          throw new Error('An existing store purchase was found. Refresh or manage that subscription.');
        }
        if (!item.offer?.price) throw new Error('This monthly plan is not available from the store yet.');
        await sameSession(token);
        const intent = await api('intent', { provider, product_id: item.product_id }, token);
        await sameSession(token);
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent?.account_token || '')) {
          throw new Error('The purchase account could not be verified. No payment was started.');
        }
        if (provider === 'google' && !item.offer.token) throw new Error('The store offer is unavailable. No payment was started.');
        await adapter.requestPurchase({ type: 'subs', request: provider === 'apple'
          ? { apple: { sku: item.product_id, appAccountToken: intent.account_token,
            andDangerouslyFinishTransactionAutomatically: false } }
          : { google: { skus: [item.product_id], obfuscatedAccountId: intent.account_token,
            subscriptionOffers: [{ sku: item.product_id, offerToken: item.offer.token }] } } });
      } finally { purchasing = false; }
    },
    restore,
    async refresh() {
      const token = await tokenNow();
      const status = await api('status', {}, token);
      await sameSession(token);
      await emit({ status, error: '', message: '' }, token);
      return status;
    },
    async manage(productId) {
      await connect();
      await adapter.deepLinkToSubscriptions(provider === 'google'
        ? { packageNameAndroid: 'com.mrhusse.aiassistant', ...(productId ? { skuAndroid: productId } : {}) }
        : undefined);
    },
    async disconnect() {
      await queue;
      updateListener?.remove(); errorListener?.remove();
      if (connection) await adapter.endConnection();
      connection = null;
    },
  };
}
