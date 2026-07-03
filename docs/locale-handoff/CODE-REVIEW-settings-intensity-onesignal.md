# Code review handoff — Settings, Manifestation Intensity, Guide, OneSignal

Generated: 2026-06-08

## Executive summary

### Guide.tsx — FIXED for theme bubbles
- Theme bubbles use `tTools(THEME_I18N_KEYS[theme])` from `tools:double.choose.themes.*`.
- Character names (River, Sage, Rose, Oliver) remain English hardcoded.
- Title/subtitle use `onboarding:setup.guide.*`.

### ManifestationIntensity.tsx (onboarding)
- UI strings use `onboarding:setup.manifestationIntensity.*` (translated).
- **BUG/GAP:** `manifest_routine_items` labels pushed to draft/DB are English: Affirmations, Subliminal listening, Mirror work, etc.
- OneSignal: calls `requestOneSignalPushPermission` + `syncManifestationRoutineOneSignalTags` on continue (native only).

### ManifestationRoutineSettings.tsx (Settings → manifestation routine)
- UI uses `settings:routine.*` and `settings:routine.intensity.*` (translated).
- **GAP:** `defaultRoutineItems` and stored `label` fields still English.
- OneSignal: syncs tags on save when notifications toggled; uses `preferredLocale` from `detectInitialAppLocale()` at component level (not i18n.resolvedLanguage).

### OneSignal wiring
1. **Login:** `AuthContext` calls `oneSignalLogin(user.id)` on native when user logs in.
2. **Language:** `syncOneSignalUserLanguage` → `OneSignal.User.setLanguage(oneSignalLanguageForApp(locale))`.
3. **Tags:** `syncManifestationRoutineOneSignalTags` sets: manifestation_intensity, notifications_enabled, notification_permission_status, preferred_locale, timezone, routine_alert_1/2/3, routine_notification_times.
4. **LanguageSwitcher:** updates localStorage, setup draft, RevenueCat UI locale, OneSignal language, and DB `preferred_locale` on profiles + user_preferences when `persistToAccount`.
5. **Onboarding intensity step:** syncs tags after draft write; does NOT pass `preferredLocale` explicitly (uses `detectInitialAppLocale()` inside sync function).
6. **Push copy language:** OneSignal dashboard must have es/pt message templates keyed off `preferred_locale` tag or `setLanguage`.

### Settings.tsx
- Fully wired to `settings` namespace via `useTranslation('settings')`.
- Links to `/dashboard/settings/manifestation-routine` for routine subpage.
- SMS verification message still hardcoded English.

---

## Settings.tsx (full)

Path: `src/pages/Settings.tsx`

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, Zap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import {
  openRevenueCatWebBillingPortal,
  resolveRevenueCatWebBillingStatus,
} from "@/services/revenueCatManageBilling";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { resolveAppLocale } from "@/lib/locale";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const appleIAP = useAppleIAP();

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
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** From user_plans; routes Manage Billing (RC web / App Store / Google Play). */
  const [lastPaymentSource, setLastPaymentSource] = useState<
    "stripe" | "apple" | "google_play" | null
  >(null);
  /** RC Web Billing subscriber — checked so Settings can show a loading hint while portal status resolves. */
  const [rcWebBillingAvailable, setRcWebBillingAvailable] = useState<boolean | null>(null);
  /** Billing identity from user_plans; not used to infer RC Web Billing by placeholder prefix. */
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | {
              billing_period?: string | null;
              last_payment_source?: string | null;
              stripe_customer_id?: string | null;
            }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        if (
          plan?.last_payment_source === "stripe" ||
          plan?.last_payment_source === "apple" ||
          plan?.last_payment_source === "google_play"
        ) {
          setLastPaymentSource(plan.last_payment_source);
        } else {
          setLastPaymentSource(null);
        }

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        const refreshRcWebBillingStatus = () => {
          void resolveRevenueCatWebBillingStatus(user.id)
            .then(({ webBilling }) => setRcWebBillingAvailable(webBilling))
            .catch(() => setRcWebBillingAvailable(false));
        };
        refreshRcWebBillingStatus();
        window.setTimeout(refreshRcWebBillingStatus, 1500);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

        // Pending account deletion (30-day schedule)
        const { data: deletionRequest } = await supabase
          .from("account_deletion_requests")
          .select("requested_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (deletionRequest?.requested_at) {
          const d = new Date(deletionRequest.requested_at);
          d.setDate(d.getDate() + 30);
          setDeletionScheduledAt(d.toISOString());
        } else {
          setDeletionScheduledAt(null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("toasts.enterPhone"));
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: t("profile.smsVerificationMessage", { code }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success(t("toasts.codeSent"));
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(t("toasts.codeSendFailed"));
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success(t("toasts.phoneVerified"));
    } else {
      toast.error(t("toasts.invalidCode"));
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error(t("toasts.usernameEmpty"));
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error(t("toasts.verifyPhoneFirst"));
      return;
    }
    
    if (!user) {
      toast.error(t("toasts.userNotFound"));
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error(t("toasts.usernameTaken"));
      } else {
        toast.error(t("toasts.profileUpdateError"));
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(username.trim());
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success(t("toasts.profileUpdated"));
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(translatePasswordError(passwordResult.error) || t("toasts.invalidPassword"));
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(translatePasswordError(matchResult.error) || t("passwordValidation.mismatch"));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t("toasts.passwordUpdateError"));
    } else {
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error(t("toasts.smsUpdateError"));
      } else {
        toast.success(enabled ? t("toasts.smsEnabled") : t("toasts.smsDisabled"));
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error(t("toasts.loginRequired"));
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error(t("toasts.dataTrainingError"));
    } else {
      toast.success(enabled ? t("toasts.dataTrainingEnabled") : t("toasts.dataTrainingDisabled"));
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : t("deletion.scheduledFallback");
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut({ scope: "global" });
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
        }
      } catch {}
      navigate("/", { replace: true });
      toast.success(t("toasts.deletionScheduled", { date: dateStr }));
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error(t("toasts.deletionFailed"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success(t("toasts.deletionCancelled"));
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error(t("toasts.deletionCancelFailed"));
    }
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "";
        toast.error(t("toasts.emailPrefError", { message: errorMessage }));
      } else {
        toast.success(enabled ? t("toasts.emailEnabled") : t("toasts.emailDisabled"));
      }
    }
  };

  /**
   * Manage billing routing:
   *
   * - Apple keeps the original native RevenueCat subscription-management path.
   * - Android tries RevenueCat's management URL, then falls back to the Play subscriptions handoff.
   * - Stripe/RC web opens RevenueCat's management URL.
   */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    if (lastPaymentSource === "apple") {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && appleIAP.canManageBillingNatively) {
        try {
          await appleIAP.openSubscriptionManagement(user.id);
        } catch (err) {
          console.error("Manage billing:", err);
        }
        return;
      }

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
        } catch (err) {
          console.error("Manage billing (Play):", err);
          toast.error(t("toasts.playSubscriptionsFailed"));
        }
        return;
      }

      toast.error(t("toasts.iosSubscriptionsHint"));
      return;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
      }

      try {
        await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
      } catch (err) {
        console.error("Manage billing (Play):", err);
        toast.error(t("toasts.playSubscriptionsFailed"));
      }
      return;
    }

    const isRcManagedBilling =
      lastPaymentSource === "stripe" ||
      rcWebBillingAvailable === true;

    if (isRcManagedBilling) {
      try {
        const portalToast = toast.loading(t("billing.openingPortal"));
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        toast.dismiss(portalToast);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
        toast.error(t("toasts.portalFailed"));
        return;
      }
    }

    toast.error(t("toasts.portalFailedFallback"));
  };


  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const billingOptionsLoading =
    !Capacitor.isNativePlatform() &&
    rcWebBillingAvailable === null &&
    lastPaymentSource !== "stripe" &&
    lastPaymentSource !== "apple";

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
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

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <div>
            <h1
              className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
              onClick={() => navigate("/dashboard")}
            >
              {t("header")}
            </h1>
            {isMobile && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            {/* PWA Browser Mobile Menu */}
            {isMobile && (
              <div className="md:hidden">
                {isMobile && (
              <div className="md:hidden">
                <MobilePWAMenu />
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "px-4 sm:px-6 max-w-4xl relative z-10",
          isMobile ? "pb-4" : "pb-20",
          !isMobile ? "pt-16" : "",
          !isMobile ? "" : "container mx-auto",
          isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
        )}
      >
        <div className="py-2 sm:py-3">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(theme === "dark" ? "grid w-full gap-1 p-1 rounded-lg border border-white/12 bg-transparent text-white mb-4" : "grid w-full mb-4", !isMobile ? "grid-cols-4" : "grid-cols-4")}>
            <TabsTrigger value="profile" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="space-y-2">
            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.usernamePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">{t("profile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40", "!opacity-100 cursor-default") : "bg-muted opacity-100 cursor-default")}
                />
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">{t("profile.phoneLabel")}</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder={t("profile.phonePlaceholder")}
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? t("profile.sendingCode") : t("profile.sendCode")}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("profile.codePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        {t("profile.verify")}
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        {t("profile.verifyPhoneHint")}
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.phoneVerified")}</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.newPhoneVerified")}</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  {t("profile.updateButton")}
              </Button>
              )}
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {t("profile.changePasswordHeading")}
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">{t("profile.currentPasswordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">{t("profile.validatingPassword")}</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(passwordError)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">{t("profile.confirmPasswordLabel")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                variant="ghost"
                className={cn("w-full h-9", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent key={`settings-${localeKey}`} value="settings" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold text-sm sm:text-base">{t("language.heading")}</h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("language.description")}
              </p>
              <LanguageSwitcher
                persistToAccount
                variant="default"
                className="justify-start"
              />
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4" />
                {t("preferences.routineHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.routineDescription")}
              </p>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/manifestation-routine")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.routineButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.routineButtonSubtitle")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.emailHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.emailDescription")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">{t("preferences.emailMarketingLabel")}</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">{t("preferences.textMarketingLabel")}</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.dataTrainingHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.dataTrainingDescription")}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">{t("preferences.dataTrainingLabel")}</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3", "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("deletion.heading")}
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.scheduledPrefix")}{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.{" "}
                    {t("deletion.scheduledSuffix")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    {t("deletion.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.description")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deletion.deleteButton")}
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm1Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm1Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>{t("common:continue")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm2Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm2Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? t("deletion.deleting") : t("deletion.deleteButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent key={`billing-${localeKey}`} value="billing" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                {t("billing.subscriptionHeading")}
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.currentPlan")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? t("billing.planMonthly")
                      : billingPeriodLabel === "annual"
                        ? t("billing.planAnnual")
                        : billingPeriodLabel === "weekly"
                          ? t("billing.planWeekly")
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.billingHeading")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingDescription")}
                  </p>
                </div>

                {billingOptionsLoading ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.loadingOptions")}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.portalHint")}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="space-y-3">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("legalDisclaimer")}
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  {t("legal.faq")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/terms")}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/privacy")}
                >
                  {t("legal.privacy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  {t("legal.acceptableUse")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("legal.billingRefunds")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  {t("legal.dmca")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/eula")}
                >
                  {t("legal.eula")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

```

---

## ManifestationRoutineSettings.tsx (settings subpage — manifestation routine)

Path: `src/pages/ManifestationRoutineSettings.tsx`

```tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, CheckCircle2, Circle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import { detectInitialAppLocale, type AppLocale } from "@/lib/locale";
import {
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncManifestationRoutineOneSignalTags,
} from "@/services/oneSignal";

type IntensityId = "light" | "consistent" | "locked_in";

const INTENSITY_IDS: IntensityId[] = ["light", "consistent", "locked_in"];

type RoutineItem = {
  slug: string;
  label: string;
  cadence: string;
  target_per_week: number;
};

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

type RoutineDbRow = {
  manifestation_intensity?: string | null;
  manifest_routine_items?: unknown;
  app_notifications_enabled?: boolean | null;
  notification_permission_status?: string | null;
  routine_notification_times?: unknown;
  timezone?: string | null;
};

function isIntensityId(value: unknown): value is IntensityId {
  return value === "light" || value === "consistent" || value === "locked_in";
}

function parseRoutineItems(raw: unknown): RoutineItem[] {
  return Array.isArray(raw) ? (raw as RoutineItem[]) : [];
}

function parseAlertTimes(raw: unknown, intensity: IntensityId): string[] {
  const defaults = ROUTINE_ALERT_DEFAULTS[intensity];
  if (!Array.isArray(raw)) return [...defaults];
  const parsed = raw.filter(
    (t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t),
  );
  return parsed.length === defaults.length ? parsed : [...defaults];
}

/** prefs ?? profile ?? default — per field, never let prefs null wipe profile. */
function mergeRoutineDbRow(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): {
  intensity: IntensityId;
  routineItems: RoutineItem[];
  appNotificationsEnabled: boolean;
  permissionStatus: "granted" | "denied" | "skipped" | null;
  alertTimes: string[];
  timeZone: string;
} {
  const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
  const intensity = isIntensityId(intensityRaw) ? intensityRaw : "consistent";

  const prefsItems = parseRoutineItems(prefs?.manifest_routine_items);
  const profileItems = parseRoutineItems(profile?.manifest_routine_items);
  const routineItems = prefsItems.length > 0 ? prefsItems : profileItems;

  const appNotificationsEnabled =
    prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;

  const permissionRaw =
    prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const permissionStatus =
    permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
      ? permissionRaw
      : null;

  const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
  const alertTimes = parseAlertTimes(timesRaw, intensity);

  const timeZoneRaw = prefs?.timezone ?? profile?.timezone;
  const timeZone =
    typeof timeZoneRaw === "string" && timeZoneRaw.trim() ? timeZoneRaw.trim() : readDeviceTimeZone();

  return {
    intensity,
    routineItems,
    appNotificationsEnabled: !!appNotificationsEnabled,
    permissionStatus,
    alertTimes,
    timeZone,
  };
}

/** Pre-feature user: no routine fields stored in either table yet. */
function isPreFeatureRoutineUser(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): boolean {
  const hasIntensity =
    isIntensityId(prefs?.manifestation_intensity) || isIntensityId(profile?.manifestation_intensity);
  if (hasIntensity) return false;

  const hasItems =
    parseRoutineItems(prefs?.manifest_routine_items).length > 0 ||
    parseRoutineItems(profile?.manifest_routine_items).length > 0;
  if (hasItems) return false;

  const perm = prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const notifOn =
    prefs?.app_notifications_enabled === true || profile?.app_notifications_enabled === true;
  if (notifOn && perm === "granted") return false;
  if (perm === "denied") return false;

  const hasTimes =
    (Array.isArray(prefs?.routine_notification_times) &&
      (prefs!.routine_notification_times as unknown[]).length > 0) ||
    (Array.isArray(profile?.routine_notification_times) &&
      (profile!.routine_notification_times as unknown[]).length > 0);
  if (hasTimes) return false;

  return true;
}

function defaultRoutineItems(intensity: IntensityId, labelForSlug: (slug: string) => string): RoutineItem[] {
  return [
    {
      slug: "affirmations",
      label: labelForSlug("affirmations"),
      cadence: "daily",
      target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
    },
  ];
}

function routineItemsForIntensity(
  intensity: IntensityId,
  existing: RoutineItem[],
  labelForSlug: (slug: string) => string,
): RoutineItem[] {
  if (existing.length === 0) return defaultRoutineItems(intensity, labelForSlug);

  return existing.map((item) => {
    if (item.slug === "affirmations") {
      return {
        ...item,
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
      };
    }
    if (item.slug === "subliminals") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 4 : 2,
      };
    }
    if (item.slug === "mirror_work") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 5 : intensity === "consistent" ? 3 : 1,
      };
    }
    return item;
  });
}

export default function ManifestationRoutineSettings() {
  const { t } = useTranslation("settings");
  const routineItemLabel = (slug: string) => t(`routine.itemLabels.${slug}`);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intensity, setIntensity] = useState<IntensityId>("consistent");
  const [savedIntensity, setSavedIntensity] = useState<IntensityId>("consistent");
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(false);
  const [alertTimes, setAlertTimes] = useState<string[]>(ROUTINE_ALERT_DEFAULTS.consistent);
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "skipped" | null>(
    null,
  );
  const preferredLocale: AppLocale = detectInitialAppLocale();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      setLoading(true);
      try {
        const [prefsRes, profileRes] = await Promise.all([
          (supabase as any)
            .from("user_preferences")
            .select(
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          (supabase as any)
            .from("profiles")
            .select(
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (prefsRes.error) throw prefsRes.error;
        if (profileRes.error) throw profileRes.error;

        const prefs = prefsRes.data as RoutineDbRow | null;
        const profile = profileRes.data as RoutineDbRow | null;
        const preFeature = isPreFeatureRoutineUser(prefs, profile);

        const merged = mergeRoutineDbRow(prefs, profile);
        const loadedIntensity = preFeature ? "light" : merged.intensity;
        const loadedItems =
          merged.routineItems.length > 0
            ? merged.routineItems
            : defaultRoutineItems(loadedIntensity, routineItemLabel);

        const hasOneSignalConsent =
          merged.appNotificationsEnabled && merged.permissionStatus === "granted";
        const legacyNotifWithoutConsent =
          !preFeature && merged.appNotificationsEnabled && merged.permissionStatus !== "granted";

        if (legacyNotifWithoutConsent) {
          void Promise.all([
            (supabase as any).from("user_preferences").upsert(
              { user_id: user.id, app_notifications_enabled: false },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              { id: user.id, app_notifications_enabled: false },
              { onConflict: "id" },
            ),
          ]).catch((err) => {
            console.error("[ManifestationRoutineSettings] legacy notif reset failed:", err);
          });
        }

        setIntensity(loadedIntensity);
        setSavedIntensity(loadedIntensity);
        setRoutineItems(loadedItems);
        setAlertTimes(preFeature ? [...ROUTINE_ALERT_DEFAULTS.light] : merged.alertTimes);
        setTimeZone(preFeature ? readDeviceTimeZone() : merged.timeZone);
        setAppNotificationsEnabled(preFeature ? false : hasOneSignalConsent);
        setPermissionStatus(
          preFeature
            ? "skipped"
            : legacyNotifWithoutConsent
              ? "skipped"
              : (merged.permissionStatus ?? null),
        );
      } catch (e) {
        console.error("[ManifestationRoutineSettings] load failed:", e);
        toast.error(t("toasts.routineLoadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const cardClass = cn(
    "w-full min-w-0 max-w-full overflow-hidden",
    theme === "dark"
      ? "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm p-4 sm:p-6 space-y-3"
      : "p-4 sm:p-6 space-y-3",
    theme === "dark" && "!bg-transparent",
  );

  const choiceTileClass = (active: boolean) =>
    cn(
      "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
      "bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md",
      active ? "border-white/30 ring-1 ring-white/20" : "border-white/12",
      theme !== "dark" && (active ? "border-primary/40 bg-primary/5" : "border-border bg-card"),
    );

  const persistTimeZone = async (tz: string) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, timezone: tz },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, timezone: tz },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[ManifestationRoutineSettings] persist timezone failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes,
        timezone: tz,
      }).catch(() => {});
    }
    return ok;
  };

  const persistAlertTimes = async (times: string[]) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[ManifestationRoutineSettings] persist alert times failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: times,
        timezone: timeZone,
      }).catch(() => {});
    }
    return ok;
  };

  const handleToggleAppNotifications = async (enabled: boolean) => {
    if (!user) return;
    const previous = appNotificationsEnabled;
    const effectiveItems = routineItemsForIntensity(intensity, routineItems, routineItemLabel);
    const effectiveTimes = parseAlertTimes(alertTimes, intensity);
    const routineBase = {
      manifestation_intensity: intensity,
      manifest_routine_items: effectiveItems,
      routine_notification_times: effectiveTimes,
    };

    setAppNotificationsEnabled(enabled);

    if (!enabled) {
      const [{ error: prefsError }, { error: profileError }] = await Promise.all([
        (supabase as any).from("user_preferences").upsert(
          { user_id: user.id, app_notifications_enabled: false },
          { onConflict: "user_id" },
        ),
        (supabase as any).from("profiles").upsert(
          { id: user.id, app_notifications_enabled: false },
          { onConflict: "id" },
        ),
      ]);

      if (prefsError || profileError) {
        setAppNotificationsEnabled(previous);
        console.error(
          "[ManifestationRoutineSettings] toggle off upsert failed:",
          prefsError ?? profileError,
        );
        toast.error(t("toasts.routineNotifUpdateFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        void syncManifestationRoutineOneSignalTags({
          intensity,
          preferredLocale,
          notificationsEnabled: false,
          permissionStatus,
          alertTimes: [],
        }).catch((err) => {
          console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
        });
      }

      toast.success(t("toasts.routineNotifOff"));
      return;
    }

    const detectedTz = readDeviceTimeZone();
    setTimeZone(detectedTz);

    if (Capacitor.isNativePlatform()) {
      try {
        const priorPermission = permissionStatus;
        const granted = await requestOneSignalPushPermission(true);
        if (!granted) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("denied");
          const [{ error: prefsError }, { error: profileError }] = await Promise.all([
            (supabase as any).from("user_preferences").upsert(
              {
                user_id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              {
                id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "id" },
            ),
          ]);
          if (prefsError || profileError) {
            console.error(
              "[ManifestationRoutineSettings] denied upsert failed:",
              prefsError ?? profileError,
            );
          }
          void syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: false,
            permissionStatus: "denied",
            alertTimes: [],
          }).catch((err) => {
            console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
          });
          toast.error(
            priorPermission === "denied"
              ? t("toasts.routineNotifDeniedIos")
              : t("toasts.routineNotifDenied"),
          );
          return;
        }

        setPermissionStatus("granted");
        const [{ error: prefsError }, { error: profileError }] = await Promise.all([
          (supabase as any).from("user_preferences").upsert(
            {
              user_id: user.id,
              ...routineBase,
              app_notifications_enabled: true,
              notification_permission_status: "granted",
              timezone: detectedTz,
            },
            { onConflict: "user_id" },
          ),
          (supabase as any).from("profiles").upsert(
            {
              id: user.id,
              ...routineBase,
              app_notifications_enabled: true,
              notification_permission_status: "granted",
              timezone: detectedTz,
            },
            { onConflict: "id" },
          ),
        ]);

        if (prefsError || profileError) {
          setAppNotificationsEnabled(previous);
          console.error(
            "[ManifestationRoutineSettings] toggle on upsert failed:",
            prefsError ?? profileError,
          );
          toast.error(t("toasts.routineNotifUpdateFailed"));
          return;
        }

        setSavedIntensity(intensity);
        setRoutineItems(effectiveItems);
        setAlertTimes(effectiveTimes);

        void syncManifestationRoutineOneSignalTags({
          intensity,
          preferredLocale,
          notificationsEnabled: true,
          permissionStatus: "granted",
          alertTimes: effectiveTimes,
          timezone: detectedTz,
        }).catch((err) => {
          console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
        });

        toast.success(t("toasts.routineNotifOn"));
        return;
      } catch (err) {
        setAppNotificationsEnabled(previous);
        console.error("[ManifestationRoutineSettings] permission request failed:", err);
        toast.error(t("toasts.routineNotifPermissionFailed"));
        return;
      }
    }

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        {
          user_id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        {
          id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "id" },
      ),
    ]);

    if (prefsError || profileError) {
      setAppNotificationsEnabled(previous);
      console.error(
        "[ManifestationRoutineSettings] web toggle on upsert failed:",
        prefsError ?? profileError,
      );
      toast.error(t("toasts.routineNotifUpdateFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(effectiveItems);
    setAlertTimes(effectiveTimes);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: true,
        permissionStatus: permissionStatus ?? "skipped",
        alertTimes: effectiveTimes,
        timezone: timeZone,
      }).catch((err) => {
        console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
      });
    }

    toast.success(t("toasts.routineNotifOn"));
  };

  const handleSaveIntensity = async () => {
    if (!user || saving) return;
    setSaving(true);
    const nextRoutine = routineItemsForIntensity(intensity, routineItems, routineItemLabel);

    const routinePatch = {
      manifestation_intensity: intensity,
      manifest_routine_items: nextRoutine,
      routine_notification_times: appNotificationsEnabled ? alertTimes : [],
      preferred_locale: preferredLocale,
    };

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);

    setSaving(false);

    if (prefsError || profileError) {
      console.error("[ManifestationRoutineSettings] save intensity failed:", prefsError ?? profileError);
      toast.error(t("toasts.routineIntensitySaveFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(nextRoutine);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: appNotificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      }).catch(() => {});
    }

    toast.success(t("toasts.routineIntensitySaved"));
  };

  const shellBg = theme === "dark" ? "#0f0d14" : "#ffffff";

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden min-h-screen pb-20 md:pb-0",
        theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
      )}
      style={{ backgroundColor: shellBg }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile ? (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header
          className={cn(
            "z-50 border-b flex items-center",
            theme === "dark" ? "border-white/10 bg-[#0f0d14]" : "border-primary/10 bg-background",
            isMobile
              ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)] px-4 py-2.5"
              : "fixed top-0 left-0 right-0 h-16 px-6",
          )}
          style={
            !isMobile
              ? {
                  top: "var(--app-safe-area-top)",
                  left: sidebarCollapsed ? "64px" : "256px",
                  transition: "left 300ms ease-in-out",
                  backgroundColor: shellBg,
                }
              : { backgroundColor: shellBg }
          }
        >
          <div className={cn("flex w-full items-center justify-between gap-3", !isMobile ? "max-w-4xl mx-auto" : "container mx-auto")}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/dashboard/settings")}
                className={cn(
                  "shrink-0 rounded-full p-2 transition-colors",
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-muted",
                )}
                aria-label={t("routine.backAria")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{t("routine.title")}</h1>
                <p className={cn("text-xs truncate", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.subtitle")}
                </p>
              </div>
            </div>
            {isMobile && <MobilePWAMenu />}
          </div>
        </header>

        <main
          className={cn(
            "relative z-10 w-full px-4 sm:px-6 max-w-4xl",
            isMobile ? "pb-4" : "pb-20",
            !isMobile ? "pt-16" : "",
            !isMobile ? "" : "container mx-auto",
            isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
          )}
        >
          <div className={cn(isMobile ? "pt-3 pb-2" : "py-2 sm:py-3")}>
          {loading ? (
            <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
              {t("routine.loading")}
            </p>
          ) : (
            <div className="w-full min-w-0 max-w-full space-y-4">
              <Card className={cardClass}>
                <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="h-4 w-4" />
                  {t("routine.intensityHeading")}
                </h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.intensityDescription")}
                </p>

                <div className="space-y-3 pt-1">
                  {INTENSITY_IDS.map((id) => {
                    const active = intensity === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setIntensity(id);
                          setAlertTimes([...ROUTINE_ALERT_DEFAULTS[id]]);
                        }}
                        className={choiceTileClass(active)}
                      >
                        <span className="min-w-0 flex-1 space-y-1 text-left">
                          <span className="block text-base font-semibold">{t(`routine.intensity.${id}.title`)}</span>
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              theme === "dark" ? "text-white/80" : "text-foreground/80",
                            )}
                          >
                            {t(`routine.intensity.${id}.tagline`)}
                          </span>
                          <span
                            className={cn(
                              "block text-xs leading-relaxed",
                              theme === "dark" ? "text-white/50" : "text-muted-foreground",
                            )}
                          >
                            {t(`routine.intensity.${id}.description`)}
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 opacity-35" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {intensity !== savedIntensity && (
                  <Button onClick={() => void handleSaveIntensity()} disabled={saving} className="w-full">
                    {saving ? t("routine.saving") : t("routine.saveIntensity")}
                  </Button>
                )}
              </Card>

              <Card className={cardClass}>
                <h2 className="font-semibold text-sm sm:text-base">{t("routine.notificationsHeading")}</h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.notificationsDescription")}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <Label htmlFor="routine-notifications">{t("routine.pushRemindersLabel")}</Label>
                  <Switch
                    id="routine-notifications"
                    checked={appNotificationsEnabled}
                    onCheckedChange={(enabled) => void handleToggleAppNotifications(enabled)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                {appNotificationsEnabled ? (
                  <div
                    className={cn(
                      "w-full min-w-0 space-y-2 border-t pt-3 overflow-hidden",
                      theme === "dark" ? "border-white/10" : "border-border",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        theme === "dark" ? "text-white/90" : "text-foreground",
                      )}
                    >
                      {t("routine.dailyTimeHeading")}
                    </p>
                    <RoutineTimeZoneSelect
                      value={timeZone}
                      dark={theme === "dark"}
                      onChange={(tz) => {
                        setTimeZone(tz);
                        void persistTimeZone(tz);
                      }}
                    />
                    {(intensity === "light"
                      ? [t("routine.alerts.single")]
                      : intensity === "consistent"
                        ? [t("routine.alerts.first"), t("routine.alerts.second")]
                        : [t("routine.alerts.first"), t("routine.alerts.second"), t("routine.alerts.third")]
                    ).map((label, index) => (
                      <div key={label} className="flex min-w-0 items-center justify-between gap-3">
                        <Label className="min-w-0 shrink text-sm font-normal">{label}</Label>
                        <input
                          type="time"
                          value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[intensity][index]}
                          onChange={(e) => {
                            const next = [...alertTimes];
                            next[index] = e.target.value;
                            setAlertTimes(next);
                            if (appNotificationsEnabled) {
                              void persistAlertTimes(next);
                            }
                          }}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-sm",
                            theme === "dark"
                              ? "border-white/15 bg-white/10 text-white [color-scheme:dark]"
                              : "border-border bg-background text-foreground",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {permissionStatus === "denied" && (
                  <p className={cn("text-xs", theme === "dark" ? "text-white/50" : "text-muted-foreground")}>
                    {t("routine.deviceDeniedHint")}
                  </p>
                )}
              </Card>
            </div>
          )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}

```

---

## ManifestationIntensity.tsx (onboarding setup step)

Path: `src/pages/onboarding/setup/ManifestationIntensity.tsx`

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import {
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncManifestationRoutineOneSignalTags,
} from "@/services/oneSignal";
import { useTranslation } from "react-i18next";

type IntensityId = "light" | "consistent" | "locked_in";

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

export default function SetupManifestationIntensity() {
  const { t } = useTranslation(["onboarding", "settings"]);

  const routineItemLabel = (slug: string) => t(`settings:routine.itemLabels.${slug}`);

  const intensityOptions: {
    id: IntensityId;
    title: string;
    tagline: string;
    description: string;
  }[] = [
    {
      id: "light",
      title: t("setup.manifestationIntensity.light.title"),
      tagline: t("setup.manifestationIntensity.light.tagline"),
      description: t("setup.manifestationIntensity.light.description"),
    },
    {
      id: "consistent",
      title: t("setup.manifestationIntensity.consistent.title"),
      tagline: t("setup.manifestationIntensity.consistent.tagline"),
      description: t("setup.manifestationIntensity.consistent.description"),
    },
    {
      id: "locked_in",
      title: t("setup.manifestationIntensity.lockedIn.title"),
      tagline: t("setup.manifestationIntensity.lockedIn.tagline"),
      description: t("setup.manifestationIntensity.lockedIn.description"),
    },
  ];

  const routineAlertLabels: Record<IntensityId, string[]> = {
    light: [t("setup.manifestationIntensity.alerts.alert")],
    consistent: [
      t("setup.manifestationIntensity.alerts.first"),
      t("setup.manifestationIntensity.alerts.second"),
    ],
    locked_in: [
      t("setup.manifestationIntensity.alerts.first"),
      t("setup.manifestationIntensity.alerts.second"),
      t("setup.manifestationIntensity.alerts.third"),
    ],
  };
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showAttScreen =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const initial = useMemo(() => {
    const d = readSetupDraft();
    const raw = d.manifestationIntensity;
    return raw === "light" || raw === "consistent" || raw === "locked_in" ? raw : null;
  }, []);
  const [selected, setSelected] = useState<IntensityId | null>(initial);
  const [notificationChoice, setNotificationChoice] = useState<"yes" | "not_now" | null>(null);
  const [alertTimes, setAlertTimes] = useState<string[]>(
    initial ? [...ROUTINE_ALERT_DEFAULTS[initial]] : ROUTINE_ALERT_DEFAULTS.consistent,
  );
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTimeZone(readDeviceTimeZone());
  }, []);

  useEffect(() => {
    if (!selected) return;
    setAlertTimes([...ROUTINE_ALERT_DEFAULTS[selected]]);
  }, [selected]);

  useEffect(() => {
    if (notificationChoice === "yes") {
      setTimeZone(readDeviceTimeZone());
    }
  }, [notificationChoice]);

  const nextRoute =
    showAttScreen && isSuiteFunnel
      ? `${setupBase}/notifications`
      : isSuiteFunnel
        ? `${setupBase}/tool-preference`
        : `${setupBase}/plot-loading`;

  const handleBack = () => {
    if (isSuiteFunnel) {
      navigate(`${setupBase}/guide`);
      return;
    }
    navigate(`${setupBase}/begin-journey`);
  };

  const persistAndContinue = async (opts: {
    intensity: IntensityId;
    notificationsEnabled: boolean;
    permissionStatus: "granted" | "denied" | "skipped";
    requestPermission: boolean;
  }) => {
    if (busy) return;
    setBusy(true);

    const draft = readSetupDraft();
    const toolPrefs = Array.isArray(draft.toolPreferences)
      ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
      : [];

    const routineItems: { slug: string; label: string; cadence: string; target_per_week: number }[] =
      [];

    if (toolPrefs.includes("powerful_affirmations") || toolPrefs.length === 0) {
      routineItems.push({
        slug: "affirmations",
        label: routineItemLabel("affirmations"),
        cadence: "daily",
        target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
      });
    }
    if (toolPrefs.includes("custom_subliminals")) {
      routineItems.push({
        slug: "subliminals",
        label: routineItemLabel("subliminals"),
        cadence: opts.intensity === "light" ? "weekly" : "daily",
        target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 4 : 2,
      });
    }
    if (toolPrefs.includes("mirror_work_reset")) {
      routineItems.push({
        slug: "mirror_work",
        label: routineItemLabel("mirror_work"),
        cadence: opts.intensity === "light" ? "weekly" : "daily",
        target_per_week: opts.intensity === "locked_in" ? 5 : opts.intensity === "consistent" ? 3 : 1,
      });
    }
    if (toolPrefs.includes("belief_restructuring")) {
      routineItems.push({
        slug: "belief_work",
        label: routineItemLabel("belief_work"),
        cadence: "weekly",
        target_per_week: opts.intensity === "locked_in" ? 4 : opts.intensity === "consistent" ? 2 : 1,
      });
    }
    if (toolPrefs.includes("ai_manifestation_guidance")) {
      routineItems.push({
        slug: "guide_check_in",
        label: routineItemLabel("guide_check_in"),
        cadence: "weekly",
        target_per_week: opts.intensity === "locked_in" ? 3 : opts.intensity === "consistent" ? 2 : 1,
      });
    }
    if (toolPrefs.includes("daily_wins_progress")) {
      routineItems.push({
        slug: "progress_review",
        label: routineItemLabel("progress_review"),
        cadence: "weekly",
        target_per_week: opts.intensity === "locked_in" ? 2 : 1,
      });
    }
    if (routineItems.length === 0) {
      routineItems.push({
        slug: "affirmations",
        label: routineItemLabel("affirmations"),
        cadence: "daily",
        target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
      });
    }

    let permissionStatus = opts.permissionStatus;
    let notificationsEnabled = opts.notificationsEnabled;

    if (opts.requestPermission && Capacitor.isNativePlatform()) {
      try {
        const granted = await requestOneSignalPushPermission(true);
        notificationsEnabled = granted;
        permissionStatus = granted ? "granted" : "denied";
      } catch {
        notificationsEnabled = false;
        permissionStatus = "denied";
      }
    }

    await writeSetupDraft(
      {
        manifestationIntensity: opts.intensity,
        manifestRoutineItems: routineItems,
        appNotificationsConsent: notificationsEnabled,
        notificationPermissionStatus: permissionStatus,
        routineNotificationTimes: notificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      },
      { awaitBackendSync: true },
    );

    if (Capacitor.isNativePlatform()) {
      try {
        await syncManifestationRoutineOneSignalTags({
          intensity: opts.intensity,
          notificationsEnabled,
          permissionStatus,
          alertTimes: notificationsEnabled ? alertTimes : [],
          timezone: timeZone,
        });
      } catch (e) {
        console.warn("[ManifestationIntensity] OneSignal tag sync failed:", e);
      }
    }

    navigate(nextRoute);
  };

  const handleSetRoutine = () => {
    if (!selected || !notificationChoice) return;
    void persistAndContinue({
      intensity: selected,
      notificationsEnabled: notificationChoice === "yes",
      permissionStatus: notificationChoice === "yes" ? "granted" : "skipped",
      requestPermission: notificationChoice === "yes",
    });
  };

  const canContinue = selected !== null && notificationChoice !== null && !busy;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleSetRoutine}
      continueText={t("setup.manifestationIntensity.setRoutine")}
    >
      <SetupHeadingBlock
        centered
        title={t("setup.manifestationIntensity.title")}
        subtitle={t("setup.manifestationIntensity.subtitle")}
      />

      <div className="relative z-[1] -translate-x-0.5 space-y-3 pt-6">
        {intensityOptions.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => setSelected(option.id)}
              className={cn(setupTextChoiceTileClass(active), "items-start text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-sans text-base font-semibold text-white">{option.title}</span>
                <span className="block font-sans text-sm font-medium text-white/80">{option.tagline}</span>
                <span className={cn("block text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                  {option.description}
                </span>
              </span>
              {active ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-white/35" />
              )}
            </button>
          );
        })}

        <div className="space-y-3 pt-4">
          <p className="text-left font-sans text-sm font-medium leading-snug text-white/90">
            {t("setup.manifestationIntensity.notificationsQuestion")}
          </p>

          <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
            {t("setup.manifestationIntensity.notificationsHint")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "yes" as const, label: t("setup.manifestationIntensity.yes") },
                { id: "not_now" as const, label: t("setup.manifestationIntensity.notNow") },
              ] as const
            ).map((option) => {
              const active = notificationChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setNotificationChoice(option.id)}
                  className={cn(setupTextChoiceTileClass(active), "items-center justify-center text-center")}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className="font-sans text-base font-semibold text-white">{option.label}</span>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-white/35" />
                  )}
                </button>
              );
            })}
          </div>

          {notificationChoice === "yes" && selected ? (
            <div className="w-full min-w-0 space-y-2 pt-2 overflow-hidden">
              <p className="text-left font-sans text-sm font-medium text-white/90">
                {t("setup.manifestationIntensity.dailyTime")}
              </p>
              <RoutineTimeZoneSelect
                id="onboarding-routine-timezone"
                value={timeZone}
                disabled={busy}
                onChange={(tz) => {
                  setTimeZone(tz);
                  void writeSetupDraft({ timezone: tz });
                }}
              />
              {routineAlertLabels[selected].map((label, index) => (
                <div key={label} className="flex min-w-0 items-center justify-between gap-3">
                  <span className="font-sans text-sm text-white/85">{label}</span>
                  <input
                    type="time"
                    value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[selected][index]}
                    disabled={busy}
                    onChange={(e) => {
                      const next = [...alertTimes];
                      next[index] = e.target.value;
                      setAlertTimes(next);
                    }}
                    className="rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 font-sans text-sm text-white [color-scheme:dark]"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {t("setup.manifestationIntensity.customizeInSettings")}
        </p>
      </div>
    </SetupPage>
  );
}

```

---

## Guide.tsx (onboarding guide picker)

Path: `src/pages/onboarding/setup/Guide.tsx`

```tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Card } from "@/components/ui/card";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

const GUIDES = [
  {
    id: "river",
    name: "River",
    headshot: "/headshots/river-headshot-2.png",
    themes: ["Transitions", "Career"],
    bubbleColor: "#4AC7FF",
    overlayColor: "#4AC7FF",
    imagePosition: "object-[35%_15%]",
    imageScale: "scale-85",
  },
  {
    id: "sage",
    name: "Sage",
    headshot: "/headshots/sage-headshot.png",
    themes: ["Finance", "Identity"],
    bubbleColor: "#8fbf76",
    overlayColor: "#8fbf76",
    imagePosition: "object-[35%_20%]",
  },
  {
    id: "rose",
    name: "Rose",
    headshot: "/headshots/rose-headshot.png",
    themes: ["Love", "Self Concept"],
    bubbleColor: "#FFB6C1",
    overlayColor: "#FFB6C1",
    imagePosition: "object-[35%_35%]",
  },
  {
    id: "oliver",
    name: "Oliver",
    headshot: "/headshots/oliver-headshot.png",
    themes: ["Self Image", "Fitness"],
    bubbleColor: "#FFC107",
    overlayColor: "#FFC107",
    imagePosition: "object-[35%_30%]",
  },
] as const;

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

export default function SetupGuide() {
  const { t } = useTranslation("onboarding");
  const { t: tTools } = useTranslation("tools");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const { updateSession } = useOnboardingSession();

  useEffect(() => {
    if (!isSuiteFunnel) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [isSuiteFunnel, navigate, setupBase]);
  const initial = useMemo(() => readSetupDraft().guideCharacterId ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);

  const handleContinue = async () => {
    if (!selected) return;
    writeSetupDraft({ guideCharacterId: selected });
    try {
      await updateSession({ character_id: selected });
    } catch (e) {
      console.warn("Failed to persist guide selection:", e);
    }
    navigate(`${setupBase}/manifestation-intensity`);
  };

  return (
    <SetupPage
      canContinue={selected !== null}
      contentFitsViewport
      onBack={() => navigate(`${setupBase}/begin-journey`)}
      onContinue={handleContinue}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          className="text-center [&_h1]:text-center"
          title={t("setup.guide.title")}
          subtitle={t("setup.guide.subtitle")}
          subtitleClassName="pl-0 text-center"
        />

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-4">
          {GUIDES.map((character) => {
            const isSelected = selected === character.id;
            const glowColor = character.bubbleColor;
            return (
              <Card
                key={character.id}
                onClick={() => setSelected(character.id)}
                className={`relative overflow-hidden group cursor-pointer min-h-[70px] sm:min-h-[130px] border bg-transparent ${
                  isSelected ? "border-transparent" : "border-white/12"
                }`}
                style={{
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: "scale(1)",
                  ...(isSelected
                    ? {
                        boxShadow: `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40, 0 0 60px ${glowColor}20`,
                      }
                    : {}),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
              >
                <div className="absolute inset-0 rounded-lg bg-white" aria-hidden />
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={character.headshot}
                    alt={character.name}
                    className={`w-[120%] h-full object-cover ${character.imagePosition} ${character.imageScale ?? "scale-110"} sm:scale-100 -translate-x-[24%]`}
                  />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `${character.overlayColor}33` }}
                />
                <div className="relative p-2 sm:p-4 flex items-end justify-end h-full min-h-[70px] sm:min-h-[130px]">
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <h3 className="text-base sm:text-xl font-bold text-black drop-shadow-sm">{character.name}</h3>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {character.themes.map((theme) => (
                        <div
                          key={theme}
                          className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                          style={{ backgroundColor: `${character.bubbleColor}E6` }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap text-center">
                            {tTools(THEME_I18N_KEYS[theme] ?? theme)}
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
      </div>
    </SetupPage>
  );
}

```

---

## oneSignal.ts (push + locale tags)

Path: `src/services/oneSignal.ts`

```tsx
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import OneSignal from "@onesignal/capacitor-plugin";
import { toast } from "sonner";
import {
  detectInitialAppLocale,
  oneSignalLanguageForApp,
  type AppLocale,
} from "@/lib/locale";

let hasInitialized = false;
let listenersAttached = false;

function getOneSignalAppId(): string | null {
  const id = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!id) return null;
  const trimmed = id.trim();
  return trimmed ? trimmed : null;
}

/** TikTok / paid social: paletteplotting://welcome?utm_source=tiktok&ttclid=… → onboarding welcome. */
const CAMPAIGN_WELCOME_HOSTS = new Set(["welcome", "open", "campaign"]);

function campaignWelcomePathFromPalettePlottingUrl(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  const pathParts = u.pathname.replace(/^\//, "").split("/").filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase() ?? "";

  if (CAMPAIGN_WELCOME_HOSTS.has(host)) {
    return `/onboarding/welcome${u.search}${u.hash}`;
  }
  if (host === "onboarding" && (firstPath === "welcome" || pathParts.length === 0)) {
    return `/onboarding/welcome${u.search}${u.hash}`;
  }
  return null;
}

/** Maps push / app URL schemes to in-app routes (e.g. paletteplotting://help-request/{id}). */
export function resolvePushDeepLinkTarget(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.protocol === "paletteplotting:") {
      const welcomeTarget = campaignWelcomePathFromPalettePlottingUrl(u);
      if (welcomeTarget) return welcomeTarget;

      const caseId = u.pathname.replace(/^\//, "").split("/").filter(Boolean)[0];
      if (u.hostname === "help-request" && caseId) {
        return `/dashboard/report-issue?tab=inbox&case=${encodeURIComponent(caseId)}`;
      }
    }
    if (u.protocol === "capacitor:" || u.protocol === "http:" || u.protocol === "https:") {
      const path = `${u.pathname}${u.search}${u.hash}`;
      if (path.startsWith("/onboarding/welcome")) return path;
      if (path.startsWith("/")) return path;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function followPushDeepLink(url: string): void {
  const target = resolvePushDeepLinkTarget(url) ?? url;
  window.location.href = target;
}

export async function bootstrapOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (hasInitialized) return;

  const appId = getOneSignalAppId();
  if (!appId) {
    console.warn("[OneSignal] Missing VITE_ONESIGNAL_APP_ID; skipping initialize.");
    return;
  }

  await OneSignal.initialize({ appId });
  hasInitialized = true;
}

export function attachOneSignalListenersOnce(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
    try {
      const n = event.getNotification();
      const title = n.title ?? "Notification";
      const body = n.body ?? "";
      if (body) toast.info(body, { title });
    } catch {
      // ignore
    }
  });

  OneSignal.Notifications.addEventListener("click", (event) => {
    const url = event?.result?.url || (event?.notification?.additionalData as any)?.url;
    if (typeof url === "string" && url) {
      followPushDeepLink(url);
    }
  });

  OneSignal.InAppMessages.addEventListener("click", (event: any) => {
    const url =
      event?.result?.url ||
      event?.clickResult?.url ||
      event?.actionId ||
      event?.message?.actions?.[0]?.url;
    if (typeof url === "string" && url) {
      followPushDeepLink(url);
    }
  });
}

async function optInOneSignalPush(): Promise<void> {
  try {
    await OneSignal.User.pushSubscription.optIn();
  } catch {
    // OS permission may be enough even if opt-in fails.
  }
}

export async function requestOneSignalPushPermission(fallbackToSettings = true): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  attachOneSignalListenersOnce();
  await bootstrapOneSignal();

  const appId = getOneSignalAppId();
  if (!appId || !hasInitialized) {
    console.warn("[OneSignal] SDK unavailable; falling back to OS notification permission.");
    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") return true;
    const result = await PushNotifications.requestPermissions();
    return result.receive === "granted";
  }

  try {
    if (await OneSignal.Notifications.hasPermission()) {
      await optInOneSignalPush();
      return true;
    }

    const canRequest = await OneSignal.Notifications.canRequestPermission();
    const granted = await OneSignal.Notifications.requestPermission(
      !canRequest && fallbackToSettings,
    );
    if (granted) {
      await optInOneSignalPush();
      return true;
    }

    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }

    return false;
  } catch (error) {
    console.warn("[OneSignal] requestPermission failed; trying OS fallback:", error);
    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }
    const result = await PushNotifications.requestPermissions();
    if (result.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }
    return false;
  }
}

export async function oneSignalLogin(externalId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  await OneSignal.login(externalId);
}

export async function oneSignalLogout(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  await OneSignal.logout();
}

/** IANA timezone from the device (e.g. America/Chicago). Used for routine push scheduling. */
export function readDeviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.trim()) return tz.trim();
  } catch {
    /* ignore */
  }
  return "UTC";
}

/** Match onboarding language so OneSignal picks es/pt push copy (not device system language). */
export async function syncOneSignalUserLanguage(locale?: AppLocale): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  const appLocale = locale ?? detectInitialAppLocale();
  try {
    await OneSignal.User.setLanguage(oneSignalLanguageForApp(appLocale));
  } catch (error) {
    console.warn("[OneSignal] setLanguage failed:", error);
  }
}

/** Push + in-app journeys read these tags in the OneSignal dashboard. */
export async function syncManifestationRoutineOneSignalTags(opts: {
  intensity: "light" | "consistent" | "locked_in";
  notificationsEnabled: boolean;
  permissionStatus: "granted" | "denied" | "skipped" | null;
  alertTimes: string[];
  timezone?: string | null;
  preferredLocale?: AppLocale | null;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();

  const appLocale = opts.preferredLocale ?? detectInitialAppLocale();
  await syncOneSignalUserLanguage(appLocale);

  const timezone = (opts.timezone?.trim() || readDeviceTimeZone()).trim() || "UTC";

  const tags: Record<string, string> = {
    manifestation_intensity: opts.intensity,
    notifications_enabled: opts.notificationsEnabled ? "true" : "false",
    notification_permission_status: opts.permissionStatus ?? "skipped",
    preferred_locale: appLocale,
    timezone,
    routine_alert_count: opts.notificationsEnabled ? String(opts.alertTimes.length) : "0",
    routine_notification_times: opts.notificationsEnabled ? opts.alertTimes.join(",") : "",
    routine_alert_1: opts.notificationsEnabled && opts.alertTimes[0] ? opts.alertTimes[0] : "",
    routine_alert_2: opts.notificationsEnabled && opts.alertTimes[1] ? opts.alertTimes[1] : "",
    routine_alert_3: opts.notificationsEnabled && opts.alertTimes[2] ? opts.alertTimes[2] : "",
  };

  await OneSignal.User.addTags(tags);
}


```

---

## AuthContext.tsx (OneSignal login + tag sync on auth)

Path: `src/contexts/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { unregisterPushNotifications } from "@/services/pushNotifications";
import {
  oneSignalLogin,
  oneSignalLogout,
  readDeviceTimeZone,
  syncManifestationRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import {
  bootstrapRevenueCat,
  hasRevenueCatEntitlement,
  refreshAppleRevenueCatPlanOnServer,
} from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";
import { syncRevenueCatAttributionAttributes } from "@/services/revenueCatAttribution";
import { Capacitor } from "@capacitor/core";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/** (6) Stagger native IAP work after first paint (ms). */
const NATIVE_RC_BOOTSTRAP_MS = 450;
const NATIVE_RC_ENTITLEMENT_MS = 600;
/** Apple/RevenueCat–billed users: refresh user_plans from RC API (web + native). */
const APPLE_RC_SERVER_SYNC_MS = 750;
const RC_ATTRIBUTION_SYNC_MS = 900;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const maxRetries = 3;
    
    // (3) Safety timeout — if auth check takes too long, stop loading anyway (NativeSplashGate
    // can still hold the native layer longer; backup splash tear-down is ~8s).
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth check timeout - stopping loading state");
        setIsLoading(false);
      }
    }, 3000); // 3 second max for auth check (longer for PWA)


    // Function to get session with retry logic (for PWA standalone mode)
    const getSessionWithRetry = async (attempt: number = 0): Promise<void> => {
      if (!isMounted) return;

      try {
        // Check if localStorage is available (can be an issue in some PWA contexts)
        if (typeof window !== 'undefined' && !window.localStorage) {
          console.warn("localStorage not available, proceeding without session");
          if (isMounted) {
            setIsLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("Error getting session:", error);
          // Retry if we haven't exceeded max retries
          if (attempt < maxRetries) {
            setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
            return;
          }
          // After max retries, stop loading anyway
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("Error getting session (catch):", error);
        if (!isMounted) return;
        
        // Retry if we haven't exceeded max retries
        if (attempt < maxRetries) {
          setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
          return;
        }
        
        // After max retries, stop loading anyway
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Get initial session with retry logic
    getSessionWithRetry();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Apply saved UI locale when user logs in (device/draft choice wins over stale DB).
  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const stored = readStoredPreferredLocale();
      if (stored) {
        setAppLocale(stored);
        await Promise.all([
          supabase.from("user_preferences").upsert(
            { user_id: user.id, preferred_locale: stored },
            { onConflict: "user_id" },
          ),
          supabase.from("profiles").upsert(
            { id: user.id, preferred_locale: stored },
            { onConflict: "id" },
          ),
        ]);
        return;
      }

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferred_locale")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromPrefs = prefs?.preferred_locale;
      if (fromPrefs && isAppLocale(fromPrefs)) {
        writeStoredPreferredLocale(fromPrefs);
        setAppLocale(fromPrefs);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      const fromProfile = profile?.preferred_locale;
      if (fromProfile && isAppLocale(fromProfile)) {
        writeStoredPreferredLocale(fromProfile);
        setAppLocale(fromProfile);
      }
    })();
  }, [user?.id]);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (user?.id) {
      // Tie OneSignal user identity to Supabase UUID and refresh routine notification tags.
      void oneSignalLogin(user.id)
        .then(async () => {
          const [prefsRes, profileRes] = await Promise.all([
            (supabase as any)
              .from("user_preferences")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("user_id", user.id)
              .maybeSingle(),
            (supabase as any)
              .from("profiles")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          const prefs = prefsRes.data as {
            manifestation_intensity?: string | null;
            app_notifications_enabled?: boolean | null;
            notification_permission_status?: string | null;
            routine_notification_times?: unknown;
            timezone?: string | null;
            preferred_locale?: string | null;
          } | null;
          const profile = profileRes.data as typeof prefs;

          const notificationsEnabled =
            prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;
          if (!notificationsEnabled) return;

          const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
          const intensity =
            intensityRaw === "light" || intensityRaw === "consistent" || intensityRaw === "locked_in"
              ? intensityRaw
              : "consistent";

          const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
          const alertTimes = Array.isArray(timesRaw)
            ? timesRaw.filter((t: unknown): t is string => typeof t === "string")
            : [];

          const permissionRaw =
            prefs?.notification_permission_status ?? profile?.notification_permission_status;

          const storedTz = prefs?.timezone ?? profile?.timezone;
          const timezone =
            typeof storedTz === "string" && storedTz.trim() ? storedTz.trim() : readDeviceTimeZone();

          const localeRaw = prefs?.preferred_locale ?? profile?.preferred_locale;
          const preferredLocale: AppLocale | undefined =
            localeRaw && isAppLocale(localeRaw) ? localeRaw : detectInitialAppLocale();

          await syncOneSignalUserLanguage(preferredLocale);

          await syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: true,
            permissionStatus:
              permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
                ? permissionRaw
                : "skipped",
            alertTimes,
            timezone,
            preferredLocale,
          });
        })
        .catch((error) => {
          console.error("[AuthContext] Failed to OneSignal.login or tag sync:", error);
        });
      return;
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      oneSignalLogout().catch((error) => {
        console.error("[AuthContext] Failed to OneSignal.logout:", error);
      });
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);

  // (6) RevenueCat: native Capacitor SDK; web purchases-js (same app user id = Supabase UUID).
  useEffect(() => {
    if (isLoading) return;

    const id = window.setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        void bootstrapRevenueCat(user?.id ?? null);
      } else if (isRevenueCatWebConfigured()) {
        void bootstrapRevenueCatWeb(user?.id ?? null);
      }
    }, NATIVE_RC_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      const checkEntitlement = async () => {
        const hasPro = await hasRevenueCatEntitlement("Palette Plotting Pro");
        if (cancelled) return;
        if (hasPro) {
          console.info("[RevenueCat] Active entitlement found: Palette Plotting Pro");
        }
      };
      void checkEntitlement();
    }, NATIVE_RC_ENTITLEMENT_MS);

```

---

## LanguageSwitcher.tsx (locale persist + OneSignal language)

Path: `src/components/LanguageSwitcher.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_SWITCHER_OPTIONS,
  resolveAppLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { syncRevenueCatUILocale } from "@/services/revenueCat";
import { syncOneSignalUserLanguage } from "@/services/oneSignal";

type LanguageSwitcherProps = {
  className?: string;
  /** Persist to Supabase when user is logged in (e.g. Settings). */
  persistToAccount?: boolean;
  /** Welcome cosmic shell uses light-on-dark labels. */
  variant?: "welcome" | "default";
};

/**
 * Inline locale control — not a dedicated page. Labels stay English | Español | Português.
 */
export function LanguageSwitcher({
  className,
  persistToAccount,
  variant = "welcome",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = resolveAppLocale(i18n.resolvedLanguage || i18n.language);

  const onSelect = (locale: AppLocale) => {
    writeStoredPreferredLocale(locale);
    void writeSetupDraft({ locale });
    setAppLocale(locale);
    void syncRevenueCatUILocale();
    void syncOneSignalUserLanguage(locale);

    if (persistToAccount) {
      void supabase.auth.getUser().then(({ data }) => {
        const userId = data.user?.id;
        if (!userId) return;
        void supabase.from("user_preferences").upsert(
          { user_id: userId, preferred_locale: locale },
          { onConflict: "user_id" },
        );
        void supabase.from("profiles").upsert(
          { id: userId, preferred_locale: locale },
          { onConflict: "id" },
        );
      });
    }
  };

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs", className)}
      role="group"
      aria-label="Language"
    >
      {LANGUAGE_SWITCHER_OPTIONS.map((opt, index) => (
        <span key={opt.code} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span
              className={variant === "welcome" ? "text-white/35" : "text-muted-foreground/50"}
              aria-hidden
            >
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onSelect(opt.code)}
            className={cn(
              "font-sans transition-colors",
              variant === "welcome"
                ? current === opt.code
                  ? "font-semibold text-white"
                  : "font-medium text-white/55 hover:text-white/80"
                : current === opt.code
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}

```

---

## onboardingReadAffirmations.ts (read-aloud builder)

Path: `src/lib/onboardingReadAffirmations.ts`

```tsx
import i18n from "@/i18n";
import type { SetupDraft } from "@/lib/setupDraft";
import { SUPPORT_CATEGORIES, getSupportCategoryLabel } from "@/lib/affirmations-data";

const CANONICAL = new Set(SUPPORT_CATEGORIES.map((c) => c.name));

function getOnboardingReadAffirmationLines(category: string): readonly string[] {
  const raw = i18n.t(`setup.readAffirmations.${category}`, {
    ns: "onboarding",
    returnObjects: true,
  });
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    return raw;
  }
  return [];
}

/** Single manifest focus: primary `desireCategory`, else first valid `desireCategories` entry (legacy). */
export function resolveOnboardingManifestCategories(draft: SetupDraft): string[] {
  const primary = typeof draft.desireCategory === "string" ? draft.desireCategory.trim() : "";
  if (primary && CANONICAL.has(primary)) return [primary];

  if (Array.isArray(draft.desireCategories) && draft.desireCategories.length > 0) {
    for (const x of draft.desireCategories) {
      if (typeof x === "string" && CANONICAL.has(x)) return [x];
    }
  }
  return [];
}

/** Full read-aloud string for the onboarding affirmation step. */
export function buildOnboardingAffirmationReadText(categories: string[]): string {
  const withCopy = categories.filter((c) => getOnboardingReadAffirmationLines(c).length > 0);
  if (withCopy.length === 0) return "";
  if (withCopy.length === 1) {
    const cat = withCopy[0]!;
    return getOnboardingReadAffirmationLines(cat).join("\n\n");
  }
  return withCopy
    .map((cat) => {
      const lines = getOnboardingReadAffirmationLines(cat);
      return `${getSupportCategoryLabel(cat)}\n\n${lines.join("\n\n")}`;
    })
    .join("\n\n");
}

/** ~Natural silent reading pace (characters per step for typewriter). */
export function msPerCharReadingPace(text: string, wordsPerMinute = 220): number {
  const t = text.trim();
  if (t.length === 0) return 32;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  const durationMs = (words / wordsPerMinute) * 60 * 1000;
  return Math.min(72, Math.max(22, Math.round(durationMs / t.length)));
}

```

---

## affirmations-data.ts (premade sets + categories)

Path: `src/lib/affirmations-data.ts`

```tsx
import i18n from "@/i18n";

/** Max characters per affirmation line in Affirm & Script */
export const AFFIRMATION_LINE_MAX_LENGTH = 150;

/** Max characters for custom set name */
export const AFFIRMATION_SET_NAME_MAX_LENGTH = 50;

export interface AffirmationSet {
  id: string;
  name: string;
  affirmations: string[];
  images?: Array<{ id: string; url: string; prompt?: string }>;
  isPremade?: boolean;
  category?: string;
}

export type SupportCategoryCharacter = "river" | "sage" | "rose" | "oliver";

/** `name` is the canonical value (DB, AI, onboarding storage); `label` is user-facing. */
export interface SupportCategoryDef {
  name: string;
  label: string;
  color: string;
  character: SupportCategoryCharacter;
}

// Support categories matching onboarding (12 total). Order = 2-col grid on manifest setup
// (Love/SP, Beauty/Glow Up, Self-Concept, Money, remaining sage, yellow cluster, blue).
// Keep labels in sync with `supabase/functions/_shared/supportCategories.ts`.
export const SUPPORT_CATEGORIES: SupportCategoryDef[] = [
  { name: "Connections", label: "Love / SP", color: "#FFB6C1", character: "rose" },
  { name: "Self-Love", label: "Beauty / Glow Up", color: "#FFB6C1", character: "rose" },
  { name: "Confidence", label: "Self-Concept", color: "#FFB6C1", character: "rose" },
  { name: "Finances", label: "Money", color: "#8fbf76", character: "sage" },
  { name: "Productivity", label: "Focus", color: "#8fbf76", character: "sage" },
  { name: "Organization", label: "Life Reset", color: "#8fbf76", character: "sage" },
  { name: "Fitness", label: "Body / Fitness", color: "#FFC107", character: "oliver" },
  { name: "Nutrition", label: "Wellness", color: "#FFC107", character: "oliver" },
  { name: "Discipline", label: "Discipline", color: "#FFC107", character: "oliver" },
  { name: "Career", label: "Career", color: "#4AC7FF", character: "river" },
  { name: "Business", label: "Business", color: "#4AC7FF", character: "river" },
  { name: "Learning", label: "School / Exams", color: "#4AC7FF", character: "river" },
];

export function getSupportCategoryLabel(category: string | null | undefined): string {
  if (category == null || category === "") return "";
  const key = `supportCategories.${category}`;
  if (i18n.exists(key, { ns: "tools" })) {
    return i18n.t(key, { ns: "tools" });
  }
  const row = SUPPORT_CATEGORIES.find((c) => c.name === category);
  return row?.label ?? category;
}

// Premade affirmation sets
export const PREMADE_SETS: AffirmationSet[] = [
  {
    id: "wealth",
    name: "Wealth & Abundance",
    isPremade: true,
    category: "Finances",
    affirmations: [
      "I am a money magnet and attract wealth effortlessly",
      "Abundance flows to me from multiple sources",
      "I am worthy of financial prosperity and success",
      "Money comes to me easily and frequently",
      "I am financially free and secure",
      "I create wealth through my talents and abilities",
      "My income exceeds my expenses consistently",
      "I make smart financial decisions with confidence",
    ],
  },
  {
    id: "love",
    name: "Love & Relationships",
    isPremade: true,
    category: "Connections",
    affirmations: [
      "I am worthy of deep, authentic love",
      "I attract healthy and fulfilling relationships",
      "Love flows freely to and from me",
      "I communicate my needs with kindness and clarity",
      "I am surrounded by supportive, loving people",
      "My heart is open to give and receive love",
      "I deserve respect and kindness in all relationships",
      "I cultivate genuine connections every day",
    ],
  },
  {
    id: "confidence",
    name: "Confidence & Self-Worth",
    isPremade: true,
    category: "Confidence",
    affirmations: [
      "I trust myself to make good decisions",
      "I am confident and capable in all that I do",
      "I embrace challenges as opportunities to grow",
      "My self-worth is inherent and unshakeable",
      "I speak with confidence and clarity",
      "I believe in my abilities and talents",
      "I am proud of who I am becoming",
      "I show up as my authentic self every day",
    ],
  },
  {
    id: "health",
    name: "Health & Wellness",
    isPremade: true,
    category: "Fitness",
    affirmations: [
      "I honor my body with nourishing choices",
      "I am energetic, strong, and vibrant",
      "Every day I become healthier and fitter",
      "I prioritize rest and recovery",
      "My mind and body are in harmony",
      "I listen to my body and give it what it needs",
      "I enjoy moving my body regularly",
      "I am grateful for my health and vitality",
    ],
  },
  {
    id: "career",
    name: "Career & Success",
    isPremade: true,
    category: "Career",
    affirmations: [
      "I excel in my chosen career path",
      "Opportunities for growth come to me easily",
      "I am valued and respected in my work",
      "I achieve my goals with focus and determination",
      "I am a problem-solver and innovator",
      "Success flows from my consistent actions",
      "I lead with confidence and integrity",
      "I create meaningful impact through my work",
    ],
  },
  {
    id: "spiritual",
    name: "Spiritual Growth",
    isPremade: true,
    category: "Self-Love",
    affirmations: [
      "I am connected to my higher purpose",
      "I trust the guidance of my intuition",
      "I am aligned with peace and clarity",
      "I release what no longer serves me",
      "I welcome growth and transformation",
      "My spirit is grounded and expansive",
      "I am open to wisdom and insight",
      "I radiate love and compassion",
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Focus",
    isPremade: true,
    category: "Productivity",
    affirmations: [
      "I focus on what matters most each day",
      "I plan my work and work my plan",
      "I make steady progress toward my goals",
      "I minimize distractions and stay present",
      "I am disciplined and consistent",
      "I use my time wisely and intentionally",
      "I finish what I start",
      "I celebrate small wins along the way",
    ],
  },
  {
    id: "learning",
    name: "Learning & Growth",
    isPremade: true,
    category: "Learning",
    affirmations: [
      "I learn quickly and effectively",
      "I enjoy mastering new skills",
      "I turn mistakes into lessons",
      "My curiosity drives my growth",
      "I retain information with ease",
      "I ask great questions and seek answers",
      "I am persistent and patient with learning",
      "Learning is enjoyable and rewarding for me",
    ],
  },
];

export function getLocalizedPremadeSets(): AffirmationSet[] {
  return PREMADE_SETS.map((set) => {
    const nameKey = `affirmations.premade.${set.id}.name`;
    const affKey = `affirmations.premade.${set.id}.affirmations`;
    const name = i18n.exists(nameKey, { ns: "tools" }) ? i18n.t(nameKey, { ns: "tools" }) : set.name;
    const localizedAffirmations = i18n.t(affKey, { ns: "tools", returnObjects: true });
    const affirmations = Array.isArray(localizedAffirmations) && localizedAffirmations.every((line) => typeof line === "string")
      ? (localizedAffirmations as string[])
      : set.affirmations;
    return { ...set, name, affirmations };
  });
}










```

---

