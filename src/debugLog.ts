/**
 * Debug session f4efe6: optional local ingest + persistence (dev only).
 *
 * Never POST to loopback in production builds: Chrome shows "Access other apps and services
 * on this device" for https origins hitting 127.0.0.1 (Local Network Access).
 */
const INGEST_URL = 'http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd';
const LOG_KEY = 'debug_f4efe6_log';

function isDevDebugIngestEnabled(): boolean {
  return import.meta.env.DEV === true;
}

export function debugLog(payload: {
  sessionId?: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  hypothesisId?: string;
}) {
  if (!isDevDebugIngestEnabled()) return;

  const line = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp ?? Date.now(),
    sessionId: payload.sessionId ?? 'f4efe6',
  });
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f4efe6' },
    body: line,
  }).catch(() => {});
  try {
    const cur = typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
    localStorage.setItem(LOG_KEY, cur ? `${cur}\n${line}` : line);
  } catch {
    // ignore
  }
}

/** Call from Safari Web Inspector or in-app "Copy debug log" button */
export function getDebugLog(): string {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
}

if (typeof window !== 'undefined') {
  (window as unknown as { getDebugLog?: () => string }).getDebugLog = getDebugLog;
}
