# ravandi.ai

Personal site for Cyrus B. Ravandi. Built with [Astro](https://astro.build),
rendered to static HTML at build time, deployed to GitHub Pages on the apex
domain `ravandi.ai`.

One route (`/`), ported from a Claude Design canvas (`test-emergence-exact`):
a two-column CV — scrolling copy on the left, a particle "emergence story"
canvas animation fixed on the right.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview    # serve dist/ locally
npm run check      # astro check — types and template diagnostics
```

Node 22+.

## Layout

```
public/
  fonts/           IRANSansX woff2 weights, self-hosted, matching the design
                   canvas exactly (no third-party requests)
  images/          cyrus-headshot.jpg
  CNAME            Pins the custom domain on every deploy
  robots.txt       Points at the sitemap
src/
  data/
    story-stage.json  Step pacing for the right-column animation — see Settings
  layouts/
    Base.astro     The page's <head>: title, description, canonical, OG,
                    Twitter card, font preload
  pages/
    index.astro    The whole page — content, layout, and scoped styles
  scripts/
    emergence-story.js  The right-column particle simulation, a self-contained
                         vanilla custom element (<story-stage>)
  styles/
    global.css     Design tokens (LUFAI design system: colors, spacing,
                    typography, the Button component) ported verbatim from
                    the design canvas
```

## Settings

`src/data/story-stage.json` controls the pacing and the overlay text of the
`<story-stage>` animation. It is imported at build time and serialized into the
element's `timing` attribute, so there is no runtime fetch — edit the JSON and
rebuild. Every field is optional; anything absent keeps the built-in value.

### Pacing

```json
{
  "transitionMs": 2143,
  "steps": [
    {
      "label": "RAW SIGNAL",
      "holdMs": 2000,
      "caption": "Evidence arrives scattered — genomics, clinic, real world."
    }
  ]
}
```

- `holdMs` — how long that formation sits still. Per step, so any one stage can
  linger longer than the rest.
- `caption` — the line shown at the bottom left while that step is on screen.
  Omit it and the built-in text for that formation is used.
- `transitionMs` — how long the morph between formations takes. Global.
- `label` — documentation only, but the component warns in the console if it
  stops matching the formation at that index (i.e. the JSON drifted out of
  order). The ten entries must stay in the same order as `F` in
  `src/scripts/emergence-story.js`.

A step costs `holdMs + transitionMs`; the full loop is the sum of all ten.
Both values are wall-clock milliseconds and are **not** scaled by the element's
`speed` attribute — `speed` only tunes the particle spring.

### Knowledge graph

The `KNOWLEDGE GRAPH` step only. Every other step draws an edge between any two
particles closer than 46px, which gives a uniform lattice — no hubs, no
shortcuts. This step instead generates a real topology and draws that.

```json
{
  "graph": {
    "topology": {
      "communities": 6,
      "attach": 2,
      "lattice": 1,
      "rewire": 0.07,
      "globalEdges": 42,
      "bridges": 10,
      "seed": 7
    },
    "edgeAlpha": 0.36,
    "hubScale": 1,
    "metaPaths": {
      "enabled": true, "count": 2, "length": 8, "intervalMs": 2600,
      "pulseMs": 1300, "tail": 0.22, "dim": 0.5, "width": 2.2,
      "color": "#D9407E", "pulse": true
    }
  }
}
```

The graph mixes two models. **Barabási–Albert** gives the scale-free part: each
node attaches preferentially to already-well-connected ones, so a few hubs
emerge instead of every node having the same degree. **Watts–Strogatz** gives
the small-world part: a ring lattice for local clustering (triangles), plus
rewired long-range edges so any two nodes stay a few hops apart.

- `communities` — clusters. Each gets its own BA graph, laid out as a hub ringed
  by its neighbours, so the degree hierarchy is visible in the layout.
- `attach` — BA edges per new node. Higher is denser and flattens the hubs.
- `lattice` / `rewire` — Watts–Strogatz. `lattice` is how many ring neighbours
  each node links to; `rewire` is the fraction redirected to a random node.
- `globalEdges` — a preferential-attachment pass across the whole graph. This is
  what produces the few genuinely large hubs; per-community BA alone caps hub
  degree at about `2·sqrt(community size)`.
- `bridges` — extra hub-to-hub edges between communities.
- `seed` — the graph is deterministic; change this for a different one.
- `edgeAlpha` / `hubScale` — edge opacity, and a multiplier on the
  degree-proportional node radius.
- `metaPaths` — chains of relations lit up over the graph, re-picked at random
  every `intervalMs`. The walk follows real edges from a well-connected node and
  prefers to keep its heading, so a path travels instead of doubling back. Each
  path is seeded in a different community when one is free.
  - `pulse` / `pulseMs` / `tail` — a lit segment sweeps the path to show the
    relation being traversed. `pulseMs` is one traversal (shorter than
    `intervalMs` means more than one pass per path), `tail` the fraction of the
    path lit behind the head.
  - `dim` — how far the graph recedes while a path is lit. This is what makes a
    path readable over 800-odd edges; its own weight alone is not enough.
  - `width` / `color` — the path itself. On the light theme the sweep is drawn
    in a darker shade of `color`, since a lighter one disappears into the page.

Edge weight and node radius both scale with degree, and long edges are drawn
fainter so the cross-cluster shortcuts read as threads rather than dominating.
Proximity links cross-fade out as this topology fades in, so the graph appears
to assemble out of the previous step.

### Overlay

Text drawn over the stage, in three groups: `label` is the step name at the top
left (`RAW SIGNAL`, `INGESTION`, …), `flow` is the line at the top right, and
`caption` is the sentence at the bottom left.

```json
{
  "overlay": {
    "narrowBelowPx": 470,
    "label": { "fontSize": 15, "fontWeight": 800, "color": "#2D2A45" },
    "flow": { "text": "Data → insight → decision → value", "fontSize": 12.5 },
    "caption": { "fontSize": 15, "fontSizeNarrow": 13, "lineHeight": "1.45" }
  }
}
```

| Field | Applies to | Notes |
| --- | --- | --- |
| `fontSize` / `fontSizeNarrow` | all three | Numbers, in px. The narrow value is used below `narrowBelowPx` |
| `fontWeight` | all three | 400–900 |
| `color` / `colorDark` | all three | `colorDark` is used when the element has `theme="dark"` |
| `letterSpacing` | all three | CSS length, e.g. `"0.1em"`. `label` also takes `letterSpacingNarrow` |
| `text` | flow | The other two get their text per step: `label` from the formations, `caption` from `steps[].caption` |
| `lineHeight` | caption | The only one that wraps, so the only one that needs it |
| `uppercase` | label | `false` prints the formation names as written |
| `hideWhenTight` | flow | `true` drops the flow line when it would collide with the widest label; `false` always shows it, which can overlap on a phone |
| `narrowBelowPx` | — | Measured against the **stage** width, not the viewport: the stage is 46% of the window above 900px and full width below |

If the attribute is missing or malformed the component falls back to the old
`hold`/`speed` attributes and the built-in styling, so the element still works
standalone.

## Editing

Content (point of view, work, stats, publications) is inlined as plain data at
the top of `src/pages/index.astro` — edit it there, no CMS.

```sh
git pull
# edit src/pages/index.astro
npm run dev
git commit -am "update bio"
git push
```

GitHub Actions builds and deploys on every push to `master`.

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `master`,
and can be run by hand from the Actions tab. Pages must be configured with
`build_type: workflow` (Settings → Pages → Build and deployment → Source:
GitHub Actions) for this to serve — the site no longer deploys from the
branch root directly.

The custom domain is set in the repository's Pages settings and pinned by
`public/CNAME`. If the domain is ever removed, set `base: '/ravandi.ai/'` in
`astro.config.mjs` or every asset URL will 404.

## DNS

The apex domain `ravandi.ai` points at GitHub's Pages IPs via four `A`
records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www.ravandi.ai` is a `CNAME` to `bravandi.github.io`.
