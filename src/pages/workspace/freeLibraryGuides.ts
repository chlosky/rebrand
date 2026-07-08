export type LibraryBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "callout"; text: string }
  | { type: "divider" }
  | { type: "bullets"; items: string[] }
  | { type: "checklist"; items: string[] }
  | { type: "boardEntry"; label: string; text: string };

export type FreeLibraryGuide = {
  slug: string;
  title: string;
  tagline: string;
  readMinutes: number;
  blocks: LibraryBlock[];
  heroImage?: {
    src: string;
    alt: string;
  };
};

export const FREE_LIBRARY_GUIDES: FreeLibraryGuide[] = [
  {
    slug: "life-rebrand",
    title: "Life Rebrand",
    tagline: "Turn a reset into boards you can use.",
    readMinutes: 6,
    blocks: [
      {
        type: "paragraph",
        text: "A life rebrand gets messy when everything lives in your head at once: the new routines, the new look, the money goals, the room reset, the social shift, the career move, the body goals, the screenshots, the shopping list, and the version of yourself you are trying to step into.",
      },
      {
        type: "paragraph",
        text: "The point of a rebrand board is to separate the areas that need movement, make the direction visible, and keep the next steps close enough that you actually act on them.",
      },
      {
        type: "callout",
        text: "A good life rebrand board system answers three questions: What am I becoming? What needs to change around me? What do I need to do next?",
      },
      { type: "subheading", text: "Start with the areas that actually need a reset" },
      {
        type: "paragraph",
        text: "Start by naming the categories that are asking for structure. Most people need three strong focus areas and one place for action.",
      },
      {
        type: "bullets",
        items: [
          "Self & Direction: style, body, beauty, routines, standards, confidence, visibility.",
          "Money and work: income, career, business, offers, clients, savings, sales, systems.",
          "Home and environment: bedroom, office, kitchen, closet, storage, daily flow.",
          "Relationships and lifestyle: dating, friendships, family, social life, travel, rest.",
          "Plan: dates, tasks, purchases, appointments, deadlines, numbers, next steps.",
        ],
      },
      { type: "divider" },
      { type: "subheading", text: "Give every board a job" },
      {
        type: "boardEntry",
        label: "Focus board",
        text: "Use this for the direction. Add images, statements, proof, references, and reminders that show where the category is going.",
      },
      {
        type: "boardEntry",
        label: "Plan board",
        text: "Use this for movement. Add dates, purchases, calls, appointments, deadlines, numbers, and tasks that need action.",
      },
      {
        type: "boardEntry",
        label: "Reset board",
        text: "Use this when you are rebuilding a room, routine, or season and need to compare what is staying, leaving, or changing.",
      },
      { type: "divider" },
      { type: "subheading", text: "What to put on the board" },
      {
        type: "checklist",
        items: [
          "A short label for the category.",
          "Three to five images that show the direction.",
          "One photo from your real life.",
          "Two or three statements that sound like you.",
          "One number if the category needs a target.",
          "One date if the category needs timing.",
          "One proof item that shows movement has already started.",
          "One sticky note for the next step.",
        ],
      },
      {
        type: "paragraph",
        text: "Keep the board sharp enough that you can understand it in a few seconds. If everything goes on the board, the board stops saying anything.",
      },
      { type: "subheading", text: "Use the tool this way" },
      {
        type: "bullets",
        items: [
          "Create one board for each major category.",
          "Use Statements for the words you want to see often.",
          "Use Sticky notes for active next steps.",
          "Use images for direction.",
          "Use the Plan board for anything with a date, cost, or deadline.",
          "Review the boards weekly and remove what no longer fits.",
        ],
      },
      {
        type: "callout",
        text: "Build a visual system that keeps your new direction in front of you while you move.",
      },
    ],
  },

  {
    slug: "moodboarding",
    title: "Moodboarding",
    tagline: "Taste, direction, and a reason for every piece.",
    readMinutes: 5,
    blocks: [
      {
        type: "paragraph",
        text: "A good moodboard gives a project a visual language. It helps you decide what belongs and what the final direction should feel like before you start buying, designing, filming, decorating, or rebuilding.",
      },
      {
        type: "paragraph",
        text: "The mistake most people make is collecting images with no filter. They save anything attractive, then wonder why the board feels scattered. A strong moodboard needs a point of view.",
      },
      {
        type: "callout",
        text: "Before you add images, decide what the moodboard is supposed to help you choose.",
      },
      { type: "subheading", text: "Pick the decision the board is making" },
      {
        type: "bullets",
        items: [
          "A room direction.",
          "A brand direction.",
          "A content style.",
          "An office setup.",
          "A closet or beauty direction.",
          "A product launch mood.",
          "A life season or personal style shift.",
        ],
      },
      {
        type: "paragraph",
        text: "Once you know the decision, every image has to earn its place. If it looks good but does not help the decision, leave it out.",
      },
      { type: "divider" },
      { type: "subheading", text: "Use a simple image mix" },
      {
        type: "checklist",
        items: [
          "One anchor image that sets the main feeling.",
          "Two texture or material references.",
          "Two room, outfit, desk, product, or lifestyle references.",
          "One detail image for color, lighting, or finish.",
          "One real-life photo if the board is connected to your actual space or style.",
          "One statement that names the direction in plain language.",
        ],
      },
      {
        type: "paragraph",
        text: "The anchor image matters. It keeps the rest of the board from drifting. If the board starts to look confused, go back to the anchor and remove anything that fights it.",
      },
      { type: "subheading", text: "What to avoid" },
      {
        type: "bullets",
        items: [
          "Too many unrelated aesthetics on one board.",
          "Images that are pretty but do not fit the actual goal.",
          "Overloading the board with quotes.",
          "Using colors that fight the room, brand, or product.",
          "Making the board so full that you cannot tell what matters.",
        ],
      },
      { type: "divider" },
      { type: "subheading", text: "Use the board as a filter" },
      {
        type: "paragraph",
        text: "Once your moodboard is built, use it to make choices. If you are buying furniture, picking outfits, styling content, planning a launch, or setting up an office, the board should help you say yes or no faster.",
      },
      {
        type: "boardEntry",
        label: "Images",
        text: "Use them for direction, examples, texture, lighting, and references.",
      },
      {
        type: "boardEntry",
        label: "Statements",
        text: "Use them to name the mood in your own words.",
      },
      {
        type: "boardEntry",
        label: "Sticky notes",
        text: "Use them for decisions: buy, remove, test, film, order, compare, save.",
      },
      {
        type: "callout",
        text: "A finished moodboard should make your next choice easier.",
      },
    ],
  },

  {
    slug: "home-organization",
    title: "Home Organization",
    tagline: "Zones, decisions, and next steps at home.",
    readMinutes: 6,
    blocks: [
      {
        type: "paragraph",
        text: "Home organization gets overwhelming when you try to fix the whole house at once. The closet, kitchen, desk, entryway, bathroom, laundry, storage bins, labels, purchases, and donation piles all start competing for attention.",
      },
      {
        type: "paragraph",
        text: "A board helps because it separates the project into zones. Instead of carrying the whole reset in your head, you can see the rooms, decisions, purchases, and next steps in one place.",
      },
      {
        type: "callout",
        text: "Organize by zones, use, and what keeps breaking down.",
      },
      { type: "subheading", text: "Choose the zones" },
      {
        type: "paragraph",
        text: "Start with the areas that create the most friction — the zones you touch every day.",
      },
      {
        type: "bullets",
        items: [
          "Entryway: keys, shoes, bags, mail, packages.",
          "Kitchen: pantry, counters, dishes, meal prep, cleaning supplies.",
          "Closet: daily clothes, laundry flow, shoes, bags, seasonal storage.",
          "Bathroom: skincare, hair tools, towels, backups, cleaning products.",
          "Bedroom: nightstand, bedding, clothes, surfaces, reset routine.",
          "Office or desk: cords, papers, tech, tools, notebooks, work setup.",
        ],
      },
      { type: "divider" },
      { type: "subheading", text: "Make one board for the reset" },
      {
        type: "paragraph",
        text: "The board should show what is changing. Add photos of the actual space alongside inspiration. Include the real mess, the desired look, and the decisions needed to close the gap.",
      },
      {
        type: "checklist",
        items: [
          "Photo of the current space.",
          "Reference photo for the direction.",
          "List of zones inside the room.",
          "Items to remove, donate, sell, or store.",
          "Items to buy.",
          "Measurements if storage or furniture is involved.",
          "One sticky note for the next action.",
          "One date for when the zone should be finished.",
        ],
      },
      { type: "subheading", text: "Separate inspiration from action" },
      {
        type: "boardEntry",
        label: "Inspiration",
        text: "Use images for the look: shelves, bins, labels, closet systems, kitchen counters, room references, or storage ideas.",
      },
      {
        type: "boardEntry",
        label: "Action",
        text: "Use sticky notes for the work: measure shelf, order bins, clear drawer, donate clothes, label pantry, move cords, book pickup.",
      },
      {
        type: "boardEntry",
        label: "Proof",
        text: "Add before and after photos as the room changes. This keeps the board useful instead of theoretical.",
      },
      { type: "divider" },
      { type: "subheading", text: "Use the board during the reset" },
      {
        type: "bullets",
        items: [
          "Start with one zone.",
          "Remove what obviously does not belong.",
          "Group similar items together.",
          "Decide what needs a container after you see what is left.",
          "Add purchases to the board before buying.",
          "Move finished tasks off the board so it stays current.",
        ],
      },
      {
        type: "callout",
        text: "The board should keep you from buying random organizing products before you know what the space actually needs.",
      },
    ],
  },

  {
    slug: "office-optimization",
    title: "Office Optimization",
    tagline: "A workspace with less friction.",
    readMinutes: 6,
    blocks: [
      {
        type: "paragraph",
        text: "Your office is where your work either gets easier or starts leaking energy. Bad lighting, messy cords, poor storage, an ugly background, uncomfortable seating, and scattered tools all make work feel heavier than it needs to be.",
      },
      {
        type: "paragraph",
        text: "Office optimization is about making the space support the work you actually do. The board helps you plan the setup before you start buying things or rearranging the room for the fifth time.",
      },
      {
        type: "callout",
        text: "A strong office board should answer: What work happens here, what gets in the way, and what needs to change first?",
      },
      { type: "subheading", text: "Start with the work zones" },
      {
        type: "paragraph",
        text: "Most offices need more than one zone, even if they are in one room. Name the zones before you start styling the space.",
      },
      {
        type: "bullets",
        items: [
          "Deep work zone: desk, monitor, chair, keyboard, lighting.",
          "Admin zone: papers, bills, forms, printer, filing, mail.",
          "Creative zone: camera, product shots, samples, props, sketching, planning.",
          "Storage zone: cables, supplies, inventory, notebooks, packaging, tools.",
          "Background zone: what appears on camera, behind the desk, or in photos.",
        ],
      },
      { type: "divider" },
      { type: "subheading", text: "Build the office board" },
      {
        type: "checklist",
        items: [
          "Photo of your current desk or office.",
          "Reference image for the setup you want.",
          "List of problems the room needs to solve.",
          "Measurements for desk, wall, shelves, monitor, rug, or storage.",
          "Shopping list with prices.",
          "Cable and tech list.",
          "Lighting plan.",
          "One next-step sticky note.",
        ],
      },
      {
        type: "paragraph",
        text: "Make the room work harder for you. A cleaner desk, better lighting, a real place for supplies, and a background you are proud of can change the way the space feels immediately.",
      },
      { type: "subheading", text: "Plan before you buy" },
      {
        type: "boardEntry",
        label: "Need",
        text: "The thing that solves an actual problem: chair, lamp, cord tray, storage, monitor arm, shelf, whiteboard, planner, file box.",
      },
      {
        type: "boardEntry",
        label: "Nice",
        text: "The thing that improves the space but should not outrank function: decor, art, tray, candle, plant, book stack, color accent.",
      },
      {
        type: "boardEntry",
        label: "Later",
        text: "The thing that can wait until the main setup works: larger furniture, custom storage, upgraded tech, full room redesign.",
      },
      { type: "divider" },
      { type: "subheading", text: "Use the board to optimize the room" },
      {
        type: "bullets",
        items: [
          "Put the current office photo on the board first.",
          "Mark the biggest source of friction.",
          "Add the reference setup you actually want to work inside.",
          "List the first three changes that would improve the room fastest.",
          "Add purchases only after measuring.",
          "Move active tasks to the Plan board.",
          "Review the setup after one week of actual use.",
        ],
      },
      {
        type: "callout",
        text: "Build a room that makes your work easier to start, easier to continue, and easier to finish.",
      },
    ],
  },
];

export function getFreeLibraryGuide(slug: string): FreeLibraryGuide | undefined {
  return FREE_LIBRARY_GUIDES.find((guide) => guide.slug === slug);
}
