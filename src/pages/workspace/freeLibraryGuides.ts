export type LibraryBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "callout"; text: string }
  | { type: "divider" }
  | { type: "bullets"; items: string[] }
  | { type: "checklist"; items: string[] }
  | { type: "boardEntry"; label: string; text: string }
  | { type: "textLink"; label: string; href: string };

export type LibrarySection = {
  slug: string;
  title: string;
  blocks: LibraryBlock[];
};

export type FreeLibraryGuide = {
  slug: string;
  title: string;
  subtitle: string;
  sections: LibrarySection[];
};

const FULL_GUIDE_HREF = "/palette-plotting-guide";

export const FREE_LIBRARY_GUIDES: FreeLibraryGuide[] = [
  {
    slug: "life-rebrand",
    title: "Rebrand Your Life",
    subtitle: "A short starter reader for vision boards, life plotting and The Plan.",
    sections: [
      {
        slug: "start-here",
        title: "Start Here",
        blocks: [
          { type: "paragraph", text: "A life rebrand gets easier when the pieces have a place to go. Images, notes, dates, goals, habits, screenshots and reminders should not all fight for attention in one crowded space." },
          { type: "paragraph", text: "Palette Plotting starts with a simple split: focus areas hold the direction. The Plan holds the action." },
          { type: "paragraph", text: "Use this reader to set up your first life plotting workspace, choose your focus areas, add visuals and move the active pieces into The Plan." },
          { type: "bullets", items: [
            "Choose up to three focus areas.",
            "Give each area a clear visual role.",
            "Use The Plan for dates, goals, next steps and reminders.",
            "Reset the workspace weekly so it stays current.",
          ] },
        ],
      },
      {
        slug: "choose-focus-areas",
        title: "Choose Your Focus Areas",
        blocks: [
          { type: "paragraph", text: "Start with the areas that need the most visibility. Three is enough for a strong setup. One is enough for a focused start." },
          { type: "boardEntry", label: "Self & Direction", text: "Use this for confidence, standards, style, faith, discipline, routines, beauty, wellness and personal direction." },
          { type: "boardEntry", label: "Career & Money", text: "Use this for income goals, work plans, business ideas, content, launches, clients, promotions and savings." },
          { type: "boardEntry", label: "Love & Relationships", text: "Use this for dating, romance, relationships, family, friendship, standards and connection." },
          { type: "boardEntry", label: "Home & Space", text: "Use this for apartments, rooms, organization, furniture, routines, cleaning, moves and home upgrades." },
          { type: "boardEntry", label: "Beauty & Wellness", text: "Use this for hair, skincare, outfits, body care, rest, appointments, shopping lists and visual style." },
          { type: "boardEntry", label: "Organization & Plan", text: "Use this for calendars, checklists, recurring tasks, deadlines, weekly plans and life admin." },
        ],
      },
      {
        slug: "set-the-visual-direction",
        title: "Set the Visual Direction",
        blocks: [
          { type: "paragraph", text: "Each focus area should be easy to read at a glance. Keep the label short, choose a color role and add visuals that match the category." },
          { type: "subheading", text: "What to add" },
          { type: "bullets", items: [
            "A short label at the top of the board.",
            "Images that show the category quickly.",
            "Photos from your own life when the board is personal.",
            "Short statements that feel direct and usable.",
            "Numbers for savings, dates, deadlines, orders, content or targets.",
            "Proof pieces like screenshots, invoices, photos, calendar blocks or completed steps.",
          ] },
          { type: "paragraph", text: "The strongest boards mix direction and evidence. Add the look, then add the real pieces that show movement." },
        ],
      },
      {
        slug: "build-the-plan",
        title: "Build The Plan",
        blocks: [
          { type: "paragraph", text: "The Plan is where the active pieces go. A focus area can hold the direction, but the next step needs a place with dates, reminders and action notes." },
          { type: "checklist", items: [
            "Add one next step for each focus area.",
            "Add the date or deadline if one exists.",
            "Add the number if the goal has a target.",
            "Mark anything that needs a reminder.",
            "Move finished items out of the active plan.",
          ] },
          { type: "paragraph", text: "Keep The Plan simple enough to check quickly. The goal is a workspace that helps you see what matters next." },
        ],
      },
      {
        slug: "weekly-reset",
        title: "The Weekly Reset",
        blocks: [
          { type: "paragraph", text: "Set one short reset each week. Ten to twenty minutes is enough." },
          { type: "checklist", items: [
            "Remove stale notes.",
            "Add one new piece of proof.",
            "Move active tasks into The Plan.",
            "Update dates, numbers and reminders.",
            "Keep each focus area easy to scan.",
          ] },
          { type: "paragraph", text: "The full guide goes deeper into color roles, board layouts, weekly resets, monthly resets and the complete four-board method." },
          { type: "textLink", label: "Get the full Palette Plotting Guide", href: FULL_GUIDE_HREF },
        ],
      },
    ],
  },

  {
    slug: "office-optimization",
    title: "Optimize Your Workstreams in New Ways",
    subtitle: "A short reader for project boards, planning structures and work that needs a better visual system.",
    sections: [
      {
        slug: "start-here",
        title: "Start Here",
        blocks: [
          { type: "paragraph", text: "Work gets easier to manage when the moving pieces are visible. A visual workspace helps you see what is active, blocked, waiting, due or ready to close." },
          { type: "paragraph", text: "Use this reader to choose a project structure, map the workstream and move the next steps into The Plan." },
          { type: "bullets", items: [
            "Use Kanban for task flow.",
            "Use a timeline for dates and phases.",
            "Use a priority grid for decisions.",
            "Use OKRs for goals and measurable results.",
            "Use 5S for a workspace, process or file reset.",
          ] },
        ],
      },
      {
        slug: "choose-a-structure",
        title: "Choose a Structure",
        blocks: [
          { type: "paragraph", text: "Start with the structure that matches the work. The structure gives the board a job before you add tasks, notes or files." },
          { type: "boardEntry", label: "Kanban", text: "Best for moving tasks from To Do to Done. Use it for content calendars, client work, product tasks, admin, schoolwork or team projects." },
          { type: "boardEntry", label: "Timeline", text: "Best for dates, phases and deadlines. Use it for launches, campaigns, hiring, events, deliverables or multi-step projects." },
          { type: "boardEntry", label: "Priority grid", text: "Best for sorting decisions. Use it when too many tasks feel equally important." },
          { type: "boardEntry", label: "OKRs", text: "Best for tying goals to measurable results. Use it for quarterly work, business goals, team priorities or personal performance goals." },
          { type: "boardEntry", label: "5S reset", text: "Best for organizing a workspace, file system, process, desk, studio, storage area or operations flow." },
        ],
      },
      {
        slug: "map-the-workstream",
        title: "Map the Workstream",
        blocks: [
          { type: "paragraph", text: "A workstream board should show how work enters, moves and finishes. Keep the categories simple so the board reads quickly." },
          { type: "subheading", text: "Useful labels" },
          { type: "bullets", items: [
            "Intake",
            "To Do",
            "In Progress",
            "Waiting",
            "Blocked",
            "Review",
            "Done",
            "Decisions",
            "Risks",
            "Next meeting",
          ] },
          { type: "paragraph", text: "Add owners, due dates and decisions where needed. Move active work into The Plan when it needs a reminder or a calendar date." },
        ],
      },
      {
        slug: "build-the-plan",
        title: "Build The Plan",
        blocks: [
          { type: "paragraph", text: "Use The Plan as the action layer. The board can show the whole project. The Plan should show what needs movement now." },
          { type: "checklist", items: [
            "Add the next three actions.",
            "Add deadlines and meeting dates.",
            "Mark blockers that need a decision.",
            "Add reminders for follow-ups.",
            "Update status after each work session.",
          ] },
          { type: "paragraph", text: "A good workstream setup reduces the time spent remembering and re-sorting. The board should make the status obvious." },
        ],
      },
      {
        slug: "weekly-workstream-reset",
        title: "Weekly Workstream Reset",
        blocks: [
          { type: "paragraph", text: "Use a weekly reset to keep the system current before the work piles up." },
          { type: "checklist", items: [
            "Archive finished tasks.",
            "Move stale tasks out of active status.",
            "Add new deadlines.",
            "Update blocked items.",
            "Choose the first action for the next work session.",
            "Check The Plan for reminders and follow-ups.",
          ] },
          { type: "paragraph", text: "Keep the structure light. The point is not more management. The point is a better view of the work." },
        ],
      },
    ],
  },

  {
    slug: "home-organization",
    title: "Build an Organized Home, While Juggling Everything",
    subtitle: "A short reader for home routines, chores, meals, family planning and seasonal resets.",
    sections: [
      {
        slug: "start-here",
        title: "Start Here",
        blocks: [
          { type: "paragraph", text: "A home system works best when the plan is visible. Routines, chores, meals, shopping, family schedules and reset projects all need a place to land." },
          { type: "paragraph", text: "Use this reader to choose a home focus, map the pieces and set up a workspace that supports the week." },
          { type: "bullets", items: [
            "Choose the home area with the most moving parts.",
            "Add the recurring tasks.",
            "Add the dates, supplies and reminders.",
            "Use The Plan for the pieces that need action.",
          ] },
        ],
      },
      {
        slug: "choose-your-home-focus",
        title: "Choose Your Home Focus",
        blocks: [
          { type: "boardEntry", label: "Home plan & routines", text: "Use this for morning routines, evening routines, household rhythm, weekly reset days and repeat tasks." },
          { type: "boardEntry", label: "Chores & cleaning", text: "Use this for zones, cleaning lists, supplies, chore assignments and room-by-room resets." },
          { type: "boardEntry", label: "Meal planning", text: "Use this for menus, grocery lists, meal prep, pantry notes and kitchen rhythm." },
          { type: "boardEntry", label: "Family & kids", text: "Use this for schedules, school dates, activities, appointments, reminders and household coordination." },
          { type: "boardEntry", label: "Seasonal reset", text: "Use this for decluttering, holiday planning, decorating, storage, moves, guests or room updates." },
        ],
      },
      {
        slug: "build-the-home-map",
        title: "Build the Home Map",
        blocks: [
          { type: "paragraph", text: "Start with zones. A zone can be a room, a routine, a chore category or a family need." },
          { type: "subheading", text: "Useful home labels" },
          { type: "bullets", items: [
            "Kitchen",
            "Laundry",
            "Entryway",
            "Bathrooms",
            "Bedrooms",
            "Kids",
            "Meals",
            "Groceries",
            "This week",
            "Reset day",
            "Supplies",
            "Appointments",
          ] },
          { type: "paragraph", text: "Use images for rooms, inspiration and storage ideas. Use notes for supplies, dates, tasks and recurring needs." },
        ],
      },
      {
        slug: "make-it-work-during-the-week",
        title: "Make It Work During the Week",
        blocks: [
          { type: "paragraph", text: "A home plan should make the next step easy to find. Keep the active list short and move real tasks into The Plan." },
          { type: "checklist", items: [
            "Add the meals for the next few days.",
            "Add groceries or supplies before they run out.",
            "Add appointments and school dates.",
            "Assign chores or zones if other people are involved.",
            "Add reminders for anything time-sensitive.",
          ] },
          { type: "paragraph", text: "The visual space can hold the bigger picture. The Plan should hold the actions that keep the household moving." },
        ],
      },
      {
        slug: "weekly-home-reset",
        title: "Weekly Home Reset",
        blocks: [
          { type: "paragraph", text: "Pick one day for a quick home reset. The goal is a usable system for the week ahead." },
          { type: "checklist", items: [
            "Clear finished tasks.",
            "Update meals and groceries.",
            "Check the calendar.",
            "Choose the top home priority.",
            "Add supplies, appointments and errands.",
            "Move active tasks into The Plan.",
          ] },
          { type: "paragraph", text: "The home workspace should help the week feel less scattered. Keep it simple enough to update often." },
        ],
      },
    ],
  },

  {
    slug: "moodboarding",
    title: "How to Start Moodboarding for a Living or at Least for Fun",
    subtitle: "A short reader for moodboards, references, creative direction and visual briefs.",
    sections: [
      {
        slug: "start-here",
        title: "Start Here",
        blocks: [
          { type: "paragraph", text: "A moodboard is more than a group of pretty images. A strong moodboard gives a visual idea enough structure to explain itself." },
          { type: "paragraph", text: "Use this reader to build a moodboard with a purpose, choose references, organize the direction and present the final board clearly." },
          { type: "bullets", items: [
            "Choose the purpose of the board.",
            "Collect images with a clear role.",
            "Add notes for color, texture, styling, layout or mood.",
            "Use The Plan for sourcing, shopping, production or next steps.",
          ] },
        ],
      },
      {
        slug: "choose-the-brief",
        title: "Choose the Brief",
        blocks: [
          { type: "paragraph", text: "Start with the use case. The board should answer a specific visual question." },
          { type: "boardEntry", label: "Aesthetics & style", text: "Use this for outfits, beauty, hair, nails, personal style, shopping, silhouettes and color direction." },
          { type: "boardEntry", label: "Interiors & space", text: "Use this for rooms, furniture, materials, lighting, layouts, decor and renovation references." },
          { type: "boardEntry", label: "Travel", text: "Use this for hotels, restaurants, outfits, locations, activities, packing and trip tone." },
          { type: "boardEntry", label: "Events", text: "Use this for weddings, birthdays, dinners, launches, parties, sets, florals, tablescapes and guest experience." },
          { type: "boardEntry", label: "Brand & creative", text: "Use this for logos, typography, campaign direction, colors, packaging, photography and social content." },
        ],
      },
      {
        slug: "build-the-board",
        title: "Build the Board",
        blocks: [
          { type: "paragraph", text: "Build the board in layers. Give each image a reason to be there." },
          { type: "subheading", text: "Useful moodboard layers" },
          { type: "bullets", items: [
            "Hero image",
            "Color palette",
            "Texture or material references",
            "Styling references",
            "Layout references",
            "Product or sourcing notes",
            "Words that define the direction",
            "Images to avoid, stored separately if useful",
          ] },
          { type: "paragraph", text: "A good board should make the direction feel obvious without a long explanation." },
        ],
      },
      {
        slug: "for-fun-or-for-work",
        title: "For Fun or for Work",
        blocks: [
          { type: "paragraph", text: "Moodboarding can stay personal, or it can become a service. The difference is the brief, the edit and the final presentation." },
          { type: "subheading", text: "For fun" },
          { type: "bullets", items: [
            "Create style boards for outfits, rooms, trips or events.",
            "Use boards before shopping or booking.",
            "Save references in one place instead of scattered screenshots.",
            "Update the board when the taste or plan changes.",
          ] },
          { type: "subheading", text: "For work" },
          { type: "bullets", items: [
            "Create sample boards for a portfolio.",
            "Pick one niche: interiors, events, brand, travel, fashion or content.",
            "Show before-and-after direction when possible.",
            "Turn the board into a PDF, client link or presentation.",
            "Use The Plan for sourcing, deadlines, deliverables and follow-ups.",
          ] },
        ],
      },
      {
        slug: "present-the-board",
        title: "Present the Board",
        blocks: [
          { type: "paragraph", text: "A finished moodboard should have a clear title, a short purpose and a clean visual order." },
          { type: "checklist", items: [
            "Name the board.",
            "Add one sentence about the purpose.",
            "Keep the strongest images largest.",
            "Group similar references together.",
            "Add notes only where they help.",
            "Export or share the board in a format that fits the use case.",
          ] },
          { type: "paragraph", text: "For client work, keep the board easy to review. For personal use, keep it easy to update." },
        ],
      },
    ],
  },
];

export function getFreeLibraryGuide(slug: string): FreeLibraryGuide | undefined {
  return FREE_LIBRARY_GUIDES.find((guide) => guide.slug === slug);
}
