'use strict';
// Fail a build when any recorded runtime payload is missing or changed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),app=path.join(root,'app');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'browser-runner/runtime-sha256.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest)){
 const file=path.resolve(app,name);
 if(!file.startsWith(app+path.sep))throw Error('Invalid runtime manifest path: '+name);
 if(!fs.existsSync(file))throw Error('Missing runtime asset: '+name);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(actual!==expected)throw Error('Runtime integrity mismatch: '+name);
}
console.log('Verified '+Object.keys(manifest).length+' bundled runtime assets.');
