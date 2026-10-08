export const AI_CONSENT_VERSION = 1;
export const AI_CONSENT_DISCLOSURE = 'AI Assistant sends your chat messages, relevant conversation history, assistant instructions, and relevant Knowledge Base content and document names to OpenAI to understand your request and generate answers. Knowledge Base document text and search queries are also sent to OpenAI to create embeddings for search. This includes any personal information in that content.\n\nAllow this sharing for chats and Knowledge Base uploads from this account on this iOS device? You can decline and still browse your account and existing content. You can withdraw permission in Account & Help. Withdrawal stops future requests from this device; it does not cancel requests already sent, erase data already shared, or change use on the web, other devices or integrations.';

export class AIConsentError extends Error {
  constructor(message = 'Nothing was sent. OpenAI sharing permission is required for this action.') {
    super(message);
    this.name = 'AIConsentError';
    // A local, confirmed refusal must not enter uncertain-delivery recovery.
    this.status = 400;
  }
}

export function createConsentGate({ read, write, currentToken, ask, active = () => true }) {
  let revision = 0;
  let pending = false;
  let withdrawn = false;
  async function sameSession(token, started) {
    if (!token || token !== await currentToken() || revision !== started || !active()) {
      throw new AIConsentError('Nothing was sent. Your session or sharing permission changed. Please try again.');
    }
  }
  return {
    async require(token) {
      if (pending) throw new AIConsentError('Nothing was sent. Please finish the OpenAI permission request first.');
      pending = true;
      const started = revision;
      try {
        await sameSession(token, started);
        const record = JSON.parse(await read() || 'null');
        if (withdrawn || record?.token !== token || record?.version !== AI_CONSENT_VERSION || record?.allowed !== true) {
          if (await ask() !== true) throw new AIConsentError();
          await sameSession(token, started);
          await write(JSON.stringify({ token, version: AI_CONSENT_VERSION, allowed: true, acceptedAt: new Date().toISOString() }));
          if (revision !== started) {
            await write(JSON.stringify({ version: AI_CONSENT_VERSION, allowed: false }));
          }
        }
        await sameSession(token, started);
        withdrawn = false;
      } catch (error) {
        if (error instanceof AIConsentError) throw error;
        throw new AIConsentError('Nothing was sent. Unable to verify or save OpenAI sharing permission. Please try again.');
      } finally { pending = false; }
    },
    async revoke() {
      revision++;
      withdrawn = true;
      // Persist a denial, even if no grant has been stored yet.
      await write(JSON.stringify({ version: AI_CONSENT_VERSION, allowed: false }));
    },
  };
}
