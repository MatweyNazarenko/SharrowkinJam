import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { makeFighter, disposeScene } from './battleModels';
import { actionEnvelope, neutralPose, poseFighter } from './fighterAnimation';
import { makeBattleEffects, samplePose, type TimedCue } from './battleEffects';

const disposeModel = (model: THREE.Object3D) => { const scene = new THREE.Scene(); scene.add(model); disposeScene(scene); };

describe('articulated fighter animation', () => {
  it('has anticipation, a strike and an exact return to rest', () => {
    expect(actionEnvelope(0)).toBe(0);
    expect(actionEnvelope(.24)).toBeCloseTo(-.24);
    expect(actionEnvelope(.44)).toBeCloseTo(1);
    expect(actionEnvelope(.7)).toBeGreaterThan(0);
    expect(actionEnvelope(1)).toBe(0);
    expect(actionEnvelope(2)).toBe(0);
  });
  for (const spider of [false, true]) for (const variant of [0, 1, 2]) {
    it(`poses and restores every joint of ${spider ? 'spider' : 'human'} ${variant}`, () => {
      const model = makeFighter(spider, variant);
      const baseline = new Map<THREE.Object3D, THREE.Matrix4>();
      poseFighter(model, 0, neutralPose(), false); model.updateMatrixWorld(true);
      model.traverse(o => baseline.set(o, o.matrixWorld.clone()));
      poseFighter(model, 4, { ...neutralPose(), attack: 1, cast: .4, guard: .5, hit: .3 });
      model.updateMatrixWorld(true);
      const joints = spider ? model.rig.legs.map(l => l.hip.pivot) : model.rig.arms.map(a => a.shoulder.pivot);
      expect(joints.every(j => !j.matrixWorld.equals(baseline.get(j)!))).toBe(true);
      model.traverse(o => expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true));
      const once = model.rig.body.matrixWorld.clone();
      poseFighter(model, 4, { ...neutralPose(), attack: 1, cast: .4, guard: .5, hit: .3 }); model.updateMatrixWorld(true);
      expect(model.rig.body.matrixWorld.equals(once)).toBe(true);
      poseFighter(model, 250, { ...neutralPose(), attack: 1 }, false); model.updateMatrixWorld(true);
      model.traverse(o => expect(o.matrixWorld.equals(baseline.get(o)!)).toBe(true));
      disposeModel(model);
    });
  }
  it('keeps materials and animation independent between two fighters', () => {
    const first = makeFighter(false, 1), second = makeFighter(false, 1);
    poseFighter(first, 2, { ...neutralPose(), hit: 1 });
    expect(second.rig.shell.emissive.getHex()).toBe(0);
    expect(second.rig.body.rotation.x).toBe(0);
    disposeModel(first); disposeModel(second);
  });
  it('honors delayed impacts and never turns a health cost into recoil', () => {
    const cues: TimedCue[] = [
      { actor: 'player', kind: 'attack', delay: 0, at: 0 },
      { actor: 'enemy', kind: 'hit', delay: 290, at: 290 },
      { actor: 'player', kind: 'cost', delay: 0, at: 0 },
    ];
    expect(samplePose(cues, 'enemy', 200).hit).toBe(0);
    expect(samplePose(cues, 'enemy', 650).hit).toBeGreaterThan(.5);
    expect(samplePose(cues, 'player', 300).hit).toBe(0);
    expect(samplePose(cues, 'player', 300).power).toBeGreaterThan(0);
    expect(samplePose(cues, 'player', 2000)).toEqual(neutralPose());
  });
  it('cleans up each shared geometry and material exactly once, including particles', () => {
    const scene = new THREE.Scene(); scene.add(makeFighter(false, 2), makeFighter(true, 2));
    makeBattleEffects(scene);
    const geometry = new Set<THREE.BufferGeometry>(), material = new Set<THREE.Material>();
    scene.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        geometry.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => material.add(m));
      }
    });
    const spies = [...geometry, ...material].map(resource => vi.spyOn(resource, 'dispose'));
    disposeScene(scene); spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
  });
  it('hides transient effects in paused mode while retaining current armor', () => {
    const scene = new THREE.Scene(), effects = makeBattleEffects(scene);
    const cue: TimedCue = { actor: 'player', kind: 'hit', delay: 0, at: 0 };
    effects.update(300, [cue], [0, 0], false);
    expect(scene.children.every(o => !o.visible)).toBe(true);
    effects.update(300, [], [10, 0], false);
    expect(scene.children.filter(o => o.visible)).toHaveLength(1);
    disposeScene(scene);
  });
});
