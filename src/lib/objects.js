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
  // remember each base opacity so the gallery flicker does not compound to zero
  flame.children.forEach((c) => {
    if (c.material) c.material.userData.base = c.material.opacity;
  });
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

const gold = (r = 0.25) => new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: r, metalness: 0.95 });

// James Webb: gold hex primary mirror, tiered diamond sunshield, secondary on a tripod.
export function createJWST() {
  const g = new THREE.Group();
  const hex = new THREE.CylinderGeometry(0.17, 0.17, 0.03, 6);
  const R = 2;
  const s = 0.31;
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) > R) continue;
      const seg = new THREE.Mesh(hex, gold());
      seg.rotation.x = Math.PI / 2;
      seg.position.set(s * 1.5 * q, s * Math.sqrt(3) * (r + q / 2), 0);
      g.add(seg);
    }
  }
  // tiered diamond sunshield behind/below
  for (let i = 0; i < 5; i++) {
    const layer = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 1.7),
      new THREE.MeshStandardMaterial({ color: 0xb6aecb, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    layer.rotation.x = -0.95;
    layer.rotation.z = Math.PI / 4;
    layer.position.set(0, -0.55 - i * 0.05, -0.5 - i * 0.13);
    g.add(layer);
  }
  // secondary mirror on a tripod
  const sec = new THREE.Mesh(new THREE.CircleGeometry(0.09, 18), gold(0.2));
  sec.position.z = 0.95;
  sec.rotation.y = Math.PI;
  g.add(sec);
  for (const dx of [-0.18, 0.18, 0]) {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 6), steel(0xaab0b8));
    boom.position.set(dx, dx === 0 ? -0.2 : 0.12, 0.48);
    boom.rotation.x = Math.PI / 2 + (dx === 0 ? -0.18 : 0.16);
    g.add(boom);
  }
  g.userData.spin = 0.3;
  return g;
}

// Voyager: big dish, decagonal bus, golden record, long magnetometer + RTG booms.
export function createVoyager() {
  const g = new THREE.Group();
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.28),
    new THREE.MeshStandardMaterial({ color: 0xeceff2, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })
  );
  dish.rotation.x = Math.PI;
  dish.position.z = 0.22;
  g.add(dish);
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 10), gold(0.4));
  bus.rotation.x = Math.PI / 2;
  g.add(bus);
  const rec = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), gold(0.2));
  rec.position.set(0.18, 0, 0);
  rec.rotation.y = Math.PI / 2;
  g.add(rec);
  const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 3.0, 6), steel(0x9aa0a8, 0.5, 0.6));
  mag.rotation.z = Math.PI / 2;
  mag.position.x = 1.5;
  g.add(mag);
  const sci = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 6), steel());
  sci.position.set(0.35, 0.55, 0);
  sci.rotation.z = -0.5;
  g.add(sci);
  for (let i = 0; i < 3; i++) {
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 12), black());
    rtg.position.set(-0.55 - i * 0.16, -0.45 - i * 0.1, 0);
    rtg.rotation.z = Math.PI / 2;
    g.add(rtg);
  }
  g.userData.spin = 0.3;
  return g;
}

// Solar sail: large thin reflective square on diagonal booms with a small bus.
export function createSolarSail() {
  const g = new THREE.Group();
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xcfd6e0, metalness: 0.9, roughness: 0.18, side: THREE.DoubleSide, emissive: 0x223047, emissiveIntensity: 0.25 })
  );
  g.add(sail);
  g.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6, 2.6, 4, 4)),
      new THREE.LineBasicMaterial({ color: 0x6f8bb0, transparent: true, opacity: 0.4 })
    )
  );
  for (const r of [Math.PI / 4, -Math.PI / 4]) {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.6, 8), steel(0x9aa0a8, 0.4, 0.7));
    boom.rotation.z = r;
    boom.position.z = -0.06;
    g.add(boom);
  }
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), steel(0xb0b6c0, 0.4, 0.8));
  bus.position.z = -0.12;
  g.add(bus);
  g.userData.spin = 0.22;
  return g;
}

// Space Shuttle orbiter: fuselage, delta wing, vertical tail (stylized silhouette).
export function createSpaceShuttle() {
  const g = new THREE.Group();
  const w = white();
  const k = black();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.5, 18), w);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 18), k);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.92;
  g.add(nose);

  // delta wing (triangle extruded thin), laid flat
  const shape = new THREE.Shape();
  shape.moveTo(0.55, 0);
  shape.lineTo(-0.7, 0.95);
  shape.lineTo(-0.7, -0.95);
  shape.closePath();
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }), w);
  wing.rotation.x = -Math.PI / 2;
  wing.position.set(-0.1, -0.12, 0);
  g.add(wing);

  // vertical tail
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.7, 0);
  tailShape.lineTo(-0.7, 0.42);
  tailShape.lineTo(-0.4, 0);
  tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ExtrudeGeometry(tailShape, { depth: 0.03, bevelEnabled: false }), w);
  tail.position.set(0, 0.08, -0.015);
  g.add(tail);

  g.userData.spin = 0.35;
  return g;
}
