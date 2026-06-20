// ---------------------------------------------------------------------------
// Procedural satellite - built from primitives so it stays crisp & lightweight
// (no heavy downloaded asset). Central bus, two solar wings, dish + antenna.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeGlowTexture } from "./glow.js";

export function createSatellite({ accent = "#ff6a3d" } = {}) {
  const sat = new THREE.Group();

  const foil = new THREE.MeshStandardMaterial({ color: 0xc9b27a, roughness: 0.35, metalness: 0.9 });
  const body = new THREE.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.4, metalness: 0.8 });
  const panel = new THREE.MeshStandardMaterial({
    color: 0x0b1f4a,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0x06122e,
    emissiveIntensity: 0.5,
  });
  const hot = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4 });

  // bus (gold-foil wrapped box)
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), foil);
  sat.add(bus);

  // solar wings
  const wingGeo = new THREE.BoxGeometry(0.62, 0.22, 0.012);
  for (const dir of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, panel);
    wing.position.x = dir * 0.5;
    sat.add(wing);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), body);
    boom.rotation.z = Math.PI / 2;
    boom.position.x = dir * 0.28;
    sat.add(boom);
    // thin grid lines on each wing
    const grid = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, 0.22, 0.012, 6, 2)),
      new THREE.LineBasicMaterial({ color: 0x4a6aa0, transparent: true, opacity: 0.5 })
    );
    grid.position.x = dir * 0.5;
    sat.add(grid);
  }

  // high-gain dish
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24, 1, true), body);
  dish.rotation.x = Math.PI / 2.4;
  dish.position.set(0, 0.0, 0.22);
  sat.add(dish);
  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), hot);
  feed.position.set(0, 0.04, 0.3);
  sat.add(feed);

  // nadir antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 6), body);
  ant.position.y = -0.26;
  sat.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), hot);
  tip.position.y = -0.4;
  sat.add(tip);

  // fake-bloom glints on the hot points (additive sprites, very cheap)
  const glowTex = makeGlowTexture();
  const glint = (pos, size) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: accent,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.9,
      })
    );
    s.position.copy(pos);
    s.scale.setScalar(size);
    return s;
  };
  sat.add(glint(new THREE.Vector3(0, 0.04, 0.3), 0.22));
  sat.add(glint(new THREE.Vector3(0, -0.4, 0), 0.16));

  // every part is static relative to the bus: stop recomputing local matrices
  sat.children.forEach((c) => {
    c.updateMatrix();
    c.matrixAutoUpdate = false;
  });

  sat.scale.setScalar(0.42);
  return sat;
}
