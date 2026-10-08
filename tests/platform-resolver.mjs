import { registerHooks } from 'node:module';

// Match Metro's generic platform module for existing Node service regressions.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === './aiConsent' ? './aiConsent.js' : specifier, context);
  },
});
