'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
// Serve only this lesson's bundled static assets; no C# runs in this process.
function serve(port=8080){
 const root=path.resolve(__dirname,'../app');
 return http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,data)=>{
   if(error){res.writeHead(404);return res.end('Not found');}
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');res.end(data);
  });
 }).listen(port,'127.0.0.1');
}
module.exports=serve;
if(require.main===module)serve().on('listening',()=>console.log('Open http://127.0.0.1:8080'));
