// One-off: converts the downloaded originals into responsive WebP files + manifest.
import sharp from 'sharp';
import fs from 'node:fs';
const SRC = '/home/user/rwh-work/img';
const OUT = 'public/media/img';
fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2);
const files = Object.fromEntries(fs.readdirSync(SRC).map(f => [f.split('.')[0], f]));
const manifest = fs.existsSync('src/data/images.json') ? JSON.parse(fs.readFileSync('src/data/images.json')) : {};
for (const id of ids) {
  if (!files[id]) { console.log('missing', id); continue; }
  const img = sharp(`${SRC}/${files[id]}`).rotate();
  const m = await img.metadata();
  let w = m.width, h = m.height;
  if (m.orientation >= 5) [w, h] = [h, w];
  const sizes = [480, 960, 1600].filter(s => s < w).concat(w <= 1600 ? [w] : []);
  for (const s of sizes) {
    const p = `${OUT}/${id}-${s}.webp`;
    if (!fs.existsSync(p)) await sharp(`${SRC}/${files[id]}`).rotate().resize({ width: s }).webp({ quality: 74 }).toFile(p);
  }
  manifest[id] = { w, h, sizes };
}
fs.writeFileSync('src/data/images.json', JSON.stringify(manifest));
console.log(Object.keys(manifest).length);
