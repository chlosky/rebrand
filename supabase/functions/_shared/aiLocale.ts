/** Supported app locales for AI prompts and safety templates. */
export type AppLocale = "en" | "es-419" | "pt-BR";

export function resolveAppLocale(raw: unknown): AppLocale {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "es-419" || v === "pt-BR" || v === "en") return v;
  return "en";
}

/** Instruction block appended to system prompts so model output matches UI locale. */
export function aiLanguageInstruction(locale: AppLocale): string {
  switch (locale) {
    case "es-419":
      return [
        "LANGUAGE (mandatory): Write ALL user-facing text in Latin American Spanish (es-419).",
        "Use natural, neutral Latin American vocabulary (not Spain Spanish).",
        "Use correct Spanish accents/tildes where applicable (e.g. mí, también, opción, creencia, podría).",
        "Do not mix English unless the user wrote in English.",
        "JSON keys stay in English; every string value shown to the user must be in Spanish.",
      ].join(" ");
    case "pt-BR":
      return [
        "LANGUAGE (mandatory): Write ALL user-facing text in Brazilian Portuguese (pt-BR).",
        "Use natural, neutral Brazilian Portuguese.",
        "Do not mix English unless the user wrote in English.",
        "JSON keys stay in English; every string value shown to the user must be in Portuguese.",
      ].join(" ");
    default:
      return "LANGUAGE (mandatory): Write ALL user-facing text in English.";
  }
}

/** Mode-specific MECE examples for Belief Work — keeps examples in the user's locale. */
export function beliefRefactorModeInstructions(
  locale: AppLocale,
  isEliminateMode: boolean,
): string {
  if (locale === "es-419") {
    return isEliminateMode
      ? `Modo ELIMINAR CREENCIA LIMITANTE:
Descompón la creencia limitante para revelar los supuestos que la sostienen. Luego, para cada supuesto, genera sub-supuestos que LO CONTRADIGAN (no que lo apoyen). El objetivo es exponer la estructura lógica y mostrar dónde puede no sostenerse.

Ejemplo: "No puedo hacerme millonario en 6 años"
- Supuesto: "No tengo la capacidad ni las habilidades para lograrlo" → Sub-supuestos que lo contradicen: "Puedo aprender y desarrollar las habilidades necesarias", "Tengo acceso a recursos y oportunidades"
- Supuesto: "6 años no es suficiente tiempo" → Sub-supuestos que lo contradicen: "Puedo avanzar de forma constante con el tiempo", "El esfuerzo acumulado puede crecer"
- Supuesto: "El camino hacia ser millonario no es alcanzable" → Sub-supuestos que lo contradicen: "Existen estrategias y métodos comprobados", "Otras personas han logrado metas similares en plazos parecidos"`
      : `Modo INTEGRAR CREENCIA EXPANSIVA:
Descompón la creencia expansiva/aspiracional en componentes más pequeños, creíbles y fáciles de asimilar. Luego descompón cada supuesto en sub-supuestos cuando aplique. El objetivo es ayudar a integrar la creencia grande haciéndola sentir más realista y alcanzable.

Ejemplo: "Me haré millonario en 6 años"
- Supuesto: "Tengo la capacidad y las habilidades para lograrlo" → Sub-supuestos: "Puedo aprender y desarrollar las habilidades necesarias", "Tengo acceso a recursos y oportunidades"
- Supuesto: "6 años es más que suficiente tiempo" → Sub-supuestos: "Puedo avanzar de forma constante con el tiempo", "El crecimiento o el esfuerzo acumulado se suma"
- Supuesto: "El camino hacia ser millonario es alcanzable" → Sub-supuestos: "Existen estrategias y métodos comprobados", "Otras personas han logrado metas similares en plazos parecidos"`;
  }

  if (locale === "pt-BR") {
    return isEliminateMode
      ? `Modo ELIMINAR CRENÇA LIMITANTE:
Deconstrua a crença limitante para revelar os pressupostos que a sustentam. Depois, para cada pressuposto, gere sub-pressupostos que o CONTRADIGAM (não que o apoiem). O objetivo é expor a estrutura lógica e mostrar onde ela pode não se sustentar.

Exemplo: "Não posso me tornar milionário em 6 anos"
- Pressuposto: "Não tenho a capacidade e as habilidades para fazer isso acontecer" → Sub-pressupostos que o contradizem: "Posso aprender e desenvolver as habilidades necessárias", "Tenho acesso a recursos e oportunidades"
- Pressuposto: "6 anos não é tempo suficiente" → Sub-pressupostos que o contradizem: "Posso progredir de forma consistente ao longo do tempo", "O esforço acumulado pode se somar"
- Pressuposto: "O caminho para ser milionário não é alcançável" → Sub-pressupostos que o contradizem: "Existem estratégias e métodos comprovados", "Outras pessoas alcançaram metas semelhantes em prazos parecidos"`
      : `Modo INTEGRAR CRENÇA EXPANSIVA:
Decomponha a crença expansiva/aspiracional em componentes menores, mais críveis e fáceis de absorver. Depois decomponha cada pressuposto em sub-pressupostos quando aplicável. O objetivo é ajudar a integrar a crença grande tornando-a mais realista e alcançável.

Exemplo: "Vou me tornar milionário em 6 anos"
- Pressuposto: "Tenho a capacidade e as habilidades para fazer isso acontecer" → Sub-pressupostos: "Posso aprender e desenvolver as habilidades necessárias", "Tenho acesso a recursos e oportunidades"
- Pressuposto: "6 anos é mais do que tempo suficiente" → Sub-pressupostos: "Posso progredir de forma consistente ao longo do tempo", "O crescimento ou o esforço acumulado se soma"
- Pressuposto: "O caminho para ser milionário é alcançável" → Sub-pressupostos: "Existem estratégias e métodos comprovados", "Outras pessoas alcançaram metas semelhantes em prazos parecidos"`;
  }

  return isEliminateMode
    ? `For ELIMINATE LIMITING BELIEF mode:
Deconstruct the limiting belief to reveal all underlying assumptions that support it. Then for each assumption, generate sub-assumptions that COUNTER that assumption (not support it). The goal is to expose the belief's logical structure and show where it may not hold.

Example: "I can't become a millionaire in 6 years"
- Assumption: "I don't have the ability and skills to make it happen" → Countering sub-assumptions: "I can learn and develop necessary skills", "I have access to resources and opportunities"
- Assumption: "6 years is not enough time" → Countering sub-assumptions: "I can make consistent progress over time", "Compounded effort can accumulate"
- Assumption: "The path to millionaire status is not achievable" → Countering sub-assumptions: "There are proven strategies and methods", "Others have achieved similar goals in similar timeframes"`
    : `For INTEGRATE EXPANSIONARY BELIEF mode:
Break down the expansionary/aspirational belief into smaller, more believable and consumable components. THEN break down each assumption into sub-assumptions where applicable. The goal is to help users integrate the big belief by making it feel more realistic and achievable through smaller, digestible chunks.

Example: "I will become a millionaire in 6 years"
- Assumption: "I have the ability and skills to make it happen" → Sub-assumptions: "I can learn and develop necessary skills", "I have access to resources and opportunities"
- Assumption: "6 years is more than enough time" → Sub-assumptions: "I can make consistent progress over time", "Compound growth/effort will accumulate"
- Assumption: "The path to millionaire status is achievable" → Sub-assumptions: "There are proven strategies and methods", "Others have achieved similar goals in similar timeframes"`;
}

export function beliefRefactorUserPrompt(
  locale: AppLocale,
  belief: string,
  isEliminateMode: boolean,
): string {
  if (locale === "es-419") {
    return isEliminateMode
      ? `Analiza esta creencia limitante con el marco MECE: "${belief}"

Descompónla en todos los supuestos y sub-supuestos subyacentes que revelen por qué esta creencia limitante puede ser irracional.

Escribe todo el texto de supuestos y sub-supuestos en español latinoamericano (es-419). Devuelve solo JSON válido.`
      : `Analiza esta creencia expansiva con el marco MECE: "${belief}"

Descompónla en supuestos más pequeños, creíbles y fáciles de asimilar que hagan que esta creencia expansiva se sienta más realista y alcanzable.

Escribe todo el texto de supuestos y sub-supuestos en español latinoamericano (es-419). Devuelve solo JSON válido.`;
  }

  if (locale === "pt-BR") {
    return isEliminateMode
      ? `Analise esta crença limitante com o framework MECE: "${belief}"

Decomponha em todos os pressupostos e sub-pressupostos subjacentes que revelem por que esta crença limitante pode ser irracional.

Escreva todo o texto de pressupostos e sub-pressupostos em português brasileiro (pt-BR). Retorne apenas JSON válido.`
      : `Analise esta crença expansiva com o framework MECE: "${belief}"

Decomponha em pressupostos menores, mais críveis e fáceis de absorver que tornem esta crença expansiva mais realista e alcançável.

Escreva todo o texto de pressupostos e sub-pressupostos em português brasileiro (pt-BR). Retorne apenas JSON válido.`;
  }

  return isEliminateMode
    ? `Analyze this limiting belief using MECE framework: "${belief}"

Deconstruct it into all underlying assumptions and sub-assumptions that reveal why this limiting belief may be irrational.

Write all assumption text in the language required in the system instructions. Return only valid JSON.`
    : `Analyze this expansionary belief using MECE framework: "${belief}"

Break it down into smaller, more believable and consumable assumptions that make this expansionary belief feel more realistic and achievable.

Write all assumption text in the language required in the system instructions. Return only valid JSON.`;
}

function guideCharacterName(character: string): string {
  const c = character.toLowerCase();
  if (c === "river" || c === "sage" || c === "rose" || c === "oliver") return c[0].toUpperCase() + c.slice(1);
  return "River";
}

/**
 * Locale-first Guide Chat system block (role + mandatory output language + reply style).
 * OpenAI has no separate Spanish/Portuguese model — this is the supported switch.
 */
export function chatGuideLocalePack(locale: AppLocale, character: string): string {
  const name = guideCharacterName(character);
  if (locale === "es-419") {
    return `Eres ${name}, una guía en Palette Plotting — una app de manifestación.

IDIOMA (obligatorio): Escribe TODO el texto visible para el usuario en español latinoamericano (es-419). Usa vocabulario neutro de Latinoamérica (no español de España). No mezcles inglés salvo que el usuario escriba en inglés.

PAUTAS DE RESPUESTA:
1. Mantén las respuestas concisas y conversacionales, alineadas con la pregunta o el tono del usuario.
2. Usa tres rangos aproximados: muy cortas (~5–29 tokens) para mensajes breves; normales (~30–120) para la mayoría; ocasionales más profundas (hasta ~250) cuando pidan ayuda para planear algo.
3. Responde al mensaje real del usuario en la primera oración. Evita introducciones largas.
4. No empieces repetidamente con la misma frase. Varía aperturas y usa lenguaje simple y directo.
5. Evita lenguaje terapéutico o análisis emocional ("probablemente te sientes…", "muestra fortaleza", "estoy orgulloso/a de ti").
6. Enfócate en pasos prácticos y pequeños. Termina de forma natural — a veces con pregunta, a veces con sugerencia, a veces con una frase breve.
7. Nunca des consejo profesional (salud, legal, financiero, carrera). Puedes sugerir acciones prácticas como lo haría un amigo.
8. Si el contenido es inapropiado o de crisis, usa SOLO las plantillas exactas indicadas más abajo.`;
  }
  if (locale === "pt-BR") {
    return `Você é ${name}, um guia no Palette Plotting — um app de manifestação.

IDIOMA (obrigatório): Escreva TODO o texto visível ao usuário em português brasileiro (pt-BR). Use vocabulário neutro do Brasil. Não misture inglês a menos que o usuário escreva em inglês.

DIRETRIZES DE RESPOSTA:
1. Mantenha as respostas concisas e conversacionais, alinhadas à pergunta ou ao tom do usuário.
2. Use três faixas aproximadas: muito curtas (~5–29 tokens) para mensagens breves; normais (~30–120) para a maioria; ocasionais mais profundas (até ~250) quando pedirem ajuda para planejar algo.
3. Responda à mensagem real do usuário na primeira frase. Evite introduções longas.
4. Não comece repetidamente com a mesma frase. Varie aberturas e use linguagem simples e direta.
5. Evite linguagem terapêutica ou análise emocional ("você provavelmente está se sentindo…", "mostra força", "tenho orgulho de você").
6. Foque em passos práticos e pequenos. Termine de forma natural — às vezes com pergunta, às vezes com sugestão, às vezes com uma frase breve.
7. Nunca dê conselho profissional (saúde, jurídico, financeiro, carreira). Pode sugerir ações práticas como um amigo faria.
8. Se o conteúdo for inadequado ou de crise, use SOMENTE os modelos exatos indicados abaixo.`;
  }
  return `You are ${name}, a guide in Palette Plotting — a manifestation companion app.

LANGUAGE (mandatory): Write ALL user-facing text in English.

OUTPUT GUIDELINES:
1. Keep response length concise and conversational and aligned with the questioning or engagement of the user.
2. Use three rough length bands: very short (~5–29 tokens) for tiny messages; normal (~30–120) for most; occasional deeper replies (up to ~250) when the user asks for help planning something.
3. Answer the user's actual message in the first sentence. Avoid long preambles.
4. Do not repeatedly start messages with the same phrase. Vary your openings and keep language simple and direct.
5. Avoid therapy-style language and emotion analysis.
6. Focus on practical, small next steps. End replies naturally.
7. Never give professional advice (health, legal, financial, career).
8. Follow the boundary templates below for inappropriate or crisis content.`;
}

/** Localized user turn — keeps the model in the target language without English-only reminders. */
export function chatGuideUserPrompt(locale: AppLocale, userMessage: string): string {
  if (locale === "es-419") {
    return `El usuario dijo: "${userMessage}"

Responde de forma natural según el estado persistente y las pautas del sistema. Escribe toda tu respuesta en español latinoamericano (es-419), salvo que el mensaje del usuario esté en inglés.`;
  }
  if (locale === "pt-BR") {
    return `O usuário disse: "${userMessage}"

Responda de forma natural com base no estado persistente e nas diretrizes do sistema. Escreva toda a sua resposta em português brasileiro (pt-BR), a menos que a mensagem do usuário esteja em inglês.`;
  }
  return `User said: "${userMessage}"

Respond naturally based on the persistent state snapshot and guidelines provided. Follow the output guidelines for response length and tone.`;
}

/** Daily chat limit message shown in-guide when the user hits their cap. */
export function chatDailyLimitMessage(locale: AppLocale, limit: number): string {
  switch (locale) {
    case "es-419":
      return `Alcanzaste tu límite diario de mensajes (${limit}). Se reinicia a medianoche.`;
    case "pt-BR":
      return `Você atingiu seu limite diário de mensagens (${limit}). Reinicia à meia-noite.`;
    default:
      return `You've reached your daily message limit (${limit} messages). Resets at midnight.`;
  }
}

/** Crisis + boundary templates — locale-appropriate hotlines (GPT-style standard). */
export function boundaryTemplates(locale: AppLocale): { inappropriate: string; selfHarm: string } {
  switch (locale) {
    case "es-419":
      return {
        inappropriate:
          "No puedo ayudar con ese tema o solicitud. Si quieres trabajar en otra intención, afirmación, rutina o pregunta sobre la app, puedo ayudarte con eso.",
        selfHarm:
          "Me alegra que hayas escrito. No puedo ayudar con emergencias o crisis, pero mereces apoyo humano ahora mismo. Si estás en peligro inmediato, llama al número de emergencias de tu país o busca ayuda presencial urgente. También puedes contactar una línea de apoyo en crisis de tu país. Si estás en México, puedes llamar a Línea de la Vida al 800 911 2000.",
      };
    case "pt-BR":
      return {
        inappropriate:
          "Não posso ajudar com esse tema ou pedido. Se quiser trabalhar em outra intenção, afirmação, rotina ou pergunta sobre o app, posso ajudar com isso.",
        selfHarm:
          "Fico feliz que você tenha escrito. Não posso ajudar com emergências ou crises, mas você merece apoio humano agora. Se estiver em perigo imediato, ligue para o serviço de emergência local ou procure ajuda presencial urgente. No Brasil, você pode ligar para o CVV pelo 188, disponível 24 horas. Em emergência médica, ligue para o SAMU pelo 192.",
      };
    default:
      return {
        inappropriate:
          "I can't help with that topic or request. If you want to work on another intention, affirmation, routine, or app question, I can help with that.",
        selfHarm:
          "I'm really glad you reached out. I can't help with emergencies or crisis situations, but you deserve human support right now. If you are in immediate danger, contact your local emergency number or seek urgent in-person help. You can also contact a crisis support line in your country.",
      };
  }
}

/** User-facing manifestation focus labels for prompts (canonical id → label). */
const FOCUS_LABELS: Record<AppLocale, Record<string, string>> = {
  en: {
    Connections: "Love / SP",
    "Self-Love": "Beauty / Glow Up",
    Confidence: "Self-Concept",
    Finances: "Money",
    Productivity: "Focus",
    Organization: "Life Reset",
    Fitness: "Body / Fitness",
    Nutrition: "Wellness",
    Discipline: "Discipline",
    Career: "Career",
    Business: "Business",
    Learning: "School / Exams",
  },
  "es-419": {
    Connections: "Amor / SP",
    "Self-Love": "Belleza / Glow Up",
    Confidence: "Autoconcepto",
    Finances: "Dinero",
    Productivity: "Enfoque",
    Organization: "Reinicio de vida",
    Fitness: "Cuerpo / Fitness",
    Nutrition: "Bienestar",
    Discipline: "Disciplina",
    Career: "Carrera",
    Business: "Negocios",
    Learning: "Escuela / Exámenes",
  },
  "pt-BR": {
    Connections: "Amor / SP",
    "Self-Love": "Beleza / Glow Up",
    Confidence: "Autoconceito",
    Finances: "Dinheiro",
    Productivity: "Foco",
    Organization: "Recomeço de vida",
    Fitness: "Corpo / Fitness",
    Nutrition: "Bem-estar",
    Discipline: "Disciplina",
    Career: "Carreira",
    Business: "Negócios",
    Learning: "Escola / Provas",
  },
};

export function displayLabelForCanonicalLocalized(
  canonical: string | null | undefined,
  locale: AppLocale,
): string {
  if (!canonical) return "";
  return FOCUS_LABELS[locale][canonical] ?? FOCUS_LABELS.en[canonical] ?? canonical;
}

export function formatCanonicalForPromptLocalized(canonical: string, locale: AppLocale): string {
  if (!canonical || canonical === "Uncategorized") return canonical;
  const label = displayLabelForCanonicalLocalized(canonical, locale);
  return label === canonical ? canonical : `${label} [${canonical}]`;
}

/** Resolve locale from request body, then user_preferences, then profiles. */
export async function resolveUserAppLocale(
  supabase: { from: (table: string) => unknown },
  userId: string | null | undefined,
  bodyLocale: unknown,
): Promise<AppLocale> {
  if (typeof bodyLocale === "string" && bodyLocale.trim()) {
    const fromBody = resolveAppLocale(bodyLocale);
    if (fromBody !== "en" || bodyLocale.trim() === "en") return fromBody;
  }
  if (!userId) return "en";
  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { preferred_locale?: string | null } | null }>;
        };
      };
    };
  };
  const { data: prefs } = await client
    .from("user_preferences")
    .select("preferred_locale")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefs?.preferred_locale) return resolveAppLocale(prefs.preferred_locale);
  const { data: profile } = await client
    .from("profiles")
    .select("preferred_locale")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.preferred_locale) return resolveAppLocale(profile.preferred_locale);
  return "en";
}
