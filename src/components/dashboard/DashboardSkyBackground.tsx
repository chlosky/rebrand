import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { DASHBOARD_DAY_SKY_BACKGROUND_URL } from "@/lib/localNightTime";
import { TRANSPARENT_VIDEO_POSTER } from "@/lib/nativeVideoPoster";

const DASHBOARD_SKY_VIDEO_SRC = "/videos/blue-skies-video.mp4";

type DashboardSkyBackgroundProps = {
  className?: string;
  /** Desktop uses fixed attachment on the sky still (original dashboard). */
  fixedBackground?: boolean;
};

/**
 * Light-mode dashboard sky — matches legacy Dashboard.tsx / CategoryList:
 * Sky PNG + optional slow sky video at 40% opacity, then a light `bg-background/10` wash (not tinted into the image).
 */
export function DashboardSkyBackground({
  className,
  fixedBackground = true,
}: DashboardSkyBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.controls = false;
    video.playbackRate = 0.5;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => setHasUserInteracted(true)).catch(() => {});
    }
  }, [videoError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasUserInteracted || videoError) return;

    const tryPlayVideo = () => {
      if (video.paused && !hasUserInteracted) {
        video.muted = true;
        video.play().then(() => setHasUserInteracted(true)).catch(() => {});
      }
    };

    const events = ["touchstart", "touchend", "click", "scroll", "wheel"] as const;
    events.forEach((event) => {
      document.addEventListener(event, tryPlayVideo, { once: true, passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, tryPlayVideo);
      });
    };
  }, [hasUserInteracted, videoError]);

  /**
   * Resume the sky video when the WebView becomes visible again (background → foreground).
   * Android/iOS pause `<video>` elements on background and don't auto-resume on foreground;
   * the original mount effect + `{ once: true }` touch listeners are already consumed so
   * nothing else retries `play()` on resume. Without this, the video freezes on its last
   * frame after the first background cycle (the user can already see the still sky PNG, but
   * the animated layer is dead until they navigate away and back).
   *
   * Listens to both `visibilitychange` (covers tab switch / PWA hide) and Capacitor `App`
   * `resume` (more reliable than visibilitychange on some Android WebViews). Falls back to
   * a one-shot pointer listener if the post-resume `play()` is still autoplay-blocked, so
   * the next tap recovers it without permanently stranding the user on a frozen frame.
   */
  useEffect(() => {
    if (videoError) return;

    let cancelled = false;
    let removeAppListener: (() => void) | null = null;
    let pendingTouchFallback: (() => void) | null = null;

    const armOneShotTouchFallback = () => {
      if (cancelled || pendingTouchFallback) return;
      const onceTouch = () => {
        pendingTouchFallback = null;
        const v = videoRef.current;
        if (cancelled || !v || !v.paused) return;
        v.muted = true;
        v.play().then(() => setHasUserInteracted(true)).catch(() => {});
      };
      document.addEventListener("pointerdown", onceTouch, { once: true, passive: true });
      document.addEventListener("touchstart", onceTouch, { once: true, passive: true });
      pendingTouchFallback = () => {
        document.removeEventListener("pointerdown", onceTouch);
        document.removeEventListener("touchstart", onceTouch);
        pendingTouchFallback = null;
      };
    };

    const tryResumePlayback = () => {
      const v = videoRef.current;
      if (cancelled || !v || !v.paused) return;
      v.muted = true;
      v.play()
        .then(() => setHasUserInteracted(true))
        .catch(() => armOneShotTouchFallback());
    };

    const onVis = () => {
      if (document.visibilityState === "visible") tryResumePlayback();
    };
    document.addEventListener("visibilitychange", onVis);

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/app").then(({ App }) => {
        if (cancelled) return;
        void App.addListener("resume", tryResumePlayback).then((handle) => {
          if (cancelled) {
            void handle.remove();
            return;
          }
          removeAppListener = () => void handle.remove();
        });
      });
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (removeAppListener) removeAppListener();
      if (pendingTouchFallback) pendingTouchFallback();
    };
  }, [videoError]);

  const showVideo = !videoError;

  // Keep the still sky visible at 0.4 from first paint so there's no white flash
  // (Android WebView often delays autoplay until decode/buffer; iOS sometimes too).
  // The video, when it starts, fades in on top at the same 0.4 opacity.
  // The outer div carries a sky-blue solid fill so that when the page first
  // arrives in light mode (or on theme switch from dark→light), the user sees
  // sky color while the PNG is still decoding, never a flash of white body bg.
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-0 bg-[#b9d8ee]", className)}
      aria-hidden
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url("${DASHBOARD_DAY_SKY_BACKGROUND_URL}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: fixedBackground ? "fixed" : "scroll",
            opacity: 0.4,
            zIndex: 0,
          }}
        />
        {showVideo ? (
          <video
            ref={videoRef}
            poster={TRANSPARENT_VIDEO_POSTER}
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            controlsList="nodownload noremoteplayback nofullscreen"
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-500"
            style={
              {
                pointerEvents: "none",
                zIndex: 1,
                opacity: hasUserInteracted ? 0.4 : 0,
                WebkitAppearance: "none",
              } as CSSProperties
            }
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              el.playbackRate = 0.5;
              el.play().catch(() => {});
            }}
            onError={() => setVideoError(true)}
            onPlay={() => {
              if (videoRef.current) videoRef.current.playbackRate = 0.5;
              setHasUserInteracted(true);
            }}
          >
            <source src={DASHBOARD_SKY_VIDEO_SRC} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className="absolute inset-0 z-[1] bg-background/10" />
    </div>
  );
}
