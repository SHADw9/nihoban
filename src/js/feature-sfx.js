
/* Nihoban — Swap the suffix: Japanese verbs & adjectives (temp feature).
   Ported from the standalone "Swap the suffix" page: 3,511 verbs and
   adjectives with Bangla meanings, stem/suffix splitting, casual → polite →
   more-forms steps and a timed suffix quiz. Adds a library example sentence
   when the dictionary form also exists in Nihoban's vocabulary. */
(()=>{
const FK=["dictionary","nai_form","ta_form","nakatta_form","te_form","polite_nonpast","polite_negative","polite_past","polite_past_negative","potential","passive","causative","imperative","volitional","conditional_ba","conditional_tara","attributive","adverbial"];
const FI={};FK.forEach((k,i)=>FI[k]=i);
const LAB={dictionary:"Dictionary",nai_form:"Negative",ta_form:"Past",nakatta_form:"Past negative",te_form:"て-form",polite_nonpast:"Polite",polite_negative:"Polite negative",polite_past:"Polite past",polite_past_negative:"Polite past negative",potential:"Potential",passive:"Passive",causative:"Causative",imperative:"Imperative",volitional:"Volitional",conditional_ba:"ば conditional",conditional_tara:"たら conditional",attributive:"Attributive",adverbial:"Adverbial"};
const LABB={dictionary:"অভিধান রূপ",nai_form:"নেতিবাচক",ta_form:"অতীত",nakatta_form:"অতীত নেতিবাচক",te_form:"て-রূপ",polite_nonpast:"ভদ্র",polite_negative:"ভদ্র নেতিবাচক",polite_past:"ভদ্র অতীত",polite_past_negative:"ভদ্র অতীত নেতিবাচক",potential:"সামর্থ্য",passive:"কর্মবাচ্য",causative:"প্রযোজক",imperative:"অনুজ্ঞা",volitional:"ইচ্ছা",conditional_ba:"ば শর্ত",conditional_tara:"たら শর্ত",attributive:"বিশেষণীয়",adverbial:"ক্রিয়াবিশেষণীয়"};
const lb=k=>S.lang=="bn"&&LABB[k]?LABB[k]:LAB[k];
const GR=[0,["dictionary","nai_form","ta_form","nakatta_form","te_form"],["polite_nonpast","polite_negative","polite_past","polite_past_negative"],["potential","passive","causative","imperative","volitional","conditional_ba","conditional_tara","attributive","adverbial"]];
const GN=["","Casual","Polite","More forms"],GNB=["","সাধারণ","ভদ্র","আরও রূপ"];
const gt=g=>S.lang=="bn"?GNB[g]:GN[g];
const STAGES=()=>[t('Split','ভাগ'),t('Casual','সাধারণ'),t('Polite','ভদ্র'),t('More','আরও'),t('Quiz','কুইজ')];
const TYPE={ru:"る-verb",u:"う-verb",irr:"Irregular verb",i:"い-adjective",na:"な-adjective"};
const TYPEB={ru:"る-ক্রিয়া",u:"う-ক্রিয়া",irr:"অনিয়মিত ক্রিয়া",i:"い-বিশেষণ",na:"な-বিশেষণ"};
const tb=k=>S.lang=="bn"&&TYPEB[k]?TYPEB[k]:TYPE[k];
const CORE=FK.filter(k=>/^(dictionary|nai_form|ta_form|nakatta_form|polite_(nonpast|negative|past|past_negative))$/.test(k));
const FS={stage:0,ei:0,ty:"all",lv:0,q:"",split:false,fk:{1:"ta_form",2:"polite_past",3:"potential"},anim:null,from:null};
const Q={e:null,k:null,state:"ask",pick:null,t:6,streak:0,best:0,ok:0,total:0};
try{Q.best=+localStorage.getItem("suffix-best")||0}catch(e){}
const PF={ro:true,fu:true};
try{PF.ro=localStorage.getItem("suffix-ro")!="0";PF.fu=localStorage.getItem("suffix-fu")!="0"}catch(e){}
let SD=null,EXM=null,timer=null,sx=null,swiped=0,FL=[];

const roma=s=>{
  const M={あ:"a",い:"i",う:"u",え:"e",お:"o",や:"ya",ゆ:"yu",よ:"yo",わ:"wa",を:"o",ん:"n",ゃ:"ya",ゅ:"yu",ょ:"yo",し:"shi",ち:"chi",つ:"tsu",ふ:"fu",じ:"ji",ぢ:"ji",づ:"zu"};
  const ROW={k:"かきくけこ",g:"がぎぐげご",s:"さしすせそ",z:"ざじずぜぞ",t:"たちつてと",d:"だぢづでど",n:"なにぬねの",h:"はひふへほ",b:"ばびぶべぼ",p:"ぱぴぷぺぽ",m:"まみむめも",r:"らりるれろ"};
  for(const c in ROW)[...ROW[c]].forEach((k,i)=>{if(!M[k])M[k]=c+"aiueo"[i]});
  const a=[...s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96))];let o="",dbl=false;
  for(let i=0;i<a.length;i++){
    const c=a[i];if(c=="っ"){dbl=true;continue}
    if(c=="ー"){o+=o.slice(-1);continue}
    let r=M[c];if(r===undefined){o+=/[ぁ-ん]/.test(c)?"":c;continue}
    if("ゃゅょ".includes(a[i+1]||"x")){const y=M[a[i+1]];r=["shi","chi","ji"].includes(r)?r.slice(0,-1)+y.slice(1):r.slice(0,-1)+y;i++}
    if(dbl){r=(r[0]=="c"?"t":r[0])+r;dbl=false}
    o+=r;
  }
  return o;
};
const fm=(e,k)=>{const x=e.f[FI[k]];return x?{d:x[0],k:x[1]||x[0],b:x[2]}:null};
const stemTxt=e=>e.s[0]+e.s[2];
const stemH=e=>e.s[0]?(e.s[1]?`<ruby>${e.s[0]}<rt>${e.s[1]}</rt></ruby>`:e.s[0])+e.s[2]:e.s[2];
const part=(big,ro,cls,id="")=>`<div class="part"><div class="big ${cls}" ${id}>${big}</div><div class="ro">${ro}</div></div>`;
const fsOf=(e,x)=>Math.round(Math.max(26,Math.min(64,330/Math.max(1,(stemTxt(e)+x.d).length+(stemTxt(e)?.6:0)))));
const stemPart=e=>stemTxt(e)?part(stemH(e),roma(e.s[3]),"")+'<div class="div"></div>':"";
const avail=(e,g)=>GR[g].filter(k=>fm(e,k));

/* library example sentences, matched by dictionary form or reading */
const exMap=()=>{if(EXM)return EXM;if(!(D&&D.v))return {};const m={};D.v.forEach(x=>{if(x.x&&x.x.length){if(!m[x.w])m[x.w]=x.x[0];if(x.r&&!m[x.r])m[x.r]=x.x[0]}});EXM=m;return EXM};
const exBlock=e=>{const m=exMap(),ex=m[e.d]||m[e.r];if(!ex)return '';
const bg=S.lang=='bn'?(ex[3]||ex[2]):(ex[2]||ex[3]);
return `<div class="sfxEx"><small class="mute">${t('Example from your library','লাইব্রেরি থেকে উদাহরণ')}</small><p class="jp" style="font-size:18px;margin:6px 0 4px">${fur(ex[1]||ex[0])}</p><p class="mute" style="font-size:13px;margin:0">${mk(esc(bg||''))}</p></div>`};

const applyPrefs=()=>{const el=$('.sfx');if(!el)return;el.classList.toggle('no-ro',!PF.ro);el.classList.toggle('no-fu',!PF.fu);
const a=$('#sfxTGro'),b=$('#sfxTGfu');a&&a.setAttribute('aria-pressed',PF.ro);b&&b.setAttribute('aria-pressed',PF.fu)};

function tabs(){const el=$('#sfxTabs');if(!el)return;const names=STAGES();
el.innerHTML=names.map((n,i)=>`<button class="tab ${i<FS.stage?'done':''} ${i==FS.stage?'on':''}" data-sfs="${i}" ${i==FS.stage?'aria-current="step"':''}><i></i>${n}</button>`).join('');
$('#sfxPicker')?.classList.toggle('off',FS.stage==4)}

function filt(){
  if(!SD)return;
  const q=FS.q.trim().toLowerCase();FL=[];
  for(let i=0;i<SD.length;i++){const e=SD[i];
    if(FS.ty!='all'&&e.t!=FS.ty)continue;if(FS.lv&&e.j!=FS.lv)continue;
    if(q&&!(e.d.includes(q)||e.r.includes(q)||e.m.includes(q)))continue;FL.push(i)}
  const c=$('#sfxCnt');if(c)c.textContent=FL.length.toLocaleString()+' '+t('words','শব্দ');
  const p=$('#sfxPicker');if(!p)return;
  p.innerHTML=FL.slice(0,40).map(i=>`<button class="chip" data-sfe="${i}" aria-pressed="${i==FS.ei}">${SD[i].d}<small>${mk(SD[i].m)}</small></button>`).join('')||`<span class="hint">${t('No words match.','কোনো শব্দ মেলেনি।')}</span>`}

function render(){
  clearInterval(timer);tabs();filt();
  if(!SD)return;
  const e=SD[FS.ei],st=$('#sfxStage');if(!st)return;applyPrefs();
  if(FS.stage==0){
    const x=fm(e,'dictionary'),same=e.t=='ru';
    st.innerHTML=`<span class="pill">${tb(e.t)}</span><div class="bn">${mk(e.m)}</div>
      <button class="word ${FS.split?'split':''}" id="sfxSplitWord" style="--fs:${fsOf(e,x)}px" aria-label="${t('Split into stem and suffix','স্টেম ও সাফিক্সে ভাগ করুন')}">
      ${stemTxt(e)?`<div class="part"><div class="big">${stemH(e)}</div><div class="ro">${roma(e.s[3])}</div><div class="lab">${t('Stem','স্টেম')}<small>${t('the part every form shares','সব রূপে যেটা থাকে')}</small></div></div><div class="div"></div>`:''}
      <div class="part"><div class="big suf">${x.d}</div><div class="ro">${roma(x.k)}</div><div class="lab y">${t('Suffix','সাফিক্স')}<small>${t('the part you swap','যেটা বদলায়')}</small></div></div></button>
      <p class="hint">${FS.split?(same?t('Two parts: keep the stem, swap the suffix.','দুই অংশ: স্টেম রাখুন, সাফিক্স বদলান।'):t('The stem is what every form shares. Only the ending changes.','স্টেম সব রূপে থাকে, শুধু শেষটা বদলায়।')):t('Tap the word to split it in two.','শব্দে চাপ দিয়ে দুই ভাগ করুন।')}</p>
      ${exBlock(e)}
      <button class="btn" data-sfgo="1">${t('Start swapping','বদলানো শুরু')}</button>`;
  }else if(FS.stage<4){
    const g=FS.stage,fs=avail(e,g),A=FS.anim?'in-'+FS.anim:'';FS.anim=null;
    if(!fs.length){st.innerHTML=`<span class="pill">${gt(g)}</span><p class="hint" style="margin-top:24px">${t('No forms in this group.','এই দলে কোনো রূপ নেই।')}</p>${nextBtn(g)}${grid(e)}`;return}
    if(!fs.includes(FS.fk[g]))FS.fk[g]=fs[0];
    const k=FS.fk[g],x=fm(e,k),idx=fs.indexOf(k),from=FS.from==null?idx:FS.from;FS.from=null;
    const longest=fs.map(f=>fm(e,f).d).sort((a,b)=>b.length-a.length)[0],fsz=Math.min(56,fsOf(e,{d:longest})),rh=Math.round(fsz*1.25+10);
    st.innerHTML=`<span class="pill">${gt(g)}</span><span class="pill">${lb(k)}</span>
      <div class="rw" style="--fs:${fsz}px;--rh:${rh}px">
        ${stemTxt(e)?`<div class="big">${stemH(e)}</div><div class="div"></div>`:'<div></div><div></div>'}
        <div class="reel swipe"><div class="rail" style="--i:${from-1}" data-to="${idx}">${fs.map((f,i)=>`<button class="ri ${i==from?'on':''}" data-sff="${f}" data-d="${Math.abs(i-from)}" tabindex="-1" aria-label="${lb(f)}">${fm(e,f).d}</button>`).join('')}</div></div>
        <div class="ro">${roma(e.s[3])}</div><div></div><div class="ro">${roma(x.k)}</div>
      </div>
      <div class="meaning swap ${A}">${mk(x.b)}</div>
      <p class="hint">${t('Tap a suffix, or swipe the column up and down.','সাফিক্সে চাপ দিন, বা কলামটি ওপরে-নিচে সোয়াইপ করুন।')}</p>
      <div class="row">${fs.map(f=>{const y=fm(e,f);return `<button class="opt" data-sff="${f}" aria-pressed="${f==k}">${y.d}<small>${lb(f)}</small></button>`}).join('')}</div>
      ${nextBtn(g)}${grid(e)}`;
    reelGo();
  }else quiz();
}
const nextBtn=g=>`<button class="btn" data-sfgo="${g+1}">${g==3?t('Take the quiz','কুইজ দিন'):t('Next: ','পরের: ')+(g==1?t('polite','ভদ্র'):t('more forms','আরও রূপ'))}</button>`;
function grid(e){
  const cells=FK.filter(k=>fm(e,k)).map(k=>{const x=fm(e,k),g=GR[1].includes(k)?1:GR[2].includes(k)?2:3;
    return `<button class="cell" data-sfg="${k}" aria-pressed="${FS.fk[g]==k}"><small>${lb(k)}</small>${stemH(e)}${x.d}</button>`}).join('');
  return `<div class="grid"><h3>${t('All forms from 1 stem','এক স্টেম থেকে সব রূপ')}</h3>${cells}</div>`}

function newQ(){
  if(!FL.length){const st=$('#sfxStage');if(st)st.innerHTML=`<p class="hint">${t('Pick a filter with at least one word.','অন্তত একটি শব্দ থাকা ফিল্টার বাছুন।')}</p>`;return}
  let e,k,tries=0;
  do{e=SD[FL[Math.random()*FL.length|0]];const ks=CORE.filter(c=>fm(e,c));k=ks[Math.random()*ks.length|0];tries++}while(Q.e==e&&Q.k==k&&tries<20);
  Object.assign(Q,{e,k,state:'ask',pick:null,t:6});render();
  timer=setInterval(()=>{Q.t--;const b=$('#sfxBox');if(b)b.textContent=Q.t;if(Q.t<=0)answer(null)},1000)}
function answer(k){
  if(Q.state!='ask')return;clearInterval(timer);
  const right=k&&fm(Q.e,k).d==fm(Q.e,Q.k).d;Q.pick=k;Q.state=right?'right':'wrong';Q.total++;
  if(right){Q.streak++;Q.ok++;if(Q.streak>Q.best){Q.best=Q.streak;try{localStorage.setItem('suffix-best',Q.best)}catch(e){}}}else Q.streak=0;
  quiz()}
function quiz(){
  if(!Q.e)return newQ();
  const e=Q.e,x=fm(e,Q.k),done=Q.state!='ask',ks=CORE.filter(c=>fm(e,c)),st=$('#sfxStage');if(!st)return;
  st.innerHTML=`<div class="qline">${e.d} = <b>${mk(e.m)}</b></div>
    <div class="target">${mk(x.b)}</div><div class="hint" style="margin:4px 0 0">${lb(Q.k)}</div>
    <div class="word split" style="--fs:${fsOf(e,x)}px">${stemPart(e)}
      <div class="part"><div class="big suf ${done?(Q.state=='right'?'good':'wrong')+' in-r':'dash'}" id="sfxBox" style="min-width:${done?0:92}px">${done?x.d:Q.t}</div><div class="${done?'ro':'ro pk'}">${done?roma(x.k):t('Pick the suffix','সাফিক্স বাছুন')}</div></div></div>
    <div class="row">${ks.map(c=>{const y=fm(e,c);return `<button class="opt ${done&&y.d==x.d?'good':''} ${done&&c==Q.pick&&y.d!=x.d?'bad':''}" data-sfa="${c}" ${done?'disabled':''}>${y.d}<small>${roma(y.k)}</small></button>`}).join('')}</div>
    ${done?`<p class="hint">${Q.state=='right'?t('Correct.','সঠিক।'):Q.pick?t('Not quite. The answer is ','হয়নি। উত্তর: ')+x.d+'.':t('Time’s up. The answer is ','সময় শেষ। উত্তর: ')+x.d+'.'}</p>${exBlock(e)}<button class="btn" data-sfnext="1">${t('Next word','পরের শব্দ')}</button>`:`<p class="hint">${t('Six seconds on the clock. Words come from the current filters.','ছয় সেকেন্ড সময়। বর্তমান ফিল্টার থেকে শব্দ আসবে।')}</p>`}
    <div class="score">${t('Streak','ধারা')} ${Q.streak} · ${t('Best','সেরা')} ${Q.best} · ${t('Correct','সঠিক')} ${Q.ok}/${Q.total}</div>`}

function slideTo(id,forced){
  const fs=avail(SD[FS.ei],FS.stage),a=fs.indexOf(FS.fk[FS.stage]),b=fs.indexOf(id);
  if(b<0||a==b)return;
  FS.from=a;FS.anim=(forced||(b>a?1:-1))>0?'u':'d';FS.fk[FS.stage]=id;render()}
function step(dir){
  if(FS.stage<1||FS.stage>3)return;
  const fs=avail(SD[FS.ei],FS.stage),b=fs.indexOf(FS.fk[FS.stage])+dir;
  if(b<0||b>=fs.length)return;
  slideTo(fs[b],dir)}
function reelGo(){
  const rl=$('.sfx .rail');if(!rl)return;const to=+rl.dataset.to;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{rl.style.setProperty('--i',to-1);rl.querySelectorAll('.ri').forEach((n,i)=>{n.dataset.d=Math.abs(i-to);n.classList.toggle('on',i==to)})}))}
const go=n=>{FS.stage=n;if(n==4)Q.e=null;render();scrollTo(0,0)};

V.sfx=()=>{if(cur()!='sfx')return;
M.innerHTML=`<a class="back" href="#library">${ic('back',18)} ${t('Library','লাইব্রেরি')}</a><h2>${t('Swap the suffix','সাফিক্স বদলান')}</h2>
<p class="mute" style="margin:-4px 0 10px"><small>${t('Japanese verbs and adjectives: split the stem, swap the ending, then test yourself. Examples appear when the word is also in your vocabulary library.','জাপানি ক্রিয়া ও বিশেষণ: স্টেম আলাদা করুন, শেষ বদলান, তারপর নিজেকে পরীক্ষা করুন। শব্দটি লাইব্রেরিতেও থাকলে উদাহরণ দেখা যাবে।')}</small></p>
<div class="sfx">
  <div class="tabs" id="sfxTabs" role="group" aria-label="${t('Lesson steps','পাঠের ধাপ')}"></div>
  <div class="ctl"><input id="sfxQ" type="search" placeholder="${t('Search kanji, kana or Bangla','কাঞ্জি, কানা বা বাংলায় খুঁজুন')}" aria-label="${t('Search words','শব্দ খুঁজুন')}" value="${esc(FS.q)}">
    <select id="sfxTy" aria-label="${t('Word type','শব্দের ধরন')}"><option value="all"${FS.ty=='all'?' selected':''}>${t('All types','সব ধরন')}</option><option value="ru"${FS.ty=='ru'?' selected':''}>る-verbs</option><option value="u"${FS.ty=='u'?' selected':''}>う-verbs</option><option value="irr"${FS.ty=='irr'?' selected':''}>${t('Irregular verbs','অনিয়মিত ক্রিয়া')}</option><option value="i"${FS.ty=='i'?' selected':''}>い-adjectives</option><option value="na"${FS.ty=='na'?' selected':''}>な-adjectives</option></select>
    <select id="sfxLv" aria-label="${t('JLPT level','JLPT স্তর')}"><option value="0">${t('All levels','সব স্তর')}</option>${['N5','N4','N3','N2','N1'].map((l,i)=>`<option value="${5-i}"${FS.lv==5-i?' selected':''}>${l}</option>`).join('')}</select>
  </div>
  <div class="tgl"><span>${t('Show','দেখান')}</span><button class="chip" id="sfxTGro" aria-pressed="${PF.ro}">${t('Romaji','রোমাজি')}</button><button class="chip" id="sfxTGfu" aria-pressed="${PF.fu}">${t('Furigana','ফুরিগানা')}</button></div>
  <div class="meta"><span id="sfxCnt"></span><button class="chip" id="sfxRnd">${t('Random word','এলোমেলো শব্দ')}</button></div>
  <div class="picker" id="sfxPicker" aria-label="${t('Matching words','মিলে যাওয়া শব্দ')}"></div>
  <main class="stage" id="sfxStage"></main>
</div>`;
render()};
TAB.sfx='library';

/* load the conjugation data independently, then draw if we are on the route */
(async()=>{try{const o=await dec('sfx');SD=o.e;FS.ei=o.start||0;if(cur()=='sfx')V.sfx()}catch(e){}})();

document.addEventListener('click',e=>{
  if(cur()!='sfx')return;const root=e.target.closest('.sfx');if(!root)return;
  const b=e.target.closest('button');if(!b||Date.now()-swiped<350)return;
  const d=b.dataset;
  if(d.sfs!==undefined)go(+d.sfs);
  else if(d.sfe!==undefined){FS.ei=+d.sfe;FS.split=false;FS.anim=null;render()}
  else if(d.sfgo!==undefined)go(+d.sfgo);
  else if(d.sff)slideTo(d.sff);
  else if(d.sfg){FS.stage=GR[1].includes(d.sfg)?1:GR[2].includes(d.sfg)?2:3;FS.fk[FS.stage]=d.sfg;render();scrollTo({top:0,behavior:'smooth'})}
  else if(d.sfa)answer(d.sfa);
  else if(d.sfnext)newQ();
  else if(b.id=='sfxSplitWord'){FS.split=!FS.split;render()}
  else if(b.id=='sfxRnd'&&FL.length){FS.ei=FL[Math.random()*FL.length|0];FS.split=false;if(FS.stage==4)Q.e=null;render()}
  else if(b.id=='sfxTGro'){PF.ro=!PF.ro;try{localStorage.setItem('suffix-ro',PF.ro?1:0)}catch(e){}applyPrefs()}
  else if(b.id=='sfxTGfu'){PF.fu=!PF.fu;try{localStorage.setItem('suffix-fu',PF.fu?1:0)}catch(e){}applyPrefs()}
});

document.addEventListener('input',e=>{if(cur()!='sfx'||e.target.id!='sfxQ')return;FS.q=e.target.value;filt();if(FS.stage==4)Q.e=null});
document.addEventListener('change',e=>{if(cur()!='sfx')return;
  if(e.target.id=='sfxTy'){FS.ty=e.target.value;filt();if(FS.stage==4)go(4)}
  else if(e.target.id=='sfxLv'){FS.lv=+e.target.value;filt();if(FS.stage==4)go(4)}});

document.addEventListener('pointerdown',e=>{if(cur()!='sfx')return;sx=e.target.closest('.swipe')?e.clientY:null});
document.addEventListener('pointerup',e=>{if(cur()!='sfx'||sx===null)return;const dy=e.clientY-sx;sx=null;if(Math.abs(dy)>30){step(dy<0?1:-1);swiped=Date.now()}});
document.addEventListener('keydown',e=>{if(cur()!='sfx'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key=='ArrowRight'||e.key=='ArrowDown'){e.preventDefault();step(1)}
  else if(e.key=='ArrowLeft'||e.key=='ArrowUp'){e.preventDefault();step(-1)}});
window.addEventListener('hashchange',()=>{if(cur()!='sfx')clearInterval(timer)});
})();
