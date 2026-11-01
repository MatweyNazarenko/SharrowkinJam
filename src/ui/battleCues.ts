import { cardById, type Card } from '../data';
import { attackValue, cardDamage, intent, type Run } from '../engine';

export type Actor = 'player' | 'enemy';
export type CueKind = 'attack' | 'cast' | 'guard' | 'hit' | 'poison' | 'heal' | 'power' | 'cost';
export type BattleCue = { actor: Actor; kind: CueKind; delay: number; amount?: number };

function playedCards(before: Run, after: Run): Card[] {
  // The discard can be reshuffled by a draw card, so include newly prepended log entries.
  // Match the whole name, not substrings, and require the card to have been in hand.
  const names = before.hand.map(cardById);
  const appended = after.discard.slice(before.discard.length);
  if (after.discard.length > before.discard.length && before.discard.every((id, i) => id === after.discard[i])) {
    return appended.map(cardById);
  }
  const result: Card[] = [];
  for (const line of after.log) {
    const card = names.find(c => line === `${c.name}${c.hp ? ` · −${c.hp} HP` : ''}`);
    if (card) { result.unshift(card); break; }
    if (before.log.includes(line)) break;
  }
  return result;
}

// Presentation only: no state mutations, randomness or changes to the save schema.
export function battleCues(before: Run, after: Run): BattleCue[] {
  if (before === after || before.phase !== 'battle' || before.node !== after.node || before.side !== after.side || before.enemyIndex !== after.enemyIndex) return [];
  const cues: BattleCue[] = [];
  const add = (actor: Actor, kind: CueKind, delay = 0, amount?: number) => cues.push({ actor, kind, delay, amount });
  const turnEnded = after.turn > before.turn
    || after.battles > before.battles && after.enemy.dot < before.enemy.dot;
  if (turnEnded) {
    if (before.enemy.dot > 0) add('enemy', 'poison', 0, Math.min(before.enemy.hp, before.enemy.dot));
    // Infection can end the battle before the enemy gets an action.
    if (before.enemy.dot >= before.enemy.hp) return cues;
    const move = intent(before), hit = attackValue(move.damage, before.enemy, before.player);
    if (hit > 0) {
      add('enemy', 'attack', 160);
      if (before.player.block > 0) add('player', 'guard', 390, Math.min(hit, before.player.block));
      if (hit > before.player.block) add('player', 'hit', 440, Math.min(before.player.hp, hit - before.player.block));
    }
    if (move.block) add('enemy', 'guard', 500, move.block);
    const poison = before.player.dot + (move.dot ?? 0);
    if (poison) add('player', 'poison', 730, poison);
    return cues;
  }
  for (const [i, card] of playedCards(before, after).entries()) {
    const start = i * 170;
    if (card.hp) add('player', 'cost', start, card.hp);
    if (card.hp >= before.player.hp) continue; // A lethal health price prevents every effect.
    const damage = card.effects.filter(e => e.type === 'damage').reduce((sum, e) => sum + cardDamage(before, e.value), 0);
    if (damage) {
      add('player', 'attack', start);
      if (before.enemy.block > 0) add('enemy', 'guard', start + 260, Math.min(damage, before.enemy.block));
      if (damage > before.enemy.block) add('enemy', 'hit', start + 290, Math.min(before.enemy.hp, damage - before.enemy.block));
    }
    if (card.effects.some(e => ['dot', 'weak', 'vulnerable'].includes(e.type))) {
      add('player', 'cast', start);
      add('enemy', 'poison', start + 350, card.effects.find(e => e.type === 'dot')?.value);
    }
    if (card.effects.some(e => e.type === 'block')) add('player', 'guard', start, after.player.block - before.player.block);
    if (card.effects.some(e => e.type === 'heal') && after.player.hp + card.hp > before.player.hp) add('player', 'heal', start + 100);
    if (card.effects.some(e => e.type === 'draw' || e.type === 'energy')) add('player', 'power', start);
  }
  return cues;
}
