# ERRNOLINK — Orbital Observation Station

A personal site built as a NERV-style observation deck. The starfield behind
the instruments is the real sky; the panels in front of it read live GitHub
telemetry. Repositories are tracked objects, activity is telemetry.

## Running it

```bash
npm install          # one dev dependency: playwright-core
npm run serve        # http://localhost:5180
```

There is no build step. The source tree is the deploy artifact — every path
is relative, so it drops onto GitHub Pages (user site or project subpath)
unchanged.

## Verifying it

```bash
npm run check:astro  # astronomy against known epochs
npm run smoke        # three browser passes, exits non-zero on failure
npm run shots        # per-section screenshots → .server-logs/shots/
```

`smoke` runs three passes, because the interesting failures are off the happy
path: a normal load, a load with `api.github.com` blocked and storage empty
(the fallback ladder must reach the baked snapshot), and a reduced-motion
load. The browser scripts drive whatever Chromium is already installed —
nothing is downloaded. Set `CHROME_PATH` if none is found.

## How it is put together

```
index.html          complete static markup; JS hydrates over it
css/                tokens → base → animations → atmosphere → sections → responsive
src/data/           github (fetch ladder), normalize, snapshot, astro, stars
src/ui/             starfield, boot, reveal, and one module per section
scripts/            serve, smoke, shots, chrome resolver, astro checks
```

**The page works with JavaScript off.** The markup ships complete with the
snapshot values in it; scripts replace that content with live data. Nothing
is hidden for a reveal animation unless the reveal is actually going to run.

### Data

`src/data/github.js` walks a ladder per endpoint: fresh cache (10 min) → live
fetch → stale cache → baked snapshot. The badge in the topbar reports the
worst source of the three, so it never claims more freshness than the weakest
panel has.

Two honest limits are visible in the UI rather than papered over:

- **Push counts, not commit counts.** GitHub's unauthenticated event payload
  carries no `size` and no `commits` array — only the ref and SHAs. So the
  histogram counts pushes, which is what the feed actually reports.
- **Per object, not a global time series.** The feed returns the last thirty
  events, which in an active week reach back about two days. A twelve-week
  chart drawn from that is ten empty columns that read as inactivity but are
  really the edge of the data. Instead each tracked object gets its own
  braille track — btop's per-core layout — spanning the feed's real
  coverage, with the date it reaches back to stated in the panel header.

  The tracks are Gaussian-smoothed. Pushes are instants, not a sampled
  signal: bucketed raw they render as isolated one-column spikes, a scatter
  plot wearing a graph's clothes. Spreading each event over its neighbours
  gives the continuous shape these graphs are read for. Each track scales to
  its own peak so a quiet object still shows its shape, and the ramp colour
  is capped by absolute count so "busiest" meaning two pushes cannot paint a
  track critical-red.

The commit total in the dossier is a captured figure (`88+`) because counting
commits needs the search API, which this page does not call from the browser.

### The sky

`src/data/stars.js` is a real catalogue — 81 bright stars of the northern
winter sky with J2000 positions, magnitudes and B-V colour indices, plus the
classical constellation figures for Orion, Canis Major, Canis Minor, Taurus,
Gemini, Auriga and Lepus. The camera points at Orion and drifts at the true
sidereal rate computed from GMST, so the field is where the sky actually is
and moves the way it actually moves.

Behind the catalogue is a deterministic field fill of ~850 anonymous faint
points. These are **not** catalogued stars: they are never labelled and are
drawn dimmer than everything real. They exist so the sky has the density a
real one has between the bright stars — and they are the layer that drifts
continuously and wraps, which is what makes the sky read as moving. The
catalogue itself does not drift: those stars are real, so they travel at the
sidereal rate or not at all.

The Julian Date, sidereal time, lunar phase and mission-day readouts are all
computed, not fetched — `scripts/check-astro.mjs` checks them against
published epochs. The ISS position is the one live orbital object; it is
strictly additive and degrades to `NO SIGNAL`.

### Motion

Mechanical, not organic: hard cubic-bezier, short durations, transform and
opacity only, enter slower than exit. Nothing bounces or springs.

The glitch reveal is a wipe followed by a chromatic split — two offset copies
of the text carrying only hard coloured shadows, slicing across it once, in
the manner of cadence-planner's `glitch-spike`. Three things keep it cheap,
and all three matter: the copies exist only while the burst runs (`content`
is bound to the running class, not to `[data-text]`); they are
`color: transparent` with no blur; and the element's own halo is suppressed
for the duration, so the wipe repaints flat text and the glow arrives when it
lands. Inheriting the hero's 18px halo onto both copies meant every frame
repainted three blurred copies of 128px text, which is what made it stutter.
`reveal.js` removes the class when the burst ends, bounding the whole cost.

Everything that moves dies under **both** `prefers-reduced-motion` and the
visible `FX` toggle in the header — which is also the pause mechanism for the
starfield and the marquee. With effects off the canvas paints one static
frame and stops; the constellations stay, because they are content, and the
twinkle goes, because it is not.

The starfield runs at 30fps with the device pixel ratio capped at 1.5 and
hard-pauses when the tab is hidden. A meteor briefly lifts it to full rate.

### Design language

Standalone CSS following the house design language (Kanso) without depending
on it: black grounds, chamfered corners rather than radii, uppercase mono
labels, orange for command chrome, cyan for observational data, the severity
ramp for magnitude. Colour tokens live in `css/tokens.css` — a literal colour
or duration anywhere else is a bug.
