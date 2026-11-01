import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Joint = { pivot: THREE.Group; rest: THREE.Euler };
export type Arm = { shoulder: Joint; elbow: Joint };
export type SpiderLeg = { hip: Joint; knee: Joint; ankle: Joint; side: number; index: number };
export type FighterRig = {
  body: THREE.Group; head: THREE.Group; arms: Arm[]; legs: SpiderLeg[];
  humanLegs: Joint[]; fangs: Joint[]; abdomen?: THREE.Group;
  accent: THREE.MeshStandardMaterial; shell: THREE.MeshStandardMaterial;
};

export function joint(parent: THREE.Object3D, name: string, x: number, y: number, z: number): Joint {
  const pivot = new THREE.Group(); pivot.name = name; pivot.position.set(x, y, z); parent.add(pivot);
  return { pivot, rest: pivot.rotation.clone() };
}

// Geometry and materials are shared within each fighter, not recreated for every detail.
export function modelKit(spider: boolean, variant: number) {
  const shell = new THREE.MeshStandardMaterial({
    color: spider ? ['#3e4149', '#69717a', '#343c37'][variant] : ['#555c66', '#7b838c', '#3c444b'][variant],
    roughness: spider ? .32 : .43, metalness: spider ? .38 : .56,
  });
  const edge = new THREE.MeshStandardMaterial({ color: '#adb3b6', roughness: .35, metalness: .72 });
  const dark = new THREE.MeshStandardMaterial({ color: '#20252c', roughness: .63, metalness: .22 });
  const cloth = new THREE.MeshStandardMaterial({ color: variant === 2 ? '#343e3b' : '#373b43', roughness: .94 });
  const skin = new THREE.MeshStandardMaterial({ color: '#c89774', roughness: .9 });
  const accent = new THREE.MeshStandardMaterial({ color: '#ff9b51', emissive: '#ed6c24', emissiveIntensity: .32, roughness: .38, metalness: .24 });
  const screen = new THREE.MeshStandardMaterial({ color: '#252d32', roughness: .3, metalness: .4 });
  const poison = new THREE.MeshStandardMaterial({ color: '#a8c676', emissive: '#647e35', emissiveIntensity: .28, roughness: .32, metalness: .15 });
  const round = new RoundedBoxGeometry(1, 1, 1, 3, .14);
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const plate = new THREE.IcosahedronGeometry(1, 2);
  const cylinder = new THREE.CylinderGeometry(.68, 1, 1, 10);
  const cone = new THREE.ConeGeometry(1, 1, 10);
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
    x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z); part.scale.set(sx, sy, sz);
    part.castShadow = true; part.receiveShadow = true; parent.add(part); return part;
  };
  const box = (p: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => mesh(p, round, m, x, y, z, sx, sy, sz);
  const orb = (p: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => mesh(p, sphere, m, x, y, z, sx, sy, sz);
  const armor = (p: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number) => mesh(p, plate, shell, x, y, z, sx, sy, sz);
  const bone = (p: THREE.Object3D, a: number[], b: number[], radius: number, m: THREE.Material, pointed = false) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
    const part = mesh(p, pointed ? cone : cylinder, m, 0, 0, 0, radius, delta.length(), radius);
    part.position.copy(from.add(to).multiplyScalar(.5));
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return part;
  };
  return { shell, edge, dark, cloth, skin, accent, screen, poison, box, orb, armor, bone };
}
export type ModelKit = ReturnType<typeof modelKit>;
