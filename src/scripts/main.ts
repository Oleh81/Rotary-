const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s) as any) as T[];

/* Reveal on scroll */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
$$('.reveal, .reveal-x, .reveal-scale, .clip-in, [data-reveal-root]').forEach(el => io.observe(el));

/* Number tickers: the real value is already in the HTML; we only animate up to it. */
const fmt = (n: number, dec: number) => n.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const countIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    countIO.unobserve(e.target);
    const el = e.target as HTMLElement;
    const to = Number(el.dataset.count); const dec = Number(el.dataset.dec || 0);
    if (reduce || !to) { el.textContent = fmt(to, dec); continue; }
    const dur = 2200; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * eased, p < 1 ? dec : dec);
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0, dec);
    requestAnimationFrame(step);
  }
}, { threshold: 0.4 });
$$('[data-count]').forEach(el => countIO.observe(el));

/* Header: solid after scrolling, hides on scroll down, shows on scroll up */
const header = document.querySelector<HTMLElement>('[data-header]');
const donateBar = document.querySelector<HTMLElement>('[data-donate-bar]');
let lastY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  if (header) {
    if (header.dataset.overlay === 'true') {
      header.classList.toggle('is-solid', y > 40);
      header.classList.toggle('text-white', y <= 40);
    }
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 4 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 4) header.classList.remove('is-hidden');
  }
  if (donateBar) donateBar.dataset.show = String(y > window.innerHeight * 0.8);
  lastY = y;
};
let scrollTick = false;
window.addEventListener('scroll', () => { if (scrollTick) return; scrollTick = true; requestAnimationFrame(() => { scrollTick = false; onScroll(); }); }, { passive: true });
onScroll();

/* Mobile menu */
const menu = document.getElementById('mobile-menu');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');
const setMenu = (open: boolean) => {
  if (!menu) return;
  menu.dataset.open = String(open);
  openBtn?.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) closeBtn?.focus(); else openBtn?.focus();
};
openBtn?.addEventListener('click', () => setMenu(true));
closeBtn?.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.dataset.open === 'true') setMenu(false);
  if (e.key === 'Tab' && menu?.dataset.open === 'true') {
    const f = $$<HTMLElement>('a, button', menu); const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* Magnetic buttons + cursor spotlight (pointer devices only) */
if (fine && !reduce) {
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('.spot').forEach(el => el.addEventListener('pointermove', (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
  // Subtle 3D tilt
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6, ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* Video facade: poster first, real <video> only after a click */
$$('[data-video]').forEach(box => {
  const btn = box.querySelector('button');
  btn?.addEventListener('click', () => {
    const v = document.createElement('video');
    v.src = box.dataset.video!; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
    v.className = 'absolute inset-0 h-full w-full bg-black object-contain';
    v.setAttribute('aria-label', box.dataset.title || 'Video');
    box.querySelectorAll('img, button, .bg-gradient-to-t').forEach(n => n.remove());
    box.appendChild(v);
    v.play().catch(() => {});
    v.focus();
  });
});

/* Hero background video: only when motion is allowed and the connection is not constrained */
const hv = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (hv) {
  const saveData = (navigator as any).connection?.saveData;
  if (reduce || saveData) { hv.removeAttribute('autoplay'); hv.pause(); }
  else {
    const src = window.innerWidth < 768 ? hv.dataset.srcSm : hv.dataset.src;
    if (src) { hv.src = src; hv.play().catch(() => {}); }
  }
  document.querySelector('[data-hero-toggle]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    if (hv.paused) { if (!hv.src) hv.src = hv.dataset.src!; hv.play(); b.setAttribute('aria-pressed', 'false'); b.querySelector('span')!.textContent = 'Pause background video'; }
    else { hv.pause(); b.setAttribute('aria-pressed', 'true'); b.querySelector('span')!.textContent = 'Play background video'; }
  });
}

/* Map tooltip */
$$('[data-map]').forEach(map => {
  const tip = map.querySelector<HTMLElement>('.map-tip');
  const wrap = tip?.parentElement;
  const show = (dot: Element) => {
    if (!tip || !wrap) return;
    const n = (dot as HTMLElement).dataset.name, c = Number((dot as HTMLElement).dataset.containers);
    tip.textContent = `${n} · ${c} ${c === 1 ? 'container' : 'containers'}`;
    const r = dot.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    tip.style.left = `${Math.min(w.width - 180, Math.max(8, r.left - w.left - 40))}px`;
    tip.style.top = `${Math.max(8, r.top - w.top - 44)}px`;
    tip.style.opacity = '1';
  };
  const hide = () => { if (tip) tip.style.opacity = '0'; };
  $$('.map-dot', map).forEach(d => {
    d.addEventListener('pointerenter', () => show(d)); d.addEventListener('pointerleave', hide);
    d.addEventListener('focus', () => show(d)); d.addEventListener('blur', hide);
  });
});

/* Lightbox for galleries */
const lb = document.querySelector<HTMLDialogElement>('dialog.lightbox');
if (lb) {
  const img = lb.querySelector('img')!; const cap = lb.querySelector('figcaption')!;
  let list: HTMLAnchorElement[] = []; let idx = 0;
  const open = (i: number) => {
    idx = (i + list.length) % list.length; const a = list[idx];
    img.src = a.href; img.alt = a.dataset.alt || ''; cap.textContent = `${a.dataset.caption || ''} · ${idx + 1} of ${list.length}`;
    if (!lb.open) lb.showModal();
  };
  $$<HTMLAnchorElement>('a[data-lightbox]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    list = $$<HTMLAnchorElement>(`a[data-lightbox="${a.dataset.lightbox}"]`);
    open(list.indexOf(a));
  }));
  lb.querySelector('[data-lb-prev]')?.addEventListener('click', () => open(idx - 1));
  lb.querySelector('[data-lb-next]')?.addEventListener('click', () => open(idx + 1));
  lb.querySelector('[data-lb-close]')?.addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') open(idx - 1); if (e.key === 'ArrowRight') open(idx + 1); });
  let sx = 0;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) open(idx + (dx < 0 ? 1 : -1)); });
}

/* Timeline rail progress */
const rails = $$('[data-rail]');
if (rails.length) {
  const upd = () => rails.forEach(r => {
    const b = r.getBoundingClientRect(); const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.6 - b.top) / b.height));
    r.style.setProperty('--p', reduce ? '1' : String(p));
  });
  let railTick = false;
  window.addEventListener('scroll', () => { if (railTick) return; railTick = true; requestAnimationFrame(() => { railTick = false; upd(); }); }, { passive: true }); upd();
}

/* Horizontal scrollers: buttons */
$$('[data-scroller]').forEach(s => {
  const track = s.querySelector<HTMLElement>('[data-track-x]');
  s.querySelector('[data-prev]')?.addEventListener('click', () => track?.scrollBy({ left: -track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }));
  s.querySelector('[data-next]')?.addEventListener('click', () => track?.scrollBy({ left: track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }));
});

/* Auto-drift: scrollers marked data-autoplay glide slowly and endlessly so visitors see there is more.
   Real cards are recycled (first card moves to the end), so every card keeps working. It stops while the
   visitor hovers, touches, focuses, or plays a video, when off screen, and never runs with reduced motion. */
$$<HTMLElement>('[data-scroller][data-autoplay] [data-track-x]').forEach(track => {
  if (reduce) return;
  const SPEED = 28; // px per second
  let pos = track.scrollLeft, last = 0, visible = false, holdUntil = 0, raf = 0;
  const playing = () => $$<HTMLVideoElement>('video', track).some(v => !v.paused);
  const hold = (ms = 4000) => { holdUntil = performance.now() + ms; };
  const busy = () => track.matches(':hover, :focus-within') || playing() || document.hidden;
  const step = (t: number) => {
    raf = requestAnimationFrame(step);
    const dt = last ? Math.min(64, t - last) : 0; last = t;
    if (!visible || t < holdUntil || busy()) { pos = track.scrollLeft; track.classList.remove('is-drifting'); return; }
    track.classList.add('is-drifting');
    pos += SPEED * dt / 1000;
    const first = track.firstElementChild as HTMLElement | null;
    if (first) {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const w = first.offsetWidth + gap;
      if (pos >= w) { track.appendChild(first); pos -= w; }
    }
    track.scrollLeft = pos;
  };
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev => track.addEventListener(ev, () => hold(6000), { passive: true }));
  track.closest('[data-scroller]')?.querySelectorAll('[data-prev], [data-next]').forEach(b => b.addEventListener('click', () => hold(6000)));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(step); }).observe(track);
});

/* Announcement bar */
const bar = document.querySelector<HTMLElement>('[data-announce]');
try { if (bar && sessionStorage.getItem('rwh-bar') === bar.dataset.announce) bar.remove(); } catch {}
bar?.querySelector('button')?.addEventListener('click', () => { try { sessionStorage.setItem('rwh-bar', bar.dataset.announce!); } catch {} bar.remove(); });

/* Forms */
async function token(): Promise<string> {
  try { const r = await fetch('/api/submit', { cache: 'no-store' }); return (await r.json()).token; } catch { return ''; }
}
$$<HTMLFormElement>('form[data-form]').forEach(async form => {
  const t = form.querySelector<HTMLInputElement>('input[name="t"]')!;
  t.value = await token();
  const status = form.querySelector<HTMLElement>('.form-status')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    $$('.field-error', form).forEach(el => el.remove());
    // Client-side check of required fields first
    const missing = $$<HTMLInputElement>('[required]', form).filter(i => !i.value.trim() || (i.type === 'email' && !i.checkValidity()) || (i.type === 'checkbox' && !i.checked));
    if (missing.length) {
      missing.forEach(i => { i.setAttribute('aria-invalid', 'true'); const p = document.createElement('p'); p.className = 'field-error text-sm text-[#b42318] font-semibold'; p.textContent = i.type === 'email' && i.value ? 'Please enter a valid email address.' : 'This field is required.'; p.id = `${i.id}-err`; i.setAttribute('aria-describedby', p.id); (i.closest('.field') || i.parentElement)?.appendChild(p); });
      status.textContent = `Please complete ${missing.length === 1 ? 'the highlighted field' : `the ${missing.length} highlighted fields`}.`;
      missing[0].focus();
      return;
    }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const label = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
    status.textContent = '';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      const out = await res.json();
      if (out.ok) {
        status.textContent = out.message;
        form.reset();
        t.value = await token();
        form.dispatchEvent(new CustomEvent('rwh:sent'));
      } else {
        status.textContent = out.error || 'Something went wrong. Please try again.';
        if (out.errors) for (const name of Object.keys(out.errors)) form.querySelector(`[name="${name}"]`)?.setAttribute('aria-invalid', 'true');
        if (res.status === 400 && /expired/.test(out.error)) t.value = await token();
      }
    } catch {
      status.textContent = 'Network error. Please check your connection and try again.';
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = label!; }
    }
  });
});

/* Multi-step aid form */
$$('[data-steps]').forEach(wrap => {
  const steps = $$('[data-step]', wrap); let i = 0;
  const prog = wrap.querySelector<HTMLElement>('[data-progress]');
  const label = wrap.querySelector<HTMLElement>('[data-step-label]');
  const show = (n: number) => {
    i = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, k) => { s.hidden = k !== i; });
    if (prog) prog.style.transform = `scaleX(${(i + 1) / steps.length})`;
    if (label) label.textContent = `Part ${i + 1} of ${steps.length}: ${steps[i].dataset.step}`;
    wrap.querySelector<HTMLButtonElement>('[data-step-prev]')!.hidden = i === 0;
    wrap.querySelector<HTMLButtonElement>('[data-step-next]')!.hidden = i === steps.length - 1;
    wrap.querySelector<HTMLButtonElement>('button[type="submit"]')!.hidden = i !== steps.length - 1;
  };
  wrap.querySelector('[data-step-prev]')?.addEventListener('click', () => { show(i - 1); steps[i].querySelector<HTMLElement>('input, textarea, select')?.focus(); });
  wrap.querySelector('[data-step-next]')?.addEventListener('click', () => {
    const missing = $$<HTMLInputElement>('[required]', steps[i]).filter(x => !x.value.trim() || !x.checkValidity());
    $$('.field-error', steps[i]).forEach(e => e.remove());
    if (missing.length) {
      missing.forEach(x => { x.setAttribute('aria-invalid', 'true'); const p = document.createElement('p'); p.className = 'field-error text-sm text-[#b42318] font-semibold'; p.textContent = x.type === 'email' && x.value ? 'Please enter a valid email address.' : 'This field is required.'; p.id = `${x.id}-err`; x.setAttribute('aria-describedby', p.id); (x.closest('.field') || x.parentElement)?.appendChild(p); });
      if (label) label.textContent = `Please fill in ${missing.length === 1 ? 'the required field' : `the ${missing.length} required fields`} in this part.`;
      missing[0].focus(); return;
    }
    show(i + 1); steps[i].querySelector<HTMLElement>('input, textarea, select')?.focus();
  });
  wrap.addEventListener('rwh:sent', () => show(0));
  show(0);
});

/* Map: run the in-flight animation only while the map is on screen */
const liveIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('map-live', e.isIntersecting)), { rootMargin: '100px' });
$$('[data-map] svg').forEach(svg => liveIO.observe(svg));
/* Scale the light layer to the rendered map (paths are in map units) */
$$<HTMLElement>('.map-comets').forEach(layer => {
  const svg = layer.parentElement!.querySelector('svg')!; const w = Number(layer.dataset.w);
  const fit = () => layer.style.setProperty('--k', String(svg.clientWidth / w));
  new ResizeObserver(fit).observe(svg); fit();
  liveIO.observe(layer);
});

/* Loading cartoon: animate only while on screen */
const cartoonIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '50px' });
$$('[data-cartoon]').forEach(el => cartoonIO.observe(el));
