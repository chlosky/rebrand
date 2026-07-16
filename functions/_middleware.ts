/** Cloudflare Pages — serve maintenance for all non-static routes (including Pages Functions). */

function isStaticAsset(pathname: string): boolean {
  if (pathname === "/maintenance.html") return true;
  if (pathname.startsWith("/assets/")) return true;
  if (pathname.startsWith("/mediapipe/")) return true;
  return /\.(js|css|wasm|png|jpe?g|svg|ico|json|webmanifest|mp4|tflite|binarypb)$/i.test(pathname);
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  if (isStaticAsset(url.pathname)) {
    return context.next();
  }

  const maintenanceRequest = new Request(new URL("/maintenance.html", url.origin).toString(), {
    method: "GET",
  });
  const maintenancePage = await context.env.ASSETS.fetch(maintenanceRequest);

  return new Response(maintenancePage.body, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
      "Retry-After": "3600",
    },
  });
};
