// Every container loading with photos, as one album each: the photos from the current site's gallery,
// plus the full photo and video sets that RWH published as public Google Drive folders on the old site (2022 to 2024).
// Drive files stay on Drive; pages show them from Google's image server (lh3.googleusercontent.com).
import { shipments } from '../data/site';
import drive from '../data/drive-albums.json';
// Photo archive 2016-2019: the old site's yearly gallery pages, one album per captioned group, caption kept as the text.
import archive from '../data/archive-albums.json';
import { img } from './img';
// Same rule as countrySlug in countries.ts (kept here so the two modules do not import each other).
const countrySlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export type Photo = { src: string; large: string; srcset?: string; w?: number; h?: number; local: boolean };
export type Album = {
  slug: string; date: string; country: string; sponsor?: string; label?: string; story?: string;
  title?: string; kind?: 'loading' | 'archive'; extra?: boolean; // extra: not one of the loadings in the admin
  local: string[]; drivePhotos: string[]; videos: string[]; folder?: string;
};

const DAY = 86400e3;
const near = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) <= 2 * DAY;
type D = (typeof drive)[number];
const used = new Set<D>();

const fromShip: Album[] = shipments.map(s => {
  // A folder linked in the admin wins; otherwise the old site's folder from the same day, if there is one.
  const d = s.drive ?? drive.find(x => !used.has(x) && x.country === s.country && near(x.date, s.date));
  if (d && !s.drive) used.add(d as D);
  return { slug: `${s.date}-${countrySlug(s.country)}`, date: s.date, country: s.country, sponsor: s.sponsor, story: s.story, local: s.local,
    drivePhotos: d?.photos ?? [], videos: d?.videos ?? [], folder: d?.folder };
});
const fromDrive: Album[] = drive.filter(d => !used.has(d)).map(d => ({
  slug: `${d.date}-${countrySlug(d.country)}`, date: d.date, country: d.country, label: d.label, extra: true,
  local: [], drivePhotos: d.photos, videos: d.videos, folder: d.folder,
}));
const fromArchive: Album[] = archive.map(a => ({
  slug: a.slug, date: a.date, country: a.country, title: a.title, kind: a.kind as Album['kind'], story: a.story, extra: true,
  local: a.photos, drivePhotos: [], videos: [],
}));

export const albums: Album[] = [...fromShip, ...fromDrive, ...fromArchive].sort((a, b) => b.date.localeCompare(a.date));
export const albumBySlug = Object.fromEntries(albums.map(a => [a.slug, a]));
export const albumFor = (date: string, country: string) => albumBySlug[`${date}-${countrySlug(country)}`];
export const driveOnly = fromDrive;
/** Every album that is not a loading from the admin: old-site Drive folders and the 2016-2019 photo archive, newest first. */
export const extraAlbums = [...fromDrive, ...fromArchive].sort((a, b) => b.date.localeCompare(a.date));
export const albumName = (a: Album) => a.title || a.country;
/** Dates can be a full day, a month (2017-07) or only a year (2016). */
export const fmtAlbumDate = (d: string) => d.length === 4 ? d : new Date((d.length === 7 ? d + '-15' : d) + 'T12:00:00').toLocaleDateString('en-CA', d.length === 7 ? { month: 'long', year: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' });
export const total = (a: Album) => a.local.length + a.drivePhotos.length;

export const lh3 = (id: string, w: number) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
export function photos(a: Album): Photo[] {
  const loc = a.local.map(id => img(id)).filter(Boolean).map(i => ({ src: i!.src, large: i!.large, srcset: i!.srcset, w: i!.width, h: i!.height, local: true }));
  const dr = a.drivePhotos.map(id => ({ src: lh3(id, 480), large: lh3(id, 1600), srcset: `${lh3(id, 480)} 480w, ${lh3(id, 960)} 960w`, local: false }));
  return [...loc, ...dr];
}
export const cover = (a: Album) => photos(a)[0];
