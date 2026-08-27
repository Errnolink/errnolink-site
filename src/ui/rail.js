/**
 * Section rail — scroll position, and the page's only navigation.
 *
 * One observer for the whole rail. A tick goes `is-seen` the first time its
 * section is reached and stays that way; `is-active` follows the section
 * currently closest to the middle of the viewport, and only one tick holds
 * it at a time.
 *
 * Choosing the active section by "most visible" is wrong on this page: the
 * hero is a full viewport and telemetry is 1100px, so a long section wins
 * the ratio contest while its heading is far off screen. The tick tracks
 * whichever section's box contains the viewport's midline instead, which is
 * the section a reader would name if asked where they are.
 */

export function initRail() {
  const rail = document.getElementById("rail");
  if (!rail) return;

  const items = [...rail.querySelectorAll(".rail__item")];
  const targets = items
    .map((item) => ({ item, section: document.querySelector(item.getAttribute("href")) }))
    .filter((t) => t.section);

  if (!targets.length) return;

  let active = null;

  function paint() {
    const mid = window.scrollY + window.innerHeight / 2;
    let found = targets[0];

    for (const t of targets) {
      const top = t.section.offsetTop;
      if (mid >= top) found = t;
      // Reached is sticky: scrolling back up does not un-visit a section.
      if (mid >= top) t.item.classList.add("is-seen");
    }

    if (found.item === active) return;
    active?.classList.remove("is-active");
    found.item.classList.add("is-active");
    found.item.setAttribute("aria-current", "true");
    active?.removeAttribute("aria-current");
    active = found.item;
  }

  // Reads layout, so it is rate-limited to one frame — a raw scroll handler
  // doing offsetTop lookups is a jank generator on a 3.8k-pixel page.
  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      paint();
      queued = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paint();
}
