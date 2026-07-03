// Shared helper for granular OpenAI cost logging
// Best-effort logging that never throws errors or blocks the main function

/**
 * Calculate cost for token-based OpenAI calls (Chat, Aff, BR)
 * Returns null costs for unknown models
 */
export function calcTokenCost(model: string, inputTokens: number, outputTokens: number) {
  // USD per token
  const PRICING: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
  };

  const p = PRICING[model];
  if (!p) return { inputCost: null, outputCost: null, totalCost: null };

  const inputCost = inputTokens * p.in;
  const outputCost = outputTokens * p.out;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

/**
 * Calculate cost for TTS (Textto)
 * tts-1: $15 / 1,000,000 characters
 */
export function calcTtsCost(chars: number) {
  return chars * (15 / 1_000_000);
}

/**
 * Best-effort insert into ai_usage table
 * Never throws - if logging fails, the main function continues normally
 */
export async function safeInsertUsage(
  supabaseAdmin: any,
  row: Record<string, any>
) {
  try {
    await supabaseAdmin.from("ai_usage").insert(row);
  } catch (_e) {
    // fail open: never throw
  }
}

