/* Nihoban Minna Dialogues — the textbook conversations (87 tracks, lessons
   1-25) with synced transcripts embedded gzipped in data/dg.js. No audio
   files: each line is spoken by the device's Japanese voice (Android native
   TTS via the bridge, spd-say on Linux, Web Speech in a browser). Tap any
   line to hear it, active-line follow, furigana / reading toggles, playback
   speed for shadowing. */
(()=>{
let DD=null,DV={l:0,tr:0},DI={},DTOK=0;
const key=n=>'d'+n;
const svgIc=(d,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const PPLAY='M8 5v14l11-7z',PPAUSE='M6 5h4v14H6zM14 5h4v14h-4z',PPREV='M6 6h2v12H6zm3.5 6l8.5 6V6z',PNEXT='M16 6h2v12h-2zM6 18l8.5-6L6 6z';
const pad=n=>String(n).padStart(2,'0');
const TT=n=>DD&&DD.t.find(x=>x[0]==n);
const lessonTracks=l=>DD?DD.t.filter(x=>x[1]==l):[];

(async()=>{DD=await dec('dg');
for(let t=0;t<400;t++){if(S&&S.srs!==undefined)break;await new Promise(r=>setTimeout(r,100))}
if(cur()=='dg')V.dg()})();

/* native-voice playback: one utterance per line, chained on end. DTOK guards
   against stale end/error callbacks after a pause, jump or track change. */
const halt=()=>{DTOK++;DI.pl=0;try{speechSynthesis.cancel()}catch(e){}};
const speakFrom=i=>{const T=TT(DV.tr);if(!T||!T[5].length)return;
const tok=++DTOK;DI.pl=1;DI.fin=0;DI.i=Math.max(0,Math.min(i,T[5].length-1));
const u=new SpeechSynthesisUtterance(T[5][DI.i][3]);
u.lang='ja-JP';u.rate=DI.sp||1;
u.onend=()=>{if(tok!=DTOK||cur()!='dg')return;
if(DI.i+1<T[5].length)speakFrom(DI.i+1);
else{/* finishing the track counts it as listened */
DI.pl=0;DI.fin=1;if(!stOf(T[0])){S.dgDone??={};S.dgDone[key(T[0])]=1;save()}V.dg()}};
u.onerror=()=>{if(tok!=DTOK)return;DI.pl=0;paint()};
try{speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){DI.pl=0}
paint()};
const stOf=n=>S.dgDone&&S.dgDone[key(n)]?1:0;
const fmt=s=>{s=Math.max(0,s|0);return (s/60|0)+':'+pad(s%60)};
const barw=(v,h)=>`<div class="bar" style="height:${h||9}px"><b style="width:${Math.min(100,v*100)}%"></b></div>`;

/* strip the narrator header ("第N課 会話 …", "3番 …") for a clean title */
const titleOf=T=>{let s=T[5][0]?T[5][0][3]:'';
s=s.replace(/^第\s*\d+\s*[課日]\s*/,'').replace(/^(会話|かいわ)\s*/,'').replace(/^(問題|もんだい)\s*/,'').replace(/^\d+\s*[番\.]\s*/,'');
return s||(T[3]?'問題 '+T[3]:'会話')};

const allStat=()=>{let n=0,dn=0;DD.t.forEach(T=>{n++;if(stOf(T[0]))dn++});return{n,dn}};

const browser=()=>{if(!DD)return `<div class="card"><span class="ai-loading">${t('Loading…','লোড হচ্ছে…')}</span></div>`;
const s=allStat();
const rows=Array.from({length:25},(_,z)=>z+1).map(l=>{const ts=lessonTracks(l),k=ts.find(x=>x[2]==0),dn=ts.filter(x=>stOf(x[0])).length;
return `<button class="lrow" data-dg="open" data-ls="${l}">
<span class="lno${dn==ts.length?' done':''}" style="${dn==ts.length?'':`background:color-mix(in srgb,var(--${['cv','ck','cg','cq'][l%4]}) 15%,transparent);color:var(--${['cv','ck','cg','cq'][l%4]})`}">${l}</span>
<span style="flex:1"><span class="jp">${esc(titleOf(k))}</span><br><small class="mute">${ts.length} ${t('tracks','ট্র্যাক')} · ${fmt(ts.reduce((a,x)=>a+x[4],0))}</small></span>
<span class="jx-dot${dn==ts.length?' ok':''}" style="flex:none">${dn}/${ts.length}</span></button>`}).join('');
return `<p class="mute" style="margin:2px 0 12px"><small>${t('The Minna no Nihongo conversations, read aloud by your device’s Japanese voice — tap a line to hear it, shadow with slow playback.','মিননা নো নিহনগো কথোপকথন ডিভাইসের জাপানি কণ্ঠে পড়া হয় — লাইনে চাপ দিয়ে শুনুন, ধীরে শুনে অনুসরণ করুন।')}</small></p>
<div class="card" style="text-align:center"><div class="stat" style="margin:0"><span>${t('Listened','শোনা হয়েছে')}</span><b>${s.dn}/${s.n}</b></div>${barw(s.dn/s.n)}</div>
${S.dgLast&&TT(S.dgLast)?`<button class="btn o" style="width:100%;margin:12px 0 0" data-dg="trk" data-tr="${S.dgLast}">${ic('ear',18)} ${t('Continue','চালিয়ে যান')}: ${t('Lesson','পাঠ')} ${TT(S.dgLast)[1]} — ${esc(titleOf(TT(S.dgLast)))}</button>`:''}
<div class="card" style="margin-top:12px">${rows}</div>`};

const lessonView=()=>{const ts=lessonTracks(DV.l);
const rows=ts.map(x=>{const dn=stOf(x[0]);
return `<button class="lrow" data-dg="trk" data-tr="${x[0]}">
<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:11px;flex:none;white-space:nowrap;background:${x[2]?'color-mix(in srgb,var(--cv) 14%,transparent)':'color-mix(in srgb,var(--acc) 14%,transparent)'};color:${x[2]?'var(--cv)':'var(--acc)'}">${x[2]?t('Exercise','অনুশীলন')+' '+x[3]:t('Dialogue','কথোপকথন')}</span>
<span style="flex:1;min-width:0"><span class="jp">${esc(titleOf(x))}</span><br><small class="mute">${fmt(x[4])} · ${x[5].length} ${t('lines','লাইন')}</small></span>
${dn?`<span class="jx-dot ok" style="flex:none">${ic('ok',16)}</span>`:`<span class="jx-dot" style="flex:none"></span>`}</button>`}).join('');
return `<a class="back" href="#dg" data-dg="back">${ic('back',18)} ${t('Lessons','পাঠ')}</a><h2>${t('Lesson','পাঠ')} ${DV.l}</h2>
<p class="mute" style="margin:-4px 0 10px"><small>${ts.filter(x=>stOf(x[0])).length}/${ts.length} ${t('listened','শোনা')}</small></p>
<div class="card">${rows}</div>`};

/* in-place refresh while a track plays — keeps scroll position and focus */
const paint=()=>{const T=TT(DV.tr);if(!T||cur()!='dg'||!DV.tr)return;
const n=T[5].length,i=Math.max(0,Math.min(DI.i||0,n-1));
$$('.dline',M).forEach(el=>{const on=+el.dataset.i==i;el.classList.toggle('on',on);el.classList.toggle('pl',on&&!!DI.pl)});
const bar=$('#dgBar');if(bar)bar.style.width=Math.min(100,(DI.fin?n:i)/n*100)+'%';
const c=$('#dgCur');if(c)c.textContent=`${t('Line','লাইন')} ${Math.min(i+1,n)}/${n}`;
const pp=$('#dgPP');if(pp)pp.innerHTML=svgIc(DI.pl?PPAUSE:PPLAY,20);
const eq=$('#dgEq');if(eq)eq.style.display=DI.pl?'':'none';
if(DI.pl){const el=$$('.dline',M)[i];el&&el.scrollIntoView({block:'nearest',behavior:'smooth'})}};

const player=()=>{const T=TT(DV.tr);if(!T)return browser();
const nm=sp=>(S.dgName&&S.dgName[DV.tr+'-'+sp])||sp;
const u=T[5],n=u.length,i=Math.max(0,Math.min(DI.i||0,n-1));
const lines=u.map((x,j)=>`<div class="dline${j==i?' on':''}${j==i&&DI.pl?' pl':''}" data-dg="line" data-i="${j}" role="button" tabindex="0" aria-label="${t('Play this line','এই লাইনটি শুনুন')}">
<button class="dspk ${x[0]=='A'?'a':'b'}" data-dg="name" data-sp="${x[0]}" title="${t('Rename speaker','বক্তার নাম বদলান')}" aria-label="${t('Rename speaker','বক্তার নাম বদলান')}">${esc(nm(x[0]))}</button>
<div class="dtxt">${(S.dgFur??1)&&x[4]?`<span class="jp dtext">${x[4]}</span>`:`<span class="jp dtext">${esc(x[3])}</span>`}
${(S.dgRead??0)&&x[5]?`<small class="jp mute">${esc(x[5])}</small>`:''}</div></div>`).join('');
const ctl='width:40px;height:40px;min-height:0;border-radius:50%;padding:0;display:grid;place-items:center;flex:none';
return `<a class="back" href="#dg" data-dg="backL">${ic('back',18)} ${t('Lesson','পাঠ')} ${DV.l}</a>
<h2 class="jp" style="font-size:20px">${esc(titleOf(T))}</h2>
<p class="mute" style="margin:-4px 0 10px;display:flex;gap:8px;align-items:center;min-height:18px"><span class="eq" id="dgEq" aria-hidden="true" style="${DI.pl?'':'display:none'}"><i></i><i></i><i></i></span><small>${t('Lesson','পাঠ')} ${T[1]} · ${T[2]?t('Exercise','অনুশীলন')+' '+T[3]:t('Dialogue','কথোপকথন')} · ${n} ${t('lines','লাইন')}${stOf(T[0])?' · '+t('listened','শোনা'):''}</small></p>
<div class="card" style="position:sticky;top:62px;z-index:2">
<div style="display:flex;gap:10px;align-items:center">
<button class="btn o" data-dg="prev" style="${ctl}" aria-label="${t('Previous line','আগের লাইন')}">${svgIc(PPREV,18)}</button>
<button class="btn" data-dg="pp" id="dgPP" style="width:46px;height:46px;min-height:0;border-radius:50%;padding:0;display:grid;place-items:center;flex:none" aria-label="${t('Play / pause','চালাও / থামাও')}">${svgIc(DI.pl?PPAUSE:PPLAY,20)}</button>
<button class="btn o" data-dg="next" style="${ctl}" aria-label="${t('Next line','পরের লাইন')}">${svgIc(PNEXT,18)}</button>
<div style="flex:1;min-width:0"><div class="bar" style="height:9px"><b id="dgBar" style="width:${Math.min(100,(DI.fin?n:i)/n*100)}%"></b></div>
<div style="display:flex;justify-content:space-between"><small class="mute" id="dgCur">${t('Line','লাইন')} ${Math.min(i+1,n)}/${n}</small><small class="mute">${n} ${t('lines','লাইন')}</small></div></div>
<select data-dg="speed" aria-label="${t('Speed','গতি')}" style="flex:none;width:auto;min-height:0;border:1px solid var(--line);border-radius:8px;background:var(--card);color:inherit;padding:6px 4px;font:inherit;font-size:12px">
${[0.6,0.7,0.8,0.9,1,1.2,1.5].map(v=>`<option value="${v}" ${v==(DI.sp||1)?'selected':''}>${v}×</option>`).join('')}</select></div>
${DI.ed?`<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><small class="mute" style="flex:none">${t('Speaker','বক্তা')} ${DI.ed}</small><input id="dgName" value="${esc(nm(DI.ed))}" style="flex:1;min-width:0;min-height:38px;padding:7px 10px;border:1px solid var(--acc);border-radius:8px;background:var(--card);color:inherit;font:inherit;font-size:14px" aria-label="${t('Speaker name','বক্তার নাম')}"><small class="mute" style="flex:none">${t('Enter to save','Enter দিয়ে সেভ')}</small></div>`
:`<div class="chips" style="margin-top:8px">
<button data-dg="tog" data-k="fur" class="${(S.dgFur??1)?'on':''}">${t('Furigana','ফুরিগানা')}</button>
<button data-dg="tog" data-k="read" class="${(S.dgRead??0)?'on':''}">${t('Reading','পড়া')}</button>
<small class="mute" style="align-self:center">${t('Tap a line to jump · tap a name to change it','লাইনে চাপ দিয়ে যান · নামে চাপ দিয়ে বদলান')}</small></div>`}</div>
<div class="card tin" style="margin-top:12px">${lines}</div>
<div class="dock">${(()=>{const ts=lessonTracks(T[1]),ix=ts.findIndex(x=>x[0]==T[0]),nx=ts[ix+1];
return `${nx?`<button class="btn" style="width:100%" data-dg="trk" data-tr="${nx[0]}">${t('Next track','পরের ট্র্যাক')}: ${nx[2]?t('Exercise','অনুশীলন')+' '+nx[3]:t('Dialogue','কথোপকথন')}</button>`:''}
${!stOf(T[0])?`<button class="btn o" style="width:100%;margin-top:8px" data-dg="done">${ic('ok',18)} ${t('Mark as listened','শোনা হয়েছে হিসেবে দাগান')}</button>`:''}`})()}</div>`};

V.dg=()=>{if(cur()!='dg')return;
M.innerHTML=DV.tr?player():DV.l?lessonView():`<a class="back" href="#learn">${ic('back',18)} ${t('Study','স্টাডি')}</a><h2>${t('Minna Dialogues','মিননা ডায়ালগ')}</h2>${browser()}`;
if(DI.ed&&DV.tr){const el=$('#dgName');el&&(el.focus(),el.select())}};
TAB.dg='learn';

const baseLearn=V.learn;
V.learn=()=>{baseLearn();$('.tiles',M)?.insertAdjacentHTML('beforeend',tile('#dg','chat',t('Minna Dialogues','মিননা ডায়ালগ'),t('Native voice · 87 tracks','ডিভাইসের কণ্ঠ · ৮৭ ট্র্যাক'),'--ck'))};

document.addEventListener('click',e=>{const b=e.target.closest('[data-dg]');if(!b||cur()!='dg')return;
e.stopPropagation();const a=b.dataset.dg;
if(a=='open'){halt();DV.l=+b.dataset.ls;DV.tr=0;DI={}}
else if(a=='back'){halt();DV.l=0;DI={}}
else if(a=='backL'){halt();DV.tr=0;DI={}}
else if(a=='trk'){DV.tr=+b.dataset.tr;DV.l=TT(DV.tr)[1];DI={sp:DI.sp};S.dgLast=DV.tr;save();speakFrom(0)}
else if(a=='pp'){if(DI.pl){halt();paint()}else speakFrom(DI.fin?0:(DI.i||0))}
else if(a=='prev')speakFrom(Math.max(0,(DI.i||0)-1));
else if(a=='next'){const T=TT(DV.tr);speakFrom(Math.min(T[5].length-1,(DI.i||0)+1))}
else if(a=='line')speakFrom(+b.dataset.i);
else if(a=='tog'){const k=b.dataset.k;if(k=='fur')S.dgFur=(S.dgFur??1)?0:1;else S.dgRead=(S.dgRead??0)?1:0;save()}
else if(a=='name'){DI.ed=b.dataset.sp}
else if(a=='done'){S.dgDone??={};S.dgDone[key(DV.tr)]=1;save();halt();DI.fin=1}
V.dg()});
document.addEventListener('change',e=>{const s=e.target.closest('[data-dg=speed]');if(!s||cur()!='dg')return;
DI.sp=+s.value;if(DI.pl)speakFrom(DI.i||0)});
document.addEventListener('input',e=>{if(e.target.id=='dgName'&&cur()=='dg'&&DI.ed){S.dgName??={};S.dgName[DV.tr+'-'+DI.ed]=e.target.value;save()}});
/* leaving the rename box closes it */
document.addEventListener('focusout',e=>{if(e.target&&e.target.id=='dgName'&&DI.ed){DI.ed=null;V.dg()}});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id=='dgName'){if(e.key=='Enter'||e.key=='Escape'){e.preventDefault();DI.ed=null;V.dg()}return}
if(cur()!='dg'||!DV.tr||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
const T=TT(DV.tr);
if(e.key==' '){e.preventDefault();if(DI.pl){halt();paint()}else speakFrom(DI.fin?0:(DI.i||0))}
else if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();
const ix=Math.max(0,Math.min(T[5].length-1,(DI.i||0)+(e.key=='ArrowDown'?1:-1)));
speakFrom(ix)}});
window.addEventListener('hashchange',()=>{if(location.hash!='#dg')halt()});
})();