# Mobile feature inventory and release plan

Inventory date: 2026-09-17.

## Architecture decision

AI Assistant uses one shared Expo / React Native mobile codebase for both
Android and iOS.

This repository is the long-term mobile application:

- Android: Expo / React Native
- iOS: Expo / React Native
- Backend: existing Django production backend
- Accounts, assistants, conversations, plans and entitlements remain shared

The existing Kotlin / WebView Android application is the currently released
Google Play implementation and a reference for the current mobile product
scope. It is not the long-term Android architecture.

When this shared Expo application is verified for Android, it is intended to
replace the existing WebView implementation in a future Google Play update
while retaining the existing Android package identity.

New mobile product features should normally be implemented once in this shared
codebase and tested on both Android and iOS. Avoid creating separate Android-
only or iOS-only product implementations unless the operating system requires
platform-specific integration.

Platform-specific release work such as StoreKit, Google Play Billing,
TestFlight, signing and store metadata remains platform-specific.

## Current mobile release scope

The goal for the first shared mobile release is feature parity with the
currently approved mobile product scope, not implementation of every future
web feature.

Knowledge Base expansion, image upload, richer file handling and expanded
usage/analytics are planned as later shared Android + iOS improvements.
They are not blockers for the current mobile release scope.

Do not implement a feature only for iOS or only for Android merely to move one
platform ahead of the other. Product improvements should be planned as shared
mobile releases whenever practical.

## Functionality

| Area | Current shared mobile state | Release scope / remaining work |
| --- | --- | --- |
| Register, login, logout, email verification | Implemented | Verify on physical devices and store builds |
| Session restore | Implemented with network/server failure handling | Verify background/foreground and offline behavior on both platforms |
| Profile and effective plan | Implemented | Verify against real accounts and complimentary plans |
| Assistants | Native create/read/update/delete with searchable categories | Verify Android and iOS behavior |
| Conversations | Native cross-assistant history, search, create/read/rename/delete | Verify Android and iOS behavior |
| Chat | Native AI chat with saved history, sharing, timestamps and delivery recovery | Verify Android and iOS behavior |
| Privacy and help | Account privacy, support, password recovery and deletion handoff | Verify external browser/email behavior on both platforms |
| Knowledge Base | Existing production web flow remains available | Larger native Knowledge Base upgrade deferred to a later shared Android + iOS release |
| Usage and analytics | No authoritative native quota/storage API | Expanded native analytics deferred unless required for release compliance |
| Billing / subscriptions | Existing backend entitlements remain authoritative | Define compliant platform purchase/restore strategy without breaking existing web/Stripe subscriptions |
| Android replacement | Existing Google Play app is Kotlin/WebView | Verify shared Expo Android build before replacing it in a future Play update |
| iOS distribution | Shared Expo app | Complete signing, App Store Connect and TestFlight verification |

## Shared API contracts

The mobile application uses the same production origin:

`https://www.myaiassistantapp.se`

It uses the existing Django users, profiles, plans, assistants and
conversations. No parallel mobile user database or entitlement system should
be created.

Authentication uses the existing token-based native API.

Current native contracts include:

- `GET /accounts/api/me/`
- existing native register/login routes
- bot CRUD routes
- `GET/POST /bots/api/conversations/`
- `GET/PATCH/DELETE /bots/api/conversations/<uuid>/`
- `POST /bots/api/bot/<id>/chat/`

Django remains authoritative for ownership, plan limits, message processing
and effective plan state.

The native application must not invent local quota counters or entitlement
state that can disagree with the backend.

## Shared mobile development rule

For future product improvements:

1. Design the feature for the shared mobile product.
2. Implement shared behavior in Expo / React Native where practical.
3. Add platform-specific code only where Android or iOS requires it.
4. Test the feature on both Android and iOS.
5. Release equivalent product functionality to both mobile platforms.

Examples include future Knowledge Base improvements, image upload, richer
analytics and other assistant capabilities.

The objective is one maintainable mobile product, not two independently
evolving applications.

## Android transition

The existing Android application uses package:

`com.mrhusse.aiassistant`

The shared Expo application must retain:

`com.mrhusse.aiassistant`

when prepared to replace the current Google Play application.

Do not change the Android package identity as part of the migration.

Before replacing the WebView release:

1. Produce a signed Android build from this shared repository.
2. Verify upgrade compatibility with the existing Google Play application.
3. Test authentication/session persistence, assistants, conversations, chat,
   external links, keyboard behavior, offline handling and account flows.
4. Run the appropriate Google Play closed-test/release process.
5. Confirm that existing users receive an update rather than a separate app.

## iOS release work

The iOS application uses bundle identifier:

`com.mrhusse.aiassistant`

Before App Store release:

1. Test on a physical iPhone using authorized test accounts.
2. Verify login/verification, background/foreground behavior, keyboard,
   accessibility, offline behavior, errors, sharing and account flows.
3. Review Apple's current rules for digital subscriptions and cross-platform
   access before exposing paid upgrade actions.
4. Review privacy policy and App Privacy disclosures for iOS.
5. Verify account deletion end to end.
6. Approve final app icon and launch presentation.
7. Configure Apple signing, build numbers and App Store Connect metadata.
8. Produce a signed build and complete a TestFlight smoke test.
9. Supply screenshots, age rating, support/privacy URLs, review notes and a
   working review account.

## Platform-specific commerce

The product uses shared backend plans and entitlements.

Web/Stripe behavior must not be casually changed while implementing mobile
store purchasing.

Apple App Store and Google Play purchase requirements must be handled as
platform-specific commerce integrations feeding the same authoritative backend
entitlement model.

The user should ultimately receive the same product plan and capabilities
regardless of which supported platform granted the entitlement.

Purchase implementation is a release/compliance task and must not create
separate product feature sets for Android and iOS.

## Deferred shared improvements

The following are intentionally deferred until after the current mobile release
scope unless they become required for store approval:

- richer native Knowledge Base management
- image upload
- expanded document/file handling
- authoritative native Knowledge Base storage usage
- expanded native usage/analytics
- additional assistant capabilities not present in the current release scope

When implemented, these should be developed as shared Android + iOS mobile
features.

## Verification

For shared JavaScript/application verification run:

`npm test`

`npm run lint`

`npx expo install --check`

`npx expo-doctor`

`npm run export:all`

`git diff --check`

JavaScript export does not replace signed-device testing.

Android release verification additionally requires a signed Android build and
device/Google Play testing.

iOS release verification additionally requires a signed iOS build and
physical-device/TestFlight testing.

Store readiness is not claimed until the relevant platform release gates have
been completed.