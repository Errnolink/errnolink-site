/**
 * Locate a Chromium-family executable for the browser scripts.
 *
 * `playwright-core` deliberately ships no browser binary, so every script
 * here has to point at one. This used to be a hardcoded candidate list
 * duplicated across three files, headed by an absolute path containing the
 * author's Windows username and a pinned Chromium build number — which
 * resolved on exactly one machine and leaked a username into a public repo.
 *
 * Order: an explicit `CHROME_PATH` wins; then a locally-downloaded Chromium
 * under the user's home (version discovered, not pinned); then the usual
 * system installs for the current platform.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

/** Chromium downloaded by puppeteer/omp — the directory is version-stamped,
    so read whatever is actually there rather than pinning a build. */
function downloadedChromium() {
  const roots = [
    join(homedir(), ".omp", "puppeteer", "chrome"),
    join(homedir(), ".cache", "puppeteer", "chrome"),
  ];
  const leaves = [
    ["chrome-win64", "chrome.exe"],
    ["chrome-win", "chrome.exe"],
    ["chrome-linux64", "chrome"],
    ["chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
    ["chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"],
  ];

  const found = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    let builds;
    try {
      builds = readdirSync(root);
    } catch {
      continue;
    }
    // Newest build first — these directories sort usefully by name
    // (`win64-150.0.7871.24`), and a stale one is still better than none.
    for (const build of builds.sort().reverse()) {
      for (const leaf of leaves) {
        const p = join(root, build, ...leaf);
        if (existsSync(p)) found.push(p);
      }
    }
  }
  return found;
}

function systemInstalls() {
  const env = process.env;
  switch (platform()) {
    case "win32": {
      const roots = [
        env.PROGRAMFILES,
        env["PROGRAMFILES(X86)"],
        env.LOCALAPPDATA,
      ].filter(Boolean);
      const rel = [
        ["Google", "Chrome", "Application", "chrome.exe"],
        ["Microsoft", "Edge", "Application", "msedge.exe"],
      ];
      return roots.flatMap((root) => rel.map((r) => join(root, ...r)));
    }
    case "darwin":
      return [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      ];
    default:
      return [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/microsoft-edge",
        "/snap/bin/chromium",
      ];
  }
}

/**
 * @returns {string} absolute path to a Chromium-family executable
 * @throws if none is found — the message names `CHROME_PATH`, because that
 *         is the one thing a reader can act on.
 */
export function resolveChrome() {
  const explicit = process.env.CHROME_PATH;
  if (explicit) {
    // An explicit override that does not exist is a typo, not a reason to
    // silently launch some other browser and report confusing results.
    if (!existsSync(explicit)) {
      throw new Error(`CHROME_PATH is set to "${explicit}", which does not exist.`);
    }
    return explicit;
  }

  for (const p of [...downloadedChromium(), ...systemInstalls()]) {
    if (existsSync(p)) return p;
  }

  throw new Error(
    "No Chrome/Chromium/Edge executable found.\n" +
      "Set CHROME_PATH to one, e.g.\n" +
      '  CHROME_PATH="/usr/bin/google-chrome" node scripts/smoke.mjs'
  );
}
