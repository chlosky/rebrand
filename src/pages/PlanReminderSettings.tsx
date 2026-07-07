import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Calendar, ChevronLeft, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { SMS_MAX_LENGTH } from "@/lib/boards/accountabilityMap";
import { trackReminderAnalytics } from "@/lib/marketingConversionTrack";

function normalizeToE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 6 && digits.length <= 15) return `+${digits}`;
  return null;
}

function parsePreferredChannels(pref: string | null | undefined) {
  const p = pref ?? "email_calendar";
  return {
    email: p.includes("email"),
    calendar: p.includes("calendar"),
    sms: p.includes("sms"),
  };
}

function channelsToPreference(channels: { email: boolean; calendar: boolean; sms: boolean }): string {
  const parts: string[] = [];
  if (channels.email) parts.push("email");
  if (channels.calendar) parts.push("calendar");
  if (channels.sms) parts.push("sms");
  return parts.length > 0 ? parts.join("_") : "email_calendar";
}

export default function PlanReminderSettings() {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hasPro } = usePlottingPro();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [smsConsentChecked, setSmsConsentChecked] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");

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
        const { data: prefs, error } = await supabase
          .from("user_preferences")
          .select(
            "preferred_reminder_channels, phone_number_e164, sms_reminders_enabled, sms_reminder_consent_at, sms_reminder_opted_out_at, timezone",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        const channels = parsePreferredChannels(prefs?.preferred_reminder_channels);
        setEmailEnabled(channels.email);
        setCalendarEnabled(channels.calendar);
        setSmsEnabled(prefs?.sms_reminders_enabled === true);
        setSmsConsentChecked(
          prefs?.sms_reminders_enabled === true && prefs?.sms_reminder_consent_at != null,
        );
        if (typeof prefs?.phone_number_e164 === "string" && prefs.phone_number_e164.trim()) {
          setPhoneInput(prefs.phone_number_e164.replace(/^\+1/, ""));
        }
        if (typeof prefs?.timezone === "string" && prefs.timezone.trim()) {
          setTimezone(prefs.timezone.trim());
        }
      } catch (e) {
        console.error("[PlanReminderSettings] load failed:", e);
        toast.error(t("toasts.planRemindersLoadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, t]);

  const persistPreferences = async (patch: Record<string, unknown>) => {
    if (!user) return false;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    if (error) {
      console.error("[PlanReminderSettings] save failed:", error);
      toast.error(t("toasts.planRemindersSaveFailed"));
      return false;
    }
    return true;
  };

  const handleEmailToggle = async (enabled: boolean) => {
    const next = { email: enabled, calendar: calendarEnabled, sms: smsEnabled };
    if (!next.email && !next.calendar) {
      next.calendar = true;
    }
    setEmailEnabled(next.email);
    const ok = await persistPreferences({ preferred_reminder_channels: channelsToPreference(next) });
    if (!ok) setEmailEnabled(!enabled);
  };

  const handleCalendarToggle = async (enabled: boolean) => {
    const next = { email: emailEnabled, calendar: enabled, sms: smsEnabled };
    if (!next.email && !next.calendar) {
      next.email = true;
    }
    setCalendarEnabled(next.calendar);
    const ok = await persistPreferences({ preferred_reminder_channels: channelsToPreference(next) });
    if (!ok) setCalendarEnabled(!enabled);
  };

  const handleSmsToggle = async (enabled: boolean) => {
    if (enabled && !hasPro) {
      toast.error(t("planReminders.proRequired"));
      return;
    }
    if (enabled) {
      const e164 = normalizeToE164(phoneInput);
      if (!e164) {
        toast.error(t("planReminders.phoneRequired"));
        return;
      }
      if (!smsConsentChecked) {
        toast.error(t("planReminders.consentRequired"));
        return;
      }
      setSaving(true);
      const now = new Date().toISOString();
      const channels = { email: emailEnabled, calendar: calendarEnabled, sms: true };
      const ok = await persistPreferences({
        preferred_reminder_channels: channelsToPreference(channels),
        phone_number_e164: e164,
        sms_reminders_enabled: true,
        sms_reminder_consent_at: now,
        sms_reminder_consent_source: "settings",
        sms_reminder_opted_out_at: null,
      });
      if (ok) {
        await supabase.from("profiles").update({ phone: e164 }).eq("id", user!.id);
        setSmsEnabled(true);
        trackReminderAnalytics("sms_consent_granted");
        toast.success(t("toasts.planSmsEnabled"));
      }
      setSaving(false);
      return;
    }

    setSaving(true);
    const channels = { email: emailEnabled, calendar: calendarEnabled, sms: false };
    const ok = await persistPreferences({
      preferred_reminder_channels: channelsToPreference(channels),
      sms_reminders_enabled: false,
      sms_reminder_opted_out_at: new Date().toISOString(),
    });
    if (ok) {
      setSmsEnabled(false);
      trackReminderAnalytics("sms_reminder_opted_out");
      toast.success(t("toasts.planSmsDisabled"));
    }
    setSaving(false);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    const e164 = normalizeToE164(phoneInput);
    if (!e164) {
      toast.error(t("planReminders.phoneInvalid"));
      return;
    }
    setSaving(true);
    const ok = await persistPreferences({ phone_number_e164: e164 });
    if (ok) {
      await supabase.from("profiles").update({ phone: e164 }).eq("id", user.id);
      toast.success(t("toasts.planPhoneSaved"));
    }
    setSaving(false);
  };

  const cardClass = cn(
    "w-full min-w-0 max-w-full overflow-hidden",
    theme === "dark"
      ? "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm p-4 sm:p-6 space-y-3"
      : "p-4 sm:p-6 space-y-3",
    theme === "dark" && "!bg-transparent",
  );

  const shellBg = theme === "dark" ? "#0f0d14" : "#ffffff";

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden min-h-screen pb-20 md:pb-0",
        theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
      )}
      style={{ backgroundColor: shellBg }}
    >
      <div className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}>
        <header
          className={cn(
            "z-50 border-b flex items-center",
            theme === "dark" ? "border-white/10 bg-[#0f0d14]" : "border-primary/10 bg-background",
            isMobile
              ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)] px-4 py-2.5"
              : "fixed top-0 left-0 right-0 h-16 px-6",
          )}
          style={!isMobile ? { top: "var(--app-safe-area-top)", backgroundColor: shellBg } : { backgroundColor: shellBg }}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/dashboard/settings")}
                className={cn(
                  "shrink-0 rounded-full p-2 transition-colors",
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-muted",
                )}
                aria-label={t("planReminders.backAria")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{t("planReminders.title")}</h1>
              </div>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "relative z-10 w-full px-4 sm:px-6 max-w-4xl",
            isMobile ? "pb-4 flex-1 min-h-0 overflow-y-auto" : "pb-20 pt-16 container mx-auto",
          )}
        >
          <div className={cn(isMobile ? "pt-3 pb-2" : "py-2 sm:py-3")}>
            {loading ? (
              <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("planReminders.loading")}
              </p>
            ) : (
              <div className="space-y-3">
                <Card className={cardClass}>
                  <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Bell className="h-4 w-4" />
                    {t("planReminders.channelsHeading")}
                  </h2>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 shrink-0 opacity-70" />
                        <Label htmlFor="plan-email-reminders">{t("planReminders.emailLabel")}</Label>
                      </div>
                      <Switch
                        id="plan-email-reminders"
                        checked={emailEnabled}
                        onCheckedChange={(v) => void handleEmailToggle(v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="h-4 w-4 shrink-0 opacity-70" />
                        <Label htmlFor="plan-calendar-reminders">{t("planReminders.calendarLabel")}</Label>
                      </div>
                      <Switch
                        id="plan-calendar-reminders"
                        checked={calendarEnabled}
                        onCheckedChange={(v) => void handleCalendarToggle(v)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                    <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("planReminders.calendarHint")}
                    </p>
                  </div>
                </Card>

                <Card className={cardClass}>
                  <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Phone className="h-4 w-4" />
                    {t("planReminders.smsHeading")}
                  </h2>
                  <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                    {t("planReminders.smsDescription")}
                  </p>
                  <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                    {t("planReminders.smsDailyLimit")}
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Label htmlFor="plan-sms-reminders">{t("planReminders.smsLabel")}</Label>
                    <Switch
                      id="plan-sms-reminders"
                      checked={smsEnabled}
                      disabled={saving || !hasPro}
                      onCheckedChange={(v) => void handleSmsToggle(v)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  {!hasPro ? (
                    <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("planReminders.proRequired")}
                    </p>
                  ) : null}

                  <div className="space-y-1.5 pt-3">
                    <Label htmlFor="plan-reminder-phone">{t("planReminders.phoneLabel")}</Label>
                    <Input
                      id="plan-reminder-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="(555) 123-4567"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />
                    <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("planReminders.phoneHint")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void handleSavePhone()}
                    >
                      {t("planReminders.savePhone")}
                    </Button>
                  </div>

                  {!smsEnabled ? (
                    <label className="flex cursor-pointer items-start gap-2 pt-2">
                      <Checkbox
                        checked={smsConsentChecked}
                        onCheckedChange={(v) => setSmsConsentChecked(v === true)}
                        className="mt-0.5"
                      />
                      <span className={cn("text-xs leading-relaxed", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {t("planReminders.smsConsent")}
                      </span>
                    </label>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      disabled={saving}
                      onClick={() => void handleSmsToggle(false)}
                    >
                      {t("planReminders.turnOffSms")}
                    </Button>
                  )}

                  <p className={cn("text-xs pt-2", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                    {t("planReminders.smsCharNote", { max: SMS_MAX_LENGTH })}
                  </p>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
