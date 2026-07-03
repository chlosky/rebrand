
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";
import { AffirmationSet, getLocalizedPremadeSets } from "@/lib/affirmations-data";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { recordDailyManifestationSignal } from "@/lib/manifestationPowerSignals";
import { useTheme } from "@/contexts/ThemeContext";

const AffirmationViewer = () => {
  const { t } = useTranslation("tools");
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isNative = useIsNativeApp();
  const isNativeIosMobile =
    isMobile && isNative && Capacitor.getPlatform() === "ios";
  const [currentSet, setCurrentSet] = useState<AffirmationSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const prevAutoPlayRef = useRef(false);
  
  const baseSpeed = 3;
  const speedOptions = [0.5, 1, 1.5, 2];
  const getCurrentSpeed = () => baseSpeed / speedMultiplier;

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    prevAutoPlayRef.current = false;
  }, [setId]);

  useEffect(() => {
    const loadSet = async () => {
      if (!setId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // First check premade sets (instant, no database query)
      const premadeSet = getLocalizedPremadeSets().find(s => s.id === setId);
      if (premadeSet) {
        setCurrentSet(premadeSet);
        setIsLoading(false);
        return;
      }

      // If not premade, load from database
      try {
        // Refresh session to ensure auth.uid() works correctly in RLS
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('No valid session found');
          }
          setIsLoading(false);
          return;
        }

        // Load only the specific set by ID - RLS will automatically filter by auth.uid() = user_id
        const { data: dbSet, error: dbError } = await (supabase as any)
          .from('user_affirmation_sets')
          .select('*')
          .eq('id', setId)
          .maybeSingle();

        if (dbError) {
          console.error("Error loading affirmation set from database:", dbError);
          setIsLoading(false);
          return;
        }

        if (dbSet) {
          // Convert database set to AffirmationSet format
          const foundSet: AffirmationSet = {
            id: dbSet.id,
            name: dbSet.name,
            affirmations: dbSet.affirmations as string[],
            images: dbSet.images as any[],
            isPremade: false,
            category: dbSet.category || undefined,
          };
          setCurrentSet(foundSet);
        }
      } catch (error) {
        console.error("Error loading affirmation set from database:", error);
      }
      
      setIsLoading(false);
    };

    loadSet();
  }, [setId]);

  // Preload all images when component mounts
  useEffect(() => {
    if (!currentSet || !currentSet.images) return;
    
    const validImages = currentSet.images.filter((img) => 
      img && typeof img === 'object' && img.url && typeof img.url === 'string'
    );
    
    // Preload images with high priority using both Image() and link preload
    validImages.forEach((img, index) => {
      // Method 1: Use Image() constructor
      const image = new Image();
      image.src = img.url;
      
      // Method 2: Add preload link tags for even faster loading
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.url;
      // Give higher priority to first few images
      if (index < 3) {
        (link as any).fetchPriority = 'high';
      }
      document.head.appendChild(link);
    });
    
    // Cleanup preload links on unmount
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
      preloadLinks.forEach(link => {
        if (validImages.some(img => img.url === link.getAttribute('href'))) {
          link.remove();
        }
      });
    };
  }, [currentSet]);

  useEffect(() => {
    if (isAutoPlay && !prevAutoPlayRef.current && currentSet) {
      void recordDailyManifestationSignal("affirm_visualize");
    }
    prevAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay, currentSet]);

  useEffect(() => {
    if (!isAutoPlay || !currentSet) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev < currentSet.affirmations.length - 1 ? prev + 1 : 0
      );
    }, getCurrentSpeed() * 1000);

    return () => clearInterval(interval);
  }, [isAutoPlay, speedMultiplier, currentSet]);

  const goToNext = () => {
    if (!currentSet) return;
    setCurrentIndex((prev) => 
      prev < currentSet.affirmations.length - 1 ? prev + 1 : 0
    );
  };

  const goToPrevious = () => {
    if (!currentSet) return;
    setCurrentIndex((prev) => 
      prev > 0 ? prev - 1 : currentSet.affirmations.length - 1
    );
  };

  if (isLoading) {
    return (
      <div
        className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0 flex items-center justify-center")}
        style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
      >
        <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-8 text-center") : "p-8 text-center"}>
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("affirmationViewer.loading")}</p>
        </Card>
      </div>
    );
  }

  if (!currentSet) {
    return (
      <div
        className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0 flex items-center justify-center")}
        style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
      >
        <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-8 text-center") : "p-8 text-center"}>
          <p className="text-muted-foreground mb-4">{t("affirmationViewer.notFound")}</p>
          <Button onClick={() => navigate("/dashboard/affirmations-builder")}>
            {t("affirmationViewer.goToAffirmations")}
          </Button>
        </Card>
      </div>
    );
  }

  const currentAffirmation = currentSet.affirmations[currentIndex];
  
  // Use only images that have a valid URL, cap to affirmation count, and map 1:1
  const validImages = currentSet.images?.filter((img) => 
    img && typeof img === 'object' && img.url && typeof img.url === 'string'
  ) ?? [];
  
  const cappedImages = validImages.slice(0, currentSet.affirmations.length);
  
  // Map each affirmation to its corresponding image (1:1 mapping)
  const currentImage = cappedImages.length > currentIndex ? cappedImages[currentIndex] : null;

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0 overflow-x-hidden w-full max-w-full")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
      <header
        className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
        style={
          isMobile
            ? undefined
            : { top: "env(safe-area-inset-top, 0px)", left: 0, right: 0 }
        }
      >
        <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between relative z-10", isMobile ? "container mx-auto" : "")}>
          <h1
            className={cn(theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity", "truncate leading-tight")}
            onClick={() => navigate("/dashboard/affirmations-builder")}
          >
            {currentSet.name}
          </h1>
          {isMobile && <MobilePWAMenu />}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6",
          !isMobile
            ? "pt-16 max-w-4xl mx-auto"
            : cn(
                "container mx-auto max-w-4xl",
                // Native iPhone: extra air under sticky header (triple prior pt-10).
                isNativeIosMobile ? "pt-[7.5rem]" : "pt-3",
              ),
        )}
      >
        <div className="w-full">
          <p className="pt-2 pb-2 text-center text-xs text-muted-foreground sm:text-sm">
            {t("affirmationViewer.progress", { current: currentIndex + 1, total: currentSet.affirmations.length })}
          </p>

          {/* Main Affirmation Display with Background Image */}
          <Card className="mb-4 bg-card/50 backdrop-blur-sm border-primary/20 min-h-[260px] sm:min-h-[360px] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
            {currentImage && currentImage.url && (
              <div 
                key={`image-${currentIndex}`}
                className="absolute inset-0 opacity-50 transition-opacity duration-300 ease-in-out"
                style={{ 
                  backgroundImage: `url("${currentImage.url}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}
            {/* Hidden images for preloading */}
            <div className="hidden">
              {cappedImages.map((img) => (
                <img key={img.id} src={img.url} alt="" />
              ))}
            </div>
            <div className="relative z-10 w-full px-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-center leading-relaxed animate-fade-in break-words overflow-wrap-anywhere">
                {currentAffirmation}
              </p>
            </div>
          </Card>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="min-w-[140px] bg-card text-card-foreground hover:bg-card/90 border-2 border-border"
              >
                {isAutoPlay ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    {t("affirmationViewer.pause")}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    {t("affirmationViewer.autoPlay")}
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">{t("affirmationViewer.speed")}</span>
              {speedOptions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={speedMultiplier === s ? "default" : "outline"}
                  onClick={() => setSpeedMultiplier(s)}
                  className="min-w-[48px] h-8 text-xs"
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="mt-5 flex justify-center gap-2 flex-wrap pb-2">
            {currentSet.affirmations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default AffirmationViewer;
