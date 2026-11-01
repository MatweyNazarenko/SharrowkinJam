export type Side = 'dev' | 'spider';
export type Effect = { type: 'damage' | 'block' | 'draw' | 'energy' | 'dot' | 'weak' | 'vulnerable' | 'heal'; value: number };
export type Card = { id: string; name: string; cost: number; hp: number; effects: Effect[]; glyph: string };
const make = (side: Side, names: string[]): Card[] => {
  const specs: [number, number, string, Effect[]][] = [
    [1,0,'↗',[{type:'damage',value:7}]], [1,0,'⬡',[{type:'block',value:7}]],
    [1,0,'◈',[{type:'dot',value:3}]], [0,0,'⌁',[{type:'draw',value:2}]],
    [2,0,'⚡',[{type:'damage',value:16}]], [1,0,'◎',[{type:'weak',value:2},{type:'damage',value:3}]],
    [1,0,'⛶',[{type:'vulnerable',value:2}]], [2,0,'▣',[{type:'block',value:16}]],
    [1,0,'⟡',[{type:'damage',value:5},{type:'block',value:5}]], [0,0,'↯',[{type:'energy',value:1}]],
    [1,0,'✚',[{type:'heal',value:5}]], [2,0,'⟁',[{type:'dot',value:6}]],
    [0,4,'∞',[{type:'energy',value:2},{type:'draw',value:2}]],
    [1,5,'✦',[{type:'damage',value:20}]], [0,4,'◉',[{type:'block',value:14},{type:'draw',value:1}]],
    [1,6,'✳',[{type:'damage',value:16},{type:'heal',value:8}]],
    [0,3,'⧖',[{type:'dot',value:5},{type:'weak',value:1}]],
    [2,8,'✴',[{type:'damage',value:30},{type:'vulnerable',value:2}]],
  ];
  return specs.map(([cost,hp,glyph,effects],i)=>({id:`${side}-${i}`,name:names[i],cost,hp,glyph,effects}));
};
export const cards: Card[] = [
  ...make('dev',['Коммит','Файрвол','Баг','Code review','Компиляция','Троттлинг','Эксплойт','Песочница','Рефакторинг','Кофе','Патч','Утечка памяти','Овертайм','Хотфикс в прод','Аварийный бэкап','Перезапуск','Технический долг','Деплой в пятницу']),
  ...make('spider',['Укус','Хитин','Яд','Чутьё','Прыжок','Липкая нить','Метка добычи','Кокон','Засада','Инстинкт','Регенерация','Нейротоксин','Голод','Кровавый клык','Линька','Кровавый пир','Жертвенная нить','Восемь клинков']),
];
export const cardById = (id: string) => cards.find(c=>c.id===id)!;
export const sideName = (side: Side) => side==='dev'?'Программисты':'Пауки';
export const effectText = (e: Effect, side: Side) => ({damage:`${e.value} урона`,block:`${e.value} брони`,draw:`Взять ${e.value} карт`,energy:`+${e.value} энергии`,dot:`${side==='dev'?'Баг':'Яд'}: ${e.value} урона сквозь броню перед ходом врага`,weak:`−25% атаки врага на ${e.value} ход.`,vulnerable:`+50% урона по врагу на ${e.value} ход.`,heal:`Восстановить ${e.value} HP`})[e.type];
export type Intent = { damage: number; block?: number; dot?: number };
export type EnemyDef = { name: string; hp: number; intents: Intent[] };
export const enemies: Record<Side, EnemyDef[]> = {
  dev: [
    {name:'Паук-разведчик',hp:30,intents:[{damage:6},{damage:9}]},
    {name:'Ткач',hp:38,intents:[{damage:5,block:7},{damage:10}]},
    {name:'Ядовитый охотник',hp:42,intents:[{damage:6,dot:2},{damage:11}]},
    {name:'Страж кокона',hp:58,intents:[{damage:8,block:10},{damage:15},{damage:10,dot:2}]},
    {name:'Королева Sharrowkin',hp:95,intents:[{damage:10,dot:2},{damage:16},{damage:8,block:15}]},
  ],
  spider: [
    {name:'Стажёр',hp:30,intents:[{damage:6},{damage:9}]},
    {name:'Тестировщик',hp:38,intents:[{damage:5,block:7},{damage:10}]},
    {name:'DevOps',hp:42,intents:[{damage:6,dot:2},{damage:11}]},
    {name:'Тимлид',hp:58,intents:[{damage:8,block:10},{damage:15},{damage:10,dot:2}]},
    {name:'Архитектор Sharrowkin',hp:95,intents:[{damage:10,dot:2},{damage:16},{damage:8,block:15}]},
  ],
};
export const route = ['Первый контакт','Глубже в сеть','Неизвестный сигнал','Мастерская','Элитный страж','Последний рубеж','Последнее усиление','Сердце системы'];
export const events = [
  {name:'Запретный архив',text:'Внутри — забытые протоколы и яйца неизвестного вида. Знание требует жертвы.',offer:'Отдать 6 HP → редкая карта',hp:6,reward:'card'},
  {name:'Чужое сердце',text:'Тёплый импульс бьётся под холодным металлом. Его можно присвоить.',offer:'Отдать 5 HP → +12 к максимуму HP',hp:5,reward:'max'},
  {name:'Сломанный автомат',text:'Здесь ещё остался запас питательного раствора. Но контакты оголены.',offer:'Отдать 3 HP → 45 фрагментов',hp:3,reward:'gold'},
  {name:'Эхо прошлого',text:'Следы предыдущей экспедиции ведут к нетронутому тайнику.',offer:'Восстановить 12 HP',hp:0,reward:'heal'},
] as const;
