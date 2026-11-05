import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://rotary-l915.vercel.app',
  output: 'static',
  adapter: vercel({ imageService: false }),
  integrations: [react(), keystatic()],
  trailingSlash: 'ignore',
  // Same-origin is enforced in /api/submit against the Host header (Astro's own check compares
  // with the deployment URL behind Vercel's proxy and rejected real submissions on the alias).
  // allowedDomains: trust Vercel's forwarded host, so request URLs (and the admin's GitHub login callback) use the real domain, not localhost.
  security: { checkOrigin: false, allowedDomains: [{ hostname: 'rotary-l915.vercel.app', protocol: 'https' }, { hostname: '*.vercel.app', protocol: 'https' }] },
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 }, optimizeDeps: { exclude: ['@keystatic/astro'] } },
});
