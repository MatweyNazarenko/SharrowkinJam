import * as THREE from 'three';
import { type Actor, type BattleCue } from './battleCues';
import { neutralPose, actionEnvelope, type FighterPose } from './fighterAnimation';

export type TimedCue = BattleCue & { at: number };
export function samplePose(cues: TimedCue[], actor: Actor, time: number): FighterPose {
  const pose = neutralPose();
  for (const cue of cues) {
    if (cue.actor !== actor) continue;
    const t = (time - cue.at) / (cue.kind === 'attack' ? 740 : 850);
    if (t < 0 || t >= 1) continue;
    const amount = cue.kind === 'attack' ? actionEnvelope(t) : Math.sin(Math.PI * t) ** 2;
    if (cue.kind === 'cost') pose.power = Math.max(pose.power, amount * .6);
    else if (cue.kind in pose) {
      const key = cue.kind as keyof FighterPose;
      pose[key] = Math.abs(amount) > Math.abs(pose[key]) ? amount : pose[key];
    }
  }
  return pose;
}

export function makeBattleEffects(scene: THREE.Scene) {
  const shieldMaterial = new THREE.MeshBasicMaterial({ color: '#efad6d', transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide });
  const shields = [-2.4, 2.4].map(x => {
    const geometry = new THREE.SphereGeometry(1.37, 24, 18, 0, Math.PI * 2, .25, 2.45);
    const shield = new THREE.Mesh(geometry, shieldMaterial.clone());
    shield.position.set(x, 1.11, 0); shield.scale.set(1, .88, .88); scene.add(shield); return shield;
  });
  shieldMaterial.dispose();
  const sparks = [-2.4, 2.4].map(x => {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18 * 3), 3));
    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffc68a', size: .065, transparent: true, opacity: 0, depthWrite: false }));
    particles.position.set(x, 1.2, .25); scene.add(particles); return particles;
  });
  const bolts = [-1, 1].map(() => {
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffa45b', transparent: true, opacity: .85 }));
    bolt.scale.set(2.5, .6, .6); bolt.visible = false; scene.add(bolt); return bolt;
  });
  return {
    update(time: number, cues: TimedCue[], block: [number, number], moving: boolean) {
      for (let i = 0; i < 2; i++) {
        const actor = i === 0 ? 'player' : 'enemy';
        const pose = moving ? samplePose(cues, actor, time) : neutralPose();
        const shield = shields[i]; shield.visible = block[i] > 0 || moving && pose.guard > .01;
        shield.material.opacity = .055 + (moving ? pose.guard * .18 : 0);
        shield.scale.set(1 + pose.guard * .055, .88 + pose.guard * .05, .88);
        const particle = sparks[i]; particle.visible = false;
        const burst = [...cues].reverse().find(c => c.actor === actor && ['hit', 'guard', 'poison', 'heal', 'cost'].includes(c.kind) && time >= c.at && time < c.at + 640);
        if (moving && burst) {
          const t = (time - burst.at) / 640;
          particle.visible = true; particle.material.opacity = (1 - t) * .85;
          particle.material.color.set(burst.kind === 'poison' ? '#b0c87c' : burst.kind === 'heal' ? '#a7ccab' : burst.kind === 'cost' ? '#dd7767' : '#ffc68a');
          const positions = particle.geometry.getAttribute('position') as THREE.BufferAttribute;
          for (let j = 0; j < positions.count; j++) {
            const angle = j * 2.39996;
            positions.setXYZ(j, Math.cos(angle) * t * .8, Math.sin(angle) * t * .6 - t * t * .3, Math.sin(j * 1.7) * t * .5);
          }
          positions.needsUpdate = true;
        }
        const bolt = bolts[i]; bolt.visible = false;
        const cast = [...cues].reverse().find(c => c.actor === actor && (c.kind === 'cast' || c.kind === 'attack') && time >= c.at + 160 && time < c.at + 330);
        if (moving && cast) {
          const t = (time - cast.at - 160) / 170;
          bolt.visible = true; bolt.material.color.set(cast.kind === 'cast' ? '#b2c881' : '#ffa45b');
          bolt.position.set((i === 0 ? -1 : 1) * (1.8 - t * 3.6), 1.14 + Math.sin(t * Math.PI) * .2, .2);
        }
      }
    },
  };
}
