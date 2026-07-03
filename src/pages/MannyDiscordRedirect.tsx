import { useEffect } from "react";

/** Manny Quantum community Discord — short link target for paletteplot.com/manny */
export const MANNY_QUANTUM_DISCORD_URL = "https://discord.gg/y6NPrURQYz";

type ExternalRedirectProps = {
  to: string;
};

export function ExternalRedirect({ to }: ExternalRedirectProps) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black font-sans text-white antialiased">
      <p className="text-sm text-white/60">Redirecting…</p>
    </main>
  );
}

export function MannyDiscordRedirect() {
  return <ExternalRedirect to={MANNY_QUANTUM_DISCORD_URL} />;
}
