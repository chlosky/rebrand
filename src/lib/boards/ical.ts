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

export function buildIcalCalendar(reminders: BoardReminder[], calendarName = "Palette Plotting — The Plan"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palette Plotting//Board Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const r of reminders) {
    const uid = r.ical_uid || `board-reminder-${r.id}@paletteplot.com`;
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

function rruleForAccountabilityReminder(reminder: AccountabilityReminder): string {
  if (reminder.cadence === "daily") {
    return "RRULE:FREQ=DAILY";
  }

  if (reminder.cadence === "weekly") {
    return `RRULE:FREQ=WEEKLY;BYDAY=${weekdayToIcal(reminder.day_of_week)}`;
  }

  if (reminder.cadence === "monthly") {
    const dom = reminder.day_of_month ?? 1;
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dom === -1 ? -1 : Math.min(31, Math.max(1, dom))}`;
  }

  return "RRULE:FREQ=MONTHLY;INTERVAL=3";
}

export function buildAccountabilityIcalCalendar(
  reminders: AccountabilityReminder[],
  calendarName = "Palette Plotting — Action Reminders",
): string {
  const now = new Date().toISOString();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Palette Plotting//Action Reminders//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  reminders.forEach((reminder, index) => {
    const startIso = reminderToIso(reminder);
    const uid = `palette-${reminder.action_id || `reminder-${index}`}@paletteplotting.com`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcalDate(now)}`,
      `DTSTART:${formatIcalDate(startIso)}`,
      rruleForAccountabilityReminder(reminder),
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
): void {
  const ics = buildAccountabilityIcalCalendar(reminders);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
