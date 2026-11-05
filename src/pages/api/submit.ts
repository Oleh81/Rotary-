import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const prerender = false;

// Anti-spam: honeypot field, signed render token with minimum fill time, same-origin check,
// size limits, field validation and a per-IP sliding-window rate limit (per serverless instance).
const SECRET = process.env.FORM_SECRET || 'demo-only-not-a-secret';
const KINDS: Record<string, string[]> = {
  contact: ['email'],
  subscribe: ['email'],
  membership: ['club', 'members', 'contact_name', 'email'],
  aid: ['consignee_name', 'email', 'club', 'country', 'description'],
  equipment: ['email', 'items'],
  cargo: ['project', 'club', 'consignees', 'recipients', 'arrival', 'condition', 'customs', 'distribution', 'rep_present', 'name', 'phones', 'email', 'date'],
};
const hits = new Map<string, number[]>();
const json = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const sign = (t: string) => createHmac('sha256', SECRET).update(t).digest('hex').slice(0, 32);

export const GET: APIRoute = () => {
  const t = String(Date.now());
  return json(200, { token: `${t}.${sign(t)}` });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return json(403, { ok: false, error: 'Request blocked.' });
  if (Number(request.headers.get('content-length') || 0) > 20000) return json(413, { ok: false, error: 'Message is too long.' });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(x => now - x < 10 * 60_000);
  if (recent.length >= 5) return json(429, { ok: false, error: 'Too many submissions. Please try again in a few minutes.' });
  recent.push(now); hits.set(ip, recent);

  let data: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) data = await request.json();
    else data = Object.fromEntries([...(await request.formData()).entries()].map(([k, v]) => [k, String(v)]));
  } catch { return json(400, { ok: false, error: 'Could not read the form.' }); }

  // Honeypot: bots fill every field. Pretend success so they do not retry.
  if (data.website) return json(200, { ok: true, message: 'Thank you!' });

  const [ts, sig] = String(data.t || '').split('.');
  const age = now - Number(ts);
  const valid = ts && sig && sig.length === 32 && timingSafeEqual(Buffer.from(sig), Buffer.from(sign(ts)));
  if (!valid || age > 6 * 3600_000) return json(400, { ok: false, error: 'This form expired. Please reload the page and try again.' });
  if (age < 3000) return json(400, { ok: false, error: 'That was fast! Please take a moment and submit again.' });

  const required = KINDS[data.kind];
  if (!required) return json(400, { ok: false, error: 'Unknown form.' });
  const errors: Record<string, string> = {};
  for (const f of required) if (!String(data[f] || '').trim()) errors[f] = 'This field is required.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Please enter a valid email address.';
  for (const [k, v] of Object.entries(data)) if (String(v).length > 4000) errors[k] = 'This answer is too long.';
  const links = Object.values(data).join(' ').match(/https?:\/\//g)?.length || 0;
  if (links > 3) return json(400, { ok: false, error: 'Please remove some links and try again.' });
  if (Object.keys(errors).length) return json(422, { ok: false, error: 'Please check the highlighted fields.', errors });

  // Demo: the submission is accepted but not stored or emailed. No personal data is logged.
  console.log(`[form] accepted kind=${data.kind} fields=${Object.keys(data).length}`);
  const messages: Record<string, string> = {
    subscribe: 'Thanks! You are on the list.',
    contact: 'Thank you! Your message has been received.',
    membership: 'Thank you! Your club’s membership request has been received.',
    aid: 'Thank you! Your Request for Aid has been received and will be reviewed by the Shipping Manager.',
    equipment: 'Thank you! We will contact you about your equipment donation.',
    cargo: 'Thank you! Your Cargo Distribution Report has been received.',
  };
  return json(200, { ok: true, message: messages[data.kind] });
};
