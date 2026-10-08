// Leaf hero v2: a photographic macro scene that changes with the time of day.
// A backlit ginkgo leaf with dew drops, a glossy ladybug walking across it, depth-of-field foliage,
// light shafts, drifting pollen and (at night) fireflies. Loops seamlessly over T seconds.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { leafFrame, ginkgoGeometry, veinTexture } from './grove.js?v=2';
import { makeBug } from './leafhero.js?v=3';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

export const LEAF_PHASES = {
  dawn: { greet: 'Good morning', top: '#1d3a44', bot: '#5a5a3c', glow: [0.82, 0.12, 'rgba(255,214,170,1)', 'rgba(255,150,140,.5)'], bokeh: ['255,206,160', '250,160,160', '214,226,150', '255,190,200'], key: 0xffc796, keyI: 3.1, keyPos: [5.5, 2.4, -3], hemi: [0xffe6d4, 0x24361a, 0.85], fill: 0xcfdfff, fillI: 0.7, leaf: ['#3a6a30', '#88a440', '#e2b457'], ray: 0xffd0a0, rayA: 0.11, dust: 0xffe2b8, exp: 1.0, mist: 'rgba(255,214,190,.10)' },
  day: { greet: 'Good afternoon', top: '#1f5a36', bot: '#6c9a3a', glow: [0.78, 0.04, 'rgba(255,253,230,1)', 'rgba(255,236,150,.45)'], bokeh: ['238,244,176', '184,220,120', '158,208,206', '255,248,206'], key: 0xfff0cf, keyI: 3.4, keyPos: [3, 6.5, -1.5], hemi: [0xfff6e0, 0x25381a, 0.8], fill: 0xd8e8ff, fillI: 0.9, leaf: ['#2f7a2e', '#7db63c', '#d8d352'], ray: 0xfff0c0, rayA: 0.10, dust: 0xfff6d8, exp: 1.04, mist: 'rgba(240,255,220,.06)' },
  dusk: { greet: 'Good evening', top: '#2e1830', bot: '#4a3420', glow: [0.9, 0.5, 'rgba(255,160,80,1)', 'rgba(255,90,90,.42)'], bokeh: ['255,166,92', '250,120,110', '230,150,190', '255,200,120'], key: 0xff9650, keyI: 3.3, keyPos: [6.5, 0.2, -2.6], hemi: [0xffcaa0, 0x2a1a14, 0.5], fill: 0xb8a6d0, fillI: 0.55, leaf: ['#4b5c2a', '#a58c34', '#e27c3a'], ray: 0xff9c64, rayA: 0.13, dust: 0xffc08a, exp: 1.0, mist: 'rgba(255,170,120,.10)' },
  night: { greet: 'Good night', top: '#050b13', bot: '#0d1e1c', glow: [0.84, 0.10, 'rgba(190,210,255,.65)', 'rgba(120,150,230,.22)'], bokeh: ['120,160,220', '90,132,176', '70,110,124', '160,196,236'], key: 0x9db8ff, keyI: 1.9, keyPos: [4, 5.2, -2.2], hemi: [0x6f86b8, 0x0b1612, 0.55], fill: 0x6a86c4, fillI: 0.7, leaf: ['#1d4540', '#3f7360', '#86a89a'], ray: 0xa0b8ff, rayA: 0.07, dust: 0xbcd0ff, exp: 1.12, mist: 'rgba(120,150,220,.07)', fireflies: true },
};

function backdrop(P, seed) {
  const W = 1600, H = 800, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W * 0.9, H); g.addColorStop(0, P.top); g.addColorStop(1, P.bot); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const [gx, gy, c1, c2] = P.glow;
  let rg = x.createRadialGradient(W * gx, H * gy, 0, W * gx, H * gy, W * 0.55); rg.addColorStop(0, c1); rg.addColorStop(0.18, c2); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
  const R = rand(seed);
  for (let i = 0; i < 90; i++) {
    const cx = W * (0.2 + R() * 0.85), cy = R() * H, r = 14 + Math.pow(R(), 1.6) * 80, a = (0.05 + R() * 0.22) * Math.min(1, cx / W + 0.1);
    const col = P.bokeh[Math.floor(R() * P.bokeh.length)];
    const b = x.createRadialGradient(cx, cy, r * 0.5, cx, cy, r); b.addColorStop(0, `rgba(${col},${a * 0.7})`); b.addColorStop(0.86, `rgba(${col},${a * 1.2})`); b.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = b; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  if (P.fireflies) { // a little starlight between the leaves, only a little
    const SR = rand(404);
    for (let i = 0; i < 30; i++) { const sx = W * (0.22 + SR() * 0.70), sy = SR() * H * 0.5, sr = 3.0 + SR() * 3.0, sa = 0.85 + SR() * 0.15; x.fillStyle = `rgba(232,244,255,${sa})`; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill(); if (SR() < 0.18) { x.strokeStyle = `rgba(232,244,255,${sa * 0.5})`; x.lineWidth = 0.8; x.beginPath(); x.moveTo(sx - sr * 3, sy); x.lineTo(sx + sr * 3, sy); x.moveTo(sx, sy - sr * 3); x.lineTo(sx, sy + sr * 3); x.stroke(); } }
  }
  const m = x.createLinearGradient(0, H * 0.55, 0, H); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, P.mist); x.fillStyle = m; x.fillRect(0, H * 0.5, W, H * 0.5);
  x.filter = 'blur(5px)'; x.drawImage(c, 0, 0); x.filter = 'none';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const softDot = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([o, s]) => g.addColorStop(o, s)); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const rayTex = () => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 512); x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.7, 'rgba(0,0,0,.4)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, 64, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

export function createLeafHero2({ canvas, width, height, T = 12, phase = 'day' }) {
  const P = LEAF_PHASES[phase];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = P.exp; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 80); camera.position.set(0, 0, 9);

  const bgM = new THREE.Mesh(new THREE.PlaneGeometry(52, 26), new THREE.MeshBasicMaterial({ map: backdrop(P, phase.length * 7 + 3), depthWrite: false })); bgM.position.z = -16; scene.add(bgM);

  scene.add(new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]));
  const key = new THREE.DirectionalLight(P.key, P.keyI); key.position.set(...P.keyPos); scene.add(key);
  const fill = new THREE.DirectionalLight(P.fill, P.fillI); fill.position.set(-4, 2, 6); scene.add(fill);
  const spec = new THREE.DirectionalLight(0xffffff, phase === 'night' ? 0.8 : 1.3); spec.position.set(1, 6, 5); scene.add(spec);

  const veins = veinTexture();
  const mkLeafMat = (cols, emis = 1) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, bumpMap: veins, bumpScale: 1.6 });
    const U = { uBase: { value: new THREE.Color(cols[0]) }, uMid: { value: new THREE.Color(cols[1]) }, uEdge: { value: new THREE.Color(cols[2]) }, uEm: { value: emis } };
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase,uMid,uEdge; uniform float uEm;')
        .replace('#include <color_fragment>', 'vec3 lc = mix(mix(uBase, uMid, smoothstep(0.0, 0.6, vColor.r)), uEdge, smoothstep(0.62, 1.0, vColor.r)); diffuseColor.rgb *= lc * vColor.g;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += lc * (gl_FrontFacing ? 0.10 : 0.32) * uEm;'); };
    return m;
  };
  const geo = ginkgoGeometry(140, 22);
  // hero leaf
  const leafGroup = new THREE.Group(); scene.add(leafGroup);
  const leaf = new THREE.Mesh(geo, mkLeafMat(P.leaf)); leaf.scale.setScalar(2.05); leaf.position.y = -1.45; leafGroup.add(leaf);
  leafGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, -4.6, 0.2), new THREE.Vector3(0.12, -3.2, 0.08), new THREE.Vector3(0, -1.16, 0)]), 24, 0.045, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color(P.leaf[1]).multiplyScalar(0.8), roughness: 0.6 })));
  leafGroup.position.set(3.0, -0.05, 0); leafGroup.rotation.set(-0.12, -0.35, -0.22);

  // dew drops sitting on the blade (they refract the veins beneath)
  const dewMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.25, ior: 1.33, clearcoat: 1, transparent: true, opacity: 1, attenuationColor: new THREE.Color(0xdfffe0), attenuationDistance: 3 });
  const R = rand(21);
  [[0.86, 0.52, 0.07], [0.74, -0.58, 0.055], [0.52, 0.66, 0.05], [0.36, -0.46, 0.04], [0.92, 0.1, 0.045], [0.66, 0.2, 0.03], [0.82, -0.2, 0.035], [0.46, 0.4, 0.028], [0.3, 0.16, 0.025], [0.98, -0.36, 0.04]].forEach(([rho, a, r]) => {
    const f = leafFrame(rho, a), d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), dewMat); d.scale.set(1, 0.62, 1);
    d.position.copy(f.p).addScaledVector(f.n, r * 0.35).multiply(new THREE.Vector3(1, 1, 1)); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.n);
    d.scale.set(1, 0.62, 1); leaf.add(d);
  });

  // out-of-focus foliage: far leaves, plus two big near leaves framing the shot
  const extra = [];
  const addLeaf = (x, y, z, s, rx, ry, rz, cols, em = 1) => { const m = new THREE.Mesh(geo, mkLeafMat(cols, em)); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(rx, ry, rz); scene.add(m); extra.push({ m, x, y, z, rx, ry, rz, ph: R() * TAU }); return m; };
  const far = P.leaf.map((c) => new THREE.Color(c).multiplyScalar(0.7).getStyle());
  addLeaf(-1.6, 2.6, -4.5, 1.7, -0.5, 0.3, 0.7, far, 0.9); addLeaf(6.6, 3.0, -3.2, 1.6, -0.2, -0.4, -0.5, far, 0.9); addLeaf(1.4, -3.6, -5.5, 2.0, -0.7, 0.2, 2.6, far, 0.8);
  addLeaf(-4.6, -1.3, -6.5, 2.2, -0.3, 0.1, 0.1, far, 0.8); addLeaf(8.0, -2.2, -4.5, 1.8, -0.2, 0.5, 1.1, far, 0.8);
  const nb = new THREE.Color(P.leaf[0]).multiplyScalar(0.8).getStyle(), nm = new THREE.Color(P.leaf[1]).multiplyScalar(0.5).getStyle(); const near = [nb, nm, nm];
  addLeaf(-3.9, -3.3, 4.6, 2.3, -0.9, 0.3, 0.8, near, 0.6); addLeaf(7.2, 3.4, 4.2, 1.9, -0.4, -0.5, -0.9, near, 0.6);

  // light shafts
  const rt = rayTex(), rays = [];
  [[5.0, 3.0, -6, -0.62, 6.5, 24], [1.5, 4.0, -7, -0.5, 5.0, 26], [8.5, 0.5, -7.5, -0.7, 6.0, 22]].forEach(([x, y, z, rz, w, h], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: rt, color: P.ray, transparent: true, opacity: P.rayA * 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.set(x, y, z); m.rotation.z = rz; scene.add(m); rays.push({ m, x, y, rz, i });
  });

  // pollen / dust and fireflies
  const dotTex = softDot([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
  const N = 90, dp = new Float32Array(N * 3), dBase = [], DR = rand(8);
  for (let i = 0; i < N; i++) dBase.push({ x: -6 + DR() * 15, y: -3.4 + DR() * 7, z: -3 + DR() * 7, k: 1 + Math.floor(DR() * 2), ph: DR() * TAU, a: 0.15 + DR() * 0.4 });
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: dotTex, color: P.dust, size: 0.11, transparent: true, opacity: phase === 'night' ? 0.35 : 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false })); scene.add(dust);
  let flies = null;
  if (P.fireflies) {
    const FN = 16, fp = new Float32Array(FN * 3), fb = [], FR = rand(99); for (let i = 0; i < FN; i++) fb.push({ x: -5 + FR() * 13, y: -3 + FR() * 6.5, z: -2 + FR() * 5, ph: FR() * TAU, k: 1 + Math.floor(FR() * 2), a: 0.5 + FR() * 0.9 });
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const fly = new THREE.Points(fg, new THREE.PointsMaterial({ map: softDot([[0, 'rgba(255,248,170,1)'], [0.25, 'rgba(226,240,110,.65)'], [1, 'rgba(170,220,60,0)']]), size: 0.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(fly);
    flies = { fly, fp, fb, FN };
  }

  const faller = new THREE.Mesh(geo, mkLeafMat(phase === 'dusk' ? ['#a8642a', '#d8902e', '#f0b040'] : phase === 'night' ? ['#2a5048', '#4a8068', '#a0c0a0'] : ['#7a9a30', '#c8b040', '#f0c84a'], 1.2)); faller.scale.setScalar(0.4); scene.add(faller);
  const bug = makeBug(); scene.add(bug);
  const rt1 = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt1);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 9.0, aperture: 0.0021, maxblur: 0.009 }); composer.addPass(bokeh);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), phase === 'night' ? 0.55 : 0.28, 0.55, phase === 'night' ? 0.6 : 0.9));
  composer.addPass(new OutputPass());

  const basis = (n, f) => { const z = f.clone().sub(n.clone().multiplyScalar(f.dot(n))).normalize(); const x = new THREE.Vector3().crossVectors(n, z).normalize(); return new THREE.Matrix4().makeBasis(x, n, z); };
  function frame(t) {
    const w = TAU * t / T;
    const gust = Math.exp(-Math.pow((t - 11) / 1.3, 2));
    bokeh.uniforms.focus.value = 9 - 4.2 * Math.pow(Math.max(0, Math.cos(w)), 14);   // the shot opens focused on the near leaves and pulls to the hero leaf
    { const k = (t - 3.5) / 7; if (k > 0 && k < 1) { faller.visible = true; faller.position.set(0.2 + k * 2.2 + 0.7 * Math.sin(k * 9), 4.4 - k * 9.2, 1.4 - k * 0.6); faller.rotation.set(1.1 + Math.sin(k * 7) * 0.8, k * 5, Math.sin(k * 11) * 0.9 + k * 3); } else faller.visible = false; }
    camera.position.set(0.12 * Math.sin(w), 0.06 * Math.cos(w), 9); camera.lookAt(0.12 * Math.sin(w) * 0.3, 0, 0);
    leafGroup.rotation.z = -0.22 + 0.025 * Math.sin(w) + 0.05 * gust * Math.sin(t * 9); leafGroup.rotation.y = -0.35 + 0.03 * Math.sin(w + 1) + 0.04 * gust * Math.sin(t * 7 + 1); leafGroup.rotation.x = -0.12 + 0.012 * Math.sin(w + 2);
    leafGroup.updateMatrixWorld(true);
    for (const e of extra) { e.m.rotation.set(e.rx + 0.05 * Math.sin(w + e.ph) + 0.08 * gust * Math.sin(t * 8 + e.ph), e.ry + 0.06 * Math.sin(w + e.ph + 1), e.rz + 0.04 * Math.sin(w + e.ph + 2) + 0.1 * gust * Math.sin(t * 6 + e.ph)); e.m.position.y = e.y + 0.07 * Math.sin(w + e.ph); }
    for (const r of rays) { r.m.material.opacity = P.rayA * 0.7 * (0.7 + 0.3 * Math.sin(w + r.i * 1.7)); r.m.position.x = r.x + 0.25 * Math.sin(w + r.i); }
    const d = dg.attributes.position; dBase.forEach((p, i) => { d.setXYZ(i, p.x + p.a * Math.sin(w * p.k + p.ph), p.y + p.a * 0.8 * Math.cos(w * p.k + p.ph * 1.3), p.z + p.a * 0.5 * Math.sin(w + p.ph)); }); d.needsUpdate = true;
    if (flies) { const f = flies.fly.geometry.attributes.position; flies.fb.forEach((p, i) => { f.setXYZ(i, p.x + p.a * Math.sin(w * p.k + p.ph), p.y + p.a * 0.7 * Math.sin(w * (p.k + 1) + p.ph * 1.7), p.z + p.a * 0.4 * Math.cos(w * p.k + p.ph)); }); f.needsUpdate = true; flies.fly.material.opacity = 0.9; }
    // the ladybug walks out and back across the fan, easing to a stop at each end
    const k = 0.5 - 0.5 * Math.cos(w);
    const path = (kk) => [0.62 - 0.18 * kk, 0.22 - 0.5 * kk];
    const [rho, a] = path(k), [rho2, a2] = path(Math.min(1, k + 0.002));
    const f0 = leafFrame(rho, a), f1 = leafFrame(rho2, a2);
    const dir = f1.p.clone().sub(f0.p); if (Math.cos(w) < 0) dir.negate();
    const pos = f0.p.clone().addScaledVector(f0.n, 0.02).applyMatrix4(leaf.matrixWorld);
    const nW = f0.n.clone().transformDirection(leaf.matrixWorld), fW = (dir.lengthSq() > 1e-12 ? dir : new THREE.Vector3(0, 1, 0)).transformDirection(leaf.matrixWorld);
    bug.position.copy(pos); bug.quaternion.setFromRotationMatrix(basis(nW, fW)); bug.scale.setScalar(0.42);
    const speed = Math.abs(Math.sin(w));
    bug.userData.legs.forEach(({ l, sgn, z }, i) => { l.rotation.x = 0.5 * speed * Math.sin(w * 14 + (i % 2 ? 0 : Math.PI) + z * 3); });
    composer.render();
  }
  return { frame, greet: P.greet, renderer, scene, camera, composer, bokeh };
}
