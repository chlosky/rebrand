/**
 * Calendar utility functions for generating .ics files
 */

/**
 * Formats a date as YYYYMMDDTHHmmss (floating time, no timezone)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an ICS file string for weekly check-in events
 * Creates two recurring events:
 * - Weekly Start: Monday 9:00 AM
 * - Weekly Close: Friday 7:00 PM
 */
export function generateWeeklyCheckinICS(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Find next Monday at 9:00 AM
  const nextMonday = new Date(year, month, day);
  const dayOfWeek = nextMonday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  nextMonday.setDate(day + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);
  
  // Find next Friday at 7:00 PM
  const nextFriday = new Date(year, month, day);
  let daysUntilFriday;
  if (dayOfWeek === 5) {
    // If today is Friday, get next Friday (7 days)
    daysUntilFriday = 7;
  } else if (dayOfWeek === 6) {
    // If today is Saturday, get next Friday (6 days)
    daysUntilFriday = 6;
  } else if (dayOfWeek === 0) {
    // If today is Sunday, get next Friday (5 days)
    daysUntilFriday = 5;
  } else {
    // Monday (1) through Thursday (4)
    daysUntilFriday = 5 - dayOfWeek;
  }
  nextFriday.setDate(day + daysUntilFriday);
  nextFriday.setHours(19, 0, 0, 0);
  
  const dtstart = formatDate(nextMonday);
  const dtend = formatDate(new Date(nextMonday.getTime() + 30 * 60 * 1000)); // 30 min duration
  
  const dtstartClose = formatDate(nextFriday);
  const dtendClose = formatDate(new Date(nextFriday.getTime() + 30 * 60 * 1000)); // 30 min duration
  
  const uid1 = `weekly-start-${Date.now()}@beliefcraft`;
  const uid2 = `weekly-close-${Date.now() + 1}@beliefcraft`;
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Belief Craft//Weekly Check-In//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    '',
    'BEGIN:VEVENT',
    `UID:${uid1}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICS('Weekly Start')}`,
    `DESCRIPTION:${escapeICS('Check in when ready.')}`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS('Weekly Start reminder')}`,
    'END:VALARM',
    'END:VEVENT',
    '',
    'BEGIN:VEVENT',
    `UID:${uid2}`,
    `DTSTART:${dtstartClose}`,
    `DTEND:${dtendClose}`,
    `SUMMARY:${escapeICS('Weekly Close')}`,
    `DESCRIPTION:${escapeICS('Check in when ready.')}`,
    'RRULE:FREQ=WEEKLY;BYDAY=FR',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS('Weekly Close reminder')}`,
    'END:VALARM',
    'END:VEVENT',
    '',
    'END:VCALENDAR',
  ].join('\r\n');
  
  return ics;
}

/**
 * Downloads an ICS file
 */
export function downloadICS(icsContent: string, filename: string = 'Weekly_Checkin.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

