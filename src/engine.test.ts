import { describe, it, expect } from 'vitest';
import { newRun,enterNode,play,endTurn,takeReward,chooseEvent,workshop,isRun,attackValue,type Run } from './engine';
import { cards,cardById,type Side } from './data';
const battle=()=>enterNode(newRun('dev',42));
describe('Правила боя',()=>{
 it('по 18 карт и 6 особых у каждой стороны',()=>{for(const side of ['dev','spider']){expect(cards.filter(c=>c.id.startsWith(side))).toHaveLength(18);expect(cards.filter(c=>c.id.startsWith(side)&&c.hp)).toHaveLength(6);}});
 it('детерминированная раздача и неизменность входа',()=>{const a=newRun('dev',42);expect(enterNode(a)).toEqual(battle());expect(a.phase).toBe('map');expect(battle().hand).toHaveLength(5);});
 it('не хватает энергии / неверный индекс',()=>{const s=battle();s.energy=0;s.hand=['dev-0'];expect(play(s,0)).toBe(s);expect(play(s,-1)).toBe(s);expect(play(s,1.5)).toBe(s);});
 it('броня поглощает урон',()=>{const s=battle();s.hand=['dev-0'];s.enemy.block=5;const r=play(s,0);expect(r.enemy.hp).toBe(28);expect(r.enemy.block).toBe(0);});
 it('цена HP обходит броню; при нуле эффект не исполняется',()=>{const s=battle();s.hand=['dev-15'];s.player.hp=6;s.player.block=100;const r=play(s,0);expect(r.phase).toBe('lost');expect(r.player.hp).toBe(0);expect(r.enemy.hp).toBe(30);});
 it('несмертельная цена оплачивается перед лечением',()=>{const s=battle();s.hand=['dev-15'];s.player.hp=20;expect(play(s,0).player.hp).toBe(22);});
 it('статусы изменяют урон и истекают',()=>{const s=battle();s.enemy.weak=1;s.player.block=0;expect(attackValue(10,{...s.player,weak:1},{...s.enemy,vulnerable:1})).toBe(11);const r=endTurn(s);expect(r.player.hp).toBe(68);expect(r.enemy.weak).toBe(0);});
 it('яд убивает до действия врага, минуя броню',()=>{const s=battle();s.enemy.hp=3;s.enemy.block=99;s.enemy.dot=3;const r=endTurn(s);expect(r.phase).toBe('reward');expect(r.player.hp).toBe(72);});
 it('сброс перемешивается без потери карт',()=>{let s=battle();s.enemy.hp=999;s.enemy.max=999;s.player.hp=999;s.player.max=999;for(let i=0;i<8;i++)s=endTurn(s);expect([...s.hand,...s.draw,...s.discard].sort()).toEqual([...s.deck].sort());});
 it('пустая рука и поражение от атаки',()=>{const s=battle();s.hand=[];s.player.hp=1;expect(endTurn(s).phase).toBe('lost');});
 it('награда однократна и допускает пропуск',()=>{const s=battle();s.enemy.hp=1;s.hand=['dev-0'];const win=play(s,0);expect(win.phase).toBe('reward');const skip=takeReward(win);expect(skip.deck).toEqual(s.deck);expect(skip.node).toBe(1);expect(takeReward(skip)).toBe(skip);expect(takeReward(win,win.rewards[0]).deck).toHaveLength(11);});
 it('смерть на событии и мастерская без лечения',()=>{const s=newRun('dev',1);s.phase='event';s.eventIndex=0;s.player.hp=6;expect(chooseEvent(s,true).phase).toBe('lost');s.phase='rest';s.node=3;s.player.hp=60;expect(workshop(s,'armor').player.hp).toBe(60);expect(workshop(s,'card')).toBe(s);});
 it('валидация сохранений',()=>{expect(isRun(battle())).toBe(true);expect(isRun({})).toBe(false);expect(isRun({...battle(),hand:['evil']})).toBe(false);});
});
// Real engine simulation, no mocked combat. This detects stalls and invalid states, not human difficulty.
function simulate(side:Side,seed:number){let s=newRun(side,seed);let steps=0;while(!['won','lost'].includes(s.phase)&&steps++<1500){
 if(s.phase==='map')s=enterNode(s);
 else if(s.phase==='reward'){const best=[...s.rewards].sort((a,b)=>score(b,s)-score(a,s))[0];s=takeReward(s,best);}
 else if(s.phase==='event')s=chooseEvent(s,false);
 else if(s.phase==='rest')s=workshop(s,'armor');
 else {const options=s.hand.map((id,i)=>({id,i})).filter(({id})=>cardById(id).cost<=s.energy&&cardById(id).hp<s.player.hp-8).sort((a,b)=>score(b.id,s)-score(a.id,s));s=options.length?play(s,options[0].i):endTurn(s);}
 if(!isRun(s))throw Error(`Invalid state ${side} ${seed}`);
 }return {s,steps};}
function score(id:string,s:Run){return cardById(id).effects.reduce((v,e)=>v+({damage:1,block:s.player.block>=16?0:0.8,dot:2,heal:s.player.hp<s.player.max-5?2:0,energy:5,draw:3,weak:3,vulnerable:3}[e.type])*e.value,0)-cardById(id).hp;}
it('2000 полных забегов: обе стороны, без зависаний и повреждений состояния',()=>{const wins:Record<string,number>={dev:0,spider:0};for(const side of ['dev','spider'] as Side[])for(let seed=1;seed<=1000;seed++){const {s,steps}=simulate(side,seed);expect(steps).toBeLessThan(1500);expect(['won','lost']).toContain(s.phase);if(s.phase==='won')wins[side]++;}console.log('Победы бота из 1000:',wins);expect(wins.dev).toBeGreaterThan(0);expect(wins.spider).toBeGreaterThan(0);},60000);
