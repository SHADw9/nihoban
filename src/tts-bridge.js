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

  var seq = 0, active = 0, askedInstall = false, nseq = 0;
  var waiters = {};   // native utterance id -> resolve fn
  var order = [];     // ids awaiting their end event, in call order (FIFO fallback)

  function fire(u, name) {
    try { var h = u['on' + name]; if (typeof h === 'function') h.call(u, { type: name, utterance: u }); } catch (e) {}
  }

  function settle(nid, ok) {
    var w = waiters[nid];
    if (!w) return;
    delete waiters[nid];
    var i = order.indexOf(nid);
    if (i >= 0) order.splice(i, 1);
    w(ok);
  }

  /* The Android plugin resolves the speak() call as soon as the engine ACCEPTS
   * the text — the audio has only just started. The real end arrives later as
   * an 'end'/'error' event from its UtteranceProgressListener. Hold each
   * promise until that event so onend fires when the audio actually finishes:
   * the listening player speaks sentence chunks back-to-back, and with an
   * instant onend every chunk was flushed mid-sentence by the next one. */
  var hasEvents = false;
  try {
    if (plugin && typeof plugin.addListener === 'function') {
      var ended = function (d) {
        var id = d && d.id;
        // exact id when the plugin echoes ours; otherwise the oldest pending
        // call (a flushed utterance's stale event resolves first and is then
        // dropped by the cancel guard)
        if (id && waiters[id]) settle(id, true);
        else if (order.length) settle(order[0], true);
      };
      plugin.addListener('end', ended);
      plugin.addListener('error', ended);
      hasEvents = true;
    }
  } catch (e) { hasEvents = false; }

  function webFallback(u) {
    if (!origSynth) return;
    try { origSynth.cancel(); origSynth.speak(u); } catch (e) {}
  }

  function nativeSpeak(u) {
    var lang = u.lang || 'ja-JP';
    var rate = u.rate > 0 ? u.rate : 1;
    if (desktop) {
      return desktop.speak(String(u.text), rate).then(function (r) { return !!(r && r.ok); });
    }
    var text = String(u.text), nid = 't' + (++nseq);
    return new Promise(function (resolve) {
      var settled = false;
      var fin = function (ok) {
        if (settled) return; settled = true;
        delete waiters[nid];
        var i = order.indexOf(nid); if (i >= 0) order.splice(i, 1);
        resolve(!!ok);
      };
      if (hasEvents) { waiters[nid] = fin; order.push(nid); }
      Promise.resolve(plugin.speak({
        id: nid, text: text, lang: lang, rate: rate, pitch: u.pitch > 0 ? u.pitch : 1
      })).then(function () {
        if (!hasEvents) /* legacy path: no end events; resolve on a duration estimate */
          setTimeout(function () { fin(true); }, Math.max(1200, text.length * 250 / rate));
        // with events: the plugin's end/error listener resolves us
      }, function (err) {
        var msg = String((err && (err.message || err.errorMessage)) || err || '');
        if (msg.indexOf('voice-missing') >= 0 && !askedInstall && plugin.installVoices) {
          askedInstall = true;               // once per session: open the system voice-data installer
          try { plugin.installVoices(); } catch (e) {}
        }
        fin(false);                           // -> falls back to Web Speech
      });
      setTimeout(function () { fin(true); }, Math.max(20000, text.length * 500 / rate)); // safety net
    });
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
