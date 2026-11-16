// Copies src/index.html -> www/index.html, injects the native-TTS bridge and
// (when FETCH_FONTS=1) bundles the Google Fonts for offline use.
// To update the app later, just replace src/index.html with the new page.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { localizeFonts } from './fetch-fonts.mjs';

rmSync('www', { recursive: true, force: true });
mkdirSync('www', { recursive: true });

let html = readFileSync('src/index.html', 'utf8');
const tag = '<script src="tts-bridge.js"></script>';
if (!html.includes('tts-bridge.js')) {
  if (/<meta charset[^>]*>/i.test(html)) html = html.replace(/<meta charset[^>]*>/i, (m) => m + '\n' + tag);
  else if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + '\n' + tag);
  else html = tag + '\n' + html;
}
if (process.env.FETCH_FONTS === '1') html = await localizeFonts(html);

writeFileSync('www/index.html', html);
cpSync('src/tts-bridge.js', 'www/tts-bridge.js');
cpSync('src/audio', 'www/audio', { recursive: true });
console.log('www/ ready (' + (html.length / 1048576).toFixed(2) + ' MB page)');
