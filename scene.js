import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const DAY = {
  grass: 0xa9d8b8, earth1: 0xa97e5c, earth2: 0x8a6046, earth3: 0x6b4a38,
  wall: 0xf6edd8, roof: 0xde8c60, trunk: 0x9c6b4f, soil: 0x8a6647,
  stone: 0xeadcc5, foliage: 0x85c295, foliage2: 0x79b78a, brass: 0xc9a06b,
  rocket: 0xf6f1e6, coral: 0xe89a72, cloud: 0xfaf1e6, cat: 0xf8f4ec,
  lid: 0xefe3c8, carrot: 0xe08d5f
};

const NIGHT = {
  grass: 0x5e8a74, earth1: 0x6e5a64, earth2: 0x594a56, earth3: 0x463c48,
  wall: 0xb9bbd8, roof: 0x9a6b76, trunk: 0x5e4a54, soil: 0x5c4a50,
  stone: 0x9fa0bc, foliage: 0x4e7d68, foliage2: 0x477362, brass: 0x8a7b90,
  rocket: 0xb9bbda, coral: 0xb3768a, cloud: 0xc9cbe8, cat: 0xc9cbec,
  lid: 0xa9abd0, carrot: 0xb3768a
};

const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
const easeInQuad = (u) => u * u;
const easeOutQuad = (u) => 1 - (1 - u) * (1 - u);
const easeInOut = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createScene(canvas, opts = {}) {
  const reduced = !!opts.reducedMotion;
  const instant = !!opts.instant;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    throw new Error("WebGL unavailable");
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);

  const hemi = new THREE.HemisphereLight(0xfff2e0, 0xc9a27a, 1.05);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(amb);
  const sun = new THREE.DirectionalLight(0xffe8c8, 1.6);
  sun.position.set(6, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6.5;
  sun.shadow.camera.right = 6.5;
  sun.shadow.camera.top = 6.5;
  sun.shadow.camera.bottom = -6.5;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const LIGHT_DAY = {
    hemiSky: new THREE.Color(0xfff2e0), hemiGround: new THREE.Color(0xc9a27a),
    sunColor: new THREE.Color(0xffe8c8), sunPos: new THREE.Vector3(6, 9, 4)
  };
  const LIGHT_NIGHT = {
    hemiSky: new THREE.Color(0x8f97d8), hemiGround: new THREE.Color(0x3a4060),
    sunColor: new THREE.Color(0xaeb8f0), sunPos: new THREE.Vector3(-5, 8, -2)
  };

  const mats = {};
  const matPairs = [];
  function mat(key, extra = {}) {
    if (mats[key]) return mats[key];
    const m = new THREE.MeshStandardMaterial({
      color: DAY[key], roughness: 0.9, metalness: 0, ...extra
    });
    matPairs.push({ m, d: new THREE.Color(DAY[key]), n: new THREE.Color(NIGHT[key]) });
    mats[key] = m;
    return m;
  }

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffe9b0, emissive: 0xffd98a, emissiveIntensity: 0.35, roughness: 0.6
  });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb25e, transparent: true, opacity: 0.95 });

  const island = new THREE.Group();
  scene.add(island);
  const occluders = [];

  function mesh(geo, material, x = 0, y = 0, z = 0, parent = island) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const grass = mesh(new THREE.CylinderGeometry(3.2, 3.35, 0.55, 28), mat("grass"), 0, -0.275, 0);
  occluders.push(grass);
  const band1 = mesh(new THREE.CylinderGeometry(3.18, 2.92, 0.85, 28), mat("earth1"), 0, -0.975, 0);
  const band2 = mesh(new THREE.CylinderGeometry(2.88, 2.4, 0.95, 28), mat("earth2"), 0, -1.875, 0);
  const band3 = mesh(new THREE.CylinderGeometry(2.36, 1.55, 0.95, 28), mat("earth3"), 0, -2.825, 0);
  const tip = mesh(new THREE.ConeGeometry(1.5, 1.9, 24), mat("earth3"), 0, -4.25, 0);
  tip.rotation.x = Math.PI;
  occluders.push(band1, band2, tip);

  const house = new THREE.Group();
  house.position.set(0.35, 0, -0.55);
  house.rotation.y = -0.35;
  island.add(house);
  const houseBase = mesh(new THREE.BoxGeometry(1.5, 1.05, 1.25), mat("wall"), 0, 0.525, 0, house);
  const roof = mesh(new THREE.ConeGeometry(1.25, 0.9, 4), mat("roof"), 0, 1.475, 0, house);
  roof.rotation.y = Math.PI / 4;
  occluders.push(houseBase, roof);
  const door = mesh(new THREE.BoxGeometry(0.36, 0.58, 0.07), mat("trunk"), 0, 0.29, 0.66, house);
  door.castShadow = false;
  const win1 = mesh(new THREE.CircleGeometry(0.13, 20), glowMat, -0.42, 0.62, 0.665, house);
  const win2 = mesh(new THREE.CircleGeometry(0.13, 20), glowMat, 0.42, 0.62, 0.665, house);
  const win3 = mesh(new THREE.CircleGeometry(0.13, 20), glowMat, 0.765, 0.62, 0, house);
  win3.rotation.y = Math.PI / 2;
  win1.castShadow = win2.castShadow = win3.castShadow = false;
  mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), mat("roof"), 0.26, 1.52, -0.26, house);

  const tree = new THREE.Group();
  tree.position.set(-1.85, 0, -0.55);
  island.add(tree);
  const trunk = mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.75, 10), mat("trunk"), 0, 0.375, 0, tree);
  occluders.push(trunk);
  const fol1 = mesh(new THREE.SphereGeometry(0.62, 18, 14), mat("foliage"), 0, 1.15, 0, tree);
  const fol2 = mesh(new THREE.SphereGeometry(0.48, 16, 12), mat("foliage2"), -0.28, 0.92, 0.12, tree);
  const fol3 = mesh(new THREE.SphereGeometry(0.44, 16, 12), mat("foliage2"), 0.26, 0.98, -0.1, tree);
  const fol4 = mesh(new THREE.SphereGeometry(0.36, 14, 10), mat("foliage"), 0.05, 1.52, 0.08, tree);
  occluders.push(fol1);

  const garden = new THREE.Group();
  garden.position.set(-1.5, 0, 1.2);
  garden.rotation.y = 0.25;
  island.add(garden);
  const soil = mesh(new THREE.BoxGeometry(1.2, 0.14, 0.85), mat("soil"), 0, 0.07, 0, garden);
  occluders.push(soil);
  const carrotGeo = new THREE.ConeGeometry(0.06, 0.2, 8);
  const topGeo = new THREE.SphereGeometry(0.05, 8, 6);
  [[-0.38, -0.18], [-0.05, -0.18], [0.3, -0.18], [-0.22, -0.02]].forEach(([x, z]) => {
    mesh(carrotGeo, mat("carrot"), x, 0.24, z, garden);
    mesh(topGeo, mat("foliage2"), x, 0.35, z, garden);
  });
  const cabGeo = new THREE.SphereGeometry(0.09, 10, 8);
  [[-0.3, 0.15], [0.05, 0.15], [0.38, 0.15], [0.2, 0.02]].forEach(([x, z]) => {
    mesh(cabGeo, mat("foliage"), x, 0.2, z, garden);
  });

  const padX = 1.4, padZ = 1.15;
  const pad = mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 18), mat("stone"), padX, 0.05, padZ);
  occluders.push(pad);
  const rocket = new THREE.Group();
  rocket.position.set(padX, 0.1, padZ);
  island.add(rocket);
  const rbody = mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.85, 20), mat("rocket"), 0, 0.55, 0, rocket);
  const nose = mesh(new THREE.ConeGeometry(0.25, 0.5, 20), mat("coral"), 0, 1.22, 0, rocket);
  occluders.push(rbody, nose);
  const portholeRing = mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 16), mat("coral"), 0, 0.62, 0.26, rocket);
  const rwin = mesh(new THREE.CircleGeometry(0.075, 16), glowMat, 0, 0.62, 0.265, rocket);
  portholeRing.castShadow = rwin.castShadow = false;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = mesh(new THREE.BoxGeometry(0.05, 0.42, 0.24), mat("coral"),
      Math.sin(a) * 0.3, 0.26, Math.cos(a) * 0.3, rocket);
    fin.rotation.y = a;
  }
  const flame = mesh(new THREE.ConeGeometry(0.15, 0.55, 12), flameMat, 0, -0.18, 0, rocket);
  flame.rotation.x = Math.PI;
  flame.visible = false;
  flame.castShadow = false;

  const scope = new THREE.Group();
  scope.position.set(2.05, 0, -0.4);
  scope.rotation.y = -0.5;
  scope.scale.setScalar(0.9);
  island.add(scope);
  const top = new THREE.Vector3(0, 0.75, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const foot = new THREE.Vector3(Math.sin(a) * 0.24, 0, Math.cos(a) * 0.24);
    const dir = top.clone().sub(foot);
    const len = dir.length();
    const leg = mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 6), mat("brass"),
      (top.x + foot.x) / 2, (top.y + foot.y) / 2, (top.z + foot.z) / 2, scope);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }
  const tubeGroup = new THREE.Group();
  tubeGroup.position.set(0, 0.78, 0);
  tubeGroup.rotation.x = -0.75;
  scope.add(tubeGroup);
  mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.62, 12), mat("brass"), 0, 0.26, 0, tubeGroup);
  mesh(new THREE.BoxGeometry(0.09, 0.07, 0.07), mat("trunk"), 0, -0.04, 0, tubeGroup);

  const cat = new THREE.Group();
  cat.position.set(0.05, 2.02, 0.1);
  house.add(cat);
  const catBody = mesh(new THREE.SphereGeometry(0.21, 16, 12), mat("cat"), 0, 0, 0, cat);
  catBody.scale.set(1.15, 0.68, 1.35);
  const catHead = mesh(new THREE.SphereGeometry(0.16, 14, 10), mat("cat"), 0, 0.17, 0.26, cat);
  const earGeo = new THREE.ConeGeometry(0.06, 0.11, 4);
  mesh(earGeo, mat("cat"), -0.075, 0.33, 0.26, cat);
  mesh(earGeo, mat("cat"), 0.075, 0.33, 0.26, cat);
  const tail = mesh(new THREE.TorusGeometry(0.17, 0.038, 8, 20, Math.PI * 1.35), mat("cat"),
    0.02, -0.1, 0.3, cat);
  tail.rotation.x = -Math.PI / 2 + 0.12;
  const TAIL_BASE = 2.4;
  tail.rotation.z = TAIL_BASE;
  occluders.push(catBody);

  const box = new THREE.Group();
  box.position.set(-0.4, 0, 1.95);
  box.rotation.y = 0.4;
  island.add(box);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 8), mat("trunk"), 0, 0.26, 0, box);
  const mbox = mesh(new THREE.BoxGeometry(0.36, 0.24, 0.22), mat("wall"), 0, 0.62, 0, box);
  const lid = mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.38, 12, 1, false, 0, Math.PI),
    mat("lid"), 0, 0.74, 0, box
  );
  lid.rotation.z = Math.PI / 2;
  occluders.push(mbox);
  const flag = new THREE.Group();
  flag.position.set(0.19, 0.68, 0);
  box.add(flag);
  mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), mat("coral"), 0, 0.08, 0, flag);
  mesh(new THREE.BoxGeometry(0.1, 0.07, 0.02), mat("coral"), 0.045, 0.13, 0, flag);

  const stoneGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.05, 8);
  [[0.15, 0.55], [-0.1, 1.0], [0.5, 1.35], [-0.02, 1.68], [0.85, 1.0]].forEach(([x, z]) => {
    const s = mesh(stoneGeo, mat("stone"), x, 0.025, z);
    s.castShadow = false;
    s.rotation.y = x * 3.1;
  });

  const cloudMat = new THREE.MeshStandardMaterial({
    color: DAY.cloud, roughness: 1, metalness: 0, transparent: true, opacity: 0.94
  });
  const cloudNight = new THREE.Color(NIGHT.cloud);
  const cloudDay = new THREE.Color(DAY.cloud);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const gctx = glowCanvas.getContext("2d");
  const gGrad = gctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gGrad.addColorStop(0, "rgba(255,240,190,1)");
  gGrad.addColorStop(0.45, "rgba(255,225,150,0.55)");
  gGrad.addColorStop(1, "rgba(255,215,120,0)");
  gctx.fillStyle = gGrad;
  gctx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowCanvas);

  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 320; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random() * 0.85);
    const r = 40 + Math.random() * 6;
    starPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 2, r * Math.sin(ph) * Math.sin(th));
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xfff7e0, size: 0.14, transparent: true, opacity: 0 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  const ffGeo = new THREE.BufferGeometry();
  const ffPos = [];
  for (let i = 0; i < 26; i++) {
    ffPos.push(-2.6 + Math.random() * 5.2, 0.25 + Math.random() * 1.25, -1.6 + Math.random() * 3.8);
  }
  ffGeo.setAttribute("position", new THREE.Float32BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({
    map: glowTex, color: 0xffe9a8, size: 0.22, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  scene.add(fireflies);

  const smokeGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const smokePool = [];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(smokeGeo, cloudMat.clone());
    m.visible = false;
    m.castShadow = false;
    scene.add(m);
    smokePool.push({ m, life: 0, dur: 1, vel: new THREE.Vector3(), grow: 1 });
  }
  function puff(pos, vel, dur, grow) {
    const p = smokePool.find((s) => s.life <= 0);
    if (!p) return;
    p.life = dur;
    p.dur = dur;
    p.vel.copy(vel);
    p.grow = grow;
    p.m.position.copy(pos);
    p.m.scale.setScalar(0.5);
    p.m.visible = true;
  }

  const heartCanvas = document.createElement("canvas");
  heartCanvas.width = heartCanvas.height = 64;
  const hctx = heartCanvas.getContext("2d");
  hctx.fillStyle = "#e89a72";
  hctx.beginPath();
  hctx.moveTo(32, 56);
  hctx.bezierCurveTo(6, 36, 8, 12, 24, 12);
  hctx.bezierCurveTo(30, 12, 32, 18, 32, 22);
  hctx.bezierCurveTo(32, 18, 34, 12, 40, 12);
  hctx.bezierCurveTo(56, 12, 58, 36, 32, 56);
  hctx.fill();
  const heartTex = new THREE.CanvasTexture(heartCanvas);
  const heartPool = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }));
    s.visible = false;
    scene.add(s);
    heartPool.push({ s, life: 0 });
  }
  function heart(pos) {
    const h = heartPool.find((p) => p.life <= 0);
    if (!h) return;
    h.life = 1.3;
    h.s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.1, (Math.random() - 0.5) * 0.3));
    h.s.scale.setScalar(0.28);
    h.s.visible = true;
  }

  const anchors = {
    house: new THREE.Vector3(0.6, 0.75, 0.05),
    garden: new THREE.Vector3(-1.5, 0.8, 1.2),
    mailbox: new THREE.Vector3(-0.4, 1.25, 1.95),
    rocket: new THREE.Vector3(padX, 1.7, padZ),
    cat: new THREE.Vector3(0.42, 2.32, -0.44),
    count: new THREE.Vector3(padX + 1.3, 3.1, padZ - 0.4)
  };
  const occludedIds = new Set(["house", "garden", "mailbox", "rocket", "cat"]);

  const camTarget = new THREE.Vector3(0, 0.15, 0);
  let az = 0.95, pol = 1.06, azTarget = 0.55, polTarget = 1.02;
  if (instant) {
    az = azTarget;
    pol = polTarget;
  }
  let azVel = 0, polVel = 0;
  let radius = 12;
  function fitRadius() {
    const a = window.innerWidth / Math.max(1, window.innerHeight);
    radius = a >= 1 ? 15.5 : Math.min(30, 17 * (0.95 / a));
  }
  fitRadius();

  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    azVel = polVel = 0;
    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    azTarget = clamp(azTarget + dx * 0.005, -0.65, 0.65);
    polTarget = clamp(polTarget + dy * 0.004, 0.86, 1.24);
    azVel = dx * 0.005;
    polVel = dy * 0.004;
  });
  const endDrag = () => {
    dragging = false;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  let nightT = 0, nightTarget = 0;
  function applyNight(v) {
    for (const p of matPairs) p.m.color.lerpColors(p.d, p.n, v);
    hemi.color.lerpColors(LIGHT_DAY.hemiSky, LIGHT_NIGHT.hemiSky, v);
    hemi.groundColor.lerpColors(LIGHT_DAY.hemiGround, LIGHT_NIGHT.hemiGround, v);
    hemi.intensity = 1.05 + (0.45 - 1.05) * v;
    amb.intensity = 0.25 + (0.18 - 0.25) * v;
    sun.color.lerpColors(LIGHT_DAY.sunColor, LIGHT_NIGHT.sunColor, v);
    sun.position.lerpVectors(LIGHT_DAY.sunPos, LIGHT_NIGHT.sunPos, v);
    sun.intensity = 1.6 + (0.55 - 1.6) * v;
    glowMat.emissiveIntensity = 0.35 + 1.05 * v;
    starMat.opacity = v * 0.9;
  }

  const rocketRest = new THREE.Vector3(padX, 0.1, padZ);
  let rocketPhase = "idle", rocketT = 0, lastCountText = "";
  let orbitStart = new THREE.Vector3();
  const DUR = reduced
    ? { count: 1.0, ascent: 0.6, orbit: 1.6, descent: 0.7, land: 0.2 }
    : { count: 3.0, ascent: 1.6, orbit: 4.6, descent: 1.9, land: 0.35 };

  function startLaunch() {
    if (rocketPhase !== "idle") return;
    rocketPhase = "count";
    rocketT = 0;
    lastCountText = "";
    emit({ type: "rocket", flying: true });
  }

  function updateRocket(dt, t) {
    if (rocketPhase === "idle") {
      rocket.position.copy(rocketRest);
      rocket.rotation.set(0, 0, 0);
      rocket.scale.set(1, 1, 1);
      return;
    }
    rocketT += dt;
    flame.visible = rocketPhase !== "count";
    if (flame.visible) flame.scale.y = 1 + Math.sin(t * 40) * 0.25;

    if (rocketPhase === "count") {
      const txt = rocketT < 0.8 ? "3" : rocketT < 1.6 ? "2" : rocketT < 2.4 ? "1" : "LIFTOFF!";
      if (txt !== lastCountText) {
        lastCountText = txt;
        emit({ type: "count", text: txt });
        emit({ type: "status", text: txt === "LIFTOFF!" ? "Liftoff!" : txt });
      }
      if (!reduced && Math.random() < 0.35) {
        const p = island.localToWorld(new THREE.Vector3(padX + (Math.random() - 0.5) * 0.8, 0.2, padZ + (Math.random() - 0.5) * 0.8));
        puff(p, new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4), 0.9, 2.2);
      }
      if (rocketT >= DUR.count) {
        rocketPhase = "ascent";
        rocketT = 0;
      }
    } else if (rocketPhase === "ascent") {
      const u = easeInQuad(Math.min(1, rocketT / DUR.ascent));
      rocket.position.set(padX, 0.1 + u * 5.6, padZ);
      rocket.rotation.z = u * 0.12;
      if (!reduced && Math.random() < 0.5) {
        const p = island.localToWorld(new THREE.Vector3(rocket.position.x, rocket.position.y - 0.3, rocket.position.z));
        puff(p, new THREE.Vector3((Math.random() - 0.5) * 0.3, -0.3, (Math.random() - 0.5) * 0.3), 0.7, 1.8);
      }
      if (rocketT >= DUR.ascent) {
        rocketPhase = "orbit";
        rocketT = 0;
        orbitStart.copy(rocket.position);
      }
    } else if (rocketPhase === "orbit") {
      const u = Math.min(1, rocketT / DUR.orbit);
      const th0 = Math.atan2(padZ, padX);
      const th = th0 + u * Math.PI * 2;
      const r = 5.9;
      rocket.position.set(Math.cos(th) * r, 5.6 - u * 0.8, Math.sin(th) * r);
      rocket.rotation.z = 0.08;
      if (rocketT >= DUR.orbit) {
        rocketPhase = "descent";
        rocketT = 0;
        orbitStart.copy(rocket.position);
      }
    } else if (rocketPhase === "descent") {
      const u = easeInOut(Math.min(1, rocketT / DUR.descent));
      const p0 = orbitStart;
      const p2 = new THREE.Vector3(padX, 1.1, padZ);
      const p1 = new THREE.Vector3((p0.x + p2.x) / 2, p0.y + 1.4, (p0.z + p2.z) / 2);
      const a = p0.clone().lerp(p1, u);
      const b = p1.clone().lerp(p2, u);
      rocket.position.copy(a.lerp(b, u));
      rocket.rotation.z = 0.08 * (1 - u);
      if (rocketT >= DUR.descent) {
        rocketPhase = "land";
        rocketT = 0;
      }
    } else if (rocketPhase === "land") {
      const u = easeInQuad(Math.min(1, rocketT / DUR.land));
      rocket.position.set(padX, 1.1 - (1.0 * u), padZ);
      if (rocketT >= DUR.land) {
        rocketPhase = "idle";
        flame.visible = false;
        emit({ type: "count", text: "" });
        emit({ type: "status", text: "Home again." });
        emit({ type: "rocket", flying: false });
        for (let i = 0; i < 8; i++) {
          const p = island.localToWorld(new THREE.Vector3(padX + (Math.random() - 0.5) * 0.9, 0.2, padZ + (Math.random() - 0.5) * 0.9));
          puff(p, new THREE.Vector3((Math.random() - 0.5) * 0.9, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.9), 1.0, 2.4);
        }
      }
    }
  }

  let catCool = 0, catPulseT = 1;
  function petCat() {
    if (catCool > 0) return;
    catCool = 1.2;
    catPulseT = 0;
    const p = cat.getWorldPosition(new THREE.Vector3());
    heart(p);
    setTimeout(() => heart(p), 180);
    setTimeout(() => heart(p), 360);
    emit({ type: "status", text: "purr purr" });
  }

  let flagTarget = 0;
  function setMailboxFlag(open) {
    flagTarget = open ? 1.15 : 0;
  }

  let entranceT = reduced || instant ? 1 : 0;
  let readyEmitted = false;
  let chimneyClock = 0;
  let running = false;
  let frameId = 0;
  let lastTs = 0;
  let eventCb = null, hotspotCb = null;
  const raycaster = new THREE.Raycaster();
  const worldV = new THREE.Vector3();
  const rayDir = new THREE.Vector3();

  function emit(e) {
    if (eventCb) eventCb(e);
  }

  function frame(ts) {
    if (!running) return;
    frameId = requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    const t = ts / 1000;

    if (entranceT < 1) {
      entranceT = Math.min(1, entranceT + dt / 0.9);
      const e = easeOutCubic(entranceT);
      island.scale.setScalar(0.6 + 0.4 * e);
    } else if (!readyEmitted) {
      readyEmitted = true;
      island.scale.setScalar(1);
      emit({ type: "ready" });
    }

    island.position.y = reduced ? 0 : Math.sin(t * 0.6) * 0.12;

    chimneyClock += dt;
    if (!reduced && chimneyClock > 1.7) {
      chimneyClock = 0;
      const p = house.localToWorld(new THREE.Vector3(0.26, 1.95, -0.26));
      puff(p, new THREE.Vector3(0.1, 0.45, 0.05), 1.5, 1.6);
    }
    for (const p of smokePool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      const u = 1 - p.life / p.dur;
      p.m.position.addScaledVector(p.vel, dt);
      p.m.scale.setScalar(0.5 + u * p.grow);
      p.m.material.opacity = (1 - u) * 0.7;
      if (p.life <= 0) p.m.visible = false;
    }

    for (const h of heartPool) {
      if (h.life <= 0) continue;
      h.life -= dt;
      h.s.position.y += dt * 0.9;
      const u = 1 - h.life / 1.3;
      h.s.scale.setScalar(0.28 + u * 0.18);
      h.s.material.opacity = 1 - u;
      if (h.life <= 0) h.s.visible = false;
    }

    if (catCool > 0) catCool -= dt;
    if (catPulseT < 1) {
      catPulseT = Math.min(1, catPulseT + dt / 0.5);
      cat.scale.setScalar(1 + Math.sin(Math.PI * catPulseT) * 0.12);
    }
    tail.rotation.z = TAIL_BASE + Math.sin(t * 1.4) * 0.12;
    tubeGroup.rotation.y = Math.sin(t * 0.3) * 0.15;

    flag.rotation.z += (flagTarget - flag.rotation.z) * Math.min(1, dt * 8);

    if (Math.abs(nightTarget - nightT) > 0.0005) {
      nightT += (nightTarget - nightT) * Math.min(1, dt * 3.2);
      applyNight(nightT);
      emit({ type: "night", v: nightT });
    }
    ffMat.opacity = nightT * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1)));

    updateRocket(dt, t);

    if (!dragging) {
      azTarget = clamp(azTarget + azVel, -0.65, 0.65);
      polTarget = clamp(polTarget + polVel, 0.86, 1.24);
      azVel *= Math.exp(-dt * 3);
      polVel *= Math.exp(-dt * 3);
    }
    az += (azTarget - az) * Math.min(1, dt * 8);
    pol += (polTarget - pol) * Math.min(1, dt * 8);
    camera.position.set(
      camTarget.x + radius * Math.sin(pol) * Math.sin(az),
      camTarget.y + radius * Math.cos(pol),
      camTarget.z + radius * Math.sin(pol) * Math.cos(az)
    );
    camera.lookAt(camTarget);

    if (hotspotCb) {
      const w = window.innerWidth, h = window.innerHeight;
      const list = [];
      for (const [id, anchor] of Object.entries(anchors)) {
        worldV.copy(anchor);
        island.localToWorld(worldV);
        rayDir.copy(worldV).sub(camera.position);
        const dist = rayDir.length();
        const ndc = worldV.project(camera);
        const behind = ndc.z > 1;
        const x = (ndc.x + 1) / 2 * w;
        const y = (1 - ndc.y) / 2 * h;
        let occ = false;
        if (occludedIds.has(id)) {
          raycaster.set(camera.position, rayDir.normalize());
          const hits = raycaster.intersectObjects(occluders, false);
          occ = hits.length > 0 && hits[0].distance < dist - 0.3;
        }
        list.push({ id, x, y, occluded: occ, behind });
      }
      hotspotCb(list);
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    fitRadius();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frameId);
    } else if (!running) {
      running = true;
      lastTs = 0;
      frame(performance.now());
    }
  });

  applyNight(0);

  return {
    start() {
      if (running) return;
      running = true;
      frame(performance.now());
    },
    setNight(target, instant = false) {
      nightTarget = target ? 1 : 0;
      if (instant) {
        nightT = nightTarget;
        applyNight(nightT);
        emit({ type: "night", v: nightT });
      }
    },
    launch: startLaunch,
    petCat,
    setMailboxFlag,
    onEvent(cb) { eventCb = cb; },
    onHotspots(cb) { hotspotCb = cb; }
  };
}
