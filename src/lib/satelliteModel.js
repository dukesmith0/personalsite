// ---------------------------------------------------------------------------
// Procedural spacecraft, built from primitives so they stay crisp and light.
// Shared convention for all craft so the scene can orient them uniformly:
//   +Z  = nadir (points at Earth): dishes, instruments, apertures live here
//   X   = solar-wing axis; panel broad face normal is +Y so a single rotation
//         about X (done in the scene) tracks the sun.
// Each craft exposes userData.wings (the sun-tracking group) when it has one.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeGlowTexture } from "./glow.js";

function materials(accent) {
  return {
    foil: new THREE.MeshStandardMaterial({ color: 0xc9b27a, roughness: 0.35, metalness: 0.9 }),
    body: new THREE.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.4, metalness: 0.8 }),
    panel: new THREE.MeshStandardMaterial({
      color: 0x0b1f4a,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x06122e,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    }),
    hot: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4 }),
  };
}

// A solar wing pair on the X axis, panel normal +Y (for sun tracking).
function solarWings(m, span, chord) {
  const wings = new THREE.Group();
  const geo = new THREE.BoxGeometry(span, 0.01, chord);
  for (const dir of [-1, 1]) {
    const w = new THREE.Mesh(geo, m.panel);
    w.position.x = dir * (span * 0.5 + 0.12);
    wings.add(w);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), m.body);
    boom.rotation.z = Math.PI / 2;
    boom.position.x = dir * 0.16;
    wings.add(boom);
    const grid = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(span, 0.01, chord, 6, 1, 2)),
      new THREE.LineBasicMaterial({ color: 0x4a6aa0, transparent: true, opacity: 0.5 })
    );
    grid.position.x = dir * (span * 0.5 + 0.12);
    wings.add(grid);
  }
  return wings;
}

function glint(glowTex, accent, pos, size) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: accent,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 1,
    })
  );
  s.position.copy(pos);
  s.scale.setScalar(size);
  return s;
}

// Freeze every static local matrix; keep the sun-tracking wings live.
function finalize(sat, wings, scale) {
  if (wings) {
    sat.add(wings);
    sat.userData.wings = wings;
    wings.children.forEach((c) => {
      c.updateMatrix();
      c.matrixAutoUpdate = false;
    });
  }
  sat.children.forEach((c) => {
    if (c === wings) return;
    c.updateMatrix();
    c.matrixAutoUpdate = false;
  });
  sat.scale.setScalar(scale);
  return sat;
}

// Comms / instrument bus: gold-foil box, high-gain dish on nadir, zenith whip.
export function createCommsSat({ accent = "#ff6a3d" } = {}) {
  const sat = new THREE.Group();
  const m = materials(accent);
  const glow = makeGlowTexture();

  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), m.foil));

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 24, 1, true), m.body);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = 0.2;
  sat.add(dish);
  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), m.hot);
  feed.position.z = 0.31;
  sat.add(feed);

  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 6), m.body);
  ant.rotation.x = Math.PI / 2;
  ant.position.z = -0.24;
  sat.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), m.hot);
  antTip.position.z = -0.4;
  sat.add(antTip);

  sat.add(glint(glow, accent, new THREE.Vector3(0, 0, 0.31), 0.26));
  sat.add(glint(glow, accent, new THREE.Vector3(0, 0, -0.4), 0.18));

  return finalize(sat, solarWings(m, 0.5, 0.26), 0.4);
}

// 3U CubeSat: tall body (long axis = nadir), small deployed panels, whip + lens.
export function createCubeSat({ accent = "#ff6a3d" } = {}) {
  const sat = new THREE.Group();
  const m = materials(accent);
  const glow = makeGlowTexture();

  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.46), m.foil);
  sat.add(bus);
  sat.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.16, 0.16, 0.46)),
      new THREE.LineBasicMaterial({ color: 0x6f7d92, transparent: true, opacity: 0.6 })
    )
  );

  // imaging aperture on nadir face
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), m.body);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.24;
  sat.add(lens);
  sat.add(glint(glow, accent, new THREE.Vector3(0, 0, 0.25), 0.12));

  // zenith whip antenna
  const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), m.body);
  whip.rotation.x = Math.PI / 2;
  whip.position.z = -0.26;
  sat.add(whip);

  return finalize(sat, solarWings(m, 0.34, 0.18), 0.46);
}

// Earth-observation sat: larger bus, long nadir imaging barrel, big wings, dish.
export function createEOSat({ accent = "#ff6a3d" } = {}) {
  const sat = new THREE.Group();
  const m = materials(accent);
  const glow = makeGlowTexture();

  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.34), m.foil));

  // long imaging barrel pointing nadir (+Z)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.4, 20), m.body);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.34;
  sat.add(barrel);
  const aperture = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), m.hot);
  aperture.position.z = 0.54;
  sat.add(aperture);
  sat.add(glint(glow, accent, new THREE.Vector3(0, 0, 0.55), 0.2));

  // side high-gain dish
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20, 1, true), m.body);
  dish.rotation.z = Math.PI / 2;
  dish.position.set(0.22, 0.12, -0.1);
  sat.add(dish);

  return finalize(sat, solarWings(m, 0.7, 0.34), 0.42);
}
