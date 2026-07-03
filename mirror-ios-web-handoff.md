# Mirror Work — iOS + Web full code handoff (Part 1 of 2)

**Project:** Palette Plotting / belief-craft-nexus  
**Branch:** `Mobile-app`  
**Route:** `/dashboard/mirror` → `MirrorRehearsalRoute` → `MirrorRehearsal` (iOS native + web/PWA)  
**Stack:** React + Capacitor 8 + getUserMedia + BodyPix canvas scenes + optional iOS native overlay (Vision segmentation)

## How iOS/web is selected

```tsx
// src/pages/features/MirrorRehearsalRoute.tsx
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
  return <MirrorRehearsalAndroid />;
}
return <MirrorRehearsal />; // iOS + web
```

## Files in Part 1 (supporting code)

1. `src/pages/features/MirrorRehearsalRoute.tsx`
2. `src/plugins/nativeMirror.ts`
3. `src/hooks/use-native-camera.ts`
4. `src/lib/overlayBootstrap.ts`
5. `ios/App/CapApp-SPM/Sources/CapApp-SPM/NativeMirrorPlugin.swift`

## Part 2

Full main component: `src/pages/features/MirrorRehearsal.tsx` (~3,884 lines)  
→ **mirror-ios-web-handoff-part2.md**

---


================================================================================
src/pages/features/MirrorRehearsalRoute.tsx
================================================================================

import { Capacitor } from "@capacitor/core";
import MirrorRehearsal from "./MirrorRehearsal";
import MirrorRehearsalAndroid from "./MirrorRehearsalAndroid";

/**
 * Platform entry only — routes Android native app to MirrorRehearsalAndroid;
 * iOS and web use MirrorRehearsal (no shared runtime branches between them).
 */
const MirrorRehearsalRoute = () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    return <MirrorRehearsalAndroid />;
  }
  return <MirrorRehearsal />;
};

export default MirrorRehearsalRoute;


================================================================================
src/plugins/nativeMirror.ts
================================================================================

import { registerPlugin } from "@capacitor/core";

type NativeMirrorStartOptions = {
  scene: "hearts" | "coins" | "gold" | "rain" | "summit" | "none";
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeMirrorLayoutOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeMirrorPlugin = {
  isAvailable(): Promise<{ available: boolean; platform: string }>;
  start(options: NativeMirrorStartOptions): Promise<void>;
  stop(): Promise<void>;
  setScene(options: { scene: NativeMirrorStartOptions["scene"] }): Promise<void>;
  updateLayout(options: NativeMirrorLayoutOptions): Promise<void>;
};

export const NativeMirror = registerPlugin<NativeMirrorPlugin>("NativeMirror");



================================================================================
src/hooks/use-native-camera.ts
================================================================================

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
        // Use higher quality on native for better Mirror Work experience
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


================================================================================
src/lib/overlayBootstrap.ts
================================================================================

// src/lib/overlayBootstrap.ts
export type OverlayBootstrapCtx = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  width: number;   // CSS pixels
  height: number;  // CSS pixels
};

type BootstrapOpts = {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  rafRef: React.MutableRefObject<number | null>;

  // Video and container transform handling (like rain scene)
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  originalVideoFilterRef?: React.MutableRefObject<string | null>;
  originalContainerTransformRef?: React.MutableRefObject<string | null>;

  // Called after we have non-zero width/height and the canvas has been sized.
  onInit?: (o: OverlayBootstrapCtx) => void;

  // Called every frame. You draw here.
  onFrame: (o: OverlayBootstrapCtx) => void;

  // Audio: start on init and also on first user gesture.
  onStartAudio?: () => void;
  onStopAudio?: () => void;

  // Called when tearing down (optional).
  onCleanup?: () => void;

  // Optional: how often we retry if container is 0x0
  retryMs?: number;
};

// This prevents DPR compounding and guarantees a clean frame.
export function clearAndSetDpr(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dpr: number
) {
  // Reset transform and clear in device pixels
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Re-apply DPR transform for drawing in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function bootstrapCanvasOverlay(opts: BootstrapOpts) {
  const {
    enabled,
    canvasRef,
    rafRef,
    videoRef,
    originalVideoFilterRef,
    originalContainerTransformRef,
    onInit,
    onFrame,
    onStartAudio,
    onStopAudio,
    onCleanup,
    retryMs = 120,
  } = opts;

  if (!enabled) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const container = canvas.parentElement;
  if (!container) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Handle video filter and container transform (like rain scene)
  if (videoRef && originalVideoFilterRef) {
    if (videoRef.current && originalVideoFilterRef.current === null) {
      originalVideoFilterRef.current = videoRef.current.style.filter;
    }
    if (videoRef.current) {
      videoRef.current.style.filter = "";
    }
  }
  if (originalContainerTransformRef) {
    if (container && originalContainerTransformRef.current === null) {
      originalContainerTransformRef.current = container.style.transform;
    }
  }

  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;

  const updateCanvasSize = (): boolean => {
    dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    if (!width || !height) return false;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set DPR transform once here
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    // @ts-ignore
    ctx.imageSmoothingQuality = "high";

    return true;
  };

  const getCtxObj = (): OverlayBootstrapCtx => ({
    canvas,
    container,
    ctx,
    dpr,
    width,
    height,
  });

  const stopRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleGesture = () => {
    try {
      onStartAudio?.();
    } catch {}
  };

  const animate = () => {
    // If the effect unmounted, React will run cleanup and cancel RAF.
    // Still, be defensive:
    if (!canvasRef.current) return;

    const rect = container.getBoundingClientRect();
    if (rect.width !== width || rect.height !== height) {
      updateCanvasSize();
    }

    if (!width || !height) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    // Clean frame, re-apply DPR
    clearAndSetDpr(ctx, canvas, dpr);

    onFrame(getCtxObj());

    rafRef.current = requestAnimationFrame(animate);
  };

  const start = () => {
    if (!updateCanvasSize()) {
      window.setTimeout(start, retryMs);
      return;
    }

    // Init once per enable cycle
    onInit?.(getCtxObj());

    // Start audio (may be blocked until gesture; gesture listener below fixes it)
    try {
      onStartAudio?.();
    } catch {}

    stopRaf();
    rafRef.current = requestAnimationFrame(animate);
  };

  // Resize + gesture unlock
  window.addEventListener("resize", updateCanvasSize);
  window.addEventListener("pointerdown", handleGesture, { once: true });

  // Kick off after mount/layout
  requestAnimationFrame(start);

  return () => {
    window.removeEventListener("resize", updateCanvasSize);
    window.removeEventListener("pointerdown", handleGesture);
    stopRaf();

    try {
      onStopAudio?.();
    } catch {}

    try {
      onCleanup?.();
    } catch {}

    // Restore video filter and container transform (like rain scene)
    if (videoRef && originalVideoFilterRef) {
      if (videoRef.current && originalVideoFilterRef.current !== null) {
        videoRef.current.style.filter = originalVideoFilterRef.current;
      }
    }
    if (originalContainerTransformRef && container) {
      if (originalContainerTransformRef.current !== null) {
        container.style.transform = originalContainerTransformRef.current;
      }
    }

    // Don't clear canvas here automatically — let the pack decide
    // (some packs want smooth transitions).
  };
}



================================================================================
ios/App/CapApp-SPM/Sources/CapApp-SPM/NativeMirrorPlugin.swift
================================================================================

import Foundation
import Capacitor
import UIKit
import AVFoundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

@objc(NativeMirrorPlugin)
public class NativeMirrorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeMirrorPlugin"
    public let jsName = "NativeMirror"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setScene", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateLayout", returnType: CAPPluginReturnPromise)
    ]

    private let manager = NativeMirrorManager()

    @objc public func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "platform": "ios-native"
        ])
    }

    @objc public func start(_ call: CAPPluginCall) {
        guard let hostView = bridge?.viewController?.view else {
            call.reject("Bridge view unavailable")
            return
        }

        let scene = call.getString("scene") ?? "none"
        let frame = CGRect(
            x: call.getDouble("x") ?? 0,
            y: call.getDouble("y") ?? 0,
            width: call.getDouble("width") ?? hostView.bounds.width,
            height: call.getDouble("height") ?? hostView.bounds.height
        )

        manager.start(in: hostView, frame: frame, scene: scene) { result in
            switch result {
            case .success:
                call.resolve()
            case .failure(let error):
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc public func stop(_ call: CAPPluginCall) {
        manager.stop()
        call.resolve()
    }

    @objc public func setScene(_ call: CAPPluginCall) {
        manager.setScene(call.getString("scene") ?? "none")
        call.resolve()
    }

    @objc public func updateLayout(_ call: CAPPluginCall) {
        let frame = CGRect(
            x: call.getDouble("x") ?? 0,
            y: call.getDouble("y") ?? 0,
            width: call.getDouble("width") ?? 0,
            height: call.getDouble("height") ?? 0
        )
        manager.updateLayout(frame)
        call.resolve()
    }
}

private final class NativeMirrorManager {
    private var rendererView: NativeMirrorRendererView?

    func start(in host: UIView, frame: CGRect, scene: String, completion: @escaping (Result<Void, Error>) -> Void) {
        DispatchQueue.main.async {
            if self.rendererView == nil {
                let view = NativeMirrorRendererView()
                view.backgroundColor = .clear
                view.frame = frame
                host.addSubview(view)
                self.rendererView = view
            }

            self.rendererView?.frame = frame
            self.rendererView?.setScene(scene)
            self.rendererView?.start { result in
                completion(result)
            }
        }
    }

    func stop() {
        DispatchQueue.main.async {
            self.rendererView?.stop()
            self.rendererView?.removeFromSuperview()
            self.rendererView = nil
        }
    }

    func setScene(_ scene: String) {
        DispatchQueue.main.async {
            self.rendererView?.setScene(scene)
        }
    }

    func updateLayout(_ frame: CGRect) {
        DispatchQueue.main.async {
            self.rendererView?.frame = frame
        }
    }
}

private final class NativeMirrorRendererView: UIView, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let imageView = UIImageView()
    private let captureSession = AVCaptureSession()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let processingQueue = DispatchQueue(label: "native.mirror.processing")
    private let ciContext = CIContext(options: nil)
    private let segmentationRequest = VNGeneratePersonSegmentationRequest()

    private var running = false
    private var currentScene: String = "none"
    private var lastMaskImage: CIImage?
    private var lastSegmentationTs: CFAbsoluteTime = 0
    private var isRequestInFlight = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        clipsToBounds = true
        backgroundColor = .clear
        imageView.frame = bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        imageView.contentMode = .scaleAspectFill
        imageView.backgroundColor = .clear
        imageView.isOpaque = false
        addSubview(imageView)

        segmentationRequest.qualityLevel = .balanced
        segmentationRequest.outputPixelFormat = kCVPixelFormatType_OneComponent8
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        imageView.frame = bounds
        layer.masksToBounds = true
    }

    func start(completion: @escaping (Result<Void, Error>) -> Void) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            guard granted else {
                completion(.failure(NSError(domain: "NativeMirror", code: 1, userInfo: [NSLocalizedDescriptionKey: "Camera permission denied"])))
                return
            }

            self.processingQueue.async {
                do {
                    try self.configureSessionIfNeeded()
                    if !self.captureSession.isRunning {
                        self.captureSession.startRunning()
                    }
                    self.running = true
                    completion(.success(()))
                } catch {
                    completion(.failure(error))
                }
            }
        }
    }

    func stop() {
        processingQueue.async {
            self.running = false
            if self.captureSession.isRunning {
                self.captureSession.stopRunning()
            }
            self.lastMaskImage = nil
            self.lastSegmentationTs = 0
            self.isRequestInFlight = false
            DispatchQueue.main.async {
                self.imageView.image = nil
            }
        }
    }

    func setScene(_ scene: String) {
        currentScene = scene
    }

    private func configureSessionIfNeeded() throws {
        guard captureSession.inputs.isEmpty else { return }

        captureSession.beginConfiguration()
        captureSession.sessionPreset = .high

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else {
            throw NSError(domain: "NativeMirror", code: 2, userInfo: [NSLocalizedDescriptionKey: "Front camera unavailable"])
        }

        let input = try AVCaptureDeviceInput(device: device)
        if captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }

        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }
        if let connection = videoOutput.connection(with: .video) {
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
            if connection.isVideoMirroringSupported {
                connection.isVideoMirrored = true
            }
        }

        captureSession.commitConfiguration()
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard running, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let cameraImage = CIImage(cvPixelBuffer: pixelBuffer)
        maybeUpdateSegmentationMask(pixelBuffer: pixelBuffer)

        let composited = compositeForeground(cameraImage: cameraImage)
        guard let cgImage = ciContext.createCGImage(composited, from: composited.extent) else { return }
        DispatchQueue.main.async {
            self.imageView.image = UIImage(cgImage: cgImage)
        }
    }

    private func maybeUpdateSegmentationMask(pixelBuffer: CVPixelBuffer) {
        let now = CFAbsoluteTimeGetCurrent()
        if isRequestInFlight || (now - lastSegmentationTs) < 0.09 { return } // ~11 fps mask refresh
        isRequestInFlight = true
        lastSegmentationTs = now

        let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try requestHandler.perform([segmentationRequest])
            if let result = segmentationRequest.results?.first?.pixelBuffer {
                var maskImage = CIImage(cvPixelBuffer: result)
                let scaleX = pixelBufferSize(pixelBuffer).width / maskImage.extent.width
                let scaleY = pixelBufferSize(pixelBuffer).height / maskImage.extent.height
                maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
                lastMaskImage = maskImage
            }
        } catch {
            // Keep previous mask if request fails.
        }

        isRequestInFlight = false
    }

    private func compositeForeground(cameraImage: CIImage) -> CIImage {
        guard let mask = lastMaskImage else { return cameraImage }
        let clearBg = CIImage(color: .clear).cropped(to: cameraImage.extent)
        let filter = CIFilter.blendWithMask()
        filter.inputImage = cameraImage
        filter.backgroundImage = clearBg
        filter.maskImage = mask
        return filter.outputImage?.cropped(to: cameraImage.extent) ?? cameraImage
    }

    private func pixelBufferSize(_ pb: CVPixelBuffer) -> CGSize {
        CGSize(width: CVPixelBufferGetWidth(pb), height: CVPixelBufferGetHeight(pb))
    }
}

