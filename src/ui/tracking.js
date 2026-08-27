/**
 * Tracked objects — the repository grid.
 *
 * Rendered from the DOM API rather than an HTML string: descriptions come
 * from a remote API, and they are text, not markup.
 */

import { state } from "../state.js";

/**
 * Contact recency → LED state.
 *
 * Every card used to carry `led--nominal`, which meant seven identical green
 * squares reporting nothing. A light that never changes teaches the reader to
 * ignore it, and it spends the ramp's credibility on decoration. The light
 * now says the one thing the card knows and the date alone does not make
 * instant: how cold this object has gone.
 *
 * `--static` because a blink is an alarm and an alarm is singular — seven of
 * them at once is a strobe. See base.css.
 */
const DAY_MS = 86400000;

function contactState(pushedAt) {
  const t = Date.parse(pushedAt || "");
  if (!Number.isFinite(t)) {
    return { cls: "led led--unresolved led--static", note: "Contact unknown" };
  }
  const days = Math.floor((Date.now() - t) / DAY_MS);
  if (days <= 7) return { cls: "led led--nominal led--static", note: `Active — ${days}d since contact` };
  if (days <= 30) return { cls: "led led--caution led--static", note: `Quiet — ${days}d since contact` };
  return { cls: "led led--idle led--static", note: `Dormant — ${days}d since contact` };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function readout(label, value) {
  const wrap = el("span", "readout");
  wrap.append(el("span", "readout__label", label), el("span", "readout__value", value));
  return wrap;
}

function link(href, text, extraClass) {
  const a = el("a", `link-ext${extraClass ? ` ${extraClass}` : ""}`, text);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function card(repo, i) {
  const li = el("li", "tracked-object chamfer");
  li.style.setProperty("--i", String(i));

  const brackets = el("span", "brackets");
  brackets.setAttribute("aria-hidden", "true");
  for (let k = 0; k < 4; k++) brackets.append(el("i"));

  const lock = el("span", "obj__lock label", "TRK LOCK");
  lock.setAttribute("aria-hidden", "true");

  const head = el("div", "obj__head");
  const contact = contactState(repo.pushedAt);
  const led = el("span", contact.cls);
  // The light is a second encoding of the CONTACT date beside it, so the
  // title is an affordance rather than the only way to read the state.
  led.title = contact.note;
  head.append(
    el("span", "obj__desig label", repo.designation),
    el("h3", "obj__name stamp", repo.name.toUpperCase()),
    led
  );

  const foot = el("div", "obj__foot");
  foot.append(
    readout("Lang", repo.language),
    readout("★", String(repo.stars)),
    readout("Contact", (repo.pushedAt || "").slice(0, 10) || "—")
  );

  const links = el("div", "obj__links");
  links.append(link(repo.htmlUrl, "SOURCE"));
  if (repo.uplink) links.append(link(repo.uplink, "LIVE UPLINK", "obj__uplink"));

  li.append(
    brackets,
    lock,
    head,
    el("p", "obj__class label", repo.classification),
    el("p", "obj__desc", repo.blurb),
    foot,
    links
  );
  return li;
}

/**
 * The survey plate. It is a grid cell, not a card, so it has to survive the
 * `replaceChildren` that swaps the baked objects for live ones — it is
 * lifted out first and re-appended last, which also keeps it in the final
 * row where `grid-column-end: -1` can fill the orphan gap.
 */
function paintPlate(repos) {
  const set = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  set("plate-count", String(repos.length));
  const latest = repos
    .map((r) => (r.pushedAt || "").slice(0, 10))
    .filter(Boolean)
    .sort()
    .pop();
  set("plate-last", latest || "—");
}

/**
 * Size the plate to the gap the cards leave in the final row.
 *
 * The grid is `repeat(auto-fill, minmax(330px, 1fr))`, so the column count
 * is a resolved-layout fact, not something the stylesheet can name. CSS can
 * only anchor the plate to the last line, which spans one column and leaves
 * the middle of a 3+3+1 row empty — one orphan traded for two. Reading the
 * resolved track list is the only honest way to know how many columns the
 * last row actually left over.
 */
function sizePlate(list, count) {
  const plate = document.getElementById("objects-plate");
  if (!plate) return;

  const cols = getComputedStyle(list).gridTemplateColumns.split(" ").filter(Boolean).length;
  if (cols < 2) {
    plate.style.gridColumn = "";
    return;
  }
  const trailing = count % cols;
  // An exactly-filled grid leaves no gap, so the plate takes a full row of
  // its own rather than hanging one cell off the end.
  plate.style.gridColumn = `span ${trailing === 0 ? cols : cols - trailing}`;
}

export function renderTracking() {
  const list = document.getElementById("objects");
  if (!list || !state.repos.length) return;

  const plate = document.getElementById("objects-plate");

  const frag = document.createDocumentFragment();
  state.repos.forEach((repo, i) => frag.append(card(repo, i)));
  if (plate) frag.append(plate);
  list.replaceChildren(frag);

  paintPlate(state.repos);
  sizePlate(list, state.repos.length);

  if (!list.dataset.plateWatched) {
    list.dataset.plateWatched = "1";
    let queued = false;
    window.addEventListener(
      "resize",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          sizePlate(list, state.repos.length);
          queued = false;
        });
      },
      { passive: true }
    );
  }
}
