/** Shown on marketing footer and Contact page (same as primary support inbox). */
export const MARKETING_SUPPORT_EMAIL = "support@paletteplot.com";

export const MARKETING_SMS_E164 = "+17085547041";
export const MARKETING_SMS_DISPLAY = "(708) 554-7041";

export const plottingSmsBody =
  "Hi Palette Plotting —\n\nWhat I'm building toward:\n\nWhat keeps pulling me off track:\n\nBoard focus (vision / home / office / mood):\n";

export const plottingSmsHref = `sms:${MARKETING_SMS_E164}?body=${encodeURIComponent(plottingSmsBody)}`;
