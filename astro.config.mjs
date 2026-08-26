// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is required for canonical URLs, sitemap.xml, and absolute OG image
// URLs. The custom domain is configured on the repository's Pages settings
// (ravandi.ai) and pinned by public/CNAME.
//
// `base` stays '/' because this deploys to an apex domain, not to
// bravandi.github.io/repo. If the custom domain is ever removed, set
// base: '/ravandi.ai/' or every asset URL 404s.
export default defineConfig({
  site: 'https://ravandi.ai',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // Emit /index.html at the root — this is a single-page site, so
    // 'directory' vs 'file' only matters if more routes are ever added.
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
