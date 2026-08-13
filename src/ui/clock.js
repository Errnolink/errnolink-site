/**
 * The ticking readouts: UTC, Julian Date, sidereal time.
 * One interval drives every clock on the page.
 */

import { formatHours, formatUTC, gmstHours, julianDate } from "../data/astro.js";

export function startClocks() {
  const utc = document.getElementById("clock-utc");
  const jd = document.getElementById("clock-jd");
  const gmst = document.getElementById("clock-gmst");
  const heroGmst = document.getElementById("hero-gmst");
  const astroJd = document.getElementById("a-jd");
  const astroGmst = document.getElementById("a-gmst");

  function tick() {
    const now = new Date();
    const sidereal = formatHours(gmstHours(now));
    const jdVal = julianDate(now).toFixed(5);

    if (utc) utc.textContent = formatUTC(now);
    if (jd) jd.textContent = jdVal;
    if (gmst) gmst.textContent = sidereal;
    if (heroGmst) heroGmst.textContent = sidereal;
    if (astroJd) astroJd.textContent = jdVal;
    if (astroGmst) astroGmst.textContent = sidereal;
  }

  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
