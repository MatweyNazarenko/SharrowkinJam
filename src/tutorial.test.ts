import { describe, it, expect } from 'vitest';
import { createLesson, lessonAction, lessonCard } from './tutorial';
import { newRun } from './engine';
describe('учебная миссия',()=>{
 for(const side of ['dev','spider'] as const) it(`проходит весь сценарий: ${side}`,()=>{
  let l=createLesson(side);
  const saved=newRun(side,17);const snapshot=JSON.stringify(saved);
  expect(lessonAction(l,'wrong')).toBe(l);
  l=lessonAction(l,lessonCard(l)!);expect(l.run.player.block).toBe(7);
  l=lessonAction(l,lessonCard(l)!);
  if(side==='spider')l=lessonAction(l,lessonCard(l)!);
  expect(l.run.enemy.hp).toBe(20);expect(l.step).toBe(3);
  l=lessonAction(l,'end');expect(l.run.player.hp).toBe(60);expect(l.run.player.block).toBe(0);expect(l.run.energy).toBe(3);expect(l.run.hand).toHaveLength(5);
  l=lessonAction(l,lessonCard(l)!);expect(l.step).toBe(5);expect(l.run.phase).toBe('reward');expect(l.run.player.hp).toBe(67);expect(l.run.gold).toBe(25);
  const reward=l.run.rewards[0];l=lessonAction(l,reward);expect(l.run.deck).toContain(reward);
  l=lessonAction(l,'workshop');expect(l.run.phase).toBe('rest');
  const armor=lessonAction(l,'armor');expect(armor.run.upgrades?.armor).toBe(2);
  l=lessonAction(l,'attack');expect(l.step).toBe(8);expect(l.run.upgrades?.attack).toBe(2);
  expect(JSON.stringify(saved)).toBe(snapshot);
  expect(lessonAction(l,'attack')).toBe(l);
 });
 it('повтор начинается с исходного состояния',()=>{const a=createLesson('dev');lessonAction(a,'dev-1');expect(createLesson('dev')).toEqual(a);});
});
