# Chat (Talk to Guide) — handoff

**Project:** Palette Plotting / belief-craft-nexus  
**Branch:** `Mobile-app`  
**Android build:** `versionCode 231` (`android/app/build.gradle`)  
**Route:** `/dashboard/your-journey/chat` → `src/pages/features/Chat.tsx`  
**Stack:** React + Vite + Capacitor 8 + `@capacitor/keyboard` + Supabase  

---

## What this screen does

- Talk to Guide chat UI (character from `user_preferences.selected_character`).
- Loads up to 200 messages from `character_messages` (Supabase).
- Sends via edge function `handle-chat-message`.
- **sessionStorage cache** (`chatMessages_${userId}`): re-entering chat in same session shows history instantly (stale-while-revalidate).

---

## Android keyboard / composer architecture

The WebView uses **`KeyboardResize.None`** — the viewport does **not** shrink when the IME opens. The keyboard **overlays** content. The chat composer is **`position: fixed`** and lifted by `bottom: keyboardBottomInsetPx`.

### Keyboard height sources

| Platform | Source |
|----------|--------|
| iOS native | `@capacitor/keyboard` listeners (`keyboardWillShow` / `keyboardDidShow`) |
| Android native | Same Capacitor Keyboard listeners (visualViewport sync is **skipped** on Android — see `isAndroidNative` guard) |
| Mobile web / PWA | `window.visualViewport` resize delta |

### Message list padding (Android fix, build 230)

Messages container `paddingBottom` must reserve **both**:

1. `footerBlockHeightPx` — measured composer height (ResizeObserver on footer)
2. `keyboardBottomInsetPx` — IME height from Capacitor Keyboard plugin

Without (2), the last bubble scrolls into the gap between composer-top and keyboard-top (reply appears **under** the input).

### Scroll re-anchor (build 230–231)

When `keyboardBottomInsetPx` changes, `requestAnimationFrame(() => scrollToBottom())` keeps the latest message above the composer.

**Build 231 crash fix:** that `useEffect` must run **after** `keyboardBottomInsetPx` is declared. Placing it earlier caused `ReferenceError: Cannot access 'I' before initialization` (TDZ) and white-screen on Chat open.

### Inset clamp

`keyboardBottomInsetPx` is capped at **60% of viewport height** to prevent oversized IME reports from pushing the composer under the header on edge-to-edge Android.

### Global Android helper (`main.tsx`)

Separate from Chat: on `keyboardDidShow`, if focused input would be covered, `scrollIntoView({ block: "center" })` — used for onboarding forms; Chat handles its own layout.

### Native Android window mode

`MainActivity.java`: `SOFT_INPUT_ADJUST_NOTHING` — matches iOS `KeyboardResize.None` (IME overlays WebView, no resize/pan).

### Viewport meta (`index.html`)

`interactive-widget=overlays-content` — Chrome/Android WebView overlays keyboard instead of shrinking layout.

---

## Recent commits (Chat-related)

| Commit | Description |
|--------|-------------|
| `40384900` | Android: fix Chat composer overlap; bump 230 — paddingBottom includes keyboard inset |
| `7389f300` | Fix Chat TDZ crash on open; bump 231 — move keyboard scroll effect below `keyboardBottomInsetPx` |

---

## Files in this handoff

1. `src/pages/features/Chat.tsx` — full component
2. `src/main.tsx` — native keyboard bootstrap (excerpt)
3. `src/lib/toolPageThemeStyles.ts` — composer footer styles (excerpt)
4. `android/app/src/main/java/com/paletteplotting/app/MainActivity.java` — SOFT_INPUT (excerpt)
5. `index.html` — viewport meta (excerpt)
6. `src/App.tsx` — route (excerpt)

---

================================================================================
src/App.tsx (route excerpt)
================================================================================

```tsx
<Route path="your-journey/chat" element={<Chat />} />
<Route path="your-journey" element={<YourJourney />} />
<Route path="chat" element={<Navigate to="/dashboard/your-journey/chat" replace />} />
```

---

================================================================================
index.html (viewport excerpt)
================================================================================

```html
<!--
  `interactive-widget=overlays-content` tells Chrome / Android WebView to overlay the on-screen
  keyboard on top of existing layout instead of shrinking the visual viewport.
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content" />
```

---

================================================================================
android/app/src/main/java/com/paletteplotting/app/MainActivity.java (keyboard excerpt)
================================================================================

```java
@Override
public void onCreate(Bundle savedInstanceState) {
    registerPlugin(NativeMirrorPlugin.class);
    super.onCreate(savedInstanceState);
    // Match iOS KeyboardResize.None: IME draws over the WebView (no resize/pan).
    getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
    applyWebViewMediaSettings();
}
```

---

================================================================================
src/main.tsx (native keyboard bootstrap)
================================================================================

```tsx
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

if (Capacitor.isNativePlatform()) {
  // ... appearance / background setup ...

  void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {
    /* plugin may be unavailable in some web previews */
  });

  /**
   * Android keyboard parity with iOS:
   * With KeyboardResize.None + interactive-widget=overlays-content, pages must handle
   * keyboard occlusion. This global listener scrolls focused inputs into view (onboarding etc.).
   * Chat.tsx handles its own fixed composer + message padding separately.
   */
  if (Capacitor.getPlatform() === "android") {
    const KEYBOARD_TOP_GAP_PX = 24;

    const isEditableElement = (el: Element | null): el is HTMLElement => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    void Keyboard.addListener("keyboardDidShow", (info) => {
      const el = document.activeElement;
      if (!isEditableElement(el)) return;
      const keyboardHeightPx = Math.max(0, Math.round(info?.keyboardHeight ?? 0));
      if (keyboardHeightPx <= 0) return;

      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewportHeightPx = window.innerHeight;
        const keyboardTopPx = viewportHeightPx - keyboardHeightPx;
        const desiredBottomPx = keyboardTopPx - KEYBOARD_TOP_GAP_PX;

        if (rect.bottom <= desiredBottomPx) return;

        el.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    });
  }
}
```

---

================================================================================
src/lib/toolPageThemeStyles.ts (composer footer excerpt)
================================================================================

```tsx
/** Bottom composer / message input bar on tool pages (e.g. Talk to Guide). */
export function toolPageComposerFooterClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "border-t border-white/10 p-4 z-[48]";
  }
  return cn("border-t border-border bg-background p-4 z-[48]");
}

export function toolPageComposerFooterStyle(theme: Appearance): CSSProperties | undefined {
  if (toolPageUsesCosmicShell(theme)) return { backgroundColor: TOOL_PAGE_DARK_BG };
  return { backgroundColor: TOOL_PAGE_LIGHT_BG };
}
```

---

================================================================================
src/pages/features/Chat.tsx (FULL FILE)
================================================================================

```tsx
import React, { useState, useEffect, useRef } from "react";
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
import { extractRequestId, logErrorWithRequestId, isConnectionError, formatErrorMessage } from "@/lib/error-utils";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import { useTheme } from "@/contexts/ThemeContext";
import {
  toolPageComposerFooterClass,
  toolPageComposerFooterStyle,
  toolPageBodyTextClass,
  toolPageHeaderClass,
  toolPageHeaderLayoutClass,
  toolPageHeaderStyle,
  toolPageInputClass,
  toolPageMutedTextClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
  toolPageShadcnCardClass,
  toolPageUsesCosmicShell,
} from "@/lib/toolPageThemeStyles";

interface Message {
  id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_user: boolean;
  character_type?: string;
}

const characters: Record<string, { name: string; headshot: string; bubbleColor: string }> = {
  river: { name: "River", headshot: "/headshots/river-headshot-2.png", bubbleColor: "#4AC7FF" },
  sage: { name: "Sage", headshot: "/headshots/sage-headshot.png", bubbleColor: "#8fbf76" },
  rose: { name: "Rose", headshot: "/headshots/rose-headshot.png", bubbleColor: "#FFB6C1" },
  oliver: { name: "Oliver", headshot: "/headshots/oliver-headshot.png", bubbleColor: "#FFC107" },
};

const Chat: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { tier, status } = useUserTier();
  const navigate = useNavigate();
  const userTimeZone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const getTodayLocal = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  };

  const isStandalone =
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();

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
   * With Capacitor `KeyboardResize.None`, the WebView does not shrink.
   * - Native iOS: `visualViewport` often stays full-height — use Keyboard plugin heights.
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

  useEffect(() => {
    const loadCharacter = async () => {
      if (!user) {
        setIsLoadingCharacter(false);
        return;
      }

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('selected_character')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences?.selected_character && characters[preferences.selected_character]) {
        setSelectedCharacter(preferences.selected_character);
      }

      setIsLoadingCharacter(false);
    };

    loadCharacter();
  }, [user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      const hasCachedRender =
        typeof window !== "undefined" && !!sessionStorage.getItem(`chatMessages_${user.id}`);
      if (!hasCachedRender) setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('character_messages')
          .select('id, message_text, message_type, created_at, character_type, metadata')
          .eq('user_id', user.id)
          .eq('message_type', 'chat')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;

        const transformedMessages: Message[] = (data || []).map((msg) => ({
          id: msg.id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          created_at: msg.created_at,
          is_user: msg.metadata?.is_user || false,
          character_type: msg.character_type || undefined,
        }));

        setMessages(transformedMessages.reverse());
      } catch (error: any) {
        console.error('Error loading messages:', error);
        if (!hasCachedRender) {
          toast.error("Failed to load chat history");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user]);

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
    if (isAndroidNative) return;
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
  }, [liftComposerForKeyboard, isAndroidNative]);

  const keyboardListenerHandlesRef = useRef<PluginListenerHandle[]>([]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    keyboardListenerHandlesRef.current = [];
    void import("@capacitor/keyboard").then(async ({ Keyboard }) => {
      if (cancelled) return;
      try {
        const hShow = await Keyboard.addListener("keyboardWillShow", (info) => {
          setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
        });
        const hShowDid = await Keyboard.addListener("keyboardDidShow", (info) => {
          setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
        });
        const hWillHide = await Keyboard.addListener("keyboardWillHide", () => {
          setKeyboardInsetNativePx(0);
          setKeyboardInsetVisualPx(0);
        });
        const hHide = await Keyboard.addListener("keyboardDidHide", () => {
          setKeyboardInsetNativePx(0);
          setKeyboardInsetVisualPx(0);
        });
        const hs = [hShow, hShowDid, hWillHide, hHide];
        if (cancelled) {
          await Promise.all(hs.map((h) => h.remove()));
          return;
        }
        keyboardListenerHandlesRef.current = hs;
      } catch {
        /* plugin unavailable */
      }
    });
    return () => {
      cancelled = true;
      void Promise.all(keyboardListenerHandlesRef.current.map((h) => h.remove()));
      keyboardListenerHandlesRef.current = [];
    };
  }, []);

  const rawKeyboardInsetPx = Math.max(keyboardInsetVisualPx, keyboardInsetNativePx);
  const viewportHeightPx =
    typeof window !== "undefined" ? window.innerHeight : 0;
  const safeKeyboardInsetCeilPx =
    viewportHeightPx > 0 ? Math.floor(viewportHeightPx * 0.6) : rawKeyboardInsetPx;
  const keyboardBottomInsetPx = liftComposerForKeyboard
    ? Math.min(rawKeyboardInsetPx, safeKeyboardInsetCeilPx)
    : 0;

  // MUST be after keyboardBottomInsetPx — TDZ crash if moved above (build 231 fix).
  useEffect(() => {
    if (!liftComposerForKeyboard) return;
    requestAnimationFrame(() => scrollToBottom());
  }, [keyboardBottomInsetPx, liftComposerForKeyboard]);

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
        },
      });

      if (responseError) throw responseError;

      if (responseData?.error) {
        if (responseData.limitReached) {
          const systemMessage: Message = {
            id: `system-limit-${Date.now()}`,
            message_text: responseData.error,
            message_type: 'chat',
            created_at: new Date().toISOString(),
            is_user: false,
            character_type: 'system',
          };
          setMessages((prev) => [...prev, systemMessage]);
        } else {
          toast.error(responseData.error);
        }
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
        return;
      }

      if (responseData?.boundary) {
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

      if (typeof responseData?.chatCount === 'number') {
        setChatCount(responseData.chatCount);
      }
    } catch (error: any) {
      logErrorWithRequestId(error, "Error sending message");
      let errorMessage = "Failed to send message. Please try again.";
      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('401') || msg.includes('unauthorized')) {
          errorMessage = formatErrorMessage(error, "Your session has expired. Please refresh the page and try again.");
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage = formatErrorMessage(error, "You don't have permission to send messages. Please check your account status.");
        } else if (msg.includes('429') || msg.includes('rate limit')) {
          errorMessage = formatErrorMessage(error, "Too many requests. Please wait a moment and try again.");
        } else if (isConnectionError(error)) {
          errorMessage = formatErrorMessage(error, "Connection error. Please check your internet and try again.");
        } else if (msg.includes('timeout')) {
          errorMessage = formatErrorMessage(error, "Request timed out. Please try again.");
        } else {
          errorMessage = formatErrorMessage(error, errorMessage);
        }
      } else {
        errorMessage = formatErrorMessage(error, errorMessage);
      }
      toast.error(errorMessage);
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

  if (isLoadingCharacter) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div
        className={cn(toolPageShellRootClass(theme), "min-h-screen flex items-center justify-center")}
        style={toolPageShellRootStyle(theme)}
      >
        <Card className={toolPageShadcnCardClass(theme, "p-6 max-w-md")}>
          <p className="text-center text-muted-foreground">
            Please select a character first to start chatting.
          </p>
          <Button onClick={() => navigate('/dashboard/double')} className="w-full mt-4">
            Go to Embody
          </Button>
        </Card>
      </div>
    );
  }

  const sidebarLeftPx = !isMobile ? (sidebarCollapsed ? 64 : 256) : 0;
  const isCosmic = toolPageUsesCosmicShell(theme);

  return (
    <div
      className={cn(
        toolPageShellRootClass(theme),
        "flex flex-col min-h-0",
        liftComposerForKeyboard ? "h-[100dvh] max-h-[100dvh]" : "h-screen",
      )}
      style={toolPageShellRootStyle(theme)}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

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
                ...toolPageShellRootStyle(theme),
              }
            : toolPageShellRootStyle(theme)
        }
      >
        <ToolPageSafeAreaInlet />
        <header
          className={cn(
            toolPageHeaderClass(theme),
            isNativeApp || !isMobile
              ? "fixed top-0 left-0 right-0 z-50 flex-shrink-0"
              : toolPageHeaderLayoutClass(true),
          )}
          style={
            isNativeApp
              ? {
                  ...toolPageHeaderStyle(theme, true),
                  top: "var(--app-safe-area-top)",
                }
              : toolPageHeaderStyle(theme, isMobile, { sidebarCollapsed })
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
                <ArrowLeft className={cn("h-5 w-5", toolPageBodyTextClass(theme))} />
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
                    <h1 className={cn("font-semibold text-lg", toolPageBodyTextClass(theme))}>
                      {currentCharacter.name}
                    </h1>
                    <p className={cn("text-xs", toolPageMutedTextClass(theme))}>
                      {chatCount} / {chatLimit} messages today
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
          ...(liftComposerForKeyboard
            ? {
                paddingBottom: `${footerBlockHeightPx + keyboardBottomInsetPx + 12}px`,
              }
            : {}),
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className={cn("h-6 w-6 animate-spin", toolPageMutedTextClass(theme))} />
          </div>
        ) : messages.length === 0 ? (
          <div className={cn("flex items-center justify-center h-full", toolPageMutedTextClass(theme))}>
            <p>Start a conversation with {currentCharacter?.name}</p>
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
                    ? 'bg-muted/50 border border-primary/20 text-foreground'
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
                      System
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

      {/* Message Input — fixed + keyboard inset (KeyboardResize.None). */}
      <div
        ref={footerRef}
        className={cn(
          toolPageComposerFooterClass(theme),
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
                ...toolPageComposerFooterStyle(theme),
                bottom: keyboardBottomInsetPx,
                left: sidebarLeftPx,
                paddingBottom:
                  keyboardBottomInsetPx > 0
                    ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
                    : "max(1rem, env(safe-area-inset-bottom, 0px))",
              }
            : toolPageComposerFooterStyle(theme)
        }
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
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
            className={cn("flex-1", toolPageInputClass(theme))}
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
          <p className={cn("text-xs mt-2 text-center", toolPageMutedTextClass(theme))}>
            Daily limit reached. Your limit resets tomorrow.
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Chat;
```

---

## Kickoff prompt

Copy this with the file above:

> This is the Palette Plotting Talk to Guide chat screen (`Chat.tsx`) running in Capacitor 8 on Android with `KeyboardResize.None` and `SOFT_INPUT_ADJUST_NOTHING`. The composer is fixed at the bottom and lifted by keyboard inset. Messages list padding must include composer height + keyboard inset. Build 231 fixed a TDZ crash from referencing `keyboardBottomInsetPx` before declaration.  
>  
> **[Describe your issue here — e.g. message still under input bar, composer too high, keyboard gap, crash on open, etc.]**
