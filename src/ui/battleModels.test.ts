import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeFighter, disposeScene } from './battleModels';

describe('3D models',()=>{
  for(const spider of [false,true]) for(const variant of [0,1,2]) it(`builds ${spider?'spider':'human'} variant ${variant}`,()=>{
    const model=makeFighter(spider,variant);
    const bounds=new THREE.Box3().setFromObject(model);
    expect(bounds.isEmpty()).toBe(false);
    expect(bounds.min.y).toBeGreaterThan(-.02);
    expect(bounds.min.y).toBeLessThan(.05); // Feet rest on the platform, not in mid-air.
    // Meshes now live under joints. Count the complete hierarchy, not direct children.
    const meshes:THREE.Mesh[]=[];
    model.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
    expect(meshes.length).toBeGreaterThan(70);
    expect(new Set(meshes.map(m=>m.geometry)).size).toBeLessThan(8);
    const triangles=meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);
    expect(triangles).toBeLessThan(150000);
    expect(bounds.max.y).toBeLessThan(3);
    expect(bounds.max.x-bounds.min.x).toBeLessThan(4.2);
    expect(model.rig.legs.length).toBe(spider?8:0);
    expect(model.rig.arms.length).toBe(spider?0:2);
    const scene=new THREE.Scene();scene.add(model);disposeScene(scene);
  });
});
