/**
 * Operator dossier — the profile panel.
 */

import { missionDay } from "../data/astro.js";
import { SNAPSHOT_COMMITS } from "../data/snapshot.js";
import { state } from "../state.js";
import { setValue } from "./reveal.js";

export function renderDossier() {
  const p = state.profile;
  if (!p) return;
  const fx = state.fx;

  const avatar = document.getElementById("dossier-avatar");
  if (avatar && p.avatarUrl) {
    avatar.src = p.avatarUrl;
    avatar.alt = `${p.login}'s GitHub avatar`;
    // A missing portrait should read as "no image on file", not a broken icon.
    avatar.addEventListener(
      "error",
      () => {
        avatar.src =
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="132">
               <rect width="132" height="132" fill="#0a0a0c"/>
               <rect x="8" y="8" width="116" height="116" fill="none" stroke="#1f1f23"/>
               <text x="66" y="72" text-anchor="middle" font-family="monospace"
                     font-size="11" fill="#6a6a65">NO IMAGE</text>
             </svg>`
          );
      },
      { once: true }
    );
  }

  const rows = [
    ["d-login", p.login],
    ["d-location", (p.location || "UNKNOWN").toUpperCase()],
    ["d-since", (p.createdAt || "").slice(0, 10)],
    ["d-missionday", p.createdAt ? String(missionDay(p.createdAt)) : "—"],
    ["d-repos", String(state.repos.length || p.publicRepos)],
    ["d-followers", String(p.followers)],
    // Commit totals need the search API, which this page does not call from
    // the browser; the captured figure is the honest number to show.
    ["d-commits", `${SNAPSHOT_COMMITS}+`],
  ];

  rows.forEach(([id, value], i) => setValue(document.getElementById(id), value, fx, i));

  const source = document.getElementById("dossier-source");
  if (source) source.textContent = `GITHUB / USERS / ${p.login.toUpperCase()}`;
}
