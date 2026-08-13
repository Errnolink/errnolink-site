/**
 * Shared mutable state. Written once by the data layer, read by the UI
 * modules. Deliberately boring — there is not enough state here to justify
 * a store.
 */

export const state = {
  /** "live" | "cache" | "snapshot" — the worst source across all endpoints. */
  source: "snapshot",
  /** Epoch ms the served data was fetched, when it came from a cache. */
  fetchedAt: null,
  /** Why we fell back, when we did: "rate-limited" | "offline" | null. */
  reason: null,
  /** Epoch ms the GitHub rate limit resets, when known. */
  rateReset: null,

  profile: null,
  repos: [],
  events: [],

  /** Effects are live: neither reduced-motion nor the FX toggle is off. */
  fx: true,
};

export function setState(patch) {
  Object.assign(state, patch);
}
