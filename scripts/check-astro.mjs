/**
 * Unit checks for the astronomy module.
 *
 * These readouts claim to be real, so they are checked against known epochs
 * rather than eyeballed. Node can import the module directly — it touches no
 * DOM by design.
 */

import {
  formatHours,
  gmstHours,
  julianDate,
  missionDay,
  moonPhase,
} from "../src/data/astro.js";

let failures = 0;

function check(label, actual, expected, tolerance = 0) {
  const ok =
    typeof expected === "number"
      ? Math.abs(actual - expected) <= tolerance
      : actual === expected;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} — got ${actual}${ok ? "" : `, want ${expected}`}`);
  if (!ok) failures++;
}

const j2000 = new Date("2000-01-01T00:00:00Z");

// The defining epoch.
check("JD at 2000-01-01T00:00Z", julianDate(j2000), 2451544.5, 0);

// One day later is exactly one day later.
check("JD advances by 1/day", julianDate(new Date("2000-01-02T00:00:00Z")), 2451545.5, 0);

// GMST at that instant is 6h39m52.27s — a published value.
check("GMST at J2000 epoch", gmstHours(j2000), 6 + 39 / 60 + 52.27 / 3600, 0.001);
check("GMST formats", formatHours(gmstHours(j2000)), "06:39:52");

// GMST gains ~3m56s on solar time each day.
const drift = gmstHours(new Date("2000-01-02T00:00:00Z")) - gmstHours(j2000);
check("sidereal day gains ~3m56s", drift * 3600, 236.55, 1.5);

// A full moon fell on 2026-01-03T10:03Z; illumination must be near unity.
check("full moon illumination", moonPhase(new Date("2026-01-03T10:03:00Z")).illumination, 1, 0.03);

// A new moon fell on 2026-01-18T19:52Z.
check("new moon illumination", moonPhase(new Date("2026-01-18T19:52:00Z")).illumination, 0, 0.03);

check("mission day counts whole days", missionDay("2021-04-22T16:19:31Z", new Date("2021-04-24T16:19:31Z")), 2);

console.log(failures === 0 ? "\nASTRO OK" : `\nASTRO FAILED — ${failures} check(s)`);
process.exit(failures === 0 ? 0 : 1);
