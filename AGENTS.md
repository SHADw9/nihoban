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

## Visual system

The UI is a Japanese print-inspired layer: washi-paper ground, sumi-ink panels, a
vermilion hanko seal, hairline rules, and square genkō cells. It is implemented
entirely in `src/css/style.css`; no runtime CSS is injected.

- **Token contract.** Keep every existing token name: `--bg --card --ink --mute
  --line --pri --acc --mat --gold --ok --no --cv --ck --cg --cq --h1 --h2 --sh
  --jp --ui`. The redesign adds only `--panel` (ink surface), `--onpanel` (text
  on it) and `--onacc` (text on `--acc`). JS inline styles use these names, so do
  not rename or drop them.
- **Structure of `style.css`.** Base `:root` (Sumi Ink light), the
  `prefers-color-scheme` + `[data-theme=dark]` blocks, then one block per palette,
  then the feature CSS, then the design layer at the *end*. The design layer
  overrides ordinary selectors; the earlier rules remain as fallbacks. Add new
  visual rules to the end so they win by source order.
- **Palettes (10).** `atelier` (Sumi Ink, the default; no `data-pal` attribute),
  `ai`, `zen`, `sakura`, `matcha`, `indigo`, `maroon`, `bengal`, `yoru`,
  `midnight`. `yoru` and `midnight` are intentionally dark in every appearance
  mode (`color-scheme: dark`); the rest have light + dark (+ system) variants.
  `PAL()` in `ui.js` holds the settings swatch metadata and `applyPal()` removes
  `data-pal` for `atelier`. Adding a scheme needs: a token block for
  light/dark/system in `style.css`, a `PAL()` row, and a contrast check.
- **Charcoal dark mode.** Every scheme renders dark mode on the same
  charcoal-black ground — `--bg:#1A1A1A`, `--card:#232323`, `--line:#3A3A3A`,
  ink `#EDEAE3`, mute `#A6A29A` — defined by the final charcoal block at the
  end of `style.css`. Only the accent tokens (`--acc --onacc --mat --gold --ok
  --no --cv --ck --cg --cq`) stay palette-specific, so themes keep their
  identity without tinting the surfaces. That block must stay last: it uses the
  same specificity as the per-palette dark rules and wins by source order.
  `yoru`/`midnight` get the same charcoal in their always-dark mode.
- **Type.** `--jp` (Klee One) is used for display headings, brand, tiles, kanji
  and Japanese text; `--ui` (Hind Siliguri) for interface copy. Headings use
  Klee One; `h3` is a small uppercase section label — inside `<dialog>` the
  detail gloss `h3` is overridden back to body type.
- **Tiles & glyphs.** `tile()` / `tileb()` in `ui.js` render a Japanese glyph
  (`.tg`) instead of an icon: `TGH` maps route hashes, `TGK` maps quiz kinds.
  Nav icons are hidden on mobile and replaced with the kanji 家 学 本 歩 試 via
  `nav a:nth-child(n)::before`; the JLPT AI link is the 5th item.
- **Home goal.** The old SVG ring is a 30-cell genkō grid (`.ggrid`, 3×10),
  filled `Math.round(min(1, done/goal)*30)`. Keep the numeric due/new/goal text.
- **Sticky layers.** `.card` sticky players (Minna dialogues / podcast) sit at
  `top:62px` so they clear the sticky header. `nav` is fixed and lives inside
  `<header>`: never put `backdrop-filter`, `filter` or `transform` on `header`
  or on any ancestor, or the mobile nav will no longer stick to the viewport
  (the nav itself may blur). `body.focus` hides the nav during study/quiz.
- **Mobile dock.** Below 760px the nav is a floating dock: inset 14px from the
  sides, 12px above the safe area, 20px radius, `--panel` at 90% + blur, and a
  hairline of `--onpanel`; the active tab is a filled `--acc` pill with
  `--onacc` text. It floats over content, so `main` keeps ≥110px bottom
  padding.
- **Contrast.** UI copy is checked against its surface: `--ink`/`--bg` ≥ 7:1,
  `--mute`/`--bg` ≥ 4.5:1, `--onpanel`/`--panel` ≥ 7:1, `--onacc`/`--acc` ≥ 4.5:1.
  When you retune a palette, keep those ratios in both light and dark.

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
