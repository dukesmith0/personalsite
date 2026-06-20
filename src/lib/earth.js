// ---------------------------------------------------------------------------
// Stylized Earth: dark matte sphere + glowing vector coastlines + graticule
// + a fresnel atmosphere shell. Vector continents (no texture) keep it crisp,
// tiny, and distinct from the cliché blue-marble.
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { feature } from "topojson-client";
import landTopo from "world-atlas/land-110m.json";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

const DEG = Math.PI / 180;

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function coastlines(radius, color) {
  // feature() may return a FeatureCollection or a single Feature - normalize.
  const fc = feature(landTopo, landTopo.objects.land);
  const features = fc.features || [fc];

  const pts = [];
  for (const f of features) {
    const geom = f.geometry;
    if (!geom) continue;
    const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length - 1; i++) {
          const a = latLonToVec3(ring[i][1], ring[i][0], radius);
          const b = latLonToVec3(ring[i + 1][1], ring[i + 1][0], radius);
          pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
  }
  // Fat lines (LineSegments2): real pixel width, DPR aware, and they do not
  // shimmer/crawl during rotation the way native 1px GL lines do.
  const geo = new LineSegmentsGeometry();
  geo.setPositions(pts);
  const mat = new LineMaterial({
    color,
    linewidth: 1.4,
    transparent: true,
    opacity: 0.92,
    worldUnits: false,
    alphaToCoverage: true,
  });
  mat.resolution.set(window.innerWidth, window.innerHeight);
  return new LineSegments2(geo, mat);
}

function graticule(radius, color) {
  const pts = [];
  const push = (lat1, lon1, lat2, lon2) => {
    const a = latLonToVec3(lat1, lon1, radius);
    const b = latLonToVec3(lat2, lon2, radius);
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  for (let lat = -60; lat <= 60; lat += 30)
    for (let lon = -180; lon < 180; lon += 6) push(lat, lon, lat, lon + 6);
  for (let lon = -180; lon < 180; lon += 30)
    for (let lat = -90; lat < 90; lat += 6) push(lat, lon, lat + 6, lon);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.07 });
  return new THREE.LineSegments(geo, mat);
}

function atmosphere(radius, color) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        // tighter falloff (pow 4) -> fewer blended pixels carry meaningful alpha
        float rim = pow(1.0 - abs(dot(vNormal, vView)), 4.0);
        gl_FragColor = vec4(uColor, rim * 0.95);
      }`,
  });
  // smaller shell + fewer segments -> much less full-screen overdraw (fill-rate)
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 24, 24), mat);
}

export function createEarth({ radius = 1, glow = "#cfe0ea" } = {}) {
  const group = new THREE.Group();

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    // matte dark sphere - Lambert is far cheaper per-fragment than PBR and the
    // terminator still reads. This is a large-area mesh, so the saving is real.
    new THREE.MeshLambertMaterial({
      color: 0x0a1320,
      emissive: 0x040a14,
      emissiveIntensity: 0.6,
    })
  );

  const coast = coastlines(radius * 1.002, new THREE.Color(glow));
  group.add(surface);
  group.add(graticule(radius * 1.001, new THREE.Color(glow)));
  group.add(coast);
  group.add(atmosphere(radius, glow));
  group.userData.surface = surface;
  // exposed so the renderer can keep the fat-line resolution in sync on resize
  group.userData.coastMaterial = coast.material;
  return group;
}
