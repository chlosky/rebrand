import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "lucide-react";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackReminderAnalytics } from "@/lib/marketingConversionTrack";

type ChannelKey = "calendar" | "email" | "sms";

function normalizeToE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 6 && digits.length <= 15) return `+${digits}`;
  return null;
}

function channelsToPreference(selected: Record<ChannelKey, boolean>): string {
  const parts: string[] = [];
  if (selected.email) parts.push("email");
  if (selected.calendar) parts.push("calendar");
  if (selected.sms) parts.push("sms");
  return parts.length > 0 ? parts.join("_") : "email_calendar";
}

function preferenceToChannels(pref: string | undefined): Record<ChannelKey, boolean> {
  const p = pref ?? "email_calendar";
  return {
    email: p.includes("email"),
    calendar: p.includes("calendar"),
    sms: p.includes("sms"),
  };
}

export default function SetupReminderChannels() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const initial = useMemo(() => {
    const draft = readSetupDraft();
    return {
      channels: preferenceToChannels(draft.preferredReminderChannels),
      phone: draft.phoneNumberE164?.replace(/^\+1/, "") ?? "",
      smsConsent: draft.smsReminderConsent ?? false,
    };
  }, []);

  const [channels, setChannels] = useState(initial.channels);
  const [phone, setPhone] = useState(initial.phone);
  const [smsConsent, setSmsConsent] = useState(initial.smsConsent);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    trackReminderAnalytics("reminder_channel_screen_viewed");
  }, []);

  const toggleChannel = (key: ChannelKey) => {
    setChannels((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "calendar" && next.calendar) {
        trackReminderAnalytics("reminder_channel_selected_calendar");
      }
      if (key === "email" && next.email) {
        trackReminderAnalytics("reminder_channel_selected_email");
      }
      if (key === "sms" && next.sms) {
        trackReminderAnalytics("reminder_channel_selected_sms");
      }
      if (!next.email && !next.calendar && !next.sms) {
        next.email = true;
      }
      return next;
    });
  };

  const canContinue =
    !channels.sms ||
    (normalizeToE164(phone) != null && smsConsent);

  const handleContinue = () => {
    if (channels.sms) {
      const e164 = normalizeToE164(phone);
      if (!e164) {
        setPhoneError("Enter a valid U.S. phone number.");
        return;
      }
      if (!smsConsent) return;
      trackReminderAnalytics("sms_consent_granted");
      void writeSetupDraft({
        preferredReminderChannels: channelsToPreference(channels),
        phoneNumberE164: e164,
        smsReminderConsent: true,
      });
    } else {
      trackReminderAnalytics("sms_consent_declined");
      void writeSetupDraft({
        preferredReminderChannels: channelsToPreference(channels),
        smsReminderConsent: false,
      });
    }
    navigate(`${setupBase}/intensity`);
  };

  const options: {
    key: ChannelKey;
    title: string;
    label: string;
    description: string;
  }[] = [
    {
      key: "calendar",
      title: t("setup.reminderChannels.calendarTitle"),
      label: t("setup.reminderChannels.calendarLabel"),
      description: t("setup.reminderChannels.calendarDescription"),
    },
    {
      key: "email",
      title: t("setup.reminderChannels.emailTitle"),
      label: t("setup.reminderChannels.emailLabel"),
      description: t("setup.reminderChannels.emailDescription"),
    },
    {
      key: "sms",
      title: t("setup.reminderChannels.smsTitle"),
      label: t("setup.reminderChannels.smsLabel"),
      description: t("setup.reminderChannels.smsDescription"),
    },
  ];

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(`${setupBase}/attribution`)}
      onContinue={handleContinue}
      continueText={t("setup.reminderChannels.continue")}
    >
      <SetupHeadingBlock
        centered
        title={t("setup.reminderChannels.title")}
        subtitle={t("setup.reminderChannels.subtitle")}
      />

      <div className="relative z-[1] space-y-3 pt-6">
        {options.map((option) => {
          const active = channels[option.key];
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => toggleChannel(option.key)}
              className={cn(setupTextChoiceTileClass(active), "items-start text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <Checkbox checked={active} className="mt-0.5 shrink-0" tabIndex={-1} />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-sans text-base font-semibold text-zinc-900">{option.title}</span>
                <span className="block font-sans text-sm font-medium text-zinc-600">{option.label}</span>
                <span className={cn("block text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                  {option.description}
                </span>
              </span>
              {active ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-900" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </button>
          );
        })}

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {t("setup.reminderChannels.helper")}
        </p>
        <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {t("setup.reminderChannels.systemLine")}
        </p>

        {channels.sms ? (
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-white/80 p-4">
            <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
              {t("setup.reminderChannels.dailyLimit")}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reminder-phone" className="text-sm text-zinc-800">
                {t("setup.reminderChannels.phoneLabel")}
              </Label>
              <Input
                id="reminder-phone"
                type="tel"
                inputMode="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError(null);
                }}
              />
              <p className={cn("text-xs", SETUP_MUTED_TEXT_CLASS)}>{t("setup.reminderChannels.phoneHint")}</p>
              {phoneError ? <p className="text-xs text-destructive">{phoneError}</p> : null}
            </div>
            <label className="flex cursor-pointer items-start gap-2">
              <Checkbox
                checked={smsConsent}
                onCheckedChange={(v) => setSmsConsent(v === true)}
                className="mt-0.5"
              />
              <span className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                {t("setup.reminderChannels.smsConsent")}
              </span>
            </label>
          </div>
        ) : null}
      </div>
    </SetupPage>
  );
}
