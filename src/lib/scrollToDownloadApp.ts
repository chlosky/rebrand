/** Scroll to homepage download section, or navigate there from other routes. */
export function scrollToDownloadApp(): void {
  const section = document.getElementById("download-app");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.assign("/#download-app");
}
