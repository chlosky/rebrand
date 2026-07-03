import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { TRANSPARENT_VIDEO_POSTER } from "@/lib/nativeVideoPoster";

export const Hero = () => {
  const navigate = useNavigate();
  const showWebSignup = !Capacitor.isNativePlatform();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0.5);

  // Smooth loop transition - fade out near end, fade in at start
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      
      const currentTime = video.currentTime;
      const duration = video.duration;
      const fadeDuration = 0.3; // Fade over 0.3 seconds
      const fadeStart = duration - fadeDuration;

      // Fade out near the end
      if (currentTime >= fadeStart && currentTime < duration - 0.05) {
        const fadeProgress = (currentTime - fadeStart) / fadeDuration;
        const opacity = 0.5 * (1 - fadeProgress); // Fade from 0.5 to 0
        setVideoOpacity(Math.max(0, opacity));
      }
      // Fade in at the start (when video loops back)
      else if (currentTime < fadeDuration) {
        const fadeProgress = currentTime / fadeDuration;
        const opacity = 0.5 * fadeProgress; // Fade from 0 to 0.5
        setVideoOpacity(Math.min(0.5, opacity));
      }
      // Normal playback - full opacity
      else {
        setVideoOpacity(0.5);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoError]);

  // Ensure video plays and stays muted (especially important for mobile)
  useEffect(() => {
    const video = videoRef.current;
    if (video && !videoError) {
      // Ensure video is muted to avoid autoplay issues
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      
      // Load the video first
      video.load();
      
      // Try to play after load
      const tryPlay = () => {
        if (video && !videoError) {
          video.muted = true;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // If autoplay fails, try again after a short delay (common on mobile)
              setTimeout(() => {
                if (video && video.paused && !videoError) {
                  video.muted = true;
                  video.play().catch(() => {
                    // Auto-play was prevented, will need user interaction
                  });
                }
              }, 300);
            });
          }
        }
      };

      // Try playing when video is ready
      if (video.readyState >= 2) {
        tryPlay();
      } else {
        video.addEventListener('loadeddata', tryPlay, { once: true });
        video.addEventListener('canplay', tryPlay, { once: true });
      }
    }
  }, [videoError]);

  // Handle user interaction to trigger video play on mobile
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasUserInteracted) return;

    const tryPlayVideo = () => {
      if (video && video.paused && !hasUserInteracted) {
        video.muted = true;
        video.play()
          .then(() => {
            setHasUserInteracted(true);
          })
          .catch(() => {
            // Ignore errors
          });
      }
    };

    // Listen for various user interactions
    const events = ['touchstart', 'touchend', 'click', 'scroll', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, tryPlayVideo, { once: true, passive: true });
    });

    // Also try on visibility change (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && video && video.paused) {
        tryPlayVideo();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, tryPlayVideo);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUserInteracted]);

  const handleUserInteraction = () => {
    const video = videoRef.current;
    if (video && video.paused && !hasUserInteracted) {
      video.muted = true;
      video.play()
        .then(() => {
          setHasUserInteracted(true);
        })
        .catch(() => {
          // Ignore errors
        });
    }
  };

  return (
    <section 
      className="relative min-h-screen md:h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: `calc(64px + env(safe-area-inset-top, 0px))` }}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Background Video with fallback image */}
      <div className="absolute inset-0 z-[1]">
        {!videoError ? (
          <video
            ref={videoRef}
            poster={TRANSPARENT_VIDEO_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            controlsList="nodownload noremoteplayback nofullscreen"
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ease-in-out"
            style={{
              opacity: videoOpacity,
              zIndex: 1,
              WebkitAppearance: 'none',
            }}
            onLoadedMetadata={(e) => {
              // Ensure video is muted and plays (critical for mobile)
              const video = e.currentTarget;
              video.muted = true;
              video.setAttribute('muted', '');
              video.play().catch(() => {
                // If autoplay fails, try again after metadata loads
                setTimeout(() => {
                  if (video && video.paused) {
                    video.muted = true;
                    video.play().catch(() => {
                      // Auto-play prevented, will play on user interaction
                    });
                  }
                }, 200);
              });
            }}
            onCanPlay={(e) => {
              // Try to play when video can play (helps with mobile)
              const video = e.currentTarget;
              if (video.paused) {
                video.muted = true;
                video.play().catch(() => {
                  // Ignore errors - will play on interaction if needed
                });
              }
            }}
            onError={() => {
              setVideoError(true);
            }}
            onPlay={() => {
              // Video is playing, ensure it stays muted
              if (videoRef.current) {
                videoRef.current.muted = true;
              }
            }}
          >
            <source src="/videos/base-background-1-video.mp4" type="video/mp4" />
          </video>
        ) : null}
        {/* Fallback background image - only show if video failed */}
        <img 
          src="/base-background-1.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            opacity: 0.5,
            zIndex: videoError ? 1 : 0
          }}
        />
      </div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse z-[2]" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000 z-[2]" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 md:py-8 text-center flex flex-col items-center">
        {/* Secondary transparent card container */}
        <div 
          className="relative rounded-2xl p-6 sm:p-8 md:p-10 md:py-8 w-full max-w-4xl mb-12 md:mb-0 bg-card/60 backdrop-blur-md"
          style={{
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-md border border-primary/30 mb-6 md:mb-4 shadow-elegant animate-fade-in">
            <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">Your Ultimate Manifestation Powertool</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-4 leading-tight text-foreground">
            <span className="inline-block animate-[fade-in_0.6s_ease-out]">Palette Plotting</span>
          </h1>
          
          <p className="text-xl md:text-xl text-foreground/90 mb-3 md:mb-3 max-w-3xl mx-auto font-medium">
            Script Your Life
          </p>
          
          <p className="text-base md:text-base text-muted-foreground mb-3 md:mb-2 max-w-2xl mx-auto leading-relaxed">
            Use subliminals with your own voice, digital mirror work, custom affirmations, visualization, and consistent reflection to work towards reaching your goals.
          </p>
          <p className="text-base md:text-base font-bold text-foreground mb-8 md:mb-6 max-w-2xl mx-auto leading-relaxed">
            Now available on the Apple App Store.
          </p>
          
          <div className="flex flex-row gap-2 sm:gap-4 md:gap-3 justify-center mb-4 md:mb-0 w-full">
            {showWebSignup ? (
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 transition-all duration-300 text-base sm:text-lg md:text-base px-4 sm:px-8 md:px-6 md:w-[220px] flex-1 md:flex-none min-w-0"
                onClick={() => navigate("/onboarding/welcome")}
              >
                Get started
              </Button>
            ) : null}
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 transition-all duration-300 text-base sm:text-lg md:text-base px-4 sm:px-8 md:px-6 md:w-[220px] flex-1 md:flex-none min-w-0"
              onClick={() => navigate("/what-is-palette-plotting")}
            >
              See What&apos;s Inside
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
