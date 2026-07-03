import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useUserTier } from "@/hooks/useUserTier";
import { getTierLimits } from "@/lib/featureGating";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { extractRequestId, logErrorWithRequestId, isConnectionError, formatErrorMessage, localizeEdgeErrorMessage } from "@/lib/error-utils";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Diagnostic build only: set true to prove footer float is caused by `bottom` inset.
 * Footer stays at layout bottom (may sit behind keyboard). Flip false for real fix.
 */
const ANDROID_CHAT_DIAGNOSTIC_FOOTER_BOTTOM_ZERO = false;

interface Message {
  id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_user: boolean;
  character_type?: string; // Character who sent the message (for non-user messages)
}

// Character info
const characters: Record<string, { name: string; headshot: string; bubbleColor: string }> = {
  river: { name: "River", headshot: "/headshots/river-headshot-2.png", bubbleColor: "#4AC7FF" },
  sage: { name: "Sage", headshot: "/headshots/sage-headshot.png", bubbleColor: "#8fbf76" },
  rose: { name: "Rose", headshot: "/headshots/rose-headshot.png", bubbleColor: "#FFB6C1" },
  oliver: { name: "Oliver", headshot: "/headshots/oliver-headshot.png", bubbleColor: "#FFC107" },
};

const Chat: React.FC = () => {
  const { t, i18n } = useTranslation("tools");
  const apiLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : "en";
  const { t: tCommon } = useTranslation("common");
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, status } = useUserTier();
  const navigate = useNavigate();
  const userTimeZone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  
  useEffect(() => {
    if (!authLoading && user === null) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("chat.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t]);
  
  // Get today's date in the user's local timezone (calendar date)
  const getTodayLocal = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // en-CA yields YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  };
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  /**
   * Stale-while-revalidate: hydrate chat history from sessionStorage so re-entering Chat
   * within a session shows the conversation immediately instead of a centered spinner
   * while the 200-message Supabase query runs.
   */
  const chatMessagesCacheKey = user?.id ? `chatMessages_${user.id}` : null;
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined" || !chatMessagesCacheKey) return [];
    try {
      const raw = sessionStorage.getItem(chatMessagesCacheKey);
      if (!raw) return [];
      const cached = JSON.parse(raw) as Message[];
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Only show the full-area spinner if we have no cached history to render immediately.
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined" || !chatMessagesCacheKey) return true;
    return !sessionStorage.getItem(chatMessagesCacheKey);
  });
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxFooterHeightPxRef = useRef(88);

  /**
   * With Capacitor `KeyboardResize.None`, the WebView layout viewport does not shrink.
   * - iOS native: visualViewport often stays full-height — use Capacitor Keyboard heights.
   * - Android native: Capacitor keyboardHeight over-reports — use visualViewport shrink for
   *   footer `bottom` lift only; never lift on native height alone.
   * - Mobile browser / PWA: visualViewport delta usually works.
   */
  const liftComposerForKeyboard = isMobile || Capacitor.isNativePlatform();
  const [keyboardInsetVisualPx, setKeyboardInsetVisualPx] = useState(0);
  const [keyboardInsetNativePx, setKeyboardInsetNativePx] = useState(0);
  const [footerBlockHeightPx, setFooterBlockHeightPx] = useState(88);
  const [chatCount, setChatCount] = useState(0);

  const chatLimit = getTierLimits({ tier, status }).chatDaily;
  const currentCharacter = selectedCharacter ? characters[selectedCharacter] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: liftComposerForKeyboard ? "instant" : "smooth",
    });
  };

  // Load selected character - always query database (no localStorage after signup)
  useEffect(() => {
    const loadCharacter = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setIsLoadingCharacter(false);
        return;
      }

      setIsLoadingCharacter(true);
      try {
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading chat character:", error);
          return;
        }

        if (preferences?.selected_character && characters[preferences.selected_character]) {
          setSelectedCharacter(preferences.selected_character);
        }
      } finally {
        setIsLoadingCharacter(false);
      }
    };

    void loadCharacter();
  }, [user?.id, authLoading]);

  // Load chat messages - show ALL messages regardless of character
  useEffect(() => {
    const loadMessages = async () => {
      if (authLoading || !user?.id) return;

      // If we already rendered cached history, do this fetch quietly (no spinner flash).
      const hasCachedRender =
        typeof window !== "undefined" && !!sessionStorage.getItem(`chatMessages_${user.id}`);
      if (!hasCachedRender) setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('character_messages')
          .select('id, message_text, message_type, created_at, character_type, metadata')
          .eq('user_id', user.id)
          .eq('message_type', 'chat')
          // Fetch newest first to avoid dropping recent messages when history exceeds the limit
          .order('created_at', { ascending: false })
          .limit(200); // show up to 200 most recent messages

        if (error) throw error;

        const transformedMessages: Message[] = (data || []).map((msg) => ({
          id: msg.id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          created_at: msg.created_at,
          is_user: msg.metadata?.is_user || false,
          character_type: msg.character_type || undefined,
        }));

        // Reverse to display oldest -> newest after querying newest first
        setMessages(transformedMessages.reverse());
      } catch (error: any) {
        console.error('Error loading messages:', error);
        // Only nag the user if there's nothing cached on screen — otherwise the stale
        // history is still readable and we'll retry on next entry.
        if (!hasCachedRender) {
          toast.error(t("chat.errors.loadHistory"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadMessages();
  }, [user?.id, authLoading]);

  // Persist the live messages list to sessionStorage so re-entry is instant. One effect
  // covers initial load, post-send refresh, optimistic appends, and rollback removals.
  useEffect(() => {
    if (typeof window === "undefined" || !chatMessagesCacheKey) return;
    if (isLoading) return;
    try {
      sessionStorage.setItem(chatMessagesCacheKey, JSON.stringify(messages));
    } catch {
      /* sessionStorage may be unavailable in some PWA contexts */
    }
  }, [messages, isLoading, chatMessagesCacheKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!liftComposerForKeyboard || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      setKeyboardInsetVisualPx(
        Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)),
      );
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [liftComposerForKeyboard]);

  const keyboardListenerHandlesRef = useRef<PluginListenerHandle[]>([]);

  /**
   * Native Capacitor keyboard height when resize mode is None.
   * Android: only keyboardDidShow/DidHide — willShow often reports an oversized
   * height that lifts the fixed composer mid-screen before DidShow corrects it.
   */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    keyboardListenerHandlesRef.current = [];
    const androidNative = Capacitor.getPlatform() === "android";
    void import("@capacitor/keyboard").then(async ({ Keyboard }) => {
      if (cancelled) return;
      try {
        const hs: PluginListenerHandle[] = [];
        if (androidNative) {
          hs.push(
            await Keyboard.addListener("keyboardDidShow", (info) => {
              setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
            }),
          );
          hs.push(
            await Keyboard.addListener("keyboardDidHide", () => {
              setKeyboardInsetNativePx(0);
              setKeyboardInsetVisualPx(0);
            }),
          );
        } else {
          hs.push(
            await Keyboard.addListener("keyboardWillShow", (info) => {
              setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
            }),
          );
          hs.push(
            await Keyboard.addListener("keyboardDidShow", (info) => {
              setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
            }),
          );
          hs.push(
            await Keyboard.addListener("keyboardWillHide", () => {
              setKeyboardInsetNativePx(0);
              setKeyboardInsetVisualPx(0);
            }),
          );
          hs.push(
            await Keyboard.addListener("keyboardDidHide", () => {
              setKeyboardInsetNativePx(0);
              setKeyboardInsetVisualPx(0);
            }),
          );
        }
        if (cancelled) {
          await Promise.all(hs.map((h) => h.remove()));
          return;
        }
        keyboardListenerHandlesRef.current = hs;
      } catch {
        /* plugin unavailable in some environments */
      }
    });
    return () => {
      cancelled = true;
      void Promise.all(keyboardListenerHandlesRef.current.map((h) => h.remove()));
      keyboardListenerHandlesRef.current = [];
    };
  }, []);

  /**
   * Footer `bottom` lift — separate from message-list padding on purpose.
   * Android: NEVER use Capacitor keyboardHeight for footer position (over-reports).
   * Use visualViewport shrink when present; otherwise bottom stays 0.
   */
  const viewportHeightPx =
    typeof window !== "undefined" ? window.innerHeight : 0;

  const composerBottomPx = (() => {
    if (!liftComposerForKeyboard) return 0;

    if (isAndroidNative) {
      if (ANDROID_CHAT_DIAGNOSTIC_FOOTER_BOTTOM_ZERO) return 0;
      return keyboardInsetVisualPx > 0 ? keyboardInsetVisualPx : 0;
    }

    const raw = Math.max(keyboardInsetVisualPx, keyboardInsetNativePx);
    const ceil =
      viewportHeightPx > 0 ? Math.floor(viewportHeightPx * 0.6) : raw;
    return Math.min(raw, ceil);
  })();

  useEffect(() => {
    if (!isAndroidNative) return;
    console.log("[Chat keyboard]", {
      diagnosticBottomZero: ANDROID_CHAT_DIAGNOSTIC_FOOTER_BOTTOM_ZERO,
      keyboardInsetNativePx,
      keyboardInsetVisualPx,
      composerBottomPx,
      viewportHeightPx,
      footerBlockHeightPx,
    });
  }, [
    isAndroidNative,
    keyboardInsetNativePx,
    keyboardInsetVisualPx,
    composerBottomPx,
    viewportHeightPx,
    footerBlockHeightPx,
  ]);

  // When the keyboard opens (or closes), re-anchor scroll (must run after composerBottomPx).
  useEffect(() => {
    if (!liftComposerForKeyboard) return;
    requestAnimationFrame(() => scrollToBottom());
  }, [composerBottomPx, liftComposerForKeyboard]);

  useEffect(() => {
    const el = footerRef.current;
    if (!el || !liftComposerForKeyboard) return;
    const ro = new ResizeObserver(() => {
      setFooterBlockHeightPx(el.offsetHeight);
    });
    ro.observe(el);
    setFooterBlockHeightPx(el.offsetHeight);
    return () => ro.disconnect();
  }, [liftComposerForKeyboard, chatCount, chatLimit]);

  useEffect(() => {
    const loadChatCount = async () => {
      if (!user) return;

      const today = getTodayLocal();

      const { data } = await supabase
        .from('user_message_limits')
        .select('chat_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        setChatCount(data.chat_count || 0);
      }
    };

    loadChatCount();
  }, [user, messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || !selectedCharacter || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message_text: userMessage,
      message_type: 'chat',
      created_at: new Date().toISOString(),
      is_user: true,
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data: responseData, error: responseError } = await supabase.functions.invoke('handle-chat-message', {
        body: {
          userId: user.id,
          userMessage: userMessage,
          userTzOffsetMinutes: new Date().getTimezoneOffset(),
          userLocalDate: getTodayLocal(),
          locale: apiLocale,
        },
      });

      if (responseError) throw responseError;

      if (responseData?.error) {
        const localizedError = localizeEdgeErrorMessage(
          typeof responseData.error === "string" ? responseData.error : String(responseData.error),
          tCommon,
        );
        // For Basic and Plus users, show as a system message in chat instead of just toast
        if (responseData.limitReached) {
          const systemMessage: Message = {
            id: `system-limit-${Date.now()}`,
            message_text: t("chat.dailyLimitReached"),
            message_type: 'chat',
            created_at: new Date().toISOString(),
            is_user: false,
            character_type: 'system', // Mark as system message
          };
          setMessages((prev) => [...prev, systemMessage]);
        } else {
          // For Premium or other errors, show toast
          toast.error(localizedError);
        }
        // Remove the temp user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
        return;
      }

      if (responseData?.boundary) {
        // Boundary message for dangerous content
        const boundaryMessage: Message = {
          id: `boundary-${Date.now()}`,
          message_text: responseData.message,
          message_type: 'chat',
          created_at: new Date().toISOString(),
          is_user: false,
          character_type: selectedCharacter || undefined,
        };
        setMessages((prev) => [...prev, boundaryMessage]);
        return;
      }

      // Add character response to UI
      if (responseData?.message) {
        const characterMessage: Message = {
          id: `char-${Date.now()}`,
          message_text: responseData.message,
          message_type: 'chat',
          created_at: new Date().toISOString(),
          is_user: false,
          character_type: selectedCharacter || undefined,
        };
        setMessages((prev) => [...prev, characterMessage]);
      }

      // Reload messages to get the saved versions from database - load ALL messages
      const { data: reloadedData } = await supabase
        .from('character_messages')
        .select('id, message_text, message_type, created_at, character_type, metadata')
        .eq('user_id', user.id)
        .eq('message_type', 'chat')
        .order('created_at', { ascending: false })
        .limit(200);

      if (reloadedData) {
        const transformedMessages: Message[] = reloadedData.map((msg) => ({
          id: msg.id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          created_at: msg.created_at,
          is_user: msg.metadata?.is_user || false,
          character_type: msg.character_type || undefined,
        }));
        setMessages(transformedMessages.reverse());
      }

      // Update chat count from response if provided by the function
      if (typeof responseData?.chatCount === 'number') {
        setChatCount(responseData.chatCount);
      }
    } catch (error: any) {
      logErrorWithRequestId(error, "Error sending message");
      
      // Sanitize error message for user display
      let errorMessage = t("chat.errors.sendFailed");
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        // Check for specific error types
        if (msg.includes('401') || msg.includes('unauthorized')) {
          errorMessage = formatErrorMessage(error, t("chat.errors.sessionExpired"));
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage = formatErrorMessage(error, t("chat.errors.forbidden"));
        } else if (msg.includes('429') || msg.includes('rate limit')) {
          errorMessage = formatErrorMessage(error, t("chat.errors.rateLimit"));
        } else if (isConnectionError(error)) {
          errorMessage = formatErrorMessage(error, t("chat.errors.connection"));
        } else if (msg.includes('timeout')) {
          errorMessage = formatErrorMessage(error, t("chat.errors.timeout"));
        } else {
          errorMessage = formatErrorMessage(error, errorMessage);
        }
      } else {
        errorMessage = formatErrorMessage(error, errorMessage);
      }
      
      toast.error(errorMessage);
      // Remove the temp user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while character is being loaded
  if (isLoadingCharacter) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show error if we've checked and confirmed no character
  if (!selectedCharacter) {
    return (
      <div
        className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), "min-h-screen flex items-center justify-center")}
        style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
      >
        <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-6 max-w-md") : "p-6 max-w-md"}>
          <p className="text-center text-muted-foreground">
            {t("chat.selectCharacterFirst")}
          </p>
          <Button onClick={() => navigate('/dashboard/double')} className="w-full mt-4">
            {t("chat.goToEmbody")}
          </Button>
        </Card>
      </div>
    );
  }

  const sidebarLeftPx = !isMobile ? (sidebarCollapsed ? 64 : 256) : 0;
  const isCosmic = theme === "dark";

  return (
    <div
      className={cn(
        cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
        "flex flex-col min-h-0",
        liftComposerForKeyboard ? "h-[100dvh] max-h-[100dvh]" : "h-screen",
      )}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
      
      {/* Main Content - Offset for sidebar on desktop */}
      <div
        className={cn(
          "flex flex-col min-h-0",
          liftComposerForKeyboard ? "h-[100dvh] max-h-[100dvh]" : "h-screen",
        )}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
                ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" },
              }
            : { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
        }
      >
        {/* Safe area background - fixed at top */}
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
          className={cn(
            cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"),
            isNativeApp || !isMobile
              ? "fixed top-0 left-0 right-0 z-50 flex-shrink-0"
              : "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]",
          )}
          style={
            isNativeApp
              ? {
                  ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }),
                  top: "var(--app-safe-area-top)",
                }
              : isMobile
                ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" })
                : {
                    ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }),
                    top: "var(--app-safe-area-top)",
                    left: sidebarCollapsed ? "64px" : "256px",
                    right: "0",
                    transition: "left 300ms ease-in-out",
                  }
          }
        >
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className={cn(!isCosmic && "text-foreground hover:bg-muted/60")}
                onClick={() => navigate('/dashboard/your-journey')}
              >
                <ArrowLeft className={cn("h-5 w-5", theme === "dark" ? "text-white" : "text-foreground")} />
              </Button>
              {currentCharacter && (
                <>
                  <div className="rounded-full bg-white p-0.5 shadow-sm shrink-0">
                    <img
                      src={currentCharacter.headshot}
                      alt={currentCharacter.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className={cn("font-semibold text-lg", theme === "dark" ? "text-white" : "text-foreground")}>
                      {currentCharacter.name}
                    </h1>
                    <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("chat.messagesToday", { count: chatCount, limit: chatLimit })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 space-y-4 min-h-0",
          liftComposerForKeyboard ? "pb-2" : "pb-4",
        )}
        style={{
          ...(isNativeApp || isStandalone
            ? { paddingTop: "calc(var(--app-safe-area-top) + 5rem)" }
            : isMobile
              ? { paddingTop: "1rem" }
              : { paddingTop: "5rem" }),
          // Reserve room for composer height + footer bottom lift (composerBottomPx).
          ...(liftComposerForKeyboard
            ? {
                paddingBottom: `${footerBlockHeightPx + composerBottomPx + 12}px`,
              }
            : {}),
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className={cn("h-6 w-6 animate-spin", theme === "dark" ? "text-white/55" : "text-muted-foreground")} />
          </div>
        ) : messages.length === 0 ? (
          <div className={cn("flex items-center justify-center h-full", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            <p>{t("chat.startConversation", { name: currentCharacter?.name })}</p>
          </div>
        ) : (
          messages.map((message) => {
            const messageCharacter = message.character_type ? characters[message.character_type] : null;
            const displayCharacter = messageCharacter || currentCharacter;
            const isSystemMessage = message.character_type === 'system';
            
            return (
            <div
              key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} items-start gap-2`}
            >
                {!message.is_user && !isSystemMessage && displayCharacter && (
                  <img
                    src={displayCharacter.headshot}
                    alt={displayCharacter.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.is_user
                    ? 'bg-primary text-primary-foreground'
                    : isSystemMessage
                    ? 'bg-muted/50 border border-primary/20 text-foreground' // System message styling
                    : 'bg-muted'
                }`}
                style={
                    !message.is_user && !isSystemMessage && displayCharacter
                      ? { backgroundColor: `${displayCharacter.bubbleColor}20` }
                    : {}
                }
              >
                  {!message.is_user && !isSystemMessage && displayCharacter && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {displayCharacter.name}
                    </p>
                  )}
                  {isSystemMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {t("chat.system")}
                    </p>
                  )}
                <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleString([], { 
                    timeZone: userTimeZone,
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input — fixed; Android footer bottom = visualViewport inset only. */}
      <div
        ref={footerRef}
        className={cn(
          theme === "dark" ? "border-t border-white/10 p-4 z-[48]" : cn("border-t border-border bg-background p-4 z-[48]"),
          liftComposerForKeyboard
            ? cn(
                "fixed right-0",
                isCosmic
                  ? "shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
                  : "shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
              )
            : "flex-shrink-0",
        )}
        style={
          liftComposerForKeyboard
            ? {
                ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" },
                bottom: composerBottomPx,
                left: sidebarLeftPx,
                paddingBottom:
                  composerBottomPx > 0
                    ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
                    : "max(1rem, env(safe-area-inset-bottom, 0px))",
              }
            : { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
        }
      >
        <p className={cn("text-[11px] leading-snug mb-2 text-left", theme === "dark" ? "text-white/45" : "text-muted-foreground")}>
          {t("chat.disclaimer")}
        </p>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("chat.placeholder")}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              requestAnimationFrame(() => scrollToBottom());
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setKeyboardInsetNativePx(0);
                setKeyboardInsetVisualPx(0);
              }, 120);
            }}
            className={cn("flex-1", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
            disabled={isSending || !user || !selectedCharacter}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isSending || !inputMessage.trim() || !user || !selectedCharacter}
            size="icon"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {chatCount >= chatLimit && (
          <p className={cn("text-xs mt-2 text-center", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            {t("chat.dailyLimitReached")}
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Chat;

