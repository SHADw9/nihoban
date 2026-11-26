# AGENTS.md

Nihoban: a Japanese-learning app, packaged for Android (Capacitor 8) and Linux (Electron). No bundler, no tests, no lint/typecheck.

## Source layout (`src/`)

- `src/index.html` is a **~2 KB shell**: metas, `<link>` to the two stylesheets, tiny body markup (`<header>`, `<main id="M">`, `<dialog id="DL">`), then `<script src>` tags — data first (`data/*.js`), then code (`js/*.js`). Never re-inline assets.
- `src/css/style.css` (all styles) and `src/css/fonts.css` (7 `@font-face` loading `src/fonts/*.woff2` — committed binary files: Klee One, Hind Siliguri, Noto Sans Bengali, Anton).
- `src/data/*.js` — gzipped+base64 datasets exposed as `window.NBD.<id>` globals: `d` (app core data), `so` (KanjiVG stroke order), `fq` (frequency corpus), `mn` (Minna vocab), `dg` (dialogue transcripts), `pd` (podcast transcripts), `sfx` (Swap-the-suffix verb/adjective forms), `px` (prefixes with examples), `gc` (the N5 grammar course: 25 Minna no Nihongo I lessons plus the practice centre data and the course's scoped stylesheet), `gc4` (the N4 course: 25 Minna no Nihongo II lessons, 26–50, plus intro, bonus tables, differences recap and self-study routine, with its scoped stylesheet). They are decoded at runtime by `dec(id)` in `js/core.js` (gzip via `DecompressionStream`).
- `src/js/` — in load order: `core.js` (app plumbing: `$`, state, SRS, routing), `ui.js` (2.0 redesign layer + base routes), `ai.js` (JLPT AI), then `feature-fq.js`, `feature-mn.js`, `feature-dg.js`, `feature-pd.js`, `feature-sfx.js`, `feature-px.js`, `feature-gc.js` (each registers its route/tile; e.g. pd → `#pd`, dg → `#dg`, freq → `#freq`, mn → `#mn`, sfx → `#sfx`, px → `#px`, gc → `#gc` (levels) + `#gc-n5` + `#gc-n4` + `#gc-1`…`#gc-25` + `#gc-n4-26`…`#gc-n4-50` and the extra pages `#gc-intro|ref|ans|practice|vocab|kanji|basic|expr|tests` and `#gc-n4-intro|bonus|diff|routine`).
- **Grammar course (`#gc`), N5 = Minna no Nihongo I, N4 = Minna no Nihongo II.** `feature-gc.js` renders `NBD.gc` and `NBD.gc4`, the two Bengali guides (N5: intro, 25 lessons, reference, answers, practice centre, vocabulary/kanji search, N5 book pages and model tests; N4: intro, 25 lessons, bonus conjugation tables, a differences recap and a self-study routine). The page bodies are stored as-is and each course carries its own stylesheet in the same blob; it is rendered inside a **shadow root** (`#gcshell`), so the course's many `.sec/.jp/.bk-*` classes cannot leak into the app, while `--bg/--card/--ink/--acc/…` inherit in and every palette, M3 and dark mode apply. Because the shadow tree is outside the document, `trn` and the `.kj` kanji wrapper never touch course prose. Routes: `#gc` (level picker — N5 and N4 are live, N3–N1 open placeholders), `#gc-n5` / `#gc-n4` (covers + lesson maps), `#gc-1`…`#gc-25`, `#gc-n4-26`…`#gc-n4-50` (N4 lessons keep their Minna numbers), `#gc-intro|ref|ans|practice|vocab|kanji|basic|expr|tests`, and `#gc-n4-intro|bonus|diff|routine`. Course-internal `href="#lesson-N"` links are intercepted and mapped to app routes; `.jump` buttons scroll within the page; `.say` buttons speak through the global `say()`. Progress is `S.gcr`/`S.gcl` for N5 and `S.gcr4`/`S.gcl4` for N4 (lesson numbers 26–50). The `.gctop` frame (back link + level pill) is the only light-DOM styling, in `style.css`.
- `src/audio/` — podcast (`podcast-<lv>-<nn>.ogg`) files only. The Minna dialogues (`#dg`) have no audio files: `feature-dg.js` speaks each transcript line through `speechSynthesis`, which `tts-bridge.js` routes to Android native TTS / Linux spd-say (Web Speech fallback in a browser).
- **Never read any file whole blindly** — `index.html` and the JS files are fine to read; locate things with `grep` and edit with narrow, exact-context replacements. `data/*.js` are single huge lines — never open them.
- `www/` is **generated** (gitignored). Never edit it. After changing `src/`, run `npm run prepare-www` (or `npm start`, which does it first).
- `scripts/prepare-www.mjs` wipes and rebuilds `www/`: copies `css/ js/ data/ fonts/ audio/` plus `logo.svg` and writes `index.html` with `src/tts-bridge.js` injected as `<script src="tts-bridge.js">` right after the `<meta charset>` tag (falls back to after `<head>`, then to prepending). The injection is skipped if the string `tts-bridge.js` appears *anywhere* in the HTML — never mention that filename in `src/`, not even in a comment, and don't rename the file. It also bakes the build version into `<meta name="app-version">` and `www/version.json` from `$VERSION` (set by the Android CI job) or `package.json`; `ui.js` reads that meta for the in-app update check.
- **Update check.** Settings → Updates calls the public GitHub releases API (`SHADw9/nihoban`), compares `tag_name` with the baked version, and links the APK/AppImage assets. It auto-checks at most once a day and puts a dot on the settings gear when a newer release exists. This needs the repo/releases to stay publicly readable; failures are silent in the UI.
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
  on it) and `--onacc` (text on `--acc`); the reading/ink layer then adds `--shu`
  (red-ink text), `--shu-on` (the same on dark panels) and `--washi-img` (the
  paper-fibre background). JS inline styles use these names, so do not rename or
  drop them.
- **Structure of `style.css`.** Base `:root` (Sumi Ink light), the
  `prefers-color-scheme` + `[data-theme=dark]` blocks, then one block per palette,
  then the feature CSS, then the design layer at the *end*. The design layer
  overrides ordinary selectors; the earlier rules remain as fallbacks. Add new
  visual rules to the end so they win by source order.
- **Palettes (17).** `oxblood` (Oxblood & Sand, **the default**; `data-pal=oxblood`,
  a poster scheme), `washi` (Washi Paper), `atelier` (Sumi Ink; no `data-pal`
  attribute), `ai`, `zen`, `sakura`, `matcha`, `indigo`, `maroon`, `bengal`,
  `yoru`, `midnight`, `material` (Material You — see below), plus the other four
  poster schemes `suffix`, `pine`, `plum`, `saffron`. `yoru` and `midnight` are
  intentionally dark in every appearance mode (`color-scheme: dark`); the rest
  have light + dark (+ system) variants; the poster schemes are flat, Anton-labelled
  and suppress the washi grain. `PAL()` in `ui.js` holds the settings
  swatch metadata and `applyPal()` removes `data-pal` for `atelier`. Adding a
  scheme needs: a token block for light/dark/system in `style.css`, a `PAL()`
  row, and a contrast check.
- **Material 3 layer (`data-pal=material`).** Material You is a first-class theme
  scoped to `:root[data-pal=material]`, not a replacement for the print layer.
  Tokens map to M3 roles (`--bg` surface, `--card` surfaceContainer, `--ink`
  onSurface, `--mute` onSurfaceVariant, `--line` outlineVariant, `--acc` primary,
  `--mat` secondary, `--gold` tertiary, `--panel/--onpanel`
  primaryContainer/onPrimaryContainer) and its dark mode still uses the shared
  charcoal ground. The block adds `--m3-s1…s4` tonal steps, `--m3-pc/--m3-onpc`
  (derived with `color-mix` from the current tokens, so they follow light/dark),
  and `--m3-ease` for the standard easing curve. Components become M3: filled
  16px cards with no outline, filled/outlined pill buttons, outlined choice chips
  whose selected state also gets a `✓`, 56px outlined fields, a 28px dialog that
  is a bottom sheet with a drag handle on phones, a full-width 72px navigation
  bar whose active destination is a 64×32 indicator, and tonal study-grade
  buttons. `ui.js` adds a delegated `pointerdown` ripple (`m3Ripple`) that only
  runs in this theme and never under `prefers-reduced-motion`. Klee One is kept
  for display headings (brand expression) while UI copy uses `--ui`; no Roboto
  is bundled. The washi grain is suppressed here (not in the `applyPal()`
  texture list) and the texture slider is hidden, because M3 surfaces are flat
  tonal steps. Static field labels above inputs are a deliberate departure (the
  markup has no floating-label slot) and stay accessible via real `<label>`s.
- **Brand mark.** A cream torii with a rising sun sits in the vermilion hanko
  square. The header uses an inline SVG (`index.html`); the same artwork is
  `src/logo.svg` (favicon) and `assets/icon-*` / `build/icon.png` for packaging.
- **Paper texture and red ink.** `S.tex` is a 0–100 visibility level for the
  washi fibre grain: `applyPal()` writes `--washi-img` from `washi(S.tex)` (the
  two turbulence layers' `opacity`) and sets `data-tex` while it is above 0, so
  the grain works on *any* palette. Picking `washi` raises it to at least 60.
  `index.html` ships `data-pal="oxblood"` for a flash-free default (poster
  schemes suppress the grain), and the `S.wm` migrations walk old defaults
  forward: `atelier` → `washi` with the grain on (wm 1), then `washi` →
  `oxblood` (wm 2). Explicit picks of any other palette are left alone. `S.red`
  (`data-red`) inks **only kanji**: `core.js` wraps every kanji run in a
  `<span class="kj">` (a `MutationObserver` keeps up with re-renders) and the rule
  colors `.kj` in `--shu` — kana and furigana keep the normal `--mute`/`--ink`
  colors, the `header .brand i` seal and the settings swatch previews (`.pvs`)
  keep their own colors, and dark panels use `--shu-on`. The red-ink switch and
  the texture slider both live in settings and go through `applyPal()`.
- **Charcoal dark mode.** Every scheme — poster palettes included — renders dark
  mode on the same charcoal-black ground — `--bg:#1A1A1A`, `--card:#232323`,
  `--line:#3A3A3A`, ink `#EDEAE3`, mute `#A6A29A` — defined by the final
  charcoal block at the end of `style.css`. Only the accent tokens (`--acc
  --onacc --mat --gold --ok --no --cv --ck --cg --cq`) stay palette-specific, so
  themes keep their identity without tinting the surfaces. That block must stay
  last: the poster-scheme blocks are defined after the older charcoal block was,
  and only source order makes this win. `yoru`/`midnight` get the same charcoal
  in their always-dark mode.
- **Type.** `--jp` (Klee One) is used for display headings, brand, tiles, kanji
  and Japanese text; `--ui` (Hind Siliguri) for interface copy. Headings use
  Klee One; `h3` is a small uppercase section label — inside `<dialog>` the
  detail gloss `h3` is overridden back to body type.
- **Tiles & icons.** `tile()` / `tileb()` in `ui.js` render a related line icon
  inside `.tg` (`ic(name)`) in the feature's accent colour; the icon name is the
  second argument of each call, with `TGH` (route) and `TGK` (quiz kind) as
  fallbacks. `IC` in `ui.js` holds the shared 24×24 stroke paths (`text`, `grid`,
  `link`, `layers`, `chat`, `mic`, `spark`, `refresh`, …). The mobile dock uses
  the same `<svg class="ic">` icons — no `nav a::before` glyphs; the JLPT AI link
  is the 5th item.
- **Kanji grid readings.** `krd()` in `ui.js` prints the **first** on'yomi then
  the **first** kun'yomi, in hiragana, separated by ` / ` (`一 → いち / ひと-`;
  `日 → にち / ひ`). Okurigana dots are dropped (`ひと.つ → ひとつ`) while the
  leading/trailing `-` markers are kept; `.kc .krd` styles the line under the
  glyph.
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
