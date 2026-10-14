const {test}=require('node:test'),assert=require('node:assert/strict');
const {experiment}=require('../app/demo.js');
test('both designs work before the requirement changes',()=>{const r=experiment(false,false);assert.equal([...r.duplicated,...r.facade].filter(v=>v.ok).length,4);});
test('a missed policy update breaks only the outdated procedure',()=>{const r=experiment(true,false);assert.deepEqual(r.duplicated.map(v=>v.ok),[true,false]);assert.deepEqual(r.facade.map(v=>v.ok),[true,true]);});
test('meter failure affects both designs; cleanup always runs',()=>{for(const changed of [false,true]){const r=experiment(changed,true);for(const v of [...r.duplicated,...r.facade]){assert.equal(v.ok,false);assert.equal(v.events.at(-1),'output OFF');}}});
