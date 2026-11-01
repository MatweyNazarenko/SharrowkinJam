import { expect, it } from 'vitest';
import { newRun, enterNode, play, takeReward, workshop, workshopCard, isRun, endTurn } from './engine';
import { load } from './store';
it('лечение однократно после победы, не выше максимума',()=>{
 const s=enterNode(newRun('dev',1)); s.player.hp=30;s.enemy.hp=1;s.hand=['dev-0'];
 const won=play(s,0);expect(won.player.hp).toBe(42);expect(won.gold).toBe(25);
 expect(takeReward(won).player.hp).toBe(42);expect(endTurn(won)).toBe(won);
 s.player.hp=70;expect(play(s,0).player.hp).toBe(72);expect(s.player.hp).toBe(70);
});
it('броня затем атака: бонус программистов; без брони бонуса нет',()=>{
 const s=enterNode(newRun('dev',1));s.hand=['dev-1','dev-0'];
 expect(play(play(s,0),0).enemy.hp).toBe(20);expect(play(s,1).enemy.hp).toBe(23);
});
it('яд затем укус: бонус пауков',()=>{
 const s=enterNode(newRun('spider',1));s.hand=['spider-2','spider-0'];
 expect(play(play(s,0),0).enemy.hp).toBe(20);expect(play(s,1).enemy.hp).toBe(23);
});
it('усиления сохраняются между боями и складываются',()=>{
 const s=newRun('dev',1);s.phase='rest';s.node=3;
 const first=workshop(s,'attack');expect(first.upgrades?.attack).toBe(2);
 expect(workshop(first,'attack')).toBe(first);expect(s.upgrades).toBeUndefined();
 first.phase='rest';first.node=6;const second=workshop(first,'attack');
 const fight=enterNode(second);fight.hand=['dev-0'];expect(play(fight,0).enemy.hp).toBe(84);
 expect(isRun(second)).toBe(true);
});
it('бонус брони применяется к карте',()=>{
 const s=newRun('dev',1);s.phase='rest';s.node=3;
 const fight=enterNode(workshop(s,'armor'));fight.hand=['dev-1'];expect(play(fight,0).player.block).toBe(9);
});
it('покупка именно показанной карты и точное списание',()=>{
 const s=newRun('spider',1);s.phase='rest';s.node=6;s.gold=39;
 expect(workshop(s,'card')).toBe(s);s.gold=40;const r=workshop(s,'card');
 expect(r.deck.at(-1)).toBe(workshopCard(s));expect(r.gold).toBe(0);expect(r.deck.length).toBe(11);
});
it('старое сохранение отдыха открывается без потери колоды, здоровья, рекорда',()=>{
 const run=newRun('dev',123);run.phase='rest';run.node=3;run.player.hp=28;
 const loaded=load({getItem:()=>JSON.stringify({run,best:4,side:'dev'})});
 expect(loaded.run).toEqual(run);expect(loaded.best).toBe(4);
 const next=workshop(loaded.run!,'armor');expect(next.player.hp).toBe(28);expect(next.deck).toEqual(run.deck);
 const restored=load({getItem:()=>JSON.stringify({run:next,best:4,side:'dev'})});expect(restored.run).toEqual(next);
 expect(isRun({...run,upgrades:{attack:-2,armor:0}})).toBe(false);
});
