/**
 * Constants and the tracked-object curation table.
 */

export const USER = "Errnolink";
export const API = "https://api.github.com";
export const PROFILE_URL = `https://github.com/${USER}`;

/** Cache. Bump the version to invalidate every reader's stored copy. */
export const CACHE_KEY = "errnolink:gh:v1";
export const CACHE_TTL_MS = 10 * 60 * 1000;

export const FETCH_TIMEOUT_MS = 8000;

/** Keyless, CORS-enabled, HTTPS. Open-Notify is HTTP-only and would be
    mixed content on a Pages deploy, so it is not an option. */
export const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
export const ISS_POLL_MS = 10000;

/** Star catalogue camera: Orion's belt region, the richest naked-eye field. */
export const FIELD = { ra: 84, dec: 0 };

/**
 * Curated presentation for known repositories. Live API data merges OVER
 * this — the table is an overlay, not a whitelist, so a repo pushed
 * tomorrow still appears (auto-designated OBJ-06 and up).
 */
export const CURATION = {
  kanso: {
    order: 1,
    classification: "Design language // TypeScript",
    blurb:
      "An in-house design language: tokens and 41 React components distilled from " +
      "NERV-UI, Evangelion interface design, btop telemetry and cyberpunk chrome. " +
      "Two design generations behind one attribute toggle.",
  },
  seele: {
    order: 2,
    classification: "Electron terminal // TypeScript",
    blurb:
      "NERV × cyberpunk media file scanner and viewer. Electron + React + " +
      "TypeScript; a tactical control-room UI for browsing local image and video libraries.",
  },
  "nerv-geo-monitor": {
    order: 3,
    classification: "Live terminal // JavaScript",
    blurb:
      "A real-time global monitoring terminal for air quality and atmospheric " +
      "pollutants, built with a reactive NERV terminal interface and Open-Meteo telemetry.",
    uplink: "https://errnolink.github.io/nerv-geo-monitor/",
  },
  "cadence-planner": {
    order: 4,
    classification: "Planner // JavaScript",
    blurb:
      "A planning interface with its own complete design system — token-driven " +
      "theming, a nine-effect registry, contrast-verified text tiers and a density scale.",
    uplink: "https://cadence-planner-ui.vercel.app",
  },
  "omp-theme-visualiser": {
    order: 5,
    classification: "Visualiser // HTML",
    blurb: "A theme visualiser for inspecting palette and prompt configurations side by side.",
  },
  "x-discord-relay": {
    order: 6,
    classification: "Relay // JavaScript",
    blurb:
      "Relays X posts into Discord as yourself — a userscript send bar with fixupx " +
      "links, plus an optional Vencord app mode. No bot, no webhook, no token.",
  },
  "errnolink-site": {
    order: 7,
    classification: "Station // JavaScript",
    blurb:
      "This page. An orbital observation deck over a real star catalogue, with the " +
      "operator's public activity read as telemetry. No build step, no framework.",
    uplink: "https://errnolink.github.io/errnolink-site/",
  },
};

/** Language → short classification, for repos not in the table. */
export const LANG_CLASS = {
  TypeScript: "Module // TypeScript",
  JavaScript: "Module // JavaScript",
  HTML: "Document // HTML",
  CSS: "Stylesheet // CSS",
  Python: "Module // Python",
  Rust: "Module // Rust",
};
