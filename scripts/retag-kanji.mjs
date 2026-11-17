// One-time: re-tag kanji levels in src/data/d.js so cumulative per-level
// counts match the real JLPT sizes: N5 122, N4 320, N3 700, N2 1000,
// N1 = rest (2383, i.e. "2,000+"). Kanji ids are the characters themselves,
// so progress (keyed by character) is unaffected. Vocab/grammar untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

const file = 'src/data/d.js';
const b64 = readFileSync(file, 'utf8').match(/NBD\.d='([A-Za-z0-9+/=]+)'/)[1];
const D = JSON.parse(gunzipSync(Buffer.from(b64, 'base64')).toString());

const CUM = { N5: 122, N4: 320, N3: 700, N2: 1000 }; // N1 = the rest
const order = ['N5', 'N4', 'N3', 'N2', 'N1'];
const before = {};
for (const k of D.k) before[k.l] = (before[k.l] || 0) + 1;

// array is level-grouped N5→N1; assign new levels sequentially
let i = 0;
for (const lv of order) {
  const upto = CUM[lv] ?? D.k.length;
  while (i < upto && i < D.k.length) D.k[i++].l = lv;
}
const after = {};
for (const k of D.k) after[k.l] = (after[k.l] || 0) + 1;

// sanity: order still grouped, counts exact
const seq = D.k.map(k => k.l).join('');
if (/N1.*N5|N2.*N5|N2.*N4|N3.*N[45]|N4.*N5/.test(seq)) throw new Error('levels not grouped');

const gz = gzipSync(Buffer.from(JSON.stringify(D)), { level: 9 });
writeFileSync(file,
  "/* Nihoban data: gzipped+base64 JSON, decoded by dec('d') */\n" +
  "window.NBD=window.NBD||{};NBD.d='" + gz.toString('base64') + "';\n");

console.log('before:', JSON.stringify(before));
console.log('after :', JSON.stringify(after));
const cum = {};
let c = 0;
for (const lv of order) { c += after[lv]; cum[lv] = c; }
console.log('cumulative:', JSON.stringify(cum));
