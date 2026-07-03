package com.paletteplotting.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.paletteplotting.app.NativeMirrorPlugin;

/**
 * Lets muted background / loop videos start without the WebView "tap to play" overlay where the
 * platform allows it (dashboard, embody, hero, etc.).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMirrorPlugin.class);
        registerPlugin(TikTokEventsPlugin.class);
        super.onCreate(savedInstanceState);
        // Match iOS KeyboardResize.None: IME draws over the WebView (no resize/pan). Capacitor Keyboard.setResizeMode is iOS-only.
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        applyWebViewMediaSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyWebViewMediaSettings();
    }

    private void applyWebViewMediaSettings() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        getBridge()
            .getWebView()
            .post(
                () -> {
                    if (getBridge() == null || getBridge().getWebView() == null) {
                        return;
                    }
                    WebSettings settings = getBridge().getWebView().getSettings();
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    settings.setDomStorageEnabled(true);
                });
    }
}

