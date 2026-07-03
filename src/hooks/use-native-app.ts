import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the app is running in a native Capacitor environment
 * (iOS app, Android app, etc.) vs web browser.
 *
 * We compute the initial value synchronously so that layouts which depend on
 * this flag don't "jump" on first render in the native app (e.g. onboarding
 * pages shifting when the flag flips from false → true after mount).
 */
const initialIsNative = Capacitor.isNativePlatform();

export const useIsNativeApp = () => {
  const [isNative, setIsNative] = useState(initialIsNative);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return isNative;
};
