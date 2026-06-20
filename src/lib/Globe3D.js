// ---------------------------------------------------------------------------
// Globe3D: the cinematic scene. A 3D satellite orbits a stylized globe; the
// camera and the satellite's position along its orbit are driven by scroll
// progress (0..1), so the whole page is one continuous flight.
//
// Performance posture (continuous render, kept cheap):
//   - simple materials (Lambert / Basic / sprites), no shadows, no post stack
//   - DPR chosen once by a short benchmark, then fixed (no resolution popping)
//   - static objects get matrixAutoUpdate = false (skip per-frame matrix math)
//   - render loop pauses when the tab is hidden; dispose() frees GPU resources
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { createEarth } from "./earth.js";
import { createCommsSat, createCubeSat, createEOSat } from "./satelliteModel.js";
import { makeGlowTexture } from "./glow.js";

const smoothstep = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;

// Dynamic "dawn pass" camera move, one keyframe per section.
// [ radius, polar(from +Y), azimuth ]  (Earth stays centered)
const KEYS = [
  [4.1, 1.5, 0.2], // hero: wide establishing
  [3.0, 1.2, 1.0], // about: push in + rise
  [3.2, 1.66, 1.95], // projects: dip to skim the limb
  [4.4, 1.14, 3.0], // experience: pull back to reveal
  [2.7, 1.5, 3.8], // contact: close on the horizon
];

// Per-section orbital pass. Each section shows one craft sweeping across the
// frame from `entry` to `exit` (NDC, off-frame at the ends so swaps are hidden),
// at `depth` in front of the camera. The craft moves relative to Earth as it
// crosses, reading as an orbital pass; a new craft enters next section.
const SECTIONS = [
  { craft: "comms", entry: [1.35, 0.62], exit: [-1.35, 0.42], depth: 2.0 }, // hero
  { craft: "comms", entry: [-1.35, 0.72], exit: [1.1, 0.18], depth: 1.9 }, // about
  { craft: "cube", entry: [1.35, 0.6], exit: [-1.35, 0.5], depth: 1.7 }, // projects (close)
  { craft: "eo", entry: [-1.2, 0.62], exit: [1.2, 0.42], depth: 1.9 }, // experience
  { craft: "comms", entry: [-1.1, 0.5], exit: [1.35, 0.72], depth: 2.0 }, // contact (departs)
];

const EARTH_SPIN = Math.PI * 2 * 1.25; // ~1.25 turns of Earth across the page

// Sample a list of [a,b,c] keyframes at progress p with eased segments.
function sample(keys, p) {
  const segs = keys.length - 1;
  const t = Math.max(0, Math.min(1, p)) * segs;
  const i = Math.min(segs - 1, Math.floor(t));
  const f = smoothstep(t - i);
  const a = keys[i];
  const b = keys[i + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

// Freeze an object's local matrix: it never moves, so stop recomputing it.
function freeze(obj) {
  obj.updateMatrix();
  obj.matrixAutoUpdate = false;
}

export class Globe3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.progress = 0; // target scroll progress
    this.eased = 0; // damped progress actually rendered
    this.running = false;
    this._lastTime = null;
    // one-time DPR benchmark (avoids mid-scroll resolution popping)
    this._benchDone = false;
    this._benchAccum = 0;
    this._benchCount = 0;
    this._satV = new THREE.Vector3();
    this._sunDir = new THREE.Vector3(-4, 2, 3).normalize();
    this._sunLocal = new THREE.Vector3();
    this._quatInv = new THREE.Quaternion();

    this._tick = this._tick.bind(this);
    this._onResize = () => this.resize();
    this._onVisibility = () => (document.hidden ? this.stop() : this.start());

    this._initThree();
    this._build();
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibility);
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      stencil: false,
      powerPreference: "high-performance",
    });
    // Start at 1.0 and let the benchmark climb toward the cap if frame time
    // allows. On integrated GPUs a 1.5x full-screen framebuffer is the main cost.
    this._dprCap = Math.min(window.devicePixelRatio, 1.5);
    this._dpr = Math.min(this._dprCap, 1.0);
    this.renderer.setPixelRatio(this._dpr);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.resize();
  }

  _build() {
    // Dawn lighting: a warm "sun" key for a crisp terminator + a deep cool fill
    // so the shadow side reads cold against the warm lit limb.
    // (2 lights only: every extra light adds a per-fragment loop iteration.)
    const sun = new THREE.DirectionalLight(0xffdcb8, 3.1);
    sun.position.copy(this._sunDir);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x28374f, 0.65));

    // exponential fog: depth cueing + hides far-side detail (near free)
    this.scene.fog = new THREE.FogExp2(0x06070d, 0.16);

    // earth (tilted on its axis), with its static children frozen
    this.earth = createEarth({ radius: 1, glow: "#cfe0ea" });
    this.earth.rotation.z = 23.4 * (Math.PI / 180);
    this.earth.children.forEach(freeze);
    this.scene.add(this.earth);

    // One craft per section. All are added once; only the active one is shown.
    this.crafts = {
      comms: createCommsSat({ accent: "#ff6a3d" }),
      cube: createCubeSat({ accent: "#ff6a3d" }),
      eo: createEOSat({ accent: "#ff6a3d" }),
    };
    for (const k in this.crafts) {
      this.crafts[k].visible = false;
      this.scene.add(this.crafts[k]);
    }

    // Orbit trail: a tilted ring that draws progressively with scroll, paying
    // off as the "trajectory" in the Experience section.
    const M = 220;
    const tp = [];
    for (let i = 0; i <= M; i++) {
      const a = (i / M) * Math.PI * 2;
      tp.push(new THREE.Vector3(Math.cos(a) * 1.62, 0, Math.sin(a) * 1.62));
    }
    this.trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(tp),
      new THREE.LineBasicMaterial({ color: 0xff8a4d, transparent: true, opacity: 0.32 })
    );
    this.trail.rotation.x = 0.5;
    this.trail.geometry.setDrawRange(0, 2);
    this._trailMax = M + 1;
    freeze(this.trail);
    this.scene.add(this.trail);

    // parallax starfield (sparse; fog disabled so distant stars stay visible)
    const N = 360;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 26 + Math.random() * 18;
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      arr[i * 3] = r * s * Math.cos(th);
      arr[i * 3 + 1] = r * u;
      arr[i * 3 + 2] = r * s * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xcdd9ec,
        size: 0.13,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        fog: false,
        depthWrite: false,
      })
    );
    this.scene.add(this.stars);

    // Distant sun: a far halo + bright core in the sun's direction. depthTest
    // lets the Earth occlude it, so it flares at the limb instead of sitting on
    // the surface. fog disabled so the distance does not fog it away.
    const sunSprite = (color, dist, size, opacity) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(),
          color,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
          fog: false,
          opacity,
        })
      );
      s.position.copy(this._sunDir).multiplyScalar(dist);
      s.scale.setScalar(size);
      freeze(s);
      this.scene.add(s);
    };
    sunSprite(0xffd49a, 6, 2.6, 0.85); // soft warm halo
    sunSprite(0xfff2d6, 6, 0.95, 1.0); // bright core
  }

  setProgress(p) {
    this.progress = Math.max(0, Math.min(1, p));
  }

  _placeSatellite(p) {
    // Which section are we in, and how far across it (0..1)?
    const segs = SECTIONS.length;
    const fi = Math.min(segs - 1, Math.floor(p * segs));
    const localT = Math.min(1, Math.max(0, p * segs - fi));
    const cfg = SECTIONS[fi];

    // show only the active craft (others are off-frame at the swap anyway)
    for (const k in this.crafts) this.crafts[k].visible = k === cfg.craft;
    const sat = this.crafts[cfg.craft];

    // the craft crosses the frame entry -> exit (an orbital pass). Anchor is a
    // screen NDC unprojected to a world point at the section's depth.
    const ax = lerp(cfg.entry[0], cfg.exit[0], localT);
    const ay = lerp(cfg.entry[1], cfg.exit[1], localT);
    this._satV.set(ax, ay, 0.5).unproject(this.camera);
    this._satV.sub(this.camera.position).normalize().multiplyScalar(cfg.depth).add(this.camera.position);
    sat.position.copy(this._satV);
    // +Z (dish/instrument) points at Earth center: nadir-pointing bus
    sat.lookAt(0, 0, 0);
    // single-axis sun tracking for the solar wings (panel normal is local +Y)
    const wings = sat.userData.wings;
    if (wings) {
      this._sunLocal.copy(this._sunDir).applyQuaternion(this._quatInv.copy(sat.quaternion).invert());
      wings.rotation.x = Math.atan2(this._sunLocal.z, this._sunLocal.y);
    }
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // fat-line material needs the viewport resolution to size its pixels
    const cm = this.earth && this.earth.userData.coastMaterial;
    if (cm) cm.resolution.set(w, h);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop(this._tick);
  }

  stop() {
    this.running = false;
    this._lastTime = null; // avoid a stale multi-second dt on resume
    this.renderer.setAnimationLoop(null);
  }

  _tick(time) {
    const dt = this._lastTime != null ? time - this._lastTime : 16;
    this._lastTime = time;

    // One-time DPR benchmark: measure ~30 frames, pick a single pixel ratio,
    // then leave it fixed. No mid-scroll resolution popping.
    if (!this._benchDone) {
      this._benchCount++;
      if (this._benchCount > 5) this._benchAccum += dt; // skip warmup frames
      if (this._benchCount >= 35) {
        const avg = this._benchAccum / (this._benchCount - 5);
        const target = Math.min(this._dprCap, avg < 14 ? 1.5 : avg < 22 ? 1.25 : avg < 33 ? 1.0 : 0.75);
        if (target !== this._dpr) {
          this._dpr = target;
          this.renderer.setPixelRatio(target);
        }
        this._benchDone = true;
      }
    }

    // single damping stage (Lenis already smooths scroll, do not double filter)
    this.eased += (this.progress - this.eased) * 0.2;

    // camera from scroll keyframes + a subtle perpetual float (handheld feel)
    const [r, polar, az] = sample(KEYS, this.eased);
    const t = time * 0.001;
    const fAz = Math.sin(t * 0.17) * 0.03;
    const fPolar = Math.cos(t * 0.13) * 0.022;
    this.camera.position.set(
      r * Math.sin(polar + fPolar) * Math.cos(az + fAz),
      r * Math.cos(polar + fPolar),
      r * Math.sin(polar + fPolar) * Math.sin(az + fAz)
    );
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld(); // so the satellite anchor unproject is current

    // Earth rotation is driven by scroll so the surface streams beneath the
    // craft (reads as orbiting); a tiny time term keeps it alive when idle.
    this.earth.rotation.y = this.eased * EARTH_SPIN + time * 0.000015;
    this.stars.rotation.y += 0.00008;

    // orbit trail draws progressively with scroll
    this.trail.geometry.setDrawRange(0, Math.max(2, Math.floor(this.eased * this._trailMax)));

    this._placeSatellite(this.eased);

    this.renderer.render(this.scene, this.camera);
  }

  // Let the browser reclaim GPU memory: dispose geometries, materials, textures.
  dispose() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (m.map) m.map.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
  }
}
