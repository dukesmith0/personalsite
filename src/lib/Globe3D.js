// ---------------------------------------------------------------------------
// Globe3D — the cinematic scene. A 3D satellite orbits a stylized globe; the
// camera and the satellite's position along its orbit are driven by scroll
// progress (0..1), so the whole page is one continuous flight.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { createEarth } from "./earth.js";
import { createSatellite } from "./satelliteModel.js";

const smoothstep = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;

// One camera keyframe per content section. Spherical coords around the globe.
// [ radius, polar(from +Y), azimuth ]
const KEYS = [
  [3.6, 1.45, 0.4], // hero
  [3.0, 1.18, 1.5], // about
  [3.7, 1.55, 2.7], // projects
  [3.1, 0.98, 3.9], // experience
  [2.7, 1.4, 5.1], // contact
];

export class Globe3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.progress = 0; // target scroll progress
    this.eased = 0; // damped progress actually rendered
    this.running = false;
    this._dirty = true; // force the first frame (and re-renders after resize)
    this._ft = 0; // EMA of frame time for adaptive DPR
    this._lastTime = null;
    this._tick = this._tick.bind(this);
    this._initThree();
    this._build();
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Adaptive DPR: start at 1.0 and climb toward the cap only if frame time
    // allows. On integrated GPUs a 1.5x full-screen framebuffer is the main cost.
    this._dprCap = Math.min(window.devicePixelRatio, 1.5);
    this._dpr = Math.min(this._dprCap, 1.0);
    this.renderer.setPixelRatio(this._dpr);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.resize();
  }

  _build() {
    // lighting — a hard "sun" for a crisp terminator + soft cool fill.
    // (2 lights, not 3: every extra light adds a per-fragment loop iteration.)
    const sun = new THREE.DirectionalLight(0xfff4e8, 2.6);
    sun.position.set(-4, 2, 3);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x3a4a68, 0.9));

    // earth (tilted on its axis for a touch of realism)
    this.earth = createEarth({ radius: 1, glow: "#cfe0ea" });
    this.earth.rotation.z = 23.4 * (Math.PI / 180);
    this.scene.add(this.earth);

    // satellite + orbit
    this.sat = createSatellite({ accent: "#ff6a3d" });
    this.scene.add(this.sat);
    this.orbitRadius = 1.55;
    this.orbitTilt = 0.62;

    // faint orbit ring
    const ringPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * this.orbitRadius, 0, Math.sin(a) * this.orbitRadius));
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({ color: 0xff6a3d, transparent: true, opacity: 0.18 })
    );
    ring.rotation.x = this.orbitTilt;
    this.scene.add(ring);
    this.orbitGroup = ring;
  }

  setProgress(p) {
    this.progress = Math.max(0, Math.min(1, p));
  }

  _sampleCamera(p) {
    const segs = KEYS.length - 1;
    const t = p * segs;
    const i = Math.min(segs - 1, Math.floor(t));
    const f = smoothstep(t - i);
    const a = KEYS[i];
    const b = KEYS[i + 1];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }

  _placeSatellite(p) {
    const ang = p * Math.PI * 2 * 1.6 + 0.6; // ~1.6 orbits across the page
    // reuse cached vector/axis — no per-frame allocations (avoids GC jank)
    this._satV = this._satV || new THREE.Vector3();
    this._xAxis = this._xAxis || new THREE.Vector3(1, 0, 0);
    this._satV.set(Math.cos(ang) * this.orbitRadius, 0, Math.sin(ang) * this.orbitRadius).applyAxisAngle(this._xAxis, this.orbitTilt);
    this.sat.position.copy(this._satV);
    // keep the satellite oriented along its track, nadir toward Earth
    this.sat.lookAt(0, 0, 0);
    this.sat.rotateY(Math.PI / 2);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._dirty = true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop(this._tick);
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  _tick(time) {
    // damp toward target scroll progress for buttery motion
    this.eased += (this.progress - this.eased) * 0.08;
    const moving = Math.abs(this.progress - this.eased) > 1e-4;

    // ON-DEMAND: skip the GPU draw entirely when nothing is changing.
    // The loop keeps spinning (cheap JS) but the scene goes 0% GPU when idle.
    if (!moving && !this._dirty) {
      this._lastTime = time;
      return;
    }

    // adaptive DPR from a smoothed frame time — downscale on weak GPUs.
    if (this._lastTime != null) {
      const dt = time - this._lastTime;
      this._ft = this._ft ? this._ft * 0.9 + dt * 0.1 : dt;
      if (this._ft > 24 && this._dpr > 0.85) {
        this._dpr = Math.max(0.85, this._dpr - 0.25);
        this.renderer.setPixelRatio(this._dpr);
      } else if (this._ft < 13 && this._dpr < this._dprCap) {
        this._dpr = Math.min(this._dprCap, this._dpr + 0.25);
        this.renderer.setPixelRatio(this._dpr);
      }
    }
    this._lastTime = time;

    const [r, polar, az] = this._sampleCamera(this.eased);
    this.camera.position.set(
      r * Math.sin(polar) * Math.cos(az),
      r * Math.cos(polar),
      r * Math.sin(polar) * Math.sin(az)
    );
    this.camera.lookAt(0, 0, 0);

    // gentle spin only while the scene is active (scrolling) — keeps it alive
    // without pegging the GPU when the user stops.
    this.earth.rotation.y += 0.0009;
    this._placeSatellite(this.eased);

    this.renderer.render(this.scene, this.camera);
    this._dirty = false;
  }
}
