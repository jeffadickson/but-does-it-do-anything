// Shared Roslyn/.NET WebAssembly execution worker.
// Runtime assets are currently bundled by the Java Futures lesson.
// They remain in that location for backwards compatibility and deduplication.
const defaultAssets=new URL('../../lessons/languages-and-verification/java-futures-csharp-async/',import.meta.url);
let api=null,activeAssets=null;
const emit=(type,value)=>self.postMessage({type,value});
function assetRoot(input){
 const u=input?new URL(input,import.meta.url):defaultAssets;
 if(!['http:','https:'].includes(u.protocol))throw Error('C# execution requires an HTTP-served catalog.');
 return new URL('./',u);
}
async function initialize(root){
 const app=new URL('csharp-runtime/',root);
 const {dotnet}=await import(new URL('dotnet.js',app).href);
 emit('status','Loading Roslyn and .NET WebAssembly…');
 const runtime=await dotnet.withConfig({debugLevel:0}).withResourceLoader((type,name,uri)=>{
   if(!/\.(dll|wasm|dat)$/.test(uri))return null;
   const resourceUrl=new URL(uri,app);
   return fetch(resourceUrl.href+'.bin').then(response=>{
     if(!response.ok)throw Error('Runtime asset unavailable: '+name+' ('+response.status+')');
     return new Response(response.body.pipeThrough(new DecompressionStream('gzip')),{headers:{'Content-Type':uri.endsWith('.wasm')?'application/wasm':'application/octet-stream'}});
   });
 }).create();
 const exports=await runtime.getAssemblyExports('PatternRunner');
 const runner=exports.Runner;
 const response=await fetch(new URL('csharp-refs/references.bin',root));
 if(!response.ok)throw Error('Compiler references unavailable: HTTP '+response.status);
 const references=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
 references.forEach(data=>runner.AddReference(data));
 return runner;
}
self.onmessage=async({data})=>{
 try{
  if(!data||typeof data.code!=='string')throw Error('Expected a {code:string} message.');
  const root=assetRoot(data.assetsBase);
  if(api&&activeAssets!==root.href)throw Error('Worker already initialized with another runtime root. Terminate and recreate it to switch assets.');
  if(!api){api=await initialize(root);activeAssets=root.href;}
  emit('started','C# compiler ready');
  const result=JSON.parse(await api.Run(data.code));
  if(result.output)emit('stdout',result.output.replace(/\n$/,''));
  if(result.error)emit('error',result.error);
  else emit('done','Completed');
 }catch(e){emit('fatal',String(e));}
};