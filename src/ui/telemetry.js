/**
 * Telemetry — activity histogram, event log, observation-deck readouts,
 * and the one live orbital object on the page.
 */

import { ISS_POLL_MS, ISS_URL } from "../config.js";
import { moonPhase } from "../data/astro.js";
import { feedSince, pushSeriesByRepo, rampLevel, smoothSeries } from "../data/normalize.js";
import { brailleGraph, measureCharWidth } from "./braille.js";
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

const GRAPH_ROWS = 2;

function renderActivity() {
  const host = document.getElementById("activity-cores");
  const total = document.getElementById("activity-total");
  if (!host || !state.repos.length) return;

  // Measure before filling: the braille glyphs may resolve to a fallback
  // face, so the column count has to come from the real advance width.
  const charW = measureCharWidth(host);
  const trackW = host.querySelector(".core__graph")?.getBoundingClientRect().width || 320;
  const chars = Math.max(12, Math.min(64, Math.floor(trackW / charW)));

  const rows = pushSeriesByRepo(state.events, state.repos, chars * 2);
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const sum = rows.reduce((a, r) => a + r.count, 0);

  const frag = document.createDocumentFragment();

  rows.forEach((row, i) => {
    const line = el("div", "core");
    // Relative level alone would paint the busiest track critical-red even
    // when "busiest" means two pushes. Cap it by the absolute count so the
    // hot end of the ramp has to be earned.
    const ceiling = row.count <= 2 ? 2 : row.count <= 5 ? 3 : row.count <= 10 ? 4 : 5;
    const level = Math.min(rampLevel(row.count, maxCount), ceiling);

    const id = el("span", "core__id label", state.repos[i].designation.replace("OBJ-", ""));
    const name = el("span", "core__name label", row.repo);

    const graph = el("pre", "core__graph");
    graph.dataset.level = String(level);
    // Each track is scaled to its own peak, so a quiet object still shows
    // its shape instead of flattening against the busiest one.
    graph.textContent = brailleGraph(smoothSeries(row.series), GRAPH_ROWS).join("\n");
    graph.setAttribute("aria-hidden", "true");

    const count = el("span", "core__count", String(row.count));

    line.append(id, name, graph, count);
    line.title = `${row.repo}: ${row.count} push${row.count === 1 ? "" : "es"} in the feed window`;
    frag.append(line);
  });

  host.replaceChildren(frag);

  host.setAttribute(
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
