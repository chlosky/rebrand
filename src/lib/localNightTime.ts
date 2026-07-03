/** Dashboard night background: 7:00 PM – 4:59 AM in the user's local timezone. */
export function isLocalNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 19 || hour < 5;
}

/** Milliseconds until the next 7:00 PM / 5:00 AM boundary (for scheduling re-checks). */
export function msUntilLocalNightBoundary(date: Date = new Date()): number {
  const next = new Date(date);
  const hour = date.getHours();
  if (hour >= 19) {
    next.setDate(next.getDate() + 1);
    next.setHours(5, 0, 0, 0);
  } else if (hour < 5) {
    next.setHours(5, 0, 0, 0);
  } else {
    next.setHours(19, 0, 0, 0);
  }
  return Math.max(1000, next.getTime() - date.getTime());
}

export function shouldUseMobileNightDashboardBackground(isLocalNight: boolean): boolean {
  return isLocalNight;
}

/** Bump `v` when `public/Night time.png` changes so native/web caches refresh. */
export const DASHBOARD_NIGHT_BACKGROUND_URL = "/Night time.png?v=2";
export const DASHBOARD_DAY_SKY_BACKGROUND_URL = "/Sky Background.png";
