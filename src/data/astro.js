/**
 * Astronomy. Pure functions, no DOM, no network — every readout on the
 * observation deck that is genuinely computed rather than fetched.
 *
 * Verified against known epochs by scripts/check-astro.mjs.
 */

/** Days from the Unix epoch to JD 0. */
const JD_UNIX_EPOCH = 2440587.5;
const J2000 = 2451545.0;

/** Julian Date. JD(2000-01-01T00:00Z) === 2451544.5 */
export function julianDate(date = new Date()) {
  return date.getTime() / 86400000 + JD_UNIX_EPOCH;
}

/**
 * Greenwich Mean Sidereal Time, in hours [0,24).
 *
 * The linear form is accurate to well under a second over any span this
 * page will ever display, and needs no observer location — which is the
 * point: the deck reports Greenwich, not the reader's back garden.
 */
export function gmstHours(date = new Date()) {
  const d = julianDate(date) - J2000;
  const h = 18.697375 + 24.0657098243 * d;
  return ((h % 24) + 24) % 24;
}

export function formatHours(hours) {
  const total = Math.floor(hours * 3600);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** Mean synodic month, and a known new moon: 2000-01-06 18:14 UTC. */
const SYNODIC = 29.530588853;
const NEW_MOON_JD = 2451550.1;

const PHASE_NAMES = [
  "NEW",
  "WAXING CRESCENT",
  "FIRST QUARTER",
  "WAXING GIBBOUS",
  "FULL",
  "WANING GIBBOUS",
  "LAST QUARTER",
  "WANING CRESCENT",
];

/**
 * @returns {{phase:number, name:string, illumination:number}}
 *   phase 0..1 through the cycle; illumination 0..1 of the disc lit.
 */
export function moonPhase(date = new Date()) {
  const age = (julianDate(date) - NEW_MOON_JD) / SYNODIC;
  const phase = ((age % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  // Octants centred on the named phases, so "FULL" spans either side of 0.5.
  const idx = Math.floor(phase * 8 + 0.5) % 8;
  return { phase, name: PHASE_NAMES[idx], illumination };
}

/**
 * A phase glyph for the hero HUD, from the geometric-shapes block.
 *
 * Deliberately not the emoji moon faces: there is no emoji anywhere on this
 * deck, and those render as colour bitmaps, which would make the moon the
 * brightest thing on a page whose brightest thing is the wordmark. The two
 * quarter glyphs are lit on the correct side — right waxing, left waning —
 * which is the only part of the shape carrying information the percentage
 * beside it does not.
 *
 * @param {number} phase 0..1 through the cycle, from `moonPhase()`
 */
const PHASE_GLYPHS = ["○", "◔", "◑", "◕", "●", "◕", "◐", "◔"];

export function moonGlyph(phase) {
  return PHASE_GLYPHS[Math.floor(phase * 8 + 0.5) % 8];
}

/** Whole days elapsed since an ISO instant — the deck's mission clock. */
export function missionDay(sinceISO, now = new Date()) {
  const start = new Date(sinceISO).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / 86400000));
}

export function formatUTC(date = new Date()) {
  return date.toISOString().slice(11, 19);
}

/** Local civil time, HH:MM:SS — the reader's own wall clock, not Greenwich's. */
export function formatLocal(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

/** Signed degrees → `+DD°MM'` for a declination readout. */
export function formatDec(deg) {
  const sign = deg < 0 ? "-" : "+";
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  return `${sign}${String(d).padStart(2, "0")}°${String(m).padStart(2, "0")}'`;
}

/** Degrees → `HHhMMm` of right ascension. */
export function formatRA(deg) {
  const hours = (((deg % 360) + 360) % 360) / 15;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}m`;
}
