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
