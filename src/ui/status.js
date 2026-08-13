/**
 * The telemetry source badge — the single place the page admits how fresh
 * its numbers are.
 */

import { state } from "../state.js";
import { SNAPSHOT_DATE } from "../data/snapshot.js";

function minutesAgo(ts) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MIN AGO`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} HR AGO` : `${Math.round(hours / 24)} D AGO`;
}

export function renderStatus() {
  const badge = document.getElementById("feed-status");
  const led = document.getElementById("feed-led");
  const heroLed = document.getElementById("hero-led");
  const logSource = document.getElementById("log-source");
  const feed = badge?.closest(".feed");
  if (!badge || !led) return;

  let text;
  let ledClass;
  let feedClass;
  let title = "";

  if (state.source === "live") {
    text = "TELEMETRY: LIVE";
    ledClass = "led led--nominal";
    feedClass = "feed feed--live";
    title = "Fetched from the GitHub API just now.";
  } else if (state.source === "cache") {
    text = `TELEMETRY: CACHED · ${state.fetchedAt ? minutesAgo(state.fetchedAt) : "UNKNOWN"}`;
    ledClass = "led led--caution";
    feedClass = "feed feed--cached";
    title = "Served from this browser's cache; the live fetch did not complete.";
  } else {
    text = `TELEMETRY: SNAPSHOT · ${SNAPSHOT_DATE}`;
    ledClass = "led led--caution";
    feedClass = "feed feed--snapshot";
    title =
      state.reason === "rate-limited"
        ? `GitHub rate limit reached${
            state.rateReset ? `; resets ${new Date(state.rateReset).toUTCString()}` : ""
          }. Showing the baked snapshot.`
        : "The GitHub API is unreachable. Showing the baked snapshot.";
  }

  badge.textContent = text;
  led.className = ledClass;
  if (feed) feed.className = feedClass;
  if (feed) feed.title = title;
  if (heroLed) heroLed.className = ledClass;
  if (logSource) logSource.textContent = state.source.toUpperCase();
}
