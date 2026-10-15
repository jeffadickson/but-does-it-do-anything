const {test}=require('node:test'),assert=require('node:assert/strict');
const m=require('../src/app.js');
test('independent two-second work takes six, four or two seconds',()=>{for(const [mode,end] of [['sequential',6],['pool',4],['concurrent',2]])assert.equal(Math.max(...m.schedule(mode).map(r=>r.end)),end);});
test('WhenAll waits through a fault then retains fault precedence over cancellation',()=>{assert.equal(m.aggregate(['Completed','Failed','Running']),'Running');assert.equal(m.aggregate(['Completed','Failed','Cancelled']),'Failed');assert.equal(m.aggregate(['Completed','Cancelled']),'Cancelled');assert.equal(m.aggregate([]),'Completed');});
test('both configurations must complete, not merely start',()=>{assert.equal(m.canStart('enable',{generator:'Completed',meter:'Running'}),false);assert.equal(m.canStart('enable',{generator:'Completed',meter:'Completed'}),true);});
test('failed acquisition still permits cleanup',()=>{assert.equal(m.canStart('disable',{measure:'Failed'}),true);assert.equal(m.canStart('disable',{measure:'Running'}),false);});
test('Future permits queued cancellation and terminal outcomes are immutable',()=>{assert.equal(m.future('CREATED','submit'),'QUEUED');assert.equal(m.future('QUEUED','cancel'),'CANCELLED');assert.equal(m.future('RUNNING','fail'),'FAILED');for(const s of ['COMPLETED','FAILED','CANCELLED'])assert.equal(m.future(s,'cancel'),s);});
