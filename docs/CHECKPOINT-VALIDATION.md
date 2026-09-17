# Validation: native conversations, account help and resilience

Validated on Windows, Node 24.14.0, Expo SDK 57.0.23, from baseline `c9ded0e`.

| Check | Result |
| --- | --- |
| Service/session regression tests | 12 passing |
| Expo ESLint configuration | Passing, no errors or warnings |
| Expo Doctor | 21/21 checks passed |
| Expo dependency compatibility | Dependencies up to date (offline check; online Doctor also passed) |
| Expo export | iOS Hermes, Android Hermes and web bundles/assets exported successfully |
| Mobile-width web smoke test | Passing at 390 × 844 in headless Microsoft Edge, no page errors |
| Git whitespace check | Passing |
| Public production URLs | Privacy/reset/resend return 200; deletion redirects to sign-in as expected |

The browser smoke test intercepts every production API request with deterministic test data.
It verifies category selection and PATCH, returning from Edit to Home, global conversation search,
renaming, confirmed-send/history-fetch failure, uncertain-send draft retention, no automatic resend,
plan-limit 403 retaining the token, Account UI, offline launch/retry and 401 sign-out.
No production user, assistant, conversation or subscription was created or modified by these tests.

Run it again with `npm run export:all` followed by `npm run test:ui`.
The harness uses installed Microsoft Edge and writes screenshots under ignored `.expo/`.

## Dependency audit

`npm audit --omit=dev` reported ten moderate dependency findings, no high or critical findings,
in the Expo/config/CLI dependency chain through `xcode`/`uuid`. The installed `expo` (57.0.23),
`xcode` (3.0.1) and `uuid` (7.0.3) versions match the baseline lockfile.
Do not run `npm audit fix --force`: npm's proposed resolution includes a major downgrade to Expo 46.
Track a compatible upstream SDK/tooling fix separately. This audit is not an assertion that
the project is free of vulnerabilities.

## Still requiring device/live validation

- New authenticated production calls (category PATCH and conversation rename), using an authorized test account.
- iPhone keyboard/safe-area behavior, accessibility, share sheet and foreground return from Safari.
- Real account-deletion, password-reset and verification-email completion. Public GET checks only were run.
- Signed Xcode/EAS archive, provisioning and TestFlight. JavaScript export is not an IPA build.
- Remaining release gates in `NATIVE-READINESS.md`.
