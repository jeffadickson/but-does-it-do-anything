'use strict';
// Optional, local-only SDK provisioning. Verify archives against official HTTPS metadata.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.tools');
const os={linux:'linux',darwin:'osx',win32:'windows'}[process.platform];const arch={x64:'x64',arm64:'arm64'}[process.arch];
if(!os||!arch)throw Error('Supported platforms: Windows/macOS/Linux x64 and arm64');
async function json(url){let r=await fetch(url);if(!r.ok)throw Error(url+': '+r.status);return r.json();}
async function install(url,hash,algorithm,dest){
 if(fs.existsSync(path.join(dest,'.installed')))return;
 fs.mkdirSync(base,{recursive:true});let archive=path.join(base,'download'+(url.endsWith('.zip')?'.zip':'.tar.gz'));
 let r=await fetch(url);if(!r.ok)throw Error('Download failed: '+r.status);let bytes=Buffer.from(await r.arrayBuffer());
 if(crypto.createHash(algorithm).update(bytes).digest('hex').toLowerCase()!==hash.toLowerCase())throw Error('Checksum mismatch; refusing extraction');
 fs.writeFileSync(archive,bytes);fs.mkdirSync(dest,{recursive:true});
 let p=process.platform==='win32'?cp.spawnSync('powershell',['-NoProfile','-Command',`Expand-Archive -LiteralPath '${archive.replace(/'/g,"''")}' -DestinationPath '${dest.replace(/'/g,"''")}' -Force`],{stdio:'inherit'}):cp.spawnSync('tar',['--no-same-owner','-xzf',archive,'-C',dest],{stdio:'inherit'});
 if(p.status!==0)throw Error('Archive extraction failed');fs.unlinkSync(archive);fs.writeFileSync(path.join(dest,'.installed'),url+'\n'+hash+'\n');
}
(async()=>{
 const metadata=await json('https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/10.0/releases.json');
 const sdk=metadata.releases.flatMap(r=>r.sdks||[r.sdk]).find(s=>s&&s.version==='10.0.100');
 const rid=(os==='windows'?'win':os)+'-'+arch;
 const file=sdk.files.find(f=>f.rid===rid&&f.url.endsWith(os==='windows'?'.zip':'.tar.gz'));
 if(!file)throw Error('No pinned .NET SDK archive for '+rid);
 await install(file.url,file.hash,'sha512',path.join(base,'dotnet'));
 const javaOs=os==='osx'?'mac':os;
 const javaArch=arch==='arm64'?'aarch64':arch;
 const assets=await json(`https://api.adoptium.net/v3/assets/release_name/eclipse/jdk-21.0.6%2B7?architecture=${javaArch}&heap_size=normal&image_type=jdk&jvm_impl=hotspot&os=${javaOs}&vendor=eclipse`);
 const pkg=assets.binaries?.[0]?.package;if(!pkg)throw Error('No pinned Java distribution for this platform');
 await install(pkg.link,pkg.checksum,'sha256',path.join(base,'java'));
 console.log('Local .NET 10.0.100 and Temurin 21.0.6+7 installed. Run native-test.');
})().catch(e=>{console.error(e.message);process.exit(1);});
