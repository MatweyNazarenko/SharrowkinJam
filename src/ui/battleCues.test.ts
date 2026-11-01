import { describe, expect, it } from 'vitest';
import { endTurn, enterNode, newRun, play, type Run } from '../engine';
import { battleCues } from './battleCues';
import { createLesson, lessonAction } from '../tutorial';

const fight = (side: 'dev' | 'spider' = 'dev') => enterNode(newRun(side, 42));
const card = (s: Run, index: number) => { s.hand = [`${s.side}-${index}`]; return play(s, 0); };

describe('battle animation events from real engine transitions', () => {
  for (const side of ['dev', 'spider'] as const) {
    it(`animates an attack and target recoil for ${side}`, () => {
      const before = fight(side), after = card(before, 0), cues = battleCues(before, after);
      expect(cues).toContainEqual({ actor: 'player', kind: 'attack', delay: 0, amount: undefined });
      expect(cues).toContainEqual({ actor: 'enemy', kind: 'hit', delay: 290, amount: 7 });
      expect(cues.some(c => c.actor === 'enemy' && c.kind === 'attack')).toBe(false);
    });
    it(`animates health prices without an incoming hit for ${side}`, () => {
      const before = fight(side); before.player.block = 12;
      const cues = battleCues(before, card(before, 12));
      expect(cues.some(c => c.kind === 'cost' && c.amount === 4)).toBe(true);
      expect(cues.some(c => c.kind === 'power')).toBe(true);
      expect(cues.some(c => c.kind === 'hit' || c.actor === 'enemy')).toBe(false);
    });
    it(`does not animate effects blocked by a lethal price for ${side}`, () => {
      const before = fight(side); before.player.hp = 5;
      const after = card(before, 13), cues = battleCues(before, after);
      expect(after.phase).toBe('lost');
      expect(cues.map(c => c.kind)).toEqual(['cost']);
    });
    it(`shows a cast, not a physical strike, when applying infection for ${side}`, () => {
      const before = fight(side), cues = battleCues(before, card(before, 2));
      expect(cues.map(c => c.kind)).toEqual(['cast', 'poison']);
    });
  }
  it('distinguishes a fully absorbed hit from HP damage', () => {
    const before = fight(); before.enemy.block = 20;
    const cues = battleCues(before, card(before, 0));
    expect(cues.some(c => c.kind === 'guard' && c.actor === 'enemy' && c.amount === 7)).toBe(true);
    expect(cues.some(c => c.kind === 'hit')).toBe(false);
  });
  it('does not treat expired player armor as damage', () => {
    const before = fight(); before.player.block = 30;
    const after = endTurn(before), cues = battleCues(before, after);
    expect(after.player.block).toBe(0);
    expect(after.player.hp).toBe(before.player.hp);
    expect(cues.filter(c => c.kind === 'attack').map(c => c.actor)).toEqual(['enemy']);
    expect(cues.some(c => c.kind === 'hit')).toBe(false);
    expect(cues.find(c => c.kind === 'guard')?.amount).toBe(6);
  });
  it('shows guard and recoil separately for a partially absorbed attack', () => {
    const before = fight(); before.player.block = 4;
    const cues = battleCues(before, endTurn(before));
    expect(cues.find(c => c.kind === 'guard')?.amount).toBe(4);
    expect(cues.find(c => c.kind === 'hit')?.amount).toBe(2);
  });
  it('shows only infection when it defeats the enemy before their action', () => {
    const before = fight(); before.enemy.hp = 3; before.enemy.dot = 5;
    const after = endTurn(before), cues = battleCues(before, after);
    expect(after.phase).toBe('reward');
    expect(cues).toEqual([{ actor: 'enemy', kind: 'poison', delay: 0, amount: 3 }]);
  });
  it('does not interpret automatic victory healing as a heal card', () => {
    const before = fight(); before.player.hp = 40; before.enemy.hp = 2;
    const after = card(before, 0);
    expect(after.player.hp).toBe(52);
    expect(battleCues(before, after).some(c => c.kind === 'heal' || c.kind === 'cost')).toBe(false);
  });
  it('handles a draw card that reshuffles its own discard', () => {
    const before = fight(); before.draw = []; before.discard = ['dev-0'];
    const after = card(before, 12);
    expect(after.discard).toEqual([]);
    expect(battleCues(before, after).map(c => c.kind)).toEqual(['cost', 'power']);
  });
  it('does not repeat an enemy attack left in the combat log', () => {
    const before = endTurn(fight());
    expect(before.log[0]).toContain(': атака ');
    const cues = battleCues(before, card(before, 1));
    expect(cues.map(c => c.kind)).toEqual(['guard']);
  });
  it('captures two quick identical attacks without a random or log-based deduplication', () => {
    const before = fight(); before.hand = ['dev-0', 'dev-0'];
    const middle = play(before, 0), after = play(middle, 0);
    expect(battleCues(before, middle).filter(c => c.kind === 'attack')).toHaveLength(1);
    expect(battleCues(middle, after).filter(c => c.kind === 'attack')).toHaveLength(1);
    expect(battleCues(before, after).filter(c => c.kind === 'attack')).toHaveLength(2);
  });
  it('keeps incoming infection independent from a blocked attack', () => {
    const before = fight(); before.enemyIndex = 2; before.player.block = 50;
    const cues = battleCues(before, endTurn(before));
    expect(cues.some(c => c.actor === 'player' && c.kind === 'poison' && c.amount === 2)).toBe(true);
    expect(cues.some(c => c.actor === 'player' && c.kind === 'hit')).toBe(false);
  });
  it('has no side effects and no animation when mounting a saved run', () => {
    const before = fight(), after = card(before, 1), snapshot = structuredClone(after);
    battleCues(before, after);
    expect(after).toEqual(snapshot);
    expect(battleCues(after, after)).toEqual([]);
    expect(battleCues(newRun('dev', 4), before)).toEqual([]);
  });
  it('connects to both real tutorial scenarios including their killing blow', () => {
    for (const side of ['dev', 'spider'] as const) {
      let lesson = createLesson(side);
      const sequence = side === 'dev' ? ['dev-1', 'dev-0', 'end', 'dev-13'] : ['spider-1', 'spider-2', 'spider-0', 'end', 'spider-13'];
      for (const action of sequence) {
        const next = lessonAction(lesson, action);
        expect(battleCues(lesson.run, next.run).length).toBeGreaterThan(0);
        lesson = next;
      }
      expect(lesson.run.phase).toBe('reward');
    }
  });
});
