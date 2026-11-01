export type Difficulty = 'easy' | 'normal' | 'hard';
export const difficulties = [
  { id:'easy', name:'Лёгкий', description:'Больше свободы для знакомства с героями и сочетаниями.', hp:0.8, damage:0.8, heal:16, details:'Здоровье и атаки врагов −20%. После победы до +16 HP.' },
  { id:'normal', name:'Обычный', description:'Исходные правила. Планируй защиту и цену особых карт.', hp:1, damage:1, heal:12, details:'Здоровье и атаки врагов без изменений. После победы до +12 HP.' },
  { id:'hard', name:'Сложный', description:'Более стойкие враги, меньше права на ошибку.', hp:1.25, damage:1.25, heal:8, details:'Здоровье и атаки врагов +25%. После победы до +8 HP.' },
] as const;
// Missing difficulty means the original rules, including in old saves and lessons.
export function difficultyFor(id?:Difficulty) { return difficulties.find(d=>d.id===id) ?? difficulties[1]; }
export function isDifficulty(value:unknown):value is Difficulty { return difficulties.some(d=>d.id===value); }
export function scaledStat(value:number, multiplier:number) { return Math.round(value*multiplier); }
