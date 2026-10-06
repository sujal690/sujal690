// "Living canopy": a ginkgo grove whose light, sky and leaf colour follow the time of day.
// Pure function of time t (integer cycles per T) so renders loop seamlessly.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const mod = (a, n) => ((a % n) + n) % n;
const C = (h) => new THREE.Color(h);

// ------------------------------------------------------------------ phases
export const PHASES = {
  morning: {
    top: '#a6dccd', mid: '#ffe3b4', bot: '#f6c89a', glow: '#ffd27a', glowPos: [0.80, 0.42], glowR: 0.34, glowI: 0.95,
    sun: '#ffe3a6', sunI: 3.0, hemiSky: '#fff4cf', hemiGround: '#5f8f4a', hemiI: 0.9, fill: '#e8f6d8', fillI: 1.1,
    fog: '#f3dcb0', fogD: 0.016, base: '#238f45', midc: '#7cc83f', edge: '#e8d85a',
    emF: 0.07, emB: 0.26, bloom: 0.22, dust: '#fff8d6', dustSize: 0.10, dustOp: 0.75, fly: 0, stars: 0,
    shaft: '#fff3b8', shaftI: 0.07, exposure: 0.96, sat: 1.22, vig: 0.26, grain: 0.035, shadow: [0.95, 1.02, 0.96], high: [1.04, 1.01, 0.94],
    ink: '#0d3b22', canopy: '#1d7a3a',
  },
  afternoon: {
    top: '#5fbfee', mid: '#cdeeb2', bot: '#8fd45a', glow: '#fffbe2', glowPos: [0.72, 0.80], glowR: 0.42, glowI: 0.95,
    sun: '#fff6d8', sunI: 3.4, hemiSky: '#e9f7ff', hemiGround: '#4f9a3a', hemiI: 1.0, fill: '#ffffff', fillI: 1.0,
    fog: '#c3e8a2', fogD: 0.014, base: '#14893b', midc: '#4cbb3e', edge: '#bfe23c',
    emF: 0.06, emB: 0.24, bloom: 0.2, dust: '#ffffff', dustSize: 0.09, dustOp: 0.8, fly: 0, stars: 0,
    shaft: '#fffbe0', shaftI: 0.06, exposure: 0.95, sat: 1.3, vig: 0.2, grain: 0.03, shadow: [0.94, 1.03, 0.97], high: [1.03, 1.02, 0.95],
    ink: '#0a3a1b', canopy: '#17803a',
  },
  evening: {
    top: '#3a2a5e', mid: '#e8815c', bot: '#f6b86a', glow: '#ffb45a', glowPos: [0.74, 0.34], glowR: 0.34, glowI: 1.15,
    sun: '#ffa24a', sunI: 4.6, hemiSky: '#ffc08a', hemiGround: '#2a3f2a', hemiI: 0.6, fill: '#c9a8e6', fillI: 0.7,
    fog: '#d4764f', fogD: 0.020, base: '#2f8a4a', midc: '#93bb3f', edge: '#f2ab45',
    emF: 0.26, emB: 0.58, bloom: 0.62, dust: '#ffd08a', dustSize: 0.11, dustOp: 0.85, fly: 0, stars: 0,
    shaft: '#ffb36a', shaftI: 0.12, exposure: 1.02, sat: 1.1, vig: 0.4, grain: 0.04, shadow: [0.92, 0.96, 1.05], high: [1.1, 1.0, 0.86],
    ink: '#fff0de', canopy: '#1d5a34',
  },
  night: {
    top: '#020c10', mid: '#0a2c2e', bot: '#06231b', glow: '#bfeaff', glowPos: [0.82, 0.78], glowR: 0.12, glowI: 1.0,
    sun: '#9ad4ff', sunI: 1.9, hemiSky: '#244a63', hemiGround: '#0b2a1a', hemiI: 0.55, fill: '#79b6d9', fillI: 0.55,
    fog: '#06201c', fogD: 0.030, base: '#0e7050', midc: '#2cb383', edge: '#86e8b8',
    emF: 0.30, emB: 0.55, bloom: 0.75, dust: '#dcff7a', dustSize: 0.2, dustOp: 0.95, fly: 1, stars: 1,
    shaft: '#9fdcff', shaftI: 0.06, exposure: 1.0, sat: 1.08, vig: 0.5, grain: 0.05, shadow: [0.88, 1.0, 1.0], high: [0.98, 1.04, 1.1],
    ink: '#e5fbe8', canopy: '#06402e',
  },
};
export function phaseForHour(h) {
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 19.5) return 'evening';
  return 'night';
}

// ------------------------------------------------------------------ geometry
function ginkgoGeometry() {
  const NA = 110, NR = 16;
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= NR; i++) {
    const rho = i / NR;
    for (let j = 0; j <= NA; j++) {
      const a = j / NA * 2 - 1;
      const th = a * 1.22;
      const ripple = 1 + 0.045 * Math.sin(th * 15) * rho;
      const notch = 1 - 0.30 * Math.exp(-Math.pow(th / 0.10, 2)) * Math.pow(rho, 3);
      const fan = 1 - 0.1 * Math.pow(Math.abs(a), 3);
      const r = rho * ripple * notch * fan * 1.5;
      pos.push(r * Math.sin(th) * 1.18, r * Math.cos(th) + 0.18,
        0.22 * rho * rho * Math.sin(th * 1.6) + 0.018 * Math.sin(th * 30) * rho + 0.06 * rho * rho);
      uv.push(j / NA, rho);
      // colour channels carry data: r = radial position, g = vein-band variation
      col.push(Math.pow(rho, 1.4), 0.92 + 0.08 * Math.sin(th * 22 + rho * 5), 1);
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function veinTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 256);
  for (let k = 0; k <= 46; k++) { const u = k / 46 * 512; x.strokeStyle = k % 2 ? '#5c5c5c' : '#4a4a4a'; x.lineWidth = k % 2 ? 1.4 : 2.2; x.beginPath(); x.moveTo(u, 256); x.lineTo(u, 20); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function sprite(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function shaftTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const x = c.getContext('2d');
  const gx = x.createLinearGradient(0, 0, 128, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gx; x.fillRect(0, 0, 128, 512); x.globalCompositeOperation = 'destination-in';
  const gy = x.createLinearGradient(0, 0, 0, 512); gy.addColorStop(0, 'rgba(0,0,0,1)'); gy.addColorStop(0.7, 'rgba(0,0,0,.45)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gy; x.fillRect(0, 0, 128, 512); return new THREE.CanvasTexture(c);
}

// ------------------------------------------------------------------ grade
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, bars: { value: 0 }, grain: { value: 0.04 },
    sat: { value: 1.1 }, vig: { value: 0.3 }, shadow: { value: new THREE.Vector3(1, 1, 1) }, high: { value: new THREE.Vector3(1, 1, 1) },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 res; uniform float bars, grain, sat, vig; uniform vec3 shadow, high;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float d = length(c * vec2(1.0, 0.8));
      vec2 off = c * 0.003 * d;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(col * shadow, col * high, smoothstep(0.12, 0.8, l));
      col = mix(vec3(l), col, sat);
      col *= 1.0 - vig * smoothstep(0.25, 0.85, d * 1.2);
      col += (h(floor(vUv * res * 0.5)) - 0.5) * grain * (1.0 - l * 0.5);
      col *= step(bars, vUv.y) * step(vUv.y, 1.0 - bars);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// ------------------------------------------------------------------ scene
export function createScene({ canvas, width, height, T = 6, live = false, leafCount = 40, dpr = 1, phase = 'afternoon', bars = 0 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: !live, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a1408, 0.02);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 80);
  camera.position.set(0, 0, 10);

  // live parameter set (colours are THREE.Color so they can be lerped)
  const P = {}; const Tg = {};
  const toLive = (p) => { const o = {}; for (const k in p) o[k] = (typeof p[k] === 'string' && p[k][0] === '#') ? C(p[k]) : (Array.isArray(p[k]) ? p[k].slice() : p[k]); return o; };
  Object.assign(P, toLive(PHASES[phase])); Object.assign(Tg, toLive(PHASES[phase]));
  const lerpTo = (k) => {
    const a = P[k], b = Tg[k];
    if (a && a.isColor) a.lerp(b, k2); else if (Array.isArray(a)) for (let i = 0; i < a.length; i++) a[i] += (b[i] - a[i]) * k2; else P[k] = a + (b - a) * k2;
  };
  let k2 = 1;

  // backdrop
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: C('#000') }, mid: { value: C('#000') }, bot: { value: C('#000') }, glow: { value: C('#fff') }, gp: { value: new THREE.Vector2(.7, .6) }, gr: { value: .35 }, gi: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: `varying vec2 vUv; uniform vec3 top, mid, bot, glow; uniform vec2 gp; uniform float gr, gi;
      void main(){
        vec3 col = mix(bot, mid, smoothstep(0.0, 0.5, vUv.y)); col = mix(col, top, smoothstep(0.45, 1.0, vUv.y));
        float d = distance(vUv * vec2(1.75,1.0), gp * vec2(1.75,1.0));
        col = mix(col, glow, (1.0 - smoothstep(0.0, gr, d)) * gi);
        gl_FragColor = vec4(col, 1.0);
      }`, depthWrite: false, fog: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 34), bgMat); bg.position.z = -22; scene.add(bg);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223322, 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(5, 4, -6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 1); fill.position.set(-5, 2, 8); scene.add(fill);
  const rim = new THREE.PointLight(0xffffff, 20, 14, 1.6); rim.position.set(2.5, 1.5, -2.2); scene.add(rim);

  // leaf material: colours come from uniforms so the phase can crossfade
  const U = { uBase: { value: C('#2f9e4f') }, uMid: { value: C('#86cf4e') }, uEdge: { value: C('#e6e06a') }, uEmF: { value: .2 }, uEmB: { value: .4 } };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.5, metalness: 0, bumpMap: veinTexture(), bumpScale: 2.2 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aTint; varying float vTint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = aTint;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase,uMid,uEdge; uniform float uEmF,uEmB; varying float vTint;')
      .replace('#include <color_fragment>', `
        vec3 lc = mix(mix(uBase, uMid, smoothstep(0.0, 0.55, vColor.r)), uEdge, smoothstep(0.55, 1.0, vColor.r));
        lc = mix(lc, uEdge, clamp(vTint, 0.0, 1.0) * 0.7);
        lc *= (1.0 + min(vTint, 0.0) * 0.55) * vColor.g;
        diffuseColor.rgb *= lc;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += lc * (gl_FrontFacing ? uEmF : uEmB);');
  };
  const geo = ginkgoGeometry();

  const hero = new THREE.Group();
  const heroLeaf = new THREE.Mesh(geo, mat); heroLeaf.scale.setScalar(1.7); heroLeaf.position.y = -1.2; hero.add(heroLeaf);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5f8a2a, roughness: 0.7 });
  hero.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0.07, -2, 0.05), new THREE.Vector3(0, -0.84, 0)]), 12, 0.028, 6), stemMat));
  hero.position.set(3.15, 0.2, 0); scene.add(hero);

  const mkInst = (n, seed, spec) => {
    const g = geo.clone(); const tint = new Float32Array(n); const R = rand(seed); const L = [];
    for (let i = 0; i < n; i++) { const o = spec(R, i); tint[i] = o.tint; L.push(o); }
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
    const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; scene.add(m);
    return { m, L, n };
  };
  const falling = mkInst(leafCount, 7, (R) => {
    const z = -7 + R() * 11;
    return { x0: -8 + R() * 16, y0: R() * 14, z, s: 0.30 + R() * 0.38 + (z > 1 ? 0.12 : 0), k: 1 + Math.floor(R() * 2), swayA: 0.25 + R() * 0.7, swayM: 1 + Math.floor(R() * 2), ph: R() * TAU,
      rx: 1 + Math.floor(R() * 2), ry: 1 + Math.floor(R() * 2), rz: 1 + Math.floor(R() * 2), p2: R() * TAU, p3: R() * TAU, tint: (R() - 0.35) * 1.1 };
  });
  // lush foreground canopy: big, soft, framing leaves
  const canopyPos = [[-7.2, 3.3, 4.4, 2.2], [6.8, 3.6, 4.0, 2.4], [-6.4, -3.4, 4.2, 2.3], [7.2, -3.2, 4.6, 2.6], [0.5, 4.6, 3.6, 1.8], [-3.2, -4.2, 3.8, 1.9], [4.2, -4.4, 3.6, 2.0], [-8.6, 0.2, 3.4, 1.8]];
  const canopy = mkInst(canopyPos.length, 31, (R, i) => ({ x0: canopyPos[i][0], y0: canopyPos[i][1], z: canopyPos[i][2], s: canopyPos[i][3], ph: R() * TAU, p2: R() * TAU, p3: R() * TAU, tint: -0.45 }));
  const dummy = new THREE.Object3D();

  // dust / pollen / fireflies
  const DN = 560, dR = rand(21), dpos = new Float32Array(DN * 3), dseed = [];
  for (let i = 0; i < DN; i++) dseed.push({ x: -9 + dR() * 18, y: dR() * 12 - 6, z: -6 + dR() * 12, k: 1 + Math.floor(dR() * 2), a: 0.1 + dR() * 0.4, p: dR() * TAU });
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({ map: sprite([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]), size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(dgeo, dustMat));

  // stars (night)
  const SN = 160, sR = rand(77), spos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { spos[i * 3] = -22 + sR() * 44; spos[i * 3 + 1] = -2 + sR() * 14; spos[i * 3 + 2] = -20; }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const starMat = new THREE.PointsMaterial({ map: sprite([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]), size: 0.28, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  scene.add(new THREE.Points(sgeo, starMat));

  // light shafts
  const shaftTex = shaftTexture(), shafts = [], shR = rand(3);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + shR() * 1.6, 22), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.position.set(-3 + i * 2.6 + shR(), 2.5, -9 + shR() * 3); m.rotation.z = -0.5 - shR() * 0.25; scene.add(m); shafts.push({ m, ph: shR() * TAU, base: m.position.x });
  }

  // post
  const rt = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(dpr); composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.00022, maxblur: 0.011 }); composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.4, 0.75, 0.8); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); grade.uniforms.res.value.set(width * dpr, height * dpr); grade.uniforms.bars.value = bars; composer.addPass(grade);

  const ptr = { x: 0, y: 0, sx: 0, sy: 0, scroll: 0 };

  function apply() {
    bgMat.uniforms.top.value.copy(P.top); bgMat.uniforms.mid.value.copy(P.mid); bgMat.uniforms.bot.value.copy(P.bot); bgMat.uniforms.glow.value.copy(P.glow);
    bgMat.uniforms.gp.value.set(P.glowPos[0], P.glowPos[1]); bgMat.uniforms.gr.value = P.glowR; bgMat.uniforms.gi.value = P.glowI;
    hemi.color.copy(P.hemiSky); hemi.groundColor.copy(P.hemiGround); hemi.intensity = P.hemiI;
    sun.color.copy(P.sun); sun.intensity = P.sunI; fill.color.copy(P.fill); fill.intensity = P.fillI; rim.color.copy(P.sun);
    scene.fog.color.copy(P.fog); scene.fog.density = P.fogD;
    U.uBase.value.copy(P.base); U.uMid.value.copy(P.midc); U.uEdge.value.copy(P.edge); U.uEmF.value = P.emF; U.uEmB.value = P.emB;
    bloom.strength = P.bloom; renderer.toneMappingExposure = P.exposure;
    dustMat.color.copy(P.dust); dustMat.size = P.dustSize; starMat.opacity = P.stars * 0.9;
    shafts.forEach((s) => { s.m.material.color.copy(P.shaft); });
    grade.uniforms.sat.value = P.sat; grade.uniforms.vig.value = P.vig; grade.uniforms.grain.value = P.grain;
    grade.uniforms.shadow.value.set(...P.shadow); grade.uniforms.high.value.set(...P.high);
  }
  function setPhase(name, instant = false) {
    Object.assign(Tg, toLive(PHASES[name]));
    if (instant) { Object.assign(P, toLive(PHASES[name])); apply(); }
  }
  apply();

  function frame(t, p = ptr, dt = 0) {
    if (dt > 0) { k2 = 1 - Math.pow(0.001, dt * 0.55); for (const key in Tg) lerpTo(key); apply(); }
    const u = t / T, w = TAU * u;
    camera.position.set(0.5 * Math.sin(w) + p.sx * 0.6, 0.12 * Math.cos(w) - p.sy * 0.35, 10 + 0.25 * (1 - Math.cos(w)));
    camera.lookAt(0.9 + p.sx * 0.3, 0.1, 0);
    bokeh.uniforms.focus.value = camera.position.distanceTo(hero.position);

    const asp = Math.min(1, camera.aspect / 2.39);
    hero.scale.setScalar(0.62 + 0.38 * asp);
    hero.rotation.y = 0.55 * Math.sin(w) + p.sx * 0.35 + (p.scroll || 0) * 5.5;
    hero.rotation.z = 0.12 * Math.sin(w * 2 + 1) - 0.08 + p.sy * 0.1;
    hero.rotation.x = 0.08 * Math.cos(w) + p.sy * 0.12;
    hero.position.y = 0.2 + 0.1 * Math.sin(w * 2) + (p.scroll || 0) * 0.8;
    hero.position.x = 3.15 * (0.5 + 0.5 * asp) - 1.4 * Math.min(1, (p.scroll || 0) * 2);
    rim.position.x = 2.5 + 0.6 * Math.sin(w);

    const F = falling;
    for (let i = 0; i < F.n; i++) {
      const o = F.L[i], range = 16;
      dummy.position.set(o.x0 + o.swayA * Math.sin(w * o.swayM + o.ph) * 1.4 + (live ? p.sx * 0.15 * (o.z + 8) / 8 : 0), range / 2 - mod(o.y0 + range * o.k * u, range), o.z);
      dummy.rotation.set(w * o.rx + o.p2, w * o.ry + o.p3, w * o.rz + o.ph); dummy.scale.setScalar(o.s); dummy.updateMatrix(); F.m.setMatrixAt(i, dummy.matrix);
    }
    F.m.instanceMatrix.needsUpdate = true;
    const Cn = canopy;
    for (let i = 0; i < Cn.n; i++) {
      const o = Cn.L[i];
      dummy.position.set(o.x0 + 0.25 * Math.sin(w + o.ph) - p.sx * 0.5 * (o.z / 4), o.y0 + 0.2 * Math.cos(w + o.p2) - p.sy * 0.3, o.z);
      dummy.rotation.set(0.5 * Math.sin(w + o.p2), 0.6 * Math.sin(w + o.ph), o.p3 + 0.3 * Math.sin(w + o.ph * 2)); dummy.scale.setScalar(o.s); dummy.updateMatrix(); Cn.m.setMatrixAt(i, dummy.matrix);
    }
    Cn.m.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < DN; i++) {
      const d = dseed[i];
      // fireflies wander in lazy loops, pollen drifts upward
      const fl = P.fly;
      dpos[i * 3] = d.x + d.a * Math.sin(w * d.k + d.p) * (2 + fl * 3);
      dpos[i * 3 + 1] = fl > 0.5 ? d.y * 0.7 + Math.sin(w * d.k * 2 + d.p) * 0.6 : mod(d.y + 6 + 12 * d.k * u, 12) - 6;
      dpos[i * 3 + 2] = d.z;
    }
    dgeo.attributes.position.needsUpdate = true;
    dustMat.opacity = P.dustOp * (P.fly > 0.5 ? 0.55 + 0.45 * Math.sin(w * 4) : 1);

    shafts.forEach((s) => { s.m.material.opacity = (P.shaftI + 0.03 * Math.sin(w + s.ph)) * (0.7 + 0.3 * Math.sin(w + s.ph)); s.m.position.x = s.base + 0.8 * Math.sin(w + s.ph); });
    composer.render();
  }
  function resize(wd, ht) { renderer.setSize(wd, ht, false); composer.setSize(wd, ht); camera.aspect = wd / ht; camera.updateProjectionMatrix(); grade.uniforms.res.value.set(wd * dpr, ht * dpr); }
  return { frame, resize, ptr, setPhase, renderer, camera, scene, P };
}
