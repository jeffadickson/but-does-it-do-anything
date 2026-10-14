'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('bundle is the current self-contained collection course',()=>{
 require('../scripts/stage.cjs');
 const expected=fs.readFileSync(path.join(__dirname,'../../lessons/mathematics/algebra-adventure/app/Algebra_Adventure.html'));
 const actual=fs.readFileSync(path.join(__dirname,'../books/Algebra_Adventure.html'));
 assert.deepEqual(actual,expected);
 assert(!actual.toString().includes('../../../index.html'));
 assert(actual.toString().includes("connect-src 'none'"));
});
