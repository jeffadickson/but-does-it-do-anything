// Shared entry point for the collection's Roslyn/.NET execution worker.
// Keep the runtime worker next to its assets: .NET resolves some resources
// relative to the worker URL, not the importing module's URL.
const sourceAssets=new URL('../../lessons/languages-and-verification/java-futures-csharp-async/app/',import.meta.url);
let worker=null,activeAssets=null;
self.onmessage=async({data})=>{
 try{
  if(!data||typeof data.code!=='string')throw Error('Expected a {code:string} message.');
  let root=data.assetsBase?new URL(data.assetsBase,import.meta.url):sourceAssets;
  if(!['http:','https:'].includes(root.protocol))throw Error('C# execution requires an HTTP-served catalog.');
  root=new URL('./',root);
  if(!data.assetsBase){
   const published=new URL('../',root);
   if((await fetch(new URL('csharp-worker.js',published))).ok)root=published;
  }
  if(worker&&activeAssets!==root.href)throw Error('Terminate and recreate the worker to switch runtime roots.');
  if(!worker){
   worker=new Worker(new URL('csharp-worker.js',root),{type:'module'});
   activeAssets=root.href;
   worker.onmessage=event=>self.postMessage(event.data);
   worker.onerror=event=>self.postMessage({type:'fatal',value:event.message});
  }
  worker.postMessage({code:data.code});
 }catch(e){self.postMessage({type:'fatal',value:String(e)});}
};
