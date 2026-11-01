import * as THREE from 'three';
import { modelKit, type FighterRig } from './modelParts';
import { buildHuman } from './humanModel';
import { buildSpider } from './spiderModel';

export type FighterModel = THREE.Group & { rig: FighterRig; spider: boolean };

// Original models, with a joint hierarchy shared by the battle and the tutorial.
export function makeFighter(spider: boolean, variant = 0): FighterModel {
  const root = new THREE.Group();
  root.name = `${spider ? 'spider' : 'human'}-${variant}`;
  const safeVariant = [0, 1, 2].includes(variant) ? variant : 0;
  const kit = modelKit(spider, safeVariant);
  const rig = spider ? buildSpider(root, kit, safeVariant) : buildHuman(root, kit, safeVariant);
  return Object.assign(root, { rig, spider });
}

export function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  scene.traverse(o => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
      geometries.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
