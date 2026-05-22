# App Store Release Checklist

## App

- App name: 期待値トラッカー
- Bundle ID: com.pastadeteatime.evtracker
- Version: 1.1.17
- Build: 17
- Team ID: 483K9LU7Z4
- Platform: iOS
- Orientation: Portrait

## Local Release Checks

- `node --check app.js`
- `npm run build`
- `npm run cap:sync`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS -allowProvisioningUpdates archive`

## Current Signing Blocker

This Mac currently has no valid iOS code signing identities and no local provisioning profiles.

Open Xcode, sign in with the approved Apple Developer account, then let Xcode create or download the signing assets:

1. Open `ios/App/App.xcodeproj`.
2. Select target `App`.
3. Open `Signing & Capabilities`.
4. Confirm Team is `483K9LU7Z4`.
5. Confirm Bundle Identifier is `com.pastadeteatime.evtracker`.
6. Keep `Automatically manage signing` enabled.
7. Connect an iPhone once if Xcode asks for a development device.
8. Run Archive from Xcode after signing is resolved.

## App Store Connect Draft

- SKU: ev-tracker-ios
- Primary language: Japanese
- Category: Utilities or Finance
- Age rating: 17+
- Support URL: GitHub Pages support page
- Privacy policy URL: GitHub Pages privacy page

## Review Notes Draft

このアプリはパチンコ実戦時の回転数、投資、持ち玉、期待値を記録するための個人向けトラッカーです。アプリ内で賭博行為、換金、入金、景品交換、オンライン遊技は行えません。記録と計算のみを提供します。
