// One-off: reads the public Google Drive folders linked from the old site's 2022, 2023 and 2024 photo-gallery pages
// and writes src/data/drive-albums.json (file ids only; the photos stay on Drive and are shown from Google's image server).
// Run: node scripts/drive-albums.mjs   (needs network). Folders that are private or deleted are skipped and listed.
import fs from 'node:fs';
const PAGES = { 2022: '2022-photo-gallery', 2023: '2023-container-loadings', 2024: '2024-photo-gallery-container-loadings' };
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const COUNTRIES = ['Ukraine','Ethiopia','Cuba','Philippines','Belize','Uruguay','Guatemala','Tanzania','Kenya','Ghana','Honduras'];
const get = async (u) => { for (let t = 0; t < 4; t++) { try { const r = await fetch(u); return { ok: r.ok, text: await r.text() }; } catch { await new Promise(r => setTimeout(r, 2000 * (t + 1))); } } return { ok: false, text: '' }; };
const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#8211;/g, '–').replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/\s+/g, ' ').trim();
const albums = [], skipped = [];
for (const [year, page] of Object.entries(PAGES)) {
  const { text } = await get(`https://old.rotaryworldhelp.com/${page}/`);
  const main = text.match(/<article[\s\S]*?<\/article>/)?.[0] ?? '';
  for (const m of main.matchAll(/<a[^>]+href="(https:\/\/drive\.google\.com\/drive\/folders\/([\w-]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, url, folder, inner] = m; const label = clean(inner);
    const dm = label.match(new RegExp(`(${MONTHS.join('|')}|sept)\\w*\\s+(\\d{1,2})`, 'i'));
    const mon = dm ? (dm[1].toLowerCase().startsWith('sept') ? 9 : MONTHS.indexOf(dm[1].toLowerCase()) + 1) : 0;
    const date = `${year}-${String(mon).padStart(2, '0')}-${String(dm?.[2] ?? 1).padStart(2, '0')}`;
    const country = COUNTRIES.find(c => label.includes(c)) ?? (label.includes('Cebu') ? 'Philippines' : 'Unknown');
    const r = await get(`https://drive.google.com/embeddedfolderview?id=${folder}`);
    if (!r.ok) { skipped.push(`${date} ${country}: folder not public`); continue; }
    const entries = [...r.text.matchAll(/id="entry-([\w-]+)"[\s\S]*?flip-entry-title">([^<]+)</g)].map(e => ({ id: e[1], name: e[2] }));
    const photos = entries.filter(e => /\.(jpe?g|png|heic|webp)$/i.test(e.name)).sort((a, b) => a.name.localeCompare(b.name)).map(e => e.id);
    const videos = entries.filter(e => /\.(mp4|mov|m4v|3gp)$/i.test(e.name)).sort((a, b) => a.name.localeCompare(b.name)).map(e => e.id);
    if (!photos.length && !videos.length) { skipped.push(`${date} ${country}: folder empty`); continue; }
    albums.push({ date, country, label, folder: url.split('?')[0], photos, videos });
  }
}
albums.sort((a, b) => b.date.localeCompare(a.date));
fs.writeFileSync('src/data/drive-albums.json', JSON.stringify(albums));
console.log(albums.length, 'albums,', albums.reduce((n, a) => n + a.photos.length, 0), 'photos,', albums.reduce((n, a) => n + a.videos.length, 0), 'videos');
console.log('skipped:', skipped);
