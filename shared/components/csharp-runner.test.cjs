'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('shared worker resolves one runtime root and runs exact submitted source',()=>{
 const worker=read('shared/components/csharp-worker.js');
 assert.match(worker,/java-futures-csharp-async\/app\//);
 assert.match(worker,/typeof data\.code/);
 assert.match(worker,/api\.Run\(data\.code\)/);
 assert.match(worker,/csharp-refs\/references\.bin/);
 assert.match(worker,/DecompressionStream\('gzip'\)/);
});
test('both lessons use shared worker when served by catalog',()=>{
 const asyncSource=read('lessons/languages-and-verification/java-futures-csharp-async/src/app.js');
 const asyncGenerated=read('lessons/languages-and-verification/java-futures-csharp-async/app/index.html');
 const ioc=read('lessons/software-design/inversion-of-control/app/workbench.html');
 for(const source of [asyncSource,asyncGenerated,ioc])assert.match(source,/shared\/components\/csharp-worker\.js/);
 assert.match(asyncSource,/\.\/csharp-worker\.js/); // standalone legacy fallback
});
test('IoC editor preserves four presets and handles stop/error',()=>{
 const app=read('lessons/software-design/inversion-of-control/app/workbench.html');
 for(const name of ['direct','manual','swap','broken'])assert.match(app,new RegExp(name+':'));
 assert.match(app,/worker\.terminate\(\)/);
 assert.match(app,/data\.type==='fatal'/);
});
