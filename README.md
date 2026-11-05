# Rotary World Help — website redesign (demo)

Astro 5 + Tailwind 4. A demo of a redesigned site for Rotary World Help (Coquitlam, BC).
Content is taken from rotaryworldhelp.com and old.rotaryworldhelp.com and proofread; numbers are as published by RWH.

- `npm install && npm run build` builds static pages plus one serverless endpoint (`/api/submit`, anti-spam form handler).
- `scripts/csp.mjs` runs after the build and writes security headers (CSP with script hashes, HSTS, X-Robots-Tag noindex).
- The demo is kept out of search engines: `robots.txt` disallows everything and every page carries `noindex`.
- Forms are validated and spam-protected but **not delivered** anywhere in demo mode. Set `FORM_SECRET` in the hosting environment for signed form tokens.
