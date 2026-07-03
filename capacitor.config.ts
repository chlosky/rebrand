import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paletteplotting.app',
  appName: 'Palette Plotting',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    /** JS-driven hide via NativeSplashGate. launchShowDuration must be > 0 on iOS or the overlay never mounts. */
    SplashScreen: {
      launchShowDuration: 30000,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      /** Legacy Capacitor ImageView path (when Android 12 API is not used): fit whole drawable, no crop. */
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      iosImagePickerLimit: 1,
    },
    /** Avoid WKWebView shrinking + aggressive scroll that pulls headers under the status bar when inputs focus. */
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
