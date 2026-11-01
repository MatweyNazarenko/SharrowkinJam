import * as THREE from 'three';
import { joint, type FighterRig, type ModelKit } from './modelParts';

export function buildHuman(root: THREE.Group, k: ModelKit, variant: number): FighterRig {
  const { box, orb, bone, armor, shell, dark, cloth, edge, skin, accent, screen } = k;
  const body = joint(root, 'torso', 0, .98, 0).pivot;
  const head = joint(body, 'head', 0, 1.12, 0).pivot;
  const rig: FighterRig = { body, head, arms: [], legs: [], humanLegs: [], fangs: [], accent, shell };
  const broad = variant === 1 ? 1.16 : variant === 2 ? .9 : 1;

  box(body, cloth, 0, .47, -.01, .8 * broad, .91, .43);
  // Separate jacket panels, collar, seams and belt break up the old single-box torso.
  for (const side of [-1, 1]) {
    const panel = box(body, shell, side * .205 * broad, .49, .21, .36 * broad, .64, .095);
    panel.rotation.z = side * -.045;
    box(body, cloth, side * .22 * broad, .03, .08, .37 * broad, .23, .4);
    box(body, edge, side * .3 * broad, .71, .273, .08, .035, .025);
  }
  box(body, dark, 0, .47, .27, .045, .75, .03);
  box(body, accent, -.23, .59, .278, .17, .06, .025);
  box(body, dark, 0, .03, .025, .85 * broad, .11, .49);
  box(body, edge, 0, .03, .28, .13, .085, .035);
  box(body, dark, .29, -.03, .3, .2, .21, .13);
  orb(body, cloth, 0, .91, -.005, .36, .15, .29);
  bone(body, [0, .86, 0], [0, 1.08, 0], .125, skin);

  // A visible face, nose, ears and headset make the programmers read as people.
  orb(head, skin, 0, .13, .035, .255, .33, .245);
  orb(head, skin, 0, .1, .278, .06, .09, .07);
  box(head, dark, 0, .23, .254, .42, .115, .055);
  for (const side of [-1, 1]) {
    box(head, accent, side * .115, .24, .287, .13, .025, .012);
    orb(head, skin, side * .252, .1, 0, .055, .095, .065);
    orb(head, dark, side * .285, .19, -.025, .065, .11, .08);
  }
  bone(head, [.29, .14, .02], [.22, -.005, .24], .018, edge);
  box(head, dark, .17, -.015, .255, .09, .035, .035);
  box(head, dark, 0, -.035, .241, .11, .022, .018);
  if (variant === 1) {
    armor(head, 0, .32, -.04, .32, .22, .29);
    box(head, shell, 0, .36, .16, .57, .13, .36);
    box(head, accent, 0, .4, .347, .15, .035, .025);
  } else {
    // Sculpted hood: an open face with a high back and two fabric side folds.
    orb(head, cloth, 0, .22, -.14, .34, .38, .23);
    orb(head, cloth, 0, .43, .005, .32, .13, .28);
    for (const side of [-1, 1]) box(head, cloth, side * .29, .17, -.025, .105, .49, .38);
    if (variant === 2) box(head, dark, 0, -.09, .15, .5, .2, .25);
  }

  for (const side of [-1, 1]) {
    const leg = joint(root, `leg-${side}`, side * .22, .95, 0); rig.humanLegs.push(leg);
    bone(leg.pivot, [0, 0, 0], [side * .025, -.43, .015], .175, cloth);
    armor(leg.pivot, side * .02, -.39, .07, .17, .17, .16);
    bone(leg.pivot, [side * .02, -.44, 0], [side * .045, -.76, .025], .13, dark);
    box(leg.pivot, shell, side * .03, -.61, .105, .22, .29, .08);
    box(leg.pivot, dark, side * .04, -.81, .12, .33, .23, .5);
    box(leg.pivot, edge, side * .04, -.9, .145, .34, .04, .51);

    const shoulder = joint(body, `shoulder-${side}`, side * .48 * broad, .79, 0);
    const arm = shoulder.pivot;
    shoulder.rest.z = arm.rotation.z = side * .1;
    orb(arm, cloth, 0, -.09, 0, .205, .23, .215);
    armor(arm, side * .025, -.04, -.015, variant === 1 ? .26 : .21, .16, .24);
    bone(arm, [0, -.13, 0], [side * .06, -.43, .02], .13, cloth);
    const elbow = joint(arm, `elbow-${side}`, side * .06, -.44, .02);
    elbow.rest.x = elbow.pivot.rotation.x = -.35;
    orb(elbow.pivot, dark, 0, 0, 0, .125, .12, .12);
    bone(elbow.pivot, [0, -.03, 0], [0, -.33, .025], .115, shell);
    box(elbow.pivot, dark, 0, -.37, .025, .2, .17, .19);
    for (let f = 0; f < 3; f++) box(elbow.pivot, edge, -.06 + f * .06, -.38, .125, .035, .08, .025);
    rig.arms.push({ shoulder, elbow });
    if (side === -1) {
      const terminal = box(elbow.pivot, dark, 0, -.17, .145, .29, .24, .09);
      terminal.rotation.x = -.16;
      box(elbow.pivot, screen, 0, -.15, .2, .23, .15, .02);
      for (let i = 0; i < 3; i++) box(elbow.pivot, accent, -.03, -.11 - i * .04, .215, .13 - i * .025, .012, .012);
    } else {
      box(elbow.pivot, dark, 0, -.25, .14, .19, .3, .12);
      bone(elbow.pivot, [0, -.22, .2], [0, -.5, .37], .025, accent);
    }
    if (variant === 1 && side === -1) {
      box(elbow.pivot, shell, 0, -.23, .29, .46, .65, .16);
      box(elbow.pivot, dark, 0, -.23, .383, .32, .49, .03);
      box(elbow.pivot, accent, 0, -.23, .405, .055, .34, .025);
      box(elbow.pivot, edge, 0, -.23, .405, .24, .04, .02);
    }
  }
  box(body, dark, 0, .49, -.34, .52, .6, .25);
  box(body, shell, 0, .52, -.49, .39, .45, .06);
  for (let i = 0; i < 3; i++) box(body, edge, 0, .65 - i * .12, -.53, .25, .025, .025);
  if (variant === 2) {
    for (const side of [-1, 1]) {
      box(body, shell, side * .23, .35, -.41, .12, .43, .18);
      box(body, accent, side * .23, .3, -.51, .045, .19, .02);
    }
    bone(body, [.23, .57, -.38], [.3, 1.07, -.34], .017, edge);
  }
  return rig;
}
