/* Nihoban — Grammar course (ব্যাকরণ কোর্স): N5 = Minna no Nihongo I,
   N4 = Minna no Nihongo II. Each guide ships as a data blob that carries its
   own scoped stylesheet; a course renders in a shadow root, so its many
   course-specific classes can never leak into the app and the app's palette
   tokens (light/dark, M3, every scheme) flow in through inherited custom
   properties. Progress is S.gcr for N5 and S.gcr4 for N4. */
(()=>{
/* The old 10-chapter course stored chapter numbers in S.gcr/S.gcl; this N5
   course counts 25 lessons, so drop that stale progress once. */
if(!S.gc2){if(S.gcr?.length)S.gcr=[];if(S.gcl)S.gcl=0;S.gc2=1;save()}
let GD=null, GD4=null, SH=null, HOST=null, IO=null, PEND='0';
const bd=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const REDUCED=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const el=(root,id)=>root.querySelector('[id="'+id.replace(/"/g,'')+'"]');

const COURSES=[
  {id:'n5',lab:'N5',title:'মিন্না নো নিহোঙ্গো I',sub:'Minna no Nihongo I',
   from:1,to:25,home:'gc-n5',progress:'gcr',last:'gcl',acc:'--cq',
   route:n=>'gc-'+n,xroute:s=>'gc-'+s,data:()=>GD,
   extras:{intro:'intro',reference:'ref',answers:'ans',practice:'practice',vocab:'vocab',kanji:'kanji','book-basic':'basic','book-expression':'expr','book-tests':'tests'}},
  {id:'n4',lab:'N4',title:'মিন্না নো নিহোঙ্গো II',sub:'Minna no Nihongo II',
   from:26,to:50,home:'gc-n4',progress:'gcr4',last:'gcl4',acc:'--cg',
   route:n=>'gc-n4-'+n,xroute:s=>'gc-n4-'+s,data:()=>GD4,
   extras:{intro:'intro',bonus:'bonus',pathk:'diff',self:'routine'}}
];
const N5=COURSES[0], N4=COURSES[1];
const courseFor=n=>n>=N4.from&&n<=N4.to?N4:N5;
const pageOf=(c,id)=>{const d=c.data();return d&&d.pages.find(p=>p.id===id)};
const doneOf=c=>Array.isArray(S[c.progress])?S[c.progress].map(Number).filter(n=>n>=c.from&&n<=c.to):[];

/* course-internal hrefs → app routes */
const routeFor=(c,id)=>{
  if(id==='home')return '#'+c.home;
  const m=/^lesson-(\d+)$/.exec(id);if(m)return '#'+c.route(+m[1]);
  if(c.extras[id])return '#'+c.xroute(c.extras[id]);
  return null;
};

const loading=()=>{M.innerHTML=`<a class="back" href="#library">${ic('back',18)} ${t('Library','লাইব্রেরি')}</a><h2>${t('Grammar course','ব্যাকরণ কোর্স')}</h2><p class="mute">${t('Loading…','লোড হচ্ছে…')}</p>`};

const paintDone=(sh,c)=>{
  const set=new Set(doneOf(c));
  sh.querySelectorAll('[data-l]').forEach(e=>{
    const n=Number(String(e.dataset.l).replace('lesson-',''));
    if(e.classList.contains('done-btn')){
      const on=set.has(n);
      e.setAttribute('aria-pressed',String(on));
      e.textContent=on?t('Unmark as done','সম্পন্ন চিহ্ন সরান'):t('Mark as done','সম্পন্ন চিহ্নিত করুন');
    }else e.classList.toggle('done',set.has(n));
  });
};

const wireTTS=sh=>{
  sh.querySelectorAll('.say').forEach(b=>{b.hidden=false});
};

const observeSections=sh=>{
  if(IO)IO.disconnect();
  const snav=sh.querySelector('.snav');if(!snav)return;
  IO=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    snav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===e.target.id));
  }),{rootMargin:'-15% 0px -75% 0px'});
  sh.querySelectorAll('.sec[id]').forEach(x=>IO.observe(x));
};

const shell=(c,id,body)=>{
  const home=id==='home';
  const label=t(c.lab+' course',c.lab+' কোর্স');
  const back=home
    ?`<a class="back" href="#gc">${ic('back',18)} ${t('Grammar course','ব্যাকরণ কোর্স')}</a>`
    :`<a class="back" href="#${c.home}">${ic('back',18)} ${label}</a>`;
  M.innerHTML=`<div class="gctop">${back}<span class="gcpill">${c.lab}</span>${home?`<span class="gcmute">${bd(doneOf(c).length)} / ${bd(c.to-c.from+1)} ${t('lessons done','লেসন সম্পন্ন')}</span>`:''}</div><div id="gcshell"></div>`;
  HOST=document.getElementById('gcshell');
  SH=HOST.attachShadow({mode:'open'});
  SH.innerHTML=`<style>${c.data().css}</style><div class="gcc ${S.fur?'':'nof'}"><div class="view">${body}</div></div>`;
  paintDone(SH,c);wireTTS(SH);
  bind(SH,c);
  if(home){
    const go=SH.querySelector('#go'),n=Number(S[c.last])||0;
    if(go&&n>=c.from&&n<=c.to){
      go.setAttribute('href','#'+c.route(n));
      go.textContent=t('Continue: lesson ','চালিয়ে যান: লেসন ')+bd(n);
    }
  }
  observeSections(SH);
  if(c===N5&&id==='practice')initPractice(SH);
};

const bind=(sh,c)=>{
  sh.addEventListener('click',e=>{
    /* narration */
    const sb=e.target.closest('.say');
    if(sb){
      const p=sb.closest('.jp');
      if(p){const c=p.cloneNode(true);c.querySelectorAll('rt,rp,.say').forEach(x=>x.remove());const txt=c.textContent.replace(/\s+/g,' ').trim();if(txt)say(txt)}
      return;
    }
    /* section jumps */
    const j=e.target.closest('.jump');
    if(j&&j.dataset.t){
      const tgt=el(sh,j.dataset.t);
      if(tgt)tgt.scrollIntoView({behavior:REDUCED()?'auto':'smooth',block:'start'});
      return;
    }
    /* read-done toggle */
    const d=e.target.closest('.done-btn');
    if(d){
      const n=Number(String(d.dataset.l).replace('lesson-',''));
      const cc=courseFor(n), set=new Set(doneOf(cc));
      set.has(n)?set.delete(n):set.add(n);
      S[cc.progress]=[...set].sort((a,b)=>a-b);save();
      paintDone(sh,c);
      return;
    }
    /* "practise this lesson's words" */
    const g=e.target.closest('.gop');
    if(g){PEND=g.dataset.n||'0';location.hash='#gc-practice';return}
    const pr=e.target.closest('.print');
    if(pr){try{window.print()}catch(x){}return}
    /* practice centre */
    if(handlePractice(sh,e))return;
    /* links */
    const a=e.target.closest('a[href^="#"]');
    if(a){
      const id=a.getAttribute('href').slice(1);
      const r=routeFor(c,id);
      if(r){e.preventDefault();location.hash=r;return}
      const tgt=el(sh,id);
      if(tgt){e.preventDefault();tgt.scrollIntoView({behavior:REDUCED()?'auto':'smooth',block:'start'});return}
    }
  });
  sh.addEventListener('change',e=>{
    if(e.target.id==='pl'){resetPractice();pr(sh)}
  });
  sh.addEventListener('input',e=>{
    const f=e.target.closest('.flt');
    if(f){
      const q=f.value.trim().toLowerCase(),c=el(sh,f.dataset.for);
      if(c){
        c.querySelectorAll('li').forEach(li=>li.hidden=!!q&&!li.textContent.toLowerCase().includes(q));
        c.querySelectorAll('.grp').forEach(grp=>grp.hidden=!grp.querySelector('li:not([hidden])'));
      }
    }
    const b=e.target.closest('.bkq');
    if(b){
      const q=b.value.trim().toLowerCase();
      sh.querySelectorAll('.bk-blk').forEach(x=>x.hidden=!!q&&!x.textContent.toLowerCase().includes(q));
      sh.querySelectorAll('.bk-tw').forEach(x=>x.hidden=!!q&&!x.querySelector('tbody tr:not([hidden])'));
      sh.querySelectorAll('.bk-pg').forEach(x=>x.hidden=!!q);
      sh.querySelectorAll('.sec.bk').forEach(x=>x.hidden=!!q&&!x.querySelector('.bk-blk:not([hidden])'));
    }
  });
};

const hub=()=>{
  const sub=c=>`${c.sub} · ${bd(doneOf(c).length)}/${bd(c.to-c.from+1)} ${t('lessons','লেসন')}`;
  M.innerHTML=`<a class="back" href="#library">${ic('back',18)} ${t('Library','লাইব্রেরি')}</a>
    <h2>${t('Grammar course','ব্যাকরণ কোর্স')}</h2>
    <p class="mute">${t('Choose a level.','একটি স্তর বেছে নিন।')}</p>
    <div class="tiles" style="margin-top:14px">
      ${COURSES.map(c=>tile('#'+c.home,'note',c.lab,sub(c),c.acc)).join('')}
      ${['n3','n2','n1'].map((id,i)=>tile('#gc-'+id,'note',id.toUpperCase(),t('Content coming soon','কনটেন্ট শীঘ্রই আসছে'),['--cv','--ck','--gold'][i])).join('')}
    </div>`;
};

const cover=c=>{
  if(!c.data())return loading();
  shell(c,'home',pageOf(c,'home').body);
};

const soon=id=>{
  M.innerHTML=`<a class="back" href="#gc">${ic('back',18)} ${t('Grammar course','ব্যাকরণ কোর্স')}</a>
    <h2>${id.toUpperCase()} ${t('course','কোর্স')}</h2>
    <p class="mute">${t('Content for this level is coming soon.','এই স্তরের কনটেন্ট শীঘ্রই যোগ করা হবে।')}</p>`;
};

const lesson=(c,n)=>{
  if(!c.data())return loading();
  const p=pageOf(c,'lesson-'+n);if(!p){location.hash='#'+c.home;return}
  S[c.last]=n;save();
  shell(c,'lesson-'+n,p.body);
};

const extra=(c,id)=>{
  if(!c.data())return loading();
  const p=pageOf(c,id);if(!p){location.hash='#'+c.home;return}
  shell(c,id,p.body);
};

/* ---------- practice centre ---------- */
const P={m:'fc',deck:[],i:0,f:false,q:null,l:null};
const resetPractice=()=>{P.deck=[];P.i=0;P.f=false;P.q=null;P.l=null};
const bn=n=>bd(n);
const shuf=a=>[...a].sort(()=>Math.random()-.5);

const initPractice=sh=>{
  const sel=sh.querySelector('#pl');
  if(sel&&PEND&&PEND!=='0')sel.value=PEND;
  resetPractice();pr(sh);
};

const pool=sh=>{
  const sel=sh.querySelector('#pl');
  const n=sel?sel.value:'0';
  return n==='0'?GD.vocab:GD.vocab.filter(x=>String(x[0])===n);
};

const pr=sh=>{
  const b=sh.querySelector('#pp');if(!b)return;
  sh.querySelectorAll('#pm button').forEach(x=>x.classList.toggle('on',x.dataset.m===P.m));
  if(P.m==='fc'){
    if(!P.deck.length){P.deck=shuf(pool(sh));P.i=0;P.f=false}
    if(!P.deck.length){b.textContent=t('No words in this lesson.','এই লেসনে শব্দ নেই।');return}
    const c=P.deck[P.i];
    b.innerHTML=`<button type="button" class="fcard" data-a="flip"><span class="jp big2" lang="ja">${c[1]}</span>${P.f
      ?`<span class="ro">${c[2]}</span><span class="mn2">${c[3]}</span>`
      :`<span class="hint2">${t('Tap to flip','উল্টাতে ট্যাপ করুন')}</span>`}</button>
      <p class="cnt">${bn(P.i+1)} / ${bn(P.deck.length)} · ${t('Lesson','লেসন')} ${bn(c[0])}</p>
      <div class="row"><button type="button" data-a="prev">${t('Previous','আগের')}</button><button type="button" data-a="flip">${t('Flip','উল্টান')}</button><button type="button" data-a="next">${t('Next','পরের')}</button><button type="button" data-a="shuf">${t('Shuffle','মেশান')}</button></div>`;
  }else if(P.m==='qz'){
    const p=pool(sh);if(p.length<4){b.textContent=t('A quiz needs at least 4 words.','কুইজের জন্য কমপক্ষে ৪টি শব্দ দরকার।');return}
    if(!P.q)P.q={l:shuf(p).slice(0,10),n:0,s:0,o:null};
    const q=P.q;
    if(q.n>=q.l.length){
      b.innerHTML=`<p class="score">${t('Score','স্কোর')}: ${bn(q.s)} / ${bn(q.l.length)}</p><div class="row"><button type="button" data-a="again">${t('Play again','আবার খেলুন')}</button></div>`;
      return;
    }
    const c=q.l[q.n];
    if(!q.o){
      const seen=new Set([c[3]]),w=[];
      for(const x of shuf(GD.vocab)){if(!seen.has(x[3])){seen.add(x[3]);w.push(x)}if(w.length===3)break}
      q.o=shuf([c,...w]);
    }
    b.innerHTML=`<p class="cnt">${t('Question','প্রশ্ন')} ${bn(q.n+1)} / ${bn(q.l.length)}</p><p class="jp big2" lang="ja">${c[1]}</p><p>${t('What does it mean?','এর অর্থ কী?')}</p><div class="opts">${q.o.map((x,i)=>`<button type="button" data-a="opt" data-i="${i}">${x[3]}</button>`).join('')}</div><p class="fb"></p>`;
  }else{
    if(!P.l){
      const sel=sh.querySelector('#pl'),n=sel?sel.value:'0';
      const src=n==='0'?GD.sentences:GD.sentences.filter(x=>String(x[0])===n);
      P.l={l:shuf(src),i:0,s:false};
    }
    const l=P.l,c=l.l[l.i];
    if(!c){b.textContent=t('No sentences in this lesson.','এই লেসনে বাক্য নেই।');return}
    b.innerHTML=`<p class="cnt">${t('Sentence','বাক্য')} ${bn(l.i+1)} / ${bn(l.l.length)} · ${t('Lesson','লেসন')} ${bn(c[0])}</p>
      <div class="row"><button type="button" data-a="play">${t('Play','বাজান')}</button><button type="button" data-a="show">${l.s?t('Hide text','লেখা লুকান'):t('Show text','লেখা দেখান')}</button><button type="button" data-a="lnext">${t('Next sentence','পরের বাক্য')}</button></div>
      ${l.s?`<p class="jp" lang="ja">${c[2]}</p><p class="tr">${c[3]}</p>`:''}`;
  }
};

const handlePractice=(sh,e)=>{
  const mode=e.target.closest('#pm button');
  if(mode){P.m=mode.dataset.m;P.q=null;P.l=null;pr(sh);return true}
  const a=e.target.closest('#pp [data-a]');
  if(!a)return false;
  const k=a.dataset.a;
  if(k==='flip')P.f=!P.f;
  else if(k==='next'){P.i=(P.i+1)%P.deck.length;P.f=false}
  else if(k==='prev'){P.i=(P.i-1+P.deck.length)%P.deck.length;P.f=false}
  else if(k==='shuf'){P.deck=[]}
  else if(k==='again'){P.q=null}
  else if(k==='opt'){
    const q=P.q,c=q.l[q.n],x=q.o[+a.dataset.i],ok=x===c;
    if(ok)q.s++;
    sh.querySelectorAll('.opts button').forEach((bt,i)=>{
      bt.disabled=true;
      if(q.o[i]===c)bt.classList.add('ok');
      else if(i===+a.dataset.i)bt.classList.add('no');
    });
    const fb=sh.querySelector('.fb');
    if(fb)fb.innerHTML=(ok?t('Correct. ','সঠিক। '):t('Wrong. Correct answer: ','ভুল। সঠিক উত্তর: ')+c[3]+t('. ','। '))+`<button type="button" data-a="nq">${t('Next question','পরের প্রশ্ন')}</button>`;
    return true;
  }
  else if(k==='nq'){P.q.n++;P.q.o=null}
  else if(k==='play'){const l=P.l,c=l.l[l.i];if(c)say(c[1]);return true}
  else if(k==='show')P.l.s=!P.l.s;
  else if(k==='lnext'){P.l.i=(P.l.i+1)%P.l.l.length;P.l.s=false}
  pr(sh);return true;
};

/* ---------- routes ---------- */
V.gc=hub;
for(const c of COURSES){
  V[c.home]=()=>cover(c);TAB[c.home]='library';
  for(let n=c.from;n<=c.to;n++){V[c.route(n)]=()=>lesson(c,n);TAB[c.route(n)]='library'}
  for(const [pid,slug] of Object.entries(c.extras)){
    const r=c.xroute(slug);
    V[r]=()=>extra(c,pid);
    TAB[r]='library';
  }
}
for(const id of ['n3','n2','n1']){V['gc-'+id]=()=>soon(id);TAB['gc-'+id]='library'}

(async()=>{
  const [a,b]=await Promise.allSettled([dec('gc'),dec('gc4')]);
  if(a.status==='fulfilled')GD=a.value;
  if(b.status==='fulfilled')GD4=b.value;
  const r=cur();
  if(V[r]&&(r==='gc'||r.startsWith('gc-')))V[r]();
})();
})();
