
/* Nihoban Frequency Lab — real-world comprehension from a 15k-lemma frequency
   corpus (rank order, loaded from data/fq.js):
   coverage dashboard · level breakdown · quick wins · Core-2K badges ·
   frequency-sorted deck with search · kanji unlock priority · 30-question
   placement diagnostic with add-missed-to-review. */
(()=>{
const LVS=['N5','N4','N3','N2','N1'];
const BANDS=[[1,500],[501,1500],[1501,3000],[3001,5000],[5001,10000],[10001,15000]];
const BW=[500,1000,1500,2000,5000,5000];
const KJ=/[\u3400-\u4DBF\u4E00-\u9FFF\u3005\u3006]/;
let F=null,FV={v:'dash',lv:'',flt:'todo',q:''},FP=null;

(async()=>{const a=await dec('fq');
const map=new Map(),kj=new Map();let tot=0;
a.forEach((p,i)=>{const f=p[0],l=p[1];tot+=f;map.set(l,{r:i+1,f});
for(const ch of new Set(l))if(KJ.test(ch)){const e=kj.get(ch);e?(e.f+=f,e.n++):kj.set(ch,{f,n:1})}});
const bench=[500,1000,2000,5000].map(n=>{let s=0;for(let i=0;i<n;i++)s+=a[i][0];return{n,s}});
const bfreq=BANDS.map(b=>{let s=0;for(let i=b[0]-1;i<b[1];i++)s+=a[i][0];return s});
for(let t=0;t<400;t++){if(D&&D.v&&D.v.length){D.v.forEach(x=>{x.fq=map.get(x.w)||map.get(x.r)||null});break}
await new Promise(r=>setTimeout(r,100))}
F={map,kj,tot,bench,bfreq,kid:{}};
for(const x of D.k||[])if(x.c)F.kid[x.c]=x.i||x.c;
if(cur()=='freq')V.freq()})();

const stOf=id=>{const c=S.srs[id];return!c?0:c.ivl>=21?2:1};
const scan=()=>{const r={matched:0,started:0,mast:0,covS:0,covM:0,
tiers:[[500,'Core 500'],[1000,'Core 1K'],[2000,'Core 2K']].map(([n,lab])=>({n,lab,tot:0,m:0,cover:0,coverM:0})),
bench:F.bench.map(b=>({n:b.n,s:b.s,k:0})),lvls:{}};
for(const x of D.v){if(!x.fq)continue;const c=S.srs['v'+x.id],f=x.fq.f;r.matched++;
if(x.l){r.lvls[x.l]??={n:0,m:0,cs:0,cM:0};r.lvls[x.l].n++;if(c){r.lvls[x.l].cs+=f;if(c.ivl>=21){r.lvls[x.l].m++;r.lvls[x.l].cM+=f}}}
for(const t of r.tiers)if(x.fq.r<=t.n){t.tot++;t.cover+=f;if(c&&c.ivl>=21){t.m++;t.coverM+=f}}
for(const b of r.bench)if(x.fq.r<=b.n&&c&&c.ivl>=21)b.k++;
if(c){r.started++;r.covS+=f;if(c.ivl>=21){r.mast++;r.covM+=f}}}
return r};
const pc=x=>(x*100).toFixed(1)+'%';
/* coverage history: snapshot every ≥12h, keep 30 — powers the delta + sparkline */
const hist=cov=>{S.fqHist??=[];const h=S.fqHist,last=h[h.length-1];
if(!last||Date.now()-last.t>432e5){h.push({t:Date.now(),c:cov});if(h.length>30)h.shift();save()}return h};
const spark=h=>{const pts=h.slice(-14);if(pts.length<2)return'';
const mn=Math.min(...pts.map(p=>p.c)),mx=Math.max(...pts.map(p=>p.c)),rg=(mx-mn)||1;
const W=100,H=30,st=W/(pts.length-1);
const P=pts.map((p,i)=>[+(i*st).toFixed(1),+(H-2-((p.c-mn)/rg)*(H-6)).toFixed(1)]);
return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" aria-hidden="true" style="display:block;margin-top:10px"><polyline points="${P.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${P[P.length-1][0]}" cy="${P[P.length-1][1]}" r="2.5" fill="var(--acc)"/></svg>`};
const delta=h=>{const now=Date.now(),ref=h.find(p=>now-p.t>=2592e5)||h[0];
if(!ref||h[h.length-1]===ref)return'';
const d=h[h.length-1].c-ref.c;if(Math.abs(d)<.05)return'';
return `<span style="color:var(--ok);font-weight:700;font-size:15px;vertical-align:middle"> ${d>0?'+':''}${d.toFixed(1)}%</span>`};

const nav=()=>chips([['dash',t('Coverage','কভারেজ')],['deck',t('Deck','ডেক')],['kanji',t('Kanji','কাঞ্জি')],['test',t('Placement test','প্লেসমেন্ট টেস্ট')]],FV.v,'data-fq="nav" data-v');
const barw=(v,cls)=>`<div class="bar"><b class="${cls||''}" style="width:${Math.min(100,v*100)}%"></b></div>`;
const dot=s=>`<span class="jx-dot${s==2?' ok':s==1?'':''}" style="min-width:52px;text-align:right">${['new','learning','mastered'][s]&&t(...[['new','নতুন'],['learning','শিখছি'],['mastered','আয়ত্ত']][s])}</span>`;

const wins=()=>{const xs=D.v.filter(x=>x.fq&&!S.srs['v'+x.id]&&g1(x)).sort((a,b)=>a.fq.f-b.fq.f).slice(0,6);
if(!xs.length)return'';
return `<h3>${t('Quick wins — learn these next','দ্রুত লাভ — এগুলো আগে শিখুন')}</h3><div class="card">${xs.map(x=>`<div class="stat jp"><button class="lk" data-k="v${x.id}" style="flex:1;text-align:left"><b>${esc(x.w)}</b> <span class="mute">${esc(x.r)}</span><br><small class="mute">#${x.fq.r} · ${esc(g1(x))}</small></button><button class="btn" style="min-height:40px;padding:4px 12px;flex:none" data-a="add" data-fq="add" data-id="v${x.id}" aria-label="${t('Add to review','রিভিউতে যোগ করুন')}">${ic('ok',16)}</button></div>`).join('')}
<p class="mute" style="margin:8px 0 0"><small>${t('Highest-frequency words you haven’t started yet.','সবচেয়ে সাধারণ শব্দ যেগুলো এখনো শুরু করেননি।')}</small></p></div>`};

const dash=()=>{if(!F)return `<div class="card"><span class="ai-loading">${t('Loading corpus…','কর্পাস লোড হচ্ছে…')}</span></div>`;
const s=scan(),h=hist(s.covM/F.tot*100);
const bm=s.bench.map(b=>`<div class="stat"><span>${t('Top','টপ')} ${b.n}</span><span class="mute">${pc(b.s/F.tot)} ${t('of Japanese','জাপানির')}</span><b>${b.k}</b></div>`).join('');
const tg=s.tiers.map(tr=>{const done=tr.tot&&tr.m>=tr.tot;
return `<div class="card" style="--c:var(--gold);${done?'border-color:var(--gold)':''}"><div class="stat"><span>${ic('trophy',18)} <b>${tr.lab}</b></span><span class="mute">#1–${tr.n}</span><span class="jx-dot${done?' ok':''}">${done?t('Earned','অর্জিত'):pc(tr.tot?tr.m/tr.tot:0)}</span></div>
${barw(tr.tot?tr.m/tr.tot:0)}<p class="mute" style="margin:6px 0 0"><small>${tr.m}/${tr.tot} ${t('JLPT words mastered','জেএলপিটি শব্দ আয়ত্ত')} · ${pc(tr.coverM/F.tot)} ${t('of Japanese','জাপানির')}</small></p></div>`}).join('');
const lv=LVS.filter(l=>s.lvls[l]).map(l=>{const e=s.lvls[l],p=e.n?e.m/e.n:0;
return `<div class="stat"><span>${l}</span><span class="mute">${e.m}/${e.n}</span><b style="min-width:48px;text-align:right">${pc(p)}</b></div>${barw(p)}`}).join('');
return `${nav()}
<div class="card" style="text-align:center;margin-top:12px"><p class="mute" style="margin:0"><small>${t('You understand about','আপনি প্রায় বোঝেন')}</small></p>
<p style="font-size:52px;font-weight:800;margin:6px 0;color:var(--acc);font-variant-numeric:tabular-nums">${pc(s.covM/F.tot)}${delta(h)}</p>
<p class="mute" style="margin:0"><small>${t('of real-world Japanese (mastered words)','বাস্তব জাপানির (আয়ত্ত শব্দ)')}</small></p>
<div style="margin-top:12px">${barw(s.covM/F.tot)}</div>
${spark(h)}
<p class="mute" style="margin:8px 0 0"><small>${t('Started but not yet mastered','শুরু করেছেন, আয়ত্ত হয়নি')}: ${pc((s.covS-s.covM)/F.tot)} · ${s.mast}/${s.matched} ${t('JLPT words matched to the corpus','জেএলপিটি শব্দ কর্পাসে মিলেছে')}</small></p></div>
<h3>${t('Coverage by JLPT level','জেএলপিটি স্তর অনুযায়ী কভারেজ')}</h3><div class="card">${lv||`<p class="mute">${t('No level words matched yet.','এখনো কোনো স্তরের শব্দ মেলেনি।')}</p>`}</div>
<h3>${t('Benchmarks','মাইলফলক')}</h3><div class="card">${bm}</div>
<h3>${t('Core badges','কোর ব্যাজ')}</h3>${tg}
${wins()}
<div class="dock"><button class="btn" style="width:100%" data-fq="test">${ic('bolt',18)} ${t('Take the 30-question placement test','৩০ প্রশ্নের প্লেসমেন্ট টেস্ট দিন')}</button></div>`};

const deckRows=()=>{const lv=FV.lv||S.lvl;
let xs=D.v.filter(x=>x.fq&&x.l==lv);
if(FV.flt=='core')xs=xs.filter(x=>x.fq.r<=2000);
if(FV.flt=='todo')xs=xs.filter(x=>stOf('v'+x.id)<2);
if(FV.q){const q=FV.q.toLowerCase();xs=xs.filter(x=>(x.w+' '+x.r+' '+(x.o||'')+' '+g1(x)).toLowerCase().includes(q))}
xs=xs.slice().sort((a,b)=>a.fq.r-b.fq.r).slice(0,FV.q?150:60);
return xs.map(x=>`<button class="stat jp" data-k="v${x.id}" style="width:100%;text-align:left"><span class="mute">#${x.fq.r}</span><b>${esc(x.w)}</b><span class="mute">${esc(x.r)}</span><span class="jp">${esc(g1(x))}</span>${dot(stOf('v'+x.id))}</button>`).join('')||`<p class="mute">${t('Nothing here yet — pick another filter or level.','এখানে কিছু নেই — অন্য ফিল্টার বা স্তর বাছুন।')}</p>`};

const deck=()=>{if(!F)return `<div class="card"><span class="ai-loading">${t('Loading corpus…','কর্পাস লোড হচ্ছে…')}</span></div>`;
return `${nav()}
<p class="mute" style="margin:10px 0 4px"><small>${t('Words from your level, most frequent first. Tap a word for details.','আপনার স্তরের শব্দ, সবচেয়ে সাধারণ আগে। বিস্তারিতের জন্য শব্দে চাপ দিন।')}</small></p>
${chips([['',S.lvl],...LVS.map(l=>[l,l])],FV.lv,'data-fq="lv" data-v')}
${chips([['todo',t('Not mastered','আয়ত্ত হয়নি')],['core',t('Core 2K only','শুধু কোর ২কে')],['all',t('All','সব')]],FV.flt,'data-fq="flt" data-v')}
<input id="fqQ" type="search" style="margin:10px 0" value="${esc(FV.q)}" aria-label="${t('Filter words','শব্দ খুঁজুন')}" placeholder="${t('Filter by word, reading or meaning…','শব্দ, পড়া বা অর্থ দিয়ে খুঁজুন…')}">
<div class="card"><div id="fqRows">${deckRows()}</div></div>`};

const kanji=()=>{if(!F)return `<div class="card"><span class="ai-loading">${t('Loading corpus…','কর্পাস লোড হচ্ছে…')}</span></div>`;
const known=new Set();
for(const x of D.k||[])if(stOf('k'+(x.i||x.c))==2&&x.c)known.add(x.c);
for(const x of D.v)if(stOf('v'+x.id)==2)for(const ch of x.w)if(KJ.test(ch))known.add(ch);
const top=[...F.kj.entries()].sort((a,b)=>b[1].f-a[1].f).slice(0,40);
const rows=top.map(([ch,e],i)=>{const id=F.kid[ch];
const inner=`<b style="font-size:22px">${ch}</b><span class="mute">#${i+1}</span><span class="mute">${pc(e.f/F.tot)} · ${e.n} ${t('words','শব্দ')}</span><span class="jx-dot${known.has(ch)?' ok':''}">${known.has(ch)?t('Known','জানা'):t('—','—')}</span>`;
return id?`<button class="stat jp" data-k="k${id}" style="width:100%;text-align:left" aria-label="${t('Kanji details','কাঞ্জি বিস্তারিত')}">${inner}</button>`:`<div class="stat jp">${inner}</div>`}).join('');
return `${nav()}
<p class="mute" style="margin:10px 0 4px"><small>${t('Kanji ranked by reading payoff: summed frequency of every corpus word containing them. Master the top ones first. Tap for strokes and words.','রিডিং পে-অফ অনুযায়ী কাঞ্জি: যেসব শব্দে আছে তাদের ফ্রিকোয়েন্সি যোগ করে সাজানো। আগে উপরেরগুলো শিখুন। স্ট্রোক ও শব্দের জন্য চাপ দিন।')}</small></p>
<div class="card">${rows}</div>`};

const buildTest=()=>{const byB=BANDS.map(()=>[]);
for(const x of D.v)if(x.fq&&g1(x))BANDS.forEach((b,i)=>{if(x.fq.r>=b[0]&&x.fq.r<=b[1])byB[i].push(x)});
FP={i:0,a:null,lock:0,done:0,res:[],qs:[],miss:[],missAdded:0};
BANDS.forEach((b,i)=>{const smp=sh(byB[i]).slice(0,5);FP.res.push({ok:0,n:smp.length});
smp.forEach(x=>{const m=g1(x);const d=sh(D.v.filter(y=>y!==x&&g1(y)&&g1(y)!==m)).slice(0,3).map(g1);
const opts=sh([m,...d]);FP.qs.push({x,band:i,opts,oki:opts.indexOf(m)})})});
FP.qs=sh(FP.qs)};

const test=()=>{if(!F)return `<div class="card"><span class="ai-loading">${t('Loading corpus…','কর্পাস লোড হচ্ছে…')}</span></div>`;
if(!FP)buildTest();
if(FP.done){const est=FP.res.reduce((a,r,i)=>a+(r.n?r.ok/r.n:0)*BW[i],0);
const estC=FP.res.reduce((a,r,i)=>a+(r.n?r.ok/r.n:0)*F.bfreq[i],0)/F.tot;
const bd=FP.res.map((r,i)=>`<div class="stat"><span class="mute">#${BANDS[i][0]}–${BANDS[i][1]}</span><span class="mute">${pc(F.bfreq[i]/F.tot)} ${t('of Japanese','জাপানির')}</span><b>${r.ok}/${r.n}</b></div>`).join('');
const nm=FP.miss.length;
const missBtn=nm?`<button class="btn o" style="width:100%" data-fq="miss">${ic('ok',18)} ${FP.missAdded?t('Added to review','রিভিউতে যোগ হয়েছে'):t(`Add the ${nm} missed words to review`,`ভুল হওয়া ${nm}টি শব্দ রিভিউতে যোগ করুন`)}</button>`:'';
return `${nav()}
<div class="card" style="text-align:center;margin-top:12px"><p class="mute" style="margin:0"><small>${t('Estimated vocabulary size','সম্ভাব্য শব্দভাণ্ডার')}</small></p>
<p style="font-size:44px;font-weight:800;margin:6px 0;color:var(--acc);font-variant-numeric:tabular-nums">${Math.round(est).toLocaleString()}</p>
<p class="mute" style="margin:0"><small>${t('of 15,000 — about','১৫,০০০ এর মধ্যে — প্রায়')} ${pc(estC)} ${t('of real-world Japanese','বাস্তব জাপানির')}</small></p></div>
<h3>${t('By frequency band','ফ্রিকোয়েন্সি ব্যান্ড অনুযায়ী')}</h3><div class="card">${bd}</div>
<div class="dock">${missBtn}<button class="btn" style="width:100%;margin-top:${nm&&!FP.missAdded?'10px':'0'}" data-fq="retake">${t('Retake test','টেস্ট আবার দিন')}</button></div>`}
const q=FP.qs[FP.i];
const opts=q.opts.map((o,i)=>`<button class="opt" data-fq="ans" data-i="${i}" ${FP.lock?'disabled':''} ${FP.a==i?'style="box-shadow:inset 0 0 0 3px var(--acc)"':''} aria-label="${esc(o)}"><kbd>${i+1}</kbd><span class="jp">${esc(o)}</span></button>`).join('');
return `${nav()}
<p class="mute" style="margin:10px 0 4px"><small>${t('Question','প্রশ্ন')} ${FP.i+1}/${FP.qs.length} · ${t('rank','র‍্যাঙ্ক')} #${q.x.fq.r}</small></p>
<div class="bar"><b style="width:${FP.i/FP.qs.length*100}%"></b></div>
<div class="card fc" style="margin-top:12px"><div class="mid"><b class="jp" style="font-size:34px">${esc(q.x.w)}</b>${q.x.r?`<p class="jp mute" style="margin:4px 0 0">${esc(q.x.r)}</p>`:''}</div></div>
<p class="mute" style="margin:10px 0 4px;text-align:center"><small>${t('What does this word mean?','এই শব্দের অর্থ কী?')}</small></p>
<div class="opts">${opts}</div>
${FP.a!=null?`<div class="card ${FP.a==q.oki?'fb g':'fb'}" style="margin-top:12px"><b>${FP.a==q.oki?t('Correct!','সঠিক!'):t('Not quite','হয়নি')}</b>${q.x.x?.length?`<div class="ex"><p class="jp">${fur(q.x.x[0][1]||q.x.x[0][0])}</p><p class="mute">${esc(q.x.x[0][2])}</p></div>`:''}<div class="dock"><button class="btn" style="width:100%" data-fq="next">${FP.i+1>=FP.qs.length?t('Results','ফলাফল'):t('Next','পরের')}</button></div></div>`:''}`};

V.freq=()=>{if(cur()!='freq')return;
M.innerHTML=`<a class="back" href="#learn">${ic('back',18)} ${t('Study','স্টাডি')}</a><h2>${t('Frequency Lab','ফ্রিকোয়েন্সি ল্যাব')}</h2>
<p class="mute" style="margin:-4px 0 12px"><small>${t('How much real-world Japanese your vocabulary covers, measured against a 15,000-word frequency corpus.','১৫,০০০ শব্দের ফ্রিকোয়েন্সি কর্পাসের সাথে মাপা — আপনার শব্দভাণ্ডার কতটুকু বাস্তব জাপানি ঢাকে।')}</small></p>
${{dash,deck,kanji,test}[FV.v]()}`};
TAB.freq='learn';

/* Study tile — appended to the existing Study view like the other extra tiles */
const baseLearn=V.learn;
V.learn=()=>{baseLearn();$('.tiles',M)?.insertAdjacentHTML('beforeend',tile('#freq','prog',t('Frequency Lab','ফ্রিকোয়েন্সি ল্যাব'),t('Coverage · deck · kanji payoff','কভারেজ · ডেক · কাঞ্জি পে-অফ'),'--cv'))};

const ansQ=i=>{if(!FP||FP.done||FP.lock)return;FP.lock=1;FP.a=i;const q=FP.qs[FP.i];
if(i==q.oki)FP.res[q.band].ok++;else if(!FP.miss.includes(q.x.id))FP.miss.push(q.x.id);V.freq()};
const nextQ=()=>{if(!FP)return;FP.i++;FP.lock=0;FP.a=null;if(FP.i>=FP.qs.length)FP.done=1;V.freq()};
const addMiss=()=>{if(!FP||!FP.miss.length||FP.missAdded)return;
FP.miss.forEach(id=>{S.srs['v'+id]??={ease:2.5,ivl:0,reps:0,lapse:0,due:Date.now()}});save();FP.missAdded=1;V.freq()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-fq]');if(!b||cur()!='freq')return;
e.stopPropagation();const a=b.dataset.fq,v=b.dataset.v;
if(a=='nav'){FV.v=v;if(v!='deck')FV.q=''}else if(a=='lv')FV.lv=v;else if(a=='flt')FV.flt=v;
else if(a=='test'){buildTest();FV.v='test'}else if(a=='ans')return ansQ(+b.dataset.i);
else if(a=='next')return nextQ();else if(a=='retake'){buildTest();FV.v='test'}
else if(a=='miss')return addMiss();
V.freq()});
/* deck search filters rows in place — keeps the input focused */
document.addEventListener('input',e=>{if(e.target.id!='fqQ'||cur()!='freq')return;
FV.q=e.target.value;const el=$('#fqRows');if(el)el.innerHTML=deckRows()});
document.addEventListener('keydown',e=>{if(cur()!='freq'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
if(!FP){if((e.key=='Enter'||e.key==' ')&&FV.v=='dash'){e.preventDefault();buildTest();FV.v='test';V.freq()}return}
if(FP.done){if(e.key=='Enter'){e.preventDefault();buildTest();V.freq()}return}
if('1234'.includes(e.key)&&!FP.lock){const i=+e.key-1;if(i<4)ansQ(i)}
else if(FP.a!=null&&(e.key=='Enter'||e.key==' ')){e.preventDefault();nextQ()}});
})();
