// Post-build: hash every inline <script> in the static output and write security headers
// into the Vercel Build Output config. No secrets here; runs after `astro build`.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const OUT = '.vercel/output';
const STATIC = join(OUT, 'static');
const hashes = new Set();
const walk = (d) => readdirSync(d).forEach(f => { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) scan(p); });
const scan = (p) => {
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (m[1].trim()) hashes.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
};
walk(STATIC);

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com https://lh3.googleusercontent.com",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const adminCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com https://*.githubusercontent.com https://i.ytimg.com",
  "connect-src 'self' https://api.github.com https://github.com https://*.githubusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://github.com",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const headers = {
  'Content-Security-Policy': csp,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow, noarchive', // demo site: keep out of search engines
};

const cfgPath = join(OUT, 'config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
cfg.routes = cfg.routes.filter(r => !r.__rwh);
cfg.routes.unshift(
  { src: '/(.*)', headers, continue: true },
  { src: '^/media/(.*)$', headers: { 'cache-control': 'public, max-age=2592000' }, continue: true },
  // The admin (Keystatic) is a React app that talks to GitHub; it needs a wider policy than the public site.
  { src: '^/(keystatic|api/keystatic)(/.*)?$', headers: { 'Content-Security-Policy': adminCsp, 'cache-control': 'no-store' }, continue: true },
);
if (!cfg.routes.some(r => r.handle === 'error')) cfg.routes.push({ handle: 'error' }, { status: 404, src: '^(?!/api).*$', dest: '/404.html' });
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
console.log(`csp: ${hashes.size} inline script hash(es); headers written to ${cfgPath}`);
