import type { BoardReminder } from "@/lib/boards/types";

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
    );
    if (r.body) lines.push(`DESCRIPTION:${escapeIcal(r.body)}`);
    lines.push("END:VEVENT");
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
