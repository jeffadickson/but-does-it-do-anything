const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('app/index.html'),offline=read('app/Algebra_Adventure.html');
const base=new URL('https://example.test/but-does-it-do-anything/lessons/mathematics/algebra-adventure/index.html');
for(const match of html.matchAll(/href="([^"]+)"/g)){
 const url=new URL(match[1],base);assert.equal(url.origin,base.origin);
 assert(url.pathname.startsWith('/but-does-it-do-anything/'));
 if(match[1]==='../../../index.html')assert.equal(url.pathname,'/but-does-it-do-anything/index.html');
 else assert(fs.existsSync(path.join(root,'app',match[1])),`Missing ${match[1]}`);
}
assert(!offline.includes('../../../index.html'));assert(!offline.includes('href='));
assert(html.includes("connect-src 'none'"));assert(html.includes('bdda-algebra-adventure-v2'));
const bundle=JSON.parse(read('app/source.json'));
for(const [p,content] of Object.entries(bundle.files)){assert(!p.startsWith('/')&&!p.split('/').includes('..'));assert.equal(content,read(p));}
// Download preserves the same actual executable course, including hints and generated questions.
assert.equal(html.match(/<script>([\s\S]*?)<\/script>/)[1],offline.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('PASS: project-subpath links, downloads, source fidelity, offline parity and scoped progress key.');
