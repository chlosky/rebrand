export default function Maintenance() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f5] px-6 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Palette Plotting
        </p>
        <h1 className="mt-3 font-welcome-serif text-3xl text-neutral-900 sm:text-4xl">
          We&rsquo;ll be back shortly
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
          The site is down for maintenance. Please check back soon.
        </p>
        <p className="mt-6 text-sm text-neutral-600">
          Questions?{" "}
          <a
            href="mailto:support@paletteplotting.com"
            className="text-[#ad667d] underline-offset-2 hover:underline"
          >
            support@paletteplotting.com
          </a>
        </p>
      </div>
    </div>
  );
}
