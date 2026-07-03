package com.paletteplotting.app;

import android.app.Application;
import com.tiktok.TikTokBusinessSdk;

public class PalettePlottingApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        TikTokBusinessSdk.registerEDPLifecycleCallback(this);
        TikTokSdkBootstrap.configureOnLaunch(this);
    }
}

