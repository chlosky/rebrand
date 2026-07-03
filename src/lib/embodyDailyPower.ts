/** Number of Embody check-ins that count toward today's bar (max 3). */
export function embodyCheckpointsFilled(completedCount: number): number {
  return Math.min(Math.max(completedCount, 0), 3);
}

/** Smooth fill for the progress track: 0%, ⅓, ⅔, full (no odd labels in UI). */
export function embodyProgressPercentForBar(checkpoints: number): number {
  const c = embodyCheckpointsFilled(checkpoints);
  return (c / 3) * 100;
}

/**
 * Persisted 0–100 value (even thirds). Use for DB + nightly summaries.
 * 4+ distinct actions in a day still store 100.
 */
export function embodyProgressForDatabase(completedCount: number): number {
  const c = Math.min(Math.max(completedCount, 0), 999);
  if (c === 0) return 0;
  return Math.round((Math.min(c, 3) / 3) * 100);
}

/**
 * When `completed_actions` is missing, infer checkpoint tier from stored progress
 * (supports legacy 20% steps and newer third-based values).
 */
export function embodyCheckpointsFromLegacyProgress(p: number | null | undefined): number {
  if (p == null || p <= 0) return 0;
  if (p >= 100) return 3;
  if (p > 0 && p < 100 && p % 20 === 0) {
    return Math.min(3, p / 20);
  }
  if (p >= 67) return 2;
  if (p >= 34) return 1;
  return 1;
}

/** Short reflection line from stored daily power (no raw % in the UI). */
export function embodySummaryLineFromStoredPower(p: number | null | undefined): string | null {
  if (p == null || p <= 0) return null;
  const c = embodyCheckpointsFromLegacyProgress(p);
  if (c >= 3) return "That day you filled every momentum checkpoint on Embody.";
  if (c === 2) return "That day you hit two momentum checkpoints on Embody.";
  return "That day you checked in once on Embody.";
}
