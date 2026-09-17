# Web → Expo parity matrix

Initial audit: 2026-09-17. Source of truth: current local Django templates, CSS, inline JS, views, URL configuration, forms, models and serializers. Both repositories clean before work. SDK ~57.0.23; versioned SDK 57 documentation read. This matrix precedes implementation.

| Existing web function / source | Expo counterpart | Initial status / implementation requirement |
|---|---|---|
| Public Home (`dashboard/index.html`) | Welcome | Partial; feature descriptions, plans, footer links |
| Authenticated Home and Dashboard (`dashboard/views.py`, customer_dashboard) | Home + Dashboard | Missing real monthly messages, assistant/storage usage; expose same context to token auth |
| My Assistants (`bots/bot_list.html`, my_bots) | Home assistant list | CRUD exists; add created date, Knowledge, Discord and information guide access |
| Create/edit/delete; categories and limits (`BotForm`, bot API) | CreateBot/EditBot/CategoryPicker | Preserve; check duplicate validation and plan limits |
| Conversation list/new/open/history/delete/rename (playground JS and conversation API) | Conversations/Chat | Preserve endpoints and recovery handling |
| Existing Expo search/share | Conversations/Chat | Preserve; these exceed current web controls and are not new scope |
| Chat text formatting (playground renderMessage) | Chat | Plain text currently; match supported formatting |
| Knowledge document list and delete (playground) | Knowledge screen | Missing; owner-scoped token endpoints necessary |
| Knowledge TXT/PDF/DOCX upload, plan storage limits, embeddings | Document picker + existing backend pipeline | Missing; reuse current form/extraction/chunks/embeddings/usage/cleanup; no images |
| Knowledge explanation dialog | Native modal | Missing; port current explanation |
| Manual Knowledge records | List legacy records | Current form accepts text but current template has no text input: no new native text-input feature |
| Analytics: messages by assistant and by date | Analytics screen | Missing; expose exactly these two owner-scoped datasets, no expanded analytics |
| Login/register/email verification/session/logout | Existing auth screens/session services | Preserve; web links for email verification and recovery |
| Account, password recovery, deletion | Account & Help | Preserve secure website flow and return refresh |
| Billing/plan management (payments) | Existing website handoff | Add clear browser handoff; Stripe and store billing unchanged |
| Discord Pro setup/download and guides | Native entry to existing setup website | Add plan-aware access; bridge runs on desktop, website sign-in required |
| Theme (`styles.css`, base localStorage) | Shared persisted theme | Missing light; warm beige light/navy dark, follow system until user chooses |
| Navigation, footer, privacy/support/deletion/guide links | Shared navigation and native footer | Partial; complete links and routes |
| Panels/buttons/inputs/error/loading/success | Shared themed components and existing screens | Align web tokens/states; native safe areas/keyboard/responsive widths |
| Android/iOS identifiers | app.json | Preserve com.mrhusse.aiassistant for both |
| Staff admin, planned features, legacy Kotlin/WebView | Outside end-user Expo scope | Intentionally excluded |

Verification gate: npm test, lint, expo install --check, Expo Doctor, Android/iOS/web export, diff check, relevant isolated Django tests, runtime/UI preview where possible. No checkpoint until the complete block passes required checks. Physical Android/iOS verification and backend deployment must be reported separately; exports do not prove release readiness.
