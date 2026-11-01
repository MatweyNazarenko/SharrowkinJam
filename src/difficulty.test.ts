import { describe, expect, it } from 'vitest';
import { newRun, enterNode, endTurn, play, intent, isRun, attackValue } from './engine';
import { load } from './store';
import { enemies, type Side } from './data';
import { createLesson } from './tutorial';
import type { Difficulty } from './difficulty';

const cases: [Difficulty,number,number,number][] = [['easy',24,5,16],['normal',30,6,12],['hard',38,8,8]];
describe('difficulty rules',()=>{
  for(const side of ['dev','spider'] as Side[]) for(const [level,hp,hit,heal] of cases) {
    it(`${side} / ${level}: actual battle, intent and healing`,()=>{
      const r=enterNode(newRun(side,42,undefined,level));
      expect(r.enemy.max).toBe(hp); expect(intent(r).damage).toBe(hit);
      const next=endTurn(r); expect(next.player.hp).toBe(r.player.hp-hit);
      r.player.hp=20;r.enemy.hp=1;r.hand=[`${side}-0`];
      const won=play(r,0); expect(won.phase).toBe('reward'); expect(won.player.hp).toBe(20+heal);
      expect(won.gold).toBe(25);expect(won.rewards).toHaveLength(3);
      expect(r.player.hp).toBe(20);expect(r.enemy.hp).toBe(1);
    });
  }
  it('scales all enemies and boss on both sides without mutating definitions',()=>{
    const original=structuredClone(enemies);
    for(const side of ['dev','spider'] as Side[]) for(const [node,index] of [[0,0],[1,1],[4,3],[5,2],[7,4]]) {
      const r=enterNode({...newRun(side,12,undefined,'hard'),node});
      expect(r.enemy.max).toBe(Math.round(enemies[side][index].hp*1.25));
      for(let turn=1;turn<=3;turn++) {
        r.turn=turn; const base=enemies[side][index].intents[(turn-1)%enemies[side][index].intents.length];
        expect(intent(r)).toEqual({...base,damage:Math.round(base.damage*1.25)});
      }
    }
    expect(enemies).toEqual(original);
  });
  it('applies weakness, vulnerability and armor to the displayed scaled intent',()=>{
    const r=enterNode(newRun('dev',1,undefined,'hard'));
    r.enemy.weak=2;r.player.vulnerable=2;r.player.block=3;
    const expected=attackValue(intent(r).damage,r.enemy,r.player);
    expect(endTurn(r).player.hp).toBe(r.player.hp-Math.max(0,expected-3));
  });
  it('caps victory healing and preserves lethal HP costs on every difficulty',()=>{
    for(const [level] of cases){
      const r=enterNode(newRun('dev',1,undefined,level));r.enemy.hp=1;r.hand=['dev-0'];
      expect(play(r,0).player.hp).toBe(r.player.max);
      r.player.hp=5;r.player.block=100;r.hand=['dev-13'];
      expect(play(r,0).phase).toBe('lost');expect(play(r,0).enemy.hp).toBe(1);
    }
  });
  it('saves each difficulty and rejects unknown difficulty',()=>{
    for(const [level] of cases){
      const run=enterNode(newRun('spider',2,'venom',level));
      const saved=load({getItem:()=>JSON.stringify({run,best:0,side:'spider'})});
      expect(saved.run).toEqual(run);expect(saved.warning).toBe('');
    }
    expect(isRun({...newRun('dev',1),difficulty:'invalid'})).toBe(false);
    expect(isRun({...newRun('dev',1),difficulty:null})).toBe(false);
  });
  it('old saves continue unchanged with original rules',()=>{
    const run=enterNode(newRun('dev',1));delete run.difficulty;
    const saved=load({getItem:()=>JSON.stringify({run,best:0,side:'dev'})});
    expect(saved.run).toEqual(run);expect(saved.warning).toBe('');
    expect(intent(run).damage).toBe(6);expect(endTurn(run).player.hp).toBe(66);
    expect(enterNode({...run,phase:'map',node:1}).enemy.max).toBe(38);
  });
  it('tutorial and default runs keep normal rules',()=>{
    expect(newRun('dev',1).difficulty).toBe('normal');
    for(const side of ['dev','spider'] as Side[]){const l=createLesson(side);expect(l.run.enemy.max).toBe(30);expect(intent(l.run).damage).toBe(6);}
  });
});
