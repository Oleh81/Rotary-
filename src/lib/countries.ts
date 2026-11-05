// One page per country: everything on the site that mentions it, gathered at build time.
// Only material that already exists is linked; nothing is written about a country that the sources do not say.
import { countries, shipments, archive, videos } from '../data/site';
import { news, excerpt } from './cms';
import { albums as allAlbums, albumFor, total } from './albums';

export const countrySlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Extra words that identify a country in story text (cities and adjectives that appear in the sources).
const ALIASES: Record<string, string[]> = {
  'Ukraine': ['Ukrainian', 'Kyiv', 'Kiev'],
  'Philippines': ['Filipino', 'Cebu', 'Leyte', 'Panglao', 'Iriga', 'Bohol', 'Mindanao', 'Luzon', 'Aeta'],
  'Kenya': ['Kenyan', 'Nairobi', 'Ngobit', 'Tsavo', 'Ol Pejeta'],
  'Ethiopia': ['Ethiopian', 'Addis Ababa'],
  'Uganda': ['Ugandan', 'Kampala'],
  'Belize': ['Belizean'],
  'Cuba': ['Cuban', 'Havana'],
  'Guatemala': ['Guatemalan'],
  'Honduras': ['Honduran'],
  'Mexico': ['Mexican'],
  'Chile': ['Chilean'],
  'Ghana': ['Ghanaian', 'Accra'],
  'Nicaragua': ['Nicaraguan'],
  'USA (Hurricane Katrina)': ['Katrina', 'New Orleans'],
  'East Timor': ['Timor-Leste', 'Timor'],
};
// Stories that name a country without being about it (checked by hand; found by the migration audit, 05.11).
const NOT_ABOUT: Record<string, string[]> = {
  'Congo': ['kenya-loading-september-2025'],      // in memory of a "High Commissioner to the Congo"; the container went to Kenya
  'Bolivia': ['northern-chile-community'],
  'Peru': ['northern-chile-community'],
  'South Africa': ['rotary-world-help-filling-hospitals-a-world-away'], // only as a shipping-cost example         // Iquique is "near the northern border with Peru and Bolivia"; the container went to Chile
};
const terms = (name: string) => [name.replace(/\s*\(.*\)/, ''), ...(ALIASES[name] ?? [])];
const re = (name: string) => new RegExp(`\\b(${terms(name).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

export type CountryPage = ReturnType<typeof build>;
function build(c: (typeof countries)[number]) {
  const r = re(c.name);
  const stories = news.filter(p => !(NOT_ABOUT[c.name] ?? []).includes(p.slug) && (r.test(p.title) || r.test(p.text))).map(p => ({ slug: p.slug, title: p.title, date: p.date, image: p.image, excerpt: excerpt(p, 150) }));
  const ships = shipments.filter(s => r.test(s.country)).map(s => ({ ...s, album: albumFor(s.date, s.country) }));
  const albums = allAlbums.filter(a => a.extra && r.test(a.country)).map(a => ({ ...a, n: total(a) }));
  const archived = archive.flatMap(y => y.items.filter(i => r.test(i)).map(i => ({ year: y.year, text: i })));
  const vids = Object.values(videos).filter(v => r.test(v.title) || r.test(v.caption ?? '')).map(v => v.id);
  return { ...c, slug: countrySlug(c.name), stories, ships, albums, archived, vids };
}

export const countryPages = countries.map(build).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
export const countryBySlug = Object.fromEntries(countryPages.map(c => [c.slug, c]));
export const countryHref = (name: string) => `/countries/${countrySlug(name)}`;
