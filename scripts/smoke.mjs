/**
 * Smoke test — load the site in a real browser and assert the contract.
 *
 * Adapted from the kanso playground scripts: `playwright-core` driving
 * whatever Chromium is already on the machine (see chrome.mjs), so nothing
 * is downloaded and nothing is pinned.
 *
 * Three passes, because the interesting failure modes are not on the happy
 * path: a normal load, a load with the GitHub API blocked (the fallback
 * ladder must reach the baked snapshot), and a reduced-motion load.
 *
 *   node scripts/smoke.mjs [url]
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChrome } from "./chrome.mjs";

const URL_ = process.argv[2] || "http://localhost:5180";
const OUT = resolve(fileURLToPath(new URL("../.server-logs", import.meta.url)));

const SECTIONS = ["hero", "dossier", "tracking", "telemetry", "comms"];

let failures = 0;
function check(ok, label, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/** Collect anything the page reports as broken, with a URL we can act on. */
function instrument(page, errors) {
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // The browser's generic resource-failure line names no URL, so it cannot
    // be acted on and cannot be exempted per host. The response listener
    // below reports every HTTP failure *with* its URL, so nothing is lost by
    // dropping this one — and a rate-limited GitHub stops being a red run.
    if (/Failed to load resource/.test(m.text())) return;
    errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    // A bare "Failed to load resource" names no URL, which makes it
    // unactionable. Name it here.
    //
    // The third-party telemetry endpoints are exempt: a rate-limited GitHub
    // or a silent ISS API is a path the site is built to survive, and the
    // badge assertion already proves the fallback fired.
    if (r.status() < 400) return;
    if (/api\.github\.com|wheretheiss\.at/.test(r.url())) return;
    errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: resolveChrome() });

  /* ── Pass 1: normal load ───────────────────────────────────────────── */
  console.log("\n[1] NORMAL LOAD");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    instrument(page, errors);

    await page.goto(URL_, { waitUntil: "networkidle" });
    await page.waitForTimeout(600); // let the boot overlay finish and hydration settle

    const title = await page.title();
    check(/ERRNOLINK/.test(title), "title names ERRNOLINK", title);

    for (const id of SECTIONS) {
      check(await page.locator(`#${id}`).count() === 1, `section #${id} present`);
    }

    const cards = await page.locator(".tracked-object").count();
    check(cards >= 5, "at least 5 tracked objects", `found ${cards}`);

    const feed = (await page.locator("#feed-status").textContent())?.trim() ?? "";
    check(/LIVE|CACHED|SNAPSHOT/.test(feed), "telemetry badge reports a source", feed);

    const jd = (await page.locator("#clock-jd").textContent())?.trim() ?? "";
    check(/^\d{7}\.\d+$/.test(jd), "julian date ticker is live", jd);

    const siteErrors = await page.evaluate(() => window.__siteErrors ?? ["hook missing"]);
    check(siteErrors.length === 0, "no runtime errors", siteErrors.join(" | "));
    check(errors.length === 0, "no console/network errors", errors.join(" | "));

    await page.screenshot({ path: resolve(OUT, "smoke.png"), fullPage: true });
    await ctx.close();
  }

  /* ── Pass 2: GitHub API blocked — the fallback must hold ───────────── */
  console.log("\n[2] FORCED FALLBACK (api.github.com aborted, empty storage)");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    instrument(page, errors);
    await page.route("**://api.github.com/**", (r) => r.abort());
    await page.route("**://api.wheretheiss.at/**", (r) => r.abort());

    await page.goto(URL_, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const feed = (await page.locator("#feed-status").textContent())?.trim() ?? "";
    check(/SNAPSHOT/.test(feed), "badge falls back to SNAPSHOT", feed);

    const cards = await page.locator(".tracked-object").count();
    check(cards >= 5, "tracked objects still render offline", `found ${cards}`);

    const iss = (await page.locator("#a-iss").textContent())?.trim() ?? "";
    check(/NO SIGNAL/.test(iss), "ISS readout degrades cleanly", iss);

    const siteErrors = await page.evaluate(() => window.__siteErrors ?? ["hook missing"]);
    check(siteErrors.length === 0, "no runtime errors offline", siteErrors.join(" | "));

    await page.screenshot({ path: resolve(OUT, "smoke-offline.png"), fullPage: true });
    await ctx.close();
  }

  /* ── Pass 3: reduced motion — everything must still be there ───────── */
  console.log("\n[3] REDUCED MOTION");
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    const errors = [];
    instrument(page, errors);

    await page.goto(URL_, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const bootVisible = await page.locator("#boot").isVisible().catch(() => false);
    check(!bootVisible, "boot overlay skipped under reduced motion");

    // Sections reveal on scroll; under reduced motion they must be visible
    // without any animation having run.
    const heroVisible = await page.locator(".hero__stamp").isVisible();
    check(heroVisible, "wordmark present under reduced motion");

    const siteErrors = await page.evaluate(() => window.__siteErrors ?? ["hook missing"]);
    check(siteErrors.length === 0, "no runtime errors", siteErrors.join(" | "));
    check(errors.length === 0, "no console/network errors", errors.join(" | "));

    await page.screenshot({ path: resolve(OUT, "smoke-reduced.png"), fullPage: true });
    await ctx.close();
  }

  await browser.close();

  console.log(`\n${failures === 0 ? "SMOKE OK" : `SMOKE FAILED — ${failures} assertion(s)`}`);
  console.log(`shots → ${OUT}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
