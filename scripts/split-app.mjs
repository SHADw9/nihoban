// One-time migration: split the monolithic src/index.html into
//   src/css/{fonts,style}.css  src/fonts/*.woff2  src/data/*.js  src/js/*.js
// and rewrite src/index.html as a thin shell referencing them.
// Data blocks become window.NBD[<id>] globals; dec() in js/core.js reads them.
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';

const src = readFileSync('src/index.html', 'utf8');

// ---- locate all top-level blocks -------------------------------------------
const blocks = [];
{
  const re = /<(style|script)([^>]*)>/g;
  let m;
  while ((m = re.exec(src))) {
    const close = m[1] === 'style' ? '</style>' : '</' + 'script>';
    const end = src.indexOf(close, m.index);
    if (end < 0) throw new Error('unclosed block at ' + m.index);
    blocks.push({ tag: m[1], attrs: m[2], start: m.index, openEnd: m.index + m[0].length, end: end + close.length });
    re.lastIndex = end; // skip past close so inner "<script id=..>" comment text is not matched as a block
  }
}

// guard: the pd feature comment mentions data blocks; make sure we only treat
// real octet-stream data blocks as data
const isData = (b) => b.tag === 'script' && /type="application\/octet-stream"/.test(b.attrs);
const dataBlocks = blocks.filter(isData);
const codeBlocks = blocks.filter((b) => b.tag === 'script' && !isData(b));
const styleBlock = blocks.find((b) => b.tag === 'style');
if (!styleBlock) throw new Error('no style block');

// ---- 1. fonts ---------------------------------------------------------------
const styleInner = src.slice(styleBlock.openEnd, styleBlock.end - 8);
const faces = styleInner.match(/@font-face\s*{[^}]*}/g) || [];
if (!faces.length) throw new Error('no @font-face found');
mkdirSync('src/fonts', { recursive: true });
mkdirSync('src/css', { recursive: true });
mkdirSync('src/data', { recursive: true });
mkdirSync('src/js', { recursive: true });

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let fontsCss = '/* Offline fonts: Klee One (JP default), Hind Siliguri (UI), Noto Sans Bengali */\n';
const seen = new Map();
for (const f of faces) {
  const fam = f.match(/font-family:'([^']+)'/)[1];
  const weight = f.match(/font-weight:(\d+)/)[1];
  const fontStyle = (f.match(/font-style:(\w+)/) || [, 'normal'])[1];
  const b64 = f.match(/base64,([A-Za-z0-9+/=]+)\)/)[1];
  let name = slug(fam) + '-' + weight;
  const n = (seen.get(name) || 0) + 1;
  seen.set(name, n);
  if (n > 1) name += '-' + n;
  writeFileSync('src/fonts/' + name + '.woff2', Buffer.from(b64, 'base64'));
  fontsCss += `@font-face{font-family:'${fam}';font-style:${fontStyle};font-weight:${weight};font-display:swap;src:url('../fonts/${name}.woff2') format('woff2')}\n`;
  console.log('font:', name + '.woff2', (b64.length * 3 / 4 / 1024 | 0) + ' KB');
}
writeFileSync('src/css/fonts.css', fontsCss);

// ---- 2. css (style block minus the @font-face entries) ----------------------
const css = styleInner.replace(/\/\* Offline-embedded fonts[^\n]*\n/, '').replace(/@font-face\s*{[^}]*}/g, '').trim() + '\n';
writeFileSync('src/css/style.css', css);
console.log('css/style.css:', (css.length / 1024 | 0) + ' KB');

// ---- 3. data blocks -> src/data/<id>.js -------------------------------------
// de-dupe: later blocks with the same id are stale leftovers (loader reads the first)
const seenIds = new Set();
const keptData = [];
for (const b of dataBlocks) {
  const id = (b.attrs.match(/id="([^"]+)"/) || [])[1];
  if (!id) throw new Error('data block without id');
  if (seenIds.has(id)) { console.log('dropping stale duplicate data block id=' + id, '(' + (b.end - b.start) + ' bytes)'); continue; }
  seenIds.add(id);
  keptData.push({ id, body: src.slice(b.openEnd, b.end - 9).trim() });
}
for (const { id, body } of keptData) {
  writeFileSync('src/data/' + id + '.js',
    '/* Nihoban data: gzipped+base64 JSON, decoded by dec(\'' + id + '\') */\n' +
    'window.NBD=window.NBD||{};NBD.' + id + "='" + body + "';\n");
  console.log('data/' + id + '.js:', (body.length / 1024 | 0) + ' KB (b64)');
}

// ---- 4. code blocks -> src/js/ ----------------------------------------------
const codeNames = ['core', 'ui', 'ai', 'feature-fq', 'feature-mn', 'feature-dg', 'feature-pd'];
if (codeBlocks.length !== codeNames.length) throw new Error('expected ' + codeNames.length + ' code blocks, found ' + codeBlocks.length);
const jsFiles = codeBlocks.map((b, i) => {
  const body = src.slice(b.openEnd, b.end - 9);
  const name = 'src/js/' + codeNames[i] + '.js';
  writeFileSync(name, body.trimEnd() + '\n');
  console.log('js/' + codeNames[i] + '.js:', (body.length / 1024 | 0) + ' KB');
  return { name: codeNames[i], body };
});

// ---- 5. patch dec() in core.js ----------------------------------------------
const core = jsFiles.find((f) => f.name === 'core').body;
const OLD_DEC = "const dec=async id=>{const b=atob($('#'+id).textContent.trim());";
const NEW_DEC = "const dec=async id=>{const el=document.getElementById(id);const raw=((window.NBD||{})[id]!=null?(window.NBD||{})[id]:(el?el.textContent:'')).trim();const b=atob(raw);";
if (!core.includes(OLD_DEC)) throw new Error('dec() pattern not found in core');
writeFileSync('src/js/core.js', core.replace(OLD_DEC, NEW_DEC));
console.log('dec() patched in core.js');

// ---- 6. refresh stale doc comments ------------------------------------------
const commentFixes = [
  ['embedded gzipped in <script id="fq">', 'loaded from data/fq.js'],
  ['embedded gzipped in <script id="mn">', 'loaded from data/mn.js'],
  ['embedded gzipped in <script id="dg">', 'loaded from data/dg.js'],
  ['transcript gzipped in <script id="pd">', 'transcript loaded from data/pd.js'],
];
for (const [a, b] of commentFixes) {
  for (const f of codeNames) {
    const p = 'src/js/' + f + '.js';
    const c = readFileSync(p, 'utf8');
    if (c.includes(a)) writeFileSync(p, c.split(a).join(b));
  }
}

// ---- 7. rebuild src/index.html ----------------------------------------------
const head = src.slice(0, styleBlock.start);           // doctype + metas + title
const bodyOpen = src.indexOf('<body>');
if (bodyOpen < 0) throw new Error('no <body>');
const bodyStart = bodyOpen + 6;                        // after '<body>'
const bodyMarkup = src.slice(bodyStart, dataBlocks[0].start); // header/main/dialog
const tail = '\n</body></html>\n';

let html = head;
html += '<link rel="stylesheet" href="css/fonts.css">\n<link rel="stylesheet" href="css/style.css">\n</head><body>\n';
html += bodyMarkup.trimEnd() + '\n';
for (const { id } of keptData) html += '<script src="data/' + id + '.js"></script>\n';
for (const n of codeNames) html += '<script src="js/' + n + '.js"></script>\n';
html += tail;
writeFileSync('src/index.html', html);
console.log('index.html:', (html.length / 1024 | 0) + ' KB');
