'use strict';
// Explicit tasks only. No catalog metadata is ever executed.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),http=require('node:http');
const root=__dirname, task=process.argv[2]||'setup';
const npm=path.resolve(path.dirname(process.execPath),process.platform==='win32'?'node_modules/npm/bin/npm-cli.js':'../lib/node_modules/npm/bin/npm-cli.js');
function run(bin,args){const r=cp.spawnSync(bin,args,{cwd:root,stdio:'inherit',env:{...process.env,PATH:path.dirname(process.execPath)+path.delimiter+process.env.PATH}});if(r.status!==0)process.exit(r.status||1);}
function build(){run(process.execPath,['build.cjs']);}
if(task==='setup'){run(process.execPath,[npm,'ci']);run(process.execPath,['node_modules/playwright/cli.js','install','chromium']);build();}
else if(task==='doctor'){console.log('Node',process.version);console.log('HTML:',fs.existsSync(path.join(root,'app/index.html')));console.log('Playwright:',fs.existsSync(path.join(root,'node_modules/playwright')));for(const bin of ['dotnet','javac']){const r=cp.spawnSync(bin,['--version'],{encoding:'utf8'});console.log(bin,r.status===0?r.stdout.trim():fs.existsSync(path.join(root,'.tools',bin==='dotnet'?'dotnet':'java'))?'local installation present under .tools (not on system PATH)':'optional native tool missing (run native-setup)');}}
else if(task==='build')build();
else if(task==='test-unit'){run(process.execPath,['--test','tests/model.test.cjs']);}
else if(task==='test'){build();run(process.execPath,['--test','tests/model.test.cjs']);run(process.execPath,['tests/browser.cjs']);run(process.execPath,['tests/wasm.cjs']);}
else if(task==='native-setup'){run(process.execPath,['tools/native-setup.cjs']);}
else if(task==='native-test'){run(process.execPath,['tools/native-test.cjs']);}
else if(task==='preview'){build();require('./tools/serve.cjs')().on('listening',()=>console.log('http://127.0.0.1:8080'));}
else if(task==='clean'){for(const p of ['.screenshots','.build','examples/csharp/bin','examples/csharp/obj','tests/bin','tests/obj'])fs.rmSync(path.join(root,p),{recursive:true,force:true});}
else{console.error('Tasks: setup doctor build test-unit test native-setup native-test preview clean');process.exit(2);}
