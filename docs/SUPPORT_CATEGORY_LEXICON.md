# Manifestation focus categories (lexicon)

The app stores **12 canonical category ids** on `user_affirmation_sets.category`, `weekly_goals.category`, and onboarding fields such as `desireCategory`. User-facing copy uses **labels** (for example **Money** instead of **Finances**).

## Single source of truth in code

| Layer | Location |
|--------|-----------|
| Client UI + types | `src/lib/affirmations-data.ts` — `SUPPORT_CATEGORIES`, `getSupportCategoryLabel()` |
| Edge functions (chat parsing, prompts, optional AI aff context) | `supabase/functions/_shared/supportCategories.ts` — `MANIFESTATION_FOCUS_CATEGORIES`, `displayLabelForCanonical()`, `resolveWeeklyGoalCategoryFromAiText()`, `MANIFESTATION_FOCUS_CATEGORY_PROMPT` |

When you change labels or ids, update **both** files so chat parsing, weekly-goal inserts, and the app stay aligned.

## Canonical id → user-facing label

| Canonical (DB / parsing) | Label (UI) |
|--------------------------|------------|
| Career | Career |
| Business | Business |
| Learning | School / Exams |
| Finances | Money |
| Productivity | Focus |
| Organization | Life Reset |
| Confidence | Self-Concept |
| Self-Love | Beauty / Glow Up |
| Connections | Love / SP |
| Fitness | Body / Fitness |
| Nutrition | Wellness |
| Discipline | Discipline |

## AI chat (`handle-chat-message`)

- The model may say **`under School / Exams for this week`** or **`under Learning for this week`**; the backend resolves either form to the canonical id before writing `weekly_goals`.
- The **persistent state snapshot** sent to the model lists each desire as `Label [Canonical]` so the guide sees the same vocabulary as the UI.
- After deploy, run your usual **`supabase functions deploy handle-chat-message`** (and **`generate-affirmations`** if you changed that function) so production matches this repo.
