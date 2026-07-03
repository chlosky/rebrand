import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { CustomIcon } from "@/components/icons/CustomIcon";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import goldenClouds from "@/assets/card-bg-golden-clouds.jpg";
import greenFoliage from "@/assets/card-bg-green-foliage.jpg";
import blueSky from "@/assets/card-bg-blue-sky.jpg";
import yellowHaze from "@/assets/card-bg-yellow-haze.jpg";
import blueMist from "@/assets/card-bg-blue-mist.jpg";
import mossGreen from "@/assets/card-bg-moss-green.jpg";
import { TRANSPARENT_VIDEO_POSTER } from "@/lib/nativeVideoPoster";

// Simple category definitions
const categoryTools: Record<string, Array<{ title: string; description: string; path: string; iconSrc?: string; icon?: any }>> = {
  design: [
    {
      title: "Affirm & Script",
      description: "Build affirmation sequences and visual goals",
      path: "/dashboard/affirmations-builder",
      iconSrc: "/Icons/Affirmations.svg"
    },
    {
      title: "Boards",
      description: "Plot your vision, home, and office on acrylic boards",
      path: "/dashboard/boards",
      iconSrc: "/Icons/Affirmations.svg"
    }
  ],
  review: [
    {
      title: "Embody",
      description: "Your daily companion for support and habit tracking",
      path: "/dashboard/double",
      iconSrc: "/Icons/Your Double.svg"
    },
    {
      title: "Your Journey",
      description: "Continue your AI companion chat — same thread as from Embody",
      path: "/dashboard/your-journey"
    },
    {
      title: "Manifestation Journal",
      description: "Capture notes and track your manifestation journey",
      path: "/dashboard/chrono",
      iconSrc: "/Icons/Timeline.svg"
    }
  ],
  experience: [
    {
      title: "Mirror Work",
      description: "Practice affirmations with real-time reflection",
      path: "/dashboard/mirror",
      iconSrc: "/Icons/Mirror.svg"
    },
    {
      title: "Piano Tapping",
      description: "Immerse yourself in your affirmation with music and color",
      path: "/dashboard/tap-in",
      icon: Music
    }
  ]
};

const categoryInfo: Record<string, { title: string; description: string }> = {
  design: {
    title: "Design",
    description: "Structure and refine your affirmations and beliefs"
  },
  review: {
    title: "Review",
    description: "Monitor & maintain momentum with tracking and guidance"
  },
  experience: {
    title: "Experience",
    description: "Immerse yourself in the end result with interactive tools"
  }
};

const CategoryList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = window.location.pathname;
  const category = location.split('/').pop() || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const tools = categoryTools[category] || [];
  const info = categoryInfo[category] || { title: "Category", description: "" };

  // Check if actually a mobile device (not just window width)
  // Character images should only show on actual mobile devices (PWA browser or standalone), not desktop
  const isActualMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const shouldShowCharacterImage = isActualMobileDevice;

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true) ||
    Capacitor.isNativePlatform();

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  // Ensure video plays
  useEffect(() => {
    const video = videoRef.current;
    if (video && !videoError) {
      // Try to play immediately
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasUserInteracted(true);
          })
          .catch(() => {
            // Auto-play was prevented, will play on user interaction
        });
      }
    }
  }, [videoError]);

  // Handle user interaction to trigger video play (for autoplay restrictions)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasUserInteracted || videoError) return;

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

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, tryPlayVideo);
      });
    };
  }, [hasUserInteracted, videoError]);

  // Fetch selected character
  useEffect(() => {
    const fetchCharacter = async () => {
      if (user) {
        // Always query database (no localStorage after signup) with cache-busting to prevent PWA browser caching
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', user.id)
          .maybeSingle();

        if (preferences?.selected_character) {
          setSelectedCharacter(preferences.selected_character);
        }
      }
    };

    fetchCharacter();
  }, [user]);

  return (
    <div 
      className={cn("relative overflow-hidden", isMobile ? "min-h-[100dvh]" : "min-h-screen pb-20 md:pb-0")}
    >
      {/* Solid bar under status bar on mobile (not transparent) */}
      {isMobile && (
        <div
          className={cn(
            "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
            theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            "z-40",
          )}
          aria-hidden
        />
      )}

      {/* Desktop Sidebar - Desktop only */}
      {!isMobile && (
        <DesktopToolSidebar onCollapsedChange={setSidebarCollapsed} />
      )}
      
      {/* Background Video with fallback image */}
      <div className="fixed inset-0 z-0">
        {/* Fallback background image - show initially and when video not playing */}
        <div 
          className="absolute inset-0 opacity-40 transition-opacity duration-500"
          style={{
            backgroundImage: 'url("/Sky Background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            zIndex: (!hasUserInteracted && !videoError) ? 1 : 0,
            opacity: (!hasUserInteracted && !videoError) ? 0.4 : (videoError ? 0.4 : 0),
          }}
        />
        {!videoError ? (
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
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500"
            style={{
              pointerEvents: 'none',
              zIndex: 1,
              opacity: hasUserInteracted ? 0.4 : 0,
              WebkitAppearance: 'none',
            } as React.CSSProperties}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              // Slow down the video playback
              video.playbackRate = 0.5;
              // Ensure it plays
              video.play().catch(() => {
                // Auto-play prevented, will play on user interaction
              });
            }}
            onError={() => {
              setVideoError(true);
            }}
            onPlay={() => {
              // Video is playing, ensure playback rate is set and hide fallback
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.5;
              }
              setHasUserInteracted(true);
            }}
          >
            <source src="/videos/blue-skies-video.mp4" type="video/mp4" />
          </video>
        ) : null}
      </div>
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-background/10 z-[1] pointer-events-none" />
      
      {/* Character overlay image at bottom - Mobile only (actual mobile devices, not desktop) */}
      {shouldShowCharacterImage && selectedCharacter && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none"
          style={{
            height: '40vh',
            backgroundImage: `url(${encodeURI(`/Dash & Cat Background Overlays/${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} - Grass.png`)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      
      {/* Content Container - Add left margin on desktop to account for sidebar */}
      <div 
        className="relative z-10 md:dark:border-l md:dark:border-border"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
        {/* Header - solid background on mobile so it doesn't look transparent */}
        <header
          className={cn(
            "border-b border-primary/10 md:h-16 flex items-center py-3 md:py-0 z-50 bg-background",
            isMobile ? "fixed top-0 left-0 right-0" : "sticky"
          )}
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="container mx-auto px-4 sm:px-6 w-full">
            <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-lg sm:text-xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/dashboard")}
              >
                {info.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {info.description}
              </p>
              </div>
              {/* PWA Browser Mobile Menu */}
              {isMobile && <MobilePWAMenu />}
            </div>
          </div>
        </header>

        {/* Main Content - on mobile start below header so first card isn't blocked */}
        <main
          className={cn(
            "container mx-auto px-4 sm:px-6 relative z-10",
            isMobile ? "pb-6" : "py-3 sm:py-6 pb-24 md:pb-20"
          )}
          style={isMobile ? {
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
            overflow: "hidden",
            overflowY: "auto",
            height: "calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 4.5rem)",
          } : undefined}
        >
          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mt-4">
            {tools.map((feature, index) => {
              const Icon = feature.icon || CustomIcon;
              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden cursor-pointer animate-fade-in h-[78px] sm:h-[92px] border-2 border-border backdrop-blur-sm focus:outline-none focus-visible:outline-none bg-card"
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.1s, opacity 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.currentTarget.style.opacity = '0.95';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.opacity = '0.95';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onClick={() => {
                    handleFeatureClick(feature.path);
                  }}
                >
                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between p-2.5 sm:p-4">
                    {/* Text */}
                    <div className="flex-1 space-y-1 relative z-10">
                      <h3 
                        className="text-base sm:text-xl font-semibold text-foreground leading-tight tracking-tight"
                      >
                        {feature.title}
                      </h3>
                      
                      <p 
                        className="text-[0.7rem] sm:text-xs text-foreground/80 font-normal leading-tight line-clamp-2"
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>

      </div>
    </div>
  );
};

export default CategoryList;

