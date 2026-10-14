const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),{spawn}=require('node:child_process');
const child=spawn(process.execPath,[path.join(__dirname,'../task.cjs'),'preview'],{stdio:['ignore','pipe','pipe']});
let logs='';child.stderr.on('data',b=>logs+=b);
const timeout=setTimeout(()=>{child.kill();console.error('Preview test timeout',logs);process.exitCode=1;},20000);
function request(p){return new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port:8000,path:p},r=>{let body='';r.on('data',b=>body+=b);r.on('end',()=>resolve({status:r.statusCode,body}));}).on('error',reject);});}
(async()=>{try{
 await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',b=>{out+=b;if(out.includes('Open http://'))resolve();});child.once('error',reject);child.once('exit',c=>reject(Error(`Preview exited ${c}: ${logs}`)));});
 const prefix='/but-does-it-do-anything/lessons/mathematics/algebra-adventure/';
 for(const file of ['index.html','tutorial.html','Algebra_Adventure.html','source.json']){const r=await request(prefix+file);assert.equal(r.status,200);assert(r.body.length>100);}
 for(const file of ['missing.html','%2e%2e/%2e%2e/README.md'])assert([403,404].includes((await request(prefix+file)).status));
 console.log('PASS: preview serves lesson/downloads and refuses missing/traversal paths.');
}catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timeout);child.kill();}})();
