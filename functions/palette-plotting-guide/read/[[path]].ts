/** Cloudflare Pages — same-origin guide reader (matches palette-plotting-guide/read/{slug}). */

const GUIDE_COOKIE = "pp_guide_token";
const OPEN_GUIDE_HASH = "/palette-plotting-guide#open-guide";
const DEFAULT_SECTION = "start-here";

interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

function parseSectionSlug(path: string | string[] | undefined): string {
  const raw = Array.isArray(path) ? path.join("/") : path ?? "";
  const slug = raw.trim();
  return slug || DEFAULT_SECTION;
}

function readGuideToken(request: Request, url: URL): string | null {
  const fromQuery = url.searchParams.get("token");
  if (fromQuery) return fromQuery;
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)pp_guide_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function guideCookie(token: string, secure: boolean): string {
  const flags = `Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
  return `${GUIDE_COOKIE}=${encodeURIComponent(token)}; ${flags}`;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
}): Promise<Response> {
  const url = new URL(context.request.url);
  const token = readGuideToken(context.request, url);

  if (!token) {
    return Response.redirect(new URL(OPEN_GUIDE_HASH, url.origin), 302);
  }

  const supabaseUrl = (context.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const apiKey = context.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!supabaseUrl || !apiKey) {
    return new Response("Guide reader is not configured.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const tokenFromQuery = url.searchParams.get("token");
  if (tokenFromQuery) {
    const clean = new URL(url);
    clean.searchParams.delete("token");
    return new Response(null, {
      status: 302,
      headers: {
        Location: clean.toString(),
        "Set-Cookie": guideCookie(tokenFromQuery, url.protocol === "https:"),
      },
    });
  }

  const section = parseSectionSlug(context.params.path);
  const readerBase = `${url.origin}/palette-plotting-guide/read`;
  const readerUrl = new URL(`${supabaseUrl}/functions/v1/palette-plotting-guide-reader`);
  readerUrl.searchParams.set("section", section);
  readerUrl.searchParams.set("token", token);
  readerUrl.searchParams.set("reader_base", readerBase);

  const upstream = await fetch(readerUrl.toString(), {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    redirect: "manual",
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("Location") || `${url.origin}/palette-plotting-guide?locked=1`;
    return Response.redirect(location, 302);
  }

  if (!upstream.ok) {
    return new Response("Could not load the guide.", {
      status: upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const html = await upstream.text();
  if (!html.includes("guide-body")) {
    return new Response("Could not load the guide.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
