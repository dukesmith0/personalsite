// ---------------------------------------------------------------------------
// Procedural satellite, built from primitives so it stays crisp and lightweight.
// Physically plausible layout: the bus is nadir-pointing (+Z faces Earth) with
// the high-gain dish and comm antenna on that axis; the solar wings sit on the
// perpendicular (X) axis and the scene rotates them to track the sun.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { makeGlowTexture } from "./glow.js";

export function createSatellite({ accent = "#ff6a3d" } = {}) {
  const sat = new THREE.Group();

  const foil = new THREE.MeshStandardMaterial({ color: 0xc9b27a, roughness: 0.35, metalness: 0.9 });
  const body = new THREE.MeshStandardMaterial({ color: 0xb8c0cc, roughness: 0.4, metalness: 0.8 });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0b1f4a,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0x06122e,
    emissiveIntensity: 0.5,
    side: THREE.DoubleSide,
  });
  const hot = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4 });

  // bus (gold-foil wrapped box)
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), foil);
  sat.add(bus);

  // solar wings on a sun-tracking axis. Panel plate: long on X, thin on Y, so
  // its broad face normal is +Y and rotating the group about X aims it at the sun.
  const wings = new THREE.Group();
  const panelGeo = new THREE.BoxGeometry(0.66, 0.01, 0.26);
  for (const dir of [-1, 1]) {
    const w = new THREE.Mesh(panelGeo, panelMat);
    w.position.x = dir * 0.52;
    wings.add(w);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), body);
    boom.rotation.z = Math.PI / 2;
    boom.position.x = dir * 0.28;
    wings.add(boom);
    const grid = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.66, 0.01, 0.26, 6, 1, 2)),
      new THREE.LineBasicMaterial({ color: 0x4a6aa0, transparent: true, opacity: 0.5 })
    );
    grid.position.x = dir * 0.52;
    wings.add(grid);
  }
  sat.add(wings);

  // high-gain dish on the nadir (+Z) axis, pointing at Earth
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 24, 1, true), body);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = 0.2;
  sat.add(dish);
  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), hot);
  feed.position.z = 0.31;
  sat.add(feed);

  // zenith monopole antenna (-Z, away from Earth)
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 6), body);
  ant.rotation.x = Math.PI / 2;
  ant.position.z = -0.24;
  sat.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), hot);
  tip.position.z = -0.4;
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
        opacity: 1,
      })
    );
    s.position.copy(pos);
    s.scale.setScalar(size);
    return s;
  };
  sat.add(glint(new THREE.Vector3(0, 0, 0.31), 0.26));
  sat.add(glint(new THREE.Vector3(0, 0, -0.4), 0.18));

  // freeze static local matrices. The wings group rotates each frame (sun
  // tracking) so it stays live, but its children are static relative to it.
  wings.children.forEach((c) => {
    c.updateMatrix();
    c.matrixAutoUpdate = false;
  });
  sat.children.forEach((c) => {
    if (c === wings) return;
    c.updateMatrix();
    c.matrixAutoUpdate = false;
  });

  sat.userData.wings = wings;
  sat.scale.setScalar(0.4);
  return sat;
}
