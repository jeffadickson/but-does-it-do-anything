import { dotnet } from './csharp-runtime/dotnet.js';
let api;
const send=(type,value)=>self.postMessage({type,value});
self.onmessage=async({data})=>{
 try{
  if(!api){
   send('status','Loading C# compiler and .NET WebAssembly…');
   const runtime=await dotnet.withConfig({debugLevel:0}).withResourceLoader((type, name, uri) => {
    if (!/\.(dll|wasm|dat)$/.test(uri)) return null;
    return fetch(uri+'.bin').then(response => {
     if(!response.ok)throw Error('Runtime download failed: '+name);
     return new Response(response.body.pipeThrough(new DecompressionStream('gzip')), {
      headers:{'Content-Type':uri.endsWith('.wasm')?'application/wasm':'application/octet-stream'}
     });
    });
   }).create();
   api=(await runtime.getAssemblyExports('PatternRunner')).Runner;
   const response=await fetch('./csharp-refs/references.bin');
   if(!response.ok)throw Error('Reference bundle download failed');
   const references=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
   references.forEach(data=>api.AddReference(data));
  }
  send('started','C# ready');
  const result=JSON.parse(await api.Run(data.code));
  if(result.output)send('stdout',result.output.replace(/\n$/,''));
  if(result.error)send('error',result.error);else send('done','Completed');
 }catch(error){api=null;send('fatal',String(error));}
};
