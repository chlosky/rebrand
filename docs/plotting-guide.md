# Plotting Guide (copy + code)

This file is meant to be handed to ChatGPT as a **single markdown artifact**.

## Copy (Guide: `life-rebrand-starter`)

**Title:** The quiet rebrand  
**Tagline:** Plot the new you before you announce her.  
**Read time:** 7 min

### Blocks (as rendered by `LibraryReader`)

**Paragraph**

A rebrand is not a personality transplant. It is deciding which version of you gets the front row — then building a private room where that version stops being theoretical.

**Callout**

Rule one: nobody has to know you are rebranding until the plot is too obvious to ignore.

**Subheading**

How this connects to the board system

**Paragraph**

Palette Plotting separates your wall into jobs — three focus boards for the life you are stepping into, plus one plan board for what you actually do this week. You do not need the full setup today. You need to know why the split matters.

**Board entries**

- **Focus board** — Images, phrases, and vibes for one lane of your rebrand — identity, money, love, home, whatever season you are in.
- **Plan board** — Dates, numbers, to-dos, and the next move. The part most vision boards skip.

---

## Code (guide object excerpt)

```ts
// Source: src/pages/workspace/freeLibraryGuides.ts
// NOTE: This is only the start of the guide object; the full `blocks` list continues in that file.
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
    // ... the rest of `blocks` are in the repo file ...
  ],
}
``

