import type { BoardReminder } from "@/lib/boards/types";
import type { AccountabilityReminder } from "@/lib/boards/accountabilityMap";
import { reminderToIso } from "@/lib/boards/accountabilityMap";

function formatIcalDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcalCalendar(reminders: BoardReminder[], calendarName = "palette plotting — The Plan"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//palette plotting//Board Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const r of reminders) {
    const uid = r.ical_uid || `board-reminder-${r.id}@paletteplotting.com`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcalDate(new Date().toISOString())}`,
      `DTSTART:${formatIcalDate(r.remind_at)}`,
      `SUMMARY:${escapeIcal(r.title)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcalFile(reminders: BoardReminder[], filename = "palette-plotting-plan.ics"): void {
  const ics = buildIcalCalendar(reminders);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function weekdayToIcal(day: string | null | undefined): string {
  switch ((day ?? "monday").toLowerCase()) {
    case "monday":
      return "MO";
    case "tuesday":
      return "TU";
    case "wednesday":
      return "WE";
    case "thursday":
      return "TH";
    case "friday":
      return "FR";
    case "saturday":
      return "SA";
    case "sunday":
      return "SU";
    default:
      return "MO";
  }
}

function validDateFromIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date : null;
}

function rruleForAccountabilityReminder(reminder: AccountabilityReminder, until: Date | null = null): string {
  const untilPart = until ? `;UNTIL=${formatIcalDate(until.toISOString())}` : "";

  if (reminder.cadence === "daily") {
    return `RRULE:FREQ=DAILY${untilPart}`;
  }

  if (reminder.cadence === "weekly") {
    return `RRULE:FREQ=WEEKLY;BYDAY=${weekdayToIcal(reminder.day_of_week)}${untilPart}`;
  }

  if (reminder.cadence === "monthly") {
    const dom = reminder.day_of_month ?? 1;
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dom === -1 ? -1 : Math.min(31, Math.max(1, dom))}${untilPart}`;
  }

  return `RRULE:FREQ=MONTHLY;INTERVAL=3${untilPart}`;
}

export function buildAccountabilityIcalCalendar(
  reminders: AccountabilityReminder[],
  calendarName = "palette plotting — Action Reminders",
  maxDateIso?: string | null,
): string {
  const now = new Date().toISOString();
  const maxDate = validDateFromIso(maxDateIso);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//palette plotting//Action Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  reminders.forEach((reminder, index) => {
    const startIso = reminderToIso(reminder);
    if (maxDate && new Date(startIso).getTime() > maxDate.getTime()) return;

    const uid = `palette-${reminder.action_id || `reminder-${index}`}@paletteplotting.com`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcalDate(now)}`,
      `DTSTART:${formatIcalDate(startIso)}`,
      rruleForAccountabilityReminder(reminder, maxDate),
      `SUMMARY:${escapeIcal(reminder.title)}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadAccountabilityIcalFile(
  reminders: AccountabilityReminder[],
  filename = "palette-plotting-action-reminders.ics",
  maxDateIso?: string | null,
): void {
  const ics = buildAccountabilityIcalCalendar(reminders, "palette plotting — Action Reminders", maxDateIso);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
