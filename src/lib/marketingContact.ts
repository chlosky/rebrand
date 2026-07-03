/** Shown on marketing footer and Contact page (same as primary support inbox). */
export const MARKETING_SUPPORT_EMAIL = "support@paletteplot.com";

export const MARKETING_SMS_E164 = "+17085547041";
export const MARKETING_SMS_DISPLAY = "(708) 554-7041";

export const manifestSmsBody =
  "Hi Palette Plotting —\n\nWhat I'm manifesting:\n\nWhat thought keeps making me waver:\n\nNatural or intense affirmations (pick one):\n";

export const manifestSmsHref = `sms:${MARKETING_SMS_E164}?body=${encodeURIComponent(manifestSmsBody)}`;
