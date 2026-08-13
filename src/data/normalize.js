/**
 * Raw GitHub API shapes → the view models the UI renders.
 *
 * Everything downstream reads these shapes only, so the snapshot fallback
 * can be authored in the same form and the render path never learns which
 * source it is drawing.
 */

import { CURATION, LANG_CLASS } from "../config.js";

export function normalizeProfile(raw) {
  return {
    login: raw.login,
    name: raw.name || raw.login,
    location: raw.location || "",
    followers: raw.followers ?? 0,
    publicRepos: raw.public_repos ?? 0,
    createdAt: raw.created_at,
    avatarUrl: raw.avatar_url,
  };
}

export function normalizeRepo(raw) {
  return {
    name: raw.name,
    description: raw.description || "",
    language: raw.language || "—",
    pushedAt: raw.pushed_at,
    stars: raw.stargazers_count ?? 0,
    htmlUrl: raw.html_url,
    homepage: raw.homepage || "",
  };
}

export function normalizeRepos(rawList) {
  return rawList.filter((r) => !r.fork).map(normalizeRepo);
}

/**
 * Order repos the way the curation table asks, then everything else by most
 * recently pushed, and stamp each with its OBJ designation.
 */
export function decorateRepos(repos) {
  const known = [];
  const rest = [];
  for (const repo of repos) {
    (CURATION[repo.name] ? known : rest).push(repo);
  }
  known.sort((a, b) => CURATION[a.name].order - CURATION[b.name].order);
  rest.sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1));

  return [...known, ...rest].map((repo, i) => {
    const cur = CURATION[repo.name] ?? {};
    return {
      ...repo,
      designation: `OBJ-${String(i + 1).padStart(2, "0")}`,
      classification:
        cur.classification ?? LANG_CLASS[repo.language] ?? `Object // ${repo.language}`,
      blurb: cur.blurb || repo.description || "No description on record.",
      uplink: cur.uplink || repo.homepage || "",
    };
  });
}

const EVENT_KINDS = {
  PushEvent: "PUSH",
  CreateEvent: "NEW OBJECT",
  DeleteEvent: "PURGE",
  WatchEvent: "STAR",
  ForkEvent: "FORK",
  IssuesEvent: "ISSUE",
  PullRequestEvent: "PULL",
  ReleaseEvent: "RELEASE",
  PublicEvent: "DECLASSIFIED",
};

export function normalizeEvent(raw) {
  const repo = (raw.repo?.name || "").split("/").pop() || "unknown";
  const kind = EVENT_KINDS[raw.type] ?? "EVENT";

  let detail = repo;
  if (raw.type === "PushEvent") {
    const n = raw.payload?.size ?? raw.payload?.commits?.length ?? 0;
    detail = `${repo} — ${n} commit${n === 1 ? "" : "s"}`;
  } else if (raw.type === "CreateEvent") {
    const what = raw.payload?.ref_type === "repository" ? repo : `${repo} / ${raw.payload?.ref ?? ""}`;
    detail = what;
  }

  return {
    kind,
    type: raw.type,
    repo,
    at: raw.created_at,
    detail,
    commits: raw.type === "PushEvent" ? (raw.payload?.size ?? 0) : 0,
  };
}

export function normalizeEvents(rawList) {
  return rawList.map(normalizeEvent);
}

/**
 * Twelve weekly commit buckets ending this week.
 *
 * The public events feed reaches back about 90 days, which is very nearly
 * the window — weeks with no surviving events read as zero, which is honest:
 * the feed is the only public commit signal without authentication.
 */
export function activityBuckets(events, now = new Date()) {
  const WEEKS = 12;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = new Array(WEEKS).fill(0);
  const end = now.getTime();

  for (const ev of events) {
    if (!ev.commits) continue;
    const age = end - new Date(ev.at).getTime();
    if (age < 0) continue;
    const idx = WEEKS - 1 - Math.floor(age / weekMs);
    if (idx >= 0 && idx < WEEKS) buckets[idx] += ev.commits;
  }
  return buckets;
}

/** Map a bucket onto the six-step severity ramp — magnitude, not judgement. */
export function rampLevel(value, max) {
  if (!max || value <= 0) return 0;
  const frac = value / max;
  if (frac <= 0.2) return 1;
  if (frac <= 0.4) return 2;
  if (frac <= 0.6) return 3;
  if (frac <= 0.85) return 4;
  return 5;
}
