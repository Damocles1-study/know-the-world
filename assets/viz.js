/* 可视化引擎 —— 声明式：内容文件只写一小段 JSON，这里负责画
   支持 11 种：bars stack stat split flow pyramid steps quad ice curve table
   规范速查见 README.md */
(function(){
const esc = s => String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const C = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
const col = (x,i)=> x || C[i%6];

const R = {

// 横向条形对比 {items:[[名,值,色?],…], unit, max?}
bars(v){
  const mx = v.max || Math.max(...v.items.map(i=>Math.abs(i[1])));
  return v.items.map((it,i)=>`<div class="vb" style="--k:${col(it[2],i)}">
    <span class="n">${esc(it[0])}</span>
    <span class="t"><i style="width:${Math.max(1.5,Math.abs(it[1])/mx*100)}%"></i></span>
    <span class="v">${esc(it[3]!==undefined?it[3]:it[1]+(v.unit||''))}</span></div>`).join('');
},

// 一条被切开的百分比 {parts:[[名,值,色?],…], unit}
stack(v){
  const tot = v.parts.reduce((a,b)=>a+b[1],0);
  return `<div class="vstack">${v.parts.map((p,i)=>
    `<div style="width:${p[1]/tot*100}%;background:${col(p[2],i)}">${p[1]/tot>.1?Math.round(p[1]/tot*100)+'%':''}</div>`).join('')}</div>
  <div class="vlegend">${v.parts.map((p,i)=>
    `<span><s style="background:${col(p[2],i)}"></s>${esc(p[0])} ${p[1]}${v.unit||''}</span>`).join('')}</div>`;
},

// 大数字 {items:[[数,说明,色?],…]}
stat(v){
  return `<div class="vstat">${v.items.map((it,i)=>
    `<div style="--k:${col(it[2],i)}"><b>${esc(it[0])}</b><span>${esc(it[1])}</span></div>`).join('')}</div>`;
},

// 两栏对照 {left:{t,items}, right:{t,items}}
split(v){
  const side = (s,k)=>`<div style="--k:${k}"><h5>${esc(s.t)}</h5><ul>${s.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`;
  return `<div class="vsplit">${side(v.left,v.lc||'var(--c3)')}${side(v.right,v.rc||'var(--c1)')}</div>`;
},

// 资金/流程链 {nodes:[[名,注?],…], edges:[标签,…]}
flow(v){
  let h='';
  v.nodes.forEach((n,i)=>{
    const nn = Array.isArray(n)?n:[n,''];
    h += `<div class="nd">${esc(nn[0])}${nn[1]?`<em>${esc(nn[1])}</em>`:''}</div>`;
    if(i<v.nodes.length-1) h += `<div class="ar" style="--k:${v.ec||'var(--c3)'}"><u>→</u>${v.edges&&v.edges[i]?esc(v.edges[i]):''}</div>`;
  });
  return `<div class="vflow">${h}</div>`;
},

// 金字塔 {layers:[[名,注,色?],…] 从顶到底}
pyramid(v){
  const n = v.layers.length;
  return `<div class="vpyr">${v.layers.map((l,i)=>{
    const w = 34 + (i/(n-1||1))*62;
    return `<div class="ly" style="width:${w}%;background:${col(l[2], n-1-i)}">${esc(l[0])}${l[1]?`<em>${esc(l[1])}</em>`:''}</div>`;
  }).join('')}</div>`;
},

// 时间线/剧本 {items:[[标题,说明],…], c?}
steps(v){
  return `<ul class="vsteps" style="--k:${v.c||'var(--c4)'}">${v.items.map(i=>
    `<li><b>${esc(i[0])}</b><span>${esc(i[1]||'')}</span></li>`).join('')}</ul>`;
},

// 四象限 {x:[左,右], y:[上,下], items:[[标题,说明],…] 顺序:左上 右上 左下 右下}
quad(v){
  return `<div class="vaxis"><span>↑ ${esc(v.y[0])}</span></div>
  <div class="vquad">${v.items.map(i=>`<div><b>${esc(i[0])}</b>${esc(i[1]||'')}</div>`).join('')}</div>
  <div class="vaxis"><span>${esc(v.x[0])}</span><span>${esc(v.y[1])} ↓</span><span>${esc(v.x[1])}</span></div>`;
},

// 冰山 {above:[…], below:[…]}
ice(v){
  return `<div class="vice"><h5>${esc(v.at||'水面上 · 他让你看见的')}</h5>
    <ul>${v.above.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
    <div class="wl"><span>水面</span></div>
    <h5>${esc(v.bt||'水面下 · 真正决定结果的')}</h5>
    <ul class="dn">${v.below.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`;
},

// 折线 {x:[…], series:[{n,c?,p:[…]}], unit?}
curve(v){
  const W=640,H=250,L=44,R2=14,T=14,B=28;
  const all = v.series.flatMap(s=>s.p);
  let lo = Math.min(...all), hi = Math.max(...all);
  if(v.zero!==false) lo = Math.min(0,lo);
  const pad = (hi-lo)*.08 || 1; hi+=pad;
  const X = i => L + i*(W-L-R2)/(v.x.length-1);
  const Y = y => T + (1-(y-lo)/(hi-lo))*(H-T-B);
  const fmt = n => (Math.abs(n)>=1e4? (n/1e4).toFixed(n%1e4?1:0)+'万' : (Number.isInteger(n)?n:n.toFixed(1)));
  let g='';
  for(let i=0;i<=4;i++){
    const y = lo + (hi-lo)*i/4;
    g += `<line x1="${L}" y1="${Y(y)}" x2="${W-R2}" y2="${Y(y)}" stroke="var(--line)" stroke-width="1"/>
          <text x="${L-8}" y="${Y(y)+3.5}" text-anchor="end">${fmt(y)}</text>`;
  }
  const xs = v.x.map((t,i)=> (v.x.length>7 && i%2) ? '' :
    `<text x="${X(i)}" y="${H-8}" text-anchor="middle">${esc(t)}</text>`).join('');
  const paths = v.series.map((s,si)=>{
    const c = col(s.c,si);
    const d = s.p.map((y,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(y).toFixed(1)}`).join('');
    const area = `${d}L${X(s.p.length-1).toFixed(1)},${Y(Math.max(lo,0))}L${X(0)},${Y(Math.max(lo,0))}Z`;
    const last = s.p[s.p.length-1];
    return `<path d="${area}" fill="${c}" opacity=".07"/>
      <path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${X(s.p.length-1).toFixed(1)}" cy="${Y(last).toFixed(1)}" r="3.4" fill="${c}"/>
      <text x="${X(s.p.length-1)-4}" y="${Y(last)-11}" text-anchor="end" fill="${c}" style="font-size:11.5px;font-weight:600">${esc(s.n)} ${fmt(last)}${v.unit||''}</text>`;
  }).join('');
  return `<div class="vcurve"><svg viewBox="0 0 ${W} ${H}">${g}${xs}${paths}</svg></div>`;
},

// 小表格 {head:[…], rows:[[…],…]}
table(v){
  return `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
  <tr>${v.head.map(h=>`<th style="text-align:left;padding:8px 10px;color:var(--fg3);font-weight:600;font-size:11.5px;letter-spacing:.06em;border-bottom:1px solid var(--line2)">${esc(h)}</th>`).join('')}</tr>
  ${v.rows.map(r=>`<tr>${r.map((c,i)=>`<td style="padding:9px 10px;border-bottom:1px solid var(--line);color:${i?'var(--fg2)':'var(--fg)'};line-height:1.6">${esc(c)}</td>`).join('')}</tr>`).join('')}
  </table></div>`;
}
};

window.VIZ = function(v){
  if(!v || !R[v.type]) return '';
  const note = v.note ? esc(v.note).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code>$1</code>') : '';
  return `<figure class="viz">${v.t?`<div class="viz-t">${esc(v.t)}</div>`:''}${R[v.type](v)}${note?`<p class="viz-note">${note}</p>`:''}</figure>`;
};
})();
