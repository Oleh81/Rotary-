// Build step: for every container loading saved in the admin with a Google Drive folder link, list the photos and
// videos in that folder (and its subfolders, one level down) and write src/data/loading-drive.json.
// The files stay on Drive; pages show photos from Google's image server and link videos to Drive.
// The folder must be shared as "Anyone with the link". If Drive cannot be reached, the last saved list is kept.
import fs from 'node:fs';
const DIR = 'src/content/loadings';
const OUT = 'src/data/loading-drive.json';
const PHOTO = /\.(jpe?g|png|heic|heif|webp|gif)$/i, VIDEO = /\.(mp4|mov|m4v|3gp|avi|webm)$/i;
export const folderId = (u = '') => u.match(/\/folders\/([\w-]{10,})/)?.[1] ?? u.match(/[?&]id=([\w-]{10,})/)?.[1] ?? null;

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const get = async u => { for (let t = 0; t < 3; t++) { try { const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); return { status: r.status, text: await r.text() }; } catch { await new Promise(r => setTimeout(r, 1500 * (t + 1))); } } return { status: 0, text: '' }; };

async function list(id, depth = 0) {
  const r = await get(`https://drive.google.com/embeddedfolderview?id=${id}`);
  if (r.status !== 200) return { status: r.status, photos: [], videos: [] };
  const entries = [...r.text.matchAll(/id="entry-([\w-]+)"[\s\S]*?<a href="([^"]*)"[\s\S]*?flip-entry-title">([^<]+)</g)].map(e => ({ id: e[1], href: e[2], name: e[3] }));
  const byName = (a, b) => a.name.localeCompare(b.name, 'en', { numeric: true });
  const out = { status: 200, photos: entries.filter(e => PHOTO.test(e.name)).sort(byName).map(e => e.id), videos: entries.filter(e => VIDEO.test(e.name)).sort(byName).map(e => e.id) };
  if (depth < 1) for (const f of entries.filter(e => /\/folders\//.test(e.href)).sort(byName)) {
    const sub = await list(f.id, depth + 1); out.photos.push(...sub.photos); out.videos.push(...sub.videos);
  }
  return out;
}

const result = {};
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')) : [];
for (const f of files) {
  const id = folderId(JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8')).drive);
  if (!id || result[id]) continue;
  const r = await list(id);
  if (r.status === 200) result[id] = { photos: r.photos, videos: r.videos };
  else if (old[id] && r.status === 0) { result[id] = old[id]; console.warn(`[drive] ${f}: Drive not reachable, kept the last list`); }
  else { result[id] = { photos: [], videos: [], error: 'not shared' }; console.warn(`[drive] ${f}: folder is not shared as "Anyone with the link"`); }
}
fs.writeFileSync(OUT, JSON.stringify(result));
console.log(`[drive] ${Object.keys(result).length} folders, ${Object.values(result).reduce((n, a) => n + a.photos.length, 0)} photos, ${Object.values(result).reduce((n, a) => n + a.videos.length, 0)} videos`);
