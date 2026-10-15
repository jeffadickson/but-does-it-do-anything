'use strict';
// Pure scheduling/validation rules are exported for Node tests as well as used by the UI.
const Model = {
  schedule(mode, durations=[2,2,2]) {
    const workers=Array(mode==='sequential'?1:mode==='pool'?2:3).fill(0);
    return durations.map(duration=>{const lane=workers.indexOf(Math.min(...workers));const start=workers[lane];workers[lane]+=duration;return {start,end:start+duration};});
  },
  aggregate(states) {
    if(states.some(s=>s==='Running'||s==='Queued')) return 'Running';
    return states.includes('Failed')?'Failed':states.includes('Cancelled')?'Cancelled':'Completed';
  },
  canStart(name, states) {
    const dependencies={generator:[],meter:[],enable:['generator','meter'],measure:['enable'],disable:['measure']};
    return dependencies[name].every(d=>states[d]==='Completed'||(name==='disable'&&states[d]==='Failed'));
  },
  future(state, event) {
    if(event==='submit'&&state==='CREATED')return 'QUEUED';
    if(event==='start'&&state==='QUEUED')return 'RUNNING';
    if(event==='cancel'&&['QUEUED','RUNNING'].includes(state))return 'CANCELLED';
    if(state==='RUNNING'&&event==='fail')return 'FAILED';
    if(state==='RUNNING'&&event==='finish')return 'COMPLETED';
    return state;
  }
};
if(typeof module!=='undefined')module.exports=Model;
if(typeof document!=='undefined')boot();
function boot(){
 const $=id=>document.getElementById(id), q=s=>Array.from(document.querySelectorAll(s));
 const log=(id,text)=>{const el=$(id);el.textContent+=text+'\n';el.scrollTop=el.scrollHeight;};
 const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 const saved=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))??def;}catch{return def;}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
 if(saved('async-theme',window.matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark');
 $('theme').onclick=()=>{document.body.classList.toggle('dark');save('async-theme',document.body.classList.contains('dark'));};
 q('pre[data-lang]').forEach(pre=>{
   const code=pre.querySelector('code');if(!code)return;
   const raw=code.textContent;
   // Tokenize first, escape each token: never interpret learner/source text as HTML.
   code.innerHTML=raw.split(/(\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:public|private|static|async|await|return|throw|try|catch|finally|using|var|double|new|void|class|interface|if|foreach|while|true|false|Task|Future|CompletableFuture)\b)/g).map(t=>{
     const cls=t.startsWith('//')?'com':t.startsWith('"')?'str':/^(public|private|static|async|await|return|throw|try|catch|finally|using|var|double|new|void|class|interface|if|foreach|while|true|false|Task|Future|CompletableFuture)$/.test(t)?'kw':'';
     return cls?`<span class="${cls}">${escape(t)}</span>`:escape(t);
   }).join('');
   const button=document.createElement('button');button.className='copy';button.textContent='Copy';button.setAttribute('aria-label','Copy '+pre.dataset.lang+' code');
   button.onclick=async()=>{try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(code.textContent);else{const t=document.createElement('textarea');t.value=code.textContent;document.body.append(t);t.select();if(!document.execCommand('copy'))throw Error();t.remove();}button.textContent='Copied';}catch{button.textContent='Select code to copy';}setTimeout(()=>button.textContent='Copy',2000);};pre.append(button);
 });
 const sections=q('section[data-title]');$('toc').innerHTML=sections.map(s=>`<a href="#${s.id}">${s.dataset.title}</a>`).join('');
 const visited=new Set(saved('async-read',[]).filter(id=>sections.some(s=>s.id===id))); $('reading').max=sections.length;
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){visited.add(e.target.id);save('async-read',[...visited]);$('reading').value=visited.size;$('reading-label').textContent=`${visited.size}/${sections.length} chapters visited`;q('#toc a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}});},{rootMargin:'-10% 0px -60% 0px',threshold:0});sections.forEach(s=>observer.observe(s));
 $('reading').value=visited.size;$('reading-label').textContent=`${visited.size}/${sections.length} chapters visited`;
 function renderTracks(id,names,ranges,t,states=[]){
   $(id).innerHTML=names.map((name,i)=>{let r=ranges[i],elapsed=Math.max(0,Math.min(t,r.end)-r.start);return `<div class="track-row"><span>${name}</span><div class="track"><div class="bar ${states[i]==='Failed'?'failed':''}" style="left:${r.start/6*100}%;width:${elapsed/6*100}%"></div></div></div>`;}).join('')+'<div class="axis"><span>0 s</span><span>2 s</span><span>4 s</span><span>6 s</span></div>';
 }
 let introTimer;
 function introReset(){clearInterval(introTimer);renderTracks('intro-timeline',['Voltage','Current','Frequency'],Model.schedule('sequential'),0);$('intro-status').textContent='Choose a schedule. Each modeled operation lasts 2 seconds.';}
 introReset();q('[data-intro]').forEach(b=>b.onclick=()=>{clearInterval(introTimer);let ranges=Model.schedule(b.dataset.intro),start=performance.now(),end=Math.max(...ranges.map(r=>r.end));function tick(){let t=Math.min((performance.now()-start)/1000,end);renderTracks('intro-timeline',['Voltage','Current','Frequency'],ranges,t);$('intro-status').textContent=`${t.toFixed(1)} s / ${end} s · ${t>=end?'Complete':'Measurements in progress'} · ${b.textContent}`;if(t>=end)clearInterval(introTimer);}tick();introTimer=setInterval(tick,50);});$('intro-reset').onclick=introReset;
 let deps=new Set();const depRules={voltage:[],current:[],calibrate:['voltage'],power:['calibrate','current']};
 q('[data-dep]').forEach(b=>b.onclick=()=>{let n=b.dataset.dep;if(deps.has(n)){$('dep-status').textContent=n+' already completed.';return;}if(!depRules[n].every(x=>deps.has(x))){$('dep-status').textContent='Blocked: complete '+depRules[n].filter(x=>!deps.has(x)).join(' and ')+' first.';return;}deps.add(n);b.classList.add('done');$('dep-status').textContent=n==='power'?'Power = (5.0 × 1.001) × 0.2 = 1.001 W. Graph complete.':n+' completed; dependent nodes may now proceed.';});
 $('dep-reset').onclick=()=>{deps.clear();q('[data-dep]').forEach(b=>b.classList.remove('done'));$('dep-status').textContent='No work completed.';};
 let astep=0,atimer;
 const astates=['Call method','Initiate I/O','Inspect awaiter','Yield to caller','I/O completes','Resume continuation'];
 function aRender(){const ready=$('await-ready').checked,ui=$('await-ui').checked;$('await-nodes').innerHTML=astates.map((s,i)=>`<span class="node ${i===astep?'active':''}">${s}</span>`).join('');
 const messages=['Method starts synchronously on the caller’s thread.','An I/O request is issued; its Task represents the eventual reply.',ready?'Awaiter is complete. No suspension is necessary.':'Awaiter is incomplete. Save state and register a continuation.','Method returns its pending Task. The caller thread can process other work.','Completion notification makes the continuation eligible to resume.',ready?'GetResult returns inline; continue on the same call path.':ui?'UI context dispatches the continuation when its thread is available.':'Continuation resumes according to completion/scheduler behavior; a thread-pool thread is common, not guaranteed.'];
 $('await-status').textContent=messages[astep];$('await-thread').textContent='Caller thread: '+(astep===3||astep===4?'free for other work':'executing / eligible to execute');$('await-io').textContent='I/O: '+(astep<1?'not started':ready||astep>=4?'complete':'pending; no dedicated blocked worker in this model');}
 function anext(){if(astep===5){clearInterval(atimer);return;}astep=astep===2&&$('await-ready').checked?5:astep+1;aRender();}
 $('await-next').onclick=anext;$('await-auto').onclick=()=>{clearInterval(atimer);atimer=setInterval(anext,900);};function areset(){clearInterval(atimer);astep=0;aRender();}$('await-reset').onclick=areset;$('await-ready').onchange=areset;$('await-ui').onchange=areset;aRender();
 let labTimer,labStart=0,labActive=false,labStates=[],labRanges=[],labMode='',labFailure=false,labTime=0;
 const deviceNames=['Digital multimeter','Frequency counter','Oscilloscope'],values=['5.01 V','1.000 kHz','2.0 Vpp'];
 function labRender(){
  $('lab-devices').innerHTML=deviceNames.map((n,i)=>{
   const working=labStates[i]==='Running';
   const remaining=Math.max(0,labRanges[i].end-labTime).toFixed(1);
   const label=working?`Working… ${remaining} s remaining`:labStates[i]==='Queued'?'Waiting to start':labStates[i]==='Failed'?'Timed out':labStates[i];
   return `<div class="device ${working?'working':''}"><b>${n}</b><span>${labStates[i]==='Completed'?values[i]:'—'}</span><small class="device-status">${label}</small></div>`;
  }).join('');
  renderTracks('lab-timeline',['DMM','Counter','Scope'],labRanges,labTime,labStates);
 }
 function labReset(){clearInterval(labTimer);labActive=false;labStates=['Queued','Queued','Queued'];labRanges=Model.schedule('sequential');labTime=0;$('lab-log').textContent='';$('lab-status').textContent='Ready. Select a schedule.';labRender();}
 function labFinish(state){clearInterval(labTimer);labActive=false;$('lab-status').textContent=`${labTime.toFixed(1)} s · ${state}${state==='Failed'?' · await throws TimeoutException; aggregate stores the fault.':''}`;log('lab-log','Overall '+state+'; all started operations accounted for.');}
 q('[data-lab]').forEach(b=>b.onclick=()=>{labReset();labMode=b.dataset.lab;labFailure=$('lab-fail').checked;labRanges=Model.schedule(labMode,[2,labFailure?1.2:2,2]);labStart=performance.now();labActive=true;log('lab-log',labMode==='concurrent'?'Start all three calls; construct WhenAll.':'Start DMM; later calls await previous results.');function tick(){labTime=(performance.now()-labStart)/1000;for(let i=0;i<3;i++){if(labStates[i]==='Queued'&&labTime>=labRanges[i].start){labStates[i]='Running';log('lab-log',deviceNames[i]+' invoked.');}if(labStates[i]==='Running'&&labTime>=labRanges[i].end){labStates[i]=i===1&&labFailure?'Failed':'Completed';log('lab-log',deviceNames[i]+' '+labStates[i]);if(labStates[i]==='Failed'&&labMode==='sequential'){labStates[2]='Not started';labRanges[2]={start:6,end:6};labTime=labRanges[i].end;labRender();labFinish('Failed');return;}}}labRender();let state=Model.aggregate(labStates);if(state!=='Running'){labTime=Math.max(...labRanges.map(r=>r.end));labRender();labFinish(state);}else $('lab-status').textContent=`${labTime.toFixed(1)} s · Overall pending${labStates.includes('Failed')?' — counter failed, siblings still running':''}`;}tick();labTimer=setInterval(tick,40);});
 $('lab-cancel').onclick=()=>{if(!labActive)return;for(let i=0;i<3;i++){if(labStates[i]==='Running'){labStates[i]='Cancelled';labRanges[i].end=labTime;}else if(labStates[i]==='Queued'){labStates[i]='Not started';labRanges[i]={start:6,end:6};}}labRender();labFinish(Model.aggregate(labStates));log('lab-log','Cancellation observed cooperatively; does not undo completed measurements.');};$('lab-reset').onclick=labReset;labReset();
 let streamTimer=null,points=[],sample=0;
 function streamDraw(){ $('stream-line').setAttribute('points',points.map((v,i)=>`${45+i/59*640},${170-(v-4.9)/.2*160}`).join(' '));}
 function streamStop(){clearTimeout(streamTimer);streamTimer=null;$('stream-status').textContent=`Cancelled / disposed · ${sample} samples acquired · ${points.length} retained.`;}
 $('stream-start').onclick=()=>{if(streamTimer!==null)return;function next(){sample++;let value=5+Math.sin(sample*.6)*.045+Math.sin(sample*1.9)*.012;points.push(value);if(points.length>60)points.shift();streamDraw();$('stream-status').textContent=`Running · sample ${sample} · ${value.toFixed(4)} V · ${points.length}/60 history points`;streamTimer=setTimeout(next,Number($('stream-rate').value));}streamTimer=setTimeout(next,Number($('stream-rate').value));};$('stream-stop').onclick=streamStop;$('stream-reset').onclick=()=>{streamStop();sample=0;points=[];streamDraw();$('stream-status').textContent='Stopped. No samples.';};
 let order={};function orderRender(){q('[data-order]').forEach(b=>{let state=order[b.dataset.order]||'Ready';b.classList.toggle('done',state==='Completed');b.classList.toggle('running',state==='Running');b.textContent=({generator:'Configure generator',meter:'Configure DMM',enable:'Enable output',measure:'Acquire',disable:'Disable output'})[b.dataset.order]+' · '+state;});}
 q('[data-order]').forEach(b=>b.onclick=()=>{let n=b.dataset.order,s=order[n];if(s==='Completed'||s==='Failed'){$('order-status').textContent='Already terminal; reset to run again.';return;}if(!s&&!Model.canStart(n,order)){$('order-status').textContent='Constraint violated: required predecessor has not completed.';log('order-log','REJECTED invocation: '+n);return;}order[n]=s==='Running'?'Completed':'Running';log('order-log',n+' '+(order[n]==='Running'?'invoked':'completed'));$('order-status').textContent=n==='disable'&&order[n]==='Completed'?'Valid procedure: output disable completed.':n+' '+order[n];orderRender();});
 $('order-fail').onclick=()=>{if(order.measure!=='Running'){$('order-status').textContent='Invoke acquisition before failing it.';return;}order.measure='Failed';$('order-status').textContent='Acquisition failed. Disable is still required.';log('order-log','measure failed');orderRender();};$('order-reset').onclick=()=>{order={};$('order-log').textContent='';$('order-status').textContent='No invocations yet.';orderRender();};orderRender();
 const exercises=[
 {title:'Why six seconds?',prompt:'Three independent calls each block for two seconds. The program calls each only after the previous returns. Why does it take about six seconds?',options:['Each CPU calculation needs two seconds.','The waiting intervals occur one after another.','The operating system forbids concurrent I/O.'],answer:1,explain:'The dependencies are imposed by call order, not by the instruments. Waiting does not imply CPU computation.',solution:'Initiate all three independent measurements, retain their handles, then join them. With enough I/O capacity, elapsed time approaches max(2,2,2), not their sum.'},
 {title:'When does Future.get() block?',prompt:'A callable needs two seconds. You call get() after 0.5 seconds of other work. What happens?',options:['The caller waits roughly 1.5 seconds; the worker continues.','get() starts a second copy of the callable.','get() immediately returns an empty value.'],answer:0,explain:'get() waits for the original submitted computation. If already terminal, it returns or throws without waiting for further work.',solution:'Future<Double> f = executor.submit(callable);\nDoOtherWork();\ndouble voltage = f.get(); // Blocks only if not yet terminal.'},
 {title:'Translate the Future pattern',prompt:'Which translation lets a C# caller do other work before asynchronously observing the measurement?',options:['double v = MeasureVoltageAsync().Result; DoOtherWork();','Task<double> t = MeasureVoltageAsync(); DoOtherWork(); double v = await t;','await Task.Run(() => Thread.Sleep(2000));'],answer:1,explain:'Retain the task, do independent work, then await it. Result blocks; sleeping does not acquire a measurement.',solution:'Task<double> t = MeasureVoltageAsync();\nDoOtherWork();\ndouble voltage = await t;'},
 {title:'Fix accidental serialization',prompt:'You wrote “var a = await A(); var b = await B();”. A and B use independent sessions. Select the concurrent rewrite.',options:['await Task.WhenAll(Task.FromResult(await A()), Task.FromResult(await B()));','var ta = A(); var tb = B(); var results = await Task.WhenAll(ta, tb);','await A(); await Task.Delay(1); await B();'],answer:1,explain:'Calling both methods before either await permits overlap. Awaiting while constructing the argument list still serializes the calls.',solution:'Task<double> ta = A();\nTask<double> tb = B();\ndouble[] results = await Task.WhenAll(ta, tb);'},
 {title:'Timeout and cancellation',prompt:'WaitAsync times out while a driver operation is still running. Which policy is sound?',options:['Reuse the session immediately because the task has been killed.','Request operation cancellation, retain ownership, observe termination, then recover the session.','Ignore the pending task; garbage collection aborts its I/O.'],answer:1,explain:'WaitAsync bounds waiting. It does not stop the driver. Cooperative cancellation and draining may take longer than the wait timeout.',solution:'using var cts = CancellationTokenSource.CreateLinkedTokenSource(user);\nTask<double> pending = meter.MeasureAsync(cts.Token);\ntry { return await pending.WaitAsync(TimeSpan.FromSeconds(3), user); }\nfinally {\n    if (!pending.IsCompleted) cts.Cancel();\n    try { await pending; } catch { /* preserve original failure */ }\n}'},
 {title:'Does this concurrent trace satisfy the contract?',prompt:'DMM configure invoked; generator configure invoked; generator configure completed; output enabled; DMM configure completed; acquisition completed; output disabled.',options:['Valid: both configurations were invoked before enabling.','Invalid: DMM configuration had not completed before enabling.','Invalid: generator configuration must always be invoked first.'],answer:1,explain:'The required edge is completion of both configurations before enabling. Invocation alone does not establish readiness.',solution:'A valid order: invoke DMM; invoke generator; complete generator; complete DMM; invoke/complete enable; invoke/complete acquire; invoke/complete disable. Either configuration may finish first.'}
 ];
 const passed=new Set(saved('async-passed',[]));
 $('exercises').innerHTML=exercises.map((x,i)=>`<article class="exercise"><h3>${i+1}. ${x.title}</h3><p>${x.prompt}</p><fieldset><legend>Select an answer</legend>${x.options.map((o,j)=>`<label><input type="radio" name="ex${i}" value="${j}">${escape(o)}</label>`).join('')}</fieldset><button data-check="${i}">Check answer</button><p class="feedback" id="feedback-${i}" role="status"></p><details><summary>Reference solution</summary><pre>${escape(x.solution)}</pre></details></article>`).join('');
 function tally(){$('exercise-count').textContent=`${passed.size}/6 challenges solved`;};tally();q('[data-check]').forEach(b=>b.onclick=()=>{let i=Number(b.dataset.check),choice=document.querySelector(`input[name="ex${i}"]:checked`);if(!choice){$('feedback-'+i).textContent='Choose an answer first.';return;}const ok=Number(choice.value)===exercises[i].answer;$('feedback-'+i).textContent=(ok?'Correct. ':'Try again. ')+exercises[i].explain;if(ok){passed.add(i);save('async-passed',[...passed]);tally();}});
 for(const [name,contents] of Object.entries(JSON.parse($('source-files').textContent))){let b=document.createElement('button');b.textContent=name;b.onclick=()=>{let url=URL.createObjectURL(new Blob([contents],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('downloads').append(b);}
 window.addEventListener('pagehide',()=>{clearInterval(introTimer);clearInterval(atimer);clearInterval(labTimer);clearTimeout(streamTimer);});
}

// C# executes in an isolated .NET WASM worker, using the same runner as Pattern Atlas.
// No JavaScript substitutes for the code's Task scheduling or return values.
if (typeof document !== 'undefined') {
 const sourceFiles=JSON.parse(document.getElementById('source-files').textContent);
 const editor=document.getElementById('cs-editor'), status=document.getElementById('cs-status'), output=document.getElementById('cs-output');
 const run=document.getElementById('cs-run'), stop=document.getElementById('cs-stop');
 editor.value=sourceFiles['BrowserLab.cs'];
 document.querySelectorAll('pre[data-lang]').forEach((pre,i)=>{
  if(!/C#|\.cs(?:$|\s)/.test(pre.dataset.lang))return;
  pre.id ||= 'code-panel-'+i;
  const button=document.createElement('button');button.className='code-toggle';button.textContent='Code';
  button.setAttribute('aria-controls',pre.id);button.setAttribute('aria-expanded','false');pre.hidden=true;
  button.onclick=()=>{pre.hidden=!pre.hidden;button.setAttribute('aria-expanded',String(!pre.hidden));};
  pre.before(button);
 });
 const display=document.querySelector('#csharp-workbench pre[data-lang] code');
 function updateCode(){
  // Reuse a safe token highlighter for editable source.
  display.replaceChildren();
  for(const token of editor.value.split(/(\/\/[^\n]*|"(?:\\.|[^"\\])*"|\b(?:public|static|async|await|return|throw|try|catch|finally|using|var|double|new|void|class|if|foreach|true|false|Task|record|sealed)\b)/g)){
   const span=document.createElement('span');span.textContent=token;
   span.className=token.startsWith('//')?'com':token.startsWith('"')?'str':/^(public|static|async|await|return|throw|try|catch|finally|using|var|double|new|void|class|if|foreach|true|false|Task|record|sealed)$/.test(token)?'kw':'';
   display.append(span);
  }
 }
 const scenario=document.getElementById('cs-scenario'),drafts=new Map();
 const description=document.getElementById('cs-description'), acquisitionDescription=description.innerHTML;
 let activeScenario=scenario.value;
 scenario.onchange=e=>{
  drafts.set(activeScenario,editor.value);
  activeScenario=e.target.value;
  const mode=activeScenario;
  if(mode.startsWith('dataflow'))description.textContent=mode==='dataflow-pool'?'Dataflow consumer block: 12 numbered readings, up to 3 asynchronous simulated writes at once, capacity 4 including active work. Each write waits 200 ms. No files are written. Output appears after the run.':'Dataflow pipeline: 8 acquisition requests on one serial simulated DMM session (80 ms each), up to 3 independent calibrations, then serial simulated recording (150 ms). Raw voltage is 5.0 + ID × 0.001 V; calibration multiplies it by 1.001. Reading 1 has a deliberately slow 600 ms calibration; others take 100 ms. No hardware or files are accessed. Timestamped output appears after the run.';
  else if(mode==='pool')description.textContent='Channel consumer pool: one producer sends 12 numbered readings to three competing consumers. Acquisition waits 50 ms per reading; asynchronous processing waits 300 ms. This models overlapping I/O, not CPU parallelism. Output appears after the run.';
  else description.innerHTML=acquisitionDescription;
  editor.value=drafts.get(mode)??(mode==='dataflow-pool'?sourceFiles['DataflowPool.cs']:mode.startsWith('dataflow')?sourceFiles['DataflowLab.cs'].replace('bool ordered = true',`bool ordered = ${mode!=='dataflow-unordered'}`).replace('bool failWriter = false',`bool failWriter = ${mode==='dataflow-failure'}`).replace('int cancelAfterMs = 0',`int cancelAfterMs = ${mode==='dataflow-cancel'?350:0}`):mode==='pool'?sourceFiles['ConsumerPool.cs']:sourceFiles['BrowserLab.cs'].replace('bool concurrent = true',`bool concurrent = ${mode!=='sequential'}`).replace('bool failCounter = false',`bool failCounter = ${mode==='failure'}`).replace('int cancelAfterMs = 0',`int cancelAfterMs = ${mode==='cancel'?800:0}`));updateCode();
 };
 document.querySelectorAll('[data-load-csharp]').forEach(button=>button.onclick=()=>{if(run.disabled){status.textContent='Wait for the current C# run to finish, or stop it before loading another example.';}else{scenario.value=button.dataset.loadCsharp;scenario.dispatchEvent(new Event('change'));}document.getElementById('csharp-workbench').scrollIntoView({behavior:'instant'});run.focus();});
 document.querySelectorAll('[data-df-answer]').forEach(button=>button.onclick=()=>{document.getElementById('dataflow-feedback').textContent=button.dataset.dfAnswer==='accepted'?'Correct. Admission finished; processing may still be pending. Complete() then await Completion observes the whole block.':'Try again. SendAsync reports acceptance, not processing completion or a dedicated thread. See the reference explanation.';});
 editor.oninput=()=>{drafts.set(activeScenario,editor.value);updateCode();};
 document.getElementById('cs-edit').onclick=e=>{editor.hidden=!editor.hidden;e.target.setAttribute('aria-expanded',String(!editor.hidden));if(!editor.hidden)editor.focus();};
 let worker,watchdog;
 function finish(){clearTimeout(watchdog);run.disabled=false;stop.disabled=true;editor.disabled=false;scenario.disabled=false;}
 function terminate(){worker?.terminate();worker=null;finish();}
 run.onclick=()=>{
  if(location.protocol==='file:'){status.textContent='To execute C#, run python3 start.py and open the local URL. Browsers block module workers from file://. Reading and diagrams still work here.';return;}
  run.disabled=true;stop.disabled=false;editor.disabled=true;scenario.disabled=true;output.textContent='';status.textContent='Loading local compiler/runtime…';
  if(!worker){
   worker=new Worker('./csharp-worker.js',{type:'module'});
   worker.onmessage=({data})=>{
    if(data.type==='stdout')output.textContent+=data.value+'\n';
    else if(['error','fatal'].includes(data.type)){output.textContent+=data.value+'\n';status.textContent='C# execution failed.';terminate();}
    else if(data.type==='done'){status.textContent='Completed · actual C# executed in .NET WebAssembly.';finish();}
    else status.textContent=data.value;
   };
   worker.onerror=e=>{status.textContent='Runtime error: '+e.message;terminate();};
  }
  worker.postMessage({code:editor.value});
  watchdog=setTimeout(()=>{terminate();status.textContent='Runtime stopped after 90 seconds. This safeguard is not cooperative cancellation.';},90000);
 };
 stop.onclick=()=>{terminate();status.textContent='Runtime stopped; use the cancellation preset to test CancellationToken.';};
}
