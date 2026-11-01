import type { FighterModel } from './battleModels';
import type { Joint } from './modelParts';

export type FighterPose = { attack: number; cast: number; guard: number; hit: number; poison: number; heal: number; power: number; defeat: number };
export const neutralPose = (): FighterPose => ({ attack: 0, cast: 0, guard: 0, hit: 0, poison: 0, heal: 0, power: 0, defeat: 0 });
const reset = (joint: Joint) => joint.pivot.rotation.copy(joint.rest);
const smooth = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x * x * (3 - 2 * x); };

// Anticipation → quick strike → slow recovery; evaluated from absolute time, never accumulated.
export function actionEnvelope(progress: number) {
  if (progress <= 0 || progress >= 1) return 0;
  if (progress < .24) return -.24 * smooth(progress / .24);
  if (progress < .44) return -.24 + 1.24 * smooth((progress - .24) / .2);
  return 1 - smooth((progress - .44) / .56);
}

export function poseFighter(model: FighterModel, seconds: number, pose: FighterPose, moving = true) {
  const r = model.rig;
  const p = moving ? pose : neutralPose();
  const breath = moving ? Math.sin(seconds * 2.1) : 0;
  const idle = moving ? Math.sin(seconds * 1.4) : 0;
  r.body.position.y = (model.spider ? .77 : .98) + breath * .009 - Math.max(0, p.attack) * .035;
  r.body.rotation.set(p.attack * .13 - p.hit * .14 + p.defeat * .3, idle * .018 + p.cast * .09, p.hit * .07 + p.defeat * .15);
  r.body.scale.set(1, 1 + breath * .007, 1);
  r.head.rotation.set(-breath * .015 - p.attack * .12 + p.hit * .08, idle * .025, 0);
  if (r.abdomen) {
    r.abdomen.rotation.set(breath * .018 - p.attack * .1, idle * .025, 0);
    r.abdomen.scale.setScalar(1 + breath * .008 + p.cast * .018);
  }
  r.humanLegs.forEach((leg, i) => {
    reset(leg); leg.pivot.rotation.x += p.attack * (i === 0 ? -.14 : .15) - p.hit * .04;
  });
  r.arms.forEach(({ shoulder, elbow }, i) => {
    reset(shoulder); reset(elbow);
    shoulder.pivot.rotation.x += breath * .025 - p.attack * (i === 1 ? 1.25 : .25) - p.cast * .85 - p.power * .38;
    shoulder.pivot.rotation.z += (i === 0 ? -1 : 1) * (p.cast * .18 + p.hit * .08);
    elbow.pivot.rotation.x -= p.cast * .45 + p.power * .5;
    if (i === 0) {
      shoulder.pivot.rotation.x -= p.guard * .85;
      shoulder.pivot.rotation.y -= p.guard * .5;
      elbow.pivot.rotation.x -= p.guard * .8;
    } else elbow.pivot.rotation.x += p.attack * .28;
  });
  r.legs.forEach(({ hip, knee, ankle, side, index }) => {
    reset(hip); reset(knee); reset(ankle);
    // Alternating groups of four, not eight legs swinging in unison.
    const phase = seconds * 2.6 + (index % 2 === (side === 1 ? 0 : 1) ? 0 : Math.PI);
    const lift = moving ? Math.sin(phase) * .018 : 0;
    const front = index >= 2 ? 1 : -.35;
    hip.pivot.rotation.y = lift + p.attack * side * .13 * front;
    hip.pivot.rotation.z = side * (lift * .25 + Math.max(0, p.attack) * .11 * front - p.guard * .1);
    hip.pivot.rotation.x = p.cast * (index >= 2 ? -.2 : .035);
    knee.pivot.rotation.z = side * (-lift * .4 - p.attack * .11 * front + p.guard * .08 + p.defeat * .3);
    ankle.pivot.rotation.z = -side * p.attack * .06 * front;
  });
  r.fangs.forEach((fang, i) => {
    reset(fang); fang.pivot.rotation.y = (i === 0 ? -1 : 1) * (p.attack * .4 + p.cast * .16);
    fang.pivot.rotation.x = -p.attack * .18;
  });
  r.accent.emissiveIntensity = .32 + Math.max(0, p.attack) * .18 + p.cast * .22 + p.power * .24;
  r.shell.emissive.set(p.hit > .01 ? '#9d3c22' : p.poison > .01 ? '#4f682e' : p.heal > .01 ? '#68834e' : '#000000');
  r.shell.emissiveIntensity = p.hit * .4 + p.poison * .27 + p.heal * .22;
}
