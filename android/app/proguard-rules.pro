# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Readable stack traces for Play Console / deobfuscation
-keepattributes SourceFile,LineNumberTable

# Capacitor core + plugins (library consumer rules also apply; these cover the app shell)
-keep public class * extends com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.** { *; }

# WebView JavaScript bridge
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# App entry
-keep class com.paletteplotting.app.MainActivity { *; }

# NativeMirror plugin
-keep class com.paletteplotting.app.NativeMirrorPlugin { *; }
-keep class com.paletteplotting.app.NativeMirrorView { *; }

# TikTok App Events SDK
-keep class com.tiktok.** { *; }
-keep class com.android.billingclient.api.** { *; }
-keep class com.android.installreferrer.api.** { *; }
-keep class androidx.lifecycle.** { *; }
-keep class com.paletteplotting.app.PalettePlottingApplication { *; }
-keep class com.paletteplotting.app.TikTokSdkBootstrap { *; }
-keep class com.paletteplotting.app.TikTokEventsPlugin { *; }
