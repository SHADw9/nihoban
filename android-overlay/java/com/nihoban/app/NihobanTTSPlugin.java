package com.nihoban.app;

import android.content.Intent;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;
import java.util.UUID;

/** Thin wrapper around Android's system TextToSpeech engine. */
@CapacitorPlugin(name = "NihobanTTS")
public class NihobanTTSPlugin extends Plugin {
    private TextToSpeech tts;
    private boolean ready = false;
    private int initStatus = -1;
    private PluginCall pendingCall = null;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext().getApplicationContext(), status -> {
            initStatus = status;
            ready = (status == TextToSpeech.SUCCESS);
            if (ready) {
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) {}
                    @Override public void onDone(String id) { JSObject o = new JSObject(); o.put("id", id); notifyListeners("end", o); }
                    @Override public void onError(String id) { JSObject o = new JSObject(); o.put("id", id); notifyListeners("error", o); }
                });
            }
            if (pendingCall != null) {
                PluginCall c = pendingCall;
                pendingCall = null;
                doSpeak(c);
            }
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (tts == null) { call.reject("TTS not created"); return; }
        if (!ready) {
            if (initStatus == -1) { pendingCall = call; return; }   // engine still starting
            call.reject("TTS engine unavailable");
            return;
        }
        doSpeak(call);
    }

    private void doSpeak(PluginCall call) {
        if (!ready) { call.reject("TTS engine unavailable"); return; }
        String text = call.getString("text", "");
        String lang = call.getString("lang", "ja-JP");
        Float rate = call.getFloat("rate", 1.0f);
        Float pitch = call.getFloat("pitch", 1.0f);
        Locale locale = Locale.forLanguageTag(lang);

        int r = tts.setLanguage(locale);
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            call.reject("voice-missing");
            return;
        }
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        String id = UUID.randomUUID().toString();
        Bundle params = new Bundle();
        int res = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
        if (res == TextToSpeech.SUCCESS) {
            JSObject o = new JSObject();
            o.put("id", id);
            call.resolve(o);
        } else {
            call.reject("speak failed");
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        if (tts != null) tts.stop();
        call.resolve();
    }

    /** Opens the system screen where the user can download Japanese voice data. */
    @PluginMethod
    public void installVoices(PluginCall call) {
        try {
            Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open voice installer");
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
    }
}
