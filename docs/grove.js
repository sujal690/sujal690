// The grove: one ginkgo leaf that falls and becomes a tree as the page scrolls, with a ladybug.
// Driven by explicit state ({ fall, grow, gold }) so it is fully deterministic.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { DARK } from './scene.js?v=20261006c';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const backOut = (v) => { v = clamp(v); const c = 1.6; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const C = (h) => new THREE.Color(h);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- ginkgo surface (shared by mesh and ladybug)
function leafPoint(rho, a) {
  const th = a * 1.22;
  const ripple = 1 + 0.045 * Math.sin(th * 15) * rho;
  const notch = 1 - 0.30 * Math.exp(-Math.pow(th / 0.10, 2)) * Math.pow(rho, 3);
  const fan = 1 - 0.1 * Math.pow(Math.abs(a), 3);
  const r = rho * ripple * notch * fan * 1.5;
  return V(r * Math.sin(th) * 1.18, r * Math.cos(th) + 0.18, 0.22 * rho * rho * Math.sin(th * 1.6) + 0.018 * Math.sin(th * 30) * rho + 0.06 * rho * rho);
}
function leafFrame(rho, a) {
  const p = leafPoint(rho, a), e = 1e-3;
  const dr = leafPoint(rho + e, a).sub(p), da = leafPoint(rho, a + e).sub(p);
  const n = new THREE.Vector3().crossVectors(dr, da).normalize();
  if (n.z < 0) n.negate();
  return { p, n };
}
function ginkgoGeometry(NA = 96, NR = 14) {
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= NR; i++) {
    const rho = i / NR;
    for (let j = 0; j <= NA; j++) {
      const a = j / NA * 2 - 1, p = leafPoint(rho, a);
      pos.push(p.x, p.y, p.z); uv.push(j / NA, rho);
      col.push(Math.pow(rho, 1.4), 0.92 + 0.08 * Math.sin(a * 1.22 * 22 + rho * 5), 1);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function veinTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 256);
  for (let k = 0; k <= 46; k++) { const u = k / 46 * 512; x.strokeStyle = k % 2 ? '#5c5c5c' : '#4a4a4a'; x.lineWidth = k % 2 ? 1.4 : 2.2; x.beginPath(); x.moveTo(u, 256); x.lineTo(u, 20); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function radialTex(stops) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, s]) => g.addColorStop(o, s)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }

// ---------------------------------------------------------------- tree
// A ginkgo grows monopodially: one leader with tiers of side branches, leaves in short-spur clusters.
function makeTree(seed = 11) {
  const R = rand(seed), segs = [], leaves = [];
  const addSeg = (start, dir, len, rad, t0, dur, depth) => { const s = { start: start.clone(), dir: dir.clone().normalize(), len, rad, t0, t1: t0 + dur, depth }; segs.push(s); return s; };
  const endOf = (s) => s.start.clone().addScaledVector(s.dir, s.len);
  const cluster = (p, dir, t, n, size = 1) => {
    for (let i = 0; i < n; i++) {
      const out = dir.clone().add(V(R() - 0.5, R() * 0.9, R() - 0.5).multiplyScalar(1.5)).normalize();
      leaves.push({ pos: p.clone().add(V((R() - 0.5) * 0.14, (R() - 0.5) * 0.1, (R() - 0.5) * 0.14)), out, roll: R() * TAU, t: t + R() * 0.04, s: (0.12 + R() * 0.07) * size, seed: R() });
    }
  };
  function branch(start, dir, len, rad, t0, depth) {
    let p = start.clone(), d = dir.clone(), t = t0;
    const n = 3;
    for (let i = 0; i < n; i++) {
      d = d.clone().add(V((R() - 0.5) * 0.28, (R() - 0.25) * 0.2, (R() - 0.5) * 0.28)).normalize();
      const s = addSeg(p, d, len / n, rad * (1 - i * 0.24), t, 0.045, depth);
      const e = endOf(s);
      const spurs = depth === 1 ? 1 : 2;
      for (let j = 0; j < spurs; j++) cluster(p.clone().lerp(e, 0.3 + R() * 0.6), d, s.t1, 3 + Math.floor(R() * 3));
      if (depth < 3 && i > 0 && R() < 0.8) {
        const az = R() * TAU, side = V(Math.cos(az), 0, Math.sin(az));
        branch(e, d.clone().multiplyScalar(0.6).add(side).add(V(0, 0.4, 0)).normalize(), len * 0.52, rad * 0.55, s.t1, depth + 1);
      }
      p = e; t = s.t1;
    }
    cluster(p, d, t, 4 + Math.floor(R() * 3));
  }
  let p = V(), d = V(0.03, 1, 0), t = 0, rad = 0.21;
  for (let i = 0; i < 7; i++) {
    const L = i === 0 ? 1.25 : 0.7 * (1 - i * 0.05);
    d = d.clone().add(V((R() - 0.5) * 0.12, 0, (R() - 0.5) * 0.12)).normalize();
    const s = addSeg(p, d, L, rad, t, 0.055, 0); const e = endOf(s);
    if (i >= 1) {
      for (let k = 0; k < 2; k++) {
        const az = (i * 2 + k) * 2.399 + R() * 0.4, side = V(Math.cos(az), 0, Math.sin(az));
        const ang = 0.95 + R() * 0.35 + i * 0.03;
        const cd = V(0, Math.cos(ang), 0).add(side.multiplyScalar(Math.sin(ang))).normalize();
        branch(e, cd, (2.1 - i * 0.22) * (0.8 + R() * 0.3), rad * 0.55, s.t1 - 0.02 + k * 0.02, 1);
      }
    }
    p = e; t = s.t1; rad *= 0.8;
  }
  cluster(p, d, t, 9, 1.1);
  const tmax = Math.max(...segs.map((s) => s.t1), ...leaves.map((l) => l.t + 0.06));
  segs.forEach((s) => { s.t0 /= tmax; s.t1 /= tmax; });
  leaves.forEach((l) => { l.t /= tmax; });
  return { segs, leaves };
}

// ---------------------------------------------------------------- ladybug
function makeLadybug() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd8262e, roughness: 0.28, metalness: 0.05 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.5 });
  const white = new THREE.MeshBasicMaterial({ color: 0xf4efe6 });
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12), black); under.scale.set(0.92, 0.42, 1.0); g.add(under);
  const halves = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0, 0.06, 0); g.add(pivot);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 14, side < 0 ? Math.PI : 0, Math.PI, 0, Math.PI / 2), red);
    shell.scale.set(1, 0.78, 1.05); pivot.add(shell);
    const R = rand(side < 0 ? 5 : 6);
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), black);
      const az = side * (0.45 + R() * 0.9), el = 0.5 + R() * 0.55;
      sp.position.set(Math.sin(az) * Math.cos(el) * 0.5 * side * side, Math.sin(el) * 0.4, Math.cos(az) * Math.cos(el) * 0.5 * (i === 1 ? -0.4 : 0.6));
      sp.position.x = Math.abs(sp.position.x) * side;
      sp.scale.set(1, 0.4, 1); pivot.add(sp);
    }
    halves.push({ pivot, side });
  }
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.98), black); seam.position.set(0, 0.47, 0); g.add(seam);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), black); head.position.set(0, 0.02, 0.5); head.scale.set(1, 0.75, 0.8); g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), white); e.position.set(0.12 * s, 0.09, 0.66); g.add(e); }
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.75), new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
    w.geometry.translate(0.21 * s, 0, -0.1); w.rotation.x = -Math.PI / 2; w.position.y = 0.3; g.add(w); wings.push({ w, s });
  }
  const legs = [];
  const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.32, 5); legGeo.translate(0, -0.16, 0);
  for (const s of [-1, 1]) for (const z of [-0.22, 0.02, 0.26]) { const l = new THREE.Mesh(legGeo, black); l.position.set(0.34 * s, -0.04, z); l.rotation.z = s * 1.0; g.add(l); legs.push({ l, s, z }); }
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 4), black); a.position.set(0.08 * s, 0.12, 0.72); a.rotation.set(1.0, 0, -0.5 * s); g.add(a); }
  g.userData = { halves, wings, legs };
  return g;
}
function poseLadybug(bug, t, walking, open) {
  const { halves, wings, legs } = bug.userData;
  halves.forEach(({ pivot, side }) => { pivot.rotation.z = -side * open * 1.1; pivot.rotation.x = -open * 0.35; });
  wings.forEach(({ w, s }) => { w.material.opacity = open * 0.5; w.rotation.z = s * (open * (0.6 + 0.5 * Math.sin(t * 60))); });
  legs.forEach(({ l, s, z }, i) => { const ph = (i % 2 ? 0 : Math.PI) + z * 3; l.rotation.x = walking * 0.45 * Math.sin(t * 9.4248 + ph); l.rotation.z = s * (1.0 - open * 0.6); });
}

// ---------------------------------------------------------------- scene
export function createGrove({ canvas, width, height, dpr = 1, phase = 'evening', defs = DARK, post = false, live = true, loop = 0 }) {
  // with loop=T every periodic motion snaps to whole cycles per T, so offline renders join seamlessly
  const Q = (k) => (loop ? Math.max(1, Math.round(k * loop / TAU)) * TAU / loop : k);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !post, preserveDrawingBuffer: !live, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 120);

  const P = {}, Tg = {};
  const toLive = (p) => { const o = {}; for (const k in p) o[k] = (typeof p[k] === 'string' && p[k][0] === '#') ? C(p[k]) : (Array.isArray(p[k]) ? p[k].slice() : p[k]); return o; };
  const def = (ph) => (typeof ph === 'string' ? defs[ph] : ph);
  Object.assign(P, toLive(def(phase))); Object.assign(Tg, toLive(def(phase)));
  let blend = 0;

  const bgMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: C('#000') }, mid: { value: C('#000') }, bot: { value: C('#000') }, glow: { value: C('#fff') }, gp: { value: new THREE.Vector2(0.7, 0.6) }, gr: { value: 0.35 }, gi: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: `varying vec2 vUv; uniform vec3 top, mid, bot, glow; uniform vec2 gp; uniform float gr, gi;
      void main(){ vec3 col = mix(bot, mid, smoothstep(0.0, 0.5, vUv.y)); col = mix(col, top, smoothstep(0.45, 1.0, vUv.y));
        float d = distance(vUv * vec2(1.75,1.0), gp * vec2(1.75,1.0)); col = mix(col, glow, (1.0 - smoothstep(0.0, gr, d)) * gi); gl_FragColor = vec4(col, 1.0); }`,
    depthWrite: false, fog: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(90, 50), bgMat); bg.position.z = -30; scene.add(bg);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223322, 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(5, 6, -4); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 1); fill.position.set(-5, 2, 8); scene.add(fill);

  // leaves share one material; colour follows the time of day, then turns gold leaf by leaf
  const U = { uBase: { value: C('#2f9e4f') }, uMid: { value: C('#86cf4e') }, uEdge: { value: C('#e6e06a') }, uEmF: { value: 0.15 }, uEmB: { value: 0.35 }, uGold: { value: 0 } };
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0, bumpMap: veinTexture(), bumpScale: 2.0 });
  leafMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSeed; varying float vSeed;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeed = aSeed;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase,uMid,uEdge; uniform float uEmF,uEmB,uGold; varying float vSeed;')
      .replace('#include <color_fragment>', `
        vec3 lc = mix(mix(uBase, uMid, smoothstep(0.0, 0.55, vColor.r)), uEdge, smoothstep(0.55, 1.0, vColor.r));
        float gold = smoothstep(vSeed - 0.08, vSeed + 0.08, uGold * 1.2 - 0.1);
        vec3 gc = mix(vec3(0.62, 0.32, 0.02), vec3(0.95, 0.62, 0.08), vColor.r);
        lc = mix(lc * (0.88 + 0.24 * vSeed), gc, gold);
        diffuseColor.rgb *= lc * vColor.g;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += lc * (gl_FrontFacing ? uEmF : uEmB) * (1.0 - 0.55 * gold);');
  };
  const leafGeo = ginkgoGeometry();

  // hero leaf (the one that falls)
  const heroGeo = leafGeo.clone(); heroGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Float32Array(heroGeo.attributes.position.count), 1));
  const hero = new THREE.Group(); scene.add(hero);
  const heroLeaf = new THREE.Mesh(heroGeo, leafMat); heroLeaf.position.y = -1.2; heroLeaf.scale.setScalar(1.7); hero.add(heroLeaf);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, -3, 0), V(0.07, -2, 0.05), V(0, -0.84, 0)]), 12, 0.028, 6), new THREE.MeshStandardMaterial({ color: 0x5f8a2a, roughness: 0.7 }));
  hero.add(stem);

  // tree
  const TREE = makeTree(11);
  const tree = new THREE.Group(); scene.add(tree);
  const barkGeo = new THREE.CylinderGeometry(0.66, 1, 1, 8, 1); barkGeo.translate(0, 0.5, 0);
  const bark = new THREE.InstancedMesh(barkGeo, new THREE.MeshStandardMaterial({ color: 0x5e4834, roughness: 0.9 }), TREE.segs.length);
  bark.frustumCulled = false; tree.add(bark);
  const tgeo = leafGeo.clone(); const seeds = new Float32Array(TREE.leaves.length);
  TREE.leaves.forEach((l, i) => { seeds[i] = 0.15 + 0.85 * l.seed; });
  tgeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  const tleaves = new THREE.InstancedMesh(tgeo, leafMat, TREE.leaves.length); tleaves.frustumCulled = false; tree.add(tleaves);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.6), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; tree.add(shadow);
  const dummy = new THREE.Object3D(), up = V(0, 1, 0), q = new THREE.Quaternion(), m = new THREE.Matrix4();

  // drifting golden leaves at the very end (a handful)
  const DRIFT = 7, drift = new THREE.InstancedMesh((() => { const g = leafGeo.clone(); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(DRIFT).fill(0.01), 1)); return g; })(), leafMat, DRIFT);
  drift.frustumCulled = false; tree.add(drift);
  const DR = rand(41), dseed = Array.from({ length: DRIFT }, () => ({ x: (DR() - 0.5) * 3, z: (DR() - 0.5) * 1.5, ph: DR(), sp: 0.5 + DR() * 0.4 }));

  // fireflies (night only, a few)
  const FN = 60, FR = rand(5), fpos = new Float32Array(FN * 3), fseed = new Float32Array(FN * 2);
  for (let i = 0; i < FN; i++) { fpos.set([(FR() - 0.5) * 16, (FR() - 0.5) * 8, (FR() - 0.5) * 6], i * 3); fseed.set([FR() * TAU, 0.5 + FR()], i * 2); }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fgeo.setAttribute('aS', new THREE.BufferAttribute(fseed, 2));
  const fmat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uOp: { value: 0 }, uC: { value: C('#dcff7a') }, uScale: { value: height * dpr * 0.5 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute vec2 aS; uniform float uT, uScale; varying float vA; void main(){ vec3 p = position + vec3(sin(uT*0.3*aS.y+aS.x)*0.6, sin(uT*0.4*aS.y+aS.x*2.0)*0.4, 0.0); vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = 0.14*uScale/-mv.z*2.0; vA = 0.4+0.6*(0.5+0.5*sin(uT*1.7*aS.y+aS.x*3.0)); }',
    fragmentShader: 'uniform vec3 uC; uniform float uOp; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(uC*a*a*uOp*vA,1.0); }' });
  scene.add(new THREE.Points(fgeo, fmat));

  // ladybug
  const bug = makeLadybug(); scene.add(bug);
  const BUG = loop ? 0.27 : 0.2;
  let fly = -1, flyFrom = null;
  const bugSphere = new THREE.Sphere(V(), 0.3);

  let composer = null, bokeh = null;
  if (post) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.00016, maxblur: 0.008 }); composer.addPass(bokeh);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.3, 0.6, 0.85));
    composer.addPass(new OutputPass());
  }

  function apply() {
    bgMat.uniforms.top.value.copy(P.top); bgMat.uniforms.mid.value.copy(P.mid); bgMat.uniforms.bot.value.copy(P.bot); bgMat.uniforms.glow.value.copy(P.glow);
    bgMat.uniforms.gp.value.set(P.glowPos[0], P.glowPos[1]); bgMat.uniforms.gr.value = P.glowR; bgMat.uniforms.gi.value = P.glowI;
    hemi.color.copy(P.hemiSky); hemi.groundColor.copy(P.hemiGround); hemi.intensity = P.hemiI;
    sun.color.copy(P.sun); sun.intensity = P.sunI; fill.color.copy(P.fill); fill.intensity = P.fillI;
    scene.fog.color.copy(P.fog); scene.fog.density = P.fogD * 0.6;
    U.uBase.value.copy(P.base); U.uMid.value.copy(P.midc); U.uEdge.value.copy(P.edge); U.uEmF.value = P.emF; U.uEmB.value = P.emB;
    renderer.toneMappingExposure = P.exposure;
    fmat.uniforms.uOp.value = P.fly * 0.9; fmat.uniforms.uC.value.copy(P.dust);
  }
  function setPhase(ph, instant = false) { Object.assign(Tg, toLive(def(ph))); blend = 3.5; if (instant) { Object.assign(P, toLive(def(ph))); apply(); blend = 0; } }
  apply();

  // anchors: where the ladybug sits
  const heroAnchor = (t) => {
    // a slow wander across the leaf with pauses; integer harmonics keep loops seamless when t is periodic
    const s = loop ? 1.6 * Math.sin(t * Q(0.6)) : t * 0.16 + 0.5 * Math.sin(t * 0.31);
    const side = (v) => (loop ? 0.28 + 0.3 * Math.sin(v * 0.9) : 0.55 * Math.sin(v * 0.9));
    const rho = 0.52 + 0.16 * Math.sin(s * 1.3), a = side(s);
    const s1 = loop ? 1.6 * Math.sin((t + 0.02) * Q(0.6)) : s + 0.01;
    const f0 = leafFrame(rho, a), f1 = leafFrame(0.52 + 0.16 * Math.sin(s1 * 1.3), side(s1));
    const dirL = f1.p.clone().sub(f0.p); const moving = clamp(dirL.length() * 400);
    heroLeaf.updateWorldMatrix(true, false);
    const pos = f0.p.clone().addScaledVector(f0.n, 0.012).applyMatrix4(heroLeaf.matrixWorld);
    const nW = f0.n.clone().transformDirection(heroLeaf.matrixWorld);
    const fW = dirL.lengthSq() > 1e-12 ? dirL.transformDirection(heroLeaf.matrixWorld) : V(1, 0, 0);
    return { pos, n: nW, f: fW, moving };
  };
  const treeAnchor = (idx) => {
    tleaves.getMatrixAt(idx, m); const mw = m.clone().premultiply(tree.matrixWorld);
    const f = leafFrame(0.6, 0.15);
    return { pos: f.p.clone().addScaledVector(f.n, 0.04).applyMatrix4(mw), n: f.n.clone().transformDirection(mw), f: V(0.2, 1, 0).transformDirection(mw), moving: 0 };
  };
  const perch = (() => { let best = 0, bs = -1e9; TREE.leaves.forEach((l, i) => { if (l.t > 0.5 || l.pos.y < 1.6 || l.pos.y > 3.4) return; const sc = l.pos.z * 1.0 + l.out.z * 0.8 - Math.abs(l.pos.x) * 0.3; if (sc > bs) { bs = sc; best = i; } }); return best; })();

  const basis = (n, f) => { const z = f.clone().sub(n.clone().multiplyScalar(f.dot(n))).normalize(); const x = new THREE.Vector3().crossVectors(n, z).normalize(); return new THREE.Matrix4().makeBasis(x, n, z); };

  let state = { fall: 0, grow: 0, gold: 0 };
  function frame(t, s = {}, ptr = { sx: 0, sy: 0 }, dt = 0) {
    state = { ...state, ...s };
    if (blend > 0 && dt > 0) { blend -= dt; const k = 1 - Math.pow(0.001, dt * 0.55); for (const key in Tg) { const a = P[key], b = Tg[key]; if (a && a.isColor) a.lerp(b, k); else if (Array.isArray(a)) for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * k; else if (typeof a === 'number') P[key] = a + (b - a) * k; } apply(); }
    const asp = Math.min(1, camera.aspect / 2.2), narrow = camera.aspect < 1;
    const { fall, grow, gold } = state;
    const ef = smooth(fall), eg = smooth(grow);

    // camera: pulls back and lifts as the tree grows
    const camZ = 10 + 6.5 * eg, lookY = 0.1 + 0.9 * eg;
    camera.position.set(ptr.sx * 0.35, 0.1 * Math.cos(t * Q(0.2)) - ptr.sy * 0.2 + 0.6 * eg, camZ);
    const baseX = narrow ? 0.4 : 3.3 * (0.55 + 0.45 * asp);
    camera.lookAt(narrow ? 0 : 0.9 + 0.15 * eg + ptr.sx * 0.2, lookY, 0);

    // tree lives on the right, rooted below the hero leaf
    tree.position.set(baseX + (narrow ? 0 : 0.7), -3.0, -0.6); tree.scale.setScalar(1.12);
    tree.rotation.y = 0.25 + 0.15 * Math.sin(t * 0.05);

    // hero leaf: hovers, then spirals down and comes to rest beside the trunk
    const hx = baseX, hy = 0.2 + 0.1 * Math.sin(t * Q(0.6));
    const rest = V(tree.position.x - 1.3, tree.position.y + 0.22, tree.position.z + 1.8);
    hero.position.set(hx + (rest.x - hx) * ef + Math.sin(ef * Math.PI * 3) * 0.5 * (1 - ef), hy + (rest.y - hy) * ef, rest.z * ef);
    hero.rotation.set(0.08 * Math.cos(t * Q(0.5)) * (1 - ef) + (-0.78) * ef, 0.5 * Math.sin(t * Q(0.35)) * (1 - ef) + ptr.sx * 0.3 * (1 - ef) + ef * Math.PI * 2, 0.12 * Math.sin(t * Q(0.7) + 1) * (1 - ef));
    hero.scale.setScalar((0.62 + 0.38 * asp) * (1 - 0.72 * ef) * (narrow ? 0.7 : 1));
    stem.visible = ef < 0.98;

    // grow the tree
    TREE.segs.forEach((sg, i) => {
      const gf = clamp((grow - sg.t0) / (sg.t1 - sg.t0));
      q.setFromUnitVectors(up, sg.dir);
      dummy.position.copy(sg.start); dummy.quaternion.copy(q);
      const r = sg.rad * (0.35 + 0.65 * smooth(grow * 1.4 - sg.t0)); if (gf <= 0) dummy.scale.setScalar(0); else dummy.scale.set(r, sg.len * smooth(gf), r);
      dummy.updateMatrix(); bark.setMatrixAt(i, dummy.matrix);
    });
    bark.instanceMatrix.needsUpdate = true;
    TREE.leaves.forEach((l, i) => {
      const lf = backOut((grow - l.t) / 0.07);
      dummy.position.copy(l.pos);
      q.setFromUnitVectors(up, l.out); dummy.quaternion.copy(q); dummy.rotateY(l.roll);
      dummy.rotateX(0.18 * Math.sin(t * 1.3 + l.seed * 20) * (1 - gold * 0.3));
      dummy.scale.setScalar(lf <= 0.001 ? 0 : l.s * lf);
      dummy.updateMatrix(); tleaves.setMatrixAt(i, dummy.matrix);
    });
    tleaves.instanceMatrix.needsUpdate = true;
    U.uGold.value = gold;
    shadow.scale.setScalar(0.3 + 0.9 * eg);
    for (let i = 0; i < DRIFT; i++) {
      const d = dseed[i], k = ((t * 0.06 * d.sp + d.ph) % 1);
      dummy.position.set(d.x + Math.sin(k * 9 + i) * 0.4, 4.6 - k * 4.8, d.z);
      dummy.rotation.set(k * 7 + i, k * 5, k * 3); dummy.scale.setScalar(0.22 * smooth((gold - 0.4) * 3) * (k < 0.92 ? 1 : (1 - k) * 12));
      dummy.updateMatrix(); drift.setMatrixAt(i, dummy.matrix);
    }
    drift.instanceMatrix.needsUpdate = true;
    tree.updateMatrixWorld(true);
    fmat.uniforms.uT.value = t;

    // ladybug: walks on the hero leaf, then flies up to a leaf on the grown tree
    const A = heroAnchor(t);
    const toTree = smooth((grow - 0.42) / 0.12);
    let pose = A, open = 0, walking = A.moving * (1 - ef);
    if (toTree > 0) {
      const B = treeAnchor(perch);
      const mid = A.pos.clone().lerp(B.pos, 0.5).add(V(0, 1.2, 0.6));
      const u = toTree;
      const pos = A.pos.clone().multiplyScalar((1 - u) * (1 - u)).add(mid.multiplyScalar(2 * u * (1 - u))).add(B.pos.clone().multiplyScalar(u * u));
      pose = { pos, n: A.n.clone().lerp(B.n, u).normalize(), f: A.f.clone().lerp(B.f, u).normalize() };
      open = Math.sin(Math.PI * u); walking = 0;
    }
    // click hop: lift off, loop, land
    if (fly >= 0) {
      fly += dt / 2.6;
      if (fly >= 1) fly = -1;
      else {
        const u = fly, lift = Math.sin(Math.PI * u);
        const side = V().crossVectors(pose.n, pose.f).normalize();
        pose = { ...pose, pos: pose.pos.clone().addScaledVector(pose.n, lift * 0.9).addScaledVector(side, Math.sin(u * TAU) * 0.55 * lift).addScaledVector(pose.f, (1 - Math.cos(u * TAU)) * 0.35 * lift) };
        open = Math.max(open, smooth(Math.min(u, 1 - u) * 6)); walking = 0;
      }
    }
    bug.position.copy(pose.pos);
    bug.quaternion.setFromRotationMatrix(basis(pose.n, pose.f));
    bug.scale.setScalar(BUG * (narrow ? 0.85 : 1));
    poseLadybug(bug, t, walking, open);
    bugSphere.center.copy(bug.position);

    if (composer) { if (bokeh) bokeh.uniforms.focus.value = camera.position.distanceTo(hero.position); composer.render(); } else renderer.render(scene, camera);
  }
  const ray = new THREE.Raycaster();
  function hitBug(nx, ny) { ray.setFromCamera(new THREE.Vector2(nx, ny), camera); return ray.ray.intersectsSphere(bugSphere); }
  function poke() { if (fly < 0) fly = 0; }
  function resize(w, h, d = dpr) { dpr = d; renderer.setPixelRatio(d); renderer.setSize(w, h, false); if (composer) composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); fmat.uniforms.uScale.value = h * d * 0.5; }
  return { frame, setPhase, resize, hitBug, poke, renderer, scene, camera, bug };
}
