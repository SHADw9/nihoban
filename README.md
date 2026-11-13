# Nihoban – Android APK + Linux AppImage

`src/index.html` is the app. Everything else packages it:

| Target  | Tool                        | Output                              |
|---------|-----------------------------|-------------------------------------|
| Android | Capacitor 8                 | `Nihoban-<version>.apk`             |
| Linux   | Electron + electron-builder | `Nihoban-<version>-x86_64.AppImage` |

## Releasing
Push to `main`/`master` → GitHub Actions builds both and publishes release `v1.0.<run number>`.
To pick the version: `git tag v1.2.0 && git push --tags`.
To update the app, replace `src/index.html` and push.

## Signing (so updates install over old versions)
`android-signing/nihoban.jks` + `signing.env` sign every APK, so every release has the same signature.
**Keep the GitHub repo private**, or anyone could sign APKs as you. Back the keystore up – if it is lost,
users must uninstall before updating.
To use GitHub secrets instead (safer): add `ANDROID_KEYSTORE_BASE64` (`base64 -w0 your.jks`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, then delete `android-signing/`
from the repo. Secrets take priority when present. (Switching keys later also forces a reinstall.)

## Native Japanese TTS
`src/tts-bridge.js` is injected at build time and routes the page's `speechSynthesis` calls to:
- **Android**: the system TextToSpeech engine through our own plugin
  (`android-overlay/.../NihobanTTSPlugin.java`, no third-party dependency). If no Japanese voice is
  installed, the app opens the system voice-data installer once.
- **Linux**: `spd-say`, then `espeak-ng`/`espeak`: `sudo apt install speech-dispatcher espeak-ng`
- Falls back to the browser Web Speech API if the native engine fails.

## Fonts
CI downloads the Google Fonts (Noto Sans JP, Noto Sans Bengali, Hind Siliguri) and bundles them, so the
apps look the same offline. If the download fails the build continues with online/system fonts.

## Local dev
```bash
npm install
npm start               # desktop app
npm run dist:linux      # AppImage into dist-electron/
```
