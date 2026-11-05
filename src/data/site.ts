// All facts below come from rotaryworldhelp.com and old.rotaryworldhelp.com.
// Text was proofread (spelling, grammar, punctuation) without changing facts.

import settings from '../content/settings.json';
import clubList from '../content/clubs.json';

// Editable in the admin (/keystatic): key figures, contacts, donate link, banner, clubs.
export const DONATE_URL = settings.donateUrl;
export const announcement = settings.announcement;
export const ORIGINAL_DONATION_PAGE = 'https://rotaryworldhelp.com/donation/';

export const org = {
  name: 'Rotary World Help',
  legalName: 'Rotary Clubs of the Lower Mainland of BC World Help Network',
  operatingAs: 'Operating as Rotary World Help',
  businessNumber: '', // not published on either RWH site; add once confirmed on the CRA charity list
  email: settings.contact.email,
  phone: settings.contact.phone,
  phoneHref: 'tel:+1' + settings.contact.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''),
  warehouse: {
    lines: ['Distribution Building (Building P)', 'Thistle Place, Riverview Hospital grounds', '2601 Lougheed Hwy', 'Coquitlam, BC'],
    gps: 'Thistle Place, Coquitlam, BC',
    maps: 'https://www.google.com/maps/search/?api=1&query=Thistle+Place%2C+Coquitlam%2C+BC',
  },
  mailing: ['P.O. Box 51342', 'Cameron Post Office, #104-3433 North Road', 'Burnaby, BC V3J 0C9', 'Canada'],
  facebook: 'https://www.facebook.com/rotaryworldhelp/',
  youtube: 'https://www.youtube.com/@rotaryworldhelp8182',
};

// Current totals as published on the rotaryworldhelp.com home page (counter widget values).
export const stats = {
  ...settings.stats,
  source: 'rotaryworldhelp.com home page, November 2026',
};

// Per-container figures published on "How Your Rotary Club Can Join".
export const perContainer = {
  replacementValue: 350000,
  livesImpacted: 30000,
  adminFee: 1500,
  memberFeePerMember: 10,
};

// History milestones (Our Story, About Us on the old site, RWH Story PDF, published articles).
export const milestones = [
  { year: '1992', title: 'A visit to Kyiv', text: 'Vancouver Rotarians helping to charter the first Rotary club in Kyiv, Ukraine, visit the Chernobyl Children’s Hospital. Eight doctors share one stethoscope. Surgeons reuse gloves autoclaved until they turn brown.' },
  { year: '1993', title: 'The first container', text: 'The late Ted Segodnia, with fellow Vancouver Rotarians Bill Richwa and Ralph Towsley, organizes the first shipment of medical supplies and equipment to Kyiv.' },
  { year: '1997', title: 'Sanctioned by Rotary International', text: 'The project outgrows one club. Seven Rotary clubs form the World Help Network, sanctioned by Rotary International in September 1997 and registered as a charity.' },
  { year: '2012', title: '$100 million shipped', text: 'The estimated value of goods shipped passes $100 million, and the network adopts the shorter name Rotary World Help.' },
  { year: '2013', title: 'Container No. 300', text: 'Rotary World Help ships its 300th container.' },
  { year: '2016', title: 'Container No. 350', text: 'On August 13, 2016 our 350th container is loaded for Odessa, Ukraine, twenty years after Rotary World Help started shipping to Kyiv.' },
  { year: '2019', title: '400 containers', text: 'On May 18, 2019 Rotary World Help marks its 400th container anniversary with a loading for Kyiv, Ukraine.' },
  { year: 'Today', title: '482 containers, 65 countries', text: 'Forty-four member Rotary clubs and a team of volunteers keep the warehouse in Coquitlam busy, loading more than a dozen containers a year.' },
];

export const process = [
  { n: '01', title: 'Request', text: 'A Rotary club abroad submits a Request for Aid. Our only criterion for aid is need.' },
  { n: '02', title: 'Collect', text: 'Volunteers pick up equipment from BC hospitals, clinics, care homes, dental offices, schools and universities, diverting it from the waste stream.' },
  { n: '03', title: 'Sort & record', text: 'Every item is inspected, sorted, packed and recorded at our warehouse on the Riverview grounds in Coquitlam.' },
  { n: '04', title: 'Load & seal', text: 'Rotarians load a 40-foot container as full as possible and seal it. Only the receiver opens it.' },
  { n: '05', title: 'Ship', text: 'Sponsoring clubs cover shipping to the receiving country’s main port, Rotary club to Rotary club.' },
  { n: '06', title: 'Distribute & report', text: 'The recipient club clears customs, delivers the goods and sends a Cargo Distribution Report within three months.' },
];

// directors: now edited in the admin (src/content), read via src/lib/cms.ts

export const clubs: { name: string; founding?: boolean; website?: string }[] = clubList.clubs;

export const awards = {
  macrae: {
    title: 'Donald MacRae Peace Award',
    text: 'Rotary World Help of BC received the Donald MacRae Peace Award for its contribution of an estimated $95 million in humanitarian medical and educational equipment to 51 developing countries. The award is given annually to the individual or group of Rotarians in Canada, Alaska or the Russian Republic who has made the greatest contribution to international peace through humanitarian work.',
    img: '314',
  },
  ralphieIntro: 'In 2015 we created a very special award for individuals who have demonstrated exceptional Service Above Self to Rotary World Help. It is not necessarily given every year; when it is, it is presented at the AGM. The award is called “The Ralphie” in honour of Ralph Towsley, the surviving member of the three founders of Rotary World Help.',
  ralphies: [
    { year: '2015', name: 'Ralph Towsley', text: 'The first “Ralphie” for Exceptional Service Above Self. Ralph is one of the three founding members and never misses a meeting or a loading.', img: '299' },
    { year: '2016', name: 'George and Lorraine Sandwith', text: 'With RWH since its inception. George ran the warehouse, and Lorraine oversaw sorting, packing and recording all donated items. George is a member of the New Westminster Rotary Club.', img: '316' },
    { year: '2017', name: 'Dan Gallant', text: 'With RWH for many years, Dan oversaw all trucking and took over warehouse duties when George Sandwith retired. A long-time Rotarian with 35 years of perfect attendance, Port Moody Rotary Club.', img: '317' },
    { year: '2018', name: 'D’Arcy Warner', text: 'A dedicated RWH member with the Vancouver Rotary Club, D’Arcy has contributed as an officer, a director and our long-standing secretary.', img: '1534' },
    { year: '2022', name: 'Elena Agala', text: '', img: '1537' },
    { year: '2022', name: 'Wayne Crossen', text: '', img: '1536' },
    { year: '2023', name: 'Bobby Yagin', text: '', img: '1535' },
    { year: '2023', name: 'Ron Allegretto', text: '', img: '1590' },
    { year: '2024', name: 'Flora and Bernie Pregler', text: '', img: '1591' },
    { year: '2024', name: 'Jim McGrandles', text: '', img: '1592' },
    { year: '2024', name: 'Michael and Jane Woolnough', text: '', img: '1593' },
    { year: '2024', name: 'Janice Froese', text: '', img: '' },
  ],
};

export const sponsors = [
  { name: 'Argus Carriers', img: '304' },
  { name: 'TD Bank', img: '309' },
  { name: 'Days for Girls', img: '306' },
  { name: 'ColorTrek', img: '307' },
  { name: 'Sunbelt Rentals', img: '' },
];

// Countries and number of containers, from the RWH chart "RWH Shipments – 61 Countries" (May 2022).
// Names without a number had one container. Coordinates are approximate country centroids for the map.
export const countries: { name: string; count: number; lon: number; lat: number }[] = [
  ['Albania', 1, 20.0, 41.1], ['Antigua and Barbuda', 1, -61.8, 17.1], ['Argentina', 2, -64.0, -34.0], ['Armenia', 1, 45.0, 40.1],
  ['Barbados', 1, -59.5, 13.2], ['Belize', 9, -88.7, 17.2], ['Bolivia', 7, -64.7, -16.3], ['Brazil', 2, -51.9, -14.2],
  ['Cambodia', 2, 104.9, 12.6], ['Chile', 22, -71.0, -30.0], ['Colombia', 2, -74.3, 4.6], ['Congo', 7, 15.8, -0.7],
  ['Cook Islands', 4, -159.8, -21.2], ['Costa Rica', 1, -84.0, 9.9], ['Cuba', 6, -79.5, 21.5], ['Dominican Republic', 4, -70.2, 18.7],
  ['East Timor', 1, 125.7, -8.9], ['Ecuador', 4, -78.2, -1.8], ['El Salvador', 12, -88.9, 13.8], ['Estonia', 7, 25.0, 58.6],
  ['Ethiopia', 2, 40.5, 9.1], ['Fiji', 1, 178.1, -17.7], ['Georgia', 1, 43.4, 42.3], ['Ghana', 5, -1.0, 7.9],
  ['Greece', 2, 21.8, 39.1], ['Grenada', 1, -61.7, 12.1], ['Guatemala', 5, -90.2, 15.8], ['Guyana', 1, -58.9, 4.9],
  ['Haiti', 4, -72.3, 19.0], ['Honduras', 17, -86.2, 15.2], ['Indonesia', 1, 113.9, -0.8], ['Kenya', 23, 37.9, 0.0],
  ['Lesotho', 1, 28.2, -29.6], ['Liberia', 2, -9.4, 6.4], ['Malaysia', 1, 101.9, 4.2], ['Nepal', 4, 84.1, 28.4],
  ['Papua New Guinea', 1, 143.9, -6.3], ['Nicaragua', 3, -85.2, 12.9], ['Panama', 16, -80.8, 8.5], ['Paraguay', 1, -58.4, -23.4],
  ['Peru', 2, -75.0, -9.2], ['Philippines', 115, 121.8, 12.9], ['Poland', 1, 19.1, 51.9], ['Romania', 3, 25.0, 45.9],
  ['Samoa', 1, -172.1, -13.8], ['Serbia', 1, 21.0, 44.0], ['Sierra Leone', 2, -11.8, 8.5], ['South Africa', 17, 22.9, -30.6],
  ['Tajikistan', 1, 71.3, 38.9], ['Tanzania', 6, 34.9, -6.4], ['Thailand', 3, 101.0, 15.9], ['Tonga', 1, -175.2, -21.2],
  ['Trinidad and Tobago', 1, -61.2, 10.7], ['Uganda', 23, 32.3, 1.4], ['Ukraine', 25, 31.2, 48.4], ['Uruguay', 14, -55.8, -32.5],
  ['USA (Hurricane Katrina)', 2, -90.1, 30.0], ['Venezuela', 2, -66.6, 6.4], ['Vietnam', 4, 108.3, 14.1], ['Zambia', 1, 27.8, -13.1],
  ['Zimbabwe', 12, 29.2, -19.0],
].map(([name, count, lon, lat]) => ({ name: name as string, count: count as number, lon: lon as number, lat: lat as number }));

export const COQUITLAM = { lon: -122.8, lat: 49.28 };

// Container loadings with photos. Edited in the admin (Loadings); the first 24 came from the Gallery page of the current site.
// Photos: ids imported from the old site first, then photos uploaded in the admin.
// A loading can also link a public Google Drive folder; scripts/loading-drive.mjs lists its files at build time.
import driveLists from './loading-drive.json';
type LoadingFile = { title: string; date: string | null; country: string; sponsor: string; story?: string; drive?: string | null; photos: { image: string | null; caption: string }[]; imported?: string[] };
type DriveList = { photos: string[]; videos: string[]; error?: string };
const folderId = (u?: string | null) => u?.match(/\/folders\/([\w-]{10,})/)?.[1] ?? u?.match(/[?&]id=([\w-]{10,})/)?.[1] ?? null;
export const shipments = Object.values(import.meta.glob<LoadingFile>('../content/loadings/*.json', { eager: true, import: 'default' }))
  .filter(l => l.date && l.country)
  .map(l => {
    const local = [...(l.imported ?? []), ...l.photos.map(p => p.image).filter((x): x is string => !!x)];
    const id = folderId(l.drive);
    const list = id ? (driveLists as Record<string, DriveList>)[id] : undefined;
    const drive = id && list ? { folder: `https://drive.google.com/drive/folders/${id}`, photos: list.photos, videos: list.videos } : null;
    // photos: what tiles show everywhere (gallery, home, country pages): own photos, or the Drive ones when there are none.
    return { date: l.date!, country: l.country, sponsor: l.sponsor, story: l.story?.trim() ?? '', local, drive,
      photos: local.length ? local : (drive?.photos ?? []).slice(0, 12).map(p => `drive:${p}`) };
  })
  .sort((a, b) => b.date.localeCompare(a.date));


// Earlier loadings listed on the old site's photo archive pages.
export const archive: { year: string; items: string[] }[] = [
  { year: '2023', items: ['Dec 9 – Ukraine, sponsored by the Rotary Club of Vancouver Arbutus', 'Nov 25 – Cebu, Philippines', 'Oct 7 – Kenya, sponsored by Bonnie Sutherland', 'Sep 27 – Ukraine, Ukrainian Canadian Social Services', 'Sep 23 – Guatemala, Health for Humanity Service Society and Access to Education Collaborative', 'Aug 12 – Ukraine, Vancouver Arbutus Rotary Club', 'Jun 24 – Ukraine, Ukrainian Canadian Social Services', 'Jun 3 – Ukraine, Ukrainian Canadian Social Services', 'May 6 – Guatemala, Health for Humanity Service Society and Access to Education Collaborative', 'Mar 18 – Ukraine, Ukrainian Canadian Social Services', 'Mar 4 – Ethiopia, sponsored by Markos Tegegn', 'Feb 18 – Ukraine, Ukrainian Canadian Social Services', 'Feb 4 – Ethiopia, sponsored by Markos Tegegn', 'Jan 14 – Ukraine, Ukrainian Canadian Social Services'] },
  { year: '2022', items: ['Dec 17 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Dec 3 – Ethiopia', 'Nov 19 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Nov 5 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Oct 22 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Sep 10 – Cuba', 'Jul 9 – Ukraine, Ukrainian Canadian Social Services Vancouver and Maple Hope Foundation', 'Jun 18 – Philippines (RD Foundation)', 'Jun 11 – Belize', 'May 7 – Uruguay', 'Apr 23 – Guatemala, Health for Humanity Service Society', 'Apr 16 – Ukraine, with Maple Hope Foundation and Disaster Aid Canada', 'Mar 19 – Tanzania', 'Mar 5 – Ethiopia', 'Jan 29 – Belize'] },
  { year: '2021', items: ['Nov 23 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Oct 9 – Ukraine, Ukrainian Canadian Social Services Vancouver', 'Sep 25 – Montevideo, Uruguay', 'Jul 3 – Philippines, RD Foundation', 'Jun 12 – Guatemala, Health for Humanity Service Society', 'May 15 – Philippines, RD Foundation', 'Apr 10 – Cebu, Philippines', 'Mar 16 – Belize', 'Feb 26 – Cape Town, South Africa'] },
];

export type Video = { id: string; title: string; caption?: string; dur?: number };
export const videos: Record<string, Video> = {
  'belize-scooter': { id: 'belize-scooter', title: 'A life-changing scooter donated by RWH to Belize' },
  'child-story': { id: 'child-story', title: 'A child whose life we have helped to change' },
  'belize-thank-you': { id: 'belize-thank-you', title: 'A heartfelt thank you to the Port Moody Rotary Club from Belize' },
  'cuba-unloading': { id: 'cuba-unloading', title: 'Unloading a shipment in Cuba', caption: 'Greatly appreciated by our doctor sponsor in Cuba.' },
  'global-tv-this-is-bc': { id: 'global-tv-this-is-bc', title: 'Global TV – This is BC: Volunteers help patients worldwide' },
  'rotaractors-langley': { id: 'rotaractors-langley', title: 'A video produced by two Rotaractors from the Langley Rotary Club' },
  'palo-leyte-arrival': { id: 'palo-leyte-arrival', title: 'Container arrives in Palo, Leyte, Philippines', caption: 'Loaded at the RWH warehouse on January 11, 2025; arrived March 2, 2025.' },
  'belize-unloading-2026': { id: 'belize-unloading-2026', title: 'Belize unloading, March 2026' },
  'philippines-iriga-2026': { id: 'philippines-iriga-2026', title: 'Shipped to Iriga City, Camarines Sur, Philippines', caption: 'January 2026.' },
  'dan-gallant-tribute': { id: 'dan-gallant-tribute', title: 'Dan Gallant tribute' },
  'ngobit-school': { id: 'ngobit-school', title: 'Ngobit School, Kenya' },
  'tsavo': { id: 'tsavo', title: 'Tsavo, Kenya' },
  'ares-difference': { id: 'ares-difference', title: 'The ARES difference' },
  'ol-pejeta-ares': { id: 'ol-pejeta-ares', title: 'Ol Pejeta and the ARES connection' },
  'jamie-kyles': { id: 'jamie-kyles', title: 'Jamie Kyles' },
};

export const STORY_YOUTUBE = 'dUEVlTt0fQ4'; // "Rotary World Help 2018" on the RWH YouTube channel
export const CONTAINER_400_YOUTUBE = 't_sDBN5V7pQ';

// newsletters: now edited in the admin (src/content), read via src/lib/cms.ts

// annualReports: now edited in the admin (src/content), read via src/lib/cms.ts

export const nav = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Impact', href: '/our-impact', children: [
    { label: 'Our impact', href: '/our-impact' },
    { label: 'Countries we help', href: '/countries' },
  ] },
  { label: 'Gallery', href: '/gallery' },
  { label: 'News', href: '/news' },
  { label: 'Get Involved', href: '/get-involved', children: [
    { label: 'Donate', href: '/donate' },
    { label: 'How your club can join', href: '/join' },
    { label: 'Request aid', href: '/request-aid' },
  ] },
  { label: 'About', href: '/directors', children: [
    { label: 'Our directors', href: '/directors' },
    { label: 'Member clubs', href: '/member-clubs' },
    { label: 'Newsletters', href: '/newsletters' },
    { label: 'Calendar', href: '/calendar' },
  ] },
  { label: 'Contact', href: '/contact' },
];
