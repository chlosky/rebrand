import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { getLocalizedPremadeSets, SUPPORT_CATEGORIES, getSupportCategoryLabel, type AffirmationSet } from "@/lib/affirmations-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { cn } from "@/lib/utils";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { MusicSynthesizer } from "@/lib/music-synthesizer";

function Freeplay() {
  const { t } = useTranslation("tools");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isCosmic = theme === "dark";

  const pianoOuterCardClass = isCosmic
    ? cn("rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm", "!bg-transparent !shadow-none")
    : "rounded-xl border border-border/70 bg-card text-card-foreground backdrop-blur-sm shadow-sm";

  const pianoInnerWellClass = isCosmic
    ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "rounded-xl !shadow-none")
    : "rounded-xl border border-border/60 bg-muted/25 shadow-sm";

  const pianoFieldChrome = isCosmic ? "!bg-transparent !border-white/12 !text-white" : "";

  const pianoMenuSurface = isCosmic ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "";

  const pianoPopoverSurface = cn(
    "border rounded-md shadow-lg",
    isCosmic ? "border-white/12 bg-[#0f0d14] text-white" : "bg-popover",
  );

  const pianoAffirmationBubble = cn(
    "rounded-lg shadow-lg backdrop-blur-md border",
    isCosmic
      ? "border-white/12 bg-transparent"
      : "border-border/50 bg-background/70",
  );
  const [selectedAffirmationSet, setSelectedAffirmationSet] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [affirmationSets, setAffirmationSets] = useState<AffirmationSet[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentAffirmationWords, setCurrentAffirmationWords] = useState<string[]>([]);
  const [currentAffirmationLines, setCurrentAffirmationLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const [colorFeedbackEnabled, setColorFeedbackEnabled] = useState(true);
  const [bgGradient, setBgGradient] = useState<string>("");
  const [colorIntensity, setColorIntensity] = useState<number>(0); // 0-1 scale for color intensity
  const [sparkles, setSparkles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }>>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const keyPressCountRef = useRef<number>(0);
  const lastKeyPressTimeRef = useRef<number>(0);
  
  const synthesizerRef = useRef<MusicSynthesizer | null>(null);
  const lastPressTimeRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pianoContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("freeplay.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Load affirmation sets
  useEffect(() => {
    const loadAffirmationSets = async () => {
      let allSets = [...getLocalizedPremadeSets()];
      if (user) {
        try {
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (freshSession?.access_token) {
            // @ts-ignore - user_affirmation_sets table exists but not in generated types
            const { data: dbSets } = await (supabase as unknown as {
              from: (table: string) => {
                select: (columns: string) => {
                  order: (column: string, options?: { ascending: boolean }) => Promise<{ data: any[] | null }>;
                };
              };
            })
              .from('user_affirmation_sets')
              .select('*')
              .order('created_at', { ascending: false });
            if (dbSets && dbSets.length > 0) {
              const userSets: AffirmationSet[] = dbSets.map((dbSet: any) => ({
                id: dbSet.id,
                name: dbSet.name,
                affirmations: Array.isArray(dbSet.affirmations) ? dbSet.affirmations : [],
                images: Array.isArray(dbSet.images) ? dbSet.images : [],
                category: dbSet.category,
                isPremade: false,
              }));
              allSets = [...userSets, ...allSets];
            }
          }
        } catch (error) {
          console.error("Error loading user affirmation sets:", error);
        }
      }
      setAffirmationSets(allSets);
    };
    loadAffirmationSets();
  }, [user]);

  // Initialize affirmation lines when set is selected
  useEffect(() => {
    if (selectedAffirmationSet && selectedAffirmationSet.trim() !== "") {
      const set = affirmationSets.find(s => s.id === selectedAffirmationSet);
      if (set) {
        // Store lines (one affirmation per line)
        setCurrentAffirmationLines(set.affirmations);
        setCurrentLineIndex(0);
        // Initialize words for first line
        if (set.affirmations.length > 0) {
          const firstLineWords = set.affirmations[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
        } else {
          setCurrentAffirmationWords([]);
        }
        setHighlightedWordIndex(-1);
        keyPressCountRef.current = 0;
      }
    } else {
      setCurrentAffirmationLines([]);
      setCurrentAffirmationWords([]);
      setCurrentLineIndex(0);
      setHighlightedWordIndex(-1);
      keyPressCountRef.current = 0;
    }
  }, [selectedAffirmationSet, affirmationSets]);

  // Initialize synthesizer
  useEffect(() => {
    synthesizerRef.current = new MusicSynthesizer();
    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.stop();
      }
    };
  }, []);

  // Pre-initialize audio context to prevent burst on first key press
  useEffect(() => {
    if (!synthesizerRef.current) {
      synthesizerRef.current = new MusicSynthesizer();
    }
    // Pre-initialize audio context (but don't resume until user interaction)
    synthesizerRef.current.ensureReady().catch(() => {
      // Ignore errors - audio context will be initialized on first user interaction
    });
  }, []);

  // Get category color helper
  const getCategoryColor = (categoryName: string | undefined): string => {
    if (!categoryName) return "#22c55e"; // Default green
    const category = SUPPORT_CATEGORIES.find(c => c.name === categoryName);
    return category?.color || "#22c55e";
  };

  // Generate harmonious color palette - different tones of the same color
  const getColorPalette = (baseColor: string): string[] => {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const colors: string[] = [];
    
    // Base color
    colors.push(baseColor);
    
    // Deep/darker tone (reduce brightness, keep saturation)
    colors.push(`rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`);
    
    // Medium-dark tone
    colors.push(`rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`);
    
    // Lighter tint (add white, keep hue)
    colors.push(`rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`);
    
    // Very light tint (pastel)
    colors.push(`rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`);
    
    // Slightly desaturated (more muted)
    const avg = (r + g + b) / 3;
    colors.push(`rgb(${Math.round(r * 0.7 + avg * 0.3)}, ${Math.round(g * 0.7 + avg * 0.3)}, ${Math.round(b * 0.7 + avg * 0.3)})`);
    
    return colors;
  };

  // Get current category color
  const selectedSet = affirmationSets.find(s => s.id === selectedAffirmationSet);
  const categoryColor = getCategoryColor(selectedSet?.category);
  const colorPalette = colorFeedbackEnabled && selectedSet?.category ? getColorPalette(categoryColor) : [categoryColor];

  // Create sparkles on key press at specific position with color palette
  const createSparkles = (palette: string[], x?: number, y?: number) => {
    if (!colorFeedbackEnabled || !pianoContainerRef.current) return;
    
    const container = pianoContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    // Use provided position or default to center
    const sparkleX = x !== undefined ? x : rect.width / 2;
    const sparkleY = y !== undefined ? y : rect.height / 2;
    
    const newSparkles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = Math.random() * 4 + 2;
      // Small random offset for more natural spread
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      // Pick a random color from the palette for variety
      const sparkleColor = palette[Math.floor(Math.random() * palette.length)];
      newSparkles.push({
        x: sparkleX + offsetX,
        y: sparkleY + offsetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: sparkleColor,
      });
    }
    setSparkles(prev => [...prev, ...newSparkles]);
  };

  // Animate sparkles
  useEffect(() => {
    if (sparkles.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      setSparkles(prev => {
        const updated = prev
          .map(s => ({ 
            ...s, 
            life: s.life - 0.03, 
            x: s.x + s.vx, 
            y: s.y + s.vy,
            vx: s.vx * 0.98, // Friction
            vy: s.vy * 0.98 + 0.2, // Gravity
          }))
          .filter(s => s.life > 0);
        
        if (updated.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
        
        return updated;
      });
    };
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [sparkles.length]);

  // Draw sparkles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (pianoContainerRef.current) {
        const rect = pianoContainerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let drawFrameRef: number | null = null;
    const sparklesRef = { current: sparkles };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      sparklesRef.current.forEach(sparkle => {
        ctx.save();
        ctx.globalAlpha = sparkle.life;
        ctx.fillStyle = sparkle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = sparkle.color;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (sparklesRef.current.length > 0) {
        drawFrameRef = requestAnimationFrame(draw);
      } else {
        drawFrameRef = null;
      }
    };

    // Update ref and restart draw if needed
    sparklesRef.current = sparkles;
    if (sparkles.length > 0 && !drawFrameRef) {
      draw();
    }

    return () => {
      if (drawFrameRef) {
        cancelAnimationFrame(drawFrameRef);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [sparkles]);

  // Gradually fade color intensity when no keys are pressed
  useEffect(() => {
    if (!colorFeedbackEnabled || !selectedSet?.category) {
      setColorIntensity(0);
      return;
    }

    const fadeInterval = setInterval(() => {
      const timeSinceLastPress = Date.now() - lastKeyPressTimeRef.current;
      // Fade out after 2 seconds of no key presses
      if (timeSinceLastPress > 2000) {
        setColorIntensity(prev => Math.max(0, prev - 0.02)); // Fade slowly
      }
    }, 100);

    return () => clearInterval(fadeInterval);
  }, [colorFeedbackEnabled, selectedSet?.category]);

  // Helper to convert color to rgba or hex with opacity
  const colorWithOpacity = (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      // Hex color - convert to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const a = opacity / 255;
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    } else if (color.startsWith('rgb')) {
      // RGB color - convert to rgba
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = opacity / 255;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
    }
    return color;
  };

  // Update background gradient based on color intensity with complementary colors
  useEffect(() => {
    if (colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && colorPalette.length > 1) {
      // Intensity scales from 0 to 1, map to opacity 0% to 40%
      const maxOpacity = 40;
      const opacity1 = Math.round(colorIntensity * maxOpacity);
      const opacity2 = Math.round(colorIntensity * maxOpacity * 0.6);
      const opacity3 = Math.round(colorIntensity * maxOpacity * 0.4);
      const opacity4 = Math.round(colorIntensity * maxOpacity * 0.2);
      
      // Use multiple colors from palette for rich gradient
      const color1 = colorPalette[0]; // Base color
      const color2 = colorPalette[1]; // Lighter tint
      const color3 = colorPalette[2]; // Darker shade
      const color4 = colorPalette[3]; // Complementary
      
      const gradient = `radial-gradient(ellipse at center, ${colorWithOpacity(color1, opacity1)} 0%, ${colorWithOpacity(color2, opacity2)} 25%, ${colorWithOpacity(color3, opacity3)} 50%, ${colorWithOpacity(color4, opacity4)} 75%, transparent 100%)`;
      setBgGradient(gradient);
    } else {
      setBgGradient("");
    }
  }, [colorIntensity, selectedSet?.category, categoryColor, colorFeedbackEnabled, colorPalette]);

  const handlePianoNotePlay = (note: string, position?: { x: number; y: number }) => {
    if (!synthesizerRef.current) return;
    
    // Fire off note playback immediately without any blocking
    synthesizerRef.current.playNote(note, 0.5).catch(() => {
      // Ignore errors - note will retry if context initializes
    });
    
    // Increase color intensity with each key press
    if (colorFeedbackEnabled && selectedSet?.category) {
      lastKeyPressTimeRef.current = Date.now();
      setColorIntensity(prev => Math.min(1, prev + 0.08)); // Increase intensity, cap at 1
      createSparkles(colorPalette, position?.x, position?.y);
    }
    
    // Update word highlighting for freeplay with affirmations
    if (selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0) {
      keyPressCountRef.current += 1;
      const currentLineWordIndex = Math.min(keyPressCountRef.current - 1, currentAffirmationWords.length - 1);
      setHighlightedWordIndex(currentLineWordIndex);
      
      // Move to next line when all words in current line are highlighted
      if (currentLineWordIndex >= currentAffirmationWords.length - 1) {
        if (currentLineIndex < currentAffirmationLines.length - 1) {
          // Move to next line
          const nextLineIndex = currentLineIndex + 1;
          setCurrentLineIndex(nextLineIndex);
          const nextLineWords = currentAffirmationLines[nextLineIndex].split(/\s+/);
          setCurrentAffirmationWords(nextLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        } else {
          // Loop back to the beginning
          setCurrentLineIndex(0);
          const firstLineWords = currentAffirmationLines[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        }
      }
    }
  };

  const renderContent = () => {
    if (isMobile) {
      // Setup screen - before starting
      if (!hasStarted) {
        return (
          <div 
            className={cn(
              cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
              theme === "dark" ? "min-h-screen" : "min-h-screen bg-background",
              "pb-[calc(7rem+env(safe-area-inset-bottom))] transition-all duration-500",
            )}
            style={
              bgGradient
                ? { ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }, backgroundImage: bgGradient }
                : { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
            }
          >
            {/* Safe area — theme background */}
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
{/* Header */}
            <header
              className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]")}
              style={theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
                <div className="flex items-center justify-between">
                <h1 
                  className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
                  onClick={() => navigate("/dashboard")}
                >
                  {t("freeplay.title")}
                </h1>
                  {/* PWA Browser Mobile Menu */}
                  {isMobile && <MobilePWAMenu />}
                </div>
              </div>
            </header>

            <main className={cn("px-4 sm:px-6 max-w-6xl relative z-10", !isMobile ? "" : "container mx-auto")}>
              <div className="py-3 sm:py-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t("freeplay.subtitleMobile")}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                {/* Affirmation Set Selector */}
                <Card className={cn(pianoOuterCardClass, "w-full max-w-md")}>
                  <CardContent className="p-3 sm:p-4">
                    <div className={cn("flex flex-col gap-4 p-4", pianoInnerWellClass)}>
                      <div className="flex flex-col gap-3">
                        <Label className="text-sm font-medium">{t("freeplay.affirmationSetOptional")}</Label>
                        <div className="relative">
                          <Button 
                            variant="outline" 
                            className={cn("w-full h-12 flex items-center justify-between", pianoFieldChrome)}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            <span>
                              {selectedAffirmationSet ? affirmationSets.find(s => s.id === selectedAffirmationSet)?.name || t("freeplay.none") : t("freeplay.none")}
                            </span>
                          </Button>
                          {isDropdownOpen && (
                            <div 
                              className={cn(
                                "absolute top-full mt-2 left-0 right-0 p-1 z-50 max-h-[300px] overflow-y-auto",
                                pianoPopoverSurface,
                              )}
                            >
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedAffirmationSet("");
                                    setIsDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left",
                                    !selectedAffirmationSet && "bg-accent"
                                  )}
                                >
                                  {t("freeplay.none")}
                                </button>
                                {affirmationSets.map((set) => (
                                  <button
                                    key={set.id}
                                    onClick={() => {
                                      setSelectedAffirmationSet(set.id);
                                      setIsDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left",
                                      selectedAffirmationSet === set.id && "bg-accent"
                                    )}
                                  >
                                    {set.name}
                                    {set.category ? ` · ${getSupportCategoryLabel(set.category)}` : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Color Feedback Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="color-feedback" className="text-sm font-medium">
                          {t("freeplay.colorFeedback")}
                        </Label>
                        <Switch
                          id="color-feedback"
                          checked={colorFeedbackEnabled}
                          onCheckedChange={setColorFeedbackEnabled}
                        />
                      </div>
                      {/* Start Button */}
                      <Button 
                        className="w-full mt-4" 
                        size="lg"
                        onClick={() => setHasStarted(true)}
                      >
                        {t("freeplay.start")}
                      </Button>
                      <p className="mt-2 text-xs text-red-600 leading-snug">{t("freeplay.iphoneAudioHint")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        );
      }

      // Piano screen - after starting
      return (
        <div 
          className={cn(
            cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
            theme === "dark" ? "min-h-screen" : "min-h-screen bg-background",
            "pb-[calc(7rem+env(safe-area-inset-bottom))] transition-all duration-500",
          )}
          style={
            bgGradient
              ? { ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }, backgroundImage: bgGradient }
              : { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
          }
        >
          {/* Safe area — theme background */}
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
{/* Header */}
            <header
              className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]")}
              style={theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
              <div className="flex items-center justify-between">
                <h1 
                  className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
                  onClick={() => setHasStarted(false)}
                >
                  {t("freeplay.title")}
                </h1>
                {/* PWA Browser Mobile Menu */}
                {isMobile && <MobilePWAMenu />}
              </div>
              </div>
            </header>

          <main className={cn(
            "px-4 sm:px-6 max-w-6xl relative z-10",
            !isMobile ? "" : "container mx-auto",
            isMobile ? "flex items-center justify-center min-h-[calc(100vh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-7rem)] pt-8" : "pt-2"
          )}>
            <div className={cn(
              isMobile ? "relative w-full" : "space-y-6"
            )}>
                {/* Piano Keyboard */}
                <Card 
                  className={cn(
                    pianoOuterCardClass,
                    "overflow-visible transition-all duration-300",
                    isMobile ? "max-w-[90%] mx-auto" : "mx-auto",
                    colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && "transition-all duration-300"
                  )}
                >
                     <CardContent className="p-3 sm:p-4 overflow-visible">
                       <div
                         className={cn("overflow-visible space-y-3", pianoInnerWellClass)}
                         style={
                           colorFeedbackEnabled &&
                           selectedSet?.category &&
                           categoryColor &&
                           colorIntensity > 0 &&
                           colorPalette.length > 1
                             ? {
                                 background: `linear-gradient(135deg, ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 100))} 0%, ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 80))} 30%, ${colorWithOpacity(colorPalette[2], Math.round(colorIntensity * 60))} 60%, ${colorWithOpacity(colorPalette[3], Math.round(colorIntensity * 40))} 100%)`,
                                 boxShadow: `0 0 ${Math.round(colorIntensity * 50)}px ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 100))}, inset 0 0 ${Math.round(colorIntensity * 30)}px ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 40))}`,
                               }
                             : undefined
                         }
                       >
                       <div className={cn(
                         "relative overflow-visible w-full",
                         isMobile && "max-w-[85%] ml-0"
                       )} ref={pianoContainerRef}>
                      {/* Sparkles Canvas */}
                      {colorFeedbackEnabled && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 pointer-events-none z-20"
                          style={{ width: '100%', height: '100%' }}
                        />
                      )}
                      {/* Affirmation Overlay - only for freeplay with affirmations */}
                      {selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                        <div className={cn(
                          "absolute z-30 pointer-events-none",
                          isMobile ? "right-[-80px] top-1/2 transform -translate-y-1/2" : "right-2 top-1/2 transform -translate-y-1/2"
                        )}>
                          <div className={cn(
                            pianoAffirmationBubble,
                            isMobile ? "px-4 py-3 min-w-[60px]" : "px-5 py-4 min-w-[80px]"
                          )}>
                            <div 
                              className={cn(
                                "flex justify-center items-start font-semibold select-none",
                                isMobile ? "text-lg gap-1.5" : "text-lg gap-3"
                              )}
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', userSelect: 'none' }}
                            >
                              {currentAffirmationWords.map((word, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "transition-all duration-200 inline-block select-none",
                                    index === highlightedWordIndex
                                      ? "font-bold scale-110 drop-shadow-lg"
                                      : "text-foreground/90"
                                  )}
                                  style={{ 
                                    ...(index === highlightedWordIndex ? {
                                      color: colorFeedbackEnabled && selectedSet?.category ? categoryColor : "#22c55e"
                                    } : {}),
                                    userSelect: 'none'
                                  }}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <PianoKeyboard 
                        onNotePlay={handlePianoNotePlay}
                        activeColor={colorFeedbackEnabled && selectedSet?.category && colorPalette.length > 0 ? colorPalette[0] : undefined}
                      />
                    </div>
                       </div>
                  <p className="text-xs text-red-600 leading-snug pt-2">{t("freeplay.iphoneAudioHint")}</p>
                  </CardContent>
                </Card>
            </div>
          </main>
        </div>
      );
    }

    // Desktop view
    return (
      <div 
        className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), "min-h-screen pb-20 md:pb-0 relative overflow-hidden transition-all duration-500")}
        style={
          bgGradient
            ? { ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }, backgroundImage: bgGradient }
            : { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
        }
      >
        {/* Status bar / notch: theme token (light / dark) — matches Subliminal / Backgrounds */}
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
<div className="flex h-screen">
          {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
          <div 
            className="flex-1 flex flex-col overflow-hidden relative z-10"
            style={!isMobile ? {
              marginLeft: sidebarCollapsed ? '64px' : '256px',
              transition: 'margin-left 300ms ease-in-out'
            } : {}}
          >
            {/* Header */}
            <header
              className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
              style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
                <h1 className="text-lg font-bold text-foreground">
                  {t("freeplay.title")}
                </h1>
              </div>
            </header>

             <main className={cn("flex-1 overflow-y-auto", !isMobile ? "pt-10" : "")}>
               <div className={cn("px-4 sm:px-6 py-4 sm:py-6 max-w-6xl", !isMobile ? "" : "container mx-auto")}>
                 <div className="py-3 sm:py-4">
                   <p className="text-sm sm:text-base text-muted-foreground">
                     {t("freeplay.subtitleDesktop")}
                   </p>
                 </div>
                 <div className="space-y-6">
                   {/* Affirmation Selection - Above Piano */}
                   <Card className={pianoOuterCardClass}>
                     <CardContent className="p-3 sm:p-4">
                       <div className={cn("p-4", pianoInnerWellClass)}>
                       <div className="flex items-center gap-4">
                         <div className="flex-1">
                           <Label className="text-sm font-medium">{t("freeplay.affirmationSetOptional")}</Label>
                           <Select 
                             value={selectedAffirmationSet || undefined} 
                             onValueChange={(value) => setSelectedAffirmationSet(value === "none" ? "" : value)}
                           >
                             <SelectTrigger className={cn("mt-2", pianoFieldChrome)}>
                               <SelectValue placeholder={t("freeplay.none")} />
                             </SelectTrigger>
                             <SelectContent className={cn(pianoMenuSurface || "bg-background")}>
                               <SelectItem value="none">{t("freeplay.none")}</SelectItem>
                               {affirmationSets.map((set) => (
                                 <SelectItem key={set.id} value={set.id}>
                                   {set.name}
                                   {set.category ? ` · ${getSupportCategoryLabel(set.category)}` : ""}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         {/* Color Feedback Toggle - To the right when affirmation is selected */}
                         {selectedAffirmationSet && selectedAffirmationSet !== "none" && (
                           <div className="flex items-end pb-2">
                             <div className="flex items-center gap-3">
                               <Label htmlFor="color-feedback-desktop" className="text-sm font-medium whitespace-nowrap">
                                 {t("freeplay.colorFeedback")}
                               </Label>
                               <Switch
                                 id="color-feedback-desktop"
                                 checked={colorFeedbackEnabled}
                                 onCheckedChange={setColorFeedbackEnabled}
                               />
                             </div>
                           </div>
                         )}
                       </div>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Piano Keyboard */}
                   <Card 
                     className={cn(
                       pianoOuterCardClass,
                       "overflow-visible transition-all duration-300",
                       isMobile ? "max-w-[90%] ml-0" : "mx-auto",
                       colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && "transition-all duration-300"
                     )}
                   >
                     <CardContent className="p-3 sm:p-4 overflow-visible relative">
                       <div
                         className={cn("overflow-visible space-y-3 relative", pianoInnerWellClass)}
                         style={
                           colorFeedbackEnabled &&
                           selectedSet?.category &&
                           categoryColor &&
                           colorIntensity > 0 &&
                           colorPalette.length > 1
                             ? {
                                 background: `linear-gradient(135deg, ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 100))} 0%, ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 80))} 30%, ${colorWithOpacity(colorPalette[2], Math.round(colorIntensity * 60))} 60%, ${colorWithOpacity(colorPalette[3], Math.round(colorIntensity * 40))} 100%)`,
                                 boxShadow: `0 0 ${Math.round(colorIntensity * 50)}px ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 100))}, inset 0 0 ${Math.round(colorIntensity * 30)}px ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 40))}`,
                               }
                             : undefined
                         }
                       >
                       {/* Affirmation Overlay - positioned relative to CardContent */}
                       {selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                         <div className={cn(
                           "absolute z-30 pointer-events-none",
                           isMobile 
                             ? "right-2 top-1/2 -translate-y-1/2" 
                             : "left-1/2 top-4 -translate-x-1/2"
                         )}>
                           <div className={cn(
                             pianoAffirmationBubble,
                             isMobile ? "px-4 py-3 min-w-[60px]" : "px-4 py-2"
                           )}>
                             <div 
                               className={cn(
                                 "font-semibold select-none",
                                 isMobile 
                                   ? "flex justify-center items-start gap-3 text-xl"
                                   : "flex flex-wrap justify-center items-center gap-2 text-base"
                               )}
                               style={isMobile ? { writingMode: 'vertical-rl', textOrientation: 'mixed', userSelect: 'none' } : { userSelect: 'none' }}
                             >
                               {currentAffirmationWords.map((word, index) => (
                                 <span
                                   key={index}
                                   className={cn(
                                     "transition-all duration-200 inline-block select-none",
                                     index === highlightedWordIndex
                                       ? "font-bold scale-110 drop-shadow-lg"
                                       : "text-foreground/90"
                                   )}
                                   style={{ 
                                     ...(index === highlightedWordIndex ? {
                                       color: colorFeedbackEnabled && selectedSet?.category ? categoryColor : "#22c55e"
                                     } : {}),
                                     userSelect: 'none'
                                   }}
                                 >
                                   {word}
                                 </span>
                               ))}
                             </div>
                           </div>
                         </div>
                       )}
                       <div className={cn(
                         "relative overflow-visible w-full",
                         isMobile && "max-w-[85%] ml-0"
                       )} ref={pianoContainerRef}>
                         {/* Sparkles Canvas */}
                         {colorFeedbackEnabled && (
                           <canvas
                             ref={canvasRef}
                             className="absolute inset-0 pointer-events-none z-20"
                             style={{ width: '100%', height: '100%' }}
                           />
                         )}
                         <PianoKeyboard 
                           onNotePlay={handlePianoNotePlay}
                           activeColor={colorFeedbackEnabled && selectedSet?.category && colorPalette.length > 0 ? colorPalette[0] : undefined}
                         />
                       </div>
                       </div>
                     <p className="text-xs text-red-600 leading-snug pt-2">{t("freeplay.iphoneAudioHint")}</p>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             </main>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

export default Freeplay;