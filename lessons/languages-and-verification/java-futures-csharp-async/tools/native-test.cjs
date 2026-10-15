'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');const root=path.resolve(__dirname,'..');const suffix=process.platform==='win32'?'.exe':'';
function find(dir,name){if(!fs.existsSync(dir))return null;for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isFile()&&d.name===name)return p;if(d.isDirectory()){let found=find(p,name);if(found)return found;}}return null;}
const dotnet=process.env.LESSON_DOTNET||find(path.join(root,'.tools/dotnet'),'dotnet'+suffix)||'dotnet';
const javac=process.env.LESSON_JAVAC||find(path.join(root,'.tools/java'),'javac'+suffix)||'javac';
const java=javac==='javac'?'java':path.join(path.dirname(javac),'java'+suffix);
function run(bin,args){const r=cp.spawnSync(bin,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run(dotnet,['restore','tests/AsyncLab.Tests.csproj','--locked-mode']);
run(dotnet,['test','tests/AsyncLab.Tests.csproj','--no-restore','--configuration','Release']);
run(dotnet,['run','--project','examples/csharp','--configuration','Release','--','--self-test']);
fs.mkdirSync(path.join(root,'.build/java'),{recursive:true});
run(javac,['--release','8','-d','.build/java','examples/java/FutureLab.java','examples/java/CompositionLab.java','examples/java/FuturePassingLab.java']);
run(javac,['--release','21','-d','.build/java','examples/java/VirtualLab.java']);
for(const name of ['FutureLab','CompositionLab','VirtualLab','FuturePassingLab'])run(java,['-cp','.build/java',name]);

