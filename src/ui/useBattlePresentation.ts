import { useEffect, useState } from 'react';
import type { Run } from '../engine';

type BattleKey = Pick<Run, 'side' | 'node' | 'enemyIndex'>;

// Keep the same canvas alive briefly for the final strike. Rewards and save updates
// are immediate: this is only a visual outro, never a delay in the game engine.
export function useBattlePresentation(run: Run | null): Run | null {
  const [battle, setBattle] = useState<BattleKey | null>(run?.phase === 'battle' ? run : null);
  useEffect(() => {
    if (run?.phase === 'battle') {
      setBattle(previous => previous?.side === run.side && previous.node === run.node && previous.enemyIndex === run.enemyIndex
        ? previous : { side: run.side, node: run.node, enemyIndex: run.enemyIndex });
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setBattle(null), reduced ? 0 : 1350);
    return () => window.clearTimeout(timer);
  }, [run]);
  if (run?.phase === 'battle') return run;
  const sameBattle = run && battle && run.side === battle.side && run.node === battle.node && run.enemyIndex === battle.enemyIndex;
  return sameBattle && ['reward', 'won', 'lost'].includes(run.phase) ? run : null;
}
