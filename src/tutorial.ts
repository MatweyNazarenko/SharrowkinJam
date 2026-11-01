import { cardById, type Side } from './data';
import { newRun, enterNode, play, endTurn, takeReward, workshop, type Run } from './engine';
export type Lesson = { run: Run; step: number; feedback: string };
export function createLesson(side: Side): Lesson {
  const run = enterNode(newRun(side, 2026));
  // A fixed hand teaches ordering without depending on a lucky shuffle.
  run.player.hp = 60;
  run.hand = [1, 2, 0, 0, 13].map(i => `${side}-${i}`);
  run.draw = [0, 1, 2, 0, 13].map(i => `${side}-${i}`);
  run.deck = [...run.hand, ...run.draw];
  return { run, step: 0, feedback: 'Это тренировочный бой. Начинаем с 60 из 72 HP, чтобы увидеть лечение после победы.' };
}
export function lessonCard(l: Lesson): string | undefined {
  const index = l.step === 0 ? 1 : l.step === 1 ? (l.run.side === 'spider' ? 2 : 0) : l.step === 2 && l.run.side === 'spider' ? 0 : l.step === 4 ? 13 : undefined;
  return index === undefined ? undefined : `${l.run.side}-${index}`;
}
export function lessonAction(l: Lesson, action: string): Lesson {
  const {run:r, step} = l;
  const expected = lessonCard(l);
  if (expected) {
    if (action !== expected) return l;
    const next = play(r, r.hand.indexOf(expected));
    if (next === r) return l;
    const feedback = step === 0 ? '7 брони готовы. Она поглотит атаку на 6. Потрачена 1 энергия.' : step === 1 && r.side === 'spider' ? 'Яд наложен: укус теперь наносит 10 вместо 7. Перед атакой враг также получит урон от яда.' : step === 4 ? `Цена карты — 5 HP, даже при наличии брони. ${next.log[0]}` : `Сочетание сработало: атака нанесла 10 урона вместо 7. Осталось ${next.energy} энергии.`;
    return {run:next, step:step === 1 && r.side === 'dev' ? 3 : step + 1, feedback};
  }
  if (step === 3 && action === 'end') return {run:endTurn(r), step:4, feedback:'Враг атаковал на 6: броня спасла здоровье. Теперь броня исчезла, энергия снова 3, в руке 5 карт. Неиспользованные карты ушли в сброс.'};
  if (step === 5 && r.rewards.includes(action)) return {run:takeReward(r, action), step:6, feedback:`«${cardById(action).name}» добавлена в учебную колоду. В обычном забеге награду можно пропустить, чтобы не раздувать колоду.`};
  // Skip intervening nodes only inside the isolated training mission.
  if (step === 6 && action === 'workshop') return {run:enterNode({...r, node:3, phase:'map'}), step:7, feedback:'В обучении переместились прямо в мастерскую. В забеге до неё нужно пройти бои и событие. Выберите одно бесплатное усиление.'};
  if (step === 7 && (action === 'attack' || action === 'armor')) return {run:workshop(r, action), step:8, feedback:action === 'attack' ? 'Все атакующие карты получили +2 урона до конца учебного забега.' : 'Все защитные карты получили +2 брони до конца учебного забега.'};
  return l;
}
export function lessonCopy(l: Lesson): [string, string] {
  const spider = l.run.side === 'spider';
  return [
    ['Прочитай врага. Подготовь защиту.', 'Враг собирается атаковать на 6. Нажми защитную карту: 1 энергия даст 7 брони. HP — здоровье; при нуле забег заканчивается.'],
    spider ? ['Сначала яд…', 'Сыграй «Яд». Пока враг заражён, все твои атаки сильнее на 3. Порядок карт имеет значение!'] : ['…затем контратака', 'Пока есть броня, «Коммит» наносит 10 вместо 7. Нажми его и проверь здоровье врага.'],
    ['…затем укус', 'Теперь сыграй «Укус»: заражение усилило его с 7 до 10 урона.'],
    ['Передай ход врагу', 'Нажми «Завершить ход». Броня поглотит атаку. Остаток энергии не переносится, а несыгранные карты уйдут в сброс.'],
    ['Сила за здоровье', 'Сыграй особую карту с красной ценой −5 HP. Цена списывается до эффекта и обходит броню. Если HP не больше цены, карта убьёт тебя — даже с лечением в описании. Здесь здоровья достаточно.'],
    ['Победа — время усилиться', 'Лечение уже произошло: до +12 HP, не выше максимума. Получено 25 фрагментов. Выбери одну из трёх карт для будущих боёв.'],
    ['Что ждёт на маршруте', 'Цель забега — пройти 8 узлов и победить босса. Между боями встречаются события с выбором и мастерские. Отдых искать не нужно: лечение автоматическое.'],
    ['Выбери свой стиль', 'Усиль атаки или защиту бесплатно. В обычной мастерской есть и третья возможность: конкретная показанная карта за 40 фрагментов вместо усиления.'],
    ['Готов к настоящему забегу', 'Смотри на намерение врага → подготовь сочетание → атакуй → заверши ход. Не трать последние HP на особую карту. После победы выбери награду, в мастерской — усиление.'],
  ][l.step] as [string, string];
}
