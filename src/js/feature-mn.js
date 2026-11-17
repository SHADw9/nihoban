
/* Nihoban Minna no Nihongo — vocabulary trainer for the 50-lesson textbook
   series (loaded from data/mn.js): lesson browser with per-lesson
   progress · SRS flashcards (reuses the app's calc/save) · multiple-choice
   quiz · full word lists · instant search across all 2,692 words. */
(()=>{
const GRADES=[['Again','আবার'],['Hard','কঠিন'],['Good','ভালো'],['Easy','সহজ']];
const key=(ls,sq)=>'m'+ls+'-'+sq;
let MD=null,MV={ls:0,v:'words',i:0,fl:0,qi:0,a:null,lock:0,done:0,res:0,qs:null},MS='';

(async()=>{MD=await dec('mn');
for(let t=0;t<400;t++){if(S&&S.srs!==undefined)break;await new Promise(r=>setTimeout(r,100))}
if(cur()=='mn')V.mn()})();

const stOf=k=>{const c=S.srs[k];return!c?0:c.ivl>=21?2:1};
const lsn=ls=>MD.l[ls]||[];
const meaning=w=>(bn()&&mk(w[4]))||w[3]||'';
const head=w=>w[0]?`${esc(w[0])}<span class="jp mute" style="font-size:15px;font-weight:400"> ${esc(w[1])}</span>`:esc(w[1]);
const sayBtn=w=>`<button class="lk" data-say="${esc(w[0]||w[1])}" aria-label="${t('Play audio','শব্দ শুনুন')}">${ic('spk',18)}</button>`;
const lstat=ls=>{let st=0,ma=0;const a=lsn(ls);a.forEach((w,s)=>{const c=S.srs[key(ls,s)];if(c){st++;if(c.ivl>=21)ma++}});return{n:a.length,st,ma}};
const allStat=()=>{let n=0,st=0,ma=0;for(let k=1;k<=50;k++){const s=lstat(k);n+=s.n;st+=s.st;ma+=s.ma}return{n,st,ma}};
const barw=(v,h)=>`<div class="bar" style="height:${h||9}px"><b style="width:${Math.min(100,v*100)}%"></b></div>`;

const browser=()=>{if(!MD)return `<div class="card"><span class="ai-loading">${t('Loading…','লোড হচ্ছে…')}</span></div>`;
const s=allStat();
const grid=Array.from({length:50},(_,z)=>z+1).map(k=>{const st=lstat(k),p=st.n?st.st/st.n:0,done=st.n&&st.ma>=st.n;
return `<button data-mn="open" data-ls="${k}" style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 6px 7px;text-align:center;box-shadow:var(--sh);min-height:52px">
<b style="font-size:17px">${k}</b><small class="mute" style="display:block;font-size:10px">${st.ma}/${st.n}</small>
<div class="bar" style="height:3px;margin-top:4px"><b style="width:${p*100}%;background:var(${done?'--ok':'--acc'})"></b></div></button>`}).join('');
return `<p class="mute" style="margin:2px 0 12px"><small>${t('All vocabulary from the 50-lesson Minna no Nihongo series, with flashcards and quizzes per lesson.','মিননা নো নিহনগো ৫০ পাঠের সব শব্দভাণ্ডার, প্রতি পাঠে ফ্ল্যাশকার্ড ও কুইজ।')}</small></p>
<div class="card" style="text-align:center"><div class="stat" style="margin:0"><span>${t('Started','শুরু করেছেন')}</span><b>${s.st}/${s.n}</b></div>
${barw(s.st/s.n)}<div class="stat" style="margin:10px 0 0"><span>${t('Mastered','আয়ত্ত')}</span><b>${s.ma}/${s.n}</b></div>${barw(s.ma/s.n)}</div>
${S.mnLast&&MD.l[S.mnLast]?`<button class="btn o" style="width:100%;margin:12px 0 0" data-mn="open" data-ls="${S.mnLast}">${ic('bolt',18)} ${t('Continue Lesson','পাঠ চালিয়ে যান')} ${S.mnLast}</button>`:''}
<input id="mnQ" type="search" style="margin:12px 0" value="${esc(MS)}" aria-label="${t('Search all words','সব শব্দ খুঁজুন')}" placeholder="${t('Search 2,692 words…','২,৬৯২ শব্দ খুঁজুন…')}">
<div id="mnList">${MS?searchRows(MS):`<div class="lgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px">${grid}</div>`}</div>`};

const searchRows=q=>{const s=q.toLowerCase(),out=[];
for(let ls=1;ls<=50;ls++)for(let sq=0;sq<lsn(ls).length;sq++){const w=lsn(ls)[sq];
if((w[0]+' '+w[1]+' '+w[2]+' '+w[3]+' '+(w[4]||'')).toLowerCase().includes(s))out.push([ls,sq,w]);if(out.length>=60)break}
if(!out.length)return `<p class="mute">${t('No matches.','কিছু মেলেনি।')}</p>`;
return `<div class="card">${out.map(([ls,sq,w])=>`<div class="wrow">
<button class="lk" data-mn="jump" data-ls="${ls}" data-sq="${sq}" style="text-align:left"><span class="mute" style="font-size:11px;font-weight:600">L${ls}</span> <span class="jp" style="font-size:17px;font-weight:700">${esc(w[0]||w[1])}</span>${w[0]?` <small class="jp mute">${esc(w[1])}</small>`:''}</button>
<span style="text-align:left"><small class="jp mute" style="display:block;font-size:12px">${esc(w[2])}</small><span style="display:block;font-size:14px;font-weight:600">${esc(meaning(w))}</span></span>
${sayBtn(w)}</div>`).join('')}${out.length>=60?`<p class="mute" style="margin:8px 0 0"><small>${t('Showing the first 60 matches','প্রথম ৬০টি দেখানো হচ্ছে')}</small></p>`:''}</div>`};

const lessonView=()=>{if(!MD)return `<div class="card"><span class="ai-loading">${t('Loading…','লোড হচ্ছে…')}</span></div>`;
const st=lstat(MV.ls);
const head=`<a class="back" href="#mn" data-mn="back">${ic('back',18)} ${t('Lessons','পাঠ')}</a><h2>${t('Lesson','পাঠ')} ${MV.ls}</h2>
<p class="mute" style="margin:-4px 0 8px"><small>${st.st}/${st.n} ${t('started','শুরু')} · ${st.ma} ${t('mastered','আয়ত্ত')}</small></p>
<div class="bar" style="height:4px"><b style="width:${st.n?(st.ma/st.n*100):0}%;background:var(--ok)"></b></div>
${chips([['words',t('Words','শব্দ')],['cards',t('Flashcards','ফ্ল্যাশকার্ড')],['quiz',t('Quiz','কুইজ')]],MV.v,'data-mn="mode" data-v')}`;
if(MV.v=='quiz')return head+quiz();
if(MV.v=='words')return head+words();
return head+cards()};

const cards=()=>{const a=lsn(MV.ls);
if(!a.length)return `<p class="mute">${t('No words in this lesson.','এই পাঠে শব্দ নেই।')}</p>`;
if(MV.i>=a.length){const st=lstat(MV.ls);
return `<div class="card fc"><b class="jp" style="font-size:30px">${t('Lesson done!','পাঠ শেষ!')}</b>
<p class="mute">${t('Cards graded this pass.','এইবার কার্ডগুলো মূল্যায়ন হয়েছে।')}</p>
<div class="stat" style="width:100%"><span>${t('Mastered so far','এখন পর্যন্ত আয়ত্ত')}</span><b>${st.ma}/${st.n}</b></div>${barw(st.n?st.ma/st.n:0)}
<div class="dock" style="width:100%"><button class="btn" style="width:100%" data-mn="restart">${t('Go again','আবার করুন')}</button>
<button class="btn o" style="width:100%;margin-top:8px" data-mn="mode" data-v="quiz">${t('Quiz this lesson','পাঠের কুইজ')}</button></div></div>`}
const w=a[MV.i],k=key(MV.ls,MV.i),c=S.srs[k];
return `<p class="mute" style="margin:10px 0 4px;text-align:center"><small>${MV.i+1}/${a.length}${c?` · ${t('due','নির্ধারিত')}`:''}</small></p>
<div class="bar" style="height:4px"><b style="width:${MV.i/a.length*100}%"></b></div>
<div class="card fc" data-mn="flip" role="button" tabindex="0" aria-label="${t('Tap to flip','উল্টাতে চাপ দিন')}">
${MV.fl?`<div class="mid" style="width:100%;text-align:center"><b class="jp" style="font-size:26px">${esc(w[1])}</b>
<p class="jp mute" style="margin:2px 0 0">${esc(w[2])}</p>
<p class="jp" style="font-size:22px;margin:10px 0 0;font-weight:700">${esc(meaning(w))} ${sayBtn(w)}</p></div>
<div class="chips" style="margin-top:14px">${GRADES.map((g,i)=>`<button data-mn="grade" data-gd="${i}">${i+1} ${t(...g)}</button>`).join('')}</div>`
:`<div class="mid"><b class="jp" style="font-size:38px">${head(w)}</b>${sayBtn(w)}</div>
<p class="mute" style="margin:8px 0 0"><small>${t('Tap or press Space to reveal','উল্টাতে চাপ দিন বা Space চাপুন')}</small></p>`}
</div>${MV.fl?'':`<div class="dock"><button class="btn" style="width:100%" data-mn="flip">${t('Show meaning','অর্থ দেখুন')}</button></div>`}`};

const words=()=>{const a=lsn(MV.ls),st=lstat(MV.ls);
const rows=a.map((w,s)=>{const stt=stOf(key(MV.ls,s));
return `<div class="wrow">
<button class="lk" data-mn="jump" data-sq="${s}" style="text-align:left"><span class="jp" style="font-size:18px;font-weight:700">${esc(w[0]||w[1])}</span>${w[0]?`<small class="jp mute" style="display:block;font-size:13px">${esc(w[1])}</small>`:''}</button>
<span style="text-align:left"><small class="jp mute" style="display:block;font-size:12px;text-transform:none">${esc(w[2])}</small><span style="display:block;font-size:14px;font-weight:600">${esc(meaning(w))}</span></span>
${sayBtn(w)}
<span class="jx-dot${stt==2?' ok':''}" style="min-width:52px;text-align:right">${['new','learning','mastered'][stt]&&t(...[['new','নতুন'],['learning','শিখছি'],['mastered','আয়ত্ত']][stt])}</span></div>`}).join('');
return `<p class="mute" style="margin:2px 0 8px"><small>${st.st}/${st.n} ${t('started','শুরু')} · ${st.ma} ${t('mastered','আয়ত্ত')} — ${t('tap a word to open its flashcard','ফ্ল্যাশকার্ড খুলতে শব্দে চাপ দিন')}</small></p>
<div class="card">${rows}</div>
<div class="dock"><button class="btn" style="width:100%" data-mn="mode" data-v="cards">${ic('bolt',18)} ${t('Practice this lesson with flashcards','ফ্ল্যাশকার্ড দিয়ে পাঠ অনুশীলন করুন')}</button></div>`};

const buildQuiz=()=>{const a=lsn(MV.ls),pool=a.filter(x=>x[3]||x[4]);
const n=Math.min(10,pool.length);const pick=sh(pool).slice(0,n);
MV.qs=pick.map((x,i)=>{const m=meaning(x);
const dis=sh(pool.filter(y=>y!==x&&(meaning(y))&&meaning(y)!==m)).slice(0,3).map(meaning);
const opts=sh([m,...dis]);return{x,opts,oki:opts.indexOf(m)}});
MV.qi=0;MV.a=null;MV.lock=0;MV.done=0;MV.res=0};

const quiz=()=>{if(!MV.qs)buildQuiz();
if(MV.done){const n=MV.qs.length,p=n?MV.res/n:0;
return `<div class="card fc"><b class="jp" style="font-size:28px">${MV.res}/${n}</b>
<p class="mute">${p>=.8?t('Great work!','দারুণ!'):p>=.5?t('Keep going!','চালিয়ে যাও!'):t('Review the cards and retry.','কার্ড দেখে আবার চেষ্টা করুন।')}</p>
<div class="dock" style="width:100%"><button class="btn" style="width:100%" data-mn="restart">${t('Retake quiz','কুইজ আবার')}</button>
<button class="btn o" style="width:100%;margin-top:8px" data-mn="mode" data-v="cards">${t('Flashcards','ফ্ল্যাশকার্ড')}</button></div></div>`}
const q=MV.qs[MV.qi];
const opts=q.opts.map((o,i)=>`<button class="opt" data-mn="qa" data-i="${i}" ${MV.lock?'disabled':''} ${MV.a==i?'style="box-shadow:inset 0 0 0 3px var(--acc)"':''} aria-label="${esc(o)}"><kbd>${i+1}</kbd><span class="jp">${esc(o)}</span></button>`).join('');
return `<p class="mute" style="margin:10px 0 4px"><small>${t('Question','প্রশ্ন')} ${MV.qi+1}/${MV.qs.length}</small></p>
<div class="bar"><b style="width:${MV.qi/MV.qs.length*100}%"></b></div>
<div class="card fc" style="margin-top:12px"><div class="mid"><b class="jp" style="font-size:34px">${head(q.x)}</b>${sayBtn(q.x)}</div></div>
<div class="opts">${opts}</div>
${MV.a!=null?`<div class="card ${MV.a==q.oki?'fb g':'fb'}" style="margin-top:12px"><b>${MV.a==q.oki?t('Correct!','সঠিক!'):t('Not quite','হয়নি')}</b><p class="jp mute" style="margin:4px 0 0">${esc(q.x[2])} · ${esc(meaning(q.x))}</p><div class="dock"><button class="btn" style="width:100%" data-mn="qnext">${MV.qi+1>=MV.qs.length?t('Results','ফলাফল'):t('Next','পরের')}</button></div></div>`:''}`};

V.mn=()=>{if(cur()!='mn')return;
M.innerHTML=MV.ls?lessonView():`<a class="back" href="#learn">${ic('back',18)} ${t('Study','স্টাডি')}</a><h2>${t('Minna no Nihongo','মিননা নো নিহনগো')}</h2>${browser()}`};
TAB.mn='learn';

/* Study tile — chained after the other extra tiles */
const baseLearn=V.learn;
V.learn=()=>{baseLearn();$('.tiles',M)?.insertAdjacentHTML('beforeend',tile('#mn','book',t('Minna no Nihongo','মিননা নো নিহনগো'),t('50 lessons · 2,692 words','৫০ পাঠ · ২,৬৯২ শব্দ'),'--cg'))};

const grade=g=>{const a=lsn(MV.ls),w=a[MV.i],k=key(MV.ls,MV.i);
S.srs[k]??={ease:2.5,ivl:0,reps:0,lapse:0,due:Date.now()};
S.srs[k]=calc(S.srs[k],g);save();
MV.i++;MV.fl=0;V.mn()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-mn]');if(!b||cur()!='mn')return;
e.stopPropagation();const a=b.dataset.mn;
if(a=='open'){MV.ls=+b.dataset.ls;MV.v='words';MV.i=0;MV.fl=0;MV.qs=null;S.mnLast=MV.ls;save()}
else if(a=='back'){MV.ls=0}
else if(a=='mode'){const v=b.dataset.v;if(v=='quiz'&&MV.v!='quiz')buildQuiz();if(v!='quiz')MV.qs=null;
if(v=='cards'&&MV.i>=lsn(MV.ls).length)MV.i=0;MV.v=v}
else if(a=='jump'){if(+b.dataset.ls&&+b.dataset.ls!=MV.ls){MV.ls=+b.dataset.ls;MV.v='words';MV.i=0;MV.fl=0;MV.qs=null}
MV.i=+b.dataset.sq;MV.fl=0;MV.v='words'}
else if(a=='say')return; /* audio already played by the app's data-say handler */
else if(a=='flip')MV.fl=!MV.fl?1:0;
else if(a=='grade')return grade(+b.dataset.gd);
else if(a=='restart'){if(MV.v=='quiz')buildQuiz();MV.i=0;MV.fl=0;MV.done=0}
else if(a=='qa'){if(MV.lock)return;MV.lock=1;MV.a=+b.dataset.i;const q=MV.qs[MV.qi];if(MV.a==q.oki)MV.res++;V.mn();return}
else if(a=='qnext'){MV.qi++;MV.a=null;MV.lock=0;if(MV.qi>=MV.qs.length)MV.done=1;V.mn();return}
V.mn()});
/* lesson search filters in place — keeps the input focused */
document.addEventListener('input',e=>{if(e.target.id!='mnQ'||cur()!='mn')return;
MS=e.target.value;const el=$('#mnList');if(el)el.innerHTML=MS?searchRows(MS):`<div class="lgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px">${Array.from({length:50},(_,z)=>z+1).map(k=>{const st=lstat(k),p=st.n?st.st/st.n:0,done=st.n&&st.ma>=st.n;
return `<button data-mn="open" data-ls="${k}" style="background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 6px 7px;text-align:center;box-shadow:var(--sh);min-height:52px">
<b style="font-size:17px">${k}</b><small class="mute" style="display:block;font-size:10px">${st.ma}/${st.n}</small>
<div class="bar" style="height:3px;margin-top:4px"><b style="width:${p*100}%;background:var(${done?'--ok':'--acc'})"></b></div></button>`}).join('')}</div>`});
document.addEventListener('keydown',e=>{if(cur()!='mn'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
if(!MV.ls){if((e.key=='Enter'||e.key==' ')&&document.activeElement&&document.activeElement.id=='mnQ')return;return}
if(MV.v=='cards'){if((e.key==' '||e.key=='Enter')&&!MV.fl){e.preventDefault();MV.fl=1;V.mn()}
else if(MV.fl&&'1234'.includes(e.key))grade(+e.key-1)}
else if(MV.v=='quiz'&&!MV.done){
if('1234'.includes(e.key)&&!MV.lock){const i=+e.key-1;if(i<4){MV.lock=1;MV.a=i;const q=MV.qs[MV.qi];if(MV.a==q.oki)MV.res++;V.mn()}}
else if(MV.a!=null&&(e.key=='Enter'||e.key==' ')){e.preventDefault();MV.qi++;MV.a=null;MV.lock=0;if(MV.qi>=MV.qs.length)MV.done=1;V.mn()}}});
})();
