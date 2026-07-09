// Server-only palette plotting Guide: paid content, HTML renderer, session tokens,
// and entitlement helpers. Never import this from the client (src/).

export const GUIDE_PRODUCT_SLUG = "palette-plotting-guide";
export const GUIDE_PRODUCT_TITLE =
  "palette plotting Guide: The 4-Board Rebrand & Vision Board Method";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export type ColorCard = {
  name: string;
  bestFor: string;
  description: string;
  swatch: string;
};

export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "divider" }
  | { type: "callout"; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "subheading"; text: string }
  | { type: "boardEntry"; label: string; text: string }
  | { type: "colorCards"; colors: ColorCard[] };

export type GuideSection = {
  slug: string;
  title: string;
  blocks: GuideBlock[];
};

const COLOR_CARDS: ColorCard[] = [
  {
    name: "Rose Gold",
    bestFor: "identity, love, beauty, self-worth, personal rebrand, warmth",
    description:
      "Rose gold is soft but still polished. Use it for a board that feels personal: the self board, love board, beauty board, confidence board, or the part of your wall that should feel warm and elevated.",
    swatch: "#E8B4B8",
  },
  {
    name: "Light Pink",
    bestFor: "care, softness, reset routines, home, healing, peaceful categories",
    description:
      "Light pink works well for boards that need a lighter tone. Use it for rest, reset, daily care, love, home, beauty routines, or any area that needs less pressure and more ease.",
    swatch: "#F8BBD0",
  },
  {
    name: "Neon Pink",
    bestFor: "visibility, confidence, public goals, creative risk, content, attention",
    description:
      "Neon pink is not quiet. Use it when the board needs energy: creator goals, public-facing work, confidence, bold style, content ideas, events, or anything that needs to be seen.",
    swatch: "#FF4DA6",
  },
  {
    name: "Sky Blue",
    bestFor: "focus, calm planning, WFH offices, study, soft structure, lower-noise routines",
    description:
      "Sky blue works when you want the board to feel lighter and more focused. Use it for work blocks, home office planning, routines, study goals, writing, planning, or a calmer version of productivity.",
    swatch: "#87CEEB",
  },
  {
    name: "Blue",
    bestFor: "career, strategy, trust, serious work, long-term goals, depth",
    description:
      "Blue gives a board a more structured feel. Use it for career goals, business strategy, professional growth, systems, certifications, job search, or goals that need consistency over time.",
    swatch: "#2563EB",
  },
  {
    name: "Red",
    bestFor: "action, urgency, passion, movement, energy, bold decisions",
    description:
      "Red is for a board that needs momentum. Use it for a goal that has been sitting too long, a launch, a fitness push, a move, a deadline, a personal reset, or anything that needs a stronger signal.",
    swatch: "#E63946",
  },
  {
    name: "Yellow",
    bestFor: "confidence, optimism, fresh starts, energy, creative reset, momentum",
    description:
      "Yellow works well when you need the space to feel brighter. Use it for new beginnings, confidence rebuilding, social goals, content planning, creative work, or a room that needs more lift.",
    swatch: "#FFD93D",
  },
  {
    name: "Orange",
    bestFor: "creative projects, content, side businesses, making, motivation, warmth",
    description:
      "Orange is useful for build mode. Use it for content ideas, product ideas, creative projects, business experiments, launches, art, writing, planning, or anything that needs warmth plus action.",
    swatch: "#FF8C42",
  },
  {
    name: "Green",
    bestFor: "money, growth, business, career expansion, health, stability",
    description:
      "Green is a strong choice for money, sales, business goals, savings, health, career movement, or anything connected to growth. It can feel fresh, grounded, or abundant depending on how you style the rest of the board.",
    swatch: "#3CB371",
  },
  {
    name: "Light Green",
    bestFor: "renewal, soft growth, new chapters, routines, home, ease",
    description:
      "Light green is softer than green. Use it for fresh starts, health routines, home resets, new habits, a gentler work pace, or anything that needs to feel open without being too loud.",
    swatch: "#98FB98",
  },
  {
    name: "White",
    bestFor: "minimal planning, home organization, clean setups, clear visual systems",
    description:
      "White works when you want the board itself to stay quiet. Use it for a plan board, a home organization board, a minimalist office, a neutral room, or a setup where the images and stickers should do most of the talking.",
    swatch: "#F0F0F0",
  },
  {
    name: "Clear",
    bestFor: "flexible spaces, layered visuals, subtle setups, rooms where the wall color matters",
    description:
      "Clear is good when you want the board to blend into the room. Use it for a wall that already has color, a softer office, a small space, or a setup where the board should feel integrated rather than bold.",
    swatch: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(200,220,235,0.35) 100%)",
  },
  {
    name: "Black",
    bestFor: "discipline, structure, focus, luxury, boundaries, serious goals",
    description:
      "Black is strong and deliberate. Use it for discipline, money, work, strength, executive energy, planning, boundaries, a sharper room, or a board that needs to feel more locked in.",
    swatch: "#1C1C1C",
  },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    slug: "start-here",
    title: "Start Here",
    blocks: [
      { type: "paragraph", text: "Most vision boards and organizing boards fail because people try to place everything in one space, without clear delineation. Also, these goals are not kept in a position in the home that forces constant ambient interaction with your goals and plans." },
      { type: "paragraph", text: "Goals, photos, quotes, money ideas, work plans, routines, screenshots, magazine cutouts, reminders, dates, and notes all end up fighting for attention, or not top of mind at all." },
      { type: "paragraph", text: "palette plotting fixes that by giving every board a job." },
      { type: "paragraph", text: "Each board has a focus." },
      { type: "paragraph", text: "Each color has a role." },
      { type: "paragraph", text: "Each sticker, image, phrase, note, and number goes somewhere specific." },
      { type: "paragraph", text: "The result is not a random collage." },
      { type: "paragraph", text: "It is a color-coded wall system for your focus areas, your visual direction, and your next steps." },
      { type: "paragraph", text: "This guide shows you how to set up the system, choose your board colors, separate your categories, build your plan board, and reset the wall so it stays useful." },
      { type: "paragraph", text: "You can use the method for a full life rebrand, a work-from-home office setup that powers career growth, a home reset, a business launch, a personal goal, a faith goal, a style shift, a relationship category, a fitness goal, or any area of your life where you need to see change." },
      { type: "paragraph", text: "Choose your board(s), separate your categories, build your vision and execute. If you need, to start with one: you can always add more boards later." },
    ],
  },
  {
    slug: "core-setup",
    title: "The Core Setup – 4 Vision Board Rebrand",
    blocks: [
      { type: "paragraph", text: "The core palette plotting setup typically uses four boards:" },
      { type: "subheading", text: "Three Focus boards & one Plan Board" },
      { type: "paragraph", text: "These should be the main categories you want to build around. In the setup that you saw in the viral video, there were three boards: Becoming Her, Love, and Abundance. Each set to a specific color. However, you are free to choose your own categories." },
      { type: "paragraph", text: "This has the next steps, dates, tasks, deadlines, numbers, and decisions that need action." },
      { type: "paragraph", text: "The simplest version with the below categories looks like this:" },
      { type: "boardEntry", label: "Board 1: Identity", text: "Use this for your personal rebrand: style, confidence, body, routines, standards, beauty, faith, habits, and how you want to show up. Choose the name that fits your goals, even if it is just stepping into your own name and power." },
      { type: "boardEntry", label: "Board 2: Work / Money / Career", text: "Use this for income, job goals, projects, launches, clients, content, sales, business ideas, promotions, and work direction." },
      { type: "boardEntry", label: "Board 3: Love", text: "Use this for love, dating, romance, relationships, setting and maintaining standard, etc." },
      { type: "boardEntry", label: "Board 4: Plan", text: "Use this for execution: dates, next steps, deadlines, numbers, tasks, purchases, appointments, applications, follow-ups, launch notes, and anything that needs movement." },
      { type: "divider" },
      { type: "paragraph", text: "This is the default setup, not the only setup." },
      { type: "paragraph", text: "You can choose your own three focus areas. Your boards might be Work, Home, Body, and Plan. Or Faith, Family, Money, and Plan. Or Style, Business, Apartment, and Plan. The point is not to copy someone else's wall. The point is to separate the areas of your life in a way that makes sense when you look at it." },
      { type: "paragraph", text: "You are also not limited to four boards. One board can start the method. Two boards can separate focus and action. Four boards create the full wall system. More boards can work if your categories are clear and the wall still feels easy to read." },
      { type: "paragraph", text: "The rule is simple:" },
      { type: "paragraph", text: "Focus boards contain the direction with visuals and words." },
      { type: "paragraph", text: "The Plan board contains the action." },
    ],
  },
  {
    slug: "why-color-matters",
    title: "Why Color Matters",
    blocks: [
      { type: "paragraph", text: "Color is not just decoration." },
      { type: "paragraph", text: "Color helps your eye understand the system before you read a single word. It separates categories. It sets the mood of a board. It makes the wall easier to scan." },
      { type: "paragraph", text: "A color-coded setup makes each board feel assigned." },
      { type: "paragraph", text: "Instead of every goal living in one messy space, color gives each section a role:" },
      { type: "bullets", items: [
        "the board for money",
        "the board for home",
        "the board for style",
        "the board for discipline",
        "the board for calm",
        "the board for the plan",
      ] },
      { type: "paragraph", text: "You do not need to overthink the color. Choose the color that matches the job of the board, the room it will live in, or the feeling you want that category to have." },
      { type: "paragraph", text: "No color is locked to one meaning. You can use green for money, but you can also use it for health, renewal, home, plants, nature, calm, or a softer work setup. You can use black for discipline, but you can also use it for luxury, structure, boundaries, or a sharper office wall. You can use pink for love, but you can also use it for beauty, self-image, softness, visibility, or a creative rebrand." },
      { type: "paragraph", text: "The color guide gives you a starting point. Your wall can adjust from there." },
    ],
  },
  {
    slug: "color-guide",
    title: "The Color Guide",
    blocks: [{ type: "colorCards", colors: COLOR_CARDS }],
  },
  {
    slug: "build-your-board-system",
    title: "Build Your Board System",
    blocks: [
      { type: "paragraph", text: "The method works because the boards are separated by job." },
      { type: "paragraph", text: "Do not start by asking, \"What looks cute?\" Start by asking:" },
      { type: "paragraph", text: "What does this board need to do?" },
      { type: "paragraph", text: "Once the board has a job, the color and contents become easier to choose." },
      { type: "divider" },
      { type: "subheading", text: "Focus Board Examples" },
      { type: "subheading", text: "Identity / Self Board" },
      { type: "paragraph", text: "Use for style, beauty, body, confidence, faith, routines, standards, mindset, personal image, and how you want to show up." },
      { type: "paragraph", text: "Possible colors: rose gold, light pink, neon pink, black, white, yellow, clear." },
      { type: "subheading", text: "Work, Money, Career Board" },
      { type: "paragraph", text: "Use for income goals, job goals, business ideas, content plans, launches, client goals, promotion goals, savings, product ideas, and office rebrand." },
      { type: "paragraph", text: "Possible colors: green, blue, black, sky blue, orange, white, red." },
      { type: "subheading", text: "Love & Relationships Board" },
      { type: "paragraph", text: "Use for romance, dating, relationships, standards and love." },
      { type: "paragraph", text: "Possible colors: red, light pink or whatever colors are personally resonant." },
      { type: "subheading", text: "Family, Friends & Community" },
      { type: "paragraph", text: "Use for cultivation of connections with friends, family and broader support systems." },
      { type: "paragraph", text: "Possible colors: yellow, orange and blue." },
      { type: "subheading", text: "Home, Faith & Values Board" },
      { type: "paragraph", text: "If applicable to you, use for scripture, prayers, devotionals, reminders, gratitude, service goals, discipline, and spiritual focus." },
      { type: "paragraph", text: "Possible colors: white, clear, light blue, blue, gold/rose gold, green, black." },
      { type: "subheading", text: "Style & Beauty Board" },
      { type: "paragraph", text: "Use for outfits, hair, makeup, nails, perfume, skincare, shopping lists, references, silhouettes, colors, and the visual identity of your next season." },
      { type: "paragraph", text: "Possible colors: rose gold, light pink, neon pink, black, white, clear, red." },
      { type: "subheading", text: "Business & Launch Board" },
      { type: "paragraph", text: "Use for product ideas, launch plans, content hooks, sales goals, inventory, customer notes, ad ideas, creator lists, email plans, and offer testing." },
      { type: "paragraph", text: "Possible colors: orange, green, black, blue, yellow, red, white." },
      { type: "paragraph", text: "These are examples. Your three focus boards can be any three areas that need structure." },
      { type: "paragraph", text: "The plan board stays separate because action needs its own space." },
    ],
  },
  {
    slug: "what-goes-on-each-board",
    title: "What Goes on Each Board & How to Use Them",
    blocks: [
      { type: "paragraph", text: "A strong board is not just pretty images. Use a mix of board placements so the board has both direction and use." },
      { type: "subheading", text: "1. Label at the top of the board" },
      { type: "paragraph", text: "Use words to name the category." },
      { type: "paragraph", text: "This keeps the board from becoming vague." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "work", "money", "home", "discipline", "soft life", "launch", "faith", "sales", "style", "body", "rest", "office", "love", "standards", "reset", "content", "savings", "clients", "family",
      ] },
      { type: "paragraph", text: "Short labels are better than long ones. The board should be easy to scan and match the label." },
      { type: "divider" },
      { type: "subheading", text: "2. Images" },
      { type: "paragraph", text: "Use images to set the visual direction." },
      { type: "paragraph", text: "These can be:" },
      { type: "bullets", items: [
        "magazine cutouts", "screenshots", "room references", "outfit references", "product photos", "travel photos", "desk setups", "apartment references", "beauty references", "brand visuals", "photos from your own life",
      ] },
      { type: "paragraph", text: "Images help the board demonstrate the category quickly. A work board might include office references, product screenshots, income goals, brand visuals, and photos that match the kind of work you want to do." },
      { type: "divider" },
      { type: "subheading", text: "3. Statements" },
      { type: "paragraph", text: "Use short statements that make the board feel directly applicable to your life. These can be present tense or past tense." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "I follow through.",
        "I finish what I start.",
        "I am financially abundant.",
        "I am beautiful in every way.",
        "I am strong and healthy",
      ] },
      { type: "paragraph", text: "Keep statements simple but specific enough to mean something to you. Avoid filling the board with phrases that sound nice but do not change your decisions." },
      { type: "divider" },
      { type: "subheading", text: "4. Photos of Yourself" },
      { type: "paragraph", text: "Use photos of yourself when the board is about identity, style, body, beauty, career, love, confidence, or a life category you need to see yourself inside." },
      { type: "paragraph", text: "The point is not to build a wall full of strangers." },
      { type: "paragraph", text: "If the board is about your career or work directions, add a photo of your actual office." },
      { type: "paragraph", text: "If the board is about style, add a photo of yourself in an outfit you liked and wore once, but represents the style direction you want to maintain throughout the year going forward." },
      { type: "paragraph", text: "If the board is about money, add a picture of yourself holding money." },
      { type: "paragraph", text: "If the board is about body, add a photo that makes the goal feel connected to your real life—perhaps a photo of you exercising or eating your favorite healthy meal." },
      { type: "paragraph", text: "Your board gets stronger when it includes evidence that you already exist inside the direction." },
      { type: "divider" },
      { type: "subheading", text: "5. Proof" },
      { type: "paragraph", text: "Extending upon photos, proof is anything that shows motion has already started." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "a first sale", "an order screenshot", "a workout photo", "a calendar block", "a kind message", "a paid invoice", "a product sample", "a before photo", "a progress photo", "a savings screenshot", "a completed task", "a note from a hard day you got through", "a photo of the room before the reset", "a small win that belongs on the wall",
      ] },
      { type: "paragraph", text: "Proof matters because it keeps the board from becoming fantasy. It shows that the category is already active." },
      { type: "divider" },
      { type: "subheading", text: "6. Stickers and Labels" },
      { type: "paragraph", text: "Use stickers to mark categories and priorities." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "start", "stop", "buy", "book", "schedule", "next", "paid", "done", "proof", "plan", "reset", "urgent", "this week", "this month", "order", "content", "client", "home", "money", "work", "style",
      ] },
      { type: "paragraph", text: "This is where the board becomes functional." },
      { type: "paragraph", text: "The stickers are not just decoration. They separate the board into parts your eye can understand quickly." },
      { type: "divider" },
      { type: "subheading", text: "7. Dates and Numbers" },
      { type: "paragraph", text: "Use dates and numbers when a category needs a target." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "revenue goals", "savings goals", "move dates", "launch dates", "application numbers", "order goals", "content goals", "body goals", "appointment dates", "debt payoff dates", "trip dates", "follower goals", "inventory counts", "room budget",
      ] },
      { type: "paragraph", text: "A number gives the board a sharper edge." },
      { type: "divider" },
      { type: "subheading", text: "8. Action Notes" },
      { type: "paragraph", text: "Use sticky notes for the pieces that have to move next for your core categories." },
      { type: "paragraph", text: "Action notes belong mostly on the plan board." },
      { type: "paragraph", text: "If an action starts on a focus board, move it to the plan board when it becomes active." },
      { type: "divider" },
      { type: "subheading", text: "9. Put the boards where you will use them" },
      { type: "paragraph", text: "A board hidden in a corner becomes decor. A board in your line of sight becomes part of the room. Place it where you are comfortable with it being seen, however don't shy away from places outside of your bedroom or home office. Placing a well put together and aesthetically pleasing board in an area you are constantly in, forces you into indirect contact with your visions. Many customers have great success placing the boards in their living room or kitchens, in addition to placing them in their offices or bedrooms." },
      { type: "paragraph", text: "Use the wall where the category happens:" },
      { type: "bullets", items: [
        "office boards near your desk",
        "style boards near closet or vanity",
        "home boards in the room you want to change",
        "plan board where you check your day",
        "money board where you work or budget",
      ] },
      { type: "divider" },
      { type: "subheading", text: "10. Reset the boards on a consistent basis (preferably weekly or monthly)" },
      { type: "paragraph", text: "Set one day for a quick board reset. Move tasks to the plan board. Remove stale notes. Add and remove proof. Update the next step." },
      { type: "subheading", text: "Weekly Reset" },
      { type: "paragraph", text: "Use the weekly reset for small updates. This is the regular maintenance that keeps the wall useful without rebuilding everything." },
      { type: "subheading", text: "Weekly reset checklist:" },
      { type: "checklist", items: [
        "Remove anything that no longer fits.",
        "Move active tasks to the Plan Board.",
        "Add one new image, note or reference if the category changed.",
        "Add one real-life piece from the week: a sale, photo, appointment, screenshot, progress note or completed step.",
        "Update any dates, numbers or deadlines.",
        "Check the Plan Board for anything that needs to happen this week.",
        "Keep the board easy to read.",
      ] },
      { type: "paragraph", text: "A weekly reset should take 10 to 20 minutes." },
      { type: "paragraph", text: "The goal is not to make the boards perfect. The goal is to keep them useful." },
      { type: "divider" },
      { type: "subheading", text: "Monthly Reset" },
      { type: "paragraph", text: "Use the monthly reset when a board needs more than a quick update." },
      { type: "paragraph", text: "A monthly reset is for bigger changes: new goals, new categories, new colors, finished plans or a board that no longer matches the season you are in." },
      { type: "paragraph", text: "Use this reset at the beginning or end of the month." },
      { type: "subheading", text: "Monthly reset checklist:" },
      { type: "checklist", items: [
        "Look at each board and ask if the category still matters.",
        "Remove finished goals, stale images and old notes.",
        "Move unfinished tasks to the Plan Board or remove them completely.",
        "Add new references for the next month.",
        "Update money goals, dates, deadlines, appointments and numbers.",
        "Add one or two pieces that show what changed last month.",
        "Decide if a board needs a new label.",
        "Decide if the board color still fits the category.",
        "Decide if you need one board, fewer boards or more boards.",
        "Rebuild only the parts that need a real update.",
      ] },
      { type: "paragraph", text: "A monthly reset should feel like cleaning the system, not starting over." },
      { type: "divider" },
      { type: "subheading", text: "When to Change a Board Completely" },
      { type: "paragraph", text: "Change the full board when the category has changed." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "the goal is finished",
        "the room is different",
        "the project changed",
        "the relationship category changed",
        "the money target changed",
        "the board feels crowded",
        "the board no longer matches the way you want the space to look",
      ] },
      { type: "paragraph", text: "Do not keep a stale board up just because it took time to make." },
      { type: "paragraph", text: "If the board no longer matches the category, reset it." },
      { type: "divider" },
      { type: "subheading", text: "Quick Rule" },
      { type: "bullets", items: [
        "Weekly reset: small updates.",
        "Monthly reset: bigger edits.",
        "Full reset: new category, new direction or new room setup.",
      ] },
      { type: "paragraph", text: "That is the method." },
    ],
  },
  {
    slug: "more-details-on-resets",
    title: "More Details on Resets",
    blocks: [
      { type: "subheading", text: "Weekly Reset" },
      { type: "subheading", text: "Weekly reset checklist:" },
      { type: "checklist", items: [
        "Remove anything that no longer fits.",
        "Move active tasks to the Plan Board.",
        "Add one new image, note or reference if the category changed.",
        "Add one real-life piece from the week: a sale, photo, appointment, screenshot, progress note or completed step.",
        "Update any dates, numbers or deadlines.",
        "Check the Plan Board for anything that needs to happen this week.",
        "Keep the board easy to read.",
      ] },
      { type: "paragraph", text: "A weekly reset should take 10 to 20 minutes." },
      { type: "paragraph", text: "The goal is not to make the boards perfect. The goal is to keep them useful." },
      { type: "divider" },
      { type: "subheading", text: "Monthly Reset" },
      { type: "paragraph", text: "Use the monthly reset when a board needs more than a quick update." },
      { type: "paragraph", text: "A monthly reset is for bigger changes: new goals, new categories, new colors, finished plans or a board that no longer matches the season you are in." },
      { type: "paragraph", text: "Use this reset at the beginning or end of the month." },
      { type: "subheading", text: "Monthly reset checklist:" },
      { type: "checklist", items: [
        "Look at each board and ask if the category still matters.",
        "Remove finished goals, stale images and old notes.",
        "Move unfinished tasks to the Plan Board or remove them completely.",
        "Add new references for the next month.",
        "Update money goals, dates, deadlines, appointments and numbers.",
        "Add one or two pieces that show what changed last month.",
        "Decide if a board needs a new label.",
        "Decide if the board color still fits the category.",
        "Decide if you need one board, fewer boards or more boards.",
        "Rebuild only the parts that need a real update.",
      ] },
      { type: "paragraph", text: "A monthly reset should feel like cleaning the system, not starting over." },
      { type: "divider" },
      { type: "subheading", text: "When to Change a Board Completely" },
      { type: "paragraph", text: "Change the full board when the category has changed." },
      { type: "paragraph", text: "Examples:" },
      { type: "bullets", items: [
        "the goal is finished",
        "the room is different",
        "the project changed",
        "the relationship category changed",
        "the money target changed",
        "the board feels crowded",
        "the board no longer matches the way you want the space to look",
      ] },
      { type: "paragraph", text: "Do not keep a stale board up just because it took time to make." },
      { type: "paragraph", text: "If the board no longer matches the category, reset it." },
      { type: "divider" },
      { type: "subheading", text: "Quick Rule" },
      { type: "bullets", items: [
        "Weekly reset: small updates.",
        "Monthly reset: bigger edits.",
        "Full reset: new category, new direction or new room setup.",
      ] },
    ],
  },
  {
    slug: "a-note-on-the-boards",
    title: "A Note on the Boards",
    blocks: [
      { type: "paragraph", text: "You can test the method with paper, poster boards, or whatever you already have." },
      { type: "paragraph", text: "palette plotting acrylic boards bring beauty and functionality to your organizing and vision boarding experience." },
      { type: "paragraph", text: "They mount on the wall for a sense of permanence, come in multiple colors, and are made to make the system feel fun enough to use, but flexible enough to update as plans evolve." },
      { type: "paragraph", text: "Use the board color to separate categories. Use stickers to separate content in the board." },
      { type: "paragraph", text: "Use the plan board to keep the wall from becoming decoration and toward being a driver of action." },
      { type: "paragraph", text: "Standoffs included." },
      { type: "paragraph", text: "Sticker sheet included." },
      { type: "paragraph", text: "palette plotting" },
      { type: "paragraph", text: "Visualize. Organize. Lock in." },
    ],
  },
];

export function guideSectionBySlug(slug: string): GuideSection | undefined {
  return GUIDE_SECTIONS.find((section) => section.slug === slug);
}

// ---- Session tokens (stateless, HMAC-SHA256 over email+exp) ----

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createSessionToken(secret: string, email: string): Promise<string> {
  const payload = {
    email: normalizeEmail(email),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    v: 1,
  };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function readSessionEmail(secret: string, token: string): Promise<string | null> {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = await hmac(secret, payloadB64);
  if (expected.length !== sig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return normalizeEmail(payload.email);
  } catch {
    return null;
  }
}

// ---- Entitlements (via a service-role supabase-js client) ----

// deno-lint-ignore no-explicit-any
export async function hasGuideEntitlement(supabase: any, email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from("digital_entitlements")
    .select("id, expires_at, revoked_at")
    .eq("email", normalized)
    .eq("product_slug", GUIDE_PRODUCT_SLUG)
    .is("revoked_at", null);

  if (error || !data) return false;
  const now = Date.now();
  return data.some(
    (row: { expires_at: string | null }) =>
      !row.expires_at || new Date(row.expires_at).getTime() > now,
  );
}

export async function grantGuideEntitlement(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  params: { email: string; checkoutSessionId?: string | null; paymentIntentId?: string | null },
): Promise<void> {
  const email = normalizeEmail(params.email);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("digital_entitlements")
    .select("id")
    .eq("email", email)
    .eq("product_slug", GUIDE_PRODUCT_SLUG)
    .is("revoked_at", null)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from("digital_entitlements")
      .update({
        stripe_checkout_session_id: params.checkoutSessionId ?? undefined,
        stripe_payment_intent_id: params.paymentIntentId ?? undefined,
        updated_at: now,
      })
      .eq("id", existing[0].id);
    return;
  }

  await supabase.from("digital_entitlements").insert({
    email,
    product_slug: GUIDE_PRODUCT_SLUG,
    source: "stripe",
    stripe_checkout_session_id: params.checkoutSessionId ?? null,
    stripe_payment_intent_id: params.paymentIntentId ?? null,
    granted_at: now,
    updated_at: now,
  });
}

// ---- HTML renderer (server-side, inlined CSS) ----

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function swatchStyle(swatch: string): string {
  return swatch.startsWith("linear-gradient") ? `background:${swatch}` : `background-color:${swatch}`;
}

function renderBlock(block: GuideBlock): string {
  switch (block.type) {
    case "paragraph":
      return `<p class="guide-p">${escapeHtml(block.text)}</p>`;
    case "bullets":
      return `<ul class="guide-ul">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    case "checklist":
      return `<ul class="guide-checklist">${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    case "callout":
      return `<div class="guide-callout">${escapeHtml(block.text)}</div>`;
    case "divider":
      return `<hr class="guide-divider" />`;
    case "subheading":
      return `<h2 class="guide-h2">${escapeHtml(block.text)}</h2>`;
    case "boardEntry":
      return `<p class="guide-p"><strong class="guide-board-label">${escapeHtml(block.label)}</strong> — ${escapeHtml(block.text)}</p>`;
    case "colorCards":
      return `<div class="guide-color-grid">${block.colors
        .map(
          (color) => `
        <article class="guide-color-card">
          <div class="guide-color-card-head">
            <span class="guide-swatch" style="${swatchStyle(color.swatch)}" aria-hidden="true"></span>
            <div>
              <h3 class="guide-color-name">${escapeHtml(color.name)}</h3>
              <p class="guide-color-best"><span class="guide-color-label">Best for:</span> ${escapeHtml(color.bestFor)}</p>
            </div>
          </div>
          <p class="guide-color-desc">${escapeHtml(color.description)}</p>
        </article>`,
        )
        .join("")}</div>`;
    default:
      return "";
  }
}

const GUIDE_READER_CSS = `
:root{color-scheme:light;--guide-bg:#faf8f5;--guide-text:#18181b;--guide-muted:#52525b;--guide-border:#e5e5e5;--guide-card:#ffffff;--guide-max:42rem;--guide-sidebar:14rem;}
*{box-sizing:border-box;}html,body{margin:0;padding:0;}
.guide-body{background:var(--guide-bg);color:var(--guide-text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;}
.guide-shell{min-height:100vh;}
.guide-header{position:sticky;top:0;z-index:20;background:rgba(250,248,245,0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--guide-border);}
.guide-header-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;max-width:calc(var(--guide-max) + var(--guide-sidebar) + 4rem);margin:0 auto;padding:0.75rem 1rem;}
.guide-brand{color:var(--guide-text);font-size:0.95rem;font-weight:600;letter-spacing:0.01em;text-decoration:none;}
.guide-sign-out{appearance:none;border:0;background:transparent;color:var(--guide-muted);cursor:pointer;font-size:0.8125rem;font-weight:500;margin-left:auto;margin-right:0.75rem;text-decoration:none;}
.guide-sign-out:hover{color:var(--guide-text);}
.guide-toc-toggle{appearance:none;border:1px solid var(--guide-border);background:var(--guide-card);border-radius:999px;color:var(--guide-text);cursor:pointer;font-size:0.8125rem;font-weight:500;min-height:40px;padding:0 1rem;}
.guide-header-meta{max-width:calc(var(--guide-max) + var(--guide-sidebar) + 4rem);margin:0 auto;padding:0 1rem 0.75rem;}
.guide-product-title{margin:0;font-size:0.72rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--guide-muted);}
.guide-layout{display:grid;grid-template-columns:1fr;gap:0;max-width:calc(var(--guide-max) + var(--guide-sidebar) + 4rem);margin:0 auto;padding:1.5rem 1rem 3rem;}
.guide-sidebar{display:none;}
.guide-mobile-toc{margin-bottom:1.5rem;padding:1rem;background:var(--guide-card);border:1px solid var(--guide-border);border-radius:0.75rem;}
.guide-main{min-width:0;}
.guide-toc-label{margin:0 0 0.75rem;color:var(--guide-muted);font-size:0.6875rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;}
.guide-toc-list{list-style:none;margin:0;padding:0;}
.guide-toc-list li + li{margin-top:0.25rem;}
.guide-toc-link{display:block;padding:0.375rem 0;color:var(--guide-muted);font-size:0.875rem;text-decoration:none;}
.guide-toc-link:hover,.guide-toc-link.is-active{color:var(--guide-text);}
.guide-toc-link.is-active{font-weight:600;}
.guide-section{max-width:var(--guide-max);}
.guide-h1{margin:0 0 1.25rem;font-size:1.75rem;font-weight:600;letter-spacing:-0.02em;line-height:1.25;}
.guide-h2{margin:1.5rem 0 0.75rem;font-size:1.0625rem;font-weight:600;line-height:1.35;}
.guide-board-label{color:var(--guide-text);font-weight:600;}
.guide-p{margin:0 0 1rem;color:var(--guide-muted);font-size:1rem;line-height:1.7;}
.guide-ul,.guide-checklist{margin:0 0 1rem;padding-left:1.25rem;color:var(--guide-muted);}
.guide-ul li,.guide-checklist li{margin-bottom:0.375rem;line-height:1.6;}
.guide-checklist{list-style:none;padding-left:0;}
.guide-checklist li{position:relative;padding-left:1.5rem;}
.guide-checklist li::before{content:"□";position:absolute;left:0;color:var(--guide-text);}
.guide-callout{margin:1.25rem 0;padding:1rem 1.125rem;background:var(--guide-card);border:1px solid var(--guide-border);border-radius:0.75rem;color:var(--guide-text);font-size:0.9375rem;line-height:1.6;}
.guide-divider{border:0;border-top:1px solid var(--guide-border);margin:1.75rem 0;}
.guide-color-grid{display:grid;gap:0.75rem;}
.guide-color-card{padding:1rem;background:var(--guide-card);border:1px solid var(--guide-border);border-radius:0.75rem;}
.guide-color-card-head{display:flex;gap:0.75rem;align-items:flex-start;}
.guide-swatch{width:2rem;height:2rem;border-radius:999px;border:1px solid var(--guide-border);flex-shrink:0;}
.guide-color-name{margin:0;font-size:1rem;font-weight:600;}
.guide-color-best{margin:0.25rem 0 0;color:var(--guide-muted);font-size:0.875rem;line-height:1.5;}
.guide-color-label{color:var(--guide-text);font-weight:600;}
.guide-color-desc{margin:0.75rem 0 0;color:var(--guide-muted);font-size:0.9375rem;line-height:1.6;}
.guide-prev-next{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--guide-border);}
.guide-nav-btn{display:flex;align-items:center;min-height:44px;padding:0.75rem 1rem;background:var(--guide-card);border:1px solid var(--guide-border);border-radius:0.75rem;color:var(--guide-text);font-size:0.8125rem;font-weight:500;text-decoration:none;}
.guide-nav-prev{justify-content:flex-start;}
.guide-nav-next{justify-content:flex-end;}
.guide-nav-spacer{display:block;}
@media (min-width:900px){.guide-toc-toggle,.guide-mobile-toc{display:none;}.guide-layout{grid-template-columns:var(--guide-sidebar) minmax(0,1fr);gap:2.5rem;}.guide-sidebar{display:block;position:sticky;top:6.5rem;align-self:start;}}
`;

function sectionHref(readerBase: string, slug: string, token: string): string {
  const params = new URLSearchParams({ section: slug, token });
  return `${readerBase}?${params.toString()}`;
}

function renderToc(readerBase: string, token: string, activeSlug: string): string {
  return `<nav class="guide-toc" aria-label="Table of contents">
    <p class="guide-toc-label">Sections</p>
    <ol class="guide-toc-list">
      ${GUIDE_SECTIONS.map(
        (section) =>
          `<li><a class="guide-toc-link${section.slug === activeSlug ? " is-active" : ""}" href="${sectionHref(readerBase, section.slug, token)}">${escapeHtml(section.title)}</a></li>`,
      ).join("")}
    </ol>
  </nav>`;
}

function renderPrevNext(readerBase: string, token: string, section: GuideSection): string {
  const index = GUIDE_SECTIONS.findIndex((item) => item.slug === section.slug);
  const prev = index > 0 ? GUIDE_SECTIONS[index - 1] : null;
  const next = index < GUIDE_SECTIONS.length - 1 ? GUIDE_SECTIONS[index + 1] : null;
  return `<nav class="guide-prev-next" aria-label="Section navigation">
    ${prev ? `<a class="guide-nav-btn guide-nav-prev" href="${sectionHref(readerBase, prev.slug, token)}">← ${escapeHtml(prev.title)}</a>` : `<span class="guide-nav-spacer"></span>`}
    ${next ? `<a class="guide-nav-btn guide-nav-next" href="${sectionHref(readerBase, next.slug, token)}">${escapeHtml(next.title)} →</a>` : `<span class="guide-nav-spacer"></span>`}
  </nav>`;
}

export function renderGuideReaderPage(
  section: GuideSection,
  opts: { readerBase: string; token: string; homeOrigin: string },
): string {
  const body = section.blocks.map(renderBlock).join("\n");
  const toc = renderToc(opts.readerBase, opts.token, section.slug);
  const prevNext = renderPrevNext(opts.readerBase, opts.token, section);
  const signOutHref = `${opts.homeOrigin}/palette-plotting-guide?signout=1`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(section.title)} · ${escapeHtml(GUIDE_PRODUCT_TITLE)}</title>
  <style>${GUIDE_READER_CSS}</style>
</head>
<body class="guide-body">
  <div class="guide-shell">
    <header class="guide-header">
      <div class="guide-header-inner">
        <a class="guide-brand" href="${escapeHtml(opts.homeOrigin)}/">palette plotting</a>
        <a class="guide-sign-out" href="${escapeHtml(signOutHref)}">Sign out</a>
        <button type="button" class="guide-toc-toggle" id="guide-toc-toggle" aria-expanded="false" aria-controls="guide-mobile-toc">Sections</button>
      </div>
      <div class="guide-header-meta">
        <p class="guide-product-title">palette plotting Guide</p>
      </div>
    </header>
    <div class="guide-layout">
      <aside class="guide-sidebar">${toc}</aside>
      <div class="guide-mobile-toc" id="guide-mobile-toc" hidden>${toc}</div>
      <main class="guide-main">
        <article class="guide-section">
          <h1 class="guide-h1">${escapeHtml(section.title)}</h1>
          <div class="guide-content">${body}</div>
        </article>
        ${prevNext}
      </main>
    </div>
  </div>
  <script>
    (function () {
      var toggle = document.getElementById("guide-toc-toggle");
      var panel = document.getElementById("guide-mobile-toc");
      if (!toggle || !panel) return;
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });
    })();
  </script>
</body>
</html>`;
}
