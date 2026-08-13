/**
 * The cold open.
 *
 * Runs at most once per session, never under reduced motion or FX off, and
 * any key or click ends it immediately. Nothing behind it is blocked: the
 * page underneath is already laid out and already fetching.
 */

import { CATALOG_SIZE } from "../data/stars.js";

const SESSION_KEY = "errnolink:boot";

const LINES = [
  { text: "> ERRNOLINK ORBITAL OBSERVATION STATION", delay: 0 },
  { text: "> KANSO SHELL v0.3 ................ <ok>OK</ok>", delay: 140 },
  { text: `> STAR CATALOG .......... <num>${CATALOG_SIZE}</num> OBJECTS`, delay: 120 },
  { text: "> SIDEREAL CLOCK SYNC ............ <ok>OK</ok>", delay: 120 },
  { text: "> GITHUB UPLINK /users/Errnolink .. <prog></prog>", delay: 140 },
  { text: "> TRACKED OBJECTS ................ <num>5</num>", delay: 120 },
  { text: "> ALL SYSTEMS NOMINAL", delay: 160, cls: "ok" },
];

function markup(line) {
  return line
    .replace(/<ok>(.*?)<\/ok>/g, '<span class="ok">$1</span>')
    .replace(/<num>(.*?)<\/num>/g, '<span class="num">$1</span>')
    .replace(/<prog><\/prog>/g, '<span class="prog">▯▯▯▯▯▯▯▯</span>');
}

function sessionDone() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* Storage refused; the boot simply runs again next load. */
  }
}

/**
 * @param {boolean} fx effects are live
 * @returns {Promise<boolean>} whether the sequence actually played
 */
export function runBoot(fx) {
  const overlay = document.getElementById("boot");
  const log = document.getElementById("boot-log");
  const skip = document.getElementById("boot-skip");
  if (!overlay || !log) return Promise.resolve(false);

  if (!fx || sessionDone()) {
    markDone();
    overlay.remove();
    return Promise.resolve(false);
  }

  markDone();
  overlay.hidden = false;

  return new Promise((resolve) => {
    const timers = [];
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      document.removeEventListener("keydown", finish);
      document.removeEventListener("pointerdown", finish);
      overlay.classList.add("boot--out");
      const done = () => {
        overlay.remove();
        resolve(true);
      };
      overlay.addEventListener("animationend", done, { once: true });
      // If the exit animation never fires (effects killed mid-run), do not
      // leave a black overlay covering the site.
      setTimeout(done, 400);
    };

    document.addEventListener("keydown", finish);
    document.addEventListener("pointerdown", finish);
    skip?.addEventListener("click", finish);

    let t = 0;
    LINES.forEach((line) => {
      t += line.delay;
      timers.push(
        setTimeout(() => {
          const div = document.createElement("div");
          if (line.cls) div.className = line.cls;
          div.innerHTML = markup(line.text);
          log.appendChild(div);

          // Fill the uplink meter in place, as text glyphs.
          const prog = div.querySelector(".prog");
          if (prog) {
            let filled = 0;
            const step = setInterval(() => {
              filled++;
              prog.textContent = "▮".repeat(filled) + "▯".repeat(8 - filled);
              if (filled >= 6) clearInterval(step);
            }, 60);
            timers.push(step);
          }
        }, t)
      );
    });

    // Cursor, then the wordmark stamp, then out.
    t += 200;
    timers.push(
      setTimeout(() => {
        const cur = document.createElement("div");
        cur.className = "boot__cursor";
        cur.textContent = "█";
        log.appendChild(cur);
      }, t)
    );

    t += 500;
    timers.push(
      setTimeout(() => {
        overlay.classList.add("boot--dim", "boot--stamped");
        document.getElementById("boot-stamp")?.classList.add("gl-run");
      }, t)
    );

    t += 900;
    timers.push(setTimeout(finish, t));
  });
}
