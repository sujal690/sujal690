// Realistic macro shot: a backlit ginkgo leaf, a glossy ladybug walking across it, garden bokeh behind.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { leafFrame, ginkgoGeometry, veinTexture } from './grove.js?v=2';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

function bokehTexture() {
  const W = 1600, H = 800, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0f1a10'); g.addColorStop(.55, '#1d2e17'); g.addColorStop(1, '#3a4a20');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const sun = x.createRadialGradient(W * .82, H * .18, 0, W * .82, H * .18, W * .55); sun.addColorStop(0, 'rgba(255,226,150,.55)'); sun.addColorStop(.4, 'rgba(210,190,110,.18)'); sun.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = sun; x.fillRect(0, 0, W, H);
  const R = rand(12);
  const cols = ['168,196,106', '120,150,70', '232,212,140', '90,120,60', '200,210,120'];
  for (let i = 0; i < 70; i++) {
    const cx = W * (.25 + R() * .8), cy = R() * H, r = 18 + R() * 70, a = (.05 + R() * .22) * (cx / W);
    const col = cols[Math.floor(R() * cols.length)];
    const rg = x.createRadialGradient(cx, cy, r * .55, cx, cy, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(.85, `rgba(${col},${a * 1.15})`); rg.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  x.filter = 'blur(6px)'; x.drawImage(c, 0, 0); x.filter = 'none';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makeBug() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshPhysicalMaterial({ color: 0xb8201c, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.2 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.5 });
  // body underside
  const under = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), black); under.scale.set(0.9, 0.38, 1.02); under.position.y = 0.02; g.add(under);
  // elytra: two half domes with spots painted in a canvas texture so they sit exactly on the curvature
  const spotTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#000000';
    for (const [u, v, r] of [[0.18, 0.55, 26], [0.36, 0.32, 22], [0.36, 0.75, 20], [0.64, 0.32, 22], [0.64, 0.75, 20], [0.82, 0.55, 26], [0.5, 0.12, 16]]) { x.beginPath(); x.ellipse(u * 512, v * 256, r, r * 0.9, 0, 0, TAU); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  shellMat.map = spotTex;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.52, 48, 24, 0, TAU, 0, Math.PI / 2), shellMat);
  shell.scale.set(0.95, 0.78, 1.08); shell.rotation.y = Math.PI / 2; shell.position.y = 0.06; g.add(shell);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.006, 6, 40, Math.PI), black);
  seam.scale.set(1.08, 0.78 * 0.97, 1); seam.rotation.y = Math.PI / 2; seam.position.y = 0.06; g.add(seam);
  // pronotum (black with white cheek patches) and head
  const pron = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 12, 0, TAU, 0, Math.PI / 2), black); pron.scale.set(1.25, 0.7, 0.75); pron.position.set(0, 0.04, 0.5); g.add(pron);
  for (const sgn of [-1, 1]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), white); p.scale.set(1, 0.5, 1); p.position.set(0.21 * sgn, 0.1, 0.55); g.add(p); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 12), black); head.scale.set(1, 0.7, 0.8); head.position.set(0, 0.0, 0.68); g.add(head);
  const legs = [];
  const legGeo = new THREE.CylinderGeometry(0.016, 0.01, 0.34, 6); legGeo.translate(0, -0.17, 0);
  for (const sgn of [-1, 1]) for (const z of [-0.2, 0.06, 0.3]) { const l = new THREE.Mesh(legGeo, black); l.position.set(0.33 * sgn, 0.0, z); l.rotation.z = sgn * 1.15; g.add(l); legs.push({ l, sgn, z }); }
  for (const sgn of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), black); a.position.set(0.07 * sgn, 0.06, 0.82); a.rotation.set(1.15, 0, -0.45 * sgn); g.add(a); }
  g.userData.legs = legs;
  return g;
}

export function createLeafHero({ canvas, width, height, T = 10, dpr = 1 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 200);
  camera.position.set(0, 0, 9);

  const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: bokehTexture(), depthWrite: false }));
  bg.position.z = -14; scene.add(bg);

  scene.add(new THREE.HemisphereLight(0xfff1d0, 0x1b2a14, 0.7));
  const key = new THREE.DirectionalLight(0xffe2a8, 2.6); key.position.set(4, 5, -3); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8e6ff, 0.9); fill.position.set(-4, 2, 6); scene.add(fill);
  const spec = new THREE.DirectionalLight(0xffffff, 1.4); spec.position.set(1, 6, 5); scene.add(spec);

  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, bumpMap: veinTexture(), bumpScale: 1.6 });
  const U = { uBase: { value: new THREE.Color('#3d6a2a') }, uMid: { value: new THREE.Color('#79983a') }, uEdge: { value: new THREE.Color('#d4b445') } };
  leafMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase,uMid,uEdge;')
      .replace('#include <color_fragment>', `vec3 lc = mix(mix(uBase, uMid, smoothstep(0.0, 0.6, vColor.r)), uEdge, smoothstep(0.62, 1.0, vColor.r)); diffuseColor.rgb *= lc * vColor.g;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += lc * (gl_FrontFacing ? 0.10 : 0.32);');
  };
  const leafGroup = new THREE.Group(); scene.add(leafGroup);
  const leaf = new THREE.Mesh(ginkgoGeometry(140, 22), leafMat); leaf.scale.setScalar(2.05); leaf.position.y = -1.45; leafGroup.add(leaf);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, -4.6, 0.2), new THREE.Vector3(0.12, -3.2, 0.08), new THREE.Vector3(0, -1.16, 0)]), 24, 0.045, 8), new THREE.MeshStandardMaterial({ color: 0x6d8a32, roughness: 0.6 }));
  leafGroup.add(stem);
  leafGroup.position.set(3.0, -0.05, 0); leafGroup.rotation.set(-0.12, -0.35, -0.22);

  const bug = makeBug(); scene.add(bug);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.25, 0.5, 0.9));
  composer.addPass(new OutputPass());

  const basis = (n, f) => { const z = f.clone().sub(n.clone().multiplyScalar(f.dot(n))).normalize(); const x = new THREE.Vector3().crossVectors(n, z).normalize(); return new THREE.Matrix4().makeBasis(x, n, z); };
  function frame(t) {
    const w = TAU * t / T;
    leafGroup.rotation.z = -0.22 + 0.025 * Math.sin(w);
    leafGroup.rotation.y = -0.35 + 0.03 * Math.sin(w + 1);
    leafGroup.updateMatrixWorld(true);
    // walk out and back across the fan, easing to a stop at each end
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
  return { frame };
}
