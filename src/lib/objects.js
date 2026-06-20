// ---------------------------------------------------------------------------
// Stylized orbital "objects" for the /assets experiment gallery. Each returns a
// THREE.Group centered near the origin. Animated parts are exposed on userData.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeGlowTexture } from "./glow.js";

const white = () => new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.55, metalness: 0.1 });
const black = () => new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6, metalness: 0.2 });
const steel = (c = 0xc8ccd2, r = 0.25, m = 0.95) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

// Saturn V style booster with an animated flame plume. ~3 units tall.
export function createSaturnV() {
  const g = new THREE.Group();
  const w = white();
  const k = black();

  const stack = (rb, rt, h, y, mat) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 32), mat);
    mesh.position.y = y;
    g.add(mesh);
    return y + h / 2;
  };

  let y = -0.6;
  y = stack(0.34, 0.34, 1.0, y + 0.5, w); // S-IC first stage
  // roll-pattern bands
  for (const by of [-0.35, 0.0, 0.35]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.08, 32), k);
    band.position.y = -0.1 + by;
    g.add(band);
  }
  y = stack(0.34, 0.28, 0.16, y + 0.08, k); // interstage
  y = stack(0.28, 0.28, 0.8, y + 0.4, w); // S-II
  y = stack(0.28, 0.2, 0.14, y + 0.07, k); // interstage
  y = stack(0.2, 0.2, 0.5, y + 0.25, w); // S-IVB
  // CSM cone + escape tower
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 24), steel(0xb8bcc4, 0.35, 0.8));
  cone.position.y = y + 0.17;
  g.add(cone);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), k);
  tower.position.y = y + 0.46;
  g.add(tower);

  // four fins at the base
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.22), w);
    const a = (i / 4) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.34, -0.5, Math.sin(a) * 0.34);
    fin.rotation.y = -a;
    g.add(fin);
  }

  // flame plume (animated): bright inner cone + orange outer + glow
  const flame = new THREE.Group();
  const inner = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.7, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  inner.rotation.x = Math.PI; // point down
  inner.position.y = -1.0;
  flame.add(inner);
  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 1.1, 22, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff7a2c, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  outer.rotation.x = Math.PI;
  outer.position.y = -1.2;
  flame.add(outer);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xffb060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.y = -0.75;
  glow.scale.setScalar(1.1);
  flame.add(glow);
  g.add(flame);

  g.userData.flame = flame;
  g.userData.spin = 0.25;
  return g;
}

// Sputnik 1: polished sphere with four swept-back antennas.
export function createSputnik() {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 48), steel(0xd6dae0, 0.12, 1.0));
  g.add(ball);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 1.4, 8), steel(0xaab0b8, 0.3, 0.9));
    ant.position.set(Math.cos(a) * 0.35, -0.45, Math.sin(a) * 0.35);
    ant.rotation.z = Math.cos(a) * 0.5;
    ant.rotation.x = -Math.sin(a) * 0.5;
    ant.rotation.y = -a;
    // sweep the antennas back and down
    ant.rotateX(2.5);
    g.add(ant);
  }
  g.userData.spin = 0.5;
  return g;
}

// The Operation Plumbbob "manhole cover", on a grid for scale reference, with a
// faint launch streak (the in-joke: reportedly the fastest man-made object).
export function createManholeCover() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.09, 48), steel(0x44474e, 0.55, 0.7));
  g.add(cover);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 12, 48), steel(0x3a3d44, 0.6, 0.6));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.045;
  g.add(rim);
  // radial grooves for that cast-iron look
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.03), steel(0x2f323a, 0.7, 0.5));
    groove.position.set(Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3);
    groove.rotation.y = -a;
    g.add(groove);
  }
  // launch streak
  const streak = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 3.0, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  streak.position.y = 1.4;
  g.add(streak);
  g.userData.spin = 0.15;
  return g;
}
