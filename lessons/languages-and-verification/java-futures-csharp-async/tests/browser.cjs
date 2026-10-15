'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.LESSON_CHROMIUM?{executablePath:process.env.LESSON_CHROMIUM,args:['--no-sandbox','--single-process','--no-zygote']}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',colorScheme:'light'});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http**/*',r=>r.abort()); // Proves the page needs no external runtime resources.
 await page.goto(pathToFileURL(path.resolve(__dirname,'../app/index.html')).href);
 await page.clock.install();const click=sel=>page.locator(sel).click();const text=sel=>page.locator(sel).innerText();
 await click('[data-intro="sequential"]');await page.clock.runFor(6100);assert.match(await text('#intro-status'),/6.0 s \/ 6 s.*Complete/);
 await click('[data-intro="pool"]');await page.clock.runFor(4100);assert.match(await text('#intro-status'),/4.0 s \/ 4 s/);
 await click('[data-intro="concurrent"]');await page.clock.runFor(2100);assert.match(await text('#intro-status'),/2.0 s \/ 2 s/);
 await click('#intro-reset');assert.match(await text('#intro-status'),/Choose/);
 await click('[data-dep="power"]');assert.match(await text('#dep-status'),/Blocked/);for(const name of ['current','voltage','calibrate','power'])await click(`[data-dep="${name}"]`);assert.match(await text('#dep-status'),/1.001 W/);await click('#dep-reset');
 for(let i=0;i<3;i++)await click('#await-next');assert.match(await text('#await-thread'),/free/);await click('#await-auto');await page.clock.runFor(3000);assert.match(await text('#await-status'),/UI context/);await click('#await-reset');await page.locator('#await-ready').check();for(let i=0;i<3;i++)await click('#await-next');assert.match(await text('#await-status'),/inline/);
 await click('[data-lab="sequential"]');await page.clock.runFor(500);assert.match(await text('#lab-devices'),/Working… 1\.[0-9] s remaining/);assert.match(await text('#lab-devices'),/Waiting to start/);await page.clock.runFor(5600);assert.match(await text('#lab-status'),/6.0 s · Completed/);
 await page.locator('#lab-fail').check();await click('[data-lab="concurrent"]');await page.clock.runFor(1300);assert.match(await text('#lab-status'),/siblings still running/);await page.clock.runFor(800);assert.match(await text('#lab-status'),/2.0 s · Failed/);assert.match(await text('#lab-devices'),/2.0 Vpp/);
 await click('[data-lab="sequential"]');await page.clock.runFor(3300);assert.match(await text('#lab-devices'),/Not started/);
 await page.locator('#lab-fail').uncheck();await click('[data-lab="concurrent"]');await page.clock.runFor(400);await click('#lab-cancel');assert.match(await text('#lab-status'),/Cancelled/);await click('#lab-reset');
 await page.selectOption('#stream-rate','150');await click('#stream-start');await page.clock.runFor(10000);assert.match(await text('#stream-status'),/60\/60 history points/);await click('#stream-stop');const stopped=await text('#stream-status');await page.clock.runFor(1000);assert.equal(await text('#stream-status'),stopped);await click('#stream-reset');
 await click('[data-order="enable"]');assert.match(await text('#order-status'),/violated/);for(const n of ['meter','generator','generator'])await click(`[data-order="${n}"]`);await click('[data-order="enable"]');assert.match(await text('#order-status'),/violated/);for(const n of ['meter','enable','enable','measure'])await click(`[data-order="${n}"]`);await click('#order-fail');for(let i=0;i<2;i++)await click('[data-order="disable"]');assert.match(await text('#order-status'),/Valid procedure/);await click('#order-reset');
 for(let i=0;i<6;i++){await click(`[data-check="${i}"]`);assert.match(await text('#feedback-'+i),/Choose/);await page.check(`input[name="ex${i}"][value="${i===1?1:0}"]`);await click(`[data-check="${i}"]`);assert.match(await text('#feedback-'+i),/Try again/);await page.check(`input[name="ex${i}"][value="${i===1?0:1}"]`);await click(`[data-check="${i}"]`);assert.match(await text('#feedback-'+i),/Correct/);}assert.match(await text('#exercise-count'),/6\/6/);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'FutureLab.java',exact:true}).click();assert.equal((await download).suggestedFilename(),'FutureLab.java');
 await click('#theme');assert.equal(await page.locator('body').evaluate(x=>x.classList.contains('dark')),true);
 await page.goto(pathToFileURL(path.resolve(__dirname,'../app/index.html')).href+'#lab');await page.screenshot({path:path.resolve(__dirname,'../.screenshots/desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.goto(pathToFileURL(path.resolve(__dirname,'../app/index.html')).href);await page.screenshot({path:path.resolve(__dirname,'../.screenshots/mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: six teaching simulations, six exercises, downloads, offline loading, themes and mobile overflow.');
})().catch(e=>{console.error(e);process.exit(1);});
