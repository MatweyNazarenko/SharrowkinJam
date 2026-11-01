import { create } from 'zustand';
import { isRun, newRun, type Run } from './engine';
import type { Side } from './data';
import type { CharacterId } from './characters';
import type { Difficulty } from './difficulty';
const KEY='sharrowkin-run-v1';
export type Save = {run:Run|null;best:number;side:Side;warning:string};
export function load(storage:Pick<Storage,'getItem'>):Save {
  try { const raw=storage.getItem(KEY);if(!raw)return {run:null,best:0,side:'dev',warning:''};const data=JSON.parse(raw);if((data.run!==null&&!isRun(data.run))||!Number.isInteger(data.best)||data.best<0||!['dev','spider'].includes(data.side))throw Error();return {...data,warning:''}; }
  catch{return {run:null,best:0,side:'dev',warning:'Сохранение недоступно или повреждено. Можно начать новый забег.'};}
}
function initial():Save {try{return load(localStorage);}catch{return {run:null,best:0,side:'dev',warning:'Хранилище недоступно: прогресс сохранится только до закрытия страницы.'};}}
export const useGame=create<Save & { start:(side:Side,character?:CharacterId,difficulty?:Difficulty)=>void; update:(action:(r:Run)=>Run)=>void; menu:()=>void }>((set,get)=>{
  const save=(run:Run|null,side:Side)=>{const best=Math.max(get().best,run?.battles??0);let warning='';try{localStorage.setItem(KEY,JSON.stringify({run,side,best}));}catch{warning='Не удалось сохранить прогресс. Не закрывайте вкладку.';}set({run,side,best,warning});};
  return {...initial(),start:(side,character,difficulty)=>save(newRun(side,Date.now(),character,difficulty),side),update:(action)=>{const r=get().run;if(r)save(action(r),r.side);},menu:()=>save(null,get().side)};
});
