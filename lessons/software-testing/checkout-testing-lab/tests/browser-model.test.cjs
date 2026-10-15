const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Expected inline simulator code');
const sandbox={document:{getElementById:()=>({value:'ok',addEventListener(){},click(){},set textContent(v){},set innerHTML(v){}})}};
vm.createContext(sandbox);
vm.runInContext(script,sandbox);
for(const scenario of ['ok','stock','decline','dbfail']){
 test('baseline '+scenario,()=>{
  const checks=sandbox.assertModel(scenario,'none',sandbox.simulate(scenario,'none'));
  assert.ok(checks.every(([,ok])=>ok),JSON.stringify(checks));
 });
}
for(const defect of ['wrongAmount','noStock','notifyEarly','saveDeclined','doubleCharge']){
 test('bug detected: '+defect,()=>{
  const scenario=defect==='saveDeclined'?'decline':'ok';
  const checks=sandbox.assertModel(scenario,defect,sandbox.simulate(scenario,defect));
  assert.ok(checks.some(([,ok])=>!ok),JSON.stringify(checks));
 });
}
