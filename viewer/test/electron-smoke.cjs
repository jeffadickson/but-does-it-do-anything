'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
exports.run=async({app,win,openBook,current,session})=>{
  const timeout=setTimeout(()=>{console.error('Smoke test timed out');app.exit(1)},60000);
  try{
    assert.equal(await win.webContents.executeJavaScript('typeof require'),'undefined');
    assert.equal(await win.webContents.executeJavaScript('typeof process'),'undefined');
    assert.match(await win.webContents.executeJavaScript('document.body.innerText'),/Equals means same value/);
    assert.match(await win.webContents.executeJavaScript('document.body.innerText'),/One small adventure today/);
    assert.equal(await win.webContents.executeJavaScript("document.querySelector('.bridgeColumns details').open"),false);
    await win.webContents.executeJavaScript("document.querySelector('.bridgeColumns summary').click()");
    assert.equal(await win.webContents.executeJavaScript("document.querySelector('.bridgeColumns details').open"),true);
    assert.match(await win.webContents.executeJavaScript("document.querySelector('.bridgeColumns').innerText"),/Subtract 5 from BOTH sides/);
    await win.webContents.executeJavaScript("document.getElementById('laterCheck').click()");
    assert.equal(await win.webContents.executeJavaScript('checking'),'revisit');
    await win.webContents.executeJavaScript("document.getElementById('fresh').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('practice').textContent"),/Later check/);
    // Real hidden-attribute behavior and cancellation must preserve progress.
    await win.webContents.executeJavaScript("document.getElementById('guideToggle').click()");
    assert.equal(await win.webContents.executeJavaScript("document.getElementById('resetConfirm').hidden"),true);
    const progressBeforeReset=await win.webContents.executeJavaScript('JSON.stringify(state.profiles)');
    await win.webContents.executeJavaScript("document.getElementById('resetProgress').click()");
    assert.equal(await win.webContents.executeJavaScript("document.getElementById('resetConfirm').hidden"),false);
    await win.webContents.executeJavaScript("document.getElementById('cancelReset').click()");
    assert.equal(await win.webContents.executeJavaScript('JSON.stringify(state.profiles)'),progressBeforeReset);
    assert.equal(await win.webContents.executeJavaScript("document.getElementById('resetConfirm').hidden"),true);
    await win.webContents.executeJavaScript("document.getElementById('backCourse').click()");
    await win.webContents.executeJavaScript("document.getElementById('nextStep').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('steps').textContent"),/Both have value five/);
    assert.equal(await win.webContents.executeJavaScript("document.getElementById('robotBuddy').dataset.mood"),'thinking');
    await win.webContents.executeJavaScript("document.getElementById('robotMotion').click()");
    assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('.robotHead')).animationName"),'none');
    assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('algebra-pip-motion')"),'off');
    await win.webContents.executeJavaScript("go(9)");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('storyView').textContent"),/C = \?/);
    await win.webContents.executeJavaScript("document.getElementById('children').value='4';document.getElementById('checkStory').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('labFeedback').textContent"),/Both clues fit/);
    await win.webContents.executeJavaScript("go(4);document.getElementById('amount').value='3';document.getElementById('op').value='add';document.getElementById('apply').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('labFeedback').textContent"),/Solved: x = 7/);
    await win.webContents.executeJavaScript("go(7);document.getElementById('amount').value='3';document.getElementById('op').value='sub';document.getElementById('apply').click();document.getElementById('amount').value='2';document.getElementById('op').value='div';document.getElementById('apply').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('labFeedback').textContent"),/Solved: x = 4/);
    // Real rendering / events, unlike the course's dependency-free DOM stub.
    await win.webContents.executeJavaScript("go(3);document.getElementById('amount').value='2';document.getElementById('op').value='sub';document.getElementById('apply').click()");
    assert.match(await win.webContents.executeJavaScript("document.getElementById('labFeedback').textContent"),/Solved: x = 1/);
    await win.webContents.executeJavaScript("localStorage.setItem('reader-smoke','saved')");
    const file=current().file;
    await openBook(file);
    win=require('electron').BrowserWindow.getAllWindows()[0];
    assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('reader-smoke')"),'saved');
    const rejected=await win.webContents.executeJavaScript("fetch('https://example.com').then(()=>false,()=>true)");
    assert.equal(rejected,true);
    const original=win.webContents.getURL();
    await win.webContents.executeJavaScript("location.href='https://example.com'").catch(()=>{});
    await new Promise(r=>setTimeout(r,200));assert.equal(win.webContents.getURL(),original);
    await win.webContents.executeJavaScript("window.open('https://example.com')");
    assert.equal(require('electron').BrowserWindow.getAllWindows().length,1);
    const testBook=path.join(app.getPath('userData'),'other.html');
    // No meta CSP: verifies that the reader, not the supplied workbook, adds the policy.
    await fs.writeFile(testBook,'<!doctype html><title>Probe</title><body><h1 id="result">Probe</h1><script>document.getElementById("result").textContent="JavaScript works";</script>');
    await openBook(testBook);
    win=require('electron').BrowserWindow.getAllWindows()[0];
    assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('reader-smoke')"),null);
    assert.equal(await win.webContents.executeJavaScript("document.getElementById('result').textContent"),'JavaScript works');
    for(const url of ['https://example.com','http://127.0.0.1:45678','file:///C:/Windows/win.ini']){
      assert.equal(await win.webContents.executeJavaScript(`fetch(${JSON.stringify(url)}).then(()=>false,()=>true)`),true,url);
    }
    assert.equal(await win.webContents.executeJavaScript("new Promise(resolve=>{const s=document.createElement('script');s.src='https://example.com/probe.js';s.onerror=()=>resolve(true);s.onload=()=>resolve(false);document.body.appendChild(s)})"),true);
    const image=await win.webContents.capturePage();assert(!image.isEmpty());
    // Returning to the course proves switching didn't lose its persistent partition.
    await openBook(file);win=require('electron').BrowserWindow.getAllWindows()[0];
    assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('reader-smoke')"),'saved');
    await win.webContents.session.flushStorageData();
    console.log('PASS: actual Electron rendering, workbook events, local persistence, book isolation, script/resource/network blocking, navigation and popup blocking.');
    clearTimeout(timeout);app.exit(0);
  }catch(error){clearTimeout(timeout);console.error(error);app.exit(1)}
};
