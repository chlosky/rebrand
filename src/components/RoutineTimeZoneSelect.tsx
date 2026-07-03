import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { readDeviceTimeZone } from "@/services/oneSignal";

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

function listTimeZones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_TIME_ZONES];
}

function formatTimeZoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const label = tz.replace(/_/g, " ");
    return offset ? `${label} (${offset})` : label;
  } catch {
    return tz.replace(/_/g, " ");
  }
}

type RoutineTimeZoneSelectProps = {
  value: string;
  onChange: (timeZone: string) => void;
  disabled?: boolean;
  dark?: boolean;
  id?: string;
};

export function RoutineTimeZoneSelect({
  value,
  onChange,
  disabled,
  dark = true,
  id = "routine-timezone",
}: RoutineTimeZoneSelectProps) {
  const { t } = useTranslation("settings");
  const deviceZone = useMemo(() => readDeviceTimeZone(), []);
  const options = useMemo(() => {
    const all = listTimeZones();
    const pinned = [deviceZone, value].filter(
      (tz, index, arr) => tz && arr.indexOf(tz) === index,
    );
    const rest = all.filter((tz) => !pinned.includes(tz));
    return [...pinned, ...rest];
  }, [deviceZone, value]);

  return (
    <div className="flex min-w-0 w-full items-center justify-between gap-3">
      <label
        htmlFor={id}
        className={cn("shrink-0 text-sm font-normal", dark ? "text-white/85" : "text-foreground")}
      >
        {t("preferences.timeZoneLabel")}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-w-0 max-w-[14rem] flex-1 truncate rounded-lg border px-2 py-1.5 font-sans text-sm",
          dark
            ? "border-white/15 bg-white/10 text-white [color-scheme:dark]"
            : "border-border bg-background text-foreground",
        )}
      >
        {options.map((tz) => (
          <option key={tz} value={tz}>
            {formatTimeZoneLabel(tz)}
          </option>
        ))}
      </select>
    </div>
  );
}
