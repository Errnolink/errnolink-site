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
src/ui/             starfield, boot, reveal, rail, and one module per section
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
  Each row is built as an instrument rather than a line of text: a boxed
  well with a hairline frame, a ramp tick on its leading edge, three braille
  rows of graph and the count in its own readout cell. A dim dot floor runs
  the width of every track, so a span with no pushes reads as a flatline
  rather than as nothing at all.

  The tracks are Gaussian-smoothed. Pushes are instants, not a sampled
  signal: bucketed raw they render as isolated one-column spikes, a scatter
  plot wearing a graph's clothes. Spreading each event over its neighbours
  gives the continuous shape these graphs are read for. Each track scales to
  its own peak so a quiet object still shows its shape, and the ramp colour
  is capped by absolute count so "busiest" meaning two pushes cannot paint a
  track critical-red.

The commit total in the dossier is a captured figure (`88+`) because counting
commits needs the search API, which this page does not call from the browser.

### Composition

Each screen is anchored to its edges rather than centred in its box. The hero
pins the wordmark to the top and an instrument rail to the bottom of the
viewport, with the sky in the gap; centring the block left 285px of nothing
above and below it and no element touching a frame, which is not how a
console composes. The reticle bracketing the wordmark is the tracked-object
lock-on applied to the station itself — static, because the cards earn the
fly-in by being acquired and the station is already acquired.

Telemetry is the one section allowed to overrun the reading frame the other
three sit inside: it is the main instrument, and one full-bleed panel is
cheaper variation than a second header treatment. It stops short of the
viewport edge by the rail's gutter, because a console running underneath the
navigation reads as broken rather than as confident.

Grids are not allowed to end ragged. Seven objects into three columns is
3 + 3 + 1, and the honest fill for the gap is chrome, not a stretched card:
the survey plate states the status of the *list*, which is the one thing on
that screen that is not about an object in it. Its span is computed from the
resolved track count — `grid-column-end: -1` alone gives an item a span of
one and hangs it off the last line, which trades one orphan for two.

### The sky

`src/data/stars.js` is a real catalogue — 81 bright stars of the northern
winter sky with J2000 positions, magnitudes and B-V colour indices, plus the
classical constellation figures for Orion, Canis Major, Canis Minor, Taurus,
Gemini, Auriga and Lepus. The camera points at Orion and drifts at the true
sidereal rate computed from GMST, so the field is where the sky actually is
and moves the way it actually moves.

Behind the catalogue are two deterministic layers of anonymous faint points:
a field fill of ~1150 and a sparser, dimmer haze of ~320 further back. These
are **not** catalogued stars: they are never labelled and are drawn dimmer
than everything real. They exist so the sky has the density a real one has
between the bright stars — and they are the layers that drift continuously
and wrap, which is what makes the sky read as moving. The haze drifts at
under half the fill's rate and takes half its parallax, which is the whole
reason it is a separate layer. The catalogue itself does not drift: those
stars are real, so they travel at the sidereal rate or not at all.

The fill is generated in **screen space**, not on the sphere. Scattering it
uniformly over the celestial sphere and projecting is the physically honest
thing to do and it photographs badly: stereographic projection stretches
area away from the tangent point, so the same angular density lands far
fewer points per pixel at the edges than at the centre and the corners come
out empty. The catalogue has to be projected, because those are real
positions. The fill is invented, so it is laid out directly on a wrapping
virtual plane slightly larger than the viewport — even by construction,
regenerated on resize, wrapping on both axes because scroll parallax alone
can walk a screen-space layer off the top of a long page.

The catalogue's labels route around the chrome. The sky does not know the DOM
is there, so PROCYON was landing inside the E of the wordmark and ORION on
the subtitle line — 9px grey type and 128px display type fighting for the
same pixels. Elements that must stay clean publish their viewport rects and
the label pass skips any plate that intersects one. The stars themselves are
always drawn, and so are the constellation lines: a line crossing behind a
panel reads as depth, a word crossing behind one reads as a bug.

The Julian Date, sidereal time, lunar phase and mission-day readouts are all
computed, not fetched — `scripts/check-astro.mjs` checks them against
published epochs. The ISS position is the one live orbital object; it is
strictly additive and degrades to `NO SIGNAL`.

### Motion

Mechanical, not organic: hard cubic-bezier, short durations, transform and
opacity only, enter slower than exit. Nothing bounces or springs.

The glitch reveal is cadence-planner's badge recipe, ported to this palette:
a wipe and a chromatic split inside one ~150ms window, torn down at 200ms.
Two copies of the text sit over it, each clipped to a band that jumps
between three positions and three offsets while a cyan and an orange fringe
run against each other.

What makes it read as a glitch rather than as a ghost is that the copies are
**opaque** — `background: var(--bg)` — so each band occludes the base text
and the slice genuinely displaces sideways instead of two coloured
duplicates fading over the original. Black is the right occluder everywhere
here, because every heading sits directly on the starfield.

Three things keep it cheap, and all three matter: the copies exist only
while the burst runs (`content` is bound to the running class, not to
`[data-text]`); they carry a hard offset shadow and no blur; and the
element's own halo is suppressed for the duration, so the wipe repaints flat
text and the glow arrives when it lands. Inheriting the hero's 18px halo
onto both copies meant every frame repainted three blurred copies of 128px
text, which is what made it stutter. The spike animations are `infinite` —
the window, not the animation, is what ends the burst — so `reveal.js`
removes the class on a timer, and `runGlitch` refuses to start at all when
effects are off, because a frozen burst would park two black bands over the
heading.

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

**Violet is not a measurement.** It marks a figure the station cannot
currently vouch for: the captured commit total, an unacquired ISS signal, a
tracked object whose contact age is unknown because the page is running
without scripts, a section of the rail not yet reached. It is never used for
a live reading — that distinction is the whole job it does. `--violet` is
the fill hue at 3.69:1 (non-text only); `--violet-hi` is the text tier.

**A light that never changes is decoration.** The card LEDs used to be
`led--nominal` on every object, seven identical greens reporting nothing and
spending the ramp's credibility. They are driven by days-since-contact now,
and they hold still: a blink is an alarm and an alarm is singular, so
repeating one down a grid makes a strobe rather than a warning.

**Colour is never the sole carrier.** Readout values took weight 500 against
their labels' 400, so a reading survives greyscale; the rail's active tick
grows as well as changing hue; the log's overflow is a mask, which is a shape.

Every text tier clears WCAG AA on the page's black ground. `--text-faint` was
`#6a6a65` — 3.86:1, under the line, and it carries the 9px ornaments. It is
`#767671` (4.60:1) now, which is the same mood one step brighter.

### Wayfinding

The rail down the right edge is the page's only navigation. The topbar's
centre holds four clocks and keeps them: they are the station's instruments.
Navigation belongs at the edge, where a vertical tick rail is both the right
shape for a scroll position and squarely in this language — violet until a
section is reached, cyan after, orange for the one you are in.

Active section is chosen by which section's box contains the viewport's
midline, not by which is most visible: the hero is a full viewport and
telemetry is ~1000px, so a ratio test hands the rail to whichever section is
longest while its heading is far off screen.
