/**
 * Per-section screenshots, so a UI regression is reviewable without
 * scrolling a 10k-pixel full-page image.
 *
 *   node scripts/shots.mjs [url] [...sectionIds]
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChrome } from "./chrome.mjs";

const URL_ = process.argv[2] || "http://localhost:5180";
const IDS = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["hero", "dossier", "tracking", "telemetry", "comms"];

const OUT = resolve(fileURLToPath(new URL("../.server-logs/shots", import.meta.url)));

const browser = await chromium.launch({ executablePath: resolveChrome() });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});

await mkdir(OUT, { recursive: true });
await page.goto(URL_, { waitUntil: "networkidle" });

// Text metrics only match a real load once the webfonts have arrived.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

for (const id of IDS) {
  const el = page.locator(`#${id}`);
  if ((await el.count()) === 0) {
    console.log(`  skip  #${id} (not found)`);
    continue;
  }
  // Scroll it into view so the IntersectionObserver reveal has actually run.
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await el.screenshot({ path: resolve(OUT, `${id}.png`) });
  console.log(`  shot  #${id}`);
}

// A mobile pass, same routine.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(OUT, "mobile-full.png"), fullPage: true });
console.log("  shot  mobile-full");

console.log(errors.length ? `\nERRORS:\n${errors.join("\n")}` : "\nno page errors");
console.log(`shots → ${OUT}`);

await browser.close();
