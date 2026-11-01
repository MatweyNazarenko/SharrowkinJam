import { cardById, cards, enemies, events, type Side } from './data';
import { characters, characterFor, type CharacterId } from './characters';
import { difficultyFor, isDifficulty, scaledStat, type Difficulty } from './difficulty';
export type Phase = 'map'|'battle'|'reward'|'event'|'rest'|'won'|'lost';
export type Fighter = { hp:number; max:number; block:number; dot:number; weak:number; vulnerable:number };
export type Run = { difficulty?:Difficulty; character?:CharacterId; upgrades?: { attack:number; armor:number }; version:1; side:Side; seed:number; node:number; phase:Phase; player:Fighter; enemy:Fighter; enemyIndex:number; turn:number; energy:number; deck:string[]; draw:string[]; hand:string[]; discard:string[]; rewards:string[]; gold:number; log:string[]; eventIndex:number; battles:number };
const fighter = (hp:number):Fighter => ({hp,max:hp,block:0,dot:0,weak:0,vulnerable:0});
function random(s:Run) { s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
function shuffle(s:Run,a:string[]) { for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function draw(s:Run,n:number) { for(let i=0;i<n;i++){if(!s.draw.length)s.draw=shuffle(s,s.discard.splice(0));const c=s.draw.pop();if(c)s.hand.push(c);} }
function log(s:Run,text:string){s.log=[text,...s.log].slice(0,6);}
export function newRun(side:Side,seed:number,character?:CharacterId,difficulty:Difficulty='normal'):Run {
  const hero=characterFor(side,character);
  return {version:1,side,difficulty,character:hero.id,seed:seed>>>0,node:0,phase:'map',player:fighter(hero.hp),enemy:fighter(1),enemyIndex:0,turn:1,energy:3,deck:hero.deck.map(i=>`${side}-${i}`),draw:[],hand:[],discard:[],rewards:[],gold:0,log:[],eventIndex:0,battles:0};
}
function offers(s:Run){return shuffle(s,cards.filter(c=>c.id.startsWith(s.side)).map(c=>c.id)).slice(0,3);}
function settle(s:Run){
  if(s.player.hp<=0){s.player.hp=0;s.phase='lost';log(s,'Ваше здоровье исчерпано.');}
  else if(s.enemy.hp<=0){s.enemy.hp=0;s.battles++;s.gold+=25;s.phase=s.node===7?'won':'reward';s.rewards=offers(s);const healed=Math.min(difficultyFor(s.difficulty).heal,s.player.max-s.player.hp);s.player.hp+=healed;log(s,`Победа! +25 фрагментов. Восстановлено ${healed} HP.`);}
}
function damage(target:Fighter,amount:number){const absorbed=Math.min(target.block,amount);target.block-=absorbed;target.hp=Math.max(0,target.hp-amount+absorbed);}
export function attackValue(amount:number,source:Fighter,target:Fighter){return Math.floor(amount*(source.weak>0?0.75:1)*(target.vulnerable>0?1.5:1));}
export function comboBonus(s:Run){return s.side==='dev'?(s.player.block>0?3:0):(s.enemy.dot>0?3:0);}
export function cardDamage(s:Run,amount:number){return attackValue(amount+(s.upgrades?.attack??0)+comboBonus(s),s.player,s.enemy);}
export function workshopCard(s:Run){return `${s.side}-${s.node===3?14:17}`;}
export function intent(s:Run){const move=enemies[s.side][s.enemyIndex].intents[(s.turn-1)%enemies[s.side][s.enemyIndex].intents.length];return {...move,damage:scaledStat(move.damage,difficultyFor(s.difficulty).damage)};}
export function enterNode(state:Run):Run {
  if(state.phase!=='map')return state;
  const s=structuredClone(state);
  if(s.node===2){s.phase='event';s.eventIndex=Math.floor(random(s)*events.length);return s;}
  if(s.node===3||s.node===6){s.phase='rest';return s;}
  s.enemyIndex=({0:0,1:1,4:3,5:2,7:4} as Record<number,number>)[s.node];
  s.enemy=fighter(scaledStat(enemies[s.side][s.enemyIndex].hp,difficultyFor(s.difficulty).hp));s.player={...fighter(s.player.max),hp:s.player.hp};
  const hero=characterFor(s.side,s.character);s.player.block=hero.armor;s.enemy.dot=hero.poison;
  s.phase='battle';s.turn=1;s.energy=3;s.hand=[];s.discard=[];s.draw=shuffle(s,[...s.deck]);draw(s,5);s.log=['Бой начался. Изучите намерение противника.'];return s;
}
export function play(state:Run,index:number):Run {
  if(state.phase!=='battle'||!Number.isInteger(index)||index<0||index>=state.hand.length)return state;
  const c=cardById(state.hand[index]);if(c.cost>state.energy)return state;
  const s=structuredClone(state);s.energy-=c.cost;s.hand.splice(index,1);s.discard.push(c.id);
  s.player.hp=Math.max(0,s.player.hp-c.hp);log(s,`${c.name}${c.hp?` · −${c.hp} HP`:''}`);
  // Health is a real cost, not damage: armor cannot absorb it; lethal cost ends the run first.
  if(s.player.hp===0){settle(s);return s;}
  for(const e of c.effects){
    if(e.type==='damage')damage(s.enemy,cardDamage(s,e.value));
    if(e.type==='block')s.player.block+=e.value+(s.upgrades?.armor??0);
    if(e.type==='draw')draw(s,e.value);
    if(e.type==='energy')s.energy+=e.value;
    if(e.type==='heal')s.player.hp=Math.min(s.player.max,s.player.hp+e.value);
    if(e.type==='dot')s.enemy.dot+=e.value;
    if(e.type==='weak')s.enemy.weak+=e.value;
    if(e.type==='vulnerable')s.enemy.vulnerable+=e.value;
  }
  settle(s);return s;
}
export function endTurn(state:Run):Run {
  if(state.phase!=='battle')return state;
  const s=structuredClone(state);s.discard.push(...s.hand);s.hand=[];
  s.enemy.hp=Math.max(0,s.enemy.hp-s.enemy.dot);s.enemy.dot=Math.max(0,s.enemy.dot-1);settle(s);if(s.phase!=='battle')return s;
  s.enemy.block=0;const move=intent(s);const hit=attackValue(move.damage,s.enemy,s.player);damage(s.player,hit);s.enemy.block=move.block??0;s.player.dot+=move.dot??0;
  log(s,`${enemies[s.side][s.enemyIndex].name}: атака ${hit}${move.dot?' и заражение':''}.`);
  s.enemy.weak=Math.max(0,s.enemy.weak-1);s.enemy.vulnerable=Math.max(0,s.enemy.vulnerable-1);
  s.player.hp=Math.max(0,s.player.hp-s.player.dot);s.player.dot=Math.max(0,s.player.dot-1);s.player.block=0;
  s.turn++;s.energy=3;draw(s,5);settle(s);return s;
}
export function takeReward(state:Run,id?:string):Run {
  if(state.phase!=='reward'||(id&&!state.rewards.includes(id)))return state;
  const s=structuredClone(state);if(id)s.deck.push(id);s.rewards=[];s.node++;s.phase='map';return s;
}
export function chooseEvent(state:Run,accept:boolean):Run {
  if(state.phase!=='event')return state;const s=structuredClone(state);const e=events[s.eventIndex];
  if(accept){s.player.hp=Math.max(0,s.player.hp-e.hp);if(s.player.hp===0){s.phase='lost';return s;}
    if(e.reward==='card')s.deck.push(`${s.side}-${12+Math.floor(random(s)*6)}`);
    if(e.reward==='gold')s.gold+=45;
    if(e.reward==='max'){s.player.max+=12;s.player.hp+=12;}
    if(e.reward==='heal')s.player.hp=Math.min(s.player.max,s.player.hp+12);
  }s.node++;s.phase='map';return s;
}
// Keep the legacy phase name so existing saves at a rest node open the workshop.
export function workshop(state:Run,choice:'attack'|'armor'|'card'):Run {
  if(state.phase!=='rest'||!['attack','armor','card'].includes(choice)||(choice==='card'&&state.gold<40))return state;
  const s=structuredClone(state);
  s.upgrades??={attack:0,armor:0};
  if(choice==='card'){s.gold-=40;s.deck.push(workshopCard(s));}
  else s.upgrades[choice]+=2;
  log(s,choice==='card'?'Выбрана особая карта. −40 фрагментов.':choice==='attack'?'Все атакующие карты: +2 урона до конца забега.':'Все защитные карты: +2 брони до конца забега.');
  s.node++;s.phase='map';return s;
}
export function isRun(value:unknown):value is Run {
  if(!value||typeof value!=='object')return false;const s=value as Run;
  const validFighter=(f:Fighter)=>f&&['hp','max','block','dot','weak','vulnerable'].every(k=>Number.isFinite(f[k as keyof Fighter])&&f[k as keyof Fighter]>=0)&&f.max>0&&f.hp<=f.max;
  return (s.difficulty===undefined||isDifficulty(s.difficulty))&&(s.character===undefined||characters.some(c=>c.id===s.character&&c.side===s.side))&&(s.upgrades===undefined||(!!s.upgrades&&[s.upgrades.attack,s.upgrades.armor].every(n=>Number.isInteger(n)&&n>=0&&n<=4)))&&s.version===1&&['dev','spider'].includes(s.side)&&['map','battle','reward','event','rest','won','lost'].includes(s.phase)&&Number.isInteger(s.node)&&s.node>=0&&s.node<=7&&Number.isInteger(s.enemyIndex)&&s.enemyIndex>=0&&s.enemyIndex<5&&Number.isInteger(s.eventIndex)&&s.eventIndex>=0&&s.eventIndex<4&&Number.isFinite(s.seed)&&Number.isInteger(s.turn)&&s.turn>0&&Number.isFinite(s.gold)&&s.gold>=0&&Number.isFinite(s.energy)&&s.energy>=0&&Number.isInteger(s.battles)&&s.battles>=0&&validFighter(s.player)&&validFighter(s.enemy)&&[s.deck,s.draw,s.hand,s.discard,s.rewards].every(a=>Array.isArray(a)&&a.every(id=>typeof id==='string'&&!!cardById(id)&&id.startsWith(s.side)))&&Array.isArray(s.log)&&s.log.every(x=>typeof x==='string');
}
