/* Nihoban — Prefixes (接頭辞): 64 Japanese prefixes in 15 groups, with Bangla
   and English meanings and 247 example words. Browsable by category or search,
   each prefix expands to its examples (with speech), plus a short quiz. */
(()=>{
const CATB=["সম্মানসূচক ও ভদ্র উপসর্গ","নেতিবাচকতা ও বিপরীত","মাত্রা, আকার ও তীব্রতা","সময়, ক্রম ও ধারাবাহিকতা","অবস্থান, স্তর ও শ্রেণিবিভাগ","নিজ, নতুন ও পুরোনো","পরিমাণ, বহুত্ব ও সীমাবদ্ধতা","সাধারণ, পারস্পরিক ও সংযোগ","সর্বোচ্চ, চরম ও প্রধান","নেতিবাচক মূল্যায়ন ও ভুল","দেশীয় ক্রিয়া ও বিশেষণের উপসর্গ","ভূমিকা, মর্যাদা ও সংগঠন","কম্পাঙ্ক, ক্রম ও সংখ্যা","কথ্য ও জোরালো উপসর্গ","ঋণশব্দের উপসর্গ"];
const PX={cat:-1,q:"",open:null,mode:"browse"};
let PD=null,FL=[];

const cname=ci=>S.lang=="bn"?(CATB[ci]||PD.c[ci][0]):PD.c[ci][0];
const pmean=p=>bn()?mk(p[4]):p[3];
const emean=e=>bn()?mk(e[4]):e[3];
const pname=p=>bn()?p[4].replace(/\u2063/g,""):p[3];
const key=x=>x.ci+":"+x.pi;
const examples=p=>p[5].length;
const all=()=>{
  if(FL.length)return FL;
  PD.c.forEach((c,ci)=>c[2].forEach((p,pi)=>FL.push({ci,pi,p})));
  return FL;
};
const match=(x,q)=>{
  if(!q)return true;
  const p=x.p,s=[p[0],p[1],p[2],p[3],p[4]].join(" ")+" "+p[5].map(e=>e.join(" ")).join(" ");
  return s.toLowerCase().includes(q);
};
const filtered=()=>{const q=PX.q.trim().toLowerCase();return all().filter(x=>(PX.cat<0||x.ci==PX.cat)&&match(x,q))};

const card=(x)=>{
  const p=x.p,k=key(x),open=PX.open==k;
  return `<article class="pxCard ${open?'open':''}" id="pxc-${x.ci}-${x.pi}">
<button class="pxHead" data-pxp="${k}" aria-expanded="${open}" aria-label="${esc(p[0])} ${esc(p[2])} — ${esc(pname(p))}">
  <span class="pxGlyph jp" aria-hidden="true">${esc(p[0])}</span>
  <span class="pxTxt"><b>${esc(p[2])}</b><small>${pmean(p)}</small></span>
  <span class="pxCount" aria-label="${examples(p)} ${t('examples','উদাহরণ')}">${examples(p)}</span>
</button>
${open?`<div class="pxBody">
  <div class="pxKana jp">${esc(p[1])}</div>
  <ul class="pxEx">
    ${p[5].map(e=>`<li><button class="pxSay" data-say="${esc(e[0])}" aria-label="${t('Listen','শুনুন')} ${esc(e[0])}">${ic('spk',15)}</button>
      <div class="pxExTxt"><span class="pxW jp">${esc(e[0])}</span><span class="pxK jp">${esc(e[1])}</span><span class="pxR">${esc(e[2])}</span>
      <div class="pxD">${emean(e)}</div></div></li>`).join("")}
  </ul>
</div>`:""}
</article>`;
};

const listHTML=()=>{
  const f=filtered();
  if(!f.length)return `<p class="mute pxEmpty">${t('No prefix matches that search.','এই অনুসন্ধানে কোনো উপসর্গ মেলেনি।')}</p>`;
  const by={};f.forEach(x=>(by[x.ci]??=[]).push(x));
  return Object.keys(by).map(ci=>{const c=PD.c[ci],items=by[ci];
    return `<section class="pxGroup">
<h3>${esc(cname(+ci))}</h3>
${bn()&&c[1]?`<p class="mute pxGd">${mk(esc(c[1]))}</p>`:""}
<div class="pxCards">${items.map(card).join("")}</div>
</section>`}).join("");
};
const countHTML=()=>{const f=filtered(),ne=f.reduce((a,x)=>a+examples(x.p),0);
  return `${f.length.toLocaleString()} ${t(f.length==1?'prefix':'prefixes','উপসর্গ')} · ${ne.toLocaleString()} ${t(ne==1?'example':'examples','উদাহরণ')}`};

const browseHTML=()=>`<div class="pxBar">
<input id="pxQ" type="search" placeholder="${t('Search prefix, word or meaning…','উপসর্গ, শব্দ বা অর্থ খুঁজুন…')}" aria-label="${t('Search prefixes','উপসর্গ খুঁজুন')}" value="${esc(PX.q)}">
</div>
${chips([[-1,t('All','সব')],...PD.c.map((c,i)=>[i,cname(i)])],PX.cat,'data-pxc')}
<div class="pxMeta"><span id="pxCnt">${countHTML()}</span><button class="btn o pxRnd" id="pxRnd">${t('Random prefix','এলোমেলো উপসর্গ')}</button></div>
<div id="pxList">${listHTML()}</div>`;

const qzHTML=()=>{
  const z=PX.quiz;
  if(!z)return `<button class="btn pxStart" data-pxr>${t('Start the quiz','কুইজ শুরু করুন')}</button>`;
  if(z.i>=z.qs.length){
    const pct=Math.round(z.score/z.qs.length*100);
    return `<div class="card pxDone"><div class="pxScore">${z.score}/${z.qs.length}</div>
<p class="mute">${pct>=80?t('Excellent — you know your prefixes.','দুর্দান্ত — উপসর্গগুলো আপনার আয়ত্তে।'):t('Good start. Browse the list and try again.','ভালো শুরু। তালিকা দেখে আবার চেষ্টা করুন।')}</p>
<button class="btn" data-pxr>${t('Play again','আবার খেলুন')}</button>
<button class="btn o" data-pxv="browse">${t('Browse prefixes','উপসর্গ দেখুন')}</button></div>`;
  }
  const q=z.qs[z.i],ans=z.ans,kind=q.kind;
  const prompt=kind=="m"?t('What does this prefix mean?','এই উপসর্গের অর্থ কী?'):t('Which prefix means this?','কোন উপসর্গের অর্থ এটি?');
  return `<div class="pxMeta"><span>${t('Question','প্রশ্ন')} ${z.i+1} / ${z.qs.length}</span><span>${t('Score','স্কোর')} ${z.score}</span></div>
<div class="card pxQCard">
  <div class="pxPrompt">${prompt}</div>
  ${kind=="m"?`<div class="pxBigGlyph jp">${esc(q.x.p[0])}</div><div class="pxBigKana">${esc(q.x.p[1])} · ${esc(q.x.p[2])}</div>`
   :`<div class="pxBigMean">${pmean(q.x.p)}</div>`}
  <div class="pxOpts ${kind}">
  ${q.opts.map((o,i)=>{
    const cls=ans==null?"":o===q.x?"good":(ans===i?"bad":"");
    return `<button class="pxOpt ${cls}" data-pxa="${i}" ${ans!=null?"disabled":""} aria-pressed="${ans===i}">
      ${kind=="m"?`<span>${pmean(o.p)}</span>`:`<b class="jp">${esc(o.p[0])}</b><small>${esc(o.p[2])}</small>`}
    </button>`}).join("")}
  </div>
  ${ans==null?`<p class="pxHint mute">${t('Tap the answer you think is right.','আপনার মতে সঠিক উত্তরটি বেছে নিন।')}</p>`:
   `<div class="pxFb ${q.opts[ans]===q.x?'good':'bad'}">${q.opts[ans]===q.x?t('Correct.','সঠিক।'):t('Not quite — the answer is highlighted.','ঠিক নয় — সঠিক উত্তরটি চিহ্নিত করা আছে।')}</div>
    <button class="btn" data-pxn>${z.i+1>=z.qs.length?t('See results','ফলাফল দেখুন'):t('Next','পরেরটি')}</button>`}
</div>`;
};

const bodyHTML=()=>PX.mode=="quiz"?qzHTML():browseHTML();
const draw=()=>{const b=$("#pxBody");if(!b||!PD)return;b.innerHTML=bodyHTML();
  $$("#pxTabs .tab").forEach(n=>{const on=n.dataset.pxv==PX.mode;n.classList.toggle("on",on);n.setAttribute("aria-current",on?"true":"false")})};
const drawList=()=>{const l=$("#pxList");if(!l)return;l.innerHTML=listHTML();const c=$("#pxCnt");if(c)c.textContent=countHTML()};

const makeQuiz=()=>{
  const pool=[...all()].sort(()=>Math.random()-.5).slice(0,10);
  const qs=pool.map((x,i)=>{
    const same=pmean(x.p);
    const others=[...all()].filter(y=>y!==x&&pmean(y.p)!==same).sort(()=>Math.random()-.5).slice(0,3);
    return {x,kind:i%2?"k":"m",opts:[x,...others].sort(()=>Math.random()-.5)};
  });
  PX.quiz={qs,i:0,score:0,ans:null};
};

V.px=()=>{if(cur()!="px")return;
  M.innerHTML=`<a class="back" href="#library">${ic('back',18)} ${t('Library','লাইব্রেরি')}</a><h2>${t('Prefixes','উপসর্গ')}</h2>
<p class="mute" style="margin:-4px 0 10px"><small>${t('Japanese prefixes (接頭辞) change a word’s meaning before it starts — politeness, negation, size, time and more. Tap a prefix for examples.','জাপানি উপসর্গ (接頭辞) শব্দের শুরুতে যোগ হয়ে অর্থ বদলায় — সম্মান, নেতিবাচকতা, আকার, সময় ইত্যাদি। উদাহরণ দেখতে উপসর্গে চাপ দিন।')}</small></p>
<div class="px">
  <div class="tabs" id="pxTabs" role="group" aria-label="${t('View','দেখার ধরন')}">
    <button class="tab on" data-pxv="browse"><i></i>${t('Browse','তালিকা')}</button>
    <button class="tab" data-pxv="quiz"><i></i>${t('Quiz','কুইজ')}</button>
  </div>
  <div id="pxBody"></div>
</div>`;
  draw()};
TAB.px="library";

(async()=>{try{PD=await dec('px');if(cur()=='px')V.px()}catch(e){}})();

document.addEventListener("click",e=>{
  if(cur()!="px")return;const root=e.target.closest(".px");if(!root)return;
  const b=e.target.closest("button");if(!b)return;const d=b.dataset;
  if(d.pxv){PX.mode=d.pxv;if(PX.mode=="quiz"&&!PX.quiz)PX.quiz=null;draw();scrollTo(0,0)}
  else if(d.pxc!==undefined){PX.cat=+d.pxc;PX.open=null;draw()}
  else if(d.pxp){PX.open=PX.open==d.pxp?null:d.pxp;drawList()}
  else if(b.id=="pxRnd"){const f=filtered();if(!f.length)return;const x=f[Math.random()*f.length|0];PX.open=key(x);drawList();$("#pxc-"+x.ci+"-"+x.pi)?.scrollIntoView({behavior:"smooth",block:"center"})}
  else if(d.pxr!==undefined){makeQuiz();draw();scrollTo(0,0)}
  else if(d.pxa!==undefined){const z=PX.quiz;if(!z||z.ans!=null)return;z.ans=+d.pxa;if(z.qs[z.i].opts[z.ans].ok)z.score++;draw()}
  else if(d.pxn!==undefined){const z=PX.quiz;if(!z)return;z.i++;z.ans=null;draw();scrollTo(0,0)}
});

document.addEventListener("input",e=>{if(cur()!="px"||e.target.id!="pxQ")return;PX.q=e.target.value;drawList()});
})();
