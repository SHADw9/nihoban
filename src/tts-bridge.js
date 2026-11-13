/* Nihoban native TTS bridge.
 * The page keeps calling the standard speechSynthesis / SpeechSynthesisUtterance API.
 * Inside the Android app (Capacitor) or the Linux desktop app (Electron) this file
 * routes those calls to the platform's native text-to-speech engine, and falls back
 * to the browser's Web Speech API if the native engine is missing or fails.
 * In a normal browser it does nothing. */
(function () {
  'use strict';
  var W = window;
  var origSynth = W.speechSynthesis || null;

  var cap = W.Capacitor, plugin = null;
  try {
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      plugin = (cap.Plugins && cap.Plugins.NihobanTTS) ||
               (cap.registerPlugin && cap.registerPlugin('NihobanTTS')) || null;
      if (!plugin && cap.nativePromise) {   // bundler-less fallback straight to the native bridge
        plugin = {};
        ['speak', 'cancel', 'installVoices'].forEach(function (m) {
          plugin[m] = function (o) { return cap.nativePromise('NihobanTTS', m, o || {}); };
        });
      }
    }
  } catch (e) { plugin = null; }
  var desktop = W.nihobanDesktop || null;
  if (!plugin && !desktop) return; // plain browser: leave Web Speech untouched

  if (typeof W.SpeechSynthesisUtterance !== 'function') {
    W.SpeechSynthesisUtterance = function (text) {
      this.text = text || ''; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1;
      this.voice = null; this.onstart = this.onend = this.onerror = null;
    };
  }

  var seq = 0, active = 0, askedInstall = false;

  function fire(u, name) {
    try { var h = u['on' + name]; if (typeof h === 'function') h.call(u, { type: name, utterance: u }); } catch (e) {}
  }

  function nativeSpeak(u) {
    var lang = u.lang || 'ja-JP';
    var rate = u.rate > 0 ? u.rate : 1;
    if (desktop) {
      return desktop.speak(String(u.text), rate).then(function (r) { return !!(r && r.ok); });
    }
    return Promise.resolve(plugin.speak({
      text: String(u.text), lang: lang, rate: rate,
      pitch: u.pitch > 0 ? u.pitch : 1
    })).then(function () { return true; }, function (err) {
      var msg = String((err && (err.message || err.errorMessage)) || err || '');
      if (msg.indexOf('voice-missing') >= 0 && !askedInstall && plugin.installVoices) {
        askedInstall = true;               // once per session: open the system voice-data installer
        try { plugin.installVoices(); } catch (e) {}
      }
      return false;                         // -> falls back to Web Speech
    });
  }

  function webFallback(u) {
    if (!origSynth) return;
    try { origSynth.cancel(); origSynth.speak(u); } catch (e) {}
  }

  var shim = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    speak: function (u) {
      var id = ++seq; active = id; shim.speaking = true;
      fire(u, 'start');
      nativeSpeak(u).then(function (ok) {
        if (id !== active) return;
        if (!ok) { shim.speaking = false; webFallback(u); return; }
        shim.speaking = false; fire(u, 'end');
      }).catch(function () {
        if (id !== active) return;
        shim.speaking = false; webFallback(u);
      });
    },
    cancel: function () {
      active = ++seq; shim.speaking = false;
      try { if (desktop) desktop.cancel(); else if (plugin && plugin.cancel) plugin.cancel(); } catch (e) {}
      try { if (origSynth) origSynth.cancel(); } catch (e) {}
    },
    pause: function () {}, resume: function () {},
    getVoices: function () { try { return origSynth ? origSynth.getVoices() : []; } catch (e) { return []; } },
    addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return true; }
  };

  try { Object.defineProperty(W, 'speechSynthesis', { value: shim, configurable: true, writable: true }); }
  catch (e) { try { W.speechSynthesis = shim; } catch (_) {} }
})();
