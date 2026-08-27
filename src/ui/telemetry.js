/**
 * Telemetry — activity histogram, event log, observation-deck readouts,
 * and the one live orbital object on the page.
 */

import { ISS_POLL_MS, ISS_URL } from "../config.js";
import { moonGlyph, moonPhase } from "../data/astro.js";
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

/**
 * The log's bottom edge is masked to a fade so a partly-visible row reads as
 * "more below" rather than as a line sliced through its glyphs. The mask is
 * lifted at the end of the scroll, because dimming the final entry when
 * there is nothing after it is just hiding data.
 */
function watchLogScroll(list) {
  if (list.dataset.watched) return;
  list.dataset.watched = "1";

  const sync = () => {
    // 2px of slack: fractional scroll heights never land exactly.
    const atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
    list.classList.toggle("is-end", atEnd);
  };

  list.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
  sync();
}

function renderLog() {
  const list = document.getElementById("event-log");
  if (!list || !state.events.length) return;

  const frag = document.createDocumentFragment();
  state.events.slice(0, 14).forEach((ev, i) => {
    const li = el("li", "log__line");
    // Index drives the reveal stagger; the CSS caps it.
    li.style.setProperty("--i", String(i));
    li.append(
      el("span", "log__time", (ev.at || "").slice(0, 10)),
      el("span", `log__kind ${KIND_CLASS[ev.kind] ?? "log__kind--other"}`, ev.kind),
      el("span", "log__body", ev.detail)
    );
    frag.append(li);
  });
  list.replaceChildren(frag);

  const count = document.getElementById("log-count");
  if (count) count.textContent = `· ${Math.min(state.events.length, 14)} ENTRIES`;

  watchLogScroll(list);
}

/** Three character rows = twelve dot rows. Enough to read a shape. */
const GRAPH_ROWS = 3;

/** U+28C0 — the two bottom dots. A dim run of these is the track's floor. */
const FLOOR_GLYPH = "⣀";

function renderActivity() {
  const host = document.getElementById("activity-cores");
  const total = document.getElementById("activity-total");
  if (!host || !state.repos.length) return;

  // Measure before filling: the braille glyphs may resolve to a fallback
  // face, so the column count has to come from the real advance width — and
  // from inside a graph, which is the element that carries that font stack.
  const probeHost = host.querySelector(".core__graph") ?? host;
  const charW = measureCharWidth(probeHost);
  const trackW = probeHost.getBoundingClientRect().width || 320;
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
    // The level drives both the graph ink and the edge tick, so it lives on
    // the row rather than on the graph.
    line.dataset.level = String(level);

    const id = el("span", "core__id label", state.repos[i].designation.replace("OBJ-", ""));
    const name = el("span", "core__name label", row.repo);

    const track = el("div", "core__track");

    // The floor is chrome, not data: a span with no pushes has to read as a
    // flatline rather than as an empty box. It carries the graph's full row
    // count so the two `pre`s are the same box and the dot rows line up.
    const floor = el(
      "pre",
      "core__floor",
      "\n".repeat(GRAPH_ROWS - 1) + FLOOR_GLYPH.repeat(chars)
    );
    floor.setAttribute("aria-hidden", "true");

    const graph = el("pre", "core__graph");
    // Each track is scaled to its own peak, so a quiet object still shows
    // its shape instead of flattening against the busiest one.
    graph.textContent = brailleGraph(smoothSeries(row.series), GRAPH_ROWS).join("\n");
    graph.setAttribute("aria-hidden", "true");

    track.append(floor, graph);

    const count = el("span", "core__count", String(row.count));

    line.append(id, name, track, count);
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
  const { phase, name, illumination } = moonPhase();
  const lit = Math.round(illumination * 100);
  setValue(document.getElementById("a-moon"), name, fx, 0);
  setValue(document.getElementById("a-moonpct"), `${lit}%`, fx, 1);
  setValue(document.getElementById("a-catalog"), `${CATALOG_SIZE} STARS`, fx, 2);

  const heroCatalog = document.getElementById("hero-catalog");
  if (heroCatalog) heroCatalog.textContent = String(CATALOG_SIZE);

  // The hero HUD gets the glyph and the number; the observation deck panel
  // below carries the name. No swap animation here — the strip is chrome
  // the reader is already looking at when the page settles.
  const heroMoon = document.getElementById("hero-moon");
  if (heroMoon) heroMoon.textContent = `${moonGlyph(phase)} ${lit}%`;
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
      out.classList.remove("value--dim", "value--unresolved");
      failures = 0;
    } catch {
      failures++;
      out.textContent = "NO SIGNAL";
      // Violet, not grey: this is the page's one unacquired signal, and the
      // token exists precisely to say "not vouched for". See tokens.css.
      out.classList.add("value--unresolved");
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
