import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

/** True when Android builds may call Capacitor PushNotifications (requires google-services.json in CI). */
export function isAndroidPushRegisterEnabled(): boolean {
  return (
    import.meta.env.VITE_ANDROID_PUSH_REGISTER === 'true' ||
    import.meta.env.VITE_ANDROID_PUSH_REGISTER === '1'
  );
}

/**
 * Shows the OS permission dialog on native. Android token registration stays gated
 * until FCM is wired, but Android 13+ can still show the notification permission box.
 * Safe to call multiple times.
 *
 * Android: `@capacitor/push-notifications` requires Firebase to initialize on plugin
 * load; without a working FCM setup the plugin can fail and the system dialog never
 * appears. `@capacitor/local-notifications` requests the same POST_NOTIFICATIONS
 * permission without any FCM dependency, so we use it on Android to surface the OS
 * prompt. iOS continues to use PushNotifications.
 */
export async function requestNativePushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushNotifications] Skipping request — not native platform');
    return false;
  }

  if (Capacitor.getPlatform() === 'android') {
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';

      console.log('[PushNotifications] Android notification permission:', result.display);

      if (granted && isAndroidPushRegisterEnabled()) {
        await PushNotifications.register();
        console.log('[PushNotifications] Android FCM token registration requested');
      }

      return granted;
    } catch (error) {
      console.error('[PushNotifications] Android permission request error:', error);
      return false;
    }
  }

  try {
    const result = await PushNotifications.requestPermissions();
    console.log('[PushNotifications] Permission result:', result.receive);
    return result.receive === 'granted';
  } catch (error) {
    console.error('[PushNotifications] Permission request error:', error);
    return false;
  }
}

/**
 * Initialize push notifications for native app (e.g. app resume / login flows).
 * Does nothing on web/PWA to avoid disturbing existing functionality.
 */
export const initializePushNotifications = async () => {
  await requestNativePushPermission();
};

/**
 * Unregister push notifications (for logout, etc.)
 */
export const unregisterPushNotifications = async () => {
  // OneSignal logout is handled centrally in AuthContext.
  if (!Capacitor.isNativePlatform()) return;
};
