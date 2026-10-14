'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const root=__dirname,app=path.join(root,'app'),version=fs.readFileSync(path.join(root,'tools/node-version.txt'),'utf8').trim();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function build(){
 const lessons=JSON.parse(read('course/lessons.json')),expanded=JSON.parse(read('course/expanded-lessons.json'));
 if(lessons.length!==expanded.length)throw Error('Teaching data length mismatch');
 lessons.forEach((l,i)=>{l.deep=Object.fromEntries(['hands','meaning','start','worked'].map(k=>[k,expanded[i][k]]));});
 fs.mkdirSync(app,{recursive:true});
 const html=read('course/shell.html')+'const lessons='+JSON.stringify(lessons)+';\n'+read('course/runtime.js')+'\n</script></body></html>\n';
 fs.writeFileSync(path.join(app,'index.html'),html);
 // Download has no collection-only navigation; it is a single portable file.
 fs.writeFileSync(path.join(app,'Algebra_Adventure.html'),html.replace(/<p style="padding:8px 5%">[\s\S]*?<\/p>/,''));
 const files=['lesson.json','task.cjs','README.md','setup.sh','setup.ps1','course/shell.html','course/runtime.js','course/lessons.json','course/expanded-lessons.json','tests/check-course.cjs','tests/integration.cjs','tests/server.cjs','.gitattributes','app/tutorial.html','tools/node-version.txt','tools/node-SHASUMS256.txt','docs/OUTLINE.md','docs/REVIEW.md'];
 fs.writeFileSync(path.join(app,'source.json'),JSON.stringify({format:'relative-path-to-utf8-content',source:'https://github.com/jeffadickson/AlgebraIntro',revision:'3df7b81b070b76475b12698f19e860b42dc461ae',files:Object.fromEntries(files.map(p=>[p,read(p)]))},null,2)+'\n');
 console.log('Built course, offline download, and editable source bundle.');
}
function doctor(){if(process.version!=='v'+version)throw Error(`Expected Node ${version}, found ${process.version}. Run setup.sh or setup.ps1; it installs locally without replacing your Node.`);console.log(`Node ${version}; ${process.platform}/${process.arch}; no package dependencies.`);}
function test(){for(const p of ['tests/check-course.cjs','tests/integration.cjs','tests/server.cjs']){const r=cp.spawnSync(process.execPath,[path.join(root,p)],{stdio:'inherit'});if(r.status!==0)throw Error(`Failed ${p}`);}}
function preview(){
 const prefix='/but-does-it-do-anything/lessons/mathematics/algebra-adventure/';
 const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(name==='/'||name==='/but-does-it-do-anything/index.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<h1>Algebra Adventure local preview</h1><p>This previews one lesson. Build the collection with tools/catalog.py for the full catalog.</p><a href="${prefix}index.html">Open lesson</a>`);return;}
 if(!name.startsWith(prefix)){res.writeHead(404).end();return;}
 const rel=name.slice(prefix.length)||'index.html',file=path.resolve(app,rel);
 if(!file.startsWith(app+path.sep)||rel.includes('\\')||rel.includes('\0')){res.writeHead(403).end();return;}
 try{if(!fs.statSync(file).isFile())throw Error();res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'application/json');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}
 });server.on('error',e=>{console.error(`Preview failed: ${e.message}. Stop the process using port 8000 and retry.`);process.exitCode=1;});server.listen(8000,'127.0.0.1',()=>console.log(`Open http://localhost:8000${prefix}index.html (Ctrl+C to stop)`));
}
try{switch(process.argv[2]){case 'setup':doctor();console.log('Setup complete. No npm install needed.');break;case 'doctor':doctor();break;case 'build':doctor();build();break;case 'test':doctor();build();test();break;case 'preview':doctor();build();preview();break;case 'clean':for(const name of ['index.html','Algebra_Adventure.html','source.json'])fs.rmSync(path.join(app,name),{force:true});console.log('Removed only generated lesson outputs; build to restore.');break;default:throw Error('Usage: task.cjs setup|doctor|build|test|preview|clean');}}catch(e){console.error(e.message);process.exitCode=1;}
