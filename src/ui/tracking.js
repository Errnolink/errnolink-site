/**
 * Tracked objects — the repository grid.
 *
 * Rendered from the DOM API rather than an HTML string: descriptions come
 * from a remote API, and they are text, not markup.
 */

import { state } from "../state.js";

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
  head.append(
    el("span", "obj__desig label", repo.designation),
    el("h3", "obj__name stamp", repo.name.toUpperCase()),
    el("span", "led led--nominal")
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

export function renderTracking() {
  const list = document.getElementById("objects");
  if (!list || !state.repos.length) return;

  const frag = document.createDocumentFragment();
  state.repos.forEach((repo, i) => frag.append(card(repo, i)));
  list.replaceChildren(frag);
}
