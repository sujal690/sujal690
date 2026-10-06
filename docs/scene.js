// Golden-hour ginkgo grove. Everything is a pure function of time t so the
// README render loops seamlessly (all periodic motion uses integer cycles per T).
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

// ---------------------------------------------------------------- ginkgo leaf
function ginkgoGeometry() {
  const NA = 110, NR = 16;
  const pos = [], uv = [], col = [], idx = [];
  const c1 = new THREE.Color('#8fa63a'), c2 = new THREE.Color('#d9a93a'), c3 = new THREE.Color('#e8c25a');
  const tmp = new THREE.Color();
  for (let i = 0; i <= NR; i++) {
    const rho = i / NR;
    for (let j = 0; j <= NA; j++) {
      const a = j / NA * 2 - 1;
      const th = a * 1.22;
      const ripple = 1 + 0.045 * Math.sin(th * 15) * rho;
      const notch = 1 - 0.30 * Math.exp(-Math.pow(th / 0.10, 2)) * Math.pow(rho, 3);
      const fan = 1 - 0.1 * Math.pow(Math.abs(a), 3);
      const r = rho * ripple * notch * fan * 1.5;
      const x = r * Math.sin(th) * 1.18;
      const y = r * Math.cos(th) + 0.18;
      const z = 0.22 * rho * rho * Math.sin(th * 1.6) + 0.018 * Math.sin(th * 30) * rho + 0.06 * rho * rho;
      pos.push(x, y, z);
      uv.push(j / NA, rho);
      const t = Math.pow(rho, 1.4);
      tmp.copy(c1).lerp(c2, Math.min(1, t * 1.15)).lerp(c3, Math.max(0, (t - 0.7) * 2.4));
      const n = 0.92 + 0.08 * Math.sin(th * 22 + rho * 5);
      col.push(tmp.r * n, tmp.g * n, tmp.b * n);
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
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function veinTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 256);
  for (let k = 0; k <= 46; k++) {
    const u = k / 46 * 512;
    x.strokeStyle = k % 2 ? '#5c5c5c' : '#4a4a4a'; x.lineWidth = k % 2 ? 1.4 : 2.2;
    x.beginPath(); x.moveTo(u, 256); x.lineTo(u, 20); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

function softSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,236,190,1)'); g.addColorStop(0.35, 'rgba(255,214,140,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function shaftTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512;
  const x = c.getContext('2d');
  const gx = x.createLinearGradient(0, 0, 128, 0);
  gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gx; x.fillRect(0, 0, 128, 512);
  x.globalCompositeOperation = 'destination-in';
  const gy = x.createLinearGradient(0, 0, 0, 512);
  gy.addColorStop(0, 'rgba(0,0,0,1)'); gy.addColorStop(0.7, 'rgba(0,0,0,.45)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gy; x.fillRect(0, 0, 128, 512);
  return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------- grade shader
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, bars: { value: 0.0 }, grain: { value: 0.05 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 res; uniform float bars; uniform float grain;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float d = length(c * vec2(1.0, 0.8));
      vec2 off = c * 0.0035 * d;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float l = dot(col, vec3(0.299,0.587,0.114));
      // warm highlights, cool-green shadows (non-neon, filmic)
      col = mix(col * vec3(0.90, 1.0, 0.92), col * vec3(1.08, 1.0, 0.86), smoothstep(0.15, 0.8, l));
      col = pow(col, vec3(0.96));
      col = mix(vec3(l), col, 0.88);
      col *= smoothstep(0.95, 0.25, d * 1.25);
      float g = h(floor(vUv * res * 0.5)) - 0.5;
      col += g * grain * (1.0 - l * 0.6);
      float bar = step(bars, vUv.y) * step(vUv.y, 1.0 - bars);
      col *= bar;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// ---------------------------------------------------------------- scene
export function createScene({ canvas, width, height, T = 6, live = false, leafCount = 30, dpr = 1 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: !live, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a1408, 0.035);
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 80);
  camera.position.set(0, 0, 10);

  // backdrop glow (shader plane far behind everything)
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 34),
    new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, c: { value: new THREE.Vector2(0.74, 0.52) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: `varying vec2 vUv; uniform float t; uniform vec2 c;
        void main(){
          float d = distance(vUv * vec2(1.75,1.0), c * vec2(1.75,1.0));
          vec3 deep = vec3(0.018,0.026,0.016);
          vec3 mid  = vec3(0.10,0.075,0.030);
          vec3 glow = vec3(0.80,0.50,0.18);
          vec3 col = mix(glow, mid, smoothstep(0.0,0.30,d));
          col = mix(col, deep, smoothstep(0.18,0.75,d));
          col += vec3(0.03,0.02,0.0) * (0.5+0.5*sin(t));
          gl_FragColor = vec4(col,1.0);
        }`,
      depthWrite: false, fog: false,
    }),
  );
  bg.position.z = -22; scene.add(bg);

  // lights
  scene.add(new THREE.HemisphereLight(0xffe2b0, 0x16200f, 0.55));
  const sun = new THREE.DirectionalLight(0xffc16e, 4.2); sun.position.set(5, 4, -6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc9d6b8, 1.1); fill.position.set(-5, 2, 8); scene.add(fill);
  const rim = new THREE.PointLight(0xffb458, 22, 14, 1.6); rim.position.set(2.5, 1.5, -2.2); scene.add(rim);

  // leaves
  const geo = ginkgoGeometry();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 0.52, metalness: 0,
    bumpMap: veinTexture(), bumpScale: 2.2, emissive: new THREE.Color(0x000000), emissiveIntensity: 1,
  });
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
 totalEmissiveRadiance += vColor.rgb * (gl_FrontFacing ? 0.34 : 0.62);`);
  };
  const hero = new THREE.Group();
  const heroLeaf = new THREE.Mesh(geo, mat);
  heroLeaf.scale.setScalar(1.7);
  heroLeaf.position.y = -1.2;
  hero.add(heroLeaf);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.0, -3.0, 0.0), new THREE.Vector3(0.07, -2.0, 0.05), new THREE.Vector3(0.0, -0.84, 0.0)]), 12, 0.028, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b7a2c, roughness: 0.7 }),
  );
  hero.add(stem);
  hero.position.set(3.15, 0.2, 0);
  scene.add(hero);

  const N = leafCount, R = rand(7);
  const inst = new THREE.InstancedMesh(geo, mat, N);
  inst.frustumCulled = false;
  const palette = ['#b6c04a', '#d9a93a', '#e8c25a', '#c9893a', '#9bb24a', '#d6b24a', '#b8742f'].map((h) => new THREE.Color(h));
  const L = [];
  for (let i = 0; i < N; i++) {
    const z = -7 + R() * 11;
    L.push({
      x0: -8 + R() * 16, y0: R() * 14, z, s: 0.30 + R() * 0.38 + (z > 1 ? 0.12 : 0),
      k: 1 + Math.floor(R() * 2),
      swayA: 0.25 + R() * 0.7, swayM: 1 + Math.floor(R() * 2), ph: R() * TAU,
      rx: 1 + Math.floor(R() * 2), ry: 1 + Math.floor(R() * 2), rz: 1 + Math.floor(R() * 2), p2: R() * TAU, p3: R() * TAU,
    });
    inst.setColorAt(i, palette[i % palette.length]);
  }
  scene.add(inst);
  const dummy = new THREE.Object3D();

  // dust / pollen
  const DN = 520, dR = rand(21);
  const dpos = new Float32Array(DN * 3), dseed = [];
  for (let i = 0; i < DN; i++) dseed.push({ x: -9 + dR() * 18, y: dR() * 12 - 6, z: -6 + dR() * 12, k: 1 + Math.floor(dR() * 2), a: 0.1 + dR() * 0.4, p: dR() * TAU });
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: softSprite(), size: 0.11, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9a0 }));
  scene.add(dust);

  // light shafts
  const shaftTex = shaftTexture();
  const shafts = [];
  const sR = rand(3);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + sR() * 1.6, 22), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffc47a, fog: false }));
    m.position.set(-3 + i * 2.6 + sR(), 2.5, -9 + sR() * 3); m.rotation.z = -0.5 - sR() * 0.25; scene.add(m);
    shafts.push({ m, ph: sR() * TAU, base: m.position.x });
  }

  // post
  const rt = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(dpr); composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 10, aperture: 0.00022, maxblur: 0.011 });
  composer.addPass(bokeh);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.75, 0.78));
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.res.value.set(width * dpr, height * dpr);
  grade.uniforms.bars.value = live ? 0 : 0.045;
  composer.addPass(grade);

  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  let gust = 0;

  function frame(t, p = ptr) {
    const u = t / T;
    const w = TAU * u;
    // camera: slow dolly + parallax
    camera.position.set(0.5 * Math.sin(w) + p.sx * 0.6, 0.12 * Math.cos(w) - p.sy * 0.35, 10 + 0.5 * (1 - Math.cos(w)) * 0.5);
    camera.lookAt(0.9 + p.sx * 0.3, 0.1, 0);
    bokeh.uniforms.focus.value = camera.position.distanceTo(hero.position);
    bg.material.uniforms.t.value = w;

    hero.rotation.y = 0.55 * Math.sin(w) + p.sx * 0.35 + (p.scroll || 0) * 5.5;
    hero.rotation.z = 0.12 * Math.sin(w * 2 + 1) - 0.08 + p.sy * 0.1;
    hero.rotation.x = 0.08 * Math.cos(w) + p.sy * 0.12;
    hero.position.y = 0.2 + 0.1 * Math.sin(w * 2) + (p.scroll || 0) * 0.8;
    const asp = Math.min(1, camera.aspect / 2.39);
    hero.scale.setScalar(0.62 + 0.38 * asp);
    hero.position.x = (3.15 * (0.5 + 0.5 * asp)) - 1.4 * Math.min(1, (p.scroll || 0) * 2);
    rim.position.x = 2.5 + 0.6 * Math.sin(w);

    for (let i = 0; i < N; i++) {
      const o = L[i];
      const range = 16;
      const y = range / 2 - mod(o.y0 + range * o.k * u + gust * 0, range);
      const x = o.x0 + o.swayA * Math.sin(w * o.swayM + o.ph) * 1.4 + (live ? p.sx * 0.15 * (o.z + 8) / 8 : 0);
      dummy.position.set(x, y, o.z);
      dummy.rotation.set(w * o.rx + o.p2, w * o.ry + o.p3, w * o.rz + o.ph);
      dummy.scale.setScalar(o.s);
      dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < DN; i++) {
      const d = dseed[i];
      dpos[i * 3] = d.x + d.a * Math.sin(w * d.k + d.p) * 2;
      dpos[i * 3 + 1] = mod(d.y + 6 + 12 * d.k * u, 12) - 6;
      dpos[i * 3 + 2] = d.z;
    }
    dgeo.attributes.position.needsUpdate = true;

    shafts.forEach((s, i) => {
      s.m.material.opacity = 0.075 + 0.05 * (0.5 + 0.5 * Math.sin(w + s.ph));
      s.m.position.x = s.base + 0.8 * Math.sin(w + s.ph);
    });
    composer.render();
  }

  function resize(wd, ht) {
    renderer.setSize(wd, ht, false); composer.setSize(wd, ht);
    camera.aspect = wd / ht; camera.updateProjectionMatrix();
    grade.uniforms.res.value.set(wd * dpr, ht * dpr);
  }
  return { frame, resize, ptr, renderer, camera, scene };
}
