import type { Side } from './data';

export const characters = [
  {id:'operator', side:'dev', name:'Оператор', role:'Универсальный', hp:72, armor:0, poison:0, variant:0, description:'72 HP и привычная колода. Удобный первый герой: сначала защита, затем атака.', deck:[0,0,0,1,1,1,2,3,12,13]},
  {id:'architect', side:'dev', name:'Архитектор', role:'Защита', hp:80, armor:4, poison:0, variant:1, description:'80 HP. Начинает каждый бой с 4 брони: бонус атак сразу активен. Вместо одного «Коммита» — «Рефакторинг».', deck:[0,0,8,1,1,1,2,3,12,13]},
  {id:'hacker', side:'dev', name:'Взломщик', role:'Быстрая атака', hp:60, armor:0, poison:0, variant:2, description:'60 HP. В стартовой колоде «Кофе» и «Компиляция» вместо одной защиты и одной обычной атаки. Больше темпа, меньше запаса здоровья.', deck:[0,0,4,1,1,9,2,3,12,13]},
  {id:'weaver', side:'spider', name:'Плетельщик', role:'Универсальный', hp:72, armor:0, poison:0, variant:0, description:'72 HP и привычная колода. Наложи яд, чтобы усилить следующие укусы.', deck:[0,0,0,1,1,1,2,3,12,13]},
  {id:'guardian', side:'spider', name:'Панцирник', role:'Выживание', hp:84, armor:4, poison:0, variant:1, description:'84 HP. Начинает каждый бой с 4 брони. Вместо одного «Укуса» — «Кокон»: больше защиты, меньше атак.', deck:[0,0,7,1,1,1,2,3,12,13]},
  {id:'venom', side:'spider', name:'Ядовик', role:'Яд и укусы', hp:60, armor:0, poison:2, variant:2, description:'60 HP. В начале каждого боя накладывает 2 яда: бонус укусов сразу активен. Вместо одного «Хитина» — «Нейротоксин».', deck:[0,0,0,1,1,11,2,3,12,13]},
] as const;
export type CharacterId = typeof characters[number]['id'];
export function characterFor(side:Side, id?:string) {
  return characters.find(c=>c.side===side&&c.id===id) ?? characters[side==='dev'?0:3];
}
