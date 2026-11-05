// Content edited in the admin (/keystatic) is read here at build time.
import Markdoc from '@markdoc/markdoc';
import { createReader } from '@keystatic/core/reader';
import config from '../../keystatic.config';

const reader = createReader(process.cwd(), config);

export type Post = {
  slug: string; title: string; date: string; summary: string;
  image: string | null; imageAlt: string; images: { src: string; caption: string }[];
  videos: string[]; youtube: string | null; html: string; text: string;
};

const ytId = (u: string | null) => u?.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? null;
const plain = (node: any): string => node?.type === 'text' ? String(node.attributes.content) : (node?.children ?? []).map(plain).join(node?.type === 'paragraph' ? '\n' : '');

const entries = await reader.collections.news.all();
export const news: Post[] = (await Promise.all(entries.map(async ({ slug, entry: e }) => {
  const { node } = await e.body();
  const html = Markdoc.renderers.html(Markdoc.transform(node));
  const text = plain(node).replace(/\s+\n/g, '\n').trim();
  return {
    slug, title: e.title, date: e.date ?? '', summary: e.summary,
    image: e.cover, imageAlt: e.coverAlt,
    images: e.photos.filter(p => p.image).map(p => ({ src: p.image!, caption: p.caption })),
    videos: [...e.videos], youtube: ytId(e.youtube), html, text,
  };
}))).sort((a, b) => b.date.localeCompare(a.date));

/** First real paragraph, for cards and meta descriptions. */
export const excerpt = (p: Post, max = 160) => {
  const s = p.summary || p.text.split('\n').find(l => l.length > 40) || p.text || p.title;
  return s.length > max ? s.slice(0, s.lastIndexOf(' ', max - 1)) + '…' : s;
};

export const events = (await reader.collections.events.all()).map(({ slug, entry }) => ({ slug, ...entry, date: entry.date ?? '' }))
  .sort((a, b) => b.date.localeCompare(a.date));

export const documents = (await reader.collections.documents.all()).map(({ slug, entry }) => ({ slug, ...entry, date: entry.date ?? '', href: entry.file || entry.link }))
  .filter(d => d.href).sort((a, b) => b.date.localeCompare(a.date));

export const directors = (await reader.collections.directors.all()).map(({ slug, entry }) => ({ slug, ...entry }))
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name));
