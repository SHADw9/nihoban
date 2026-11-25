/* Nihoban — Grammar course (ব্যাকরণ কোর্স). A 10-chapter Bengali grammar guide
   with explanations, tables, dialogues, self-check drills and 25 homework
   sentences per chapter. Content comes from the standalone grammar app and is
   rendered with Nihoban's tokens, so every palette — including Material 3 —
   and dark mode apply. Reading progress lives in S.gcr. */
(()=>{
let GD=null;
const bd=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const ids=()=>Array.isArray(S.gcr)?S.gcr:[];
const isRead=id=>ids().includes(id);
const note=()=>t('A complete Japanese grammar guide in Bengali: 10 chapters, from sentence order and particles to keigo, with tables, dialogues, self-check drills and 25 translation exercises per chapter.','বাংলায় সম্পূর্ণ জাপানি ব্যাকরণ গাইড: বাক্যগঠন ও পার্টিকেল থেকে কেইগো পর্যন্ত ১০ অধ্যায় — টেবিল, কথোপকথন, সেলফ-চেক ড্রিল ও প্রতি অধ্যায়ে ২৫টি অনুবাদ অনুশীলন।');
const readTxt=(on)=>on?t('Read — tap to undo','পড়া হয়েছে — বাতিল করতে চাপুন'):t('Mark chapter as read','অধ্যায় পড়া শেষ');

const list=()=>{
  if(!GD){M.innerHTML=`<h2>${t('Grammar course','ব্যাকরণ কোর্স')}</h2><p class="mute">${t('Loading…','লোড হচ্ছে…')}</p>`;return}
  const done=GD.ch.filter(c=>isRead(c.id)).length,pct=GD.ch.length?Math.round(done/GD.ch.length*100):0;
  M.innerHTML=`<a class="back" href="#library">${ic('back',18)} ${t('Library','লাইব্রেরি')}</a><h2>${t('Grammar course','ব্যাকরণ কোর্স')}</h2>
<div class="gcwrap"><p class="mute" style="margin:-4px 0 14px"><small>${note()}</small></p>
<div class="gchero"><div class="gcn">${bd(done)}<small> / ${bd(GD.ch.length)}</small></div>
<div style="flex:1;min-width:0"><p>${t('Chapters finished','অধ্যায় শেষ')} · ${bd(pct)}%</p><div class="gcbar"><i style="width:${pct}%"></i></div></div></div>
<ol class="gclist">${GD.ch.map(c=>`<li><a class="gcrow ${isRead(c.id)?'is-read':''}" href="#gc-${c.n}" aria-label="${esc(c.title)} — ${isRead(c.id)?t('read','পড়া হয়েছে'):t('not read yet','এখনো পড়া হয়নি')}">
<span class="gcno" aria-hidden="true">${bd(c.n)}</span><span><b>${c.title}</b><small>${c.kicker}</small></span><span class="gcck" aria-hidden="true">✓</span></a></li>`).join('')}</ol></div>`;
};

/* strip ruby into its reading so TTS says kana, not the kanji */
const reading=el=>{
  const c=el.cloneNode(true);
  c.querySelectorAll('ruby').forEach(r=>{const rt=r.querySelector('rt');r.replaceWith(document.createTextNode(rt?rt.textContent:r.textContent))});
  c.querySelectorAll('rt,rp,button').forEach(x=>x.remove());
  return c.textContent.replace(/[〜~]/g,'').replace(/\s+/g,' ').trim();
};
/* keep the homework controls in the app language and in sync with S.gch */
const syncHW=()=>{
  const g=$('.gcc');if(!g)return;
  const hb=g.querySelector('[data-hw-hint]');
  if(hb){const on=!!S.gch;hb.setAttribute('aria-pressed',String(on));
    hb.textContent=on?t('Hide meanings','শব্দার্থ লুকান'):t('Show meanings','শব্দার্থ দেখান')}
  const rb=g.querySelector('[data-hw-reveal]'),all=$$('.gcc .hw-ans');
  const on=all.length>0&&all.filter(d=>d.open).length===all.length;
  if(rb){rb.setAttribute('aria-pressed',String(on));
    rb.textContent=on?t('Hide all answers','সব উত্তর লুকান'):t('Show all answers','সব উত্তর দেখুন')}
};
const addSay=()=>{
  $$('.gcc .line .ja, .gcc .hw-ans-body p').forEach(el=>{
    if(el.querySelector('.gcsay'))return;
    const txt=reading(el);if(!txt)return;
    const b=document.createElement('button');
    b.type='button';b.className='gcsay';b.dataset.gcsay=txt;
    b.setAttribute('aria-label',(S.lang=='bn'?'শুনুন: ':'Listen: ')+txt);
    b.innerHTML=ic('spk',13);
    el.appendChild(b);
  });
};

const chapter=n=>{
  if(!GD){M.innerHTML=`<h2>${t('Grammar course','ব্যাকরণ কোর্স')}</h2><p class="mute">${t('Loading…','লোড হচ্ছে…')}</p>`;return}
  const c=GD.ch.find(x=>x.n===n);if(!c){location.hash='#gc';return}
  const r=isRead(c.id),prev=GD.ch[n-2],next=GD.ch[n];
  M.innerHTML=`<a class="back" href="#gc">${ic('back',18)} ${t('Grammar course','ব্যাকরণ কোর্স')}</a>
<article class="gcc ${S.fur?'':'nofu'} ${S.gch?'':'nohint'}">
<header class="gchead"><p class="gckick">${c.kicker}</p><h2>${c.title}</h2>${c.toc}</header>
<div class="gcbody">${c.body}</div>
<footer class="gcfoot">
<button class="btn o gcread ${r?'on':''}" data-gcread="${c.id}" aria-pressed="${r}">${ic(r?'ok':'book',16)} ${readTxt(r)}</button>
<div class="gcnext">
${prev?`<a href="#gc-${prev.n}"><small>${t('Previous chapter','আগের অধ্যায়')}</small><b>${prev.title}</b></a>`:''}
${next?`<a href="#gc-${next.n}" class="nx"><small>${t('Next chapter','পরের অধ্যায়')}</small><b>${next.title}</b></a>`
  :`<a href="#gc" class="nx"><small>${t('Finished','শেষ')}</small><b>${t('Back to the course','কোর্সে ফিরুন')}</b></a>`}
</div></footer></article>`;
  addSay();syncHW();
};

V.gc=list;
for(let n=1;n<=10;n++){V['gc-'+n]=()=>chapter(n);TAB['gc-'+n]='library'}

document.addEventListener('click',e=>{
  const r=cur();if(r!='gc'&&!r.startsWith('gc-'))return;
  const b=e.target.closest('[data-gcsay]');
  if(b){say(b.dataset.gcsay);return}
  const a=e.target.closest('.gcc a[href^="#"]');
  if(a&&!a.closest('.gcnext')){e.preventDefault();const el=document.getElementById(a.getAttribute('href').slice(1));if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return}
  const rd=e.target.closest('[data-gcread]');
  if(rd){
    const id=rd.dataset.gcread,set=new Set(ids());
    if(set.has(id))set.delete(id);else set.add(id);
    S.gcr=[...set];save();
    const on=set.has(id);
    rd.classList.toggle('on',on);rd.setAttribute('aria-pressed',String(on));
    rd.innerHTML=`${ic(on?'ok':'book',16)} ${readTxt(on)}`;
    return;
  }
  const hb=e.target.closest('[data-hw-hint]');
  if(hb){
    const g=$('.gcc');if(!g)return;
    const show=g.classList.contains('nohint');      // currently hidden → reveal
    g.classList.toggle('nohint',!show);S.gch=show?1:0;save();
    hb.setAttribute('aria-pressed',String(show));
    hb.textContent=show?t('Hide meanings','শব্দার্থ লুকান'):t('Show meanings','শব্দার্থ দেখান');
    return;
  }
  const rb=e.target.closest('[data-hw-reveal]');
  if(rb){
    const open=rb.getAttribute('aria-pressed')!='true';
    $$('.gcc .hw-ans').forEach(d=>d.open=open);
    rb.setAttribute('aria-pressed',String(open));
    rb.textContent=open?t('Hide all answers','সব উত্তর লুকান'):t('Show all answers','সব উত্তর দেখুন');
  }
});

document.addEventListener('toggle',e=>{
  const d=e.target;
  if(!d.matches||!d.matches('.gcc .hw-ans'))return;
  const g=d.closest('.gcc'),rb=g&&g.querySelector('[data-hw-reveal]');
  if(!rb)return;
  const all=$$('.gcc .hw-ans'),open=all.filter(x=>x.open).length,on=all.length>0&&open===all.length;
  rb.setAttribute('aria-pressed',String(on));
  rb.textContent=on?t('Hide all answers','সব উত্তর লুকান'):t('Show all answers','সব উত্তর দেখুন');
},true);

(async()=>{
  try{
    GD=await dec('gc');
    const r=cur();
    if(r=='gc')V.gc();else if(r.startsWith('gc-')&&V[r])V[r]();
  }catch(e){}
})();
})();
