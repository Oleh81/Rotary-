// Isometric 3D loading scene for the home page: volunteers and a forklift move medical equipment
// from the Rotary World Help warehouse up a yard ramp into a 40-foot container. three.js, no assets.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type Cargo = () => THREE.Group;
type Mover = {
  root: THREE.Group; body: THREE.Group; cargo: THREE.Group; legs: THREE.Object3D[]; arms: THREE.Object3D[];
  phase: number; trip: number; kind: 'walker' | 'forklift'; zOut: number; zBack: number; forks?: THREE.Object3D; cargoIndex: number;
};

const C = {
  ground: '#e7e1d6', lane: '#d8d0c2', wall: '#efe9de', wallTrim: '#b9ad99', floor: '#d9d2c5',
  royal: '#1d5bb8', royalDark: '#123b7a', gold: '#f7a81b', white: '#f8fafc', steel: '#9aa6b5', steelDark: '#5b6676',
  rubber: '#2b3240', mattress: '#ffffff', blanket: '#bfdbfe', carton: '#c99a5b', cartonDark: '#b5864a', pine: '#2f6b4f', pineLight: '#3f8a63',
  rackBlue: '#1f4e9c', rackOrange: '#f97316', pallet: '#b88a57', screen: '#16202e',
};
const SKIN = ['#f1c7a5', '#8d5a3b', '#d9a77c', '#5c3a26', '#e7b48f', '#b07850', '#f3d2b8'];
const VEST = ['#f97316', '#d4e157', '#f97316', '#facc15', '#22c55e', '#f97316', '#d4e157'];
const HAT = [C.gold, C.white, C.gold, C.royal, C.white, C.gold, '#ef4444'];

const mats = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.05, ...o }));
  return mats.get(k)!;
};
const geos = new Map<string, THREE.BufferGeometry>();
const rgeo = (w: number, h: number, d: number, r: number) => {
  const k = `${w}|${h}|${d}|${r}`;
  if (!geos.has(k)) geos.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)));
  return geos.get(k)!;
};
function box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, r = 0.04, o?: Partial<THREE.MeshStandardMaterialParameters>) {
  const m = new THREE.Mesh(rgeo(w, h, d, r), mat(color, o));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(rt: number, rb: number, h: number, color: string, x = 0, y = 0, z = 0, seg = 16, o?: Partial<THREE.MeshStandardMaterialParameters>) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, o));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function sphere(r: number, color: string, x = 0, y = 0, z = 0, o?: Partial<THREE.MeshStandardMaterialParameters>) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(color, o));
  m.position.set(x, y, z); m.castShadow = true; return m;
}
/** A tube between two points. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const len = a.distanceTo(b);
  const m = cyl(r, r, len, color, 0, 0, 0, 8);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function caster(x: number, z: number, y = 0.07) { const g = new THREE.Group(); g.add(cyl(0.07, 0.07, 0.05, C.rubber, x, y, z, 12)); g.children[0].rotation.x = Math.PI / 2; return g; }
function wheel(r: number, x: number, y: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 28), mat(C.rubber)); t.castShadow = true; g.add(t);
  for (let i = 0; i < 6; i++) { const s = box(0.012, r * 2, 0.012, C.steel, 0, 0, 0, 0.004); s.rotation.z = (i * Math.PI) / 6; g.add(s); }
  g.userData.spin = r; return g;
}

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/** The real Rotary World Help logo on a white panel; the image arrives a moment later and updates the texture. */
const LOGO_SRC = '/brand/rwh-logo-960.webp';
let onLogo: (() => void) | null = null;
function logoTex(w: number, h: number, pad = 0.08) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(0, 0, w, h, h * 0.12); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    const bw = w * (1 - pad * 2), bh = h * (1 - pad * 2), k = Math.min(bw / img.width, bh / img.height);
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k);
    t.needsUpdate = true; onLogo?.();
  };
  img.src = LOGO_SRC;
  return t;
}
const crossTex = canvasTex(128, 128, c => {
  c.fillStyle = C.carton; c.fillRect(0, 0, 128, 128); c.fillStyle = C.cartonDark; c.fillRect(54, 0, 20, 128);
  c.fillStyle = '#fff'; c.fillRect(14, 40, 34, 34); c.fillStyle = '#c0262d'; c.fillRect(27, 45, 8, 24); c.fillRect(19, 53, 24, 8);
});
function carton(s = 0.45, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(rgeo(s, s * 0.8, s * 0.85, 0.02), [mat(C.carton), mat(C.carton), mat(C.cartonDark), mat(C.carton), new THREE.MeshStandardMaterial({ map: crossTex, roughness: 0.8 }), mat(C.carton)] as unknown as THREE.Material);
  m.position.set(x, y + s * 0.4, z); m.castShadow = true; m.receiveShadow = true; m.rotation.y = (Math.random() - 0.5) * 0.15; return m;
}

/* ───────── cargo: each is pushed or carried in front of the volunteer, origin on the ground ───────── */
const bed: Cargo = () => {
  const g = new THREE.Group();
  g.add(box(1.9, 0.08, 0.9, C.steel, 1.25, 0.55, 0));
  g.add(box(1.84, 0.16, 0.84, C.mattress, 1.25, 0.67, 0, 0.07));
  g.add(box(0.36, 0.1, 0.6, C.mattress, 2.0, 0.79, 0, 0.05));
  g.add(box(1.0, 0.06, 0.86, C.blanket, 1.0, 0.77, 0, 0.03));
  g.add(box(0.06, 0.62, 0.9, C.royal, 2.22, 0.75, 0)); g.add(box(0.06, 0.42, 0.9, C.royal, 0.28, 0.66, 0));
  for (const z of [-0.47, 0.47]) g.add(box(1.0, 0.05, 0.03, C.steel, 1.25, 0.88, z));
  for (const [x, z] of [[0.38, -0.38], [0.38, 0.38], [2.12, -0.38], [2.12, 0.38]]) { g.add(cyl(0.025, 0.025, 0.42, C.steelDark, x, 0.32, z, 8)); g.add(caster(x, z)); }
  return g;
};
const wheelchair: Cargo = () => {
  const g = new THREE.Group();
  for (const z of [-0.3, 0.3]) { g.add(wheel(0.3, 0.55, 0.3, z)); g.add(rod(V(0.3, 0.95, z), V(0.36, 0.45, z), 0.018, C.steelDark)); g.add(rod(V(0.36, 0.45, z), V(0.95, 0.45, z), 0.018, C.steelDark)); g.add(rod(V(0.9, 0.45, z), V(1.0, 0.1, z), 0.018, C.steelDark)); g.add(caster(1.0, z, 0.06)); }
  g.add(box(0.5, 0.06, 0.56, C.royal, 0.62, 0.5, 0, 0.03)); g.add(box(0.06, 0.45, 0.56, C.royal, 0.36, 0.75, 0, 0.03));
  g.add(box(0.18, 0.03, 0.4, C.rubber, 1.04, 0.14, 0));
  return g;
};
const xray: Cargo = () => {
  const g = new THREE.Group();
  g.add(box(1.0, 0.36, 0.7, C.white, 0.75, 0.3, 0, 0.08)); g.add(box(0.9, 0.04, 0.66, C.royal, 0.75, 0.49, 0, 0.02));
  for (const [x, z] of [[0.35, -0.28], [0.35, 0.28], [1.15, -0.28], [1.15, 0.28]]) g.add(caster(x, z));
  g.add(box(0.2, 0.9, 0.2, C.white, 0.6, 0.95, 0, 0.06));
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 32, Math.PI), mat(C.white)); arc.castShadow = true;
  arc.position.set(1.05, 1.25, 0); arc.rotation.z = -Math.PI / 2; g.add(arc);
  g.add(box(0.22, 0.22, 0.3, C.steelDark, 1.05, 1.78, 0, 0.05)); g.add(box(0.3, 0.12, 0.3, C.steelDark, 1.05, 0.74, 0, 0.05));
  g.add(box(0.36, 0.26, 0.04, C.screen, 0.45, 1.25, 0.2, 0.02, { emissive: '#1e3a8a', emissiveIntensity: 0.5 }));
  return g;
};
const incubator: Cargo = () => {
  const g = new THREE.Group();
  for (const [x, z] of [[0.35, -0.25], [0.35, 0.25], [1.1, -0.25], [1.1, 0.25]]) { g.add(cyl(0.025, 0.025, 0.7, C.steel, x, 0.42, z, 8)); g.add(caster(x, z)); }
  g.add(box(0.95, 0.28, 0.62, C.white, 0.72, 0.9, 0, 0.06));
  g.add(box(0.85, 0.42, 0.55, '#bfe3ff', 0.72, 1.25, 0, 0.18, { transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0 }));
  g.add(box(0.5, 0.07, 0.4, C.mattress, 0.72, 1.07, 0, 0.03));
  g.add(box(0.14, 0.4, 0.14, C.white, 0.2, 1.2, 0, 0.04));
  return g;
};
const dentalChair: Cargo = () => {
  const g = new THREE.Group();
  g.add(box(1.5, 0.12, 0.7, C.pallet, 1.0, 0.1, 0, 0.02));
  for (const [x, z] of [[0.35, -0.28], [0.35, 0.28], [1.65, -0.28], [1.65, 0.28]]) g.add(caster(x, z, 0.04));
  g.add(cyl(0.12, 0.18, 0.32, C.white, 1.0, 0.32, 0));
  const seat = box(1.1, 0.14, 0.55, '#0e7490', 1.0, 0.55, 0, 0.07); seat.rotation.z = 0.12; g.add(seat);
  const back = box(0.62, 0.14, 0.5, '#0e7490', 0.55, 0.86, 0, 0.07); back.rotation.z = -0.95; g.add(back);
  g.add(rod(V(1.35, 0.5, -0.3), V(1.35, 1.35, -0.3), 0.025, C.white)); g.add(rod(V(1.35, 1.35, -0.3), V(1.0, 1.45, 0), 0.025, C.white));
  g.add(box(0.26, 0.1, 0.18, C.white, 0.95, 1.42, 0.02, 0.04, { emissive: '#fff7d6', emissiveIntensity: 0.6 }));
  return g;
};
const handTruck: Cargo = () => {
  const g = new THREE.Group();
  g.add(rod(V(0.25, 1.15, -0.22), V(0.62, 0.06, -0.22), 0.02, C.royalDark)); g.add(rod(V(0.25, 1.15, 0.22), V(0.62, 0.06, 0.22), 0.02, C.royalDark));
  g.add(box(0.06, 0.03, 0.5, C.royalDark, 0.25, 1.16, 0)); g.add(box(0.45, 0.03, 0.5, C.steelDark, 0.82, 0.04, 0, 0.01));
  for (const z of [-0.28, 0.28]) g.add(wheel(0.12, 0.6, 0.12, z));
  const b1 = carton(0.48, 0.86, 0.06, 0), b2 = carton(0.44, 0.82, 0.44, 0), b3 = carton(0.4, 0.78, 0.8, 0);
  for (const b of [b1, b2, b3]) { b.rotation.z = 0.32; g.add(b); }
  return g;
};
const computers: Cargo = () => {
  const g = new THREE.Group();
  g.add(box(1.1, 0.05, 0.6, C.steel, 0.8, 0.55, 0, 0.02)); g.add(box(1.1, 0.05, 0.6, C.steel, 0.8, 0.18, 0, 0.02));
  for (const [x, z] of [[0.3, -0.26], [0.3, 0.26], [1.3, -0.26], [1.3, 0.26]]) { g.add(cyl(0.02, 0.02, 0.5, C.steelDark, x, 0.36, z, 6)); g.add(caster(x, z, 0.06)); }
  for (const [i, x] of [0.5, 0.82, 1.14].entries()) {
    g.add(box(0.3, 0.22, 0.03, C.rubber, x, 0.82, -0.05 + i * 0.02, 0.015));
    g.add(box(0.27, 0.18, 0.005, C.screen, x, 0.82, -0.033 + i * 0.02, 0.003, { emissive: '#2563eb', emissiveIntensity: 0.25, roughness: 0.2 }));
    g.add(box(0.05, 0.12, 0.05, C.rubber, x, 0.65, -0.06 + i * 0.02, 0.01));
  }
  for (const x of [0.45, 0.8, 1.15]) g.add(box(0.18, 0.32, 0.4, '#334155', x, 0.37, 0, 0.02));
  return g;
};
const ivPoles: Cargo = () => {
  const g = new THREE.Group();
  for (const [i, [x, z]] of [[0.5, -0.2], [0.75, 0.15], [1.0, -0.12]].entries()) {
    g.add(cyl(0.02, 0.02, 1.8, C.steel, x, 0.95, z, 8));
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; g.add(rod(V(x, 0.08, z), V(x + Math.cos(a) * 0.25, 0.05, z + Math.sin(a) * 0.25), 0.012, C.steel)); g.add(caster(x + Math.cos(a) * 0.25, z + Math.sin(a) * 0.25, 0.04)); }
    g.add(rod(V(x - 0.15, 1.8, z), V(x + 0.15, 1.8, z), 0.01, C.steel));
    if (i !== 1) g.add(box(0.12, 0.2, 0.05, '#dbeafe', x + 0.12, 1.65, z, 0.03, { transparent: true, opacity: 0.8 }));
  }
  g.add(rod(V(0.2, 1.0, 0), V(0.5, 1.0, -0.2), 0.012, C.steel));
  return g;
};
const walkers: Cargo = () => {
  const g = new THREE.Group();
  for (const [o, dz] of [[0, -0.14], [0.22, 0.14]]) {
    const x0 = 0.45 + o, x1 = 0.95 + o;
    for (const z of [-0.26 + dz, 0.26 + dz]) { g.add(rod(V(x0, 0.06, z), V(x0, 0.86, z), 0.018, C.steel)); g.add(rod(V(x1, 0.06, z), V(x1, 0.86, z), 0.018, C.steel)); g.add(rod(V(x0, 0.86, z), V(x1, 0.86, z), 0.02, C.steelDark)); g.add(caster(x1, z, 0.05)); }
    g.add(rod(V(x1, 0.55, -0.26 + dz), V(x1, 0.55, 0.26 + dz), 0.016, C.steel));
  }
  g.add(rod(V(0.4, 1.05, 0.33), V(1.4, 0.2, 0.33), 0.02, C.steel)); g.add(rod(V(0.46, 1.05, 0.37), V(1.46, 0.2, 0.37), 0.02, C.steel));
  return g;
};
const palletJack: Cargo = () => {
  const g = new THREE.Group();
  g.add(rod(V(0.22, 1.05, 0), V(0.48, 0.18, 0), 0.025, '#dc2626')); g.add(box(0.2, 0.25, 0.45, '#dc2626', 0.5, 0.18, 0, 0.04));
  g.add(box(1.25, 0.14, 1.0, C.pallet, 1.25, 0.12, 0, 0.02));
  const stack = new THREE.Group();
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) stack.add(carton(0.5, 0.95 + i * 0.58, 0.19 + k * 0.42, -0.25 + j * 0.5));
  g.add(stack);
  g.add(box(1.22, 0.9, 1.02, '#e0f2fe', 1.25, 0.64, 0, 0.06, { transparent: true, opacity: 0.25, roughness: 0.15 }));
  return g;
};
const CARGO: Cargo[] = [bed, wheelchair, handTruck, xray, incubator, computers, dentalChair, ivPoles, walkers, palletJack];

/* ───────── people ───────── */
function person(i: number) {
  const body = new THREE.Group();
  const legs: THREE.Object3D[] = [], arms: THREE.Object3D[] = [];
  for (const z of [-0.1, 0.1]) {
    const hip = new THREE.Group(); hip.position.set(0, 0.86, z);
    hip.add(box(0.15, 0.86, 0.15, '#1f2a44', 0, -0.43, 0, 0.06)); hip.add(box(0.2, 0.08, 0.14, C.rubber, 0.04, -0.84, 0, 0.03));
    body.add(hip); legs.push(hip);
  }
  body.add(box(0.32, 0.6, 0.42, VEST[i % VEST.length], 0, 1.16, 0, 0.12));
  for (const y of [1.06, 1.24]) body.add(box(0.335, 0.035, 0.43, '#f1f5f9', 0, y, 0, 0.01, { emissive: '#ffffff', emissiveIntensity: 0.15 }));
  body.add(sphere(0.15, SKIN[i % SKIN.length], 0.02, 1.62, 0));
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(HAT[i % HAT.length], { roughness: 0.4 }));
  hat.position.set(0.02, 1.66, 0); hat.castShadow = true; body.add(hat);
  body.add(box(0.12, 0.02, 0.26, HAT[i % HAT.length], 0.17, 1.67, 0, 0.01));
  for (const z of [-0.24, 0.24]) {
    const sh = new THREE.Group(); sh.position.set(0.02, 1.38, z);
    sh.add(box(0.12, 0.5, 0.12, VEST[i % VEST.length], 0, -0.22, 0, 0.05)); sh.add(sphere(0.06, SKIN[i % SKIN.length], 0, -0.48, 0));
    sh.rotation.z = 1.05; body.add(sh); arms.push(sh);
  }
  return { body, legs, arms };
}

function forklift() {
  const body = new THREE.Group();
  body.add(box(1.4, 0.55, 1.15, C.gold, -0.15, 0.55, 0, 0.12)); body.add(box(0.5, 0.75, 1.1, '#e3940f', -0.7, 0.75, 0, 0.12));
  for (const [x, z, r] of [[0.3, -0.58, 0.28], [0.3, 0.58, 0.28], [-0.6, -0.55, 0.22], [-0.6, 0.55, 0.22]] as const) { const w = wheel(r, x, r, z); w.children[0].scale.setScalar(1); body.add(w); const hub = cyl(r * 0.9, r * 0.9, 0.18, C.rubber, x, r, z, 18); hub.rotation.x = Math.PI / 2; body.add(hub); }
  for (const z of [-0.5, 0.5]) { body.add(rod(V(-0.55, 0.9, z), V(-0.35, 2.15, z), 0.03, C.rubber)); body.add(rod(V(0.3, 0.9, z), V(0.25, 2.15, z), 0.03, C.rubber)); }
  body.add(box(1.0, 0.05, 1.12, C.rubber, -0.05, 2.17, 0, 0.02));
  body.add(box(0.36, 0.08, 0.42, C.rubber, -0.25, 0.86, 0, 0.03));
  for (const z of [-0.35, 0.35]) body.add(box(0.07, 2.3, 0.08, C.steelDark, 0.62, 1.2, z, 0.02));
  const forks = new THREE.Group(); forks.position.set(0.7, 0.18, 0);
  forks.add(box(0.06, 0.7, 0.86, C.steelDark, 0, 0.35, 0, 0.02));
  for (const z of [-0.25, 0.25]) forks.add(box(1.1, 0.05, 0.12, C.steelDark, 0.55, 0.02, z, 0.01));
  const load = new THREE.Group(); load.position.set(0.62, 0.05, 0);
  load.add(box(1.2, 0.13, 1.05, C.pallet, 0, 0.07, 0, 0.02));
  for (let k = 0; k < 3; k++) load.add(box(1.15, 0.14, 0.95, k % 2 ? C.blanket : C.mattress, 0, 0.22 + k * 0.15, 0, 0.06));
  load.add(carton(0.45, -0.25, 0.66, -0.22)); load.add(carton(0.45, 0.25, 0.66, 0.22)); load.add(carton(0.42, 0.2, 0.66, -0.25));
  forks.add(load); body.add(forks);
  const driver = person(3); driver.body.position.set(-0.3, 0.12, 0); driver.body.scale.setScalar(0.92);
  driver.legs.forEach(l => (l.rotation.z = 1.4)); driver.arms.forEach(a => (a.rotation.z = 1.2)); body.add(driver.body);
  return { body, forks, load };
}

/* ───────── scene ───────── */
export function startLoadingScene(canvas: HTMLCanvasElement, opts: { still?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e6eef8', 55, 95);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  cam.position.set(26, 24, 30); cam.lookAt(-3.2, 0.8, -0.6);

  scene.add(new THREE.HemisphereLight('#e0ecff', '#d9cbb5', 1.35));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
  sun.position.set(14, 26, 18); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -22, near: 1, far: 80 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3; scene.add(sun);

  // ground, yard lanes and dashes
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), mat(C.ground, { roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(18, 3.6), mat(C.lane, { roughness: 0.95 })); lane.rotation.x = -Math.PI / 2; lane.position.set(-1, 0.005, 0.05); lane.receiveShadow = true; scene.add(lane);
  for (let x = -7; x < 3; x += 1.3) { const d = box(0.7, 0.01, 0.1, C.gold, x, 0.012, 1.9, 0.004); d.castShadow = false; scene.add(d); const e = d.clone(); e.position.z = -1.8; scene.add(e); }

  // warehouse: cutaway, no front wall and no roof, so the racks inside show
  const W = new THREE.Group(); W.position.set(-14, 0, -1); scene.add(W);
  W.add(box(12, 0.12, 10, C.floor, 0, 0.06, 0, 0.02));
  W.add(box(12, 5.2, 0.35, C.wall, 0, 2.6, -5, 0.05)); W.add(box(0.35, 5.2, 10, C.wall, -6, 2.6, 0, 0.05));
  // right wall with a big roll-up door opening (z -1.5..2.3 in world)
  W.add(box(0.35, 5.2, 2.6, C.wall, 6, 2.6, -3.7, 0.05)); W.add(box(0.35, 5.2, 2.4, C.wall, 6, 2.6, 3.8, 0.05)); W.add(box(0.35, 1.0, 5.0, C.wall, 6, 4.7, 0.1, 0.05));
  W.add(box(0.5, 0.35, 5.2, C.steelDark, 6.05, 4.05, 0.1, 0.06));
  for (const [x, y, z, w, h, d] of [[0, 5.25, -5, 12.2, 0.14, 0.45], [-6, 5.25, 0, 0.45, 0.14, 10.2], [6, 5.25, 0, 0.45, 0.14, 10.2]]) W.add(box(w, h, d, C.wallTrim, x, y, z, 0.03));
  const sign = logoTex(1024, 600, 0.06);
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.23), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 }));
  signM.position.set(6.2, 2.9, 3.8); signM.rotation.y = Math.PI / 2; W.add(signM);
  // pallet racking along the back and left walls, stocked with equipment
  const rack = (x: number, z: number, rotY: number) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
    for (const ux of [-1.5, 0, 1.5]) for (const uz of [-0.5, 0.5]) g.add(box(0.1, 3.6, 0.1, C.rackBlue, ux, 1.8, uz, 0.02));
    for (const y of [1.2, 2.4, 3.5]) for (const uz of [-0.5, 0.5]) g.add(box(3.1, 0.12, 0.1, C.rackOrange, 0, y, uz, 0.02));
    for (const [ux, y] of [[-0.75, 0.12], [0.75, 0.12], [-0.75, 1.26], [0.75, 1.26], [-0.75, 2.46], [0.75, 2.46]]) {
      g.add(box(1.25, 0.1, 0.95, C.pallet, ux, y + 0.05, 0, 0.02));
      const r = Math.random();
      if (r < 0.55) { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.add(carton(0.48, ux - 0.27 + i * 0.54, y + 0.1, -0.22 + j * 0.46)); if (r < 0.3) g.add(carton(0.46, ux, y + 0.52, 0)); }
      else if (r < 0.8) { for (let k = 0; k < 3; k++) g.add(box(1.15, 0.14, 0.85, k % 2 ? C.blanket : C.mattress, ux, y + 0.18 + k * 0.15, 0, 0.06)); }
      else { const w = wheelchair(); w.scale.setScalar(0.8); w.position.set(ux - 0.55, y + 0.1, 0); g.add(w); }
    }
    W.add(g);
  };
  rack(-3.2, -4.2, 0); rack(0.2, -4.2, 0); rack(-5.2, -0.8, Math.PI / 2); rack(-5.2, 2.6, Math.PI / 2);
  // staging: equipment waiting by the door
  { const b = bed(); b.position.set(1.0, 0.12, 3.6); b.rotation.y = 0.3; W.add(b); const x = xray(); x.position.set(-2.4, 0.12, 3.2); x.rotation.y = -0.4; W.add(x); const ic = incubator(); ic.position.set(-0.8, 0.12, 1.2); W.add(ic); }
  // a volunteer stacking cartons inside
  const stacker = person(5); stacker.body.position.set(2.3, 0.12, -2.8); stacker.body.rotation.y = -Math.PI / 2; W.add(stacker.body);
  const liftBox = carton(0.42); liftBox.position.set(0.45, 0.95, 0); stacker.body.add(liftBox);
  stacker.arms.forEach(a => (a.rotation.z = 1.5));

  // Canadian flag
  const flagTex = canvasTex(256, 128, c => {
    c.fillStyle = '#d52b1e'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#fff'; c.fillRect(64, 0, 128, 128); c.fillStyle = '#d52b1e';
    const P = [[0, -46], [8, -30], [18, -36], [14, -12], [30, -24], [34, -16], [48, -20], [42, -4], [50, 2], [24, 22], [28, 32], [4, 28], [4, 52], [-4, 52], [-4, 28], [-28, 32], [-24, 22], [-50, 2], [-42, -4], [-48, -20], [-34, -16], [-30, -24], [-14, -12], [-18, -36], [-8, -30]];
    c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(128 + x, 62 + y) : c.moveTo(128 + x, 62 + y))); c.closePath(); c.fill();
  });
  const pole = cyl(0.05, 0.06, 7, C.steel, -6.5, 3.5, 5.5, 10); scene.add(pole);
  const flagGeo = new THREE.PlaneGeometry(2.2, 1.1, 16, 6); flagGeo.translate(1.1, 0, 0);
  const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }));
  flag.position.set(-6.45, 6.35, 5.5); flag.castShadow = true; scene.add(flag);
  const flagBase = (flagGeo.attributes.position.array as Float32Array).slice();

  // trailer chassis + 40-foot container + tractor; the container floor sits at y = 1.3
  const FLOOR = 1.3, CX0 = 6.0, CL = 12.2, CW = 2.44, CH = 2.6;
  const K = new THREE.Group(); scene.add(K);
  K.add(box(CL, 0.22, 1.8, C.rubber, CX0 + CL / 2, 1.05, 0, 0.04));
  for (const x of [CX0 + CL - 2.6, CX0 + CL - 1.6]) for (const z of [-0.95, 0.95]) { const t = cyl(0.48, 0.48, 0.42, C.rubber, x, 0.48, z, 24); t.rotation.x = Math.PI / 2; K.add(t); const hub = cyl(0.24, 0.24, 0.44, C.steel, x, 0.48, z, 16); hub.rotation.x = Math.PI / 2; K.add(hub); }
  for (const z of [-0.7, 0.7]) K.add(box(0.1, 0.9, 0.1, C.steelDark, CX0 + 2.5, 0.48, z, 0.02));
  const ribs = new THREE.Group();
  K.add(box(CL, 0.12, CW, C.royalDark, CX0 + CL / 2, FLOOR - 0.06, 0, 0.02));
  K.add(box(CL, 0.1, CW, '#2a6ccc', CX0 + CL / 2, FLOOR + CH, 0, 0.03));
  for (const z of [-CW / 2, CW / 2]) {
    K.add(box(CL, CH, 0.08, C.royal, CX0 + CL / 2, FLOOR + CH / 2, z, 0.02));
    for (let x = CX0 + 0.35; x < CX0 + CL - 0.2; x += 0.42) ribs.add(box(0.18, CH - 0.24, 0.07, '#2462c4', x, FLOOR + CH / 2, z + Math.sign(z) * 0.05, 0.02));
  }
  K.add(ribs);
  K.add(box(0.1, CH, CW, C.royalDark, CX0 + CL, FLOOR + CH / 2, 0, 0.02));
  for (const z of [-CW / 2, CW / 2]) for (const x of [CX0, CX0 + CL]) K.add(box(0.16, CH + 0.1, 0.16, C.royalDark, x, FLOOR + CH / 2, z, 0.03));
  K.add(box(0.08, CH - 0.1, CW - 0.1, '#0b1e3d', CX0 + 0.3, FLOOR + CH / 2, 0, 0.01)); // dark interior behind the doorway
  // doors swung open against the sides
  for (const s of [-1, 1]) { const d = box(1.22, CH - 0.05, 0.07, '#1a52a8', CX0 - 0.55, FLOOR + CH / 2, s * (CW / 2 + 0.06), 0.02); d.rotation.y = s * 0.15; K.add(d); for (const dy of [-0.6, 0.6]) K.add(box(0.05, 0.05, 0.05, C.steel, CX0 - 0.9, FLOOR + CH / 2 + dy, s * (CW / 2 + 0.1))); }
  const logo = logoTex(1024, 600, 0.06);
  const logoM = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.93), new THREE.MeshStandardMaterial({ map: logo, roughness: 0.5 }));
  logoM.position.set(CX0 + 3.6, FLOOR + 1.45, CW / 2 + 0.1); K.add(logoM);
  const tag = canvasTex(1024, 96, c => { c.fillStyle = '#cfe3f7'; c.font = '700 54px "Plus Jakarta Sans Variable", system-ui, sans-serif'; c.fillText('RWHU 40FT · GREATER VANCOUVER', 10, 70); });
  const tagM = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.4), new THREE.MeshStandardMaterial({ map: tag, transparent: true, roughness: 0.6 }));
  tagM.position.set(CX0 + 8.6, FLOOR + 0.45, CW / 2 + 0.1); K.add(tagM);
  // tractor unit
  const T = new THREE.Group(); T.position.set(CX0 + CL + 0.4, 0, 0); K.add(T);
  T.add(box(3.6, 0.3, 1.9, C.rubber, 1.6, 0.9, 0, 0.05));
  T.add(box(2.0, 2.3, 2.4, '#f8fafc', 2.5, 2.2, 0, 0.25)); T.add(box(0.8, 1.0, 2.3, '#f8fafc', 3.8, 1.55, 0, 0.18));
  T.add(box(0.06, 0.9, 2.1, '#1e293b', 3.52, 2.65, 0, 0.04, { roughness: 0.15, metalness: 0.3 }));
  T.add(box(1.4, 0.12, 2.42, C.royal, 2.5, 3.0, 0, 0.04));
  for (const z of [-1.2, 1.2]) T.add(box(0.06, 0.8, 0.06, C.steelDark, 3.35, 2.6, z * 1.06));
  for (const [x, r] of [[3.4, 0.52], [1.2, 0.52], [0.2, 0.52]] as const) for (const z of [-0.98, 0.98]) { const t = cyl(r, r, 0.42, C.rubber, x, r, z, 24); t.rotation.x = Math.PI / 2; T.add(t); const h = cyl(r * 0.5, r * 0.5, 0.44, C.steel, x, r, z, 16); h.rotation.x = Math.PI / 2; T.add(h); }
  // yard ramp from the ground up to the container floor
  const RX0 = 1.6, RX1 = CX0 - 0.1;
  const rampLen = Math.hypot(RX1 - RX0, FLOOR);
  const ramp = box(rampLen, 0.12, 2.2, '#8b95a5', (RX0 + RX1) / 2, FLOOR / 2 - 0.02, 0, 0.02); ramp.rotation.z = Math.atan2(FLOOR, RX1 - RX0); scene.add(ramp);
  for (const z of [-1.1, 1.1]) { const rail = rod(V(RX0, 0.6, z), V(RX1, FLOOR + 0.6, z), 0.03, C.gold); scene.add(rail); scene.add(rod(V(RX0 + 0.3, 0.05, z), V(RX0 + 0.3, 0.75, z), 0.03, C.gold)); scene.add(rod(V(RX1 - 0.2, FLOOR, z), V(RX1 - 0.2, FLOOR + 0.62, z), 0.03, C.gold)); }
  for (const x of [RX0 + 1.4, RX1 - 1.2]) scene.add(box(0.14, (x - RX0) / (RX1 - RX0) * FLOOR, 0.14, C.steelDark, x, (x - RX0) / (RX1 - RX0) * FLOOR / 2, 0, 0.02));
  const heightAt = (x: number) => x <= RX0 ? 0.0 : x >= RX1 ? FLOOR : ((x - RX0) / (RX1 - RX0)) * FLOOR;

  // supervisor with a clipboard
  const boss = person(4); boss.body.position.set(2.6, 0, 3.2); boss.body.rotation.y = -2.4; scene.add(boss.body);
  const clip = box(0.04, 0.34, 0.26, '#f8fafc', 0.32, 1.2, 0.05, 0.01); boss.body.add(clip);
  boss.arms[0].rotation.z = 1.3; boss.arms[1].rotation.z = 1.0;

  // trees, cones and mountains
  const tree = (x: number, z: number, s = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); g.add(cyl(0.12, 0.16, 0.8, '#6b4f3a', 0, 0.4, 0, 8)); for (const [y, r, h, col] of [[1.2, 1.1, 1.6, C.pine], [2.1, 0.85, 1.4, C.pineLight], [2.9, 0.55, 1.1, C.pine]] as const) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat(col, { flatShading: true })); c.position.y = y; c.castShadow = true; g.add(c); } scene.add(g); };
  [[-20, -9, 1.3], [-17.5, -10.5, 1], [-9, -9.5, 1.15], [-6.5, -11, 0.9], [-3, -9, 1.2], [1, -10.5, 1], [4, -8.5, 1.3], [12, -7.5, 1.1], [16, -9, 1.35], [20, -7, 1], [-22, 2, 1.2], [-21, 6, 1]].forEach(([x, z, s]) => tree(x, z, s));
  for (const [x, z] of [[1.2, 2.5], [1.2, -2.4]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 14), mat('#f97316')); c.position.set(x, 0.25, z); c.castShadow = true; scene.add(c); scene.add(cyl(0.165, 0.165, 0.06, '#f8fafc', x, 0.28, z, 14)); }
  for (const [x, z, s] of [[-30, -34, 15], [-8, -40, 20], [18, -36, 16], [38, -30, 13]] as const) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.9, 6), mat('#a9c1de', { flatShading: true })); m.position.set(x, s * 0.45 - 0.5, z); scene.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(s * 0.32, s * 0.29, 6), mat('#ffffff', { flatShading: true })); cap.position.set(x, s * 0.9 - 0.5 - s * 0.145, z); scene.add(cap);
  }

  // yard staging: wrapped pallets, a row of wheelchairs and the RWH box truck
  for (const [x, z, r] of [[-4.2, 4.6, 0.1], [-2.3, 4.9, -0.08]] as const) { const pj = palletJack(); pj.children.slice(0, 2).forEach(o => (o.visible = false)); pj.position.set(x - 1.25, 0, z); pj.rotation.y = r; scene.add(pj); }
  for (let i = 0; i < 4; i++) { const w = wheelchair(); w.position.set(-8.6 + i * 0.75, 0, 3.9); w.rotation.y = -Math.PI / 2; scene.add(w); }
  { const b = bed(); b.position.set(-0.6, 0, 6.1); b.rotation.y = 0.2; scene.add(b); const c = computers(); c.position.set(-7.0, 0, 6.0); scene.add(c); }
  {
    const truck = new THREE.Group(); truck.position.set(-11.2, 0, 8.4); truck.rotation.y = 0.05; scene.add(truck);
    truck.add(box(5.4, 0.3, 2.1, C.rubber, 0.2, 0.75, 0, 0.05));
    truck.add(box(3.9, 2.5, 2.25, '#f8fafc', -0.55, 2.15, 0, 0.12));
    truck.add(box(1.5, 1.7, 2.2, C.royal, 2.15, 1.75, 0, 0.22));
    truck.add(box(0.06, 0.75, 1.9, '#1e293b', 2.88, 2.1, 0, 0.04, { roughness: 0.15, metalness: 0.3 }));
    const tl = logoTex(1024, 600, 0.06);
    const tm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.52), new THREE.MeshStandardMaterial({ map: tl, roughness: 0.6 })); tm.position.set(-0.55, 2.2, 1.14); truck.add(tm);
    for (const x of [-1.9, 1.9]) for (const z of [-1, 1]) { const t = cyl(0.45, 0.45, 0.36, C.rubber, x, 0.45, z, 22); t.rotation.x = Math.PI / 2; truck.add(t); const h = cyl(0.22, 0.22, 0.38, C.steel, x, 0.45, z, 14); h.rotation.x = Math.PI / 2; truck.add(h); }
  }

  // movers: volunteers with equipment and one forklift, all on one loop
  const X_IN = -12.0, X_OUT = CX0 + 1.6, PERIOD = 34;
  const movers: Mover[] = [];
  const N = 10;
  for (let k = 0; k < N; k++) {
    const root = new THREE.Group(); scene.add(root);
    if (k === 3) {
      const f = forklift(); root.add(f.body);
      movers.push({ root, body: f.body, cargo: f.load, legs: [], arms: [], phase: k / N, trip: -1, kind: 'forklift', zOut: -0.62, zBack: -0.62, forks: f.forks, cargoIndex: 0 });
      continue;
    }
    const p = person(k); root.add(p.body);
    const cargo = new THREE.Group(); root.add(cargo);
    movers.push({ root, body: p.body, cargo, legs: p.legs, arms: p.arms, phase: k / N, trip: -1, kind: 'walker', zOut: 0.3, zBack: 0.95, cargoIndex: k });
  }
  const setCargo = (m: Mover, trip: number) => {
    if (m.kind !== 'walker') return;
    m.cargo.clear();
    m.cargo.add(CARGO[(m.cargoIndex + trip * 3) % CARGO.length]());
  };

  const smooth = (t: number) => t * t * (3 - 2 * t);
  const update = (time: number) => {
    for (const m of movers) {
      const u = ((time / PERIOD + m.phase) % 1 + 1) % 1;
      const trip = Math.floor(time / PERIOD + m.phase);
      if (trip !== m.trip) { m.trip = trip; setCargo(m, trip); }
      let x: number, z: number, yaw: number, carrying: boolean, moving = true;
      if (m.kind === 'forklift') {
        // drive in forward with the load, reverse out empty (forks first stays toward the container)
        if (u < 0.46) { x = X_IN + (X_OUT - 0.6 - X_IN) * smooth(u / 0.46); carrying = true; }
        else if (u < 0.54) { x = X_OUT - 0.6; carrying = (u < 0.5); moving = false; }
        else if (u < 0.96) { x = X_OUT - 0.6 - (X_OUT - 0.6 - X_IN) * smooth((u - 0.54) / 0.42); carrying = false; }
        else { x = X_IN; carrying = true; moving = false; }
        z = m.zOut; yaw = 0;
        m.forks!.position.y = 0.18 + (u > 0.44 && u < 0.56 ? 0.25 * Math.sin(((u - 0.44) / 0.12) * Math.PI) : 0);
      } else if (u < 0.46) { const t = u / 0.46; x = X_IN + (X_OUT - X_IN) * t; z = m.zOut; yaw = 0; carrying = true; }
      else if (u < 0.52) { const t = (u - 0.46) / 0.06; x = X_OUT; z = m.zOut + (m.zBack - m.zOut) * t; yaw = Math.PI * smooth(t); carrying = false; moving = false; }
      else if (u < 0.96) { const t = (u - 0.52) / 0.44; x = X_OUT - (X_OUT - X_IN) * t; z = m.zBack; yaw = Math.PI; carrying = false; }
      else { const t = (u - 0.96) / 0.04; x = X_IN; z = m.zBack + (m.zOut - m.zBack) * t; yaw = Math.PI * (1 - smooth(t)); carrying = true; moving = false; }
      m.root.position.set(x, heightAt(x) + (x < -8 ? 0.12 : 0), z);
      m.root.rotation.y = yaw;
      // up the ramp: lean a little
      m.root.rotation.z = x > RX0 && x < RX1 ? (yaw === 0 ? 1 : -1) * Math.atan2(FLOOR, RX1 - RX0) * 0.35 : 0;
      m.cargo.visible = carrying;
      const w = moving ? time * 7.5 + m.phase * 20 : 0;
      m.legs.forEach((l, i) => (l.rotation.z = Math.sin(w + i * Math.PI) * 0.45));
      m.arms.forEach((a, i) => (a.rotation.z = carrying ? 1.25 : 0.15 + Math.sin(w + i * Math.PI + Math.PI) * 0.45));
      if (m.kind === 'walker') m.body.position.y = moving ? Math.abs(Math.sin(w)) * 0.04 : 0;
      if (moving) m.root.traverse(o => { if (o.userData.spin) o.rotation.z = -(x / o.userData.spin); });
    }
    stacker.body.position.y = 0.12; liftBox.position.y = 0.95 + Math.max(0, Math.sin(time * 1.6)) * 0.35;
    stacker.arms.forEach(a => (a.rotation.z = 1.5 + Math.max(0, Math.sin(time * 1.6)) * 0.35));
    boss.arms[0].rotation.z = 1.3 + Math.max(0, Math.sin(time * 2.2)) * 0.25 * (Math.sin(time * 0.7) > 0.3 ? 1 : 0);
    const pos = flagGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const bx = flagBase[i * 3]; pos.setZ(i, Math.sin(bx * 2.6 - time * 4) * 0.12 * (bx / 2.2)); pos.setY(i, flagBase[i * 3 + 1] - (bx / 2.2) * 0.06); }
    pos.needsUpdate = true; flagGeo.computeVertexNormals();
  };

  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h, view = aspect > 1.7 ? 15.5 : 17;
    cam.left = -view * aspect / 2; cam.right = view * aspect / 2; cam.top = view / 2; cam.bottom = -view / 2;
    cam.updateProjectionMatrix();
  };
  fit(); new ResizeObserver(fit).observe(canvas);

  // Smooth page scrolling comes first: draw at most 30 frames a second, and 12 while the page is being scrolled.
  let running = false, raf = 0, t0 = performance.now(), last = 0, acc = 7.5, scrollUntil = 0;
  addEventListener('scroll', () => { scrollUntil = performance.now() + 180; }, { passive: true });
  const frame = (now: number) => {
    if (running) raf = requestAnimationFrame(frame);
    const gap = now < scrollUntil ? 83 : 33;
    if (now - last < gap) return;
    last = now;
    acc += Math.min(0.1, (now - t0) / 1000); t0 = now;
    update(acc); renderer.render(scene, cam);
  };
  onLogo = () => { if (!running) renderer.render(scene, cam); };
  update(acc); renderer.render(scene, cam);
  return {
    play() { if (running || opts.still) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); },
    pause() { running = false; cancelAnimationFrame(raf); },
    seek(s: number) { acc = s; update(acc); renderer.render(scene, cam); },
  };
}
