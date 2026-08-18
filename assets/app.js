/* 认识世界 — 应用外壳：路由 / 渲染 / 搜索 / 进度 / 工具箱交互 */
(function(){
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code>$1</code>')
  .replace(/&lt;(\/?b)&gt;/g,'<$1>');   // 内容里允许 <b> 作为轻量强调
const TAG = {idea:['概念','var(--idea)'],scam:['骗局','var(--scam)'],word:['话术','var(--word)'],
             mind:['心智','var(--mind)'],life:['处世','var(--life)'],rule:['规则','var(--rule)'],tool:['工具','var(--gold)']};

/* ── 状态 ── */
const LS = {
  get read(){ try{ return new Set(JSON.parse(localStorage.rw||'[]')) }catch(e){ return new Set() } },
  set read(s){ localStorage.rw = JSON.stringify([...s]) },
  get theme(){ return localStorage.th || 'dark' }, set theme(v){ localStorage.th = v }
};
let read = LS.read;
const ALL = () => W.vols.flatMap(v=>v.items.filter(i=>!i.kind));

/* ── 主题 ── */
document.documentElement.dataset.theme = LS.theme;
$('#btn-theme').onclick = ()=>{
  const t = document.documentElement.dataset.theme === 'dark' ? 'light':'dark';
  document.documentElement.dataset.theme = LS.theme = t;
};

/* ── 侧栏 ── */
function nav(){
  const cur = (location.hash.match(/#\/(\w+)/)||[])[1];
  $('#nav-inner').innerHTML = `<p class="nav-t">目录</p>` + W.vols.map(v=>{
    const on = v.id===cur;
    return `<a class="nav-v${on?' on':''}" href="#/${v.id}" style="--k:${v.c}"><b>${v.n}</b>${esc(v.t)}<em>${esc(v.s)}</em></a>` +
      (on ? `<div class="nav-sub">${v.items.map(i=>
        `<a href="#/${v.id}/${i.id}" class="${read.has(i.id)?'read':''}">${esc(i.t)}</a>`).join('')}</div>` : '');
  }).join('');
}

/* ── 词条 ── */
function entry(it, n){
  const [tl,tc] = TAG[it.tag] || TAG.idea;
  const list = a => `<ul>${a.map(x=>`<li>${md(x)}</li>`).join('')}</ul>`;
  return `<article class="entry" id="${it.id}" style="--k:${tc}">
    <div class="ehead"><span class="enum">${String(n).padStart(2,'0')}</span>
      <div class="etitle"><h3>${esc(it.t)}${it.en?`<em>${esc(it.en)}</em>`:''}</h3><span class="tag">${tl}</span></div></div>
    <p class="one">${md(it.one)}</p>
    ${it.why?`<div class="blk"><span class="lb">为什么普通人吃亏</span><p>${md(it.why)}</p></div>`:''}
    ${it.an?`<div class="blk"><span class="lb">打个比方</span><p>${md(it.an)}</p></div>`:''}
    ${it.viz?VIZ(it.viz):''}
    ${it.real?`<div class="blk"><span class="lb">现实里长这样</span>${list(it.real)}</div>`:''}
    ${it.viz2?VIZ(it.viz2):''}
    ${it.do?`<div class="blk do"><span class="lb">怎么办</span>${list(it.do)}</div>`:''}
    ${it.see&&it.see.length?`<div class="see">延伸 ${it.see.map(id=>{
      const o = W.get(id); return o?`<a href="#/${o.v}/${o.id}">${esc(o.t)}</a>`:'';}).join('')}</div>`:''}
  </article>`;
}

/* ── 特殊模块 ── */
function special(it){
  if(it.kind==='quiz') return `<article class="entry" id="${it.id}" style="--k:var(--gold)">
    <div class="ehead"><span class="enum">◆</span><div class="etitle"><h3>${esc(it.t)}</h3><span class="tag">工具</span></div></div>
    <p class="one">${md(it.one)}</p>
    ${it.qs.map((q,i)=>`<div class="quiz" data-a="${q.a}"><p class="qq"><i>${String(i+1).padStart(2,'0')}</i>${md(q.q)}</p>
      ${q.o.map((o,j)=>`<button class="opt" data-i="${j}">${md(o)}</button>`).join('')}
      <div class="exp" hidden>${md(q.e)}</div></div>`).join('')}</article>`;

  if(it.kind==='check') return `<article class="entry" id="${it.id}" style="--k:var(--gold)">
    <div class="ehead"><span class="enum">◆</span><div class="etitle"><h3>${esc(it.t)}</h3><span class="tag">工具</span></div></div>
    <p class="one">${md(it.one)}</p>
    <div class="chk">${it.groups.map(g=>`<h5>${esc(g.t)}</h5>`+g.items.map(x=>
      `<label><input type="checkbox"><span>${md(x)}</span></label>`).join('')).join('')}
      <div class="score">命中 <b>0</b> 条 · <span>0 条即可放心，1 条就要停下来查，3 条以上基本可以判定是局</span></div></div></article>`;

  if(it.kind==='gloss'){
    const a = ALL().slice().sort((x,y)=>x.t.localeCompare(y.t,'zh'));
    return `<article class="entry" id="${it.id}" style="--k:var(--gold)">
      <div class="ehead"><span class="enum">◆</span><div class="etitle"><h3>${esc(it.t)}</h3><span class="tag">工具</span></div></div>
      <p class="one">${md(it.one)}</p>
      <div class="gloss">${a.map(i=>`<a href="#/${i.v}/${i.id}"><b>${esc(i.t)}</b><span>${esc(i.one.replace(/\*\*/g,''))}</span></a>`).join('')}</div></article>`;
  }
  return '';
}

/* ── 页面 ── */
function home(){
  const total = ALL().length, done = ALL().filter(i=>read.has(i.id)).length;
  return `<section class="hero">
    <p class="eyebrow">A FIELD GUIDE TO THE WORLD</p>
    <h1>认识世界</h1>
    <h2>信息差、资源交换，与那些没人告诉你的规则</h2>
    <p class="lead">这个世界上大部分让你吃亏的事，本质只有两种：<strong>你不知道的信息</strong>，和<strong>你算错的交换</strong>。</p>
    <p class="lead">骗局不是因为骗子聪明，是因为它站在你认知的盲区里。而绝大多数盲区，都有名字——它们躺在金融、法律、心理学最基础的那一层词汇里，从来不难，只是没人对你讲人话。</p>
    <p class="lead">这本书把它们一条条挖出来，讲清楚：<strong>它是什么、像什么、现实里长什么样、你该怎么办。</strong></p>
    <div class="meta">
      <div><b>${total}</b>词条</div>
      <div><b>${W.vols.length}</b>卷</div>
      <div><b>${done}</b>已读</div>
      <div><b>${total?Math.round(done/total*100):0}%</b>进度</div>
    </div></section>
    <div class="grid">${W.vols.map(v=>{
      const n = v.items.length, r = v.items.filter(i=>read.has(i.id)).length;
      return `<a class="vcard" href="#/${v.id}" style="--k:${v.c}"><i>卷 ${v.n}</i><h3>${esc(v.t)}</h3><p>${esc(v.d)}</p>
        <span>${n} 条 · 已读 ${r}</span></a>`;}).join('')}</div>
    <div class="wrap" style="margin-top:56px;font-size:12.5px;color:var(--fg3);line-height:1.9;border-top:1px solid var(--line);padding-top:20px">
      本书为认知科普与反诈读物，<strong style="color:var(--fg2)">不构成任何投资建议</strong>。所有案例均取自公开报道，用于说明机制而非指认个体。<br>
      快捷键：<code>⌘K</code> 搜索 · <code>←</code> <code>→</code> 翻卷 · 滚动即自动记录已读。</div>`;
}

function volume(v){
  const i = W.vols.indexOf(v), p = W.vols[i-1], nx = W.vols[i+1];
  let n = 0;
  return `<section class="vhead" style="--k:${v.c}"><i>卷 ${v.n}</i><h1>${esc(v.t)}</h1><p>${esc(v.d)}</p></section>` +
    v.items.map(it=> it.kind ? special(it) : entry(it, ++n)).join('') +
    `<div class="pager">${p?`<a href="#/${p.id}"><i>← 上一卷</i><b>${esc(p.t)}</b></a>`:'<span style="flex:1"></span>'}
      ${nx?`<a class="r" href="#/${nx.id}"><i>下一卷 →</i><b>${esc(nx.t)}</b></a>`:'<span style="flex:1"></span>'}</div>`;
}

/* ── 路由 ── */
let curVol = null;
function route(){
  const m = location.hash.match(/#\/(\w+)(?:\/([\w-]+))?/);
  const v = m && W.index[m[1]];
  curVol = v || null;
  $('#main').innerHTML = v ? volume(v) : home();
  nav();
  document.body.classList.remove('nav');
  if(m && m[2]){
    const el = document.getElementById(m[2]);
    if(el){ el.scrollIntoView(); window.scrollBy(0,-8); return observe(); }
  }
  window.scrollTo(0,0);
  observe();
}

/* ── 已读追踪 ── */
let io;
function observe(){
  if(io) io.disconnect();
  io = new IntersectionObserver(es=>{
    let ch=false;
    es.forEach(e=>{ if(e.isIntersecting && !read.has(e.target.id)){ read.add(e.target.id); ch=true; } });
    if(ch){ LS.read = read; document.querySelectorAll('.nav-sub a').forEach(a=>{
      const id=a.hash.split('/')[2]; if(read.has(id)) a.classList.add('read'); }); }
  },{threshold:.35});
  document.querySelectorAll('.entry').forEach(e=>io.observe(e));
}
addEventListener('scroll',()=>{
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#bar i').style.width = (h>0? scrollY/h*100:0)+'%';
},{passive:true});

/* ── 搜索 ── */
const box = $('#search'), qi = $('#q');
let sel = 0, hits = [];
function openS(){ box.hidden=false; qi.value=''; qi.focus(); render(''); }
function closeS(){ box.hidden=true; }
function render(q){
  q = q.trim().toLowerCase();
  const pool = ALL();
  hits = q ? pool.filter(i=>(i.t+i.en+i.one+(i.k||'')).toLowerCase().includes(q)).slice(0,40)
           : pool.slice().sort(()=>Math.random()-.5).slice(0,8);
  sel = 0;
  $('#results').innerHTML = hits.length ? hits.map((i,n)=>{
    const [tl,tc] = TAG[i.tag]||TAG.idea;
    return `<a href="#/${i.v}/${i.id}" class="${n===0?'sel':''}" style="--k:${tc}"><b>${esc(i.t)}</b><u>${tl}</u>
      <span>${esc(i.one.replace(/\*\*/g,''))}</span></a>`;}).join('')
    : `<div class="empty">没找到「${esc(q)}」<br>试试：庞氏 / 日息 / 冻卡 / 锚定 / 杠杆</div>`;
}
qi.oninput = e => render(e.target.value);
$('#btn-search').onclick = openS;
box.onclick = e => { if(e.target===box) closeS(); };
$('#btn-random').onclick = ()=>{
  const pool = ALL(), un = pool.filter(i=>!read.has(i.id));
  const i = (un.length?un:pool)[Math.floor(Math.random()*(un.length||pool.length))];
  location.hash = `#/${i.v}/${i.id}`;
};
$('#menu').onclick = ()=> document.body.classList.toggle('nav');
$('#scrim').onclick = ()=> document.body.classList.remove('nav');

addEventListener('keydown', e=>{
  if((e.metaKey||e.ctrlKey) && e.key==='k'){ e.preventDefault(); box.hidden?openS():closeS(); return; }
  if(!box.hidden){
    if(e.key==='Escape') closeS();
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault(); sel = Math.max(0,Math.min(hits.length-1, sel+(e.key==='ArrowDown'?1:-1)));
      const as = $('#results').children; [...as].forEach((a,i)=>a.classList.toggle('sel',i===sel)); as[sel]?.scrollIntoView({block:'nearest'});
    }
    if(e.key==='Enter' && hits[sel]){ location.hash = `#/${hits[sel].v}/${hits[sel].id}`; closeS(); }
    return;
  }
  if(e.target.tagName==='INPUT') return;
  if(e.key==='/'){ e.preventDefault(); openS(); }
  if((e.key==='ArrowLeft'||e.key==='ArrowRight') && curVol){
    const i = W.vols.indexOf(curVol) + (e.key==='ArrowRight'?1:-1);
    if(W.vols[i]) location.hash = `#/${W.vols[i].id}`;
  }
});

/* ── 工具箱交互 ── */
document.addEventListener('click', e=>{
  const o = e.target.closest('.opt');
  if(o){
    const q = o.closest('.quiz'); if(q.dataset.done) return;
    q.dataset.done = 1;
    const a = +q.dataset.a;
    q.querySelectorAll('.opt').forEach((b,i)=>{ if(i===a) b.classList.add('ok'); else if(b===o) b.classList.add('no'); });
    q.querySelector('.exp').hidden = false;
  }
});
document.addEventListener('change', e=>{
  if(e.target.type!=='checkbox') return;
  const c = e.target.closest('.chk'); if(!c) return;
  const n = c.querySelectorAll('input:checked').length;
  const s = c.querySelector('.score');
  s.querySelector('b').textContent = n;
  s.querySelector('span').textContent = n===0 ? '暂时没有红旗 —— 但别忘了「说不清怎么赚钱」本身就是最大的红旗'
    : n<3 ? '出现红旗了。先停下来，把这几条一个一个查清楚再说'
    : n<6 ? '多点命中。到这一步，正常的机会几乎不可能长这样'
    : '这不是「要小心」，这是「已经在局里」。别再投入，保留证据';
  s.style.color = n===0?'var(--life)': n<3?'var(--word)':'var(--scam)';
});

addEventListener('hashchange', route);
route();
})();
