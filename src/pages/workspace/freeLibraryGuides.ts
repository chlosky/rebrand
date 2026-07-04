export type LibraryColorCard = {
  name: string;
  bestFor: string;
  description: string;
  swatch: string;
  fill?: string;
};

export type LibraryBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "checklist"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "subheading"; text: string }
  | { type: "divider" }
  | { type: "boardEntry"; label: string; text: string }
  | { type: "colorCards"; colors: LibraryColorCard[] }
  | { type: "image"; src: string; alt: string; caption?: string; aspect?: "square" | "wide" | "tall" }
  | {
      type: "imageGrid";
      images: { src: string; alt: string; label?: string }[];
      columns?: 2 | 3;
    }
  | {
      type: "swatchStrip";
      colors: { label: string; swatch: string; fill: string }[];
      caption?: string;
    }
  | { type: "zoneMap"; zones: { id: string; label: string; color: string }[] }
  | { type: "kanbanPreview"; columns: { title: string; items: string[] }[] };

export type FreeLibraryGuide = {
  slug: string;
  category: "life_rebranding" | "moodboarding" | "home_organization" | "office_work";
  title: string;
  tagline: string;
  readMinutes: number;
  coverImage?: string;
  heroImage?: { src: string; alt: string };
  blocks: LibraryBlock[];
};

export const FREE_LIBRARY_GUIDES: FreeLibraryGuide[] = [
  {
    slug: "life-rebrand-starter",
    category: "life_rebranding",
    title: "The quiet rebrand",
    tagline: "Plot the new you before you announce her.",
    readMinutes: 7,
    coverImage: "/library/life-rebrand-cover.png",
    heroImage: {
      src: "/board/reviews/review-01.png",
      alt: "Rose gold focus board in a home office",
    },
    blocks: [
      {
        type: "paragraph",
        text: "A rebrand is not a personality transplant. It is deciding which version of you gets the front row — then building a private room where that version stops being theoretical.",
      },
      {
        type: "callout",
        text: "Rule one: nobody has to know you are rebranding until the plot is too obvious to ignore.",
      },
      {
        type: "subheading",
        text: "How this connects to the board system",
      },
      {
        type: "paragraph",
        text: "Palette Plotting separates your wall into jobs — three focus boards for the life you are stepping into, plus one plan board for what you actually do this week. You do not need the full setup today. You need to know why the split matters.",
      },
      {
        type: "boardEntry",
        label: "Focus board",
        text: "Images, phrases, and vibes for one lane of your rebrand — identity, money, love, home, whatever season you are in.",
      },
      {
        type: "boardEntry",
        label: "Plan board",
        text: "Dates, numbers, to-dos, and the next move. The part most vision boards skip.",
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "Pick three lanes, not twelve",
      },
      {
        type: "paragraph",
        text: "Most people fail because they try to fix love, money, body, career, and aesthetic all in one chaotic collage. Pick three lanes for this season. Everything else waits outside the studio door.",
      },
      {
        type: "imageGrid",
        columns: 3,
        images: [
          {
            src: "/board/reviews/review-01.png",
            alt: "Pink acrylic board in a home office",
            label: "Identity",
          },
          {
            src: "/board/reviews/review-06.png",
            alt: "Pink acrylic board with weekly planning",
            label: "Money",
          },
          {
            src: "/board/reviews/review-04.png",
            alt: "White acrylic board in a bedroom",
            label: "Space",
          },
        ],
      },
      {
        type: "bullets",
        items: [
          "Lane 1 — identity (how you carry yourself, what you repeat)",
          "Lane 2 — environment (what your eyes land on daily)",
          "Lane 3 — proof (one habit that makes the rebrand feel real)",
        ],
      },
      {
        type: "subheading",
        text: "Color picks for a personal rebrand",
      },
      {
        type: "paragraph",
        text: "Board color is not decoration — it tells your brain which category you are in before you read a single word. These three are a strong starting trio for a quiet rebrand season.",
      },
      {
        type: "colorCards",
        colors: [
          {
            name: "Rose Gold",
            bestFor: "identity, self-worth, warmth, personal rebrand",
            description:
              "Soft but polished. Use when the board should feel personal — the self board, confidence rebuild, or the corner of your wall that needs to feel elevated without shouting.",
            swatch: "#E8B4B8",
            fill: "#F5E1E3",
          },
          {
            name: "Black",
            bestFor: "discipline, boundaries, serious goals, locked-in energy",
            description:
              "Deliberate and sharp. Good for money, work, or any lane where you need structure more than softness.",
            swatch: "#1C1C1C",
            fill: "#F5F5F5",
          },
          {
            name: "Yellow",
            bestFor: "fresh starts, optimism, creative reset, momentum",
            description:
              "Brightens a room that has felt stuck. Use for new chapters, social goals, or a wall that needs more lift.",
            swatch: "#FFD93D",
            fill: "#FFF8DC",
          },
        ],
      },
      {
        type: "swatchStrip",
        caption: "Acrylic swatches on a wall — each color owns one lane.",
        colors: [
          { label: "Rose", swatch: "#E8B4B8", fill: "#F5E1E3" },
          { label: "Black", swatch: "#1C1C1C", fill: "#F5F5F5" },
          { label: "Yellow", swatch: "#FFD93D", fill: "#FFF8DC" },
          { label: "Plan", swatch: "#F0F0F0", fill: "#FFFFFF" },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "The 48-hour plot",
      },
      {
        type: "checklist",
        items: [
          "Hour 0–2: Screenshot the aesthetic — not to copy, to name the vibe.",
          "Day 1: Write five lines you would say if the rebrand already happened.",
          "Day 2: Change one visible thing in your space (desk, mirror, lock screen).",
          "Day 3: Do one small public move (outfit, bio line, calendar block) that matches the plot.",
        ],
      },
      {
        type: "image",
        src: "/board/reviews/review-06.png",
        alt: "Pink acrylic focus board with weekly planning",
        caption: "One lane, one board, one habit — that is how the rebrand stops being a fantasy.",
        aspect: "wide",
      },
      {
        type: "callout",
        text: "You are not wishing. You are rehearsing. The difference is whether you built a room for it.",
      },
    ],
  },
  {
    slug: "moodboard-girly",
    category: "moodboarding",
    title: "Moodboard without the mess",
    tagline: "Curate the vibe before you buy the life.",
    readMinutes: 6,
    coverImage: "/library/moodboard-cover.png",
    heroImage: {
      src: "/board/dry-erase/hero-mood-board.png",
      alt: "Moodboard collage on a plotting desk",
    },
    blocks: [
      {
        type: "paragraph",
        text: "A moodboard is a decision filter: does this image belong to the life you are building?",
      },
      {
        type: "subheading",
        text: "Four-corner grid",
      },
      {
        type: "paragraph",
        text: "Use four corners — not because the number is sacred, but because four forces you to edit. Each corner is a board lane waiting to happen.",
      },
      {
        type: "imageGrid",
        images: [
          {
            src: "/board/dry-erase/hero-yellow-planner.png",
            alt: "Yellow weekly planner board",
            label: "Money",
          },
          {
            src: "/board/neon/hero-pink-glow.png",
            alt: "Pink glow moodboard",
            label: "Body",
          },
          {
            src: "/board/home-decor/hero-rose-gold-desk.png",
            alt: "Rose gold desk setup",
            label: "Space",
          },
          {
            src: "/board/reviews/review-03.png",
            alt: "Pink acrylic board above a gaming desk",
            label: "Plot twist",
          },
        ],
      },
      {
        type: "boardEntry",
        label: "Money energy",
        text: "Receipts, numbers, offers, the desk you work from — anything that says revenue is real.",
      },
      {
        type: "boardEntry",
        label: "Body & presence",
        text: "How you want to look in rooms that matter. Not every body goal — the version you are rehearsing.",
      },
      {
        type: "boardEntry",
        label: "Space",
        text: "The apartment, the trip, the corner of your room. Environment is part of the plot.",
      },
      {
        type: "boardEntry",
        label: "Plot twist",
        text: "One image that scares you a little. Good sign. If nothing on the board stretches you, it is wallpaper.",
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "Moodboard color energy",
      },
      {
        type: "colorCards",
        colors: [
          {
            name: "Neon Pink",
            bestFor: "visibility, confidence, content, bold public goals",
            description:
              "Not quiet. Use when the board needs energy — creator goals, events, anything that should be seen.",
            swatch: "#FF4DA6",
            fill: "#FFE0F0",
          },
          {
            name: "Green",
            bestFor: "money, growth, business, stability",
            description:
              "Strong for sales, savings, business goals, or anything connected to growth and grounded abundance.",
            swatch: "#3CB371",
            fill: "#E0F5EA",
          },
          {
            name: "Sky Blue",
            bestFor: "calm planning, soft structure, aesthetic mood",
            description:
              "Lighter and more focused. Good for mood-first boards, routines, or a gentler productivity lane.",
            swatch: "#87CEEB",
            fill: "#E3F4FC",
          },
        ],
      },
      {
        type: "subheading",
        text: "Editing rules",
      },
      {
        type: "checklist",
        items: [
          "If it needs a paragraph of explanation, cut it.",
          "If three images say the same thing, keep the hottest one.",
          "Add one text card with a date — moodboards without deadlines become wallpaper.",
          "Leave one empty corner on purpose — room to plot the next chapter.",
        ],
      },
      {
        type: "image",
        src: "/board/dry-erase/hero-pink-kawaii-desk.png",
        alt: "Curated moodboard desk setup",
        caption: "Arrange before you shop. The board is the product until the life catches up.",
        aspect: "wide",
      },
      {
        type: "callout",
        text: "Stop saving. Start arranging. Pro unlocks drag-and-drop boards so this grid becomes your actual wall.",
      },
    ],
  },
  {
    slug: "home-org-reset",
    category: "home_organization",
    title: "Home zones that actually work",
    tagline: "Zones before bins. Always.",
    readMinutes: 7,
    coverImage: "/library/home-org-cover.png",
    heroImage: {
      src: "/board/home-decor/hero-command-center.png",
      alt: "Home command center with organized zones",
    },
    blocks: [
      {
        type: "paragraph",
        text: "Home organization fails when you buy containers before you understand how you move through a room. You are not Marie Kondo-ing your trauma. You are designing traffic patterns.",
      },
      {
        type: "subheading",
        text: "Zone map sketch",
      },
      {
        type: "paragraph",
        text: "Draw your room in four blobs. Anything that lives in the wrong blob is why you feel behind. Move the object, not your ambition.",
      },
      {
        type: "zoneMap",
        zones: [
          { id: "enter", label: "Enter", color: "#E8B4B8" },
          { id: "work", label: "Work", color: "#87CEEB" },
          { id: "rest", label: "Rest", color: "#98FB98" },
          { id: "stash", label: "Stash", color: "#F0F0F0" },
        ],
      },
      {
        type: "boardEntry",
        label: "Home board",
        text: "Images of the rooms you want, launchpad setups, labels, and the aesthetic you maintain — not every mess, just the zones you care about.",
      },
      {
        type: "boardEntry",
        label: "Plan board",
        text: "Sunday reset checklist, donation dates, and the one surface you refuse to let die.",
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "Colors for home organization",
      },
      {
        type: "colorCards",
        colors: [
          {
            name: "White",
            bestFor: "minimal planning, home organization, clean visual systems",
            description:
              "Keeps the board quiet so your images and labels do the talking. Ideal for a plan board or a minimalist home setup.",
            swatch: "#F0F0F0",
            fill: "#FFFFFF",
          },
          {
            name: "Light Green",
            bestFor: "renewal, soft growth, home resets, ease",
            description:
              "Softer than green. Good for fresh starts, new habits, or a gentler pace in shared spaces.",
            swatch: "#98FB98",
            fill: "#EDFCEB",
          },
          {
            name: "Light Pink",
            bestFor: "care, softness, reset routines, peaceful categories",
            description:
              "Works for rest zones, daily care, beauty routines, or any home lane that needs less pressure.",
            swatch: "#F8BBD0",
            fill: "#FDE8F0",
          },
        ],
      },
      {
        type: "subheading",
        text: "The Sunday reset (15 minutes, max)",
      },
      {
        type: "checklist",
        items: [
          "Surfaces first — if you can see it, it gets decided now.",
          "One inbound spot — mail, bags, random. Everything else is outbound.",
          "Reset the launchpad — keys, charger, tomorrow's outfit. That is your real front door.",
        ],
      },
      {
        type: "imageGrid",
        columns: 2,
        images: [
          {
            src: "/board/reviews/review-07.png",
            alt: "Red acrylic board in an entryway launchpad",
            label: "Launchpad",
          },
          {
            src: "/board/reviews/review-02.png",
            alt: "Black acrylic board in a kitchen",
            label: "Maintain zone",
          },
        ],
      },
      {
        type: "callout",
        text: "Bins are for items that already have a job. If it does not have a job, it is clutter with packaging.",
      },
      {
        type: "bullets",
        items: [
          "Label with verbs: open, file, donate, ship — not cute words.",
          "One aesthetic zone you actually maintain (desk, vanity, coffee station).",
          "Hide the chaos behind one beautiful thing you see every morning.",
        ],
      },
    ],
  },
  {
    slug: "office-planning-lite",
    category: "office_work",
    title: "Office brain, color-coded",
    tagline: "Kanban energy without the corporate coma.",
    readMinutes: 7,
    coverImage: "/library/office-cover.png",
    heroImage: {
      src: "/board/dry-erase/hero-weekly-planner.png",
      alt: "Weekly planner board on a desk",
    },
    blocks: [
      {
        type: "paragraph",
        text: "You do not need another scattered template. You need a board you will look at when the laptop opens — and a ruthless rule about what earns a spot on it.",
      },
      {
        type: "subheading",
        text: "Three columns, no philosophy",
      },
      {
        type: "kanbanPreview",
        columns: [
          { title: "Now", items: ["Invoice client A", "Film reel hook", "Inbox zero (20 min)"] },
          { title: "This week", items: ["Launch preview", "Price test"] },
          { title: "Later", items: ["Rebrand photoshoot", "Course outline"] },
        ],
      },
      {
        type: "paragraph",
        text: "This is the plan board mindset in miniature. Three tasks in Now. Outcomes in This week. Everything else is a parking lot — review Friday or it becomes a guilt museum.",
      },
      {
        type: "divider",
      },
      {
        type: "subheading",
        text: "Office color coding",
      },
      {
        type: "colorCards",
        colors: [
          {
            name: "Blue",
            bestFor: "career, strategy, serious work, long-term goals",
            description:
              "Structured feel. Use for business strategy, professional growth, certifications, or goals that need consistency.",
            swatch: "#2563EB",
            fill: "#E0EBFF",
          },
          {
            name: "Sky Blue",
            bestFor: "focus, calm planning, WFH, study, soft structure",
            description:
              "Lighter and more focused. Good for work blocks, home office planning, or a calmer version of productivity.",
            swatch: "#87CEEB",
            fill: "#E3F4FC",
          },
          {
            name: "Orange",
            bestFor: "creative projects, content, side businesses, build mode",
            description:
              "Warmth plus action. Use for content ideas, launches, product experiments, or anything in make-and-ship mode.",
            swatch: "#FF8C42",
            fill: "#FFE8D6",
          },
        ],
      },
      {
        type: "swatchStrip",
        caption: "One accent color per project — your brain lands faster.",
        colors: [
          { label: "Career", swatch: "#2563EB", fill: "#E0EBFF" },
          { label: "Focus", swatch: "#87CEEB", fill: "#E3F4FC" },
          { label: "Build", swatch: "#FF8C42", fill: "#FFE8D6" },
        ],
      },
      {
        type: "subheading",
        text: "Money & revenue row",
      },
      {
        type: "boardEntry",
        label: "Money row",
        text: "Invoice, follow-up, price test, content that sells. If your planner has no revenue line, you are organizing a hobby.",
      },
      {
        type: "imageGrid",
        columns: 2,
        images: [
          {
            src: "/board/dry-erase/hero-yellow-planner.png",
            alt: "Yellow acrylic planner board above a desk",
            label: "WFH",
          },
          {
            src: "/board/dry-erase/hero-weekly-planner.png",
            alt: "Plan board with tasks and dates",
            label: "Plan board",
          },
        ],
      },
      {
        type: "checklist",
        items: [
          "Monday: set the three Now cards. Midweek: move one thing to Done publicly (story, email, shipped file).",
          "Friday: kill two Later items without mercy.",
          "Keep a single 'waiting on' list — other people's delays are not your backlog.",
        ],
      },
      {
        type: "callout",
        text: "Color is not decoration — it is speed. Pro gives you the full desk: boards, structures, clippings, and reminders wired to this system.",
      },
    ],
  },
];

export function getFreeLibraryGuide(slug: string): FreeLibraryGuide | undefined {
  return FREE_LIBRARY_GUIDES.find((g) => g.slug === slug);
}
