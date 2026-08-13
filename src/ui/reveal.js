/**
 * Scroll choreography.
 *
 * One observer, one class. Sections mark themselves `.is-live` when they
 * come into view and are then left alone — nothing re-animates on the way
 * back up, because a page that keeps re-introducing itself is exhausting.
 */

export function initReveal() {
  const sections = document.querySelectorAll(".section, .hero");
  if (!("IntersectionObserver" in window)) {
    sections.forEach((s) => s.classList.add("is-live"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target;
        section.classList.add("is-live");
        section.querySelector(".sec-head__title")?.classList.add("gl-run", "gl-run--short");
        io.unobserve(section);
      }
    },
    { threshold: 0.2 }
  );

  sections.forEach((s) => io.observe(s));
}

/**
 * The `---` → value swap. Discrete, two beats, no tween: a readout resolves,
 * it does not glide.
 */
export function swapValue(el, value, step = 0) {
  if (!el) return;
  el.textContent = "---";
  setTimeout(() => {
    el.textContent = "-- -";
  }, 75 + step * 20);
  setTimeout(() => {
    el.textContent = value;
  }, 150 + step * 20);
}

/** Same swap, applied instantly when effects are off. */
export function setValue(el, value, fx, step = 0) {
  if (!el) return;
  if (fx) swapValue(el, value, step);
  else el.textContent = value;
}
