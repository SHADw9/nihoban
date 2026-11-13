const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

if (process.platform === 'linux') {
  // AppImages cannot use the SUID sandbox, and Ubuntu 24.04 blocks the userns one.
  // The app only loads its own bundled page, so this is acceptable.
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('enable-speech-dispatcher'); // lets the Web Speech fallback see system voices
}

// ---------- native Japanese TTS (speech-dispatcher / espeak-ng) ----------
const clampRate = (r) => (r > 0 ? Math.min(Math.max(r, 0.3), 3) : 1);
const ENGINES = [
  (t, r) => ['spd-say', ['-l', 'ja', '-r', String(Math.max(-100, Math.min(100, Math.round((r - 1) * 100)))), '-w', '--', t]],
  (t, r) => ['espeak-ng', ['-v', 'ja', '-s', String(Math.round(175 * r)), '--', t]],
  (t, r) => ['espeak', ['-v', 'ja', '-s', String(Math.round(175 * r)), '--', t]]
];
let gen = 0, current = null;

function stopSpeech() {
  gen++;
  if (current) {
    try { current.proc.kill('SIGTERM'); } catch (e) {}
    if (current.cmd === 'spd-say') { // the speech-dispatcher server keeps talking unless told to stop
      try { spawn('spd-say', ['-C'], { stdio: 'ignore' }).on('error', () => {}); } catch (e) {}
    }
    current = null;
  }
}

function speak(text, rate) {
  stopSpeech();
  const myGen = gen;
  text = String(text || '').slice(0, 2000);
  rate = clampRate(rate);
  if (!text.trim()) return Promise.resolve({ ok: true });

  return new Promise((resolve) => {
    const attempt = (i) => {
      if (myGen !== gen) return resolve({ ok: true, cancelled: true });
      if (i >= ENGINES.length) return resolve({ ok: false });
      const [cmd, args] = ENGINES[i](text, rate);
      let settled = false;
      const proc = spawn(cmd, args, { stdio: 'ignore' });
      current = { proc, cmd };
      proc.on('error', () => { if (!settled) { settled = true; attempt(i + 1); } });
      proc.on('exit', (code, sig) => {
        if (settled) return;
        settled = true;
        if (myGen !== gen || sig) return resolve({ ok: true, cancelled: true });
        if (code === 0) return resolve({ ok: true });
        attempt(i + 1);
      });
    };
    attempt(0);
  });
}

ipcMain.handle('tts:speak', (_e, { text, rate }) => speak(text, rate));
ipcMain.handle('tts:cancel', () => { stopSpeech(); return true; });

// ---------- window ----------
function createWindow() {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1100, height: 800, minWidth: 360, minHeight: 560,
    title: 'Nihoban', backgroundColor: '#F7F4EC', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    const [w] = BrowserWindow.getAllWindows();
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => { stopSpeech(); app.quit(); });
}
