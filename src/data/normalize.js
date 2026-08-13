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
  MemberEvent: "CREW",
  WatchEvent: "STAR",
  ForkEvent: "FORK",
  IssuesEvent: "ISSUE",
  PullRequestEvent: "PULL",
  ReleaseEvent: "RELEASE",
  PublicEvent: "DECLASSIFIED",
};

/**
 * The public events feed carries no commit counts — GitHub's payload for an
 * unauthenticated PushEvent has neither `size` nor a `commits` array, only
 * the ref and the before/head SHAs. So the deck counts what the feed
 * actually reports: pushes, and the branch each one landed on.
 */
export function normalizeEvent(raw) {
  const repo = (raw.repo?.name || "").split("/").pop() || "unknown";
  const ref = String(raw.payload?.ref || "").replace(/^refs\/(heads|tags)\//, "");
  const on = (name) => (ref ? `${name} ▸ ${ref}` : name);

  let kind = EVENT_KINDS[raw.type] ?? "EVENT";
  let detail = repo;

  if (raw.type === "PushEvent") {
    detail = on(repo);
  } else if (raw.type === "CreateEvent") {
    const what = raw.payload?.ref_type;
    if (what === "repository") {
      detail = repo;
    } else {
      kind = what === "tag" ? "TAG" : "BRANCH";
      detail = on(repo);
    }
  } else if (raw.type === "DeleteEvent") {
    detail = on(repo);
  }

  return {
    kind,
    type: raw.type,
    repo,
    at: raw.created_at,
    detail,
    push: raw.type === "PushEvent" ? 1 : 0,
  };
}

export function normalizeEvents(rawList) {
  return rawList.map(normalizeEvent);
}

/**
 * Pushes per repository, from the public event feed.
 *
 * Deliberately not a time series. The unauthenticated feed returns only the
 * last thirty events, which for an active week reach back about two days —
 * a twelve-week chart drawn from it is ten empty columns that look like
 * inactivity but are really just the edge of the data. Distribution across
 * the tracked objects is something this feed can actually answer.
 *
 * @returns {{repo:string, count:number}[]} ordered by the caller's repo list
 */
export function pushesByRepo(events, repos) {
  const counts = new Map();
  for (const ev of events) {
    if (!ev.push) continue;
    counts.set(ev.repo, (counts.get(ev.repo) ?? 0) + ev.push);
  }
  return repos.map((r) => ({ repo: r.name, count: counts.get(r.name) ?? 0 }));
}

/** Oldest instant the feed still covers — the honest edge of the window. */
export function feedSince(events) {
  const times = events.map((e) => new Date(e.at).getTime()).filter((t) => !Number.isNaN(t));
  return times.length ? new Date(Math.min(...times)) : null;
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
