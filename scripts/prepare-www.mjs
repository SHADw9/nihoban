// Builds www/: copies all src/ assets and writes index.html with the
// native-TTS bridge injected. src/ layout: index.html + css/ js/ data/
// fonts/ audio/ + tts-bridge.js.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';

rmSync('www', { recursive: true, force: true });
mkdirSync('www', { recursive: true });

let html = readFileSync('src/index.html', 'utf8');
const tag = '<script src="tts-bridge.js"></script>';
if (!html.includes('tts-bridge.js')) {
  if (/<meta charset[^>]*>/i.test(html)) html = html.replace(/<meta charset[^>]*>/i, (m) => m + '\n' + tag);
  else if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + '\n' + tag);
  else html = tag + '\n' + html;
}
writeFileSync('www/index.html', html);

for (const dir of ['css', 'js', 'data', 'fonts', 'audio']) {
  if (existsSync('src/' + dir)) cpSync('src/' + dir, 'www/' + dir, { recursive: true });
}
cpSync('src/tts-bridge.js', 'www/tts-bridge.js');
if (existsSync('src/logo.svg')) cpSync('src/logo.svg', 'www/logo.svg');

console.log('www/ ready (page: ' + (html.length / 1024 | 0) + ' KB, assets: css/js/data/fonts/audio)');
