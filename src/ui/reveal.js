/**
 * Scroll choreography.
 *
 * One observer, one class. Sections mark themselves `.is-live` when they
 * come into view and are then left alone — nothing re-animates on the way
 * back up, because a page that keeps re-introducing itself is exhausting.
 */

/**
 * Fire the glitch burst on an element and clean up after it.
 *
 * The class is removed when the burst ends, which is the whole performance
 * story: while it is set the element carries two pseudo-element copies and
 * a suppressed halo, and none of that should outlive the animation. The
 * pseudo-copies finish after the base wipe does, so the teardown waits for
 * the longest of the three rather than the first `animationend`.
 */
export function runGlitch(el, short = false) {
  if (!el) return;
  el.classList.add("gl-run");
  if (short) el.classList.add("gl-run--short");

  const total = short ? 380 : 480;
  setTimeout(() => {
    el.classList.remove("gl-run", "gl-run--short");
    el.style.willChange = "";
  }, total);
}

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
        runGlitch(section.querySelector(".sec-head__title"), true);
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
