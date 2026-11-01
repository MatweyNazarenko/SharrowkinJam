import * as THREE from 'three';
import { joint, type FighterRig, type ModelKit } from './modelParts';

export function buildSpider(root: THREE.Group, k: ModelKit, variant: number): FighterRig {
  const { box, orb, bone, armor, shell, dark, edge, accent, poison } = k;
  const body = joint(root, 'thorax', 0, .77, .16).pivot;
  const head = joint(body, 'head', 0, -.02, .51).pivot;
  const abdomen = joint(body, 'abdomen', 0, .05, -.72).pivot;
  const rig: FighterRig = { body, head, abdomen, arms: [], legs: [], humanLegs: [], fangs: [], accent, shell };
  const heavy = variant === 1;
  const width = heavy ? .76 : variant === 2 ? .57 : .65;
  orb(abdomen, dark, 0, 0, -.08, width, heavy ? .6 : .5, .85);
  // Overlapping shell segments leave dark seams and a recognisable organic silhouette.
  for (let i = 0; i < 4; i++) {
    const z = -.69 + i * .36;
    const scale = Math.sqrt(1 - Math.pow((i - 1.5) / 2.5, 2));
    armor(abdomen, 0, .16, z, width * scale, heavy ? .52 : .4, .36);
    box(abdomen, accent, 0, heavy ? .63 : .53, z, .09, .028, .14);
  }
  if (heavy) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    armor(abdomen, side * .58, .08, -.48 + i * .37, .24, .27, .27);
    bone(abdomen, [side * .58, .22, -.48 + i * .37], [side * .78, .48, -.6 + i * .37], .075, edge, true);
  }
  if (variant === 2) for (const side of [-1, 1]) {
    orb(abdomen, dark, side * .46, .19, -.19, .25, .34, .47);
    orb(abdomen, poison, side * .51, .25, -.17, .17, .25, .36);
    for (let i = 0; i < 3; i++) box(abdomen, shell, side * .535, .26, -.44 + i * .27, .09, .47, .045);
  }
  orb(body, dark, 0, -.02, .02, .43, .3, .57);
  armor(body, 0, .13, .04, .46, .25, .58);
  for (const side of [-1, 1]) armor(body, side * .3, .12, .15, .2, .17, .34);
  armor(head, 0, .015, 0, .35, .27, .29);
  box(head, dark, 0, .01, .215, .46, .19, .12);
  // Eight eyes: a larger central pair and smaller outer/upper pairs.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = side * (i === 0 ? .09 : i === 1 ? .22 : i === 2 ? .13 : .26);
    const y = i < 2 ? .04 : .16;
    const z = i < 2 ? .285 : .21;
    orb(head, dark, x, y, z, .074, .075, .048);
    orb(head, accent, x, y + .005, z + .027, i === 0 ? .052 : .034, i === 0 ? .06 : .04, .033);
  }
  for (const side of [-1, 1]) {
    const fang = joint(head, `fang-${side}`, side * .19, -.12, .15);
    orb(fang.pivot, shell, 0, -.06, .07, .105, .13, .13);
    bone(fang.pivot, [0, -.09, .1], [side * -.045, -.25, .24], .065, edge);
    bone(fang.pivot, [side * -.045, -.25, .24], [side * -.1, -.21, .36], .045, variant === 2 ? poison : dark, true);
    rig.fangs.push(fang);
    bone(body, [side * .27, -.15, .6], [side * .46, -.25, .89], .04, shell);
    orb(body, accent, side * .46, -.25, .89, .05, .045, .06);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const hip = joint(body, `hip-${side}-${i}`, side * .34, -.04, -.53 + i * .32);
    const spread = (i - 1.5) * .36;
    const kneeAt = [side * (.68 + (heavy ? .07 : 0)), .17, spread];
    const knee = joint(hip.pivot, `knee-${side}-${i}`, ...kneeAt as [number, number, number]);
    const ankleAt = [side * .25, -.54, spread * .5];
    const ankle = joint(knee.pivot, `ankle-${side}-${i}`, ...ankleAt as [number, number, number]);
    orb(hip.pivot, dark, 0, 0, 0, .11, .12, .14);
    bone(hip.pivot, [0, 0, 0], kneeAt, heavy ? .12 : .09, shell);
    orb(knee.pivot, dark, 0, 0, 0, .12, .115, .12);
    orb(knee.pivot, edge, 0, .045, 0, .078, .045, .085);
    bone(knee.pivot, [0, -.03, 0], ankleAt, heavy ? .09 : .065, dark);
    bone(knee.pivot, [side * .025, -.08, 0], [side * .2, -.41, spread * .42], heavy ? .063 : .044, shell);
    orb(ankle.pivot, shell, 0, 0, 0, .075, .085, .075);
    bone(ankle.pivot, [0, 0, 0], [side * .12, -.32, spread * .18], .052, dark, true);
    rig.legs.push({ hip, knee, ankle, side, index: i });
  }
  for (const side of [-1, 1]) bone(abdomen, [side * .15, -.15, -.76], [side * .17, -.2, -1.03], .055, shell);
  return rig;
}
