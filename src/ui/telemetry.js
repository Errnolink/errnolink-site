/**
 * Telemetry — activity histogram, event log, observation-deck readouts,
 * and the one live orbital object on the page.
 */

import { ISS_POLL_MS, ISS_URL } from "../config.js";
import { moonPhase } from "../data/astro.js";
import { feedSince, pushesByRepo, rampLevel } from "../data/normalize.js";
import { CATALOG_SIZE } from "../data/stars.js";
import { state } from "../state.js";
import { setValue } from "./reveal.js";

const KIND_CLASS = {
  PUSH: "log__kind--push",
  "NEW OBJECT": "log__kind--create",
  BRANCH: "log__kind--create",
  TAG: "log__kind--create",
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
  const axis = document.getElementById("activity-axis");
  const total = document.getElementById("activity-total");
  if (!wrap || !state.repos.length) return;

  const rows = pushesByRepo(state.events, state.repos);
  const max = Math.max(...rows.map((r) => r.count), 1);
  const sum = rows.reduce((a, r) => a + r.count, 0);

  const sweep = wrap.querySelector(".bars__sweep");
  const bars = document.createDocumentFragment();
  const labels = document.createDocumentFragment();

  rows.forEach((row, i) => {
    const bar = el("div", "bars__bar");
    bar.style.setProperty("--h", `${Math.max(3, Math.round((row.count / max) * 100))}%`);
    bar.style.setProperty("--i", String(i));
    bar.dataset.level = String(rampLevel(row.count, max));
    bar.title = `${row.repo}: ${row.count} push${row.count === 1 ? "" : "es"}`;
    bars.append(bar);

    const tick = el("span", "bars__tick");
    tick.append(
      el("span", "bars__tick-id", state.repos[i].designation.replace("OBJ-", "")),
      el("span", "bars__tick-n", String(row.count))
    );
    labels.append(tick);
  });

  wrap.replaceChildren(bars);
  if (sweep) wrap.append(sweep);
  if (axis) axis.replaceChildren(labels);

  wrap.setAttribute(
    "aria-label",
    `Pushes per tracked object in the public event feed: ${rows
      .map((r) => `${r.repo} ${r.count}`)
      .join(", ")}.`
  );

  const since = feedSince(state.events);
  if (total) {
    total.textContent = since
      ? `${sum} PUSHES / SINCE ${since.toISOString().slice(0, 10)}`
      : `${sum} PUSHES`;
  }
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
