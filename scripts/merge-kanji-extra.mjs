// One-time: merge extra kanji fields from /home/void/Downloads/kanji.json into
// src/data/d.js: ds (EN description), bd (Bangla description), uw (used_in
// words), bg (begins words). Levels stay as-is (our retag matches official
// JLPT sizes; the file's own tags only reach 252 through N4).
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const SRC = '/home/void/Downloads/kanji.json';
const file = 'src/data/d.js';

const incoming = JSON.parse(readFileSync(SRC, 'utf8'));
// the dataset uses two variant codepoints (剥/叱) where the app has 剝/𠮟
const remap = { '剥': '剝', '叱': '𠮟' };
const byChar = new Map();
for (const k of incoming) byChar.set(remap[k.kanji] || k.kanji, k);

const b64 = readFileSync(file, 'utf8').match(/NBD\.d='([A-Za-z0-9+/=]+)'/)[1];
const D = JSON.parse(gunzipSync(Buffer.from(b64, 'base64')).toString());

let n = 0, missing = 0;
for (const k of D.k) {
  const e = byChar.get(k.c);
  if (!e) { missing++; continue; }
  if (e.description) k.ds = e.description;
  if (e.bangla_description) k.bd = e.bangla_description;
  if (e.used_in != null) k.uw = e.used_in;
  if (e.begins != null) k.bg = e.begins;
  n++;
}
if (missing) console.warn('kanji not found in source:', missing, [...byChar.keys()].filter(c => !D.k.some(k => k.c === c)).join(''));

const gz = gzipSync(Buffer.from(JSON.stringify(D)), { level: 9 });
writeFileSync(file,
  "/* Nihoban data: gzipped+base64 JSON, decoded by dec('d') */\n" +
  "window.NBD=window.NBD||{};NBD.d='" + gz.toString('base64') + "';\n");

console.log('enriched kanji:', n, '· missing:', missing, '· d.js b64:', (gz.toString('base64').length / 1024 | 0) + ' KB (was ' + (b64.length / 1024 | 0) + ' KB)');
const s = D.k.find(k => k.c === '食');
console.log('sample 食 ds:', s.ds && s.ds.slice(0, 80));
console.log('sample 食 bd:', s.bd && s.bd.slice(0, 60), '· uw', s.uw, '· bg', s.bg);
