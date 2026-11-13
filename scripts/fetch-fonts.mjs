// Downloads the Google Fonts used by the page and rewrites the page to load them locally,
// so Japanese/Bangla text looks the same offline. Runs in CI (FETCH_FONTS=1). Never fatal.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export async function localizeFonts(html) {
  const linkRe = /<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/i;
  const m = html.match(linkRe);
  if (!m) return html;
  try {
    const cssUrl = m[1].replace(/&amp;/g, '&');
    const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
    const res = await fetch(cssUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error('css ' + res.status);
    let css = await res.text();
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((x) => x[1]))];
    if (!urls.length) throw new Error('no font files in css');
    mkdirSync('www/fonts', { recursive: true });
    const map = new Map();
    let i = 0;
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (i < urls.length) {
        const u = urls[i++];
        const r = await fetch(u);
        if (!r.ok) throw new Error('font ' + r.status);
        const name = createHash('sha1').update(u).digest('hex').slice(0, 16) + '.woff2';
        writeFileSync('www/fonts/' + name, Buffer.from(await r.arrayBuffer()));
        map.set(u, 'fonts/' + name);
      }
    }));
    for (const [u, local] of map) css = css.split(u).join(local);
    console.log('fonts: localized ' + map.size + ' files');
    return html.replace(linkRe, () => '<style>' + css + '</style>');
  } catch (e) {
    console.warn('fonts: skipped (' + e.message + ') - page will use online/system fonts');
    return html;
  }
}
