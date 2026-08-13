/**
 * Entry point.
 *
 * Order matters: install the error hook first so anything that fails after
 * it is visible to the smoke test; decide the effects state before anything
 * animates; then boot, fetch and hydrate.
 */

import { loadGitHub } from "./data/github.js";
import { setState, state } from "./state.js";
import { runBoot } from "./ui/boot.js";
import { startClocks } from "./ui/clock.js";
import { renderDossier } from "./ui/dossier.js";
import { initReveal } from "./ui/reveal.js";
import { initStarfield } from "./ui/starfield.js";
import { renderStatus } from "./ui/status.js";
import { renderTelemetry, startISS } from "./ui/telemetry.js";
import { renderTracking } from "./ui/tracking.js";

/* ── Error hook. The smoke test reads this. ───────────────────────────── */
window.__siteErrors = [];
window.addEventListener("error", (e) => {
  window.__siteErrors.push(String(e.message || e.error));
});
window.addEventListener("unhandledrejection", (e) => {
  window.__siteErrors.push(`unhandled rejection: ${e.reason}`);
});

const html = document.documentElement;
const FX_KEY = "errnolink:fx";

const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function storedFx() {
  try {
    return localStorage.getItem(FX_KEY);
  } catch {
    return null;
  }
}

/* ── Effects state, decided once, before anything moves ──────────────── */
const fxPref = storedFx() !== "off";
const fxLive = fxPref && !prefersReduced();

html.dataset.fx = fxPref ? "on" : "off";
setState({ fx: fxLive });

// Only hide things for the reveal if something is actually going to reveal
// them. Without this class the page is complete from the first paint.
if (fxLive) html.classList.add("js-reveal");

/* ── Starfield ───────────────────────────────────────────────────────── */
const canvas = document.getElementById("sky");
const sky = canvas ? initStarfield(canvas) : null;

/* ── FX toggle ───────────────────────────────────────────────────────── */
const fxToggle = document.getElementById("fx-toggle");
const fxGlyph = document.getElementById("fx-glyph");

function paintFxToggle() {
  const on = html.dataset.fx !== "off";
  fxToggle?.setAttribute("aria-pressed", String(on));
  if (fxGlyph) fxGlyph.textContent = on ? "▮" : "▯";
  fxToggle?.setAttribute(
    "title",
    on ? "Effects on — click to stop all motion" : "Effects off — click to restore motion"
  );
}

fxToggle?.addEventListener("click", () => {
  const next = html.dataset.fx === "off" ? "on" : "off";
  html.dataset.fx = next;
  try {
    localStorage.setItem(FX_KEY, next);
  } catch {
    /* Preference is a nicety; the toggle still works for this session. */
  }
  const live = next === "on" && !prefersReduced();
  setState({ fx: live });
  html.classList.toggle("js-reveal", false); // never re-hide revealed content
  sky?.setFx(live);
  paintFxToggle();
});

paintFxToggle();

/* ── Cursor readout ──────────────────────────────────────────────────── */
const cursorOut = document.getElementById("cursor-readout");
if (cursorOut) {
  let pending = false;
  let last = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (e) => {
      last = { x: e.clientX, y: e.clientY };
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        cursorOut.textContent = `${String(Math.round(last.x)).padStart(4, "0")},${String(
          Math.round(last.y)
        ).padStart(4, "0")}`;
        pending = false;
      });
    },
    { passive: true }
  );
}

/* ── Marquee: duration from content width, so speed is constant ──────── */
function sizeMarquee() {
  const track = document.getElementById("marquee-track");
  const run = document.getElementById("marquee-run");
  if (!track || !run) return;
  // Duplicate the run once so the -50% translate loops seamlessly.
  if (track.children.length === 1) track.append(run.cloneNode(true));
  const width = run.getBoundingClientRect().width;
  if (width > 0) track.style.setProperty("--marquee-dur", `${Math.round(width / 40)}s`);
}

/* ── Footer year ─────────────────────────────────────────────────────── */
const year = document.getElementById("footer-year");
if (year) year.textContent = String(new Date().getUTCFullYear());

/* ── Boot, then hydrate ──────────────────────────────────────────────── */
startClocks();
sizeMarquee();

// The fetch starts immediately; the boot overlay is theatre in front of it,
// never a gate on it.
const dataReady = loadGitHub().catch((err) => {
  window.__siteErrors.push(`data load failed: ${err.message}`);
  return null;
});

runBoot(fxLive).then((played) => {
  initReveal();
  // With the boot played, the wordmark has already made its entrance.
  if (!played && fxLive) {
    document.getElementById("hero-stamp")?.classList.add("gl-run");
  }
  sizeMarquee();
});

dataReady.then((data) => {
  if (data) {
    setState({
      source: data.source,
      fetchedAt: data.fetchedAt,
      reason: data.reason,
      rateReset: data.rateReset,
      profile: data.profile,
      repos: data.repos,
      events: data.events,
    });
  }
  renderStatus();
  renderDossier();
  renderTracking();
  renderTelemetry();
  sizeMarquee();
  startISS();
});
