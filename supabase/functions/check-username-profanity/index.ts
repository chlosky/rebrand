import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESERVED_EXACT = [
  "admin",
  "administrator",
  "moderator",
  "mod",
  "support",
  "official",
  "staff",
  "team",
  "help",
  "billing",
  "security",
  "privacy",
  "legal",
  "refund",
  "refunds",
  "abuse",
  "report",
  "reports",
  "system",
  "root",
  "owner",
  "founder",
  "paletteplotting",
];

const RESERVED_CONTAINS = [
  "paletteplotting",
  "paletteplottingadmin",
  "paletteplottingofficial",
  "paletteplottingsupport",
  "paletteplottingteam",
  "paletteplottingstaff",
  "solavernal",
  "solarvernai",
  "paletteplottingapp",
];

const PROFANITY_LIST = [
  // English profanity / abuse
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bitch",
  "bitches",
  "cunt",
  "bastard",
  "dick",
  "cock",
  "pussy",
  "slut",
  "whore",
  "hoe",

  // English slurs / hate
  "nigger",
  "nigga",
  "fag",
  "faggot",
  "retard",
  "racist",
  "nazi",
  "hitler",
  "whitepower",

  // Sexual / adult
  "porn",
  "porno",
  "sex",
  "sexual",
  "nude",
  "naked",
  "fetish",
  "kink",
  "bdsm",
  "incest",

  // Abuse / exploitation / predators
  "rape",
  "rapist",
  "molest",
  "molester",
  "predator",
  "pedo",
  "pedophile",
  "pedofilo",
  "pedofilia",
  "pederasta",
  "abuse",
  "abuser",
  "abusive",
  "assault",
  "assaulter",

  // Violence / harm
  "kill",
  "killer",
  "murder",
  "death",
  "violent",
  "violence",
  "beat",
  "beater",
  "abduct",
  "kidnap",
  "torture",
  "harm",
  "hurt",
  "attack",
  "stalker",
  "stalk",
  "harass",
  "harasser",
  "bully",
  "choke",
  "strangle",

  // Drugs
  "drug",
  "drugs",
  "meth",
  "cocaine",
  "heroin",
  "weed",
  "420",

  // Spanish / es-419 profanity and abuse
  "puta",
  "puto",
  "putita",
  "perra",
  "zorra",
  "pendejo",
  "pendeja",
  "pendejito",
  "pendejita",
  "cabron",
  "cabrona",
  "chingar",
  "chingada",
  "chingado",
  "chingadera",
  "mierda",
  "carajo",
  "cono",
  "verga",
  "marica",
  "maricon",
  "joto",
  "culero",
  "culera",
  "pelotudo",
  "pelotuda",
  "boludo",
  "boluda",
  "gilipollas",
  "imbecil",
  "idiota",
  "estupido",
  "estupida",

  // Spanish / es-419 sexual / harm / predator terms
  "porno",
  "pornografia",
  "sexo",
  "sexual",
  "desnudo",
  "desnuda",
  "fetiche",
  "morbo",
  "incesto",
  "violar",
  "violacion",
  "abusar",
  "abusador",
  "abusadora",
  "abusosexual",
  "menordeedad",
  "pedofilo",
  "pedofilia",
  "pederasta",
  "asesino",
  "asesina",
  "matar",
  "matarme",
  "suicidio",
  "suicida",
  "autolesion",
  "droga",
  "drogas",
  "cocaina",
  "heroina",
  "metanfetamina",

  // Portuguese / pt-BR profanity and abuse
  "porra",
  "caralho",
  "merda",
  "puta",
  "puto",
  "vadia",
  "vagabunda",
  "vagabundo",
  "piranha",
  "buceta",
  "boceta",
  "pau",
  "pinto",
  "cacete",
  "cuzao",
  "arrombado",
  "arrombada",
  "foder",
  "fodido",
  "fodida",
  "viado",
  "bicha",
  "traveco",
  "retardado",
  "retardada",
  "idiota",
  "imbecil",
  "otario",

  // Portuguese / pt-BR sexual / harm / predator terms
  "porno",
  "pornografia",
  "sexo",
  "sexual",
  "nudez",
  "pelado",
  "pelada",
  "fetiche",
  "incesto",
  "estuprar",
  "estupro",
  "abusar",
  "abusador",
  "abusadora",
  "abusosexual",
  "menordeidade",
  "pedofilo",
  "pedofilia",
  "assassino",
  "assassina",
  "matar",
  "mematar",
  "suicidio",
  "suicida",
  "automutilacao",
  "droga",
  "drogas",
  "cocaina",
  "heroina",
  "metanfetamina",
];

function normalizeUsernameForModeration(input: string): string {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/\+/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

function hasUnsafeUsername(text: string): boolean {
  const normalized = normalizeUsernameForModeration(text);

  if (!normalized) return false;

  if (RESERVED_EXACT.includes(normalized)) return true;

  if (RESERVED_CONTAINS.some((word) => normalized.includes(word))) return true;

  return PROFANITY_LIST.some((word) => {
    const normalizedWord = normalizeUsernameForModeration(word);
    return normalizedWord.length >= 3 && normalized.includes(normalizedWord);
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const raw = body?.text ?? body?.username;

    if (!raw || typeof raw !== "string") {
      return new Response(
        JSON.stringify({ error: "Username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const unsafe = hasUnsafeUsername(raw);

    return new Response(
      JSON.stringify({
        hasProfanity: unsafe,
        safe: !unsafe,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in profanity check:", error);
    return new Response(
      JSON.stringify({
        hasProfanity: true,
        safe: false,
        error: "An error occurred. Please try again.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
