import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { DeviceAutomationModal } from "@/components/DeviceAutomationModal";
import { generateWeeklyCheckinICS, downloadICS } from "@/lib/calendar-utils";
import { Capacitor } from "@capacitor/core";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import {
  ALL_EMBODY_PRACTICE_KEYS,
  type EmbodyPracticeKey,
} from "@/lib/embodyPracticesCatalog";

const PRACTICE_I18N_KEYS: Record<EmbodyPracticeKey, string> = {
  rest: "double.choose.practices.rest",
  "self-care": "double.choose.practices.selfCare",
  clean: "double.choose.practices.clean",
  "drink-water": "double.choose.practices.drinkWater",
  "have-fun": "double.choose.practices.haveFun",
  exercise: "double.choose.practices.exercise",
  "glam-up": "double.choose.practices.glamUp",
  connect: "double.choose.practices.connect",
  seen: "double.choose.practices.seen",
  work: "double.choose.practices.work",
};

const THEME_I18N_KEYS: Record<string, string> = {
  Transitions: "double.choose.themes.transitions",
  Career: "double.choose.themes.career",
  Finance: "double.choose.themes.finance",
  Identity: "double.choose.themes.identity",
  Love: "double.choose.themes.love",
  "Self Concept": "double.choose.themes.selfConcept",
  "Self Image": "double.choose.themes.selfImage",
  Fitness: "double.choose.themes.fitness",
};

// Character definitions
const characters = [
  {
    id: "river",
    name: "River",
    headshot: "/headshots/river-headshot-2.png",
    characterId: "girl-1",
    themes: ["Transitions", "Career"],
    bubbleColor: "#4AC7FF",
  },
  {
    id: "sage",
    name: "Sage",
    headshot: "/headshots/sage-headshot.png",
    characterId: "girl-2",
    themes: ["Finance", "Identity"],
    bubbleColor: "#8fbf76",
  },
  {
    id: "rose",
    name: "Rose",
    headshot: "/headshots/rose-headshot.png",
    characterId: "girl-3",
    themes: ["Love", "Self Concept"],
    bubbleColor: "#FFB6C1",
  },
  {
    id: "oliver",
    name: "Oliver",
    headshot: "/headshots/oliver-headshot.png",
    characterId: "boy-1",
    themes: ["Self Image", "Fitness"],
    bubbleColor: "#FFC107",
  }
];

const ChooseDouble: React.FC = () => {
  const { t } = useTranslation(["tools", "common"]);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeKeys: activePracticeKeys, loaded: embodyLoaded, reload: reloadActivePractices } =
    useEmbodyActivePractices();
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [pendingCharacterChange, setPendingCharacterChange] = useState<string | null>(null);
  const [showCharacterConfirmDialog, setShowCharacterConfirmDialog] = useState(false);
  
  const [showDeviceAutomationModal, setShowDeviceAutomationModal] = useState(false);
  const [practiceDraft, setPracticeDraft] = useState<EmbodyPracticeKey[]>(() =>
    (activePracticeKeys as EmbodyPracticeKey[]).slice(),
  );
  const [savingPractices, setSavingPractices] = useState(false);
  /** Only hydrate checklist from DB once per user — avoid overwriting edits when reload()/refetch resets hook fallbacks. */
  const practiceDraftSeededRef = useRef(false);

  useEffect(() => {
    practiceDraftSeededRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!embodyLoaded || !user?.id) return;
    if (practiceDraftSeededRef.current) return;
    setPracticeDraft((activePracticeKeys as EmbodyPracticeKey[]).slice());
    practiceDraftSeededRef.current = true;
  }, [embodyLoaded, user?.id, activePracticeKeys]);

  const togglePractice = (k: EmbodyPracticeKey) => {
    setPracticeDraft((prev) => {
      if (prev.includes(k)) return prev.filter((x) => x !== k);
      if (prev.length >= 5) return prev;
      return [...prev, k];
    });
  };

  const savePractices = async () => {
    if (!user?.id) return;
    if (practiceDraft.length !== 5) return;
    setSavingPractices(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, embody_active_practices: practiceDraft }, { onConflict: "user_id" });
      if (error) throw error;
      await reloadActivePractices();
    } catch (e) {
      console.error("save embody practices:", e);
      toast({ title: t("tools:double.choose.toast.error"), description: t("tools:double.choose.toast.saveFailed"), variant: "destructive" });
    } finally {
      setSavingPractices(false);
    }
  };

  // Handle calendar download
  const handleCalendarDownload = () => {
    try {
      const icsContent = generateWeeklyCheckinICS();
      downloadICS(icsContent);
      toast({
        title: t("tools:double.choose.toast.downloaded"),
        description: t("tools:double.choose.toast.calendarDownloaded"),
      });
    } catch (error) {
      console.error('Error generating calendar file:', error);
      toast({
        title: t("tools:double.choose.toast.error"),
        description: t("tools:double.choose.toast.calendarFailed"),
        variant: 'destructive',
      });
    }
  };

  // Load current character selection
  const loadCharacter = useCallback(async () => {
    if (user) {
      try {
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('No valid session found, cannot load character');
          }
          return;
        }

        const userId = freshSession.user.id;

        // Query database with cache-busting timestamp to prevent PWA browser caching
        const { data, error } = await supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data?.selected_character) {
          const charId = data.selected_character;
          if (characters.find(c => c.id === charId)) {
            setSelectedCharacter(charId);
          }
        }
      } catch (e) {
        console.error('Error loading character from database:', e);
      }
    } else {
      // User not logged in - ProtectedRoute should redirect
      // No need to load character from localStorage
    }
  }, [user]);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  // Handle character selection click
  const handleCharacterSelectClick = (characterId: string) => {
    if (selectedCharacter === characterId) {
      return;
    }
    
    setPendingCharacterChange(characterId);
    setShowCharacterConfirmDialog(true);
  };

  // Confirm and apply character change
  const confirmCharacterChange = async () => {
    if (!pendingCharacterChange) return;
    
    const characterId = pendingCharacterChange;
    const previousCharacter = selectedCharacter;
    
    setSelectedCharacter(characterId);
    setShowCharacterConfirmDialog(false);
    setPendingCharacterChange(null);
    
    if (user) {
      try {
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('No valid session found, cannot save character selection');
          }
          return;
        }

        const userId = freshSession.user.id;

        // Save to database only (no localStorage after signup)
        await supabase.from('user_preferences').upsert({
          user_id: userId,
          selected_character: characterId,
        }, { onConflict: 'user_id' });

        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ selected_character: characterId })
            .eq('id', userId);
          
          if (profileError && !profileError.message.includes('column') && !profileError.message.includes('does not exist')) {
            console.warn('Error syncing character to profiles:', profileError);
          }
        } catch (profileErr) {
          console.log('Profiles table may not have selected_character column, skipping sync');
        }

        try {
          await supabase.from('character_selection_log').insert({
            user_id: userId,
            selected_character: characterId,
            previous_character: previousCharacter || null,
            source: 'choose_double_page',
          });
        } catch (logError) {
          console.error('Error logging character selection:', logError);
        }
      } catch (e) {
        console.error('Error saving character selection:', e);
      }
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "flex flex-col pb-24 md:pb-8")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen flex flex-col"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
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

        <div className="relative z-10 flex flex-col min-h-screen">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/double')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}>
                {t("tools:double.choose.settings")}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className={cn("container mx-auto px-4 sm:px-6 max-w-2xl py-3", !isMobile ? "pt-16" : "")}>
        <div className="mb-3">
          <h2 className="text-sm font-semibold mb-1">{t("tools:double.choose.chooseGuide")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("tools:double.choose.chooseGuideSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {characters.map((character) => {
            const isSelected = selectedCharacter === character.id;
            const glowColor = character.bubbleColor;
            const isDarkMode = document.documentElement.classList.contains('dark');
            
            return (
              <Card
                key={character.id}
                onClick={() => handleCharacterSelectClick(character.id)}
                className={`relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 bg-white ${
                  isSelected 
                    ? 'border-transparent' 
                    : isDarkMode 
                      ? 'border-border/50' 
                      : 'border-white'
                }`}
                style={isSelected ? {
                  boxShadow: `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40, 0 0 60px ${glowColor}20`,
                } : !isDarkMode ? {
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.5), 0 0 16px rgba(255, 255, 255, 0.3)',
                } : {}}
              >
                {/* White underlay */}
                <div className="absolute inset-0 bg-white"></div>
                
                {/* Character Headshot Background */}
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={character.headshot} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Color Overlay */}
                <div 
                  className="absolute inset-0" 
                  style={{ backgroundColor: `${character.bubbleColor}33` }}
                ></div>
                
                {/* Content Overlay */}
                <div className="relative p-2 flex items-end justify-end h-full" style={{ aspectRatio: '1/1' }}>
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="text-sm font-bold text-black drop-shadow-sm">
                      {character.name}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      {character.themes.map((themeName, index) => (
                        <div
                          key={index}
                          className="rounded-full px-2 py-0.5 flex items-center justify-center min-w-[60px]"
                          style={{ backgroundColor: `${character.bubbleColor}E6` }}
                        >
                          <span className="text-[10px] font-medium text-white whitespace-nowrap">
                            {t(THEME_I18N_KEYS[themeName] ?? themeName)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card
          className={cn(
            "mt-5 p-4 rounded-xl shadow-sm",
            theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
            theme === "dark" && "!bg-transparent",
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{t("tools:double.choose.dailyPracticeChoices")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("tools:double.choose.dailyPracticeSubtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={savePractices}
                disabled={!user?.id || practiceDraft.length !== 5 || savingPractices}
                className={cn("h-9", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
              >
                {t("common:save")}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground tabular-nums">
              {t("tools:double.choose.selectedCount", { count: practiceDraft.length })}
            </p>

            <div
              className={cn(
                "rounded-lg border divide-y overflow-hidden",
                theme === "dark"
                  ? "border-white/12 bg-transparent divide-white/12"
                  : "border-border bg-background divide-border",
              )}
            >
              {ALL_EMBODY_PRACTICE_KEYS.map((k) => {
                const active = practiceDraft.includes(k);
                const label = t(PRACTICE_I18N_KEYS[k]);
                const id = `embody-choose-double-${k}`;
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-3.5"
                  >
                    <Label htmlFor={id} className="text-sm font-normal text-foreground cursor-pointer flex-1 leading-snug pr-2">
                      {label}
                    </Label>
                    <Checkbox
                      id={id}
                      checked={active}
                      onCheckedChange={(c) => {
                        if (c === true && !active) {
                          if (practiceDraft.length >= 5) return;
                          togglePractice(k);
                        } else if (c === false && active) {
                          togglePractice(k);
                        }
                      }}
                      className="shrink-0"
                      aria-label={active ? t("tools:double.choose.ariaSelected", { label }) : t("tools:double.choose.ariaNotSelected", { label })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Weekly Check-In Section - hidden */}
        <div className="mt-6 mb-3 hidden">
          <h2 className="text-sm font-semibold mb-1">{t("tools:double.choose.weeklyCheckIn")}</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {t("tools:double.choose.weeklyCheckInSubtitle")}
          </p>
          
          <div className="space-y-3">
            {/* Calendar Option */}
            <Card className="p-4">
              <div className="flex items-start gap-6">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t("tools:double.choose.addToCalendar")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("tools:double.choose.addToCalendarDesc")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalendarDownload}
                >
                    {t("tools:double.choose.addToCalendar")}
                </Button>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t("tools:double.choose.recommended")}</span>
                </div>
              </div>
            </Card>

            {/* Device Automation Option */}
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t("tools:double.choose.deviceAutomation")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("tools:double.choose.deviceAutomationDesc")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeviceAutomationModal(true)}
                >
                  {t("tools:double.choose.viewSetupSteps")}
                </Button>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t("tools:double.choose.advanced")}</span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>


      {/* Character Change Confirmation Dialog */}
      <Dialog open={showCharacterConfirmDialog} onOpenChange={setShowCharacterConfirmDialog}>
        <DialogContent className="w-auto max-w-fit p-4 [&>button]:hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">{t("tools:double.choose.changeDoubleTitle")}</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t("tools:double.choose.changeDoubleDescription", {
                from: selectedCharacter ? characters.find(c => c.id === selectedCharacter)?.name : t("tools:double.choose.yourCurrentCharacter"),
                to: pendingCharacterChange ? characters.find(c => c.id === pendingCharacterChange)?.name : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4 text-xs w-[80px]"
              onClick={() => {
                setShowCharacterConfirmDialog(false);
                setPendingCharacterChange(null);
              }}
            >
              {t("common:cancel")}
            </Button>
            <Button
              size="sm"
              className="h-8 px-4 text-xs w-[80px]"
              onClick={confirmCharacterChange}
              style={pendingCharacterChange ? {
                backgroundColor: characters.find(c => c.id === pendingCharacterChange)?.bubbleColor,
              } : {}}
            >
              {t("tools:double.choose.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Automation Modal */}
      <DeviceAutomationModal
        open={showDeviceAutomationModal}
        onOpenChange={setShowDeviceAutomationModal}
      />
        </div>
      </div>
    </div>
  );
};

export default ChooseDouble;

