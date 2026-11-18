
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)],M=$('#M'),DL=$('#DL');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S={lang:'en',ml:'bn',typed:0,decks:[],kana:{},lvl:'N5',nv:10,nk:3,ng:1,fur:1,roma:1,th:'auto',srs:{},days:{}},D,B={},V={},Q=null,F=null,tot=0,Z=null;
try{Object.assign(S,JSON.parse(localStorage.getItem('jb')||'{}'))}catch(e){}S.roma??=1;S.fur??=1;
const save=()=>{try{localStorage.setItem('jb',JSON.stringify(S))}catch(e){}};
const LV=['N5','N4','N3','N2','N1'],TY={v:'শব্দ',k:'কাঞ্জি',g:'ব্যাকরণ'},T={vocab:'v',kanji:'k',grammar:'g'},GL=['ভুল','কঠিন','ঠিক','সহজ'];
const day=(o=0)=>new Date(Date.now()+o*864e5).toLocaleDateString('en-CA');
const fur=s=>esc(s).replace(/\{([^|}]+)\|([^}]+)\}/g,S.fur?'<ruby>$1<rt>$2</rt></ruby>':'$1');
const say=t=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}};
const sh=a=>[...a].sort(()=>Math.random()-.5);
const title=x=>x.ty=='v'?x.w:x.ty=='k'?x.c:x.p;
const mk=s=>s?'\u2063'+s+'\u2063':s,hira=s=>s.replace(/\./g,'').replace(/[\u30A1-\u30F6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)),bn=()=>S.ml=='bn',gm=x=>bn()?mk(x.mb):x.m,gloss=x=>x.ty=='v'?((bn()&&mk(x.bn.join('; ')))||x.en.join('; ')):x.ty=='k'?((bn()&&mk(x.bn.join(', ')))||x.en.join(', ')):gm(x);
const g1=x=>(bn()&&mk(x.bn?.[0]))||x.en?.[0]||'';
const theme=()=>{S.th=='auto'?document.documentElement.removeAttribute('data-theme'):document.documentElement.dataset.theme=S.th;const c=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();$$('meta[name=theme-color]').forEach(m=>m.content=c)};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(S.th=='auto')theme()});
const ex=e=>e?`<div class="ex"><p class="jp">${fur(e[1]||e[0])} <button class="lk" data-say="${esc(e[0])}">শুনুন</button></p>${e[3]&&bn()?`<p>${esc(mk(e[3]))}</p>`:''}<p class="mute">${esc(e[2])}</p></div>`:'';
const chips=(a,cur,attr)=>`<div class="chips">${a.map(([v,l])=>`<button class="${v==cur?'on':''}" ${attr}="${v}">${l}</button>`).join('')}</div>`;

async function load(){D=await dec('d');
D.m={};D.vm={};
for(const t of'vkg')for(const x of D[t]){x.id=x.i||x.c;x.ty=t;D.m[t+x.id]=x}
for(const x of D.v){x._=(x.w+x.r+x.o+x.en.join()+x.bn.join()).toLowerCase();D.vm[x.w]=x}
for(const x of D.k)x._=(x.c+x.on+x.kun+x.en.join()+x.bn.join()).toLowerCase();
for(const x of D.g)x._=(x.p+x.o+x.m+x.mb).toLowerCase();
D.k.sort((a,b)=>(a.f||9999)-(b.f||9999))}

// spaced repetition
function calc(c,g){c={ease:2.5,ivl:0,reps:0,lapse:0,...c};
if(!g){c.lapse++;c.reps=0;c.ivl=0;c.ease=Math.max(1.3,c.ease-.2)}
else{c.reps++;c.ivl=c.reps==1?[0,1,1,3][g]:Math.round(Math.max(1,c.ivl)*[0,1.2,c.ease,c.ease*1.4][g]);if(g==1)c.ease=Math.max(1.3,c.ease-.15);if(g==3)c.ease+=.15}
c.due=c.ivl?Date.now()+c.ivl*864e5:Date.now()+6e5;return c}
const log=(t,nw)=>{const d=S.days[day()]||={r:0,n:{v:0,k:0,g:0}};d.r++;if(nw)d.n[t]++};
const streak=()=>{let n=0,o=S.days[day()]?.r?0:-1;for(;S.days[day(o)]?.r;o--)n++;return n};
function queue(){const now=Date.now(),due=sh(Object.keys(S.srs).filter(k=>S.srs[k].due<=now&&D.m[k]));
const d=S.days[day()]?.n||{v:0,k:0,g:0},lim={v:S.nv,k:S.nk,g:S.ng};
const nw=['v','k','g'].map(t=>D[t].filter(x=>x.l==S.lvl&&!S.srs[t+x.id]).slice(0,Math.max(0,lim[t]-d[t])).map(x=>t+x.id)),f=[];
for(let i=0;nw.some(a=>i<a.length);i++)nw.forEach(a=>a[i]&&f.push(a[i]));return due.concat(f)}
function gr(g){const k=Q.shift(),nw=!S.srs[k];S.srs[k]=calc(S.srs[k],g);log(k[0],nw);if(!g)Q.splice(Math.min(3,Q.length),0,k);save();F=null;V.study()}

// views
V.home=()=>{const q=queue(),due=q.filter(k=>S.srs[k]).length,nw=q.length-due,d=S.days[day()]?.r||0;
const pr=t=>{const a=D[t].filter(x=>x.l==S.lvl),s=a.filter(x=>S.srs[t+x.id]);return{n:a.length,s:s.length,m:s.filter(x=>S.srs[t+x.id].ivl>=21).length}};
const st=new Date();st.setHours(0,0,0,0);const f=Array(7).fill(0);Object.values(S.srs).forEach(c=>{const i=Math.max(0,Math.floor((c.due-st)/864e5));if(i<7)f[i]++});const mx=Math.max(1,...f);
const wd=['রবি','সোম','মঙ্গল','বুধ','বৃহ','শুক্র','শনি'];
M.innerHTML=`<h2>আজকের পড়া</h2><div class="card"><p><b style="font-size:34px">${due}</b> রিভিউ &nbsp; <b style="font-size:34px">${nw}</b> নতুন</p><p class="mute">আজ ${d}টি কার্ড করেছেন। টানা ${streak()} দিন।</p><br><a class="btn" href="#study">${q.length?'অনুশীলন শুরু করুন':'আজকের কাজ শেষ'}</a></div>
<h3>স্তর</h3>${chips(LV.map(l=>[l,l]),S.lvl,'data-lvl')}
<div class="card">${['v','k','g'].map(t=>{const p=pr(t);return`<div class="stat"><span>${TY[t]}</span><span class="mute">${p.m} আয়ত্ত, ${p.s} শুরু, মোট ${p.n}</span></div><div class="bar"><s style="width:${p.s/p.n*100}%"></s><b style="width:${p.m/p.n*100}%"></b></div>`}).join('')}</div>
<h3>আগামী ৭ দিনের রিভিউ</h3><div class="card"><div class="fcst">${f.map(n=>`<div style="height:${n/mx*100}%" title="${n}"></div>`).join('')}</div><div class="fl">${f.map((n,i)=>`<span>${n}<br>${wd[(new Date().getDay()+i)%7]}</span>`).join('')}</div></div>`};

V.study0=()=>{if(!Q){Q=DK?sh(DK.filter(k=>D.m[k])):queue();tot=Q.length;F=null}
if(!Q.length){M.innerHTML=`<div class="card fc"><h2>আজকের পর্ব শেষ</h2><p class="mute">আজ ${S.days[day()]?.r||0}টি কার্ড করেছেন। রোজ অল্প করে করলেই মনে থাকে।</p><a class="btn" href="#quiz">কুইজ দিন</a></div>`;return}
const k=Q[0],x=D.m[k],c=S.srs[k];if(F?.k!=k)F={k,rev:x.ty=='v'&&c?.reps>1&&Math.random()<.5,sh:0};const rv=F.rev;
const front=rv?`<div class="ans">${esc(gloss(x))}</div>`:x.ty=='g'?`<div class="mid">${esc(x.p)}</div>`:`<div class="sq"><span class="big">${esc(title(x))}</span></div>`;
const back=x.ty=='v'?`${rv?`<div class="big">${esc(x.w)}</div>`:''}<div class="mute">${esc(x.r)} (${esc(x.o)}) <button class="lk" data-say="${esc(x.r)}">শুনুন</button></div>${rv?'':`<div class="ans">${esc(gloss(x))}</div>`}<div class="mute">${(bn()?esc(x.en.join('; ')):'')}</div>${ex(x.x[0])}`
:x.ty=='k'?`<div class="ans">${esc(gloss(x))}</div><div>অন: <span class="jp">${esc(x.on.join('、'))}</span></div><div>কুন: <span class="jp">${esc(x.kun.join('、'))}</span></div><div class="mute">${x.s} স্ট্রোক, রেডিকাল ${esc(x.rad)}</div><div id="so"></div>`
:`<div class="ans">${esc(gm(x))}</div><div class="mute">${esc(x.fm)}</div>${ex(x.x[0])}`;
M.innerHTML=`<div class="stat"><span>${Q.length} বাকি</span><span class="mute">${TY[x.ty]} ${x.l}${c?'':', নতুন'}</span></div><div class="bar"><b style="width:${Math.max(0,(tot-Q.length)/tot*100)}%"></b></div><br>
<div class="card fc">${front}${F.res?`<p class="ans" style="color:var(--${F.res>0?'ok':'no'})">${F.res>0?t('Correct','সঠিক'):t('Not quite','হয়নি')}: ${esc(F.ty)}</p>`:''}${F.sh?`<div style="width:100%">${back}</div>`:''}</div>
${F.sh?`<div class="gs">${[0,1,2,3].map(g=>`<button data-g="${g}">${GL[g]}<small>${calc(c,g).ivl?calc(c,g).ivl+' দিন':'১০ মিনিট'}</small></button>`).join('')}</div>`:(S.typed&&x.ty!='g'?tin(x):`<button class="btn" style="width:100%" data-a="show">উত্তর দেখুন</button>`)}`};

function det(k){const x=D.m[k];if(!x)return;let h=`<button class="lk" style="float:right" data-a="close">বন্ধ</button>`;
if(x.ty=='v')h+=`<div class="wrow"><span class="big">${esc(x.w)}</span><span class="wrd jp">${esc(x.r)}</span>${S.roma?`<span class="wro">${esc(x.o)}</span>`:''}</div><p><button class="lk" data-say="${esc(x.r)}">শুনুন</button></p><h3>${esc(gloss(x))}</h3><p class="mute">${(bn()?esc(x.en.join('; ')):'')}</p><p>${x.p.slice(0,3).map(p=>`<span class="tag" title="${esc(D.pos[p]?.[0])}">${esc((bn()?mk(D.pos[p]?.[1]):D.pos[p]?.[0])||p)}</span>`).join('')}</p>${x.f.length?`<p class="mute">অন্য রূপ: ${esc(x.f.join('、'))}</p>`:''}${x.x.map(ex).join('')}`;
if(x.ty=='k')h+=`<div class="sq" style="margin:0 auto"><span class="big">${x.c}</span></div><h3>${esc(gloss(x))}</h3><p class="mute">${(bn()?esc(x.en.join(', ')):'')}</p><p>${bn()?esc(x.bd||''):esc(x.ds||'')}</p><p>অন: <span class="jp">${esc(x.on.join('、'))}</span><br>কুন: <span class="jp">${esc(x.kun.join('、'))}</span><br>হিরাগানা: <span class="jp">${esc(hira(x.on.join('、')))}</span> / <span class="jp">${esc(hira(x.kun.join('、')))}</span></p><p class="mute">${x.s} স্ট্রোক, রেডিকাল ${esc(x.rad)}${x.g?`, গ্রেড ${x.g}`:''}${(x.bg||x.uw)?`<br>${x.bg?`${x.bg} টি শব্দ এটি দিয়ে শুরু হয়`:''}${x.bg&&x.uw?' · ':''}${x.uw?`${x.uw} টি শব্দে ব্যবহৃত`:''}`:''}</p><h3>এই কাঞ্জির শব্দ</h3><div class="chips">${x.w.filter(w=>D.vm[w]).map(w=>`<button class="jp" data-k="v${D.vm[w].id}">${esc(w)} <small>${esc(g1(D.vm[w]))}</small></button>`).join('')}</div>`;
if(x.ty=='g')h+=`<div class="mid">${esc(x.p)}</div><h3>${esc(gm(x))}</h3><p class="mute">${bn()?esc(x.m):''}</p><p>গঠন: <b>${esc(x.fm)}</b></p><p>${(x.tg||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</p>${x.nb&&bn()?`<p>${esc(mk(x.nb))}</p>`:''}${x.x.map(ex).join('')}`;
h+=`<br>${S.srs[k]?'<p class="mute">রিভিউ তালিকায় আছে।</p>':`<button class="btn" data-a="add" data-id="${esc(k)}">রিভিউতে যোগ করুন</button>`}`;
h+=(x.ty=='k'?'<h3>'+t('Stroke order','স্ট্রোক ক্রম')+'</h3><div id="so"></div>':'')+dkui(k);DL.innerHTML=h;DL.open||DL.showModal();if(x.ty=='k')drawSO(x.c,DL.querySelector('#so'))}

function browse(r){const t=T[r],b=B[t]||={q:'',lv:'all',n:60};
M.innerHTML=`<h2>${TY[t]}</h2>${chips([['all','সব'],...LV.map(l=>[l,l])],b.lv,'data-lv')}<input id="q" type="search" placeholder="জাপানি, romaji, ইংরেজি বা বাংলায় খুঁজুন" value="${esc(b.q)}"><div id="list"></div>`;fill(t)}
function fill(t){const b=B[t],q=b.q.toLowerCase().trim(),a=D[t].filter(x=>(b.lv=='all'||x.l==b.lv)&&(!q||x._.includes(q))),s=a.slice(0,b.n);
const one=x=>t=='k'?`<button class="kt" data-k="k${x.c}"><b>${x.c}</b><span>${esc(g1(x))}</span></button>`:`<button class="row" data-k="${t+x.id}"><span class="w">${esc(title(x))}</span><span class="mute">${t=='v'?esc(x.r):''}</span><span class="g">${esc(gloss(x))}</span><em>${x.l}${S.srs[t+x.id]?' ✓':''}</em></button>`;
$('#list').innerHTML=`<p class="mute" style="margin:10px 0">${a.length}টি পাওয়া গেছে</p>${t=='k'?`<div class="kg">${s.map(one).join('')}</div>`:s.map(one).join('')}${a.length>b.n?`<p><br><button class="btn o" data-a="more">আরও দেখান</button></p>`:''}`}
V.vocab=()=>browse('vocab');V.kanji=()=>browse('kanji');V.grammar=()=>browse('grammar');

function qstart(t){const pool=D[t].filter(x=>x.l==S.lvl&&g1(x));
Z={t,i:0,s:0,w:[],a:null,qs:sh(pool).slice(0,10).map(x=>{const rev=t=='v'&&Math.random()<.5;let d=sh(pool.filter(y=>y!=x));d=[...d.filter(y=>y.p?.[0]==x.p?.[0]),...d].filter((y,i,a)=>a.indexOf(y)==i&&g1(y)!=g1(x)).slice(0,3);return{x,rev,o:sh([x,...d])}})}}
V.quiz=()=>{if(!Z){M.innerHTML=`<h2>কুইজ</h2><p class="mute">${S.lvl} স্তর, ১০টি প্রশ্ন। ভুল উত্তরগুলো আপনার রিভিউতে যোগ হবে।</p><div class="chips"><button class="btn" data-a="qs" data-t="v">শব্দ কুইজ</button><button class="btn o" data-a="qs" data-t="k">কাঞ্জি কুইজ</button></div>`;return}
if(Z.i>=Z.qs.length){M.innerHTML=`<div class="card fc"><div class="big">${Z.s}/${Z.qs.length}</div>${Z.w.length?`<p class="mute">যেগুলো ভুল হয়েছে:</p><div class="chips">${Z.w.map(x=>`<button class="jp" data-k="${Z.t+x.id}">${esc(title(x))}</button>`).join('')}</div>`:'<p>সবগুলো সঠিক!</p>'}<button class="btn" data-a="qs" data-t="${Z.t}">আবার খেলুন</button></div>`;return}
const q=Z.qs[Z.i],x=q.x,an=Z.a!=null;
M.innerHTML=`<div class="stat"><span>প্রশ্ন ${Z.i+1}/${Z.qs.length}</span><span class="mute">সঠিক ${Z.s}</span></div><div class="card fc">${q.rev?`<div class="ans">${esc(g1(x))}</div>`:`<div class="big">${esc(title(x))}</div>`}</div><div class="opts">${q.o.map((y,i)=>`<button class="opt ${an?(y==x?'ok':i==Z.a?'no':''):''}" data-a="qa" data-i="${i}" ${an?'disabled':''}><span class="${q.rev?'jp':''}">${esc(q.rev?title(y):g1(y))}</span></button>`).join('')}</div>${an?`<br><button class="btn" data-a="qn">${Z.i+1<Z.qs.length?'পরের প্রশ্ন':'ফলাফল'}</button>`:''}`};

V.settings=()=>{M.innerHTML=`<h2>সেটিংস</h2><h3>${t('Language','ভাষা')}</h3>${chips([['en','English'],['bn','বাংলা']],S.lang,'data-lang')}<h3>${t('Meanings','অর্থের ভাষা')}</h3>${chips([['bn','বাংলা'],['en','English']],S.ml,'data-ml')}<h3>${t('Typed answers','টাইপ করে উত্তর')}</h3>${chips([[1,t('On','চালু')],[0,t('Off','বন্ধ')]],S.typed,'data-typed')}<h3>স্তর</h3>${chips(LV.map(l=>[l,l]),S.lvl,'data-lvl')}
<h3>প্রতিদিন নতুন কার্ড</h3><div class="card" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[['nv','শব্দ'],['nk','কাঞ্জি'],['ng','ব্যাকরণ']].map(([n,l])=>`<label>${l}<input type="number" min="0" max="50" value="${S[n]}" data-n="${n}"></label>`).join('')}</div>
<h3>ফুরিগানা</h3>${chips([[1,'দেখান'],[0,'লুকান']],S.fur,'data-fur')}<h3>থিম</h3>${chips([['auto','অটো'],['light','হালকা'],['dark','গাঢ়']],S.th,'data-th')}
<h3>ডেটা ব্যাকআপ</h3><textarea id="bk" placeholder="এখানে ব্যাকআপ কোড পেস্ট করুন"></textarea><p><br><button class="btn o" data-a="exp">ব্যাকআপ তৈরি করুন</button> <button class="btn o" data-a="imp">রিস্টোর করুন</button> <button class="btn o" data-a="rst">সব মুছুন</button></p><p class="mute">অগ্রগতি শুধু এই ব্রাউজারে জমা থাকে।</p><p class="mute"><small>Stroke data: KanjiVG, CC BY-SA 3.0.</small></p>`};

function route(){const r=location.hash.slice(1)||'home';if(!V[r]&&!T[r])return location.hash='home';
if(r!='study')Q=null,DK=null;if(r!='quiz')Z=null;DL.open&&DL.close();
$$('nav a').forEach(a=>a.classList.toggle('on',a.hash=='#'+r));(V[r]||V.home)();scrollTo(0,0)}
const cur=()=>location.hash.slice(1)||'home';

document.addEventListener('click',e=>{const t=e.target.closest('[data-a],[data-k],[data-say],[data-lvl],[data-lv],[data-g],[data-fur],[data-roma],[data-th]');if(!t)return;const d=t.dataset,r=cur();
if(d.say)return say(d.say);if(d.k)return det(d.k);
if(d.lv){B[T[r]].lv=d.lv;B[T[r]].n=60;return V[r]()}
if(d.lvl){S.lvl=d.lvl;save();Q=null;return V[r]()}
if(d.fur!=null){S.fur=+d.fur;save();return V[r]()}if(d.roma!=null){S.roma=+d.roma;save();return V[r]()}if(d.th){S.th=d.th;save();theme();return V[r]()}
if(d.g!=null)return gr(+d.g);
const a=d.a;
if(a=='show'){F.sh=1;V.study()}
else if(a=='close')DL.close();
else if(a=='more'){B[T[r]].n+=60;fill(T[r])}
else if(a=='add'){S.srs[d.id]??={ease:2.5,ivl:0,reps:0,lapse:0,due:Date.now()};save();DL.close()}
else if(a=='qs'){qstart(d.t);V.quiz()}
else if(a=='qa'){const q=Z.qs[Z.i];Z.a=+d.i;if(q.o[Z.a]==q.x)Z.s++;else{Z.w.push(q.x);S.srs[Z.t+q.x.id]??={ease:2.5,ivl:0,reps:0,lapse:1,due:Date.now()};save()}V.quiz()}
else if(a=='qn'){Z.i++;Z.a=null;V.quiz()}
else if(a=='exp')$('#bk').value=JSON.stringify(S)
else if(a=='imp'){try{Object.assign(S,JSON.parse($('#bk').value));save();theme();location.hash='home'}catch(x){$('#bk').value='কোডটি সঠিক নয়'}}
else if(a=='rst'){if(!t._c){t._c=1;t.textContent='নিশ্চিত? আবার চাপুন';return}S.srs={};S.days={};save();location.hash='home'}});
DL.addEventListener('click',e=>{if(e.target==DL)DL.close()});
document.addEventListener('input',e=>{if(e.target.id=='q'){const t=T[cur()];B[t].q=e.target.value;B[t].n=60;fill(t)}});
document.addEventListener('change',e=>{const n=e.target.dataset.n;if(n){S[n]=Math.max(0,Math.min(50,+e.target.value||0));save()}});
document.addEventListener('keydown',e=>{if(cur()!='study'||!Q?.length||/INPUT|TEXTAREA/.test(e.target.tagName))return;
if((e.key==' '||e.key=='Enter')&&!F.sh){e.preventDefault();F.sh=1;V.study()}else if(F.sh&&'1234'.includes(e.key))gr(+e.key-1)});


const t=(e,b)=>S.lang=='bn'?b:e;
const dec=async id=>{const el=document.getElementById(id);const raw=((window.NBD||{})[id]!=null?(window.NBD||{})[id]:(el?el.textContent:'')).trim();const b=atob(raw);return await new Response(new Blob([Uint8Array.from(b,c=>c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream('gzip'))).json()};
let SO,DK=null,KS={sc:'h',mode:'chart'},KQ=null;
const EN=`হোম=Home|অনুশীলন শুরু করুন=Start practice|অনুশীলন=Practice|কানা=Kana|ডেক=Decks|শব্দ কুইজ=Word quiz|কাঞ্জি কুইজ=Kanji quiz|কুইজ দিন=Take a quiz|কুইজ=Quiz|শব্দ=Words|কাঞ্জি=Kanji|ব্যাকরণ=Grammar|সেটিংস=Settings|আজকের পড়া=Today’s study|আজকের পর্ব শেষ=Session complete|আজকের কাজ শেষ=All done for today|টি কার্ড করেছেন। রোজ অল্প করে করলেই মনে থাকে।= cards done. A little every day makes it stick.|টি কার্ড করেছেন। টানা = cards done. Streak: |আজ =Today: | দিন।= days.|রিভিউ তালিকায় আছে।=Already in your reviews.|রিভিউতে যোগ করুন=Add to reviews|আগামী ৭ দিনের রিভিউ=Reviews in the next 7 days|রিভিউ=due|প্রতিদিন নতুন কার্ড=New cards per day|নতুন=new|স্তর, ১০টি প্রশ্ন। ভুল উত্তরগুলো আপনার রিভিউতে যোগ হবে।=level, 10 questions. Wrong answers are added to your reviews.|স্তর=Level|আয়ত্ত=mastered|শুরু=started|মোট=total|রবি=Sun|সোম=Mon|মঙ্গল=Tue|বুধ=Wed|বৃহ=Thu|শুক্র=Fri|শনি=Sat|উত্তর দেখুন=Show answer| বাকি= left|ভুল=Again|কঠিন=Hard|ঠিক=Good|সহজ=Easy| দিন= days|১০ মিনিট=10 min|অন:=On:|কুন:=Kun:|হিরাগানা:=Hiragana:|টি শব্দ এটি দিয়ে শুরু হয়=words start with it|টি শব্দে ব্যবহৃত=words use it| স্ট্রোক, রেডিকাল = strokes, radical |শুনুন=Listen|এই কাঞ্জির শব্দ=Words with this kanji|অন্য রূপ:=Other forms:|গঠন:=Formation:|বন্ধ=Close|, গ্রেড =, grade |জাপানি, romaji, ইংরেজি বা বাংলায় খুঁজুন=Search Japanese, romaji, English or Bangla|সব মুছুন=Reset all|সবগুলো সঠিক!=All correct!|সব=All|টি পাওয়া গেছে= found|আরও দেখান=Show more|যেগুলো ভুল হয়েছে:=Missed:|আবার খেলুন=Play again|প্রশ্ন =Question |কোডটি সঠিক নয়=Invalid code|সঠিক=Correct|পরের প্রশ্ন=Next question|ফলাফল=Results|ফুরিগানা=Furigana|দেখান=Show|লুকান=Hide|থিম=Theme|অটো=Auto|হালকা=Light|গাঢ়=Dark|ডেটা ব্যাকআপ=Data backup|এখানে ব্যাকআপ কোড পেস্ট করুন=Paste backup code here|ব্যাকআপ তৈরি করুন=Create backup|রিস্টোর করুন=Restore|অগ্রগতি শুধু এই ব্রাউজারে জমা থাকে।=Progress is saved only in this browser.|নিশ্চিত? আবার চাপুন=Sure? Press again|লোড হচ্ছে…=Loading…`.split('|').map(p=>p.split('=')).sort((a,b)=>b[0].length-a[0].length),BR=/[\u0980-\u09FF]/,tr1=s=>s.split(/(\u2063[^\u2063]*\u2063)/).map((p,i)=>i%2?p:EN.reduce((a,[b,e])=>a.split(b).join(e),p)).join('');
function trn(n){if(S.lang!='en')return;if(n.nodeType==3){if(BR.test(n.data)){const s=tr1(n.data);if(s!=n.data)n.data=s}}else if(n.nodeType==1){for(const a of['placeholder','title']){const v=n.getAttribute(a);if(v&&BR.test(v)){const s=tr1(v);if(s!=v)n.setAttribute(a,s)}}n.childNodes.forEach(trn)}}
const HD=$('header').innerHTML,hdr=()=>{document.documentElement.lang=S.lang;$('header').innerHTML=HD;$('[data-x=lg]').textContent=S.lang=='en'?'বাংলা':'English'};
// typed answers
const lc=s=>(s||'').toLowerCase().replace(/[\s.,;'"\-]/g,'');
const ALT={si:'shi',ti:'chi',tu:'tsu',hu:'fu',zi:'ji',di:'ji',du:'zu'},nz=s=>s.trim().toLowerCase().replace(/^(si|ti|tu|hu|zi|di|du)$/,m=>ALT[m]).replace(/^sy/,'sh').replace(/^ty/,'ch').replace(/^[zj]y/,'j');
const chk=(x,v)=>{const a=lc(v);if(!a)return 0;if(x.ty=='k')return[...x.en,...x.bn].some(m=>{m=lc(m);return m==a||(a.length>2&&m.includes(a))});return[x.o,x.r,x.w].some(z=>lc(z)==a)||lc(x.o)==lc(nz(v))};
const tin=x=>`<div class="card"><input id="ta" autocomplete="off" autocapitalize="off" placeholder="${x.ty=='k'?t('Type the meaning','অর্থ লিখুন'):t('Type the reading (romaji or hiragana)','রিডিং লিখুন (রোমাজি বা হিরাগানা)')}"><br><br><button class="btn" data-x="ta">${t('Check','দেখুন')}</button> <button class="lk" data-a="show">${t('Skip','এড়িয়ে যান')}</button></div>`;
const chkT=()=>{const v=$('#ta').value;F.ty=v;F.res=chk(D.m[F.k],v)?1:-1;F.sh=1;V.study()};
V.study=()=>{V.study0();const x=Q?.length&&D.m[Q[0]];if(x&&F?.sh&&x.ty=='k')drawSO(x.c,$('#so'));$('#ta')?.focus({preventScroll:true})};
// stroke order
async function drawSO(c,el){if(!el)return;SO??=await dec('so');const p=SO[c];if(!p){el.innerHTML=`<p class="mute">${t('No stroke data.','স্ট্রোকের ডেটা নেই।')}</p>`;return}
const P=n=>p.slice(0,n).map((d,i)=>`<path d="${d}"${i==n-1?' class="hl"':''}/>`).join('');
el.innerHTML=`<svg class="so" viewBox="0 0 109 109"><g class="gh">${p.map(d=>`<path d="${d}"/>`).join('')}</g><g class="ac">${p.map((d,i)=>`<path d="${d}" pathLength="1" style="animation-delay:${i*.8}s"/>`).join('')}</g></svg><p style="text-align:center"><button class="lk" data-x="so">${t('Replay','আবার চালান')}</button></p><div class="steps">${p.map((_,i)=>`<svg viewBox="0 0 109 109">${P(i+1)}</svg>`).join('')}</div>`}
// decks
const dk=id=>S.decks.find(d=>d.id==id),weak=()=>Object.keys(S.srs).filter(k=>D.m[k]&&S.srs[k].lapse>0);
V.decks=()=>{const row=(n,ks,id)=>`<div class="card"><b>${esc(n)}</b> <span class="mute">${ks.length} ${t('items','টি আইটেম')}</span><div class="chips">${ks.slice(0,40).map(k=>`<button class="jp" data-k="${esc(k)}">${esc(title(D.m[k]))}</button>`).join('')}</div>${ks.length?`<button class="btn" data-x="dp" data-id="${id}">${t('Practice deck','ডেক অনুশীলন')}</button> `:''}${id!='weak'?`<button class="btn o" data-x="dd" data-id="${id}">${t('Delete','মুছুন')}</button>`:''}</div>`;
M.innerHTML=`<h2>${t('Decks','ডেক')}</h2><p class="mute">${t('Add words, kanji and grammar from their detail pages, then practice any deck.','শব্দ, কাঞ্জি ও ব্যাকরণের ডেটেইল পেজ থেকে ডেকে যোগ করুন, তারপর যেকোনো ডেক অনুশীলন করুন।')}</p><div style="display:flex;gap:8px;margin:12px 0"><input id="dn" placeholder="${t('New deck name','নতুন ডেকের নাম')}"><button class="btn" data-x="nd">${t('Create','তৈরি')}</button></div>${row(t('Weak items','দুর্বল আইটেম'),weak(),'weak')}${S.decks.map(d=>row(d.name,d.items.filter(k=>D.m[k]),d.id)).join('')}`};
const dkui=k=>`<h3>${t('Decks','ডেক')}</h3>${S.decks.length?`<div style="display:flex;gap:8px"><select id="ds">${S.decks.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><button class="btn o" data-x="da" data-id="${esc(k)}">${t('Add','যোগ')}</button></div>`:`<p class="mute">${t('Create a deck on the Decks page first.','আগে ডেক পেজে একটি ডেক বানান।')}</p>`}${S.decks.filter(d=>d.items.includes(k)).map(d=>`<button class="lk" data-x="dr" data-d="${d.id}" data-id="${esc(k)}">${t('Remove from','সরান:')} ${esc(d.name)}</button>`).join('<br>')}`;
// kana
const KR=[['あいうえお','a i u e o'],['かきくけこ','ka ki ku ke ko'],['さしすせそ','sa shi su se so'],['たちつてと','ta chi tsu te to'],['なにぬねの','na ni nu ne no'],['はひふへほ','ha hi fu he ho'],['まみむめも','ma mi mu me mo'],['やゆよ','ya yu yo'],['らりるれろ','ra ri ru re ro'],['わをん','wa wo n'],['がぎぐげご','ga gi gu ge go'],['ざじずぜぞ','za ji zu ze zo'],['だぢづでど','da ji zu de do'],['ばびぶべぼ','ba bi bu be bo'],['ぱぴぷぺぽ','pa pi pu pe po'],['きゃきゅきょ','kya kyu kyo'],['しゃしゅしょ','sha shu sho'],['ちゃちゅちょ','cha chu cho'],['にゃにゅにょ','nya nyu nyo'],['ひゃひゅひょ','hya hyu hyo'],['みゃみゅみょ','mya myu myo'],['りゃりゅりょ','rya ryu ryo'],['ぎゃぎゅぎょ','gya gyu gyo'],['じゃじゅじょ','ja ju jo'],['びゃびゅびょ','bya byu byo'],['ぴゃぴゅぴょ','pya pyu pyo']];
const kk=s=>s.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+96)),kl=sc=>KR.flatMap(([g,r],gi)=>{const rs=r.split(' ');return[...g.matchAll(/.[ゃゅょ]?/g)].map((m,i)=>({c:sc=='k'?kk(m[0]):m[0],r:rs[i],s:gi<10?0:gi<15?1:2}))});
V.kana=()=>{const sc=KS.sc,L=kl(sc),h=`<h2>${t('Kana','কানা')}</h2>${chips([['h','ひらがな Hiragana'],['k','カタカナ Katakana']],sc,'data-ks')}${chips([['chart',t('Chart','চার্ট')],['mc',t('Choice quiz','বাছাই কুইজ')],['ty',t('Typing quiz','টাইপ কুইজ')]],KS.mode,'data-km')}${chips([[1,t('Romaji on','রোমাজি চালু')],[0,t('Romaji off','রোমাজি বন্ধ')]],S.roma,'data-roma')}`;
if(KS.mode=='chart'){M.innerHTML=h+[t('Basic','মূল বর্ণ'),t('Voiced','ঘোষ বর্ণ'),t('Combined sounds','যুক্ত ধ্বনি')].map((n,i)=>`<h3>${n}</h3><div class="kg">${L.filter(x=>x.s==i).map(x=>`<button class="kt" data-x="kt" data-c="${x.c}" data-r="${x.r}"><b>${x.c}</b>${S.roma?`<span>${x.r}</span>`:''}</button>`).join('')}</div>`).join('')+`<p class="mute"><br>${t('Tap a kana to hear it and see its stroke order.','কানায় ট্যাপ করে উচ্চারণ ও স্ট্রোক ক্রম দেখুন।')}</p>`;return}
if(!KQ){const w=S.kana,x=L.map(y=>[y,Math.random()+((w[y.c]?.ok||0)-3*(w[y.c]?.no||0))*.15]).sort((a,b)=>a[1]-b[1])[0][0];KQ={x,o:sh([x,...sh(L.filter(y=>y!=x)).slice(0,3)]),res:0}}
const q=KQ;M.innerHTML=h+`<p class="mute">${t('Score','স্কোর')} ${KS.ok||0}/${KS.n||0}</p><div class="card fc"><div class="sq"><span class="big">${q.x.c}</span></div>${q.res?`<p class="ans" style="color:var(--${q.res>0?'ok':'no'})">${q.res>0?t('Correct','সঠিক'):t('Answer','উত্তর')+': '+q.x.r}</p>`:''}</div>`+(q.res<0?`<button class="btn" data-x="kn">${t('Next','পরের')}</button>`:q.res>0?'':KS.mode=='mc'?`<div class="opts">${q.o.map(y=>`<button class="opt" data-x="ka" data-v="${y.r}">${y.r}</button>`).join('')}</div>`:`<input id="kin" autocomplete="off" autocapitalize="off" placeholder="${t('Type the romaji','রোমাজি লিখুন')}"><br><br><button class="btn" data-x="ka">${t('Check','দেখুন')}</button>`);
if(!q.res&&KS.mode=='ty')$('#kin')?.focus({preventScroll:true})};
function kans(v){const q=KQ,c=q.x.c,ok=nz(v)==q.x.r||(q.x.r=='wo'&&nz(v)=='o'),w=S.kana[c]||={ok:0,no:0};q.res=ok?1:-1;ok?w.ok++:w.no++;KS.n=(KS.n||0)+1;KS.ok=(KS.ok||0)+(ok?1:0);save();V.kana();if(ok)setTimeout(()=>{if(cur()=='kana'&&KQ==q){KQ=null;V.kana()}},700)}
function kdet(c,r){DL.innerHTML=`<button class="lk" style="float:right" data-a="close">${t('Close','বন্ধ')}</button><div class="sq" style="margin:0 auto"><span class="big">${c}</span></div><h3>${r} <button class="lk" data-say="${c}">${t('Listen','শুনুন')}</button></h3><div id="so"></div>`;DL.open||DL.showModal();say(c);drawSO(c,DL.querySelector('#so'))}
// events
document.addEventListener('click',e=>{const el=e.target.closest('[data-x],[data-lang],[data-typed],[data-ks],[data-km],[data-ml],[data-roma]');if(!el)return;const d=el.dataset,x=d.x;if(d.roma!=null){S.roma=+d.roma;save();const rr=cur();return (V[rr]||V.kana)();}
if(d.lang||x=='lg'){S.lang=d.lang||(S.lang=='en'?'bn':'en');save();hdr();return route()}
if(d.ml){S.ml=d.ml;save();return V.settings()}if(d.typed!=null){S.typed=+d.typed;save();return V.settings()}
if(d.ks){KS.sc=d.ks;KQ=null;return V.kana()}if(d.km){KS.mode=d.km;KQ=null;return V.kana()}
if(x=='kt')kdet(d.c,d.r);else if(x=='ka')kans(d.v??$('#kin').value);else if(x=='kn'){KQ=null;V.kana()}
else if(x=='so'){const g=el.closest('div,dialog,main').querySelector('.ac');g.classList.add('off');g.getBoundingClientRect();g.classList.remove('off')}
else if(x=='ta')chkT();
else if(x=='nd'){const n=$('#dn').value.trim();if(n){S.decks.push({id:Date.now().toString(36),name:n,items:[]});save();V.decks()}}
else if(x=='dd'){S.decks=S.decks.filter(q=>q.id!=d.id);save();V.decks()}
else if(x=='dp'){DK=d.id=='weak'?weak():dk(d.id).items;Q=null;location.hash=='#study'?V.study():location.hash='study'}
else if(x=='da'){const q=dk($('#ds').value);if(q&&!q.items.includes(d.id))q.items.push(d.id);save();det(d.id)}
else if(x=='dr'){const q=dk(d.d);q.items=q.items.filter(k=>k!=d.id);save();det(d.id)}});
document.addEventListener('keydown',e=>{if(e.key!='Enter')return;const i=e.target.id;if(i=='ta')chkT();else if(i=='kin')kans($('#kin').value);else if(i=='dn')$('[data-x=nd]').click()});
new MutationObserver(ms=>ms.forEach(m=>{m.addedNodes.forEach(trn);if(m.type!='childList')trn(m.target)})).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title']});
(async()=>{hdr();M.innerHTML='<p class="mute">লোড হচ্ছে…</p>';theme();await load();addEventListener('hashchange',route);route();

/* Android / browser back button support */
(function(){
  const dig=()=>document.getElementById('DL');
  const stack=[];
  const push=()=>{try{history.pushState({nb:1,h:location.hash},'',location.href)}catch(e){}};
  window.addEventListener('popstate',e=>{
    const DL=dig();
    if(DL && (DL.open || DL.hasAttribute('open'))){
      if(typeof DL.close==='function') DL.close();
      else DL.removeAttribute('open');
      push(); // stay in app after closing dialog
      return;
    }
    // Hash already changed by the browser; ensure route runs
    try{route()}catch(x){}
    // If we are at home with no more in-app history, allow leaving
  });
  // When opening dialogs, push a history entry so back closes them
  const watchOpen=()=>{
    const DL=dig(); if(!DL || DL._nbBack) return;
    DL._nbBack=1;
    const wrap=fn=>{
      if(!fn) return fn;
      return function(){
        if(!(this.open||this.hasAttribute('open'))) push();
        return fn.apply(this,arguments);
      };
    };
    if(typeof DL.showModal==='function') DL.showModal=wrap(DL.showModal.bind(DL));
    const setAttr=DL.setAttribute.bind(DL);
    DL.setAttribute=function(n,v){
      if(String(n).toLowerCase()==='open' && !(this.open||this.hasAttribute('open'))) push();
      return setAttr(n,v);
    };
  };
  watchOpen();
  // Also handle hardware back via visualViewport / nothing else needed for pure web
})();
})();

/* red ink — wrap kanji runs so the CSS toggle can ink them without touching kana */
(()=>{
const KJ=/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々]/;
const SKIP='svg,script,style,textarea,title,select,option,.brand,.pvs,.kj';
const wrap=root=>{
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),hits=[];let n;
  while(n=w.nextNode()){const p=n.parentElement;if(p&&!p.closest(SKIP)&&KJ.test(n.nodeValue))hits.push(n)}
  for(const t of hits){
    const f=document.createDocumentFragment();
    for(const part of t.nodeValue.split(/([\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々])/)){
      if(!part)continue;
      if(KJ.test(part)){const s=document.createElement('span');s.className='kj';s.textContent=part;f.appendChild(s)}
      else f.appendChild(document.createTextNode(part))
    }
    t.parentNode&&t.parentNode.replaceChild(f,t)
  }
};
new MutationObserver(ms=>{for(const m of ms){
  if(m.type=='characterData'){const p=m.target.parentElement;if(p&&!p.closest(SKIP)&&KJ.test(m.target.nodeValue))wrap(p);continue}
  for(const n of m.addedNodes){
    if(n.nodeType==3){const p=n.parentElement;if(p&&!p.closest(SKIP)&&KJ.test(n.nodeValue))wrap(p)}
    else if(n.nodeType==1)wrap(n)
  }
}}).observe(document.body,{childList:true,subtree:true,characterData:true});
wrap(document.body);
})();
