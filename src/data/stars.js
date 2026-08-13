/**
 * A real star catalogue.
 *
 * Bright stars of the northern winter sky — the field around Orion, which is
 * where the deck's camera points. Positions are J2000 right ascension and
 * declination in degrees, with visual magnitude and B-V colour index; values
 * follow the Bright Star Catalogue.
 *
 * These are the actual stars overhead, in their actual places. The sky drawn
 * on this page rotates at the true sidereal rate, so if you leave the tab
 * open the field drifts exactly as the real one does.
 *
 * Format: [name, raDeg, decDeg, mag, bv]
 */

export const STARS = [
  // ── Orion ──────────────────────────────────────────────────────────────
  ["Betelgeuse", 88.793, 7.407, 0.5, 1.85],
  ["Rigel", 78.634, -8.202, 0.13, -0.03],
  ["Bellatrix", 81.283, 6.35, 1.64, -0.22],
  ["Alnilam", 84.053, -1.202, 1.69, -0.18],
  ["Alnitak", 85.19, -1.943, 1.77, -0.2],
  ["Saiph", 86.939, -9.67, 2.06, -0.17],
  ["Mintaka", 83.002, -0.299, 2.23, -0.18],
  ["Nair al Saif", 83.858, -5.91, 2.77, -0.21],
  ["Meissa", 83.784, 9.934, 3.39, -0.16],
  ["Eta Ori", 81.119, -2.397, 3.36, -0.17],
  ["Tabit", 72.46, 6.961, 3.19, 0.45],
  ["Pi4 Ori", 71.633, 5.605, 3.69, -0.16],
  ["Pi5 Ori", 70.849, 2.441, 3.72, -0.18],
  ["Omicron2 Ori", 72.649, 13.514, 4.07, 1.15],
  ["Mu Ori", 88.583, 9.647, 4.12, 0.16],

  // ── Canis Major ────────────────────────────────────────────────────────
  ["Sirius", 101.287, -16.716, -1.46, 0.0],
  ["Adhara", 104.656, -28.972, 1.5, -0.21],
  ["Wezen", 107.098, -26.393, 1.83, 0.67],
  ["Mirzam", 95.675, -17.956, 1.98, -0.24],
  ["Aludra", 111.024, -29.303, 2.45, -0.08],
  ["Furud", 95.078, -30.063, 3.02, -0.19],
  ["Sigma CMa", 104.034, -27.934, 3.47, 1.73],

  // ── Canis Minor ────────────────────────────────────────────────────────
  ["Procyon", 114.825, 5.225, 0.34, 0.42],
  ["Gomeisa", 111.788, 8.289, 2.89, -0.09],

  // ── Taurus ─────────────────────────────────────────────────────────────
  ["Aldebaran", 68.98, 16.509, 0.85, 1.54],
  ["Elnath", 81.573, 28.608, 1.65, -0.13],
  ["Alcyone", 56.871, 24.105, 2.87, -0.09],
  ["Zeta Tau", 84.411, 21.143, 3.0, -0.15],
  ["Theta2 Tau", 67.165, 15.871, 3.4, 0.18],
  ["Lambda Tau", 60.17, 12.49, 3.47, -0.12],
  ["Epsilon Tau", 67.154, 19.18, 3.53, 1.01],
  ["Gamma Tau", 64.948, 15.628, 3.65, 0.98],
  ["Delta Tau", 65.734, 17.542, 3.76, 0.98],

  // ── Gemini ─────────────────────────────────────────────────────────────
  ["Pollux", 116.329, 28.026, 1.14, 1.0],
  ["Castor", 113.65, 31.888, 1.58, 0.03],
  ["Alhena", 99.428, 16.399, 1.93, 0.0],
  ["Mu Gem", 95.74, 22.514, 2.87, 1.64],
  ["Mebsuta", 100.983, 25.131, 2.98, 0.79],
  ["Eta Gem", 93.719, 22.507, 3.28, 1.6],
  ["Xi Gem", 106.027, 12.896, 3.35, 0.43],
  ["Wasat", 110.031, 21.982, 3.53, 0.37],
  ["Kappa Gem", 116.112, 24.398, 3.57, 0.93],

  // ── Auriga ─────────────────────────────────────────────────────────────
  ["Capella", 79.172, 45.998, 0.08, 0.8],
  ["Menkalinan", 89.882, 44.947, 1.9, 0.08],
  ["Mahasim", 89.93, 37.213, 2.62, -0.08],
  ["Hassaleh", 74.248, 33.166, 2.69, 1.53],
  ["Almaaz", 75.492, 43.823, 2.99, 0.54],
  ["Eta Aur", 76.629, 41.234, 3.17, -0.15],

  // ── Lepus ──────────────────────────────────────────────────────────────
  ["Arneb", 83.183, -17.822, 2.58, 0.21],
  ["Nihal", 82.061, -20.759, 2.84, 0.82],
  ["Epsilon Lep", 76.365, -22.371, 3.19, 1.46],
  ["Mu Lep", 79.723, -16.205, 3.31, -0.11],

  // ── Eridanus ───────────────────────────────────────────────────────────
  ["Cursa", 76.962, -5.086, 2.79, 0.13],
  ["Zaurak", 59.507, -13.509, 2.95, 1.59],
  ["Delta Eri", 55.812, -9.763, 3.54, 0.92],
  ["Epsilon Eri", 53.233, -9.458, 3.73, 0.88],

  // ── Monoceros ──────────────────────────────────────────────────────────
  ["Beta Mon", 100.243, -7.033, 3.76, -0.11],
  ["Alpha Mon", 115.312, -9.551, 3.93, 1.02],
  ["Gamma Mon", 95.949, -6.275, 3.98, 1.32],

  // ── Perseus ────────────────────────────────────────────────────────────
  ["Mirfak", 51.081, 49.861, 1.79, 0.48],
  ["Algol", 47.042, 40.956, 2.12, -0.05],
  ["Zeta Per", 58.533, 31.884, 2.85, 0.26],
  ["Epsilon Per", 59.463, 40.01, 2.89, -0.2],

  // ── Cetus ──────────────────────────────────────────────────────────────
  ["Menkar", 45.57, 4.09, 2.53, 1.64],
  ["Gamma Cet", 40.825, 3.236, 3.47, 0.09],
  ["Tau Cet", 26.017, -15.937, 3.5, 0.72],

  // ── Columba / Puppis / Carina — the southern edge of the field ─────────
  ["Canopus", 95.988, -52.696, -0.74, 0.15],
  ["Phact", 84.912, -34.074, 2.64, -0.12],
  ["Wazn", 87.74, -35.768, 3.12, 1.16],
  ["Naos", 120.896, -40.003, 2.25, -0.27],
  ["Pi Pup", 109.286, -37.097, 2.7, 1.62],
  ["Rho Pup", 121.886, -24.304, 2.81, 0.43],
  ["Nu Pup", 97.204, -43.196, 3.17, -0.11],

  // ── Wider field ────────────────────────────────────────────────────────
  ["Alphard", 141.897, -8.659, 1.98, 1.44],
  ["Regulus", 152.093, 11.967, 1.35, -0.11],
  ["Hamal", 31.793, 23.462, 2.0, 1.15],
  ["Sheratan", 28.66, 20.808, 2.64, 0.13],
  ["Almach", 30.975, 42.33, 2.1, 1.37],
  ["Mirach", 17.433, 35.621, 2.06, 1.58],
  ["Beta Tri", 32.386, 34.987, 3.0, 0.14],
  ["Eta Psc", 22.871, 15.346, 3.62, 0.97],
];

/**
 * Constellation figures, by star name. Only the classical stick figures for
 * the constellations actually in frame — these are content, not decoration.
 */
export const LINES = [
  // Orion: shoulders, belt, legs, head
  ["Betelgeuse", "Bellatrix"],
  ["Bellatrix", "Mintaka"],
  ["Betelgeuse", "Alnitak"],
  ["Mintaka", "Alnilam"],
  ["Alnilam", "Alnitak"],
  ["Mintaka", "Rigel"],
  ["Alnitak", "Saiph"],
  ["Meissa", "Betelgeuse"],
  ["Meissa", "Bellatrix"],
  ["Alnilam", "Nair al Saif"],
  ["Bellatrix", "Tabit"],
  ["Tabit", "Pi4 Ori"],
  ["Pi4 Ori", "Pi5 Ori"],

  // Canis Major
  ["Mirzam", "Sirius"],
  ["Sirius", "Wezen"],
  ["Wezen", "Aludra"],
  ["Wezen", "Adhara"],
  ["Adhara", "Furud"],
  ["Furud", "Mirzam"],

  // Canis Minor
  ["Procyon", "Gomeisa"],

  // Taurus: the Hyades V and the horns
  ["Elnath", "Epsilon Tau"],
  ["Epsilon Tau", "Delta Tau"],
  ["Delta Tau", "Gamma Tau"],
  ["Gamma Tau", "Aldebaran"],
  ["Gamma Tau", "Lambda Tau"],
  ["Aldebaran", "Zeta Tau"],
  ["Theta2 Tau", "Aldebaran"],

  // Gemini
  ["Castor", "Pollux"],
  ["Pollux", "Wasat"],
  ["Wasat", "Alhena"],
  ["Castor", "Mebsuta"],
  ["Mebsuta", "Mu Gem"],
  ["Mu Gem", "Eta Gem"],
  ["Wasat", "Xi Gem"],
  ["Pollux", "Kappa Gem"],

  // Auriga
  ["Capella", "Menkalinan"],
  ["Menkalinan", "Mahasim"],
  ["Mahasim", "Elnath"],
  ["Elnath", "Hassaleh"],
  ["Hassaleh", "Almaaz"],
  ["Almaaz", "Capella"],

  // Lepus
  ["Arneb", "Nihal"],
  ["Arneb", "Mu Lep"],
  ["Nihal", "Epsilon Lep"],
];

/** Stars worth naming on the canvas. Anything more is clutter. */
export const LABELLED = new Set([
  "Sirius",
  "Betelgeuse",
  "Rigel",
  "Procyon",
  "Capella",
  "Aldebaran",
  "Pollux",
  "Canopus",
]);

/** Constellation name plates, placed at the figure's centre of mass. */
export const FIGURES = [
  { name: "ORION", ra: 83.5, dec: -1.5 },
  { name: "CANIS MAJOR", ra: 103.5, dec: -24.0 },
  { name: "TAURUS", ra: 66.0, dec: 18.5 },
  { name: "GEMINI", ra: 107.0, dec: 24.5 },
  { name: "AURIGA", ra: 80.0, dec: 41.0 },
  { name: "LEPUS", ra: 81.0, dec: -19.0 },
];

export const CATALOG_SIZE = STARS.length;
