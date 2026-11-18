
/* Nihoban JLPT AI — one clean flow: pick → start → results.
   Saved questions work offline; AI is only used to top up the bank. */
(()=>{
const DEF='gemini-3.5-flash-lite',LVS=['N5','N4','N3','N2','N1'];
const TYPES=[['mix','Mix'],['v','Vocab'],['k','Kanji'],['g','Grammar'],['r','Reading']];
const TL={v:'Vocabulary',k:'Kanji',g:'Grammar',r:'Reading'};
const TJ={v:'語彙',k:'漢字',g:'文法',r:'読解'};

/* ---------- state helpers ---------- */
const cfg=()=>{const c=S.aiSettings??={provider:'gemini',key:'',endpoint:'',model:DEF};S.aiQuestions??=[];S.aiRuns??=[];return c};
const opt=()=>{const c=cfg();c.level??=S.lvl||'N5';c.qtype??='mix';c.fb??='each';c.count=[10,20,30].includes(+c.count)?+c.count:10;return c};
const bank=()=>(cfg(),S.aiQuestions);
const tyOf=q=>q.ty||((q.type||'').includes('漢')?'k':(q.type||'').includes('文')?'g':(q.type||'').includes('読')?'r':'v');
const ready=()=>{const c=cfg();return c.provider==='local'?!!c.endpoint:!!c.key};
const pool=(lv,ty)=>bank().filter(q=>q.level===lv&&(ty==='mix'||tyOf(q)===ty)&&q.options?.length===4);
let view='home',ses=null,ctl=null,busy=false,bu={q:'',lv:'all',n:60};

/* ---------- AI call ---------- */
function aiPrompt(level,n,ty){
 const only={v:'Generate only vocabulary (語彙) questions.',k:'Generate only kanji (漢字) questions, e.g. readings or meanings.',g:'Generate only grammar (文法) questions.',r:'Generate only short reading-comprehension (読解) questions; each one needs a short Japanese passage.',mix:`Mix appropriate ${level} question types (vocabulary, kanji reading, grammar, and short reading comprehension).`}[ty];
 const tf=ty==='mix'?'語彙|漢字|文法|読解':TJ[ty];
 return `Create exactly ${n} original practice questions in the style and difficulty of JLPT ${level}. These are practice items, NOT official or copied JLPT questions. ${only} Vary the topics (seed ${Math.random().toString(36).slice(2,8)}). For each item provide:
{"level":"${level}","type":"${tf}","question":"Japanese question text, natural and level appropriate","passage":"optional short Japanese passage, otherwise empty","options":["A","B","C","D"],"answer":0,"explanationJa":"brief explanation in natural Japanese","explanationBn":"A clear and detailed explanation in Bangla","whyOptions":"optional short clarification"}
Answer index must be 0-3. Exactly four options. Use Japanese for question/options and BOTH Japanese and Bangla for explanations. Avoid ambiguity; one correct answer. Return ONLY a valid JSON array, no markdown.`;
}
async function callAI(prompt,signal){
 const c=cfg(),local=c.provider==='local';
 if(local&&!c.endpoint)throw Error('Add your endpoint URL first.');
 if(!local&&!c.key)throw Error('Add your Gemini API key first.');
 let r;
 try{
  r=local
   ?await fetch(c.endpoint,{method:'POST',signal,headers:{'Content-Type':'application/json',...(c.localKey?{Authorization:'Bearer '+c.localKey}:{})},body:JSON.stringify({model:c.localModel||'local-model',messages:[{role:'user',content:prompt}],temperature:.75})})
   :await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model||DEF)}:generateContent?key=${encodeURIComponent(c.key)}`,{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.75,responseMimeType:'application/json'}})});
 }catch(e){if(e.name==='AbortError')throw e;throw Error('Can’t reach the AI. Check your internet connection.')}
 const d=await r.json().catch(()=>({}));
 if(!r.ok){const m=d.error?.message||'';throw Error(r.status===429?'AI rate limit reached. Wait a minute and try again.':/api key/i.test(m)?'That API key isn’t valid.':m||`AI error (HTTP ${r.status})`)}
 return local?(d.choices?.[0]?.message?.content||d.output||''):(d.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'');
}
function parseAI(raw,fb='v'){
 let s=String(raw||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
 const a0=s.indexOf('['),a1=s.lastIndexOf(']');if(a0>=0&&a1>a0)s=s.slice(a0,a1+1);
 let a;try{a=JSON.parse(s)}catch(e){throw Error('The AI sent an unreadable answer. Try again.')}
 if(!Array.isArray(a))a=a?.questions||[];
 return a.map(q=>{
  const s=String(q.type||''),o=(q.options||q.o||[]).map(x=>String(x).trim()),ans=+q.answer,qt=String(q.question||q.q||'').trim();
  if(!qt||o.length!==4||new Set(o).size!==4||!(ans>=0&&ans<4))return null;
  const ord=sh([0,1,2,3]),ty=s.includes('漢')?'k':s.includes('文')?'g':s.includes('読')?'r':s?'v':fb;
  return{id:crypto.randomUUID?.()||String(Date.now()+Math.random()),ty,level:q.level||'N5',type:s||TJ[ty],question:qt,passage:String(q.passage||''),options:ord.map(i=>o[i]),answer:ord.indexOf(ans),explanationJa:q.explanationJa||q.explanation_jp||'',explanationBn:q.explanationBn||q.explanation_bn||'',whyOptions:q.whyOptions||'',createdAt:Date.now(),source:'ai',answered:false,selected:null};
 }).filter(Boolean);
}

/* ---------- generate (parallel chunks, retry once, cancellable) ---------- */
const overlay=()=>{const el=document.createElement('div');el.className='ai-gen-overlay show';el.innerHTML=`<div class="ai-gen-card" role="status"><div class="ai-orb-wrap"><div class="ai-orb"></div><div class="ai-orb-ring"></div></div><div class="ai-gen-title">Creating questions</div><div class="ai-gen-sub" id="jxSub"></div><div class="ai-progress"><i id="jxBar"></i></div><button class="btn o" data-jai="cancel" style="min-height:40px;padding:6px 18px">Cancel</button></div>`;document.body.append(el);return el};
async function generate(lv,ty,need){
 need=Math.max(10,Math.min(30,Math.ceil(need/10)*10));
 ctl=new AbortController();const sig=ctl.signal,ov=overlay(),sub=ov.querySelector('#jxSub'),bar=ov.querySelector('#jxBar');
 let got=[],done=0,err=null;
 const prog=()=>{sub.textContent=`${done} of ${need} ready…`;bar.style.width=Math.max(8,done/need*100)+'%'};prog();
 try{
  await Promise.all(Array.from({length:need/10},async()=>{
   for(let a=0;a<2;a++){
    try{got.push(...parseAI(await callAI(aiPrompt(lv,10,ty),sig),ty==='mix'?'v':ty));done+=10;prog();return}
    catch(e){if(sig.aborted)throw e;err=e;await new Promise(r=>setTimeout(r,900))}
   }}));
  if(!got.length)throw err||Error('No valid questions came back. Try again.');
  const seen=new Set(bank().map(q=>q.question));
  got=got.filter((q,i)=>!seen.has(q.question)&&got.findIndex(z=>z.question===q.question)===i);
  got.forEach(q=>q.level=lv);
  bank().unshift(...got);S.aiRuns.unshift({level:lv,ty,count:got.length,at:Date.now(),ids:got.map(q=>q.id)});S.aiRuns=S.aiRuns.slice(0,50);save();
  return got;
 }catch(e){if(sig.aborted)return null;throw e}
 finally{ov.remove();ctl=null}
}

/* ---------- session ---------- */
const persist=()=>{S.aiSess=ses&&!ses.res?{ids:ses.ids,ans:ses.ans,i:ses.i,ms:ses.ms,fb:ses.fb,lv:ses.lv,ty:ses.ty,retry:ses.retry||0}:null;save()};
function resumable(){const s=S.aiSess;if(!s?.ids?.length||s.ids.length!==s.ans?.length)return null;const qs=s.ids.map(id=>bank().find(q=>q.id===id));return qs.every(Boolean)&&s.i<qs.length?{...s,qs}:null}
function pick(p,n){const f=a=>sh(a);return[...f(p.filter(q=>!q.lastAnswered)),...f(p.filter(q=>q.lastAnswered))].slice(0,n)}
function begin(qs,extra={}){const c=opt();ses={ids:qs.map(q=>q.id),qs,ans:qs.map(()=>null),i:0,ms:0,last:Date.now(),lock:0,fb:c.fb,lv:c.level,ty:c.qtype,...extra};persist();view='test';render();scrollTo(0,0)}
async function start(){
 if(busy)return;const c=opt(),n=c.count,p=pool(c.level,c.qtype),err=$('#jxErr');if(err)err.textContent='';
 let qs=pick(p,n),note='';
 if(p.length<n){
  if(ready()){
   busy=true;
   try{const fresh=await generate(c.level,c.qtype,n-p.length);if(!fresh)return;qs=[...qs,...fresh].slice(0,n)}
   catch(e){if(!p.length){$('#jxErr').textContent=e.message;return}note='AI unavailable — using saved questions'}
   finally{busy=false}
  }else if(!p.length){
   const d=$('#jxConn');d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('#jxKey,#jxEp')?.focus({preventScroll:true}),350);
   $('#jxErr').textContent='Add an AI key to create questions — or take the built-in mock instead.';return;
  }
 }
 begin(qs,{note});
}
function answer(i){
 if(!ses||ses.res||ses.ans[ses.i]!=null||Date.now()<ses.lock)return;
 const q=ses.qs[ses.i],now=Date.now();ses.ms+=Math.min(now-ses.last,12e4);ses.last=now;ses.ans[ses.i]=i;q.answered=true;q.selected=i;q.lastAnswered=now;persist();
 if(ses.fb==='each'){rTest();$('.fb')?.scrollIntoView({block:'nearest',behavior:'smooth'})}else next();
}
function next(){
 if(!ses||Date.now()<ses.lock)return;
 if(ses.i+1>=ses.qs.length)return finish();
 ses.i++;ses.lock=Date.now()+350;ses.last=Date.now();persist();rTest();scrollTo(0,0);
}
function finish(){
 const n=ses.qs.length,sc={};let s=0;
 ses.qs.forEach((q,i)=>{const k=TL[tyOf(q)],ok=ses.ans[i]===q.answer;(sc[k]??=[0,0])[1]++;if(ok){sc[k][0]++;s++}});
 ses.res={s,n,sc};
 if(!ses.retry){(S.mocks??=[]).push({d:day(),lv:ses.lv,s,n,sc,ai:1});S.mk=(S.mk||0)+1}
 S.aiSess=null;save();view='result';render();scrollTo(0,0);
}

/* ---------- views ---------- */
const chp=(arr,cur,k)=>`<div class="chips">${arr.map(([v,l])=>`<button type="button" class="${String(v)===String(cur)?'on':''}" data-jai="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
const lvCounts=()=>LVS.map(l=>[l,bank().filter(q=>q.level===l).length]).filter(x=>x[1]).map(x=>`${x[0]} · ${x[1]}`).join('   ');
function hint(){
 const c=opt(),m=pool(c.level,c.qtype).length,n=c.count;
 if(m>=n)return['ok',`${ic('ok',16)}<span>${m} saved ${c.level} questions match. Starts instantly and works offline.</span>`];
 if(ready())return['',`<span>${m?`${m} saved · ${n-m} new will be created with AI first.`:`${n} new questions will be created with AI first.`}</span>`];
 if(m)return['warn',`<span>Only ${m} saved match, so the test will have ${m} questions. Add an AI key below for more.</span>`];
 return['warn','<span>No saved questions yet. Add an AI key below, or take the built-in mock.</span>'];
}
function updHint(){const h=$('#jxHint');if(!h)return;const[k,html]=hint();h.className='jx-hint '+k;h.innerHTML=html}
function updConn(){const d=$('#jxDot');if(d){d.textContent=ready()?'Connected':'Not set up';d.className='jx-dot'+(ready()?' ok':'')}updHint()}
function connHtml(){
 const c=cfg(),loc=c.provider==='local';
 return `<summary><b>AI connection</b><span id="jxDot" class="jx-dot${ready()?' ok':''}">${ready()?'Connected':'Not set up'}</span></summary>
 <div class="jx-sec" style="margin-top:14px">Provider</div>${chp([['gemini','Google Gemini'],['local','Custom / local']],c.provider,'prov')}
 ${loc?`<label class="jx-f">Endpoint URL<input id="jxEp" placeholder="http://localhost:1234/v1/chat/completions" value="${esc(c.endpoint)}" autocomplete="off"></label>
 <label class="jx-f">Model name<input id="jxLm" placeholder="local-model" value="${esc(c.localModel||'')}" autocomplete="off"></label>
 <label class="jx-f">API key (optional)<input id="jxLk" type="password" value="${esc(c.localKey||'')}" autocomplete="off"></label>
 <p class="mute"><small>OpenAI-compatible endpoint. It needs CORS enabled.</small></p>`
 :`<label class="jx-f">Gemini API key<input id="jxKey" type="password" placeholder="Paste your key" value="${esc(c.key)}" autocomplete="off"></label>
 <p class="mute" style="margin-top:6px"><small>Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--pri)">aistudio.google.com/apikey</a>. It stays in this browser only.</small></p>
 <label class="jx-f">Model<input id="jxModel" placeholder="${DEF}" value="${esc(c.model||'')}" autocomplete="off"></label>`}
 <div style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap"><button class="btn o" data-jai="test" style="min-height:42px;padding:8px 18px">Test connection</button><span id="jxTest" role="status" style="font-size:14px"></span></div>`;
}
function rHome(){
 const c=opt(),rs=resumable(),nb=bank().length,[hk,hh]=hint();
 M.innerHTML=`<h2>JLPT AI Mock</h2><p class="mute" style="margin:-6px 0 14px"><small>Practice questions made by AI and saved on this device.</small></p>
 ${rs?`<div class="card jx-resume jx-row"><div><b>Mock in progress</b><p class="mute"><small>${rs.ans.filter(x=>x!=null).length}/${rs.ids.length} answered · ${rs.lv}</small></p></div><div class="chips" style="margin:0"><button class="btn" data-jai="resume" style="min-height:42px;padding:8px 20px">Resume</button><button class="btn o" data-jai="discard" style="min-height:42px;padding:8px 16px">Discard</button></div></div>`:''}
 <div class="card">
  <div class="jx-sec">Level</div>${chp(LVS.map(l=>[l,l]),c.level,'lv')}
  <div class="jx-sec">Question type</div>${chp(TYPES,c.qtype,'ty')}
  <div class="jx-sec">Questions</div>${chp([10,20,30].map(x=>[x,x]),c.count,'n')}
  <div class="jx-sec">Show answers</div>${chp([['each','After each question'],['end','At the end']],c.fb,'fb')}
  <button class="btn jx-go" data-jai="start">Start mock test</button>
  <div id="jxHint" class="jx-hint ${hk}" aria-live="polite">${hh}</div>
  <p id="jxErr" class="jx-hint warn" role="alert" style="min-height:0;margin-top:6px"></p>
  <button class="lk jx-alt" data-jai="builtin">No AI? Take the built-in mock test →</button>
 </div>
 <div class="card jx-row"><div><b>${nb}</b> saved question${nb==1?'':'s'}<p class="mute"><small>${nb?lvCounts():'They appear here after your first mock.'}</small></p></div>${nb?`<button class="btn o" data-jai="bank" style="min-height:42px;padding:8px 18px">Browse</button>`:''}</div>
 <details id="jxConn" class="card jx-conn" ${ready()?'':'open'}>${connHtml()}</details>`;
}
function rTest(){
 const q=ses.qs[ses.i];if(!q)return finish();
 const n=ses.qs.length,a=ses.ans[ses.i],an=a!=null,ok=an&&a===q.answer,each=ses.fb==='each';
 const score=ses.qs.reduce((t,x,i)=>t+(ses.ans[i]===x.answer),0);
 M.innerHTML=`<div class="stat"><button class="lk" data-jai="exit">${ic('back',16)} Exit</button><span>Question ${ses.i+1}/${n}</span><span class="mute">${each?`${ic('ok',14)} ${score}`:TL[tyOf(q)]}</span></div>
 <div class="bar"><b style="width:${(ses.i+(an?1:0))/n*100}%"></b></div>
 <p class="mute" style="margin-top:8px"><small>${esc(q.level)} · ${TL[tyOf(q)]}${ses.note&&ses.i===0?' · '+esc(ses.note):''}</small></p>
 ${q.passage?`<div class="card jp" style="margin:12px 0 0;line-height:1.9">${esc(q.passage)}</div>`:''}
 <div class="card fc" style="margin-top:12px;min-height:140px"><button class="spk" data-say="${esc(q.question)}" aria-label="Listen">${ic('spk',22)}</button><div class="mid" style="padding:0 36px">${esc(q.question)}</div></div>
 <div class="opts">${q.options.map((o,i)=>`<button class="opt ${an&&each?(i===q.answer?'ok':i===a?'no':''):''}" data-jai="ans" data-v="${i}" ${an?'disabled':''}><kbd>${i+1}</kbd><span class="jp">${esc(o)}</span></button>`).join('')}</div>
 <div aria-live="polite">${an&&each?`<div class="card fb ${ok?'g':''}"><b>${ok?'Correct!':'Not quite — '+esc(q.options[q.answer])}</b>${q.explanationJa?`<p class="jp">${esc(q.explanationJa)}</p>`:''}${q.explanationBn?`<p>${esc(q.explanationBn)}</p>`:''}${q.whyOptions?`<p class="mute"><small>${esc(q.whyOptions)}</small></p>`:''}</div><div class="dock"><button class="btn" style="width:100%" data-jai="next">${ses.i+1<n?'Next':'See results'}</button></div>`:''}</div>`;
}
function rResult(){
 const{s,n,sc}=ses.res,p=Math.round(s/n*100),rows=ses.qs.map((q,i)=>({q,i,ok:ses.ans[i]===q.answer})).sort((a,b)=>a.ok-b.ok||a.i-b.i),miss=rows.filter(r=>!r.ok).length,sec=Math.round(ses.ms/1e3);
 M.innerHTML=`<div class="card fc"><div class="big">${s}/${n}</div><p class="ans">${p}%</p><p class="mute">${p>=80?'Excellent!':p>=60?'Good work — keep going.':'Check the mistakes below and try again.'} · ${Math.floor(sec/60)}m ${sec%60}s</p></div>
 <div class="chips">${miss?`<button class="btn" data-jai="retry">Retry missed (${miss})</button>`:''}<button class="btn ${miss?'o':''}" data-jai="again">New mock</button></div>
 ${Object.keys(sc).length>1?`<div class="card"><h3>By type</h3>${Object.entries(sc).map(([k,[a,b]])=>`<div class="stat"><span>${k}</span><span class="mute">${a}/${b}</span></div><div class="bar"><b style="width:${a/b*100}%"></b></div>`).join('')}</div>`:''}
 <h3>Review</h3>${rows.map(r=>`<details class="jx-rv"><summary><span class="jx-ic ${r.ok?'g':'b'}">${ic(r.ok?'ok':'no',18)}</span><span class="t jp">${esc(r.q.question)}</span></summary>${qBody(r.q,ses.ans[r.i])}</details>`).join('')}`;
}
function qBody(q,pa){
 return `<div class="jx-body">${q.passage?`<p class="jp mute">${esc(q.passage)}</p>`:''}<p class="jp" style="font-weight:600">${esc(q.question)}</p><ol>${q.options.map((o,j)=>`<li class="jp ${j===q.answer?'ok':j===pa?'no':''}">${esc(o)}</li>`).join('')}</ol>${q.explanationJa?`<p class="jp">${esc(q.explanationJa)}</p>`:''}${q.explanationBn?`<p>${esc(q.explanationBn)}</p>`:''}${q.whyOptions?`<p class="mute"><small>${esc(q.whyOptions)}</small></p>`:''}</div>`;
}
function rBank(){
 M.innerHTML=`<div class="stat"><button class="lk" data-jai="home">${ic('back',16)} Back</button><span class="mute" id="jxCount"></span></div><h2>Question bank</h2>
 <input id="jxq" type="search" placeholder="Search questions" value="${esc(bu.q)}" autocomplete="off">
 <div class="chips" id="jxLv">${[['all','All'],...LVS.map(l=>[l,l])].map(([v,l])=>`<button type="button" class="${v===bu.lv?'on':''}" data-jai="bf" data-v="${v}">${l}</button>`).join('')}</div>
 <div id="jxList"></div>
 <div class="chips"><button class="btn o" data-jai="export">Export JSON</button><button class="btn o" data-jai="delall">Delete all</button></div>`;
 fillBank();
}
function fillBank(){
 const q=bu.q.toLowerCase().trim(),a=bank().filter(x=>(bu.lv==='all'||x.level===bu.lv)&&(!q||`${x.question} ${x.passage} ${x.options.join(' ')}`.toLowerCase().includes(q))),s=a.slice(0,bu.n);
 $('#jxCount').textContent=`${a.length} of ${bank().length}`;
 $('#jxList').innerHTML=s.length?s.map(x=>`<details class="jx-b"><summary><span class="lvb">${esc(x.level)}</span><span class="t jp">${esc(x.question)}</span></summary>${qBody(x,-1)}<div style="margin-top:10px"><button class="lk" style="color:var(--no)" data-jai="del" data-v="${esc(x.id)}">Delete</button></div></details>`).join('')+(a.length>s.length?`<p><button class="btn o" data-jai="more">Show more</button></p>`:''):`<p class="mute" style="padding:24px 0;text-align:center">No questions found.</p>`;
}
function render(){document.body.classList.toggle('focus',view==='test');({home:rHome,test:rTest,result:rResult,bank:rBank})[view]()}

V.jlptai=()=>{view='home';ses=null;render()};
TAB.jlptai='jlptai';

/* ---------- actions ---------- */
async function testConn(){
 const o=$('#jxTest');o.style.color='var(--mute)';o.textContent='Testing…';
 try{await callAI('Return exactly this JSON and nothing else: {"ok":true}');o.style.color='var(--ok)';o.textContent='✓ Connected'}
 catch(e){o.style.color='var(--no)';o.textContent=e.message}
}
function setOpt(k,v,attr){const c=opt();c[k]=v;save();$$(`[data-jai="${attr}"]`).forEach(b=>b.classList.toggle('on',b.dataset.v===String(v)));updHint()}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-jai]');if(!b||cur()!=='jlptai')return;
 const a=b.dataset.jai,v=b.dataset.v;
 switch(a){
  case'lv':return setOpt('level',v,'lv');
  case'ty':return setOpt('qtype',v,'ty');
  case'n':return setOpt('count',+v,'n');
  case'fb':return setOpt('fb',v,'fb');
  case'start':return start();
  case'builtin':if(zstart('mock',opt().level))location.hash='quiz';return;
  case'ans':return answer(+v);
  case'next':return next();
  case'exit':case'home':case'again':view='home';ses=null;return render();
  case'resume':{const r=resumable();if(!r)return rHome();ses={...r,last:Date.now(),lock:0};view='test';render();return}
  case'discard':S.aiSess=null;save();return rHome();
  case'retry':{const m=ses.qs.filter((q,i)=>ses.ans[i]!==q.answer);if(m.length)begin(m,{retry:1});return}
  case'bank':view='bank';bu={q:'',lv:'all',n:60};render();return scrollTo(0,0);
  case'bf':bu.lv=v;bu.n=60;$$('#jxLv button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));return fillBank();
  case'more':bu.n+=60;return fillBank();
  case'del':S.aiQuestions=bank().filter(q=>q.id!==v);save();return fillBank();
  case'delall':if(!b._c){b._c=1;b.textContent='Tap again to delete all';return}S.aiQuestions=[];S.aiSess=null;save();return fillBank();
  case'export':{const u=URL.createObjectURL(new Blob([JSON.stringify(bank(),null,2)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='nihoban-jlpt-ai-questions.json';l.click();URL.revokeObjectURL(u);return}
  case'prov':cfg().provider=v;save();$('#jxConn').innerHTML=connHtml();return updHint();
  case'test':return testConn();
  case'cancel':return ctl?.abort();
 }
});
document.addEventListener('input',e=>{
 if(cur()!=='jlptai')return;const id=e.target.id;
 if(id==='jxq'){bu.q=e.target.value;bu.n=60;return fillBank()}
 const k={jxKey:'key',jxModel:'model',jxEp:'endpoint',jxLm:'localModel',jxLk:'localKey'}[id];
 if(k){cfg()[k]=e.target.value.trim();save();updConn()}
});
document.addEventListener('keydown',e=>{
 if(cur()!=='jlptai'||view!=='test'||!ses||ses.res||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 const an=ses.ans[ses.i]!=null;
 if(!an&&e.key.length===1&&'1234'.includes(e.key))answer(+e.key-1);
 else if(an&&(e.key==='Enter'||e.key===' ')&&e.target.tagName!=='BUTTON'){e.preventDefault();next()}
});

/* ---------- nav link + Study-hub tile ---------- */
const aiNav=()=>{
 const nav=$('header nav');if(!nav||nav.querySelector('[href="#jlptai"]'))return;
 const a=document.createElement('a');a.href='#jlptai';a.innerHTML=`${ic('spark',22)}<span>JLPT AI</span>`;a.classList.toggle('on',cur()==='jlptai');nav.append(a);
};
aiNav();new MutationObserver(aiNav).observe($('header'),{childList:true,subtree:true});
const baseLearn=V.learn;
V.learn=()=>{baseLearn();$('.tiles',M)?.insertAdjacentHTML('beforeend',tile('#jlptai','spark','JLPT AI Mock',`${bank().length} saved · works offline`,'--cq'))};
})();
