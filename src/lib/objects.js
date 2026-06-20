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

  // four triangular fins pointing radially outward
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.2);
  finShape.lineTo(0, -0.3);
  finShape.lineTo(0.28, -0.3);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.03, bevelEnabled: false });
  finGeo.translate(0, 0, -0.015);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo, w);
    fin.rotation.y = -(i / 4) * Math.PI * 2;
    fin.position.set(0, -0.5, 0);
    fin.translateX(0.32);
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
  // four antennas attached at the equator, swept ~20 degrees off the tangent
  // plane (i.e. nearly tangent, leaning slightly outward) and fanning down.
  const up = new THREE.Vector3(0, 1, 0);
  const antGeo = new THREE.CylinderGeometry(0.01, 0.004, 1.5, 8);
  antGeo.translate(0, 0.75, 0); // base at origin, extends +Y
  const s20 = Math.sin((20 * Math.PI) / 180);
  const c20 = Math.cos((20 * Math.PI) / 180);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    // 20deg outward (radial) + the rest along the downward tangent
    const dir = new THREE.Vector3(Math.cos(a) * s20, -c20, Math.sin(a) * s20).normalize();
    const ant = new THREE.Mesh(antGeo, steel(0xaab0b8, 0.3, 0.9));
    ant.quaternion.setFromUnitVectors(up, dir);
    ant.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); // on the equator
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
  const my = 0.5; // mirror raised above the shield

  // primary mirror: gold hex cluster
  const hex = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 6);
  const R = 2;
  const s = 0.29;
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) > R) continue;
      const seg = new THREE.Mesh(hex, gold());
      seg.rotation.x = Math.PI / 2;
      seg.position.set(s * 1.5 * q, my + s * Math.sqrt(3) * (r + q / 2), 0);
      g.add(seg);
    }
  }

  // bus directly under the mirror, with a mast tying mirror to shield
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.3), steel(0xbfa76a, 0.45, 0.8));
  bus.position.set(0, my - 0.5, -0.1);
  g.add(bus);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), steel(0xaab0b8));
  mast.position.set(0, my - 0.45, -0.04);
  g.add(mast);

  // tiered diamond sunshield fanned just under the bus (connected)
  for (let i = 0; i < 5; i++) {
    const layer = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xb6aecb, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    layer.rotation.x = -1.05;
    layer.rotation.z = Math.PI / 4;
    layer.position.set(0, my - 0.7 - i * 0.06, -0.2 - i * 0.12);
    g.add(layer);
  }

  // secondary mirror on a tripod in front of the primary
  const sec = new THREE.Mesh(new THREE.CircleGeometry(0.08, 18), gold(0.2));
  sec.position.set(0, my, 0.72);
  sec.rotation.y = Math.PI;
  g.add(sec);
  for (const dx of [-0.16, 0.16, 0]) {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 6), steel(0xaab0b8));
    boom.position.set(dx, my + (dx === 0 ? -0.12 : 0.1), 0.38);
    boom.rotation.x = Math.PI / 2 + (dx === 0 ? -0.2 : 0.18);
    g.add(boom);
  }
  g.userData.spin = 0.3;
  return g;
}

// Voyager: big dish, decagonal bus, golden record, long magnetometer + RTG booms.
export function createVoyager() {
  const g = new THREE.Group();

  // ten-sided drum bus
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 10), gold(0.4));
  g.add(bus);
  // golden record on a bus face
  const rec = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), gold(0.18));
  rec.position.z = 0.24;
  g.add(rec);

  // big white dish on top, mouth opening up, with feed mast + subreflector
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.32),
    new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide })
  );
  dish.rotation.x = Math.PI; // concave opens upward
  dish.position.y = 0.5;
  g.add(dish);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), steel(0xaab0b8));
  mast.position.y = 0.62;
  g.add(mast);
  const sub = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), steel(0xaab0b8));
  sub.position.y = 0.85;
  g.add(sub);

  // long magnetometer boom to one side
  const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3.0, 6), steel(0x9aa0a8, 0.5, 0.6));
  mag.rotation.z = Math.PI / 2;
  mag.position.set(1.5, 0.0, 0);
  g.add(mag);

  // science boom with an instrument box on the opposite side
  const sci = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.8, 6), steel());
  sci.rotation.z = Math.PI / 2;
  sci.position.set(-0.55, -0.05, 0.12);
  g.add(sci);
  const instr = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), gold(0.5));
  instr.position.set(-0.95, -0.05, 0.12);
  g.add(instr);

  // RTG boom angled down with three units
  for (let i = 0; i < 3; i++) {
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), black());
    rtg.rotation.z = Math.PI / 2;
    rtg.position.set(-0.4 - i * 0.16, -0.32 - i * 0.12, -0.18);
    g.add(rtg);
  }
  const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), steel());
  rtgBoom.rotation.z = 0.7;
  rtgBoom.position.set(-0.3, -0.22, -0.18);
  g.add(rtgBoom);

  g.userData.spin = 0.3;
  return g;
}

// Solar sail: large thin reflective square on diagonal booms with a small bus.
export function createSolarSail() {
  const g = new THREE.Group();
  const S = 2.6;
  const H = S / 2;
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(S, S),
    new THREE.MeshStandardMaterial({ color: 0xcfd6e0, metalness: 0.9, roughness: 0.18, side: THREE.DoubleSide, emissive: 0x2a3a52, emissiveIntensity: 0.3 })
  );
  g.add(sail);
  // quadrant seams (a single cross)
  g.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(S, S, 2, 2)),
      new THREE.LineBasicMaterial({ color: 0x7f9bc0, transparent: true, opacity: 0.45 })
    )
  );
  // perimeter frame so the membrane reads as a covered, tensioned sail
  const frameMat = steel(0x9aa0a8, 0.4, 0.7);
  const barH = new THREE.BoxGeometry(S + 0.06, 0.04, 0.04);
  const barV = new THREE.BoxGeometry(0.04, S + 0.06, 0.04);
  for (const y of [H, -H]) {
    const b = new THREE.Mesh(barH, frameMat);
    b.position.y = y;
    g.add(b);
  }
  for (const x of [H, -H]) {
    const b = new THREE.Mesh(barV, frameMat);
    b.position.x = x;
    g.add(b);
  }
  // diagonal booms to the corners (behind the membrane)
  for (const r of [Math.PI / 4, -Math.PI / 4]) {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, S * Math.SQRT2, 8), frameMat);
    boom.rotation.z = r;
    boom.position.z = -0.05;
    g.add(boom);
  }
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), steel(0xb0b6c0, 0.4, 0.8));
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

  // rounded fuselage with volume
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.0, 8, 16), w);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.44, 18), w);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.82;
  g.add(nose);
  // black cockpit / chine
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.3), k);
  cockpit.position.set(0.46, 0.11, 0);
  g.add(cockpit);

  // thick delta wing
  const shape = new THREE.Shape();
  shape.moveTo(0.5, 0);
  shape.lineTo(-0.72, 1.0);
  shape.lineTo(-0.72, -1.0);
  shape.closePath();
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: false }), w);
  wing.rotation.x = -Math.PI / 2;
  wing.position.set(-0.1, -0.13, 0);
  g.add(wing);

  // vertical tail
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.72, 0);
  tailShape.lineTo(-0.72, 0.46);
  tailShape.lineTo(-0.42, 0);
  tailShape.closePath();
  const tail = new THREE.Mesh(new THREE.ExtrudeGeometry(tailShape, { depth: 0.04, bevelEnabled: false }), w);
  tail.position.set(0, 0.1, -0.02);
  g.add(tail);

  // OMS pods + three engine bells at the rear
  for (const dir of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.12, 6, 10), w);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(-0.64, 0.13, dir * 0.12);
    g.add(pod);
  }
  for (const [px, py] of [[-0.78, 0.06], [-0.78, 0.17], [-0.78, -0.05]]) {
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.13, 12, 1, true), k);
    bell.rotation.z = Math.PI / 2;
    bell.position.set(px, py, 0);
    g.add(bell);
  }

  g.userData.spin = 0.35;
  return g;
}
