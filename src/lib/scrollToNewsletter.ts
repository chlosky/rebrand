/** Scroll to homepage newsletter signup, or navigate there from other routes. */
export function scrollToNewsletter(): void {
  const section = document.getElementById("newsletter");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.assign("/#newsletter");
}
