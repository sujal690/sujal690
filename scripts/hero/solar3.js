// Cinematic Earth-from-orbit hero: real Blue Marble Earth with night lights and clouds, atmosphere, Moon,
// a satellite pass, Mars / Jupiter (with its moons) / Saturn along the ecliptic, and the Sun at the limb at dawn and dusk.
// The Sun direction follows the time of day over India: dawn, day, dusk, night.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
const rand = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

// ---------------------------------------------------------------- noise for procedural planet maps
const PERM = (() => { const R = rand(7), p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return new Uint8Array([...p, ...p]); })();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const hv = (x, y, z) => PERM[PERM[PERM[x & 255] + y & 255] + z & 255] / 255;
function noise3(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z); x -= X; y -= Y; z -= Z;
  const u = fade(x), v = fade(y), w = fade(z), l = (a, b, t) => a + (b - a) * t;
  return l(l(l(hv(X, Y, Z), hv(X + 1, Y, Z), u), l(hv(X, Y + 1, Z), hv(X + 1, Y + 1, Z), u), v), l(l(hv(X, Y, Z + 1), hv(X + 1, Y, Z + 1), u), l(hv(X, Y + 1, Z + 1), hv(X + 1, Y + 1, Z + 1), u), v), w);
}
const fbm = (x, y, z, o = 5) => { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function sphereTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), id = x.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    const lat = (0.5 - (j + 0.5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = (i + 0.5) / w * TAU, [r, g, b] = fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, lon), k = (j * w + i) * 4;
      id.data[k] = r; id.data[k + 1] = g; id.data[k + 2] = b; id.data[k + 3] = 255;
    }
  }
  x.putImageData(id, 0, 0); return c;
}
const asTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

const PLANET = {
  jupiter: () => sphereTex(1024, 512, (x, y, z, lat, lon) => {
    const warp = fbm(x * 2.4 + 3, y * 2.4, z * 2.4, 4) * 0.9, b1 = Math.sin(y * 19 + warp * 3.4 + fbm(x * 6, y * 16, z * 6, 3) * 0.9), t = b1 * 0.5 + 0.5;
    let c = mixc([150, 104, 74], [232, 214, 182], sm(0.12, 0.88, t)); c = mixc(c, [186, 120, 82], sm(0.55, 1, fbm(x * 3, y * 8 + 7, z * 3, 3)) * 0.5);
    const streak = fbm(x * 30, y * 70, z * 30, 2) - 0.5; c = c.map((v) => v * (1 + streak * 0.16));
    const d = Math.hypot(((lon - 1.2 + Math.PI) % TAU - Math.PI) * Math.cos(lat) / 0.2, (lat + 0.4) / 0.1);
    if (d < 1.4) { const s = sm(1.4, 0.6, d); c = mixc(c, [190, 92, 66], s * 0.9); }
    return c;
  }),
  saturn: () => sphereTex(1024, 512, (x, y, z) => {
    const warp = fbm(x * 2, y * 2, z * 2, 3) * 0.5, t = Math.sin(y * 24 + warp * 2.0) * 0.5 + 0.5;
    const c = mixc([200, 172, 118], [236, 220, 178], t * 0.8 + fbm(x * 3, y * 12, z * 3, 3) * 0.3); return c.map((v) => v * (0.92 + (fbm(x * 40, y * 90, z * 40, 2) - 0.5) * 0.1));
  }),
  mars: () => sphereTex(1024, 512, (x, y, z, lat) => {
    const n = fbm(x * 2.6, y * 2.6, z * 2.6, 6), m = fbm(x * 7 + 4, y * 7, z * 7, 4);
    let c = mixc([112, 54, 38], [200, 118, 74], sm(0.3, 0.7, n)); c = mixc(c, [214, 150, 100], sm(0.55, 0.8, m) * 0.5);
    const cap = sm(1.28, 1.42, Math.abs(lat) + (fbm(x * 8, y * 8, z * 8, 3) - 0.5) * 0.25); return mixc(c, [244, 244, 242], cap);
  }),
};
function moonCanvas() {
  const c = sphereTex(1024, 512, (x, y, z) => { const m = fbm(x * 2.2 + 9, y * 2.2, z * 2.2, 5), d = fbm(x * 9, y * 9, z * 9, 4); const g = 120 + m * 70 + d * 24; const mar = sm(0.5, 0.58, fbm(x * 1.4 + 2, y * 1.4, z * 1.4, 3)); return [g * (1 - 0.28 * mar), g * (1 - 0.26 * mar), g * (1 - 0.22 * mar)]; });
  const x = c.getContext('2d'), R = rand(31);
  for (let i = 0; i < 420; i++) {
    const cx = R() * c.width, cy = (0.12 + R() * 0.76) * c.height, r = 2 + Math.pow(R(), 3) * 26, sx = 1 / Math.max(0.35, Math.cos((0.5 - cy / c.height) * Math.PI));
    x.save(); x.translate(cx, cy); x.scale(sx, 1);
    const g = x.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r); g.addColorStop(0, 'rgba(20,20,22,.45)'); g.addColorStop(0.75, 'rgba(20,20,22,.18)'); g.addColorStop(0.92, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill(); x.restore();
  }
  return c;
}
function ringTex() {
  const W = 1024, c = document.createElement('canvas'); c.width = W; c.height = 4; const x = c.getContext('2d'), R = rand(5);
  for (let i = 0; i < W; i++) {
    const r = i / W; let a = 0, sh = 0.86;
    if (r > 0.18 && r < 0.38) a = 0.1 + 0.08 * R();                       // C ring
    else if (r >= 0.38 && r < 0.64) a = 0.7 + 0.25 * Math.sin(r * 160) * R(); // B ring
    else if (r >= 0.64 && r < 0.70) a = 0.04;                              // Cassini division
    else if (r >= 0.70 && r < 0.98) a = 0.55 + 0.2 * R() - (r > 0.9 && r < 0.915 ? 0.45 : 0); // A ring and Encke gap
    const v = Math.round(255 * (sh - 0.12 * R())); x.fillStyle = `rgba(${v},${Math.round(v * 0.93)},${Math.round(v * 0.8)},${Math.max(0, Math.min(1, a))})`; x.fillRect(i, 0, 1, 4);
  }
  return c;
}

// ---------------------------------------------------------------- shaders
const NOISE_GLSL = `
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm2(vec2 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vn(p); p=p*2.03+vec2(11.7,3.1); a*=.5; } return s; }`;

const STAR_FRAG = `
uniform vec2 res; uniform vec3 tint; uniform float neb; uniform float glowAmt; uniform vec2 sunPx;
${NOISE_GLSL}
void main(){
  vec2 fc=gl_FragCoord.xy; vec2 uv=fc/res.y;
  // nebula: dusty, muted, never flat black
  vec2 p=uv*1.5+vec2(1.7,0.4);
  float n1=fbm2(p*1.1); float n2=fbm2(p*2.3+n1*2.2+4.); float n3=fbm2(p*5.+n2*1.5);
  float d=(uv.x*0.62+uv.y*0.78)-0.62; float band=exp(-d*d/0.16);
  float lane=smoothstep(.35,.7,fbm2(p*3.4+8.))*band;
  vec3 c1=vec3(.045,.075,.17), c2=vec3(.05,.19,.24), c3=vec3(.20,.10,.20), c4=vec3(.34,.22,.12);
  vec3 col=mix(c1,c2,smoothstep(.3,.75,n2));
  col=mix(col,c3,smoothstep(.45,.85,n1)*0.65);
  col+=c4*pow(n3,3.0)*band*0.9;
  col*= (0.30+1.5*band)*neb;
  col-=vec3(.08,.07,.06)*lane*neb;
  col+=vec3(.015,.02,.04);
  col*=tint;
  // sunlight haze around the sun
  float sd=length((fc-sunPx)/res.y); col+=vec3(1.,.62,.36)*exp(-sd*2.6)*glowAmt*0.30;
  // stars
  for(int L=0;L<3;L++){
    float cs=L==0?3.:(L==1?7.:19.), dens=L==0?.085:(L==1?.065:.035), rad=L==0?.7:(L==1?1.0:1.45);
    vec2 g=floor(fc/cs), f=fract(fc/cs); float r=h21(g+float(L)*17.3);
    if(r>1.-dens){ vec2 cc=vec2(h21(g*1.7+3.1),h21(g*2.3+5.7))*.6+.2; float dd=length((f-cc)*cs); float br=pow(h21(g+9.1),L==2?1.3:2.4)*(L==2?1.1:.8);
      float s=exp(-dd*dd/(rad*rad))*br; float t=h21(g+4.4); vec3 sc=mix(vec3(.62,.74,1.),vec3(1.,.82,.62),t); sc=mix(sc,vec3(1.),.45); col+=sc*s*(1.-.55*band*lane); }
  }
  gl_FragColor=vec4(col,1.);
}`;

const EARTH_VERT = `varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vP=mv.xyz; gl_Position=projectionMatrix*mv; }`;
const EARTH_FRAG = `
uniform sampler2D dayT,nightT,waterT; uniform vec3 sunV; varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  vec3 N=normalize(vN), V=normalize(-vP); float nd=dot(N,sunV);
  vec3 day=texture2D(dayT,vUv).rgb; float lum=dot(day,vec3(.299,.587,.114));
  day=max(mix(vec3(lum),day,1.3),vec3(0.)); day=pow(day,vec3(.88))*1.28;
  float dayAmt=smoothstep(-.06,.2,nd), diff=max(nd,0.);
  vec3 col=day*(diff*1.18+.012);
  float tw=exp(-((nd-.03)/.12)*((nd-.03)/.12)); col+=vec3(1.,.40,.14)*tw*.34*(lum*1.5+.12);
  float water=texture2D(waterT,vUv).r; float wm=water>.5?1.:0.; wm=smoothstep(.35,.65,water);
  vec3 R=reflect(-sunV,N); float sp=pow(max(dot(R,V),0.),70.)*wm*dayAmt; col+=vec3(1.,.94,.82)*sp*1.1;
  float sp2=pow(max(dot(R,V),0.),8.)*wm*dayAmt*.10; col+=vec3(.5,.7,1.)*sp2;
  vec3 nl=texture2D(nightT,vUv).rgb; float nlum=dot(nl,vec3(.333)); col+=vec3(1.,.74,.38)*pow(nlum,1.5)*3.2*(1.-dayAmt)+nl*.55*(1.-dayAmt);
  float fr=pow(clamp(1.-dot(N,V),0.,1.),3.); col+=vec3(.16,.40,.85)*fr*.55*smoothstep(-.3,.3,nd);
  gl_FragColor=vec4(col,1.);
}`;
const CLOUD_FRAG = `
uniform sampler2D cloudT; uniform vec3 sunV; varying vec2 vUv; varying vec3 vN; varying vec3 vP;
void main(){
  vec3 N=normalize(vN), V=normalize(-vP); float nd=dot(N,sunV); float a=smoothstep(.04,.75,texture2D(cloudT,vUv).r);
  float diff=max(nd,0.)*1.15+.012; float tw=exp(-((nd-.03)/.12)*((nd-.03)/.12));
  vec3 col=vec3(1.)*diff+vec3(1.,.45,.2)*tw*.22; float nl=smoothstep(.0,.3,-nd)*.0;
  gl_FragColor=vec4(col,a*.92);
}`;
const ATMO_FRAG = `
uniform vec3 sunV; uniform float inner; varying vec3 vN; varying vec3 vP;
void main(){
  vec3 N=normalize(vN), V=normalize(-vP); float c=abs(dot(N,V)); float k=clamp(c/inner,0.,1.);
  float inten=pow(k,2.3); float nd=dot(N,sunV);
  float lit=smoothstep(-.42,.36,nd);
  vec3 blue=vec3(.22,.50,1.), warm=vec3(1.,.50,.20), white=vec3(.75,.88,1.);
  float tw=exp(-((nd-.0)/.17)*((nd-.0)/.17));
  vec3 col=mix(blue,white,smoothstep(.2,.9,nd)*.35); col=mix(col,warm,tw*.8);
  gl_FragColor=vec4(col*inten*lit*1.45,1.);
}`;
const SUNSPHERE_FRAG = `uniform float t; varying vec2 vUv; varying vec3 vN; varying vec3 vP; ${NOISE_GLSL}
void main(){ vec2 p=vUv*vec2(10.,5.); float n=fbm2(p+vec2(t*.0,0.))*1.1+fbm2(p*2.6)*.4; vec3 col=mix(vec3(1.,.55,.14),vec3(1.,.93,.7),smoothstep(.35,.9,n)); float fr=pow(max(dot(normalize(vN),normalize(-vP)),0.),.5); col*=(.7+.6*fr); gl_FragColor=vec4(col*3.,1.); }`;

// ---------------------------------------------------------------- 2D sprites (glow, anamorphic streak, ghosts)
function glowTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col); x.fillStyle = g; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function streakTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, 'rgba(255,200,140,0)'); g.addColorStop(0.5, 'rgba(255,226,190,1)'); g.addColorStop(1, 'rgba(255,200,140,0)');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 64);
  const m = x.createLinearGradient(0, 0, 0, 64); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.5, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = m; x.fillRect(0, 0, 1024, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const PHASES = {
  //            sun direction (toward the Sun)   Sun on screen (px) or null   exposure  atmosphere
  dawn: { L: [-0.90, 0.26, -0.34], sun: [706, 336], exp: 1.0, neb: 1.0, haze: 0.9, tint: [1.12, 0.92, 0.98], greet: 'Good morning' },
  day: { L: [-0.52, 0.40, 0.75], sun: null, exp: 1.0, neb: 1.0, haze: 0.0, tint: [0.9, 1.04, 1.14], greet: 'Good afternoon' },
  dusk: { L: [0.93, 0.22, -0.30], sun: [1146, 384], exp: 1.0, neb: 1.0, haze: 0.8, tint: [1.16, 0.9, 1.0], greet: 'Good evening' },
  night: { L: [0.10, 0.42, -0.90], sun: null, exp: 1.05, neb: 1.12, haze: 0.0, tint: [0.86, 0.98, 1.2], greet: 'Good night' },
};

export async function createSolar({ canvas, width, height, T = 12, phase = 'dawn', base = './tex/' }) {
  const P = PHASES[phase];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = P.exp; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.autoClear = false;
  const scene = new THREE.Scene();
  const FOV = 30, camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 400);
  const F = (height / 2) / Math.tan(FOV * Math.PI / 360);             // focal length in pixels
  const world = (px, py, depth) => new THREE.Vector3((px - width / 2) * depth / F, -(py - height / 2) * depth / F, -depth);

  const loader = new THREE.TextureLoader();
  const [dayT, nightT, waterT, cloudT] = await Promise.all(['earth-blue-marble.jpg', 'earth-night.jpg', 'earth-water.png', 'clouds_L.png'].map((n) => loader.loadAsync(base + n)));
  for (const t of [dayT, nightT]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; }
  waterT.colorSpace = THREE.NoColorSpace; cloudT.colorSpace = THREE.NoColorSpace; cloudT.anisotropy = 8;

  const sunDir = new THREE.Vector3(...P.L).normalize();

  // background: nebula + stars (screen space, identical on every frame so it compresses well)
  const bgU = { res: { value: new THREE.Vector2(width, height) }, tint: { value: new THREE.Vector3(...P.tint) }, neb: { value: P.neb }, glowAmt: { value: P.haze }, sunPx: { value: new THREE.Vector2(P.sun ? P.sun[0] : -999, P.sun ? height - P.sun[1] : -999) } };
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: bgU, vertexShader: 'void main(){gl_Position=vec4(position.xy,1.,1.);}', fragmentShader: STAR_FRAG, depthTest: false, depthWrite: false, toneMapped: false }));
  bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

  // Earth: centre set so the planet fills the lower right
  const ER = 5.0, EDEPTH = 12, ECX = 930, ECY = 770;
  const earth = new THREE.Group(); earth.position.copy(world(ECX, ECY, EDEPTH)); scene.add(earth);
  const sunV = new THREE.Vector3(); const U = { dayT: { value: dayT }, nightT: { value: nightT }, waterT: { value: waterT }, sunV: { value: sunV } };
  const body = new THREE.Mesh(new THREE.SphereGeometry(ER, 192, 96), new THREE.ShaderMaterial({ uniforms: U, vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG }));
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.007, 160, 80), new THREE.ShaderMaterial({ uniforms: { cloudT: { value: cloudT }, sunV: { value: sunV } }, vertexShader: EARTH_VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false }));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.075, 128, 64), new THREE.ShaderMaterial({ uniforms: { sunV: { value: sunV }, inner: { value: Math.sqrt(1 - Math.pow(1 / 1.075, 2)) } }, vertexShader: EARTH_VERT, fragmentShader: ATMO_FRAG, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  const spin = new THREE.Group(); spin.add(body, clouds); earth.add(spin, atmo);
  // orient: India (78E, 20N) faces the upper part of the visible cap
  const lat = 20 * Math.PI / 180, lon = 78 * Math.PI / 180;
  const uIndia = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)); // matches SphereGeometry's lon mapping (u=0 at -x seam)
  // sphere u=0.5 sits at +x? Three's SphereGeometry: x=-cos(phi)sin(theta), z=sin(phi)sin(theta) with phi=u*2pi; fix numerically below
  const uvToDir = (u, v) => { const phi = u * TAU, th = (1 - v) * Math.PI; return new THREE.Vector3(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)); };
  const idia = uvToDir((78 + 180) / 360, 0.5 + 20 / 180);
  const aim = (px, py) => { const d = new THREE.Vector3((px - width / 2) / F, -(py - height / 2) / F, -1).normalize(), oc = earth.position.clone().negate(); const b = oc.dot(d), cc = oc.lengthSq() - ER * ER, t = -b - Math.sqrt(b * b - cc); return d.multiplyScalar(t).sub(earth.position).normalize(); };
  const toward = aim(1012, 448);   // the surface normal that puts India at this pixel (upper-middle of the visible planet)
  const q0 = new THREE.Quaternion().setFromUnitVectors(idia, toward);
  // roll about the view axis so geographic north points up the screen (with a slight axial tilt)
  let bestA = 0, bestY = -9;
  for (let a = 0; a < Math.PI * 2; a += 0.005) { const n = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(toward, a).multiply(q0)); const y = n.y - 0.25 * n.z; if (y > bestY) { bestY = y; bestA = a; } }
  const qBase = new THREE.Quaternion().setFromAxisAngle(toward, bestA - 0.22).multiply(q0);
  spin.quaternion.copy(qBase);

  // Moon
  const moonTex = asTex(moonCanvas());
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, metalness: 0, bumpMap: moonTex, bumpScale: 1.2 }));
  moon.scale.setScalar(0.5); scene.add(moon);

  // Satellite pass
  const sat = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 0.9, roughness: 0.35 }), panel = new THREE.MeshStandardMaterial({ color: 0x1f3a66, metalness: 0.6, roughness: 0.25, emissive: 0x0a1a33, emissiveIntensity: 0.6 });
  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.12), gold));
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.004, 0.16), panel); p.position.x = s * 0.27; sat.add(p); }
  scene.add(sat);

  // Distant planets along the ecliptic
  const mkPlanet = (tex, r, px, py, depth, tilt = 0) => { const g = new THREE.Group(), m = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 48), new THREE.MeshStandardMaterial({ map: asTex(tex), roughness: 0.92, metalness: 0 })); g.add(m); g.position.copy(world(px, py, depth)); g.rotation.z = tilt; scene.add(g); return { g, m, px, py, depth, r }; };
  const jup = mkPlanet(PLANET.jupiter(), 1.9, 1058, 92, 62, 0.05);
  const sat1 = mkPlanet(PLANET.saturn(), 1.5, 548, 70, 70, 0.0);
  const mars = mkPlanet(PLANET.mars(), 0.62, 842, 196, 52, 0.4);
  { const rt = ringTex(), rtex = new THREE.CanvasTexture(rt); rtex.colorSpace = THREE.SRGBColorSpace; const inner = 1.45, outer = 2.9; const rg = new THREE.RingGeometry(inner * sat1.r, outer * sat1.r, 160, 1); const pos = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) / (outer * sat1.r)), 0.5);
    const rk = { dawn: 0.62, day: 0.9, dusk: 0.5, night: 0.34 }[phase]; const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rtex, alphaMap: rtex, transparent: true, side: THREE.DoubleSide, depthWrite: false, color: new THREE.Color(rk, rk * 0.96, rk * 0.9) })); ring.rotation.x = Math.PI / 2 - 0.42; sat1.g.add(ring); sat1.g.rotation.z = -0.38; }
  const gal = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.09 + i * 0.012, 16, 8), new THREE.MeshBasicMaterial({ color: [0xd8c08a, 0xe8e4da, 0xcfc7b8, 0x9a948a][i] })); scene.add(m); return m; });

  // lights
  const amb = { dawn: [0x1a2038, 0.6], day: [0x1a2038, 0.55], dusk: [0x20182c, 0.6], night: [0x66749c, 1.25] }[phase]; scene.add(new THREE.AmbientLight(amb[0], amb[1]));
  if (phase === 'night') { const fl = new THREE.DirectionalLight(0x9fb4e8, 1.1); fl.position.set(-30, 18, 40); scene.add(fl); }
  const key = new THREE.DirectionalLight(0xfff1dd, 3.4); key.position.copy(sunDir.clone().multiplyScalar(50)); scene.add(key);

  // Sun at the limb (dawn, dusk): disc, corona and flare
  const flareScene = new THREE.Scene(); const ortho = new THREE.OrthographicCamera(0, width, 0, -height, -1, 1);
  const sprite = (tex, w, h, x, y, op, color = 0xffffff) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false, color })); m.position.set(x, -y, 0); flareScene.add(m); return m; };
  let sunBall = null; const flares = [];
  if (P.sun) {
    const sp = P.sun; sunBall = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 24), new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, vertexShader: EARTH_VERT, fragmentShader: SUNSPHERE_FRAG }));
    sunBall.position.copy(world(sp[0], sp[1], 60)); scene.add(sunBall);
    const g1 = glowTex([[0, 'rgba(255,244,220,1)'], [0.08, 'rgba(255,214,150,.75)'], [0.28, 'rgba(255,150,70,.22)'], [1, 'rgba(255,120,40,0)']]);
    const g2 = glowTex([[0, 'rgba(255,255,255,.9)'], [0.25, 'rgba(255,230,190,.25)'], [1, 'rgba(255,200,140,0)']]);
    const st = streakTex(), ring = glowTex([[0.55, 'rgba(255,200,160,0)'], [0.78, 'rgba(255,190,140,.20)'], [0.88, 'rgba(255,170,120,.0)'], [1, 'rgba(255,170,120,0)']]);
    flares.push({ s: sprite(g1, 640, 640, sp[0], sp[1], 0.85), k: 'glow' }, { s: sprite(g2, 120, 120, sp[0], sp[1], 0.95), k: 'core' }, { s: sprite(st, 980, 54, sp[0], sp[1], 0.55), k: 'streak' });
    // ghosts along the line from the sun through the frame centre
    const cx = width / 2, cy = height / 2;
    [[0.32, 90, 0.10, 0xffc890], [0.62, 160, 0.07, 0x9ec8ff], [0.95, 60, 0.12, 0xffb070], [1.4, 230, 0.05, 0xb8d0ff]].forEach(([k, s, o, c]) => flares.push({ s: sprite(ring, s * 2, s * 2, sp[0] + (cx - sp[0]) * k, sp[1] + (cy - sp[1]) * k, o, c), k: 'ghost' }));
  }
  // night: a thin glint of the Sun grazing the top limb
  if (phase === 'night') {
    const g = glowTex([[0, 'rgba(255,236,200,.9)'], [0.2, 'rgba(255,190,120,.30)'], [1, 'rgba(255,150,80,0)']]); const st = streakTex();
    flares.push({ s: sprite(g, 520, 520, 924, 296, 0.55), k: 'glow' }, { s: sprite(st, 900, 40, 924, 296, 0.40), k: 'streak' });
  }

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), phase === 'night' ? 0.34 : 0.28, 0.65, 0.88));
  composer.addPass(new OutputPass());

  const v3 = new THREE.Vector3(), inv = new THREE.Matrix4();
  function frame(t) {
    const w = TAU * t / T;
    camera.position.set(0.30 * Math.sin(w), 0.10 * Math.cos(w), 0); camera.lookAt(0.30 * Math.sin(w) * 0.2, 0, -10); camera.updateMatrixWorld(true);
    // sun direction in view space for the shaders
    sunV.copy(sunDir).transformDirection(camera.matrixWorldInverse).normalize();
    // gentle sway of the planet and a slightly faster cloud drift (periodic over T)
    spin.quaternion.copy(qBase).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.020 * Math.sin(w)));
    clouds.rotation.y = 0.010 * Math.sin(w + 0.8) + 0.018 * Math.sin(w);
    // Moon drifts a little, lit by the same Sun
    moon.position.copy(world(1098 + 6 * Math.sin(w + 0.4), 226 + 3 * Math.cos(w + 0.4), 16)); moon.rotation.y = 0.35 + 0.06 * Math.sin(w);
    // satellite: one revolution of a low orbit per loop, crossing in front of the planet
    const a = -w + 0.9, R = ER * 1.075 + 0.06, c = earth.position;
    sat.position.set(c.x + R * Math.cos(a), c.y + R * Math.sin(a) * 0.30, c.z + R * Math.sin(a) * 0.95); sat.rotation.set(0, -a + Math.PI / 2, 0.15); sat.scale.setScalar(1.15);
    // planets drift on their orbits a few pixels and turn gently
    const drift = (p, ph, ax, ay) => { p.g.position.copy(world(p.px + ax * Math.sin(w + ph), p.py + ay * Math.cos(w + ph), p.depth)); p.m.rotation.y = 0.3 * Math.sin(w + ph); };
    drift(jup, 0.3, 7, 3.2); drift(sat1, 1.7, 6, 2.6); drift(mars, 2.6, 5, 2.2);
    // Jupiter's four moons, integer revolutions per loop
    gal.forEach((m, i) => { const k = [4, 2, 1, 1][i] * (i === 3 ? -1 : 1), r = jup.r * (1.9 + i * 0.62), ang = w * k + i * 1.7; m.position.copy(jup.g.position).add(new THREE.Vector3(r * Math.cos(ang), r * Math.sin(ang) * 0.12, r * Math.sin(ang) * 0.9)); });
    if (sunBall) { sunBall.material.uniforms.t.value = t; sunBall.rotation.y = w * 0; }
    // flare overlay breathes very slightly
    for (const f of flares) { if (f.k === 'glow') f.s.material.opacity = (phase === 'night' ? 0.55 : 0.9) * (1 + 0.04 * Math.sin(w)); if (f.k === 'streak') f.s.scale.x = 1 + 0.03 * Math.sin(w + 1); }
    renderer.setRenderTarget(null); renderer.clear();
    composer.render();
    if (flares.length) { renderer.autoClear = false; renderer.render(flareScene, ortho); }
    // screen-space data for the holographic overlay
    camera.updateMatrixWorld(true); spin.updateMatrixWorld(true);
    const toCam = new THREE.Vector3();
    const proj = (lat, lon, lift = 1.004) => { const d = uvToDir((lon + 180) / 360, 0.5 + lat / 180).applyQuaternion(spin.quaternion); const wp = earth.position.clone().addScaledVector(d, ER * lift); toCam.copy(camera.position).sub(wp).normalize(); const vis = d.dot(toCam); const p = wp.project(camera); return [(p.x + 1) / 2 * width, (1 - p.y) / 2 * height, vis]; };
    const grat = [];
    for (let la = -60; la <= 75; la += 15) { const l = []; for (let lo = -180; lo <= 180; lo += 4) l.push(proj(la, lo)); grat.push(l); }
    for (let lo = -180; lo < 180; lo += 15) { const l = []; for (let la = -84; la <= 84; la += 3) l.push(proj(la, lo)); grat.push(l); }
    const ec = earth.position.clone().project(camera), cpx = [(ec.x + 1) / 2 * width, (1 - ec.y) / 2 * height];
    const rpx = F * ER / earth.position.distanceTo(camera.position);
    return { mumbai: proj(19.03, 73.03, 1.0), center: cpx, r: rpx, grat };
  }
  return { frame, greet: P.greet, renderer, scene, camera, composer };
}
