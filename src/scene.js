import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPlanet, createGalaxy } from './space.js';

const HERO_Z = 6;
const FIRST_FRAME_Z = -9;
const FRAME_SPACING = 11;

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Spiral galaxy at the end of the journey, seen face-on from the final camera spot
const GALAXY_CENTER = new THREE.Vector3(0, -4, -108);
const GALAXY_TILT = 1.1;

/**
 * Space journey: twinkling stars, golden rings (hero), planets, a corridor of
 * floating photo frames (love story) and a spiral galaxy at the end.
 * Driven by `scroll` = { hero, pre, story, outro }, each 0..1.
 */
export function createScene(canvas, { framePhotos, quality, scroll }) {
  const high = quality === 'high';
  const coarse = matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: high,
    powerPreference: 'high-performance',
  });
  let maxDpr = high ? 1.75 : 1.35;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x061024, 9, 32);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 160);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // Lit from the upper left so the planets get a dramatic day/night edge
  const key = new THREE.DirectionalLight(0xfff0d2, 2.4);
  key.position.set(-4, 2.5, 2.5);
  scene.add(key, new THREE.AmbientLight(0xbcd3ff, 0.25));

  const glowTexture = makeGlowTexture();

  // ---------------- Stars ----------------
  const stars = createStars(high ? 3200 : 1700, renderer.getPixelRatio());
  scene.add(stars.points);

  // ---------------- Rings ----------------
  const rings = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xf2cd8a, metalness: 1, roughness: 0.17, transparent: true });
  const torus = new THREE.TorusGeometry(0.62, 0.07, high ? 48 : 28, high ? 160 : 96);
  const ringA = new THREE.Mesh(torus, ringMat);
  ringA.position.x = -0.3;
  ringA.rotation.set(0.15, 0.55, 0);
  const ringB = new THREE.Mesh(torus, ringMat);
  ringB.position.x = 0.3;
  ringB.rotation.set(-0.35, -0.55, 0.1);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.02,
    envMapIntensity: 4,
    flatShading: true,
    transparent: true,
  });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemMat);
  gem.scale.y = 1.25;
  gem.position.y = 0.62 + 0.11;
  ringB.add(gem);
  const haloMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xd9b46a,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(4.2, 4.2, 1);
  halo.position.z = -0.6;
  const spin = new THREE.Group();
  spin.add(ringA, ringB);
  rings.add(spin, halo);
  rings.scale.setScalar(0.0001);
  scene.add(rings);
  const ringBase = { y: 0.45, scale: 1 };

  // ---------------- Photo frames ----------------
  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const plane = new THREE.PlaneGeometry(1, 1);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xc9a258, toneMapped: false, transparent: true });

  const frames = framePhotos.map((p, i) => {
    const group = new THREE.Group();
    const photoMat = new THREE.MeshBasicMaterial({ color: 0x1a2a4a, toneMapped: false, transparent: true });
    const photoMesh = new THREE.Mesh(plane, photoMat);
    const border = new THREE.Mesh(plane, borderMat.clone());
    border.position.z = -0.012;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xc9a25a,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.position.z = -0.25;
    group.add(glow, border, photoMesh);
    scene.add(group);

    const frame = { group, photoMesh, photoMat, border, glow, aspect: p.width / p.height, baseY: 0, index: i };
    loader.load(p.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      photoMat.map = tex;
      photoMat.color.set(0xffffff);
      photoMat.needsUpdate = true;
      if (tex.image?.width) frame.aspect = tex.image.width / tex.image.height;
      layout();
    });
    return frame;
  });

  // ---------------- Planets & galaxy ----------------
  const goldPlanet = createPlanet({
    radius: 2,
    palette: ['#2a1e12', '#5a4224', '#9a7848', '#6a4e2c', '#b89a68', '#3e2c18'],
    bands: 7,
    seed: 3,
    ring: true,
    tilt: 0.35,
    high,
  });
  const emeraldPlanet = createPlanet({
    radius: 1.5,
    palette: ['#04201f', '#0c4a43', '#1f7a68', '#0a3340', '#5fb5a0', '#0d3b4a'],
    bands: 5,
    seed: 11,
    atmosphere: 0x4fe3c1,
    tilt: -0.25,
    high,
  });
  const moon = createPlanet({
    radius: 0.9,
    palette: ['#141d45', '#2c3f86', '#7f93d6', '#b9c5ee', '#3b4fa0'],
    bands: 4,
    seed: 23,
    atmosphere: 0x9fb4ff,
    tilt: 0.1,
    high,
  });
  const planets = [goldPlanet, emeraldPlanet, moon];
  planets.forEach((p) => scene.add(p.group));

  const galaxy = createGalaxy({ count: high ? 30000 : 14000, radius: 16, pixelRatio: renderer.getPixelRatio() });
  galaxy.group.position.copy(GALAXY_CENTER);
  galaxy.group.rotation.x = GALAXY_TILT;
  scene.add(galaxy.group);

  const nebulae = [
    [0x0f5a4f, 46, -14, 2, -6],
    [0x2a4fa0, 40, 12, -3, 4],
    [0x8a6a3a, 22, 0, 0, 0],
  ].map(([color, size, x, y, z]) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    s.scale.set(size, size, 1);
    s.position.copy(GALAXY_CENTER).add(new THREE.Vector3(x, y, z));
    scene.add(s);
    return s;
  });

  // Camera detours: glance at the golden planet before the story, then fly to the galaxy after it
  const pre = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const outro = { pos: new THREE.Vector3(), look: GALAXY_CENTER.clone() };
  const galaxyNormal = new THREE.Vector3(0, Math.cos(GALAXY_TILT), Math.sin(GALAXY_TILT));

  // ---------------- Camera stations ----------------
  // 0 = story start, 1..n = in front of each frame, n+1 = exit into open space
  const stations = Array.from({ length: frames.length + 2 }, () => ({
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
  }));

  function fit(frame, boxW, boxH) {
    let w = boxW;
    let h = w / frame.aspect;
    if (h > boxH) {
      h = boxH;
      w = h * frame.aspect;
    }
    frame.photoMesh.scale.set(w, h, 1);
    frame.border.scale.set(w + 0.07, h + 0.07, 1);
    const g = Math.max(w, h) * 2.3;
    frame.glow.scale.set(g, g, 1);
  }

  function layout() {
    const portrait = camera.aspect < 1;
    const dist = portrait ? 4.6 : 3.6;

    ringBase.y = portrait ? 0.72 : 0.42;
    ringBase.scale = portrait ? 0.82 : 0.74;

    stations[0].pos.set(0, 0, HERO_Z - 1.2);
    stations[0].look.set(0, 0, 0);

    frames.forEach((f, i) => {
      const side = i % 2 === 0 ? 1 : -1; // even → frame on the right, text on the left
      const z = FIRST_FRAME_Z - i * FRAME_SPACING;
      if (portrait) {
        f.baseY = 0.76;
        f.group.position.set(0, f.baseY, z);
        f.group.rotation.set(0, 0, 0);
        fit(f, 1.15, 1.32);
        stations[i + 1].pos.set(0, 0.25, z + dist);
        stations[i + 1].look.set(0, 0.25, z);
      } else {
        f.baseY = 0.05;
        f.group.position.set(side * 1.05, f.baseY, z);
        f.group.rotation.set(0, -side * 0.22, 0);
        fit(f, 1.9, 2.0);
        stations[i + 1].pos.set(side * 0.25, 0, z + dist);
        stations[i + 1].look.set(side * 0.55, 0, z);
      }
    });

    const lastZ = FIRST_FRAME_Z - (frames.length - 1) * FRAME_SPACING;
    const exit = stations[frames.length + 1];
    exit.pos.set(0, 0, lastZ - 9);
    exit.look.set(0, 0, lastZ - 22);

    // Planets sit off to the side so they never cover the photos or the text
    // Golden planet lives in the top-right corner, clear of the rings & names
    if (portrait) {
      goldPlanet.group.position.set(4.3, 5.6, -14);
      goldPlanet.group.scale.setScalar(0.75);
      // narrow screens: just drift forward, the planet slides out towards the corner
      pre.pos.set(0, 0.2, HERO_Z - 2.6);
      pre.look.set(0, 0.2, 0);
      emeraldPlanet.group.position.set(-2.6, 2.9, FIRST_FRAME_Z - 1.5 * FRAME_SPACING);
      moon.group.position.set(1.9, -2.4, FIRST_FRAME_Z - 3.5 * FRAME_SPACING);
    } else {
      goldPlanet.group.position.set(10, 3.4, -14);
      goldPlanet.group.scale.setScalar(1);
      pre.pos.set(0.5, 0.3, HERO_Z - 2.4);
      pre.look.set(0.9, 0.5, -9);
      emeraldPlanet.group.position.set(-5.6, 3, FIRST_FRAME_Z - 1.5 * FRAME_SPACING - 2);
      moon.group.position.set(4.2, -2.4, FIRST_FRAME_Z - 3.5 * FRAME_SPACING);
    }
    outro.pos.copy(GALAXY_CENTER).addScaledVector(galaxyNormal, portrait ? 40 : 30);
    // look above the centre so the galaxy core sits low on screen, below the closing text
    outro.look.copy(GALAXY_CENTER).add(new THREE.Vector3(0, portrait ? 9 : 7, 0));
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    galaxy.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    layout();
  }

  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      resize();
    });
  });
  resize();

  // ---------------- Pointer parallax (desktop) ----------------
  const pointer = { x: 0, y: 0 };
  const pointerSmooth = { x: 0, y: 0 };
  if (!coarse) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  // ---------------- Loop ----------------
  const camPos = new THREE.Vector3(0, 0, HERO_Z + 3);
  const camLook = new THREE.Vector3(0, 0, 0);
  const targetPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const timer = new THREE.Timer();
  let introStart = -1;
  let perfFrames = 0;
  let perfTime = 0;

  function computeTarget() {
    const n = frames.length;

    if (scroll.outro > 0) {
      const e = smoother(clamp01(scroll.outro));
      const exit = stations[n + 1];
      targetPos.lerpVectors(exit.pos, outro.pos, e);
      targetPos.x += Math.sin(Math.PI * e) * 3;
      targetLook.lerpVectors(exit.look, outro.look, e);
      return;
    }

    const s = clamp01(scroll.story) * (n + 1);
    if (s <= 0) {
      targetPos.copy(stations[0].pos);
      targetPos.z += 1.2 * (1 - scroll.hero);
      targetLook.copy(stations[0].look);
      // turn towards the golden planet and back again
      const glance = Math.sin(Math.PI * clamp01(scroll.pre));
      targetPos.lerp(pre.pos, glance);
      targetLook.lerp(pre.look, glance);
      return;
    }
    const k = Math.min(Math.floor(s), n);
    const e = smoother(s - k);
    targetPos.lerpVectors(stations[k].pos, stations[k + 1].pos, e);
    targetLook.lerpVectors(stations[k].look, stations[k + 1].look, e);
  }

  function tick() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1);
    const t = timer.getElapsed();

    computeTarget();
    const damp = 1 - Math.exp(-dt * 3.5);
    camPos.lerp(targetPos, damp);
    camLook.lerp(targetLook, damp);
    pointerSmooth.x += (pointer.x - pointerSmooth.x) * damp;
    pointerSmooth.y += (pointer.y - pointerSmooth.y) * damp;
    camera.position.set(camPos.x + pointerSmooth.x * 0.22, camPos.y - pointerSmooth.y * 0.14, camPos.z);
    camera.lookAt(camLook);

    // Rings: grow in on intro, drift up & fade as the hero scrolls away
    const intro = introStart < 0 ? 0 : clamp01((t - introStart) / 1.8);
    const introEase = 1 - Math.pow(1 - intro, 3);
    const fade = 1 - clamp01(scroll.hero * 1.35);
    const ringAlpha = introEase * fade;
    rings.visible = ringAlpha > 0.01;
    if (rings.visible) {
      rings.position.y = ringBase.y + scroll.hero * 1.4 + Math.sin(t * 0.9) * 0.05;
      rings.scale.setScalar(Math.max(0.0001, ringBase.scale * (0.6 + 0.4 * introEase)));
      spin.rotation.y = t * 0.35;
      spin.rotation.x = Math.sin(t * 0.5) * 0.12;
      ringMat.opacity = ringAlpha;
      gemMat.opacity = ringAlpha;
      haloMat.opacity = 0.4 * ringAlpha;
    }

    // Frames only exist once the story begins, and each one emerges from the
    // dark as the camera approaches it (so the next photo never sits behind the text)
    const storyAlpha = clamp01(scroll.story * (frames.length + 1) * 3);
    for (const f of frames) {
      const ahead = camera.position.z - f.group.position.z;
      const alpha = storyAlpha * (1 - THREE.MathUtils.smoothstep(ahead, 5.5, 9.5));
      f.group.visible = alpha > 0.01;
      f.photoMat.opacity = alpha;
      f.border.material.opacity = alpha;
      f.glow.material.opacity = 0.32 * alpha;
      f.group.position.y = f.baseY + Math.sin(t * 0.8 + f.index * 1.7) * 0.04;
    }

    for (const p of planets) p.update(dt, camera);
    galaxy.update(dt);
    const near = smoother(clamp01(scroll.outro));
    galaxy.material.uniforms.uOpacity.value = 0.3 + 0.7 * near;
    nebulae.forEach((s, i) => (s.material.opacity = (i === 2 ? 0.22 : 0.1) * (0.25 + 0.75 * near)));

    stars.material.uniforms.uTime.value = t;
    stars.points.rotation.z = t * 0.004;

    renderer.render(scene, camera);

    // Adaptive quality: drop resolution if the device struggles
    if (perfFrames < 150) {
      perfFrames++;
      perfTime += dt;
      if (perfFrames === 150 && perfTime / 150 > 1 / 38 && maxDpr > 1) {
        maxDpr = 1;
        renderer.setPixelRatio(1);
        resize();
      }
    }
  }

  timer.connect(document);
  renderer.setAnimationLoop(tick);

  return {
    intro() {
      introStart = timer.getElapsed();
    },
  };
}

function createStars(count, pixelRatio) {
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const tint = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let x = (Math.random() - 0.5) * 60;
    let y = (Math.random() - 0.5) * 40;
    // keep the corridor's centre a little clearer so photos stay readable
    if (Math.abs(x) < 2.4 && Math.abs(y) < 1.8) x += Math.sign(x || 1) * 2.4;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = 16 - Math.random() * 150;
    size[i] = Math.random() < 0.07 ? 3 + Math.random() * 3 : 1 + Math.random() * 1.6;
    phase[i] = Math.random() * Math.PI * 2;
    tint[i] = Math.random() < 0.28 ? 1 : 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute float aTint;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vTint;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 0.25) + aPhase);
        vAlpha = twinkle * smoothstep(110.0, 25.0, depth) * smoothstep(0.3, 2.5, depth);
        vTint = aTint;
        gl_PointSize = clamp(aSize * uPixelRatio * (16.0 / max(depth, 0.001)), 0.0, 26.0 * uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vTint;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        vec3 col = mix(vec3(0.9, 0.94, 1.0), vec3(1.0, 0.83, 0.52), vTint);
        gl_FragColor = vec4(col, a * vAlpha);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return { points, material };
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
