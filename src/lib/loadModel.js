// ---------------------------------------------------------------------------
// glTF/GLB loader: loads a model, then centers it and scales it so its largest
// dimension fits `fit` world units. Handles Draco and meshopt compression.
// Returns a Promise<THREE.Group> (a wrapper centered at the origin).
// ---------------------------------------------------------------------------
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const draco = new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);

export function loadModel(url, { fit = 2 } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const s = fit / maxDim;
        obj.scale.setScalar(s);
        obj.position.set(-center.x * s, -center.y * s, -center.z * s);
        const wrap = new THREE.Group();
        wrap.add(obj);
        resolve(wrap);
      },
      undefined,
      reject
    );
  });
}
