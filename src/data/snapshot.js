/**
 * Baked fallback, already in normalized form.
 *
 * Served when the GitHub API is unreachable or rate-limited and no cache
 * exists. Shipped as a module rather than JSON so it needs no fetch of its
 * own — the one source that cannot itself fail.
 *
 * Captured 2026-08-13.
 */

export const SNAPSHOT_DATE = "2026-08-13";

/** Commits are counted via the search API, which the browser does not call. */
export const SNAPSHOT_COMMITS = 88;

export const snapshotProfile = {
  login: "Errnolink",
  name: "Errnolink",
  location: "India",
  followers: 4,
  publicRepos: 5,
  createdAt: "2021-04-22T16:19:31Z",
  avatarUrl: "https://avatars.githubusercontent.com/u/83027938?v=4",
};

export const snapshotRepos = [
  {
    name: "kanso",
    description:
      "Kanso — 簡素. An in-house design language: tokens + 41 React components " +
      "distilled from NERV-UI, Evangelion interface design, btop telemetry and " +
      "cyberpunk chrome. Two design generations behind one attribute toggle.",
    language: "TypeScript",
    pushedAt: "2026-08-13T01:00:30Z",
    stars: 0,
    htmlUrl: "https://github.com/Errnolink/kanso",
    homepage: "",
  },
  {
    name: "seele",
    description:
      "NERV × Cyberpunk media file scanner and viewer — Electron + React + " +
      "TypeScript. Tactical control-room UI for browsing local image/video libraries.",
    language: "TypeScript",
    pushedAt: "2026-08-12T18:39:07Z",
    stars: 0,
    htmlUrl: "https://github.com/Errnolink/seele",
    homepage: "",
  },
  {
    name: "nerv-geo-monitor",
    description:
      "A real-time global monitoring terminal for air quality and atmospheric " +
      "pollutants, built with a reactive NERV terminal interface and Open-Meteo telemetry.",
    language: "JavaScript",
    pushedAt: "2026-08-13T01:19:27Z",
    stars: 0,
    htmlUrl: "https://github.com/Errnolink/nerv-geo-monitor",
    homepage: "https://errnolink.github.io/nerv-geo-monitor/",
  },
  {
    name: "cadence-planner",
    description: "",
    language: "JavaScript",
    pushedAt: "2026-08-13T01:17:36Z",
    stars: 0,
    htmlUrl: "https://github.com/Errnolink/cadence-planner",
    homepage: "https://cadence-planner-ui.vercel.app",
  },
  {
    name: "omp-theme-visualiser",
    description: "",
    language: "HTML",
    pushedAt: "2026-08-13T01:17:44Z",
    stars: 0,
    htmlUrl: "https://github.com/Errnolink/omp-theme-visualiser",
    homepage: "",
  },
];

/**
 * Representative recent activity, reflecting the captured 24 push / 5 create
 * event mix. Dates are real; commit counts are the recorded per-event sizes.
 */
export const snapshotEvents = [
  { kind: "PUSH", type: "PushEvent", repo: "nerv-geo-monitor", at: "2026-08-13T01:19:27Z", detail: "nerv-geo-monitor — 2 commits", commits: 2 },
  { kind: "PUSH", type: "PushEvent", repo: "omp-theme-visualiser", at: "2026-08-13T01:17:44Z", detail: "omp-theme-visualiser — 1 commit", commits: 1 },
  { kind: "PUSH", type: "PushEvent", repo: "cadence-planner", at: "2026-08-13T01:17:36Z", detail: "cadence-planner — 1 commit", commits: 1 },
  { kind: "PUSH", type: "PushEvent", repo: "kanso", at: "2026-08-13T01:00:30Z", detail: "kanso — 3 commits", commits: 3 },
  { kind: "PUSH", type: "PushEvent", repo: "seele", at: "2026-08-12T18:39:07Z", detail: "seele — 4 commits", commits: 4 },
  { kind: "NEW OBJECT", type: "CreateEvent", repo: "omp-theme-visualiser", at: "2026-08-12T17:02:11Z", detail: "omp-theme-visualiser", commits: 0 },
  { kind: "PUSH", type: "PushEvent", repo: "kanso", at: "2026-08-11T22:14:03Z", detail: "kanso — 5 commits", commits: 5 },
  { kind: "NEW OBJECT", type: "CreateEvent", repo: "kanso", at: "2026-08-08T09:41:52Z", detail: "kanso", commits: 0 },
  { kind: "PUSH", type: "PushEvent", repo: "seele", at: "2026-08-05T20:33:19Z", detail: "seele — 6 commits", commits: 6 },
  { kind: "PUSH", type: "PushEvent", repo: "nerv-geo-monitor", at: "2026-07-29T14:08:44Z", detail: "nerv-geo-monitor — 3 commits", commits: 3 },
  { kind: "PUSH", type: "PushEvent", repo: "cadence-planner", at: "2026-07-21T11:27:36Z", detail: "cadence-planner — 4 commits", commits: 4 },
  { kind: "NEW OBJECT", type: "CreateEvent", repo: "cadence-planner", at: "2026-07-14T08:55:02Z", detail: "cadence-planner", commits: 0 },
];
