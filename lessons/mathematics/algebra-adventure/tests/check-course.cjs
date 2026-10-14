const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','app','index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(initial={}){
 const nodes=new Map(),stored={...initial};function node(id){if(!nodes.has(id))nodes.set(id,{value:({xRange:'3',total:'12',amount:'2',op:'sub',target:'both'})[id]||'',innerHTML:'',textContent:'',disabled:false,dataset:{},setAttribute(k,v){this[k]=v},style:{},classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(_,s){this.innerHTML+=s}});return nodes.get(id)}
 const ctx=vm.createContext({document:{getElementById:node},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},window:{print(){}},console});vm.runInContext(code,ctx);return {node,stored,run:c=>vm.runInContext(c,ctx)};
}
const {node,run}=setup();assert.equal(run('lessons.length'),12);
for(let ch=0;ch<6;ch++){
 run(`go(${ch})`);assert.match(node('lesson').innerHTML,/From boxes and bars to algebra/);
 const b=run(`lessons[${ch}].bridge`);assert(b.school.length>=2&&b.algebra.length>=2&&b.check);
 assert.match(node('lesson').innerHTML,/Show the algebra/);
}
for(let ch=0;ch<12;ch++){
 run(`go(${ch})`);
 for(let i=0;i<200;i++){
 const p=run(`makeProblem(${ch})`),m=p.meta,v=p.answers[0];
 switch(m.kind){
 case 'missing':assert.equal(v+m.c,m.left);break;
 case 'truth':assert.equal(v,(m.left===m.right?'yes':'no'));break;
 case 'both':assert.equal(v,m.start-m.b);break;
 case 'sum':assert.equal(v,m.a+m.b);break;
 case 'equation':assert.equal(m.a*v+m.b,m.c);assert(v>=0);break;
 case 'substitution':assert.equal(v,m.x+m.b);break;
 case 'relation':assert.equal(v,'B = R + '+m.b);break;
 case 'story':assert.equal(v+p.answers[1],m.total);assert.equal(p.answers[1]-v,m.diff);break;
 case 'possible':assert.equal(v,(m.total-m.diff)%2===0?'yes':'no');break;
 default:throw Error(m.kind);
 }
 }
 const p=run('practice');p.answers.forEach((v,i)=>node('answer'+i).value=String(v));run('checkAnswer()');assert.match(node('answerFeedback').textContent,/That works/);assert.equal(run('record().unprompted'),1);run('checkAnswer()');assert.equal(run('record().unprompted'),1);
 run('newPractice()');node('hint').onclick();run('practice').answers.forEach((v,i)=>node('answer'+i).value=String(v));run('checkAnswer()');assert.equal(run('record().supported'),1);
 run('newPractice(true)');run('practice').answers.forEach((v,i)=>node('answer'+i).value=String(v));run('checkAnswer()');assert.match(node('answerFeedback').textContent,/That works/);
}
run('go(1)');node('amount').value='2';node('op').value='sub';node('target').value='both';run('balanceMove()');assert.equal(run('lab.left'),8);assert.equal(run('lab.right'),8);
run('go(4)');node('amount').value='3';node('op').value='add';run('solveMove()');assert.equal(run('lab.b'),0);assert.equal(run('lab.c'),7);
run('go(7)');node('amount').value='3';node('op').value='sub';run('solveMove()');node('amount').value='2';node('op').value='div';run('solveMove()');assert.equal(run('lab.a'),1);assert.equal(run('lab.c'),4);
node('amount').value='0';run('solveMove()');assert.match(node('labFeedback').textContent,/1 to 20/);
run('go(9)');assert.match(node('storyView').innerHTML,/C = \?/);node('children').value='4';node('checkStory').onclick();assert.match(node('labFeedback').textContent,/Both clues fit/);
run('go(11)');run('drawDetect()');assert.match(node('detectView').innerHTML,/odd/);
run("state.person='Reagan';go(0)");assert.equal(run('record().unprompted'),0);
// A later check is generated, keeps its mode for another question, and records help.
node('laterCheck').onclick();assert.equal(run('checking'),'revisit');assert(run('practice.meta'));
node('fresh').onclick();assert.equal(run('checking'),'revisit');
node('hint').onclick();run('practice').answers.forEach((v,i)=>node('answer'+i).value=String(v));run('checkAnswer()');assert.equal(run('record().supported'),1);
node('freshCheck').onclick();assert.equal(run('practice === lessons[chapter].check'),true);
// Cancel preserves both profiles; confirmation resets only the selected explorer.
run('go(3);renderGuide()');const beforeReset=run('JSON.stringify(state.profiles)');
node('resetProgress').onclick();assert.equal(node('resetConfirm').hidden,false);assert.equal(run('JSON.stringify(state.profiles)'),beforeReset);
node('cancelReset').onclick();assert.equal(node('resetConfirm').hidden,true);assert.equal(run('JSON.stringify(state.profiles)'),beforeReset);
const quinnBefore=run('JSON.stringify(state.profiles.Quinn)');node('resetProgress').onclick();node('confirmReset').onclick();
assert.equal(run('profile().lesson'),0);assert.equal(run('profile().records[0].supported'),0);assert.equal(run('JSON.stringify(state.profiles.Quinn)'),quinnBefore);
run('go(10)');assert.match(node('lesson').innerHTML,/last core episode/);assert.match(node('lesson').innerHTML,/One small adventure today/);
const old={'bdda-algebra-adventure-v1':JSON.stringify({person:'Quinn',profiles:{Quinn:{lesson:6,counts:[3,4,5,6,7,8,9,10]}}})};const migrated=setup(old);assert.equal(migrated.run('chapter'),9);assert.equal(migrated.run('profile().legacyCounts[6]'),9);assert.equal(migrated.run('record().unprompted'),0);assert(old['bdda-algebra-adventure-v1']===migrated.stored['bdda-algebra-adventure-v1']);
assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(code));assert(html.includes("connect-src 'none'"));
console.log('PASS: 2400 generated problems, 12 episode render paths/checkpoints, help tracking, duplicate guard, subtraction/two-step labs, unknown bars, profiles, v1 migration and offline audit. DOM stub, not visual QA.');
