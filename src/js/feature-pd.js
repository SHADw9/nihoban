
/* Nihoban Japanese Podcast — listening-practice episodes (N5 first, more to come).
   Each episode is one file in src/audio/podcast-<lv>-<nn>.ogg with its synced
   transcript loaded from data/pd.js: same synced player as Minna Dialogues —
   tap a line to seek, active-line follow, furigana / reading toggles, speed. */
(()=>{
let PD=null,PV={e:0},PA=null,PI={};
const ekey=T=>T[1].toLowerCase()+'-'+T[0];
const svgIc=(d,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const PPLAY='M8 5v14l11-7z',PPAUSE='M6 5h4v14H6zM14 5h4v14h-4z';
const pad=n=>String(n).padStart(2,'0');
const EP=n=>PD&&PD.e.find(x=>x[0]==n);
const LVC={N5:'--ck',N4:'--cq',N3:'--cv',N2:'--cg',N1:'--cv'};

(async()=>{PD=await dec('pd');
for(let t=0;t<400;t++){if(S&&S.srs!==undefined)break;await new Promise(r=>setTimeout(r,100))}
if(cur()=='pd')V.pd()})();

const audio=()=>{if(!PA){PA=new Audio();PA.preload='metadata';
/* finishing an episode counts it as listened */
PA.onended=()=>{PI.pl=0;if(PV.e&&!stOf(PV.e)){S.pdDone??={};S.pdDone[ekey(EP(PV.e))]=1;save();V.pd()}}}
const T=EP(PV.e),src=`audio/podcast-${T[1].toLowerCase()}-${pad(T[0])}.ogg`;
if(!PA.src.endsWith(src)){PA.src=src;PA.load()}
/* a load that stalled while the view was hidden gets one retry */
else if(PA.readyState==0&&PA.networkState==2&&!PA.error)PA.load();
return PA};
/* seeking before the metadata loads silently fails — queue it */
const seekTo=s=>{const A=audio();if(A.readyState>=1)A.currentTime=s;
else A.addEventListener('loadedmetadata',()=>{A.currentTime=s},{once:true})};
const stOf=n=>S.pdDone&&S.pdDone[ekey(EP(n))]?1:0;
const fmt=s=>{s=Math.max(0,s|0);return (s/60|0)+':'+pad(s%60)};
const barw=(v,h)=>`<div class="bar" style="height:${h||9}px"><b style="width:${Math.min(100,v*100)}%"></b></div>`;

const browser=()=>{if(!PD)return `<div class="card"><span class="ai-loading">${t('Loading…','লোড হচ্ছে…')}</span></div>`;
const dn=PD.e.filter(x=>stOf(x[0])).length;
const rows=PD.e.map(T=>{const dn2=stOf(T[0]),c=(LVC[T[1]]||'--ck').slice(2);
return `<button class="lrow" data-pd="trk" data-tr="${T[0]}">
<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:11px;flex:none;background:color-mix(in srgb,var(--${c}) 14%,transparent);color:var(--${c})">${T[1]}</span>
<span style="flex:1;min-width:0"><span class="jp">${esc(T[3])}</span><br><small class="mute">${fmt(T[2])} · ${T[6].length} ${t('lines','লাইন')} · ${esc(T[4])}</small></span>
${dn2?`<span class="jx-dot ok" style="flex:none">${ic('ok',16)}</span>`:`<span class="jx-dot" style="flex:none"></span>`}</button>`}).join('');
return `<p class="mute" style="margin:2px 0 12px"><small>${t('Japanese listening practice with synced transcripts — tap a line to hear it, shadow with slow playback.','জাপানি শোনার অনুশীলন সিঙ্কড ট্রান্সক্রিপ্টসহ — লাইনে চাপ দিয়ে শুনুন, ধীরে শুনে অনুসরণ করুন।')}</small></p>
<div class="card" style="text-align:center"><div class="stat" style="margin:0"><span>${t('Listened','শোনা হয়েছে')}</span><b>${dn}/${PD.e.length}</b></div>${barw(PD.e.length?dn/PD.e.length:0)}</div>
${S.pdLast&&EP(S.pdLast)?`<button class="btn o" style="width:100%;margin:12px 0 0" data-pd="trk" data-tr="${S.pdLast}">${ic('ear',18)} ${t('Continue','চালিয়ে যান')}: ${esc(EP(S.pdLast)[3])}</button>`:''}
<div class="card" style="margin-top:12px">${rows}</div>`};

const player=()=>{const T=EP(PV.e);if(!T)return browser();
const nm=sp=>(S.pdName&&S.pdName[ekey(T)+'-'+sp])||sp;
const u=T[6],lines=u.map((x,i)=>`<div class="dline${PI.ai==i?' on':''}" data-pd="line" data-i="${i}" role="button" tabindex="0" aria-label="${t('Play this line','এই লাইনটি শুনুন')}">
<button class="dspk ${x[0]=='A'?'a':'b'}" data-pd="name" data-sp="${x[0]}" title="${t('Rename speaker','বক্তার নাম বদলান')}" aria-label="${t('Rename speaker','বক্তার নাম বদলান')}">${esc(nm(x[0]))}</button>
<div class="dtxt">${(S.pdFur??1)&&x[4]?`<span class="jp dtext">${x[4]}</span>`:`<span class="jp dtext">${esc(x[3])}</span>`}
${(S.pdRead??0)&&x[5]?`<small class="jp mute">${esc(x[5])}</small>`:''}</div></div>`).join('');
return `<a class="back" href="#pd" data-pd="back">${ic('back',18)} ${t('Episodes','পর্ব')}</a>
<h2 class="jp" style="font-size:20px">${esc(T[3])}</h2>
<p class="mute" style="margin:-4px 0 10px;display:flex;gap:8px;align-items:center;min-height:18px">${PI.pl?`<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>`:''}<small>${t('Episode','পর্ব')} ${T[0]} · ${T[1]} · ${fmt(T[2])}${stOf(T[0])?' · '+t('listened','শোনা'):''}${T[4]?` · <a href="${T[5]}" target="_blank" rel="noopener" style="color:var(--pri)">${esc(T[4])}</a>`:''}</small></p>
<div class="card" style="position:sticky;top:62px;z-index:2">
<div style="display:flex;gap:12px;align-items:center">
<button class="btn" data-pd="pp" style="width:46px;height:46px;min-height:0;border-radius:50%;padding:0;display:grid;place-items:center;flex:none" aria-label="${t('Play / pause','চালাও / থামাও')}">${svgIc(PI.pl?PPAUSE:PPLAY,20)}</button>
<div style="flex:1;min-width:0"><input id="pdSeek" type="range" min="0" max="${T[2]}" step="0.1" value="${PI.t||0}" style="width:100%" aria-label="${t('Seek','সিক')}">
<div style="display:flex;justify-content:space-between"><small class="mute" id="pdCur">${fmt(PI.t||0)}</small><small class="mute">${fmt(T[2])}</small></div></div>
<select data-pd="speed" aria-label="${t('Speed','গতি')}" style="flex:none;width:auto;min-height:0;border:1px solid var(--line);border-radius:8px;background:var(--card);color:inherit;padding:6px 4px;font:inherit;font-size:12px">
${[0.6,0.7,0.8,0.9,1,1.2,1.5].map(v=>`<option value="${v}" ${v==(PI.sp||1)?'selected':''}>${v}×</option>`).join('')}</select></div>
${PI.ed?`<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><small class="mute" style="flex:none">${t('Speaker','বক্তা')} ${PI.ed}</small><input id="pdName" value="${esc(nm(PI.ed))}" style="flex:1;min-width:0;min-height:38px;padding:7px 10px;border:1px solid var(--acc);border-radius:8px;background:var(--card);color:inherit;font:inherit;font-size:14px" aria-label="${t('Speaker name','বক্তার নাম')}"><small class="mute" style="flex:none">${t('Enter to save','Enter দিয়ে সেভ')}</small></div>`
:`<div class="chips" style="margin-top:8px">
<button data-pd="tog" data-k="fur" class="${(S.pdFur??1)?'on':''}">${t('Furigana','ফুরিগানা')}</button>
<button data-pd="tog" data-k="read" class="${(S.pdRead??0)?'on':''}">${t('Reading','পড়া')}</button>
${[0,1,2].map(v=>`<button data-pd="ts" data-v="${v}" class="${(S.pdTs??1)==v?'on':''}" style="min-width:0;padding:5px ${8+v*3}px;font-size:${11+v*3}px;line-height:1" title="${t('Transcript text size','ট্রান্সক্রিপ্টের লেখার সাইজ')}" aria-label="${t('Transcript text size','ট্রান্সক্রিপ্টের লেখার সাইজ')}">A</button>`).join('')}
<small class="mute" style="align-self:center">${t('Tap a line to jump · tap a name to change it','লাইনে চাপ দিয়ে যান · নামে চাপ দিয়ে বদলান')}</small></div>`}</div>
<div class="card tin" style="margin-top:12px;--dts:${[16,19,22][(S.pdTs??1)]}px">${lines}</div>
<div class="dock">${!stOf(T[0])?`<button class="btn o" style="width:100%" data-pd="done">${ic('ok',18)} ${t('Mark as listened','শোনা হয়েছে হিসেবে দাগান')}</button>`:''}</div>`};

V.pd=()=>{if(cur()!='pd')return;
M.innerHTML=PV.e?player():`<a class="back" href="#learn">${ic('back',18)} ${t('Study','স্টাডি')}</a><h2>${t('Japanese Podcast','জাপানিজ পডকাস্ট')}</h2>${browser()}`;
if(PI.ed&&PV.e){const el=$('#pdName');el&&(el.focus(),el.select())}};
TAB.pd='learn';

const baseLearn3=V.learn;
V.learn=()=>{baseLearn3();$('.tiles',M)?.insertAdjacentHTML('beforeend',tile('#pd','mic',t('Japanese Podcast','জাপানিজ পডকাস্ট'),t('Listening practice · N5','শোনার অনুশীলন · N5'),'--cq'))};

const activeIdx=(T,cur)=>{let lo=0,hi=T[6].length-1,r=-1;
while(lo<=hi){const m=(lo+hi)>>1;if(T[6][m][1]<=cur){r=m;lo=m+1}else hi=m-1}return r<0?0:r};

const tick=()=>{const T=EP(PV.e);if(!T||!PA||!PA.src)return;
PI.t=PA.currentTime||0;
const sl=$('#pdSeek');if(sl){if(document.activeElement!=sl)sl.value=PI.t;
sl.style.background=`linear-gradient(90deg,var(--acc) ${T[2]?Math.min(100,PI.t/T[2]*100):0}%,var(--line) 0)`}
const c=$('#pdCur');if(c)c.textContent=fmt(PI.t);
const ix=activeIdx(T,PI.t);
if(ix!=PI.ai){PI.ai=ix;$$('.dline',M).forEach(el=>el.classList.toggle('on',+el.dataset.i==ix));
if(ix>=0&&!PA.paused){const el=$$('.dline',M)[ix];el&&el.scrollIntoView({block:'nearest',behavior:'smooth'})}}
/* the active line floats only while audio is actually playing */
const onEl=$('.dline.on',M);if(onEl)onEl.classList.toggle('pl',!PA.paused)};

setInterval(tick,250);

document.addEventListener('click',e=>{const b=e.target.closest('[data-pd]');if(!b||cur()!='pd')return;
e.stopPropagation();const a=b.dataset.pd;
if(a=='trk'){PV.e=+b.dataset.tr;PI={sp:PI.sp};S.pdLast=PV.e;save();const A=audio();if(PI.sp)A.playbackRate=PI.sp;A.play().catch(()=>{});PI.pl=1}
else if(a=='back'){PV.e=0;PI={};PA&&PA.pause()}
else if(a=='pp'){const A=audio();if(PI.pl){A.pause();PI.pl=0}else{A.play().catch(()=>{});PI.pl=1}}
else if(a=='line'){const T=EP(PV.e),x=T[4][+b.dataset.i];seekTo(x[1]);if(!PI.pl){PA.play().catch(()=>{});PI.pl=1}tick()}
else if(a=='tog'){const k=b.dataset.k;if(k=='fur')S.pdFur=(S.pdFur??1)?0:1;else S.pdRead=(S.pdRead??0)?1:0;save()}
else if(a=='ts'){S.pdTs=+b.dataset.v;save()}
else if(a=='name'){PI.ed=b.dataset.sp}
else if(a=='done'){S.pdDone??={};S.pdDone[ekey(EP(PV.e))]=1;save();PA&&PA.pause();PI.pl=0}
V.pd()});
document.addEventListener('change',e=>{const s=e.target.closest('[data-pd=speed]');if(!s||cur()!='pd')return;
PI.sp=+s.value;if(PA)PA.playbackRate=PI.sp});
document.addEventListener('input',e=>{if(e.target.id=='pdName'&&cur()=='pd'&&PI.ed){S.pdName??={};S.pdName[ekey(EP(PV.e))+'-'+PI.ed]=e.target.value;save();return}
if(e.target.id!='pdSeek'||cur()!='pd')return;
const A=audio();A.currentTime=+e.target.value;PI.t=A.currentTime;tick()});
/* leaving the rename box closes it */
document.addEventListener('focusout',e=>{if(e.target&&e.target.id=='pdName'&&PI.ed){PI.ed=null;V.pd()}});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id=='pdName'){if(e.key=='Enter'||e.key=='Escape'){e.preventDefault();PI.ed=null;V.pd()}return}
if(cur()!='pd'||!PV.e||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
const T=EP(PV.e);
if(e.key==' '){e.preventDefault();const A=audio();if(PI.pl){A.pause();PI.pl=0}else{A.play().catch(()=>{});PI.pl=1}V.pd()}
else if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();
const ix=activeIdx(T,PA?PA.currentTime:0)+(e.key=='ArrowDown'?1:-1);
if(ix>=0&&ix<T[6].length){seekTo(T[6][ix][1]);if(!PI.pl){PA.play().catch(()=>{});PI.pl=1}tick()}}});
window.addEventListener('hashchange',()=>{if(location.hash!='#pd'&&PA)PA.pause()});
})();
