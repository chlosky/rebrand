/**
 * Shared manifestation-community vocabulary for AI prompts (edge functions only).
 */

/** Interpret "SP" / "sp" consistently across chat, belief work, and affirmations. */
export const SP_SPECIFIC_PERSON_FOR_PROMPTS =
  'When the user writes "SP" or "sp" in relationship or manifestation contexts, interpret it as **specific person**: a particular individual they are focusing on (commonly a love interest or romantic connection), not unrelated meanings such as "sales prospect" unless the surrounding text clearly indicates otherwise.';

/** Block inserted into Belief Work guardrails (and moderation that shares them). */
export const USER_TERMINOLOGY_MANIFESTATION_NICHE_BLOCK = `USER TERMINOLOGY (manifestation niche)

${SP_SPECIFIC_PERSON_FOR_PROMPTS}`;
