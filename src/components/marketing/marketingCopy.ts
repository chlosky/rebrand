/** Homepage language aligned with Palette Plotting blog categories and community vocabulary. */

export const FEATURE_STRIP_ITEMS = [
  {
    path: "/dashboard/subliminal",
    title: "Subliminal Maker",
    description:
      "Make subliminals with your own voice, binaural beats, background sounds, and layered vocals.",
  },
  {
    path: "/dashboard/mirror",
    title: "Mirror Work",
    description:
      "Immerse yourself into digital mirror work's scenes and sounds, as you build self-concept with your affirmations.",
  },
  {
    path: "/dashboard/affirmations-builder",
    title: "Robotic Affirm & Script Your Life",
    description:
      "Have your custom affirmations shown on a teleprompter-like screen, count your reps, and visualize.",
  },
  {
    path: "/dashboard/refactor",
    title: "Address Self-Limiting Beliefs",
    description:
      "Deconstruct self-limiting beliefs and integrate expansionary beliefs.",
  },
  {
    path: "/dashboard/your-journey",
    title: "Journal & Track",
    description:
      "Journal, document inspired action, and track your progress with manifesting lists.",
  },
  {
    path: "/dashboard/your-journey/chat",
    title: "Digital Manifesting Coach",
    description:
      "Ask questions you're scared to ask anyone else, and get advice when you're wavering due to 3D circumstances.",
  },
] as const;

export const MAIN_FEATURE_SECTION = {
  eyebrow: "One desire. One story.",
  headlineLine1: "Everything you need for",
  headlineLine2: "the new story",
  body: [
    "Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end.",
  ],
  cta: "Start now",
} as const;

export const MAIN_FEATURE_PILLS = [
  { label: "Love, SP, Self-Concept", category: "Self Concept" },
  { label: "Abundance", category: "Law of Assumption" },
  { label: "Confidence", category: "Self Concept" },
  { label: "Peace", category: "Self Concept" },
] as const;

export const PRACTICE_TOPICS = [
  { label: "Self concept", category: "Self Concept" },
  { label: "Law of Assumption", category: "Law of Assumption" },
  { label: "Manifesting an SP", category: "Manifesting an SP" },
  { label: "Subliminals", category: "Subliminals" },
  { label: "Mirror work", category: "Mirror Work" },
  { label: "Integrated tools", category: "Integrated Manifestation Tools" },
] as const;

/** Marketing blurbs for dashboard tools (blog tone; does not change in-app feature copy). */
export const MARKETING_TOOL_BLURBS: Record<string, string> = {
  "/dashboard/subliminal":
    "Use your own voice, background sounds, binaural beats (like theta waves), and stack your vocals.",
  "/dashboard/mirror":
    "Immerse yourself into different scenes and sounds, while viewing and saying your affirmations.",
  "/dashboard/affirmations-builder":
    "Put your affirmations on loop against visuals connected to your desires. Robotic affirmations, script your life and visualize. Includes an affirmations counter.",
  "/dashboard/refactor":
    "Deconstruct self limiting beliefs with logic and eliminate them from your mental diet.",
  "/dashboard/your-journey":
    "Document your desires on a weekly basis and track how well you have been manifesting them.",
  "/dashboard/your-journey/chat":
    "Manifesting Q&A, advice when you waver, and support for your goals.",
};
