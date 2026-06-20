// Soft radial glow texture, shared by the fake-bloom sprites (satellite lights,
// sun glint). One canvas texture reused everywhere; tint per sprite material.
import * as THREE from "three";

let cached = null;

export function makeGlowTexture() {
  if (cached) return cached;
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cached = new THREE.CanvasTexture(c);
  cached.colorSpace = THREE.SRGBColorSpace;
  return cached;
}
