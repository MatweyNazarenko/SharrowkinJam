import { expect,it } from 'vitest';
import { load } from './store';
import { newRun,enterNode,play } from './engine';
it('сохранение восстанавливает полный ход без потери состояния',()=>{const r=enterNode(newRun('spider',75));const run=play(r,0);const result=load({getItem:()=>JSON.stringify({run,best:2,side:'spider'})});expect(result.run).toEqual(run);expect(result.best).toBe(2);expect(result.warning).toBe('');});
it('повреждённые данные и отказ хранилища не ломают запуск',()=>{for(const getItem of [()=>'{',()=>JSON.stringify({run:{},best:0,side:'dev'}),()=>{throw Error('denied');}]){const r=load({getItem});expect(r.run).toBeNull();expect(r.warning).not.toBe('');}});
