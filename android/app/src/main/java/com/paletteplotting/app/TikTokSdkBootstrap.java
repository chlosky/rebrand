package com.paletteplotting.app;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import com.tiktok.TikTokBusinessSdk;
import com.tiktok.TikTokBusinessSdk.TTConfig;

final class TikTokSdkBootstrap {
    private static boolean didConfigure = false;

    private TikTokSdkBootstrap() {}

    static void configureOnLaunch(Context context) {
        if (didConfigure) {
            return;
        }

        String appSecret = string(context, R.string.tiktok_app_secret);
        String appId = string(context, R.string.tiktok_app_id);
        String tiktokAppId = string(context, R.string.tiktok_tiktok_app_id);

        if (!isConfigured(appSecret) || !isConfigured(appId) || !isConfigured(tiktokAppId)) {
            return;
        }

        TTConfig ttConfig =
                new TTConfig(context.getApplicationContext(), appSecret)
                        .setAppId(appId)
                        .setTTAppId(tiktokAppId);

        if (isDebuggable(context)) {
            ttConfig.openDebugMode().setLogLevel(TikTokBusinessSdk.LogLevel.DEBUG);
        }

        TikTokBusinessSdk.initializeSdk(
                ttConfig,
                new TikTokBusinessSdk.TTInitCallback() {
                    @Override
                    public void success() {
                        didConfigure = true;
                    }

                    @Override
                    public void fail(int code, String msg) {}
                });
    }

    private static boolean isConfigured(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        return !value.startsWith("REPLACE_");
    }

    private static String string(Context context, int resId) {
        return context.getString(resId).trim();
    }

    private static boolean isDebuggable(Context context) {
        return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }
}

