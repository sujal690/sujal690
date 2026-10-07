// Offline sprite renderer: photoreal-ish ginkgo leaves, ladybug frames and fruit with true alpha.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ginkgoGeometry, veinTexture } from './grove.js?v=2';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

function stage(w, h, cam) {
  canvas.width = w; canvas.height = h; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  const scene = new THREE.Scene(); scene.environment = envTex; scene.environmentIntensity = 0.28;
  scene.add(new THREE.HemisphereLight(0xfff3dc, 0x1c2a14, 0.55));
  const key = new THREE.DirectionalLight(0xfff0cf, 2.4); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.6); rim.position.set(3, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.5); fill.position.set(4, -1, 5); scene.add(fill);
  return { scene, camera: cam };
}
const ortho = (l, r, b, t) => { const c = new THREE.OrthographicCamera(l, r, t, b, 0.1, 50); c.position.set(0, 0, 10); c.lookAt(0, 0, 0); return c; };

// ---------------------------------------------------------------- leaves
function albedoTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 1024, 512);
  const R = rand(31);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '40,60,10' : '255,250,200'},${0.025 + R() * 0.04})`; x.beginPath(); x.ellipse(R() * 1024, R() * 512, 6 + R() * 40, 3 + R() * 16, R() * 3, 0, TAU); x.fill(); }
  for (let k = 0; k <= 110; k++) { const u = k / 110 * 1024; x.strokeStyle = `rgba(30,50,10,${k % 4 === 0 ? 0.16 : 0.07})`; x.lineWidth = k % 4 === 0 ? 2 : 1; x.beginPath(); x.moveTo(u, 512); x.lineTo(u, 0); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function leafMaterial(tone) {
  const U = { uBase: { value: new THREE.Color(tone.base) }, uMid: { value: new THREE.Color(tone.mid) }, uEdge: { value: new THREE.Color(tone.edge) }, uTrans: { value: tone.trans ?? 0.3 } };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.5, metalness: 0, map: albedoTexture(), bumpMap: veinTexture(), bumpScale: 2.4 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase,uMid,uEdge; uniform float uTrans; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
      .replace('#include <color_fragment>', `
        float m1 = smoothstep(0.0, 0.55, vColor.r);
        vec3 lc = mix(mix(uBase, uMid, m1), uEdge, smoothstep(0.55, 1.0, vColor.r));
        float n = hash(floor(gl_FragCoord.xy * 0.5)) * 0.04;
        diffuseColor.rgb *= lc * (vColor.g * 1.05 + n);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += lc * (gl_FrontFacing ? 0.05 : uTrans);');
  };
  return m;
}
function renderLeaf(tone, w = 1100, h = 800, withStem = true) {
  const cam = ortho(-1.65, 1.65, -0.6, 1.8);
  cam.left = -1.65 * (w / 1100) * (800 / h) * 0 + -1.65; cam.right = 1.65; cam.bottom = -0.6; cam.top = 1.8;
  cam.aspect = 1; cam.updateProjectionMatrix();
  const { scene } = stage(w, h);
  const leaf = new THREE.Mesh(ginkgoGeometry(180, 28), leafMaterial(tone)); leaf.rotation.x = -0.12; scene.add(leaf);
  let anchor = null;
  if (withStem) {
    const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.55, 0.02), new THREE.Vector3(0, -0.2, 0.02), new THREE.Vector3(0, 0.2, -0.03)]), 24, 0.032, 10), new THREE.MeshStandardMaterial({ color: tone.stem ?? 0x6d8a32, roughness: 0.55 }));
    scene.add(stem);
  }
  renderer.render(scene, cam);
  const p = new THREE.Vector3(0, -0.55, 0.02).project(cam);
  anchor = [(p.x + 1) / 2 * w, (1 - p.y) / 2 * h];
  return { url: canvas.toDataURL('image/png'), anchor, w, h, unit: w / 3.3 };
}

// ---------------------------------------------------------------- ladybug
function makeBug() {
  const g = new THREE.Group();
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.5 });
  const spotTex = (seed) => { const R = rand(seed); const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#050505';
    for (const [u, v, r] of [[0.28, 0.45, 20 + R() * 4], [0.62, 0.3, 17 + R() * 4], [0.62, 0.72, 17 + R() * 4]]) { x.beginPath(); x.ellipse(u * 256, v * 256, r, r * 0.95, 0, 0, TAU); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), black); under.scale.set(0.9, 0.36, 1.02); under.position.y = 0.0; g.add(under);
  const halves = [];
  for (const side of [-1, 1]) {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xc0201b, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, map: spotTex(side > 0 ? 3 : 5) });
    const geo = new THREE.SphereGeometry(0.53, 48, 24, side < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI, 0, Math.PI / 2);
    const shell = new THREE.Mesh(geo, mat); shell.scale.set(0.95, 0.78, 1.1);
    const pivot = new THREE.Group(); pivot.position.set(0, 0.06, 0); pivot.add(shell); g.add(pivot);
    halves.push({ pivot, side });
  }
  const pron = new THREE.Mesh(new THREE.SphereGeometry(0.27, 28, 14, 0, TAU, 0, Math.PI / 2), black); pron.scale.set(1.25, 0.7, 0.75); pron.position.set(0, 0.03, 0.52); g.add(pron);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), white); p.scale.set(1, 0.5, 1); p.position.set(0.21 * s, 0.1, 0.58); g.add(p); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 14), black); head.scale.set(1, 0.7, 0.8); head.position.set(0, -0.01, 0.7); g.add(head);
  const legGeo = new THREE.CylinderGeometry(0.026, 0.016, 0.3, 8); legGeo.translate(0, -0.15, 0);
  const legs = [];
  for (const s of [-1, 1]) for (const z of [-0.2, 0.08, 0.32]) { const l = new THREE.Mesh(legGeo, black); l.position.set(0.34 * s, -0.02, z); l.rotation.z = s * 1.15; g.add(l); legs.push({ l, s, z }); }
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 5), black); a.position.set(0.08 * s, 0.05, 0.86); a.rotation.set(1.3, 0, -0.5 * s); g.add(a); }
  const wings = [];
  for (const s of [-1, 1]) {
    const wt = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, 'rgba(80,58,44,0.85)'); g.addColorStop(0.5, 'rgba(176,150,120,0.5)'); g.addColorStop(1, 'rgba(225,215,195,0.22)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 256); x.strokeStyle = 'rgba(60,40,30,0.5)'; x.lineWidth = 2;
      for (const dx of [-30, 0, 30]) { x.beginPath(); x.moveTo(64 + dx * 0.3, 256); x.quadraticCurveTo(64 + dx, 130, 64 + dx * 1.4, 6); x.stroke(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const shape = new THREE.Shape(); shape.ellipse(0, 0, 0.3, 0.85, 0, TAU);
    const wg = new THREE.ShapeGeometry(shape, 24); { const uv = wg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 0.3) / 0.6, (uv.getY(i) + 0.85) / 1.7); }
    const w = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ map: wt, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
    const wp = new THREE.Group(); wp.position.set(0.16 * s, 0.2, -0.05); w.position.set(0.3 * s, 0, -0.18); w.rotation.x = -Math.PI / 2; wp.add(w); g.add(wp); wings.push({ wp, w, s });
  }
  g.userData = { halves, legs, wings };
  return g;
}
function renderBug(pose) {
  const S = 360;
  const cam = ortho(-1.15, 1.15, -1.15, 1.15); cam.position.set(0, 10, 0); cam.up.set(0, 0, 1); cam.lookAt(0, 0, 0);
  const { scene } = stage(S, S);
  const bug = makeBug(); scene.add(bug);
  const { halves, legs, wings } = bug.userData;
  halves.forEach(({ pivot, side }) => { pivot.rotation.z = -side * pose.open * 0.62; pivot.rotation.x = -pose.open * 0.05; });
  legs.forEach(({ l, s, z }, i) => { l.rotation.x = pose.leg * 0.5 * Math.sin((i % 2 ? 0 : Math.PI) + z * 3 + pose.ph); });
  wings.forEach(({ wp, w, s }) => { w.material.opacity = pose.open > 0 ? 1 : 0; wp.rotation.z = -s * pose.wing * 0.7; });
  renderer.render(scene, cam);
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------- fruit (ginkgo "apricots")
function renderFruit(ripe) {
  const S = 220;
  const cam = ortho(-1, 1, -1, 1);
  const { scene } = stage(S, S);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  const base = ripe ? ['#f0a948', '#e58a2e', '#c96a1e'] : ['#b8c46a', '#9fb056', '#7f9444'];
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, base[0]); g.addColorStop(0.55, base[1]); g.addColorStop(1, base[2]); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const R = rand(ripe ? 4 : 9); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${ripe ? '120,60,10' : '60,80,20'},${R() * 0.07})`; x.beginPath(); x.arc(R() * 256, R() * 256, 1 + R() * 3, 0, TAU); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.5, clearcoat: ripe ? 0.4 : 0.15, clearcoatRoughness: 0.35, bumpMap: tex, bumpScale: 0.6 });
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.72, 48, 32), mat); fruit.scale.set(0.94, 1.02, 0.94); scene.add(fruit);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0x5b6a2c, roughness: 0.8 })); cap.position.set(0, 0.7, 0); cap.scale.set(1, 0.5, 1); scene.add(cap);
  renderer.render(scene, cam);
  return canvas.toDataURL('image/png');
}

window.sprites = { renderLeaf, renderBug, renderFruit };
window.ready = true;
