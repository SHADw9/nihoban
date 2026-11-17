# AGENTS.md

Nihoban: a Japanese-learning app, packaged for Android (Capacitor 8) and Linux (Electron). No bundler, no tests, no lint/typecheck.

## Source layout (`src/`)

- `src/index.html` is a **~2 KB shell**: metas, `<link>` to the two stylesheets, tiny body markup (`<header>`, `<main id="M">`, `<dialog id="DL">`), then `<script src>` tags — data first (`data/*.js`), then code (`js/*.js`). Never re-inline assets.
- `src/css/style.css` (all styles) and `src/css/fonts.css` (6 `@font-face` loading `src/fonts/*.woff2` — committed binary files: Klee One, Hind Siliguri, Noto Sans Bengali).
- `src/data/*.js` — gzipped+base64 datasets exposed as `window.NBD.<id>` globals: `d` (app core data), `so` (KanjiVG stroke order), `fq` (frequency corpus), `mn` (Minna vocab), `dg` (dialogue transcripts), `pd` (podcast transcripts). They are decoded at runtime by `dec(id)` in `js/core.js` (gzip via `DecompressionStream`).
- `src/js/` — in load order: `core.js` (app plumbing: `$`, state, SRS, routing), `ui.js` (2.0 redesign layer + base routes), `ai.js` (JLPT AI), then `feature-fq.js`, `feature-mn.js`, `feature-dg.js`, `feature-pd.js` (each registers its route/tile; e.g. pd → `#pd`, dg → `#dg`, freq → `#freq`, mn → `#mn`).
- `src/audio/` — dialogue (`d###.mp3`) and podcast (`podcast-<lv>-<nn>.ogg`) files.
- **Never read any file whole blindly** — `index.html` and the JS files are fine to read; locate things with `grep` and edit with narrow, exact-context replacements. `data/*.js` are single huge lines — never open them.
- `www/` is **generated** (gitignored). Never edit it. After changing `src/`, run `npm run prepare-www` (or `npm start`, which does it first).
- `scripts/prepare-www.mjs` wipes and rebuilds `www/`: copies `css/ js/ data/ fonts/ audio/` and writes `index.html` with `src/tts-bridge.js` injected as `<script src="tts-bridge.js">` right after the `<meta charset>` tag (falls back to after `<head>`, then to prepending). The injection is skipped if the string `tts-bridge.js` appears *anywhere* in the HTML — never mention that filename in `src/`, not even in a comment, and don't rename the file.
- `scripts/split-app.mjs` is a one-time migration that split the old 8 MB monolith into the layout above; it must not run again (it throws on the current shell — keep it only as history).
- No lockfile; CI uses plain `npm install`.
- To add a podcast episode: rebuild `src/data/pd.js` (gzipped+base64 `NBD.pd='…'`) from the transcript JSON — episodes carry their own `[ep#, level, durSec, title, [channel, url], utts]` credit tuple; compress audio as 64 k mono Opus `.ogg` into `src/audio/`.

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

- Fonts are committed woff2 files loaded via `css/fonts.css` — nothing to fetch at build time (the old `FETCH_FONTS` mechanism is gone).
- electron-builder config lives in the `build` key of `package.json`; it packages `electron/**` + `www/**` and excludes `@capacitor/*`.

## Desktop (Electron) quirks — `electron/main.js`

- Linux runs with `--no-sandbox` (AppImage + Ubuntu 24.04 userns restriction) and `enable-speech-dispatcher`. Single-instance lock; a second launch just focuses the first window.
- Native TTS chain: `spd-say` → `espeak-ng` → `espeak`; page falls back to Web Speech API. For local dev install: `sudo apt install speech-dispatcher espeak-ng`.
- External URLs are opened via `shell.openExternal`, never in-app (window-open + will-navigate are blocked). Keep it that way — the sandboxed preload (`electron/preload.js`) is the only bridge.

## Release flow (`.github/workflows/release.yml`)

- Any push to `main`/`master` builds APK + AppImage and publishes a GitHub release at `1.0.<run number>` (CI: Node 22, Java 21 temurin, ubuntu-22.04 for the Linux job). The Linux job rewrites `package.json` version via `npm pkg set` during CI, so local `npm run dist:linux` always yields `1.0.0`. A pushed `v*` tag overrides the version (e.g. `git tag v1.2.0 && git push --tags`).
- Markdown-only changes skip CI (`paths-ignore: ['**.md']`).
- APK signing uses the committed `android-signing/nihoban.jks` + `signing.env`; GitHub secrets (`ANDROID_KEYSTORE_BASE64`, etc.) take priority when set. **The repo must stay private** — the keystore in-tree can sign updates. Changing the signing key forces users to reinstall.
