/**
 * Telemetry — activity histogram, event log, observation-deck readouts,
 * and the one live orbital object on the page.
 */

import { ISS_POLL_MS, ISS_URL } from "../config.js";
import { moonPhase } from "../data/astro.js";
import { activityBuckets, rampLevel } from "../data/normalize.js";
import { CATALOG_SIZE } from "../data/stars.js";
import { state } from "../state.js";
import { setValue } from "./reveal.js";

const KIND_CLASS = {
  PUSH: "log__kind--push",
  "NEW OBJECT": "log__kind--create",
  PURGE: "log__kind--delete",
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderLog() {
  const list = document.getElementById("event-log");
  if (!list || !state.events.length) return;

  const frag = document.createDocumentFragment();
  for (const ev of state.events.slice(0, 14)) {
    const li = el("li", "log__line");
    li.append(
      el("span", "log__time", (ev.at || "").slice(0, 10)),
      el("span", `log__kind ${KIND_CLASS[ev.kind] ?? "log__kind--other"}`, ev.kind),
      el("span", "log__body", ev.detail)
    );
    frag.append(li);
  }
  list.replaceChildren(frag);
}

function renderActivity() {
  const wrap = document.getElementById("activity-bars");
  const total = document.getElementById("activity-total");
  if (!wrap) return;

  const buckets = activityBuckets(state.events);
  const max = Math.max(...buckets, 1);
  const sum = buckets.reduce((a, b) => a + b, 0);

  const sweep = wrap.querySelector(".bars__sweep");
  const frag = document.createDocumentFragment();

  buckets.forEach((value, i) => {
    const bar = el("div", "bars__bar");
    bar.style.setProperty("--h", `${Math.max(3, Math.round((value / max) * 100))}%`);
    bar.style.setProperty("--i", String(i));
    bar.dataset.level = String(rampLevel(value, max));
    bar.title = `week -${11 - i}: ${value} commit${value === 1 ? "" : "s"}`;
    frag.append(bar);
  });

  wrap.replaceChildren(frag);
  if (sweep) wrap.append(sweep);

  wrap.setAttribute(
    "aria-label",
    `Commit activity over the last twelve weeks: ${sum} commits in the public event feed.`
  );
  if (total) total.textContent = `${sum} COMMITS / FEED WINDOW`;
}

function renderAstro() {
  const fx = state.fx;
  const { name, illumination } = moonPhase();
  setValue(document.getElementById("a-moon"), name, fx, 0);
  setValue(document.getElementById("a-moonpct"), `${Math.round(illumination * 100)}%`, fx, 1);
  setValue(document.getElementById("a-catalog"), `${CATALOG_SIZE} STARS`, fx, 2);

  const heroCatalog = document.getElementById("hero-catalog");
  if (heroCatalog) heroCatalog.textContent = String(CATALOG_SIZE);
}

/**
 * The ISS. Keyless and CORS-open, so it needs no proxy — and strictly
 * additive: if it never answers, the readout says so and stops asking so
 * often.
 */
function startISS() {
  const out = document.getElementById("a-iss");
  if (!out) return;

  let failures = 0;
  let timer = 0;

  async function poll() {
    try {
      const res = await fetch(ISS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`ISS responded ${res.status}`);
      const data = await res.json();
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      const ns = lat >= 0 ? "N" : "S";
      const ew = lon >= 0 ? "E" : "W";
      out.textContent = `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
      out.classList.remove("value--dim");
      failures = 0;
    } catch {
      failures++;
      out.textContent = "NO SIGNAL";
      out.classList.add("value--dim");
    }
    // Back off after repeated silence rather than hammering a dead endpoint.
    const wait = failures === 0 ? ISS_POLL_MS : Math.min(ISS_POLL_MS * 2 ** failures, 300000);
    if (failures < 6) timer = setTimeout(poll, wait);
  }

  poll();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else poll();
  });
}

export function renderTelemetry() {
  renderLog();
  renderActivity();
  renderAstro();
}

export { startISS };
