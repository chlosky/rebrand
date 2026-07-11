import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, ChevronRight, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { MobileBottomInlet } from "@/components/MobileBottomInlet";
import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useTranslation } from "react-i18next";
import { resolveAppLocale, legalTermsPath, legalPrivacyPath } from "@/lib/locale";
import { SITE_ORIGIN } from "@/lib/siteBrand";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { endStripeTrialEarly } from "@/lib/endStripeTrialEarly";

const darkFieldClass =
  "border-white/12 bg-transparent text-white placeholder:text-white/35 focus-visible:ring-white/20";
const helpTabsListClass = "h-auto w-full p-1";
const helpTabsTriggerClass = "h-8 rounded-md border border-transparent px-2";
const darkTabsListClass = "border border-white/12 bg-transparent";
const darkTabsTriggerClass =
  "text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80 data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const shellDark = theme === "dark";
  const { onTrial, refreshPlan } = usePlottingPro();
  const [endingTrial, setEndingTrial] = useState(false);

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
  const [boardRemindersPaused, setBoardRemindersPaused] = useState(false);
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
  /** Billing identity from user_plans. */
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

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in, board_reminders_paused')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
          setBoardRemindersPaused(prefs.board_reminders_paused === true);
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

    const usernameToSave = username.trim();

    try {
      const { data: usernameModerationData, error: usernameModerationError } =
        await supabase.functions.invoke("check-username-profanity", {
          body: { text: usernameToSave },
        });

      if (usernameModerationError) {
        console.error("Username moderation check error:", usernameModerationError);
        toast.error(t("toasts.usernameValidationError"));
        return;
      }

      if (usernameModerationData?.hasProfanity || usernameModerationData?.safe === false) {
        toast.error(t("toasts.usernameNotAllowed"));
        return;
      }
    } catch (usernameModerationError) {
      console.error("Username moderation check failed:", usernameModerationError);
      toast.error(t("toasts.usernameValidationError"));
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
        username: usernameToSave,
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
    setOriginalUsername(usernameToSave);
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

  const handleToggleBoardRemindersPause = async (paused: boolean) => {
    setBoardRemindersPaused(paused);

    if (user) {
      const { error } = await (supabase as any)
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            board_reminders_paused: paused,
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error("Error updating board reminders pause:", error);
        setBoardRemindersPaused(!paused);
        toast.error(t("toasts.boardRemindersPauseFailed"));
        return;
      }

      if (paused) {
        const { error: cancelErr } = await supabase
          .from("board_reminders")
          .delete()
          .eq("user_id", user.id)
          .eq("status", "scheduled");
        if (cancelErr) {
          console.error("Error cancelling scheduled board reminders:", cancelErr);
        }
      }

      toast.success(paused ? t("toasts.boardRemindersPaused") : t("toasts.boardRemindersResumed"));
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

  /** Opens Stripe Customer Portal for subscription management. */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    try {
      const portalToast = toast.loading(t("billing.openingPortal"));

      if (!stripeCustomerId) {
        await supabase.functions.invoke("sync-stripe-customer", { body: {} });
      }

      const returnUrl = window.location.origin.startsWith("http")
        ? `${window.location.origin}/dashboard/settings`
        : `${SITE_ORIGIN}/dashboard/settings`;

      const { data, error } = await supabase.functions.invoke("create-customer-portal", {
        body: { returnUrl },
      });
      toast.dismiss(portalToast);

      if (error) throw error;

      const payload = data as { url?: string | null; message?: string; error?: string } | null;
      const url = typeof payload?.url === "string" ? payload.url.trim() : "";
      if (!url) {
        toast.error(payload?.message?.trim() || t("toasts.portalFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Manage billing (Stripe portal):", error);
      toast.error(t("toasts.portalFailed"));
    }
  };


  const handleEndTrialEarly = async () => {
    if (!user?.id || endingTrial) return;
    setEndingTrial(true);
    try {
      const result = await endStripeTrialEarly(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshPlan();
      toast.success(
        result.alreadyActive ? t("billing.trialEndedAlready") : t("billing.trialEndedNow"),
      );
    } finally {
      setEndingTrial(false);
    }
  };

  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  return (
    <>
      <MobileBottomInlet />
      <div
        className={cn(workspaceShellClass(shellDark), "min-h-screen pb-20 md:pb-0")}
        style={{ backgroundColor: shellDark ? "#000000" : "#faf8f5" }}
      >
        <div className="min-h-screen">
          <div className="relative z-10">
            <WorkspaceHeader />

            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(helpTabsListClass, "grid grid-cols-4", shellDark && darkTabsListClass)}>
            <TabsTrigger value="profile" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="mt-4 space-y-4">
            <Card className={cn(shellDark ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-4") : "p-4 sm:p-6 space-y-4", shellDark && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", shellDark && darkFieldClass)}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", shellDark && darkFieldClass)}
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
                  className={cn("h-11 py-2.5 leading-6 cursor-default", shellDark ? cn(darkFieldClass, "!opacity-100") : "bg-muted opacity-100")}
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

            <Card className={cn(shellDark ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-4") : "p-4 sm:p-6 space-y-4", shellDark && "!bg-transparent")}>
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
                  className={cn("h-11", shellDark && darkFieldClass)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-11", shellDark && darkFieldClass, passwordError && "border-destructive")}
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
                    className={cn("h-11", shellDark && darkFieldClass, confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent key={`settings-${localeKey}`} value="settings" className="mt-4 space-y-4">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.planRemindersHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.planRemindersDescription")}
              </p>
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3">
                <div className="pr-4">
                  <Label htmlFor="board-reminders-pause" className="text-sm">
                    {t("preferences.boardRemindersPauseLabel")}
                  </Label>
                  <p className={cn("mt-1 text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                    {t("preferences.boardRemindersPauseDescription")}
                  </p>
                </div>
                <Switch
                  id="board-reminders-pause"
                  checked={boardRemindersPaused}
                  onCheckedChange={handleToggleBoardRemindersPause}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/plan-reminders")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.planRemindersButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.planRemindersButtonSubtitle")}
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
          <TabsContent key={`billing-${localeKey}`} value="billing" className="mt-4 space-y-4">
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

                {onTrial ? (
                  <div
                    className={cn(
                      "space-y-3 rounded-lg p-3",
                      theme === "dark" ? "border border-amber-400/30 bg-amber-500/10" : "border border-amber-200 bg-amber-50",
                    )}
                  >
                    <p className="text-sm font-medium">{t("billing.trialActiveHeading")}</p>
                    <p className="text-xs text-muted-foreground">{t("billing.trialActiveDescription")}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={endingTrial}
                      onClick={() => void handleEndTrialEarly()}
                    >
                      {endingTrial ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("billing.trialEnding")}
                        </>
                      ) : (
                        t("billing.endTrialEarly")
                      )}
                    </Button>
                  </div>
                ) : null}

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
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="mt-4 space-y-4">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              {t("legalDisclaimer") ? (
                <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("legalDisclaimer")}
                </p>
              ) : null}

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
                  onClick={() => navigate(legalTermsPath())}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalPrivacyPath())}
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
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
