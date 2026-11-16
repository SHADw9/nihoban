package com.nihoban.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NihobanTTSPlugin.class);
        super.onCreate(savedInstanceState);

        // Hardware / gesture back: walk the WebView history (in-app routes and
        // dialogs) instead of closing the activity. The app exits only when the
        // history is exhausted, i.e. the user is back at the start page.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = bridge == null ? null : bridge.getWebView();
                if (wv != null && wv.canGoBack()) {
                    wv.goBack();
                } else {
                    // No in-app history left: pass the back press through so
                    // the system closes (or backgrounds) the app as usual.
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }
}
