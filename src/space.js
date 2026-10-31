import * as THREE from 'three';

// ---------------------------------------------------------------------------
//  Procedural planets & a spiral galaxy. Textures are painted once on a canvas
//  at load time, so there are no extra downloads.
// ---------------------------------------------------------------------------

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise1D(random) {
  const lattice = Float32Array.from({ length: 256 }, random);
  const at = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = lattice[i & 255];
    const b = lattice[(i + 1) & 255];
    return a + (b - a) * (f * f * (3 - 2 * f));
  };
  return (x) => at(x) * 0.55 + at(x * 2.3 + 17) * 0.3 + at(x * 5.1 + 41) * 0.15;
}

function paletteLookup(stops) {
  const cols = stops.map((c) => new THREE.Color(c));
  const out = new THREE.Color();
  return (t) => {
    const x = Math.min(0.9999, Math.max(0, t)) * (cols.length - 1);
    const i = Math.floor(x);
    return out.copy(cols[i]).lerp(cols[i + 1], x - i);
  };
}

/** Banded gas-giant style texture, seamless around the sphere. */
function bandedTexture(palette, bands, seed, width) {
  const w = width;
  const h = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const random = rng(seed);
  const n = noise1D(random);
  const swirl = noise1D(random);
  const color = paletteLookup(palette);
  const TAU = Math.PI * 2;

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const rowTurb = swirl(v * 9) * 0.9;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const wave = Math.sin(TAU * (u * 3) + v * 23) * 0.5 + Math.sin(TAU * (u * 7) + v * 47) * 0.22;
      const t = n(v * bands + wave * rowTurb * 0.6);
      const c = color(t);
      const shade = 0.82 + 0.18 * Math.sin(TAU * u * 2 + v * 11) * rowTurb;
      const i = (y * w + x) * 4;
      img.data[i] = c.r * 255 * shade;
      img.data[i + 1] = c.g * 255 * shade;
      img.data[i + 2] = c.b * 255 * shade;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function ringTexture(seed) {
  const w = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  const n = noise1D(rng(seed));
  for (let x = 0; x < w; x++) {
    const u = x / w;
    let a = 0.25 + 0.75 * n(u * 38);
    if (u > 0.58 && u < 0.64) a *= 0.12; // the gap
    a *= Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.12);
    const warm = 0.75 + 0.25 * n(u * 12 + 9);
    ctx.fillStyle = `rgba(${(243 * warm) | 0},${(214 * warm) | 0},${(160 * warm) | 0},${a.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPlanet({ radius, palette, bands = 6, seed = 1, ring = false, atmosphere = null, tilt = 0.3, high = false }) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  group.rotation.z = tilt;

  const seg = high ? 64 : 40;
  // No fog: far planets would turn into dark discs. They fade in by distance instead.
  const bodyMat = new THREE.MeshStandardMaterial({
    map: bandedTexture(palette, bands, seed, high ? 1024 : 512),
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.12,
    transparent: true,
    fog: false,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(radius, seg, Math.round(seg * 0.7)), bodyMat);
  spin.add(body);

  let atmosphereMat = null;
  if (atmosphere) {
    atmosphereMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(atmosphere) }, uOpacity: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float rim = 1.0 - max(dot(vN, vV), 0.0);
          gl_FragColor = vec4(uColor, pow(rim, 4.5) * 0.7 * uOpacity);
        }
      `,
    });
    group.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.05, seg, Math.round(seg * 0.7)), atmosphereMat));
  }

  let ringMat = null;
  if (ring) {
    const inner = radius * 1.4;
    const outer = radius * 2.35;
    const geo = new THREE.RingGeometry(inner, outer, high ? 160 : 96, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (Math.hypot(pos.getX(i), pos.getY(i)) - inner) / (outer - inner), 0.5);
    }
    ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture(seed + 7),
      color: 0xa88a52,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(geo, ringMat);
    mesh.rotation.x = -Math.PI / 2 + 0.38;
    group.add(mesh);
  }

  return {
    group,
    update(dt, camera) {
      spin.rotation.y += dt * 0.05;
      const d = camera.position.distanceTo(group.position);
      const fade = 1 - THREE.MathUtils.smoothstep(d, 19, 30);
      group.visible = fade > 0.01;
      bodyMat.opacity = fade;
      bodyMat.depthWrite = fade > 0.98;
      if (ringMat) ringMat.opacity = 0.7 * fade;
      if (atmosphereMat) atmosphereMat.uniforms.uOpacity.value = fade;
    },
  };
}

/**
 * Two-armed spiral galaxy around a soft round bulge. The arms only start
 * outside the bulge and wind more than half a turn, so the centre reads as a
 * glowing disc rather than a hard-edged shape.
 */
export function createGalaxy({ count, radius = 16, pixelRatio = 1 }) {
  const random = Math.random;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const inner = new THREE.Color(0xc9a274);
  const mid = new THREE.Color(0xa86f4e);
  const outer = new THREE.Color(0x3d6fc8);
  const teal = new THREE.Color(0x2a9e88);
  const c = new THREE.Color();
  const bulgeR = radius * 0.22;
  const gauss = () => (random() + random() + random() - 1.5) / 1.5;

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let z;
    let r;
    if (i < count * 0.18) {
      // round bulge: uniform in angle, so there are no arms in the centre
      r = Math.pow(random(), 1.8) * bulgeR;
      const a = random() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.5 * (1 - r / bulgeR);
    } else if (i < count * 0.3) {
      // faint haze across the whole disc
      r = Math.sqrt(random()) * radius;
      const a = random() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.25;
    } else {
      r = bulgeR * 0.7 + Math.pow(random(), 1.2) * (radius - bulgeR * 0.7);
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const a = arm + Math.log(r / (bulgeR * 0.7) + 1) * 2.4;
      const spread = 0.5 + r * 0.09;
      x = Math.cos(a) * r + gauss() * spread;
      z = Math.sin(a) * r + gauss() * spread;
      y = gauss() * 0.25;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    const t = r / radius;
    if (t < 0.3) c.copy(inner).lerp(mid, t / 0.3);
    else c.copy(mid).lerp(random() < 0.3 ? teal : outer, Math.min(1, (t - 0.3) / 0.6));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
    size[i] = random() < 0.04 ? 2.4 + random() * 2 : 0.7 + random() * 1.1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: pixelRatio }, uOpacity: { value: 0.35 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      uniform float uPixelRatio;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = aSize * uPixelRatio * (70.0 / max(-mv.z, 0.001));
        vAlpha = uOpacity * clamp(s, 0.0, 1.0) * 0.55;
        vColor = aColor;
        gl_PointSize = clamp(s, 1.0, 9.0 * uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * a * vAlpha);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);

  return {
    group,
    material,
    update(dt) {
      points.rotation.y += dt * 0.025;
    },
  };
}
