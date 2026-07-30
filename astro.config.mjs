// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// `SITE_URL` is injected by the deploy workflow (the site's custom apex domain
// or the GitHub Pages URL). GitHub project pages need their repo path as Astro's
// base; custom/apex domains stay rooted at '/'.
const site = process.env.SITE_URL ?? 'https://example.com';
const url = new URL(site);
const repoPath = url.hostname.endsWith('.github.io') ? url.pathname.split('/').filter(Boolean)[0] : '';
const base = repoPath ? `/${repoPath}/` : '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always', // preserve existing /curriculum/ style URLs (SEO)
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
