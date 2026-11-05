// Build step: every photo uploaded through the admin (public/uploads/**) gets compressed,
// resized WebP copies (480/960/1600 px) so phones never download a 5 MB camera original.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'public/uploads';
const OUT = 'public/media/up';
const MANIFEST = 'src/data/uploads.json';
const EXT = /\.(jpe?g|png|webp|avif|tiff?|gif)$/i;

const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const manifest = {};
fs.mkdirSync(OUT, { recursive: true });

let made = 0;
for (const file of walk(SRC).filter(f => EXT.test(f))) {
  const key = '/' + path.relative('public', file).split(path.sep).join('/');
  const stat = fs.statSync(file);
  const base = key.slice('/uploads/'.length).replace(EXT, '').replace(/[^a-zA-Z0-9-]+/g, '_');
  const prev = old[key];
  if (prev && prev.mtime === stat.mtimeMs && prev.sizes.every(s => fs.existsSync(`${OUT}/${base}-${s}.webp`))) { manifest[key] = prev; continue; }
  try {
    const meta = await sharp(file).metadata();
    let w = meta.width, h = meta.height;
    if ((meta.orientation ?? 1) >= 5) [w, h] = [h, w];
    const sizes = [480, 960, 1600].filter(s => s < w).concat(w <= 1600 ? [w] : []);
    for (const s of sizes) await sharp(file).rotate().resize({ width: s }).webp({ quality: 74 }).toFile(`${OUT}/${base}-${s}.webp`);
    manifest[key] = { w: Math.min(w, 1600), h: Math.round(h * Math.min(w, 1600) / w), sizes, base, mtime: stat.mtimeMs };
    made++;
  } catch (e) {
    console.warn(`[uploads] skipped ${key}: ${e.message}`);
  }
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
console.log(`[uploads] ${Object.keys(manifest).length} photos, ${made} newly compressed`);
