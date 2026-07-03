import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesRoot = path.join(__dirname, "../../src/i18n/locales");
const locales = ["pt-BR", "es-419"];
const files = [
  "common",
  "dashboard",
  "onboarding",
  "settings",
  "auth",
  "paywall",
  "tools",
  "support",
  "marketing",
];

const sectionTitles = {
  en: {
    common: "Common — shared buttons & labels",
    dashboard: "Dashboard & navigation",
    onboarding: "Onboarding & setup funnel",
    settings: "Settings & manifestation routine",
    auth: "Sign in, password reset & activation",
    paywall: "Paywall & post-purchase",
    tools: "App tools",
    support: "Report issue & support inbox",
    marketing: "FAQ, contact & pricing",
  },
  "pt-BR": {
    common: "Comum — botões e rótulos compartilhados",
    dashboard: "Painel e navegação",
    onboarding: "Onboarding e fluxo de configuração",
    settings: "Configurações e rotina de manifestação",
    auth: "Entrar, redefinição de senha e ativação",
    paywall: "Paywall e pós-compra",
    tools: "Ferramentas do app",
    support: "Relatar problema e caixa de suporte",
    marketing: "FAQ, contato e preços",
  },
  "es-419": {
    common: "Common — shared buttons & labels",
    dashboard: "Dashboard & navigation",
    onboarding: "Onboarding & setup funnel",
    settings: "Settings & manifestation routine",
    auth: "Sign in, password reset & activation",
    paywall: "Paywall & post-purchase",
    tools: "App tools",
    support: "Report issue & support inbox",
    marketing: "FAQ, contact & pricing",
  },
};

function flatten(obj, prefix = "", out = []) {
  if (obj === null || obj === undefined) return out;
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    out.push({ key: prefix, value: String(obj) });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      const line = i + 1;
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        out.push({
          key: prefix ? `${prefix} (line ${line})` : `(line ${line})`,
          value: String(item),
        });
      } else if (item && typeof item === "object") {
        flatten(item, prefix ? `${prefix} (line ${line})` : `(line ${line})`, out);
      }
    });
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix} > ${k}` : k;
      flatten(v, next, out);
    }
  }
  return out;
}

function loadLocale(locale) {
  const sections = [];
  const allStrings = [];
  for (const file of files) {
    const p = path.join(localesRoot, locale, `${file}.json`);
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const flat = flatten(data);
    sections.push({ file, title: sectionTitles[locale][file], flat });
    allStrings.push(...flat.map((f) => f.value));
  }
  return { sections, allStrings };
}

function renderLocale(locale, meta) {
  const lines = [];
  if (locale === "pt-BR") {
    lines.push("# Português (Brasil, pt-BR)");
    lines.push("");
    lines.push(
      "Todas as strings visíveis para o usuário enviadas em **pt-BR**. Revise e edite apenas este texto — não o código-fonte.",
    );
  } else {
    lines.push("# Español (Latinoamérica, es-419)");
    lines.push("");
    lines.push(
      "Every user-visible string shipped for **es-419**. Review and edit this copy only — not source code.",
    );
  }
  lines.push("");
  lines.push(
    `Gerado a partir dos arquivos de locale em \`src/i18n/locales/${locale}/\`. **Apenas texto** — sem código. Placeholders como {{name}} aparecem exatamente como na interface.`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  for (const sec of meta.sections) {
    lines.push(`## ${sec.title}`);
    lines.push("");
    for (const row of sec.flat) {
      lines.push(`- **${row.key}:** ${row.value}`);
    }
    lines.push("");
  }
  return { lines, count: meta.allStrings.length };
}

const pushCopy = {
  en: {
    routine: {
      heading: "Time to manifest!",
      subtitle: "Get back into the app to do your manifesting routine.",
      body: "Your dreams are waiting. Let's return to your manifesting practice now.",
    },
    support: "We replied to your help request.",
  },
  "pt-BR": {
    routine: {
      heading: "Hora de manifestar!",
      subtitle: "Volte ao app para fazer sua rotina de manifestação.",
      body: "Seus sonhos estão esperando. Vamos voltar à sua prática de manifestação agora.",
    },
    support: "Respondemos à sua solicitação de ajuda.",
  },
  "es-419": {
    routine: {
      heading: "¡Es hora de manifestar!",
      subtitle: "Vuelve a la app para hacer tu rutina de manifestación.",
      body: "Tus sueños te esperan. Volvamos a tu práctica de manifestación ahora.",
    },
    support: "Respondimos a tu solicitud de ayuda.",
  },
};

function renderTail(locale) {
  const lines = [];
  const pc = pushCopy[locale];
  lines.push(
    `## ${locale === "pt-BR" ? "Notificações push (enviadas pelo servidor)" : "Push notifications (server-sent)"}`,
  );
  lines.push("");
  lines.push(
    `### ${locale === "pt-BR" ? "Lembrete de rotina de manifestação" : "Manifestation routine reminder"}`,
  );
  lines.push("");
  lines.push(
    `- **${locale === "pt-BR" ? "Título da notificação" : "Notification title"}:** ${pc.routine.heading}`,
  );
  lines.push(
    `- **${locale === "pt-BR" ? "Subtítulo da notificação" : "Notification subtitle"}:** ${pc.routine.subtitle}`,
  );
  lines.push(
    `- **${locale === "pt-BR" ? "Corpo da notificação" : "Notification body"}:** ${pc.routine.body}`,
  );
  lines.push("");
  lines.push(`### ${locale === "pt-BR" ? "Resposta a pedido de ajuda" : "Support request reply"}`);
  lines.push("");
  lines.push(
    `- **${locale === "pt-BR" ? "Corpo da notificação" : "Notification body"}:** ${pc.support}`,
  );
  lines.push(
    `- **${locale === "pt-BR" ? "Nome do app no cabeçalho (todos os idiomas)" : "App name in header (all locales)"}:** Palette Plotting`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    `## ${locale === "pt-BR" ? "Alternador de idioma (sempre exibido nestas formas)" : "Language switcher (always shown in these forms)"}`,
  );
  lines.push("");
  lines.push(
    locale === "pt-BR"
      ? "Na tela de boas-vindas e em Configurações, os nomes dos idiomas **não** são traduzidos:"
      : "On welcome and Settings, language names are **not** translated:",
  );
  lines.push("");
  lines.push("- English");
  lines.push("- Español");
  lines.push("- Português");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    `## ${locale === "pt-BR" ? "Superfícies apenas em inglês (o usuário ainda pode ver)" : "English-only surfaces (user may still see)"}`,
  );
  lines.push("");
  if (locale === "pt-BR") {
    lines.push(
      "Estes itens **não** estão neste arquivo de locale; os usuários ainda podem ver inglês em:",
    );
    lines.push("");
    lines.push(
      "- Texto completo de Terms of Service, Privacy Policy, EULA, DMCA, Billing & Refunds e Acceptable Use (páginas legais)",
    );
    lines.push(
      "- Paywall nativo do RevenueCat e tela de pagamento web (configurados no painel do RevenueCat)",
    );
    lines.push("- Posts do blog e páginas longas de marketing que não foram ligadas ao i18n");
    lines.push(
      "- Conteúdo gerado pelo usuário (texto de afirmações, mensagens de chat, entradas do diário)",
    );
    lines.push("- Nomes dos personagens no chat: River, Sage, Rose, Oliver");
    lines.push(
      "- Mensagens de erro do Supabase/auth ou do provedor de pagamento retornadas literalmente pelo servidor",
    );
    lines.push("- Aviso da aba legal em Configurações (localizado): ver seção Comum acima");
  } else {
    lines.push("These items are **not** in locale files; users may still see English for:");
    lines.push("");
    lines.push(
      "- Full Terms of Service, Privacy Policy, EULA, DMCA, Billing & Refunds, and Acceptable Use legal pages",
    );
    lines.push("- Native RevenueCat paywall and web checkout (configured in RevenueCat dashboard)");
    lines.push("- Blog posts and long marketing pages not wired to i18n");
    lines.push("- User-generated content (affirmation text, chat messages, journal entries)");
    lines.push("- Chat character names: River, Sage, Rose, Oliver");
    lines.push(
      "- Supabase/auth or payment-provider error messages returned verbatim from the server",
    );
    lines.push("- Settings legal-tab disclaimer (localized): see Common section above");
  }
  return lines;
}

function renderTrilingual(enMeta, ptMeta, esMeta) {
  const lines = [];
  lines.push("# Palette Plotting app copy — en (reference) · pt-BR · es-419");
  lines.push("");
  lines.push(
    "**Status:** All three locales are wired in production (`src/i18n/locales/en/`, `pt-BR/`, `es-419/`). Regenerated from runtime JSON so this matches what users see.",
  );
  lines.push("");
  lines.push(`**Last synced:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("## For ChatGPT");
  lines.push("");
  lines.push(
    "**English (`en`) is the reference copy.** Use it to judge meaning, tone, and length. Propose edits to **pt-BR** and **es-419** only unless English itself is wrong.",
  );
  lines.push("");
  lines.push("### Default rules (unless you override in your prompt)");
  lines.push("");
  lines.push("- **Do not** change i18n keys, namespaces, or JSON structure — copy only");
  lines.push("- **Keep placeholders exactly:** `{{name}}`, `{{pct}}`, `{{limit}}`, `{{year}}`, etc.");
  lines.push(
    "- **Keep product terms:** Scripting, Tap-in, SP (specific person), Palette Plotting, River, Sage, Rose, Oliver",
  );
  lines.push(
    "- **es-419 settings nav:** **Ajustes** — intentional; do not switch globally to Configuración",
  );
  lines.push("- **Language switcher labels (never translate):** English · Español · Português");
  lines.push(
    "- **pt-BR optional polish (non-blocker):** some toasts use “Falha ao…” vs “Não foi possível…”",
  );
  lines.push('- **es-419 paywall title:** “Desbloquea tus herramientas de manifestación hoy.” (no “stack”)');
  lines.push("");
  lines.push("### Suggested reply format");
  lines.push("");
  lines.push("Only list strings you would change:");
  lines.push("");
  lines.push("```");
  lines.push("namespace > key");
  lines.push('pt-BR: "proposed text"');
  lines.push('es-419: "proposed text"');
  lines.push("reason: one line");
  lines.push("```");
  lines.push("");
  lines.push("### Your special instructions");
  lines.push("");
  lines.push(
    "_Paste your task below when you open this in ChatGPT, e.g. focus area, tone, or locale priority._",
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Review status");
  lines.push("");
  lines.push("| Locale | Role | Runtime |");
  lines.push("|--------|------|---------|");
  lines.push("| **en** | Reference / source | Complete (9 namespaces) |");
  lines.push("| **pt-BR** | Target locale | Complete — directionally approved |");
  lines.push("| **es-419** | Target locale | Complete — approved after fix pass |");
  lines.push("");
  lines.push("## Shared conventions");
  lines.push("");
  lines.push(
    "- **Namespaces:** `common`, `dashboard`, `onboarding`, `settings`, `auth`, `paywall`, `tools`, `support`, `marketing`",
  );
  lines.push("- **home.defaultName:** blank in pt-BR and es-419 (no fallback “there/allí”)");
  lines.push("- **Manifestation intensity locked-in:** pt-BR **Focado** · es-419 **Enfocado**");
  lines.push("- **Inspired actions section:** pt-BR **Ações inspiradas** · es-419 **Acciones inspiradas**");
  lines.push("- **TTS:** pt-BR **texto para fala** · es-419 **texto a voz**");
  lines.push("");
  lines.push("---");
  lines.push("");

  for (let i = 0; i < files.length; i++) {
    const enSec = enMeta.sections[i];
    const ptSec = ptMeta.sections[i];
    const esSec = esMeta.sections[i];
    const ptMap = new Map(ptSec.flat.map((r) => [r.key, r.value]));
    const esMap = new Map(esSec.flat.map((r) => [r.key, r.value]));

    lines.push(`## ${enSec.title}`);
    lines.push("");
    lines.push(`Namespace: \`${enSec.file}\``);
    lines.push("");

    for (const row of enSec.flat) {
      lines.push(`- **${row.key}**`);
      lines.push(`  - **en:** ${row.value}`);
      lines.push(`  - **pt-BR:** ${ptMap.get(row.key) ?? "—"}`);
      lines.push(`  - **es-419:** ${esMap.get(row.key) ?? "—"}`);
      lines.push("");
    }
  }

  const pc = pushCopy;
  lines.push("## Push notifications (server-sent, not in locale JSON)");
  lines.push("");
  lines.push("### Manifestation routine reminder");
  lines.push("");
  lines.push(`- **en title:** ${pc.en.routine.heading}`);
  lines.push(`- **pt-BR title:** ${pc["pt-BR"].routine.heading}`);
  lines.push(`- **es-419 title:** ${pc["es-419"].routine.heading}`);
  lines.push("");
  lines.push(`- **en subtitle:** ${pc.en.routine.subtitle}`);
  lines.push(`- **pt-BR subtitle:** ${pc["pt-BR"].routine.subtitle}`);
  lines.push(`- **es-419 subtitle:** ${pc["es-419"].routine.subtitle}`);
  lines.push("");
  lines.push(`- **en body:** ${pc.en.routine.body}`);
  lines.push(`- **pt-BR body:** ${pc["pt-BR"].routine.body}`);
  lines.push(`- **es-419 body:** ${pc["es-419"].routine.body}`);
  lines.push("");
  lines.push("### Support request reply");
  lines.push("");
  lines.push(`- **en:** ${pc.en.support}`);
  lines.push(`- **pt-BR:** ${pc["pt-BR"].support}`);
  lines.push(`- **es-419:** ${pc["es-419"].support}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**Total keyed strings (en reference):** ${enMeta.allStrings.length}`);
  lines.push("");

  return lines;
}

const en = loadLocale("en");
const pt = loadLocale("pt-BR");
const es = loadLocale("es-419");
const ptRender = renderLocale("pt-BR", pt);
const esRender = renderLocale("es-419", es);

const out = [];
out.push("# Palette Plotting app copy handoff — pt-BR & es-419");
out.push("");
out.push(
  "**Status:** Both locales are wired in production (`src/i18n/locales/pt-BR/` and `src/i18n/locales/es-419/`). This document is regenerated from those runtime JSON files so reviewers see the same strings users get in the app.",
);
out.push("");
out.push(`**Last synced:** ${new Date().toISOString().slice(0, 10)}`);
out.push("");
out.push("## For Cursor / engineering team");
out.push("");
out.push(
  "**This file is a copy-review handoff only — not an implementation spec.** Do not treat it as a task list, architecture doc, or source of truth for code changes.",
);
out.push("");
out.push("- **Source of truth for shipped strings:** `src/i18n/locales/pt-BR/*.json` and `src/i18n/locales/es-419/*.json`");
out.push(
  "- **Use this doc for:** native-speaker copy review, translator comments, and spotting wording drift vs runtime",
);
out.push(
  "- **Do not use this doc for:** wiring i18n, refactoring keys, inventing new strings, or bulk code edits unless a human explicitly requests a copy change and names the locale key",
);
out.push(
  "- **Size:** ~3,400 lines is intentional (full string inventory). Skim the status sections at the top; scroll the keyed sections only when reviewing a surface.",
);
out.push("");
out.push("## Review status");
out.push("");
out.push("| Locale | Runtime | Handoff | Native review |");
out.push("|--------|---------|---------|---------------|");
out.push("| **pt-BR** | Complete (9 namespaces) | Synced in this doc | **Approved** (directionally) |");
out.push("| **es-419** | Complete (9 namespaces) | Synced in this doc | **Approved** (after targeted fix pass) |");
out.push("");
out.push("## Known non-blockers (do not reopen unless reviewer asks)");
out.push("");
out.push(
  "- **pt-BR:** Some toasts still use **“Falha ao…”** instead of **“Não foi possível…”**. Marked optional micro-polish only — **not a blocker** for ship or for Cursor to “fix” proactively.",
);
out.push(
  "- **es-419:** Settings nav stays **“Ajustes”** (not a global migration to **“Configuración”**). That is an **intentional, approved** product decision documented below.",
);
out.push(
  "- **es-419:** Product jargon **“set/sets de afirmaciones”** is kept where it appears in runtime.",
);
out.push("");
out.push("## Shared conventions (both locales)");
out.push("");
out.push(
  "- **Namespaces:** `common`, `dashboard`, `onboarding`, `settings`, `auth`, `paywall`, `tools`, `support`, `marketing`",
);
out.push("- **Placeholders:** Keep `{{name}}`, `{{pct}}`, `{{limit}}`, `{{year}}`, etc. exactly as shown");
out.push(
  "- **Intentional English product terms:** Scripting, Tap-in, SP (specific person), Palette Plotting, River/Sage/Rose/Oliver",
);
out.push(
  "- **es-419 UI label:** Settings nav uses **Ajustes** — intentional; do **not** switch globally to Configuración",
);
out.push("- **pt-BR billing channel:** Web shows **Web (cartão / pagamento)**");
out.push("- **es-419 billing channel:** Web shows **Web (tarjeta / pago)**");
out.push('- **home.defaultName:** blank in both locales (no fallback “there/allí”)');
out.push("- **Manifestation intensity locked-in label:** pt-BR **Focado** · es-419 **Enfocado**");
out.push(
  "- **Daily practice section:** both use inspired-actions wording (**Ações inspiradas** / **Acciones inspiradas**), not “daily practice”",
);
out.push("- **TTS:** pt-BR **texto para fala** · es-419 **texto a voz**");
out.push(
  '- **Paywall title (es-419):** “Desbloquea tus herramientas de manifestación hoy.” (no “stack”)',
);
out.push("");
out.push("## Deprecated / do not use for review");
out.push("");
out.push(
  "- `docs/locale-handoff/app-copy-es-419-proposed-clean.md` — proposal doc; changes are already in runtime",
);
out.push(
  "- Standalone `app-copy-pt-BR.md` and `app-copy-es-419.md` — superseded by this combined handoff unless you need a single-locale export",
);
out.push(
  "- **ChatGPT / translator review with English reference:** use `app-copy-en-pt-BR-es-419.md` (en + pt-BR + es-419 side by side)",
);
out.push("");
out.push("---");
out.push("");
out.push(...ptRender.lines);
out.push(...renderTail("pt-BR"));
out.push("");
out.push(`**Total de strings localizadas (pt-BR):** ${ptRender.count}`);
out.push("");
out.push("---");
out.push("");
out.push(...esRender.lines);
out.push(...renderTail("es-419"));
out.push("");
out.push(`**Total localized strings (es-419):** ${esRender.count}`);
out.push("");

const dest = path.join(__dirname, "app-copy-pt-BR-es-419.md");
fs.writeFileSync(dest, out.join("\n"), "utf8");
console.log("Wrote", dest);
console.log("pt-BR strings:", ptRender.count);
console.log("es-419 strings:", esRender.count);

const destEn = path.join(__dirname, "app-copy-en-pt-BR-es-419.md");
const trilingual = renderTrilingual(en, pt, es);
fs.writeFileSync(destEn, trilingual.join("\n"), "utf8");
console.log("Wrote", destEn);
console.log("en reference strings:", en.allStrings.length);
