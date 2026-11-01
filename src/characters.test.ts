import { expect, it } from 'vitest';
import { characters, characterFor } from './characters';
import { cardById } from './data';
import { newRun, enterNode, endTurn, isRun, comboBonus } from './engine';
import { load } from './store';

it.each(characters)('$name: здоровье, колода и сохранение выбранного героя', hero=>{
  const run=newRun(hero.side,42,hero.id);
  expect(run.character).toBe(hero.id);
  expect(run.player.hp).toBe(hero.hp);
  expect(run.player.max).toBe(hero.hp);
  expect(run.deck).toHaveLength(10);
  expect(run.deck.every(id=>!!cardById(id)&&id.startsWith(hero.side))).toBe(true);
  expect(isRun(run)).toBe(true);
  const saved=load({getItem:()=>JSON.stringify({run,best:0,side:hero.side})});
  expect(saved.run).toEqual(run);
  const battle=enterNode(run);
  expect(battle.player.block).toBe(hero.armor);
  expect(battle.enemy.dot).toBe(hero.poison);
  expect(run.player.block).toBe(0);
});
it('стартовые способности повторяются в новом бою, но не каждый ход',()=>{
  const armor=enterNode(newRun('dev',42,'architect'));
  expect(comboBonus(armor)).toBe(3);
  expect(endTurn(armor).player.block).toBe(0);
  expect(enterNode({...armor,phase:'map',node:1}).player.block).toBe(4);
  const poison=enterNode(newRun('spider',42,'venom'));
  expect(comboBonus(poison)).toBe(3);
  const next=endTurn(poison);
  expect(next.enemy.hp).toBe(poison.enemy.hp-2);
  expect(next.enemy.dot).toBe(1);
  expect(enterNode({...next,phase:'map',node:1}).enemy.dot).toBe(2);
});
it('старый забег без персонажа загружается без изменения характеристик',()=>{
  const run=newRun('dev',42);delete run.character;run.player.hp=31;
  expect(isRun(run)).toBe(true);
  expect(load({getItem:()=>JSON.stringify({run,best:1,side:'dev'})}).run).toEqual(run);
  expect(characterFor(run.side,run.character).id).toBe('operator');
});
it('неизвестный герой или герой другой фракции не проходит проверку сохранения',()=>{
  const run=newRun('dev',42);
  expect(isRun({...run,character:'venom'})).toBe(false);
  expect(isRun({...run,character:'missing'})).toBe(false);
  expect(newRun('dev',42,'venom').character).toBe('operator');
});
