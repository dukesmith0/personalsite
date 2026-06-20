// ---------------------------------------------------------------------------
// Render-style experiments: re-skin any object group's meshes with a different
// material so we can compare looks in the gallery. Lines / sprites are left
// untouched (only isMesh surfaces are restyled).
// ---------------------------------------------------------------------------
import * as THREE from "three";

// Procedural chrome matcap: a sphere-shaded gradient baked to a canvas texture.
function makeChromeMatcap() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  // base vertical sky/ground gradient
  const lin = ctx.createLinearGradient(0, 0, 0, s);
  lin.addColorStop(0, "#f4f8ff");
  lin.addColorStop(0.5, "#7d8aa0");
  lin.addColorStop(0.5, "#3a4252");
  lin.addColorStop(1, "#0c1020");
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, s, s);
  // upper-left specular highlight
  const rad = ctx.createRadialGradient(s * 0.36, s * 0.3, 0, s * 0.36, s * 0.3, s * 0.5);
  rad.addColorStop(0, "rgba(255,255,255,0.95)");
  rad.addColorStop(0.3, "rgba(255,255,255,0.25)");
  rad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A few-step luminance ramp for banded toon shading.
function makeToonGradient() {
  const data = new Uint8Array([60, 110, 175, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function applyChrome(group) {
  const matcap = makeChromeMatcap();
  group.traverse((o) => {
    if (o.isMesh) o.material = new THREE.MeshMatcapMaterial({ matcap, color: 0xffffff });
  });
  return group;
}

export function applyToon(group) {
  const gradientMap = makeToonGradient();
  group.traverse((o) => {
    if (o.isMesh) {
      const color = o.material && o.material.color ? o.material.color.clone() : new THREE.Color(0x9aa3b2);
      o.material = new THREE.MeshToonMaterial({ color, gradientMap });
    }
  });
  return group;
}
