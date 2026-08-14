/**
 * Scroll choreography.
 *
 * One observer, one class. Sections mark themselves `.is-live` when they
 * come into view and are then left alone — nothing re-animates on the way
 * back up, because a page that keeps re-introducing itself is exhausting.
 */

import { state } from "../state.js";

/**
 * How long `.gl-run` stays on, ms. Cadence-planner's badge swaps its value
 * at 75ms and drops the glitch class at 150ms; the extra 50ms here just
 * covers the wipe, which starts at the same instant rather than after.
 */
const GLITCH_MS = 200;

/**
 * Fire the glitch burst on an element and clean up after it.
 *
 * The class is removed when the burst ends, which is the whole performance
 * story: while it is set the element carries two opaque pseudo-element
 * copies running an infinite 100ms animation and a suppressed halo, and
 * none of that should outlive the burst. Nothing here waits on
 * `animationend`, because the spike animations never end — the window is
 * the point.
 */
export function runGlitch(el, short = false) {
  // Effects off is effects off: the copies are opaque, so a frozen burst
  // would park two black bands over the heading.
  if (!el || !state.fx) return;

  // Bind the copies to whatever the element actually says now, so a heading
  // rewritten by the data layer never glitches with stale text.
  el.dataset.text = (el.textContent || "").trim();

  el.classList.add("gl-run");
  if (short) el.classList.add("gl-run--short");

  setTimeout(() => {
    el.classList.remove("gl-run", "gl-run--short");
    el.style.willChange = "";
  }, GLITCH_MS);
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
