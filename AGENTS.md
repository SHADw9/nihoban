# AGENTS.md

Nihoban: a Japanese-learning app that is one giant HTML file, packaged for Android (Capacitor 8) and Linux (Electron). No bundler, no tests, no lint/typecheck.

## The app is `src/index.html`

- ~7.8 MB single file with all JS/CSS inline (~1080 lines, but single lines up to ~2.9M chars — e.g. line 212 is minified CSS/JS). Feature work happens here; there is nothing else to build. **Never read it whole** — locate code with `grep` and edit with narrow, exact-context replacements.
- `www/` is **generated** (gitignored). Never edit it. After changing `src/`, run `npm run prepare-www` (or `npm start`, which does it first).
- `scripts/prepare-www.mjs` copies `src/index.html` → `www/` and injects `src/tts-bridge.js` as `<script src="tts-bridge.js">` right after the `<meta charset>` tag (falls back to after `<head>`, then to prepending). The injection is skipped if the string `tts-bridge.js` appears *anywhere* in the HTML — never mention that filename in `src/index.html`, not even in a comment, and don't rename the file.
- No lockfile; CI uses plain `npm install`.

## Android native code lives in `android-overlay/`, not `android/`

- `android/` is gitignored, generated per-build by CI (`npx cap add android`).
- CI copies `android-overlay/java/com/nihoban/app/*.java` (MainActivity + NihobanTTSPlugin) into the generated project, patches `AndroidManifest.xml` with the `TTS_SERVICE` `<queries>` block, and sets `versionCode` = GitHub run number and `versionName` from the version. Change native behavior in `android-overlay/` and mirror any manifest/gradle edits in `.github/workflows/release.yml`.
- `capacitor.config.json` `webDir` is `www` — it reads the generated dir, not `src/`.

## Build / run

```bash
npm install
npm start             # desktop app (runs prepare-www first)
npm run dist:linux    # AppImage → dist-electron/
```

- `FETCH_FONTS=1 npm run prepare-www` bundles Google Fonts into the HTML (via `scripts/fetch-fonts.mjs`, with graceful fallback). CI always sets it; local builds don't, so locally fonts differ from release builds.
- electron-builder config lives in the `build` key of `package.json`; it packages `electron/**` + `www/**` and excludes `@capacitor/*`.

## Desktop (Electron) quirks — `electron/main.js`

- Linux runs with `--no-sandbox` (AppImage + Ubuntu 24.04 userns restriction) and `enable-speech-dispatcher`. Single-instance lock; a second launch just focuses the first window.
- Native TTS chain: `spd-say` → `espeak-ng` → `espeak`; page falls back to Web Speech API. For local dev install: `sudo apt install speech-dispatcher espeak-ng`.
- External URLs are opened via `shell.openExternal`, never in-app (window-open + will-navigate are blocked). Keep it that way — the sandboxed preload (`electron/preload.js`) is the only bridge.

## Release flow (`.github/workflows/release.yml`)

- Any push to `main`/`master` builds APK + AppImage and publishes a GitHub release at `1.0.<run number>` (CI: Node 22, Java 21 temurin, ubuntu-22.04 for the Linux job). The Linux job rewrites `package.json` version via `npm pkg set` during CI, so local `npm run dist:linux` always yields `1.0.0`. A pushed `v*` tag overrides the version (e.g. `git tag v1.2.0 && git push --tags`).
- Markdown-only changes skip CI (`paths-ignore: ['**.md']`).
- APK signing uses the committed `android-signing/nihoban.jks` + `signing.env`; GitHub secrets (`ANDROID_KEYSTORE_BASE64`, etc.) take priority when set. **The repo must stay private** — the keystore in-tree can sign updates. Changing the signing key forces users to reinstall.
