export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeSmsReminder(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatReminderTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function sendBrevoReminderEmail(input: {
  to: string;
  actionTitle: string;
  focusTitle?: string | null;
  planTitle?: string | null;
  remindAt?: string | null;
  details?: string | null;
  reminderId: string;
}): Promise<{ ok: boolean; statusCode?: number; messageId?: string | null; error?: string }> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const fromEmail = Deno.env.get("BREVO_REMINDER_FROM_EMAIL");
  if (!apiKey || !fromEmail) {
    return { ok: false, error: "Brevo email not configured" };
  }

  const cleanTitle = input.actionTitle.trim();
  const subject = cleanTitle.length <= 70 ? `Reminder: ${cleanTitle}` : cleanTitle.slice(0, 120);
  const whenLine = input.remindAt ? formatReminderTime(input.remindAt) : null;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#171717">
      <h1 style="font-size:18px;margin:0 0 12px">${escapeHtml(cleanTitle)}</h1>
      ${input.focusTitle ? `<p><strong>Focus:</strong> ${escapeHtml(input.focusTitle)}</p>` : ""}
      ${input.planTitle ? `<p><strong>Plan:</strong> ${escapeHtml(input.planTitle)}</p>` : ""}
      ${whenLine ? `<p><strong>When:</strong> ${escapeHtml(whenLine)}</p>` : ""}
      ${input.details ? `<p>${escapeHtml(input.details)}</p>` : ""}
      <p style="font-size:12px;color:#666;margin-top:20px">You created this reminder in Palette Plotting.</p>
    </div>
  `;

  const textContent = [
    cleanTitle,
    input.focusTitle ? `Focus: ${input.focusTitle}` : "",
    input.planTitle ? `Plan: ${input.planTitle}` : "",
    whenLine ? `When: ${whenLine}` : "",
    input.details || "",
    "You created this reminder in Palette Plotting.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: Deno.env.get("BREVO_REMINDER_FROM_NAME") || "Palette Plot Reminders",
        email: fromEmail,
      },
      to: [{ email: input.to }],
      subject,
      htmlContent,
      textContent,
      tags: ["palette_plan_reminder"],
      headers: {
        "X-Palette-Reminder-Id": input.reminderId,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      statusCode: res.status,
      error: (data as { message?: string })?.message || JSON.stringify(data),
    };
  }

  return { ok: true, messageId: (data as { messageId?: string })?.messageId ?? null };
}

export async function sendBrevoReminderSms(input: {
  to: string;
  smsText?: string | null;
  actionTitle: string;
  reminderId: string;
}): Promise<{ ok: boolean; statusCode?: number; messageId?: string | null; error?: string }> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "Brevo SMS not configured" };
  }

  const content = sanitizeSmsReminder(input.smsText || input.actionTitle);
  if (!content) return { ok: false, error: "SMS reminder text is required." };
  if (content.length > 70) return { ok: false, error: "Text reminders must be 70 characters or less." };
  if (/https?:\/\//i.test(content)) return { ok: false, error: "Text reminders cannot include links." };

  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: Deno.env.get("BREVO_SMS_SENDER") || "Palette",
      recipient: input.to,
      content,
      type: "transactional",
      tag: "palette_plan_reminder",
      unicodeEnabled: false,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      statusCode: res.status,
      error: (data as { message?: string })?.message || JSON.stringify(data),
    };
  }

  return { ok: true, messageId: (data as { messageId?: string })?.messageId ?? null };
}
