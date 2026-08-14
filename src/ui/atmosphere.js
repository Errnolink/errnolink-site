/**
 * Scanlines on their own canvas.
 *
 * Why a canvas and not CSS — the full write-up lives in atmosphere.css next
 * to the element it styles. The short version: the overlay used to be CSS
 * paint on a fixed, full-viewport layer. Hovering a tracked object promotes
 * the card to its own compositor layer, which forces the compositor to
 * re-raster the overlay's CSS paint on top of it — at a fractional raster
 * scale that a 1px line on a 4px period does not survive. The half-blank
 * texture stayed cached for the hover, which read as "the scanlines freeze
 * halfway down the screen". Pre-promotion and tiling the background both
 * failed on real hardware, because the re-raster is of the paint itself.
 *
 * A canvas is a GPU texture: the compositor never re-rasterizes it. The
 * only repaint is scripted, and this script repaints only on resize — there
 * is nothing left for a hover to break. Lines are drawn in device pixels by
 * construction, so the pattern is crisp at every DPR, fractional included.
 */

export function initScanlines(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let timer = 0;

  function paint() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(window.innerWidth * dpr));
    const h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    // One dark line, 1 CSS px thick, every 4 CSS px — rounded to device
    // pixels so the pattern always lands on them.
    const period = Math.max(2, Math.round(4 * dpr));
    const weight = Math.max(1, Math.round(1 * dpr));
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    for (let y = 0; y < h; y += period) {
      ctx.fillRect(0, y, w, weight);
    }
  }

  paint();

  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(paint, 100);
  });

  return { paint };
}
