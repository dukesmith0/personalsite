// ---------------------------------------------------------------------------
// Procedural manhole cover, used on the contact section of the main site and in
// the /assets gallery. Returns a THREE.Group centered near the origin.
// ---------------------------------------------------------------------------
import * as THREE from "three";

const steel = (c = 0xc8ccd2, r = 0.25, m = 0.95) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

// The Operation Plumbbob "manhole cover", the in-joke being that it is
// reportedly the fastest man-made object. A steel disc with radial cast-iron
// grooves and a raised rim.
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
  g.userData.spin = 0.15;
  return g;
}
