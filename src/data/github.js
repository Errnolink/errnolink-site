/**
 * GitHub telemetry with a fallback ladder.
 *
 * Per endpoint, in order:
 *   1. fresh cache   (< TTL)                → source "cache"
 *   2. live fetch                           → source "live"
 *   3. stale cache   (any age)              → source "cache"
 *   4. baked snapshot                       → source "snapshot"
 *
 * The page's reported source is the worst of the three, so the badge never
 * claims more freshness than the weakest panel actually has.
 */

import { API, CACHE_KEY, CACHE_TTL_MS, FETCH_TIMEOUT_MS, USER } from "../config.js";
import {
  decorateRepos,
  normalizeEvents,
  normalizeProfile,
  normalizeRepos,
} from "./normalize.js";
import { snapshotEvents, snapshotProfile, snapshotRepos } from "./snapshot.js";

const RANK = { live: 0, cache: 1, snapshot: 2 };

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.v === 1 ? obj : null;
  } catch {
    // Private mode, disabled storage, corrupt JSON — all mean "no cache".
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, ...entry }));
  } catch {
    /* Storage is a nicety here, never a requirement. */
  }
}

async function get(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      const limited = (res.status === 403 || res.status === 429) && remaining === "0";
      const err = new Error(`GitHub responded ${res.status}`);
      err.reason = limited ? "rate-limited" : "offline";
      err.rateReset = limited && reset ? Number(reset) * 1000 : null;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{source:string, fetchedAt:number|null, reason:string|null,
 *   rateReset:number|null, profile:object, repos:object[], events:object[]}>}
 */
export async function loadGitHub() {
  const cache = readCache();
  const cacheFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

  if (cacheFresh) {
    return {
      source: "cache",
      fetchedAt: cache.fetchedAt,
      reason: null,
      rateReset: null,
      profile: cache.profile,
      repos: decorateRepos(cache.repos),
      events: cache.events,
    };
  }

  const settled = await Promise.allSettled([
    get(`/users/${USER}`),
    get(`/users/${USER}/repos?per_page=100&sort=pushed`),
    get(`/users/${USER}/events/public?per_page=30`),
  ]);

  let worst = "live";
  let reason = null;
  let rateReset = null;

  const degrade = (level, err) => {
    if (RANK[level] > RANK[worst]) worst = level;
    if (err && !reason) {
      reason = err.reason ?? "offline";
      rateReset = err.rateReset ?? null;
    }
  };

  /** Resolve one endpoint through the rest of the ladder. */
  const resolve = (result, normalize, cached, snapshot) => {
    if (result.status === "fulfilled") {
      try {
        return normalize(result.value);
      } catch (err) {
        degrade("snapshot", err);
        return snapshot;
      }
    }
    degrade(cached ? "cache" : "snapshot", result.reason);
    return cached ?? snapshot;
  };

  const profile = resolve(settled[0], normalizeProfile, cache?.profile, snapshotProfile);
  const repos = resolve(settled[1], normalizeRepos, cache?.repos, snapshotRepos);
  const events = resolve(settled[2], normalizeEvents, cache?.events, snapshotEvents);

  const fetchedAt = worst === "live" ? Date.now() : (cache?.fetchedAt ?? null);

  if (worst === "live") {
    writeCache({ fetchedAt, profile, repos, events });
  }

  return {
    source: worst,
    fetchedAt,
    reason,
    rateReset,
    profile,
    repos: decorateRepos(repos),
    events,
  };
}
