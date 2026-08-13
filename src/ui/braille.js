/**
 * Braille-character graphs, the way btop draws them.
 *
 * A braille cell packs 2 columns × 4 rows of dots into one glyph, so a run
 * of text carries twice the horizontal resolution of block characters and
 * four times the vertical. The dot-to-bit mapping is fixed by Unicode:
 *
 *     1 4       bit0 bit3
 *     2 5   →   bit1 bit4
 *     3 6       bit2 bit5
 *     7 8       bit6 bit7
 *
 * and the glyph is U+2800 plus that bitmask.
 */

const LEFT = [0x01, 0x02, 0x04, 0x40];
const RIGHT = [0x08, 0x10, 0x20, 0x80];

/**
 * Render a series as braille rows, bottom-aligned like a histogram.
 *
 * @param {number[]} values one entry per dot column (2 per character)
 * @param {number} rows character rows tall; each is 4 dot rows
 * @param {number} [max] value mapped to full height; defaults to the peak
 * @returns {string[]} one string per row, top row first
 */
export function brailleGraph(values, rows = 2, max = 0) {
  const dotRows = rows * 4;
  const peak = max || Math.max(...values, 1);
  const heights = values.map((v) =>
    Math.min(dotRows, Math.round((Math.max(0, v) / peak) * dotRows))
  );

  const out = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < values.length; c += 2) {
      let mask = 0;
      for (let side = 0; side < 2; side++) {
        const h = heights[c + side] ?? 0;
        if (h === 0) continue;
        const bits = side === 0 ? LEFT : RIGHT;
        for (let d = 0; d < 4; d++) {
          // Distance of this dot row from the bottom of the whole graph.
          const fromBottom = dotRows - (r * 4 + d);
          if (h >= fromBottom) mask |= bits[d];
        }
      }
      // U+2800 is blank braille, so empty columns still hold their place.
      line += String.fromCharCode(0x2800 + mask);
    }
    out.push(line);
  }
  return out;
}

/**
 * Width of one character in an element's font, measured rather than guessed
 * — the braille glyphs may come from a fallback face whose advance width is
 * not the one the label font would give.
 */
export function measureCharWidth(reference) {
  const probe = document.createElement("span");
  probe.textContent = "⠿".repeat(50);
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:pre;pointer-events:none;";
  reference.appendChild(probe);
  const width = probe.getBoundingClientRect().width / 50;
  probe.remove();
  return width || 7;
}
