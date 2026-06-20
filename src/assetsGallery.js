// ---------------------------------------------------------------------------
// /assets experiment gallery: a turntable row of stylized orbital objects on a
// reference grid, drag to orbit, scroll to zoom. A sandbox for trying object
// styles before promoting one into the main site.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import "./styles/assets.css";
import { createManholeCover, createJWST, createVoyager, createSolarSail } from "./lib/objects.js";
import { applyToon } from "./lib/styles.js";
import { loadModel, initLoader } from "./lib/loadModel.js";

const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// tone mapping so PBR glTF models look correct instead of dark/flat
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
initLoader(renderer); // enable KTX2 texture decoding

const scene = new THREE.Scene();
// environment so metallic surfaces actually reflect (otherwise they read black)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 1.5; // brighter reflections so metals read as metal

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 1.4, 12);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 24;

// lighting: warm key + cool fill + rim, plus soft ambient
const key = new THREE.DirectionalLight(0xffe7cf, 2.6);
key.position.set(-5, 6, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0x8fb4ff, 0.8);
fill.position.set(6, 1, 4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 1.2);
rim.position.set(0, 3, -8);
scene.add(rim);
scene.add(new THREE.AmbientLight(0x3a4256, 0.6));

// reference grid floor
const grid = new THREE.GridHelper(40, 40, 0x3a4566, 0x1a2030);
grid.position.y = -1.3;
grid.material.transparent = true;
grid.material.opacity = 0.5;
scene.add(grid);

// gallery items: real GLB models + a few procedural / styled experiments
const items = [
  { name: "Space Satellite", model: "/models/space_satellite.glb", fit: 2.0, y: 0 },
  { name: "Saturn V", model: "/models/saturn_v.glb", fit: 2.8, y: 0.3 },
  { name: "Sputnik 1", model: "/models/sputnik_1.glb", fit: 1.6, y: 0 },
  { name: "Space Shuttle", model: "/models/space_shuttle.glb", fit: 2.2, y: 0 },
  { name: "CubeSat", model: "/models/space_club_cubesat.glb", fit: 1.4, y: 0 },
  { name: "Manhole Cover", obj: createManholeCover(), y: -1.2 },
  { name: "James Webb", obj: createJWST(), y: 0 },
  { name: "Voyager", obj: createVoyager(), y: 0 },
  { name: "Solar Sail", obj: createSolarSail(), y: 0 },
  { name: "JWST / Toon", obj: applyToon(createJWST()), y: 0 },
];

const labelLayer = document.getElementById("labels");
const spacing = 3.6;
const cols = 5;
const rowGap = 4.0;
const startX = -((cols - 1) * spacing) / 2;

items.forEach((it, i) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  it.pos = new THREE.Vector3(startX + col * spacing, it.y, -row * rowGap);
  it.anchor = new THREE.Vector3();
  const el = document.createElement("div");
  el.className = "obj-label";
  el.textContent = it.name;
  labelLayer.appendChild(el);
  it.label = el;

  if (it.obj) {
    it.obj.position.copy(it.pos);
    scene.add(it.obj);
  } else if (it.model) {
    loadModel(it.model, { fit: it.fit })
      .then((obj) => {
        obj.position.copy(it.pos);
        scene.add(obj);
        it.obj = obj;
      })
      .catch((err) => console.error("Failed to load", it.model, err));
  }
});

// frame the whole grid
controls.target.set(0, -0.2, -rowGap / 2);
camera.position.set(0, 2.6, 13);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  for (const it of items) {
    if (!it.obj) {
      it.label.style.opacity = "0"; // not loaded yet
      continue;
    }
    it.obj.rotation.y += (it.obj.userData.spin ?? 0.3) * dt;

    // flame flicker for the booster
    const flame = it.obj.userData.flame;
    if (flame) {
      const f = 0.85 + 0.15 * Math.sin(t * 38) * Math.sin(t * 23) + 0.05 * Math.sin(t * 71);
      flame.scale.set(1, f, 1);
      flame.children.forEach((c) => {
        if (c.material) c.material.opacity = (c.material.userData?.base ?? c.material.opacity) * (0.8 + 0.2 * f);
      });
    }

    // project a label above each object
    it.anchor.copy(it.obj.position);
    it.anchor.y += 1.7;
    it.anchor.project(camera);
    const x = (it.anchor.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-it.anchor.y * 0.5 + 0.5) * window.innerHeight;
    it.label.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
    it.label.style.opacity = it.anchor.z < 1 ? "1" : "0";
  }

  controls.update();
  renderer.render(scene, camera);
});
