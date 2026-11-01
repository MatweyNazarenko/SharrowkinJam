import { useState } from 'react';
import { cardById, effectText, sideName, type Side } from '../data';
import { cardDamage, intent } from '../engine';
import { createLesson, lessonAction, lessonCard, lessonCopy, type Lesson } from '../tutorial';
import { BattleScene } from './BattleScene';
import { useBattlePresentation } from './useBattlePresentation';
import './tutorial.css';
export function Tutorial({side, onClose}:{side:Side; onClose:()=>void}) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selected, setSelected] = useState(side);
  const battleRun = useBattlePresentation(lesson?.run ?? null);
  const act = (action:string) => setLesson(l => l && lessonAction(l, action));
  if (!lesson) return <main className="training training-welcome"><p className="eyebrow">Учебная миссия · 3–5 минут</p><h1>Победи хитростью.</h1><p className="lead">Один короткий бой, одно сочетание карт и первое усиление. Ты играешь сам — инструктор объясняет только следующий шаг.</p><p>Твой обычный забег и рекорд не изменятся. Учебная миссия не сохраняется; её можно повторить в любой момент.</p><div className="choices">{(['dev','spider'] as Side[]).map(s=><button key={s} aria-pressed={selected===s} onClick={()=>setSelected(s)}>{sideName(s)}{selected===s?' ✓':''}</button>)}</div><div className="choices"><button className="primary" onClick={()=>setLesson(createLesson(selected))}>Начать тренировку</button><button onClick={onClose}>Вернуться в игру</button></div></main>;
  const {run:r,step,feedback} = lesson;
  const [title,copy] = lessonCopy(lesson);
  const expected = lessonCard(lesson);
  const progress = r.side==='dev' ? (step>2?step:step+1) : step+1;
  const total = r.side==='dev'?8:9;
  const card = (id:string, index:number, reward=false) => {
    const c=cardById(id);const active=reward || id===expected;
    return <button key={`${id}-${index}`} className={`card ${c.hp?'blood':''} ${active?'training-target':''}`} disabled={!active} onClick={()=>act(id)} aria-label={`${reward?'Взять':'Сыграть'}: ${c.name}`}><div className="card-top"><b className="cost">{c.cost}</b><span>Энергия</span>{c.hp>0&&<strong className="hp-cost">−{c.hp} HP</strong>}</div><div className="card-art">{c.glyph}</div><h3>{c.name}</h3><p>{c.effects.map(e=>effectText(!reward&&e.type==='damage'?{...e,value:cardDamage(r,e.value)}:e,r.side)).join(' · ')}</p><small>{active?'Нажми эту карту': 'Пока не нужна — следуй заданию'}</small></button>;
  };
  return <main className="training"><div className="training-top"><span>{sideName(r.side)} · шаг {progress} из {total}</span><button className="quiet" onClick={onClose}>Выйти из обучения</button></div><progress max={total} value={progress} aria-label="Прогресс обучения"/><section className="training-coach" aria-live="polite"><h2>{title}</h2><p>{copy}</p></section><p role="status" className="training-feedback">{feedback}</p>
    {battleRun&&<BattleScene run={battleRun}/>}
    {step<5&&<><div className="training-arena"><section><h3>Ты</h3><p>Здоровье: <b>{r.player.hp}/{r.player.max} HP</b></p><p>Броня: <b>{r.player.block}</b></p></section><section><h3>Учебный противник</h3><p>Здоровье врага: <b>{r.enemy.hp}/{r.enemy.max} HP</b></p><p>Следующая атака: <b>{intent(r).damage}</b> · Заражение: {r.enemy.dot}</p></section></div><div className="hand-toolbar"><span><b className="energy">{r.energy}</b> энергии из 3</span><button className={step===3?'primary training-target':'primary'} disabled={step!==3} onClick={()=>act('end')}>Завершить ход</button></div><div className="hand">{r.hand.map((id,i)=>card(id,i))}</div></>}
    {step===5&&<><p className="training-stats">Здоровье: {r.player.hp}/{r.player.max} HP · Фрагменты: {r.gold}</p><div className="reward-cards">{r.rewards.map((id,i)=>card(id,i,true))}</div></>}
    {step===6&&<button className="primary" onClick={()=>act('workshop')}>Попробовать мастерскую</button>}
    {step===7&&<div className="choices"><button onClick={()=>act('attack')}>Усилить атаки · +2 урона · бесплатно</button><button onClick={()=>act('armor')}>Усилить защиту · +2 брони · бесплатно</button></div>}
    {step===8&&<section className="training-finish"><h3>Ты уже умеешь</h3><ul><li>Читать намерения и защищаться до атаки врага.</li><li>{r.side==='dev'?'Сочетать броню с атакой.':'Сочетать яд с укусом.'}</li><li>Учитывать энергию и цену собственного здоровья.</li><li>Выбирать награду и постоянное усиление.</li></ul><p>В настоящем бою можно играть любые доступные карты, в любом порядке. Подсказки больше не ограничивают действия.</p><div className="choices"><button className="primary" onClick={onClose}>Готово — вернуться в игру</button><button onClick={()=>setLesson(null)}>Повторить или сменить сторону</button></div></section>}
  </main>;
}
