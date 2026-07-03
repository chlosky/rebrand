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

