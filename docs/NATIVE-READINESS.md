# Native feature inventory and release plan

Inventory date: 2026-09-17. Starting checkpoint: `c9ded0e`.
Compared all tracked Expo source/configuration files with the current local web repository
`ai-assistant-github` at `01c064a`, especially URL configuration, API views,
serializers, Bot model, account deletion flow and product README. The older
`ai-assistant` directory has an outdated API and was not used as the contract.
Local backend source is evidence of the contract, not proof of deployed behavior.

## Functionality

| Area | Starting native state | This block / remaining work |
| --- | --- | --- |
| Register, login, logout, email verification | Existing, user reports live-tested | Recovery and verification links, post-registration sign-in action, clear auth navigation stack |
| Session restore | Cleared token on every failure | Preserve token for network/server failures; retry screen; authenticated 401 clears session; 403 plan limits do not sign out |
| Profile and effective plan | Initial snapshot on Home | Refresh on Home focus; Account screen with refresh and foreground revalidation |
| Assistants | Name, description and personality CRUD; category fixed to general | Searchable category picker in create/edit, matching all Django choices; fix return navigation |
| Conversations | Per-assistant create/read/delete; no rename UI | Cross-assistant list, title/assistant search, latest first, focus/pull refresh, rename using existing PATCH |
| Chat | Plain text, saved history | Selectable messages, native transcript share sheet, timestamps, readable cyan bubbles, keyboard insets, explicit uncertain-delivery recovery |
| Privacy and help | No entry points | Account privacy/support/password recovery and browser handoff to actual password-confirmed deletion form |
| Knowledge upload/list/delete | Missing | Web session forms only. Add authenticated ownership-checked API reusing existing Knowledge service, then native TXT/PDF/DOCX picker and manual text |
| Usage and analytics | Missing | Expose account-wide authoritative usage/quotas and analytics via API; do not invent local quota counters |
| Templates | No native selection | Model exists in web code; expose curated templates if part of released web UX |
| API/Discord integration | Missing | Decide mobile scope; desktop bridge download is not a core native flow |
| Billing | Effective plan display only | Define App Store purchasing/entitlement approach for target storefronts; no Stripe/backend edits in this block |

## API contracts used

Same `https://www.myaiassistantapp.se` origin, Django users and `Authorization: Token …`.
No additional user store, production mutation during automated tests, token in browser URLs,
analytics SDK or silent mutation retries.

- `GET /accounts/api/me/`: username, email, effective plan.
- Existing register/login and bot CRUD routes unchanged.
- `GET/POST /bots/api/conversations/` and `GET/PATCH/DELETE /bots/api/conversations/<uuid>/`.
- Rename payload: `{ "title": "…" }`; maximum 200 characters; native UI requires a nonblank title.
- Chat `POST /bots/api/bot/<id>/chat/` retains `message` and `conversation_id`.
- 30-second request timeout, 90-second chat timeout. Aborting a request does not guarantee server cancellation.
- After an uncertain send, history must be refreshed before another send. The draft remains for user review;
  no automatic resend occurs. A confirmed send followed by a failed history GET does not restore the draft.
- Browser links use public origin paths `/privacy/`, `/accounts/password-reset/`,
  `/accounts/resend-verification/`, `/accounts/delete/`. The last requires browser sign-in and password confirmation.
  The native token is never transferred to the browser. Returning to Account revalidates the token.
- Category choices are a snapshot of `Bot.CATEGORY_CHOICES`; Django remains authoritative.

## Release gates (not completed by bundling JavaScript)

1. Test on a physical iPhone with the real existing account: login/verification, background/foreground,
   keyboard, VoiceOver, large text, airplane mode, quota and rate-limit errors, delete confirmations,
   native Share sheet, and browser account recovery/deletion. Use a disposable account for deletion.
2. Validate live rename and categories with an authorized test account. Do not mistake mocked UI tests
   for live integration tests.
3. Implement Knowledge and usage APIs and native screens before claiming parity with the relevant web features.
4. Review Apple's current rules for digital subscriptions and cross-platform access. Decide storefronts,
   StoreKit purchase/restore and server entitlement reconciliation before adding paid upgrade links.
5. Review privacy policy scope: current local policy names website and Android, but not iOS. Confirm
   App Privacy disclosures, retention, third-party AI processing disclosure and explicit consent where required.
6. Verify account-deletion handoff end to end, including backend billing/provider cleanup and session invalidation.
7. Replace/approve starter app icons and launch artwork; configure EAS project/Apple team/signing,
   build numbers, release version, encryption declaration and distribution profile. `eas.json` is a
   starting configuration, not a signed build or a linked EAS project.
8. Run a signed iOS archive and TestFlight smoke test. Supply screenshots, age rating, support/privacy URLs,
   review notes and a working review account in App Store Connect.

Sources checked: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
App Store readiness is not claimed until these release gates are satisfied.

## Checks

Run `npm test`, `npm run lint`, `npx expo install --check`, `npx expo-doctor`,
`npm run export:all`, and `git diff --check`. Export validates JavaScript/assets for
iOS, Android and web; it does not compile or sign an iOS binary.

Automated service tests cover production request contracts, nested error responses, 204 deletion,
authenticated 401 versus plan 403, non-JSON responses, timeouts, no automatic POST retry,
search/order and transcript content. See the checkpoint validation report for actual results.
