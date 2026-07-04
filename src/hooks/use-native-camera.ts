import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useIsNativeApp } from './use-native-app';

/**
 * Native shell camera tuning: iOS uses higher capture; Android WebView uses lighter capture
 * so TensorFlow.js BodyPix + canvas scenes stay responsive. Falls back to getUserMedia elsewhere.
 */
export const useNativeCamera = () => {
  const isNative = useIsNativeApp();

  const startNativeCamera = useCallback(async (
    videoElement: HTMLVideoElement | null,
    constraints?: MediaStreamConstraints
  ): Promise<MediaStream | null> => {
    if (!videoElement) {
      return null;
    }

    // Native iOS: higher quality. Native Android WebView: keep resolution modest so BodyPix + canvas scenes stay smooth.
    if (isNative && Capacitor.getPlatform() === 'ios') {
      try {
        // Use higher quality on native for board photo uploads
        const nativeConstraints: MediaStreamConstraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            ...(constraints?.video as any)
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(constraints?.audio as any)
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(nativeConstraints);
        
        // Set up video element for native
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        // Wait for video to be ready (with timeout)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            reject(new Error('Video load timeout'));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.play()
              .then(() => resolve())
              .catch(reject);
          };
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        });

        console.log('[NativeCamera] Native camera started successfully');
        return stream;
      } catch (error) {
        console.error('[NativeCamera] Native camera error, falling back to web:', error);
        // Fall through to web API
      }
    }

    if (isNative && Capacitor.getPlatform() === 'android') {
      try {
        const androidConstraints: MediaStreamConstraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(constraints?.audio as object),
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(androidConstraints);
        videoElement.srcObject = stream;
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            reject(new Error('Video load timeout'));
          }, 8000);
          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.play().then(() => resolve()).catch(reject);
          };
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        });
        console.log('[NativeCamera] Android native camera started');
        return stream;
      } catch (error) {
        console.error('[NativeCamera] Android native camera error, falling back to web:', error);
      }
    }

    // Web/PWA: use standard web API (existing behavior)
    try {
      const webConstraints: MediaStreamConstraints = constraints || {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(webConstraints);
      return stream;
    } catch (error) {
      console.error('[NativeCamera] Web camera error:', error);
      throw error;
    }
  }, [isNative]);

  return { startNativeCamera };
};
