import manifest from '../data/images.json';
import uploads from '../data/uploads.json';
type Entry = { w: number; h: number; sizes: number[] };
type Upload = Entry & { base: string };
const m = manifest as Record<string, Entry>;
const u = uploads as Record<string, Upload>;

const build = (url: (s: number) => string, e: Entry) => {
  const sizes = [...e.sizes].sort((a, b) => a - b);
  const largest = sizes[sizes.length - 1];
  return {
    src: url(sizes.find(s => s >= 960) ?? largest),
    srcset: sizes.map(s => `${url(s)} ${s}w`).join(', '),
    width: e.w, height: e.h,
    large: url(largest),
  };
};

/** An image is either an id from the original site import, or a path of a photo uploaded in the admin (/uploads/…). */
const lh3 = (id: string, w: number) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
export function img(id: string | null | undefined) {
  if (!id) return null;
  if (id.startsWith('drive:')) { const d = id.slice(6); return { src: lh3(d, 960), srcset: `${lh3(d, 480)} 480w, ${lh3(d, 960)} 960w`, width: undefined, height: undefined, large: lh3(d, 1600) }; }
  if (id.startsWith('/')) {
    const e = u[id];
    if (e) return build(s => `/media/up/${e.base}-${s}.webp`, e);
    return { src: id, srcset: undefined, width: undefined, height: undefined, large: id };
  }
  const e = m[id];
  return e ? build(s => `/media/img/${id}-${s}.webp`, e) : null;
}
export const hasImg = (id: string | null | undefined) => !!id && (id.startsWith('/') || id.startsWith('drive:') || !!m[id]);
