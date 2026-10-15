const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const server=require('../tools/serve.cjs')(0);
(async()=>{
 await new Promise(resolve=>server.on('listening',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.LESSON_CHROMIUM,...(process.env.LESSON_CHROMIUM && process.platform === 'linux' ? {args:['--no-sandbox','--single-process','--no-zygote']} : {})});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port);
 for(const scenario of ['concurrent','sequential','failure','cancel']){
  await page.selectOption('#cs-scenario',scenario);await page.click('#cs-run');
  await page.waitForFunction(()=>!document.querySelector('#cs-run').disabled,{},{timeout:90000});
  const out=await page.locator('#cs-output').innerText();console.log(scenario,out);
  assert.match(await page.locator('#cs-status').innerText(),/Completed/);
  if(scenario==='failure'){assert.match(out,/TimeoutException/);assert.match(out,/Scope: completed/);assert.match(out,/1 fault/);}
  else if(scenario==='cancel')assert.match(out,/Cancelled cooperatively/);
  else {assert.match(out,/DMM: completed, 5.01 V/);assert.match(out,/Scope: completed, 2 Vpp/);}
 }
 await page.selectOption('#cs-scenario','pool');await page.click('#cs-run');
 await page.waitForFunction(()=>!document.querySelector('#cs-run').disabled,{},{timeout:90000});
 const poolOutput=await page.locator('#cs-output').innerText();
 assert.match(poolOutput,/All readings processed; all loops finished/);
 const readings=[...poolOutput.matchAll(/processed reading (\d+)/g)].map(m=>Number(m[1])).sort((a,b)=>a-b);
 assert.deepEqual(readings,Array.from({length:12},(_,i)=>i+1));
 // Execute all Dataflow examples in the actual offline C# runtime.
 for(const scenario of ['dataflow-pool','dataflow','dataflow-unordered','dataflow-failure','dataflow-cancel']){
  await page.click(`[data-load-csharp="${scenario}"]`);
  assert.equal(await page.locator('#cs-scenario').inputValue(),scenario);
  await page.click('#cs-run');
  await page.waitForFunction(()=>!document.querySelector('#cs-run').disabled,{},{timeout:90000});
  const out=await page.locator('#cs-output').innerText();console.log(scenario,out);
  assert.match(await page.locator('#cs-status').innerText(),/Completed/);
  if(scenario==='dataflow-pool'){
   assert.match(out,/All writes finished/);
   const ids=[...out.matchAll(/Recorded reading (\d+)/g)].map(m=>Number(m[1])).sort((a,b)=>a-b);
   assert.deepEqual(ids,Array.from({length:12},(_,i)=>i+1));
  }else{
   assert.match(out,/All owned tasks terminal: True/);
   if(scenario==='dataflow-failure')assert.match(out,/Recorder failed on reading 3/);
   else if(scenario==='dataflow-cancel')assert.match(out,/Pipeline cancelled cooperatively/);
   else{
    assert.match(out,/Pipeline completed/);
    const ids=[...out.matchAll(/Recorded (\d+):/g)].map(m=>Number(m[1]));
    if(scenario==='dataflow')assert.deepEqual(ids,[1,2,3,4,5,6,7,8]);
    assert.deepEqual([...ids].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8]);
   }
  }
 }
 await page.click('[data-df-answer="written"]');
 assert.match(await page.locator('#dataflow-feedback').innerText(),/Try again/);
 await page.click('[data-df-answer="accepted"]');
 assert.match(await page.locator('#dataflow-feedback').innerText(),/Correct/);
 await page.selectOption('#cs-scenario','cancel');
 // Execute edited source, preserve drafts, and recover a failed or terminated runtime.
 await page.click('#cs-edit');
 const original=await page.locator('#cs-editor').inputValue();
 const sentinel='using System; public class Edited { public static void Main() { Console.WriteLine("EDITED-CODE-EXECUTED"); } }';
 await page.locator('#cs-editor').fill(sentinel);
 await page.selectOption('#cs-scenario','concurrent');
 await page.selectOption('#cs-scenario','cancel');
 assert.equal(await page.locator('#cs-editor').inputValue(),sentinel);
 async function runAndFinish(){await page.click('#cs-run');await page.waitForFunction(()=>!document.querySelector('#cs-run').disabled,{},{timeout:90000});}
 await runAndFinish();assert.match(await page.locator('#cs-output').innerText(),/EDITED-CODE-EXECUTED/);
 await page.locator('#cs-editor').fill('this is invalid C#');
 await runAndFinish();assert.match(await page.locator('#cs-status').innerText(),/failed/);
 await page.locator('#cs-editor').fill(sentinel);
 await runAndFinish();assert.match(await page.locator('#cs-output').innerText(),/EDITED-CODE-EXECUTED/);
 await page.locator('#cs-editor').fill(original.replace('int cancelAfterMs = 800','int cancelAfterMs = 0'));
 await page.click('#cs-run');assert.equal(await page.locator('#cs-editor').isDisabled(),true);assert.equal(await page.locator('#cs-scenario').isDisabled(),true);
 await page.click('#cs-stop');assert.match(await page.locator('#cs-status').innerText(),/Runtime stopped/);
 await page.locator('#cs-editor').fill(sentinel);await runAndFinish();assert.match(await page.locator('#cs-output').innerText(),/EDITED-CODE-EXECUTED/);
 await page.locator('#csharp-workbench .code-toggle').click();assert.equal(await page.locator('#csharp-workbench pre[data-lang]').isVisible(),true);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);await page.screenshot({path:'.screenshots/wasm-mobile.png',fullPage:false});await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
