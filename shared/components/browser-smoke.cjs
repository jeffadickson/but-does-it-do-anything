'use strict';
// Run after `dotnet run --project tools/Catalog -- build` and installing the async lesson's npm dependencies.
const {chromium}=require('../../lessons/languages-and-verification/java-futures-csharp-async/node_modules/playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../_site');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.LESSON_CHROMIUM,...(process.env.LESSON_CHROMIUM&&process.platform==='linux'?{args:['--no-sandbox','--single-process','--no-zygote']}:{})});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/lessons/software-design/inversion-of-control/workbench.html`);
 const finish=()=>page.waitForFunction(()=>!document.querySelector('#run').disabled,null,{timeout:90000});
 for(const [preset,expected] of [['direct',/Charged 1200/],['manual',/Calls: 1/],['swap',/Declined 1200/],['broken',/CS0738/]]){
  await page.selectOption('#preset',preset);await page.click('#run');await finish();assert.match(await page.locator('#output').innerText(),expected);
 }
 await page.locator('#editor').fill('using System; public class Program { public static void Main(){Console.WriteLine("EDITED-SOURCE");}}');
 await page.click('#run');await finish();assert.match(await page.locator('#output').innerText(),/EDITED-SOURCE/);
 await page.click('#run');await page.click('#stop');assert.match(await page.locator('#state').innerText(),/Stopped/);
 await page.click('#run');await finish();assert.match(await page.locator('#output').innerText(),/EDITED-SOURCE/);
 assert.deepEqual(errors,[]);console.log('IoC: four presets, edited source, stop and restart passed in real C# WASM.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
