export function Portrait({spider=false,variant=0}:{spider?:boolean;variant?:number}) {
  return <svg className="portrait" viewBox="0 0 300 260" aria-hidden="true">
    <defs><radialGradient id={spider?'aura-s':'aura-d'}><stop stopColor={spider?'#e7a46f':'#ff8a36'} stopOpacity=".18"/><stop offset="1" stopColor="#111" stopOpacity="0"/></radialGradient></defs>
    <circle cx="150" cy="130" r="125" fill={`url(#${spider?'aura-s':'aura-d'})`}/>

    {spider?<g stroke="currentColor" strokeWidth="5" strokeLinejoin="bevel" fill="none">
      <path d="M134 122L82 80 64 32M128 137L59 112 25 66M126 150L52 166 27 218M136 161L94 205 90 249M166 122L218 80 236 32M172 137L241 112 275 66M174 150L248 166 273 218M164 161L206 205 210 249"/>
      <ellipse cx="150" cy="108" rx="30" ry="41" fill="#29231e"/><path d="M130 132L150 123 170 132 177 156 165 179 150 185 135 179 123 156Z" fill="#382b21"/><path d="M140 177l-5 18M160 177l5 18"/><path d="M137 147l8 5M163 147l-8 5" stroke="#f8c58d"/>
    </g>:<g stroke="currentColor" strokeWidth="3" strokeLinejoin="round"><path d="M80 226l15-58 30-20h50l30 20 15 58" fill="#253127"/><path d="M111 100l7-36 32-14 32 14 7 36-10 43-29 20-29-20Z" fill="#151d18"/><path d="M116 98h68l-8 35-26 15-26-15Z" fill="#3b4f35"/><path d="M129 112h12m18 0h12M145 132h10"/><path d="M78 185h144l-13 52H91Z" fill="#172019"/><path d="M139 204l-9 7 9 7m22-14 9 7-9 7" fill="none"/></g>}
    {variant===1&&(spider?<path d="M126 76L150 62 174 76 170 111 150 129 130 111Z" fill="#66503b" stroke="currentColor" strokeWidth="4"/>:<g fill="#66503b" stroke="currentColor" strokeWidth="3"><path d="M77 170l30-15 9 30-35 15Z M223 170l-30-15-9 30 35 15Z"/><path d="M140 76h20v18h-20Z"/></g>)}
    {variant===2&&(spider?<g fill="#efb075"><path d="M150 75l12 30-12 20-12-20Z"/><path d="M136 172l-9 35 18-23M164 172l9 35-18-23"/></g>:<g fill="none" stroke="#ffc488" strokeWidth="4"><path d="M110 90l40-28 40 28M119 107h62M99 179l-9 48M201 179l9 48"/><path d="M130 197l-15 14 15 14m40-28 15 14-15 14"/></g>)}
  </svg>;
}
