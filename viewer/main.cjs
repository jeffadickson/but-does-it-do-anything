'use strict';
const { app, BrowserWindow, Menu, dialog, session, protocol } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
const P = require('./policy.cjs');
const development = !app.isPackaged && process.argv.includes('--development-unrestricted');
const smoke = !app.isPackaged && process.argv.includes('--reader-smoke-test');
app.enableSandbox();
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('no-pings');
// Defense in depth only. The Windows firewall is the process-level network boundary.
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
protocol.registerSchemesAsPrivileged([{ scheme: 'book', privileges: { standard: true, secure: true } }]);
if (smoke) app.setPath('userData', path.join(app.getPath('temp'), `offline-reader-smoke-${process.pid}`));
const userFile = () => path.join(app.getPath('userData'), 'reader-state.json');
const guardScript = () => app.isPackaged ? path.join(process.resourcesPath, 'reader-tools', 'NetworkGuard.ps1') : path.join(__dirname, 'scripts', 'NetworkGuard.ps1');
let win, current, state = { recent: [], books: {} }, serial = Promise.resolve(), guardTimer, guardBusy = false;
const snapshots = new Map();
const hardenedSessions = new WeakSet();
let openQueue = Promise.resolve();
function guard(mode, target) {
  if (process.platform !== 'win32') return development ? Promise.resolve() : Promise.reject(new Error('This release requires Windows network isolation.'));
  const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return runFile(ps, ['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',guardScript(),'-Mode',mode,'-ExecutablePath',target], { windowsHide: true, timeout: 20000 });
}
async function verifyGuard() { if (!development) await guard('Verify', process.execPath); }
function writeState() {
  const text = JSON.stringify(state, null, 2);
  serial = serial.catch(() => {}).then(async () => {
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    const tmp = userFile() + '.tmp'; await fs.writeFile(tmp, text, { mode: 0o600 }); await fs.rename(tmp, userFile());
  });
  return serial;
}
async function readState() {
  try {
    const s = JSON.parse(await fs.readFile(userFile(), 'utf8'));
    if (s && Array.isArray(s.recent) && s.books && typeof s.books === 'object' && !Array.isArray(s.books)) {
      state.recent = s.recent.filter(x => typeof x === 'string').slice(0,10);
      for (const [id,b] of Object.entries(s.books)) if (/^[a-f0-9]{32}$/.test(id) && b && typeof b === 'object') state.books[id] = {
        scroll: P.scrollValue(b.scroll), zoom: P.zoomValue(b.zoom),
        bookmarks: Array.isArray(b.bookmarks) ? b.bookmarks.filter(v=>v && Number.isFinite(v.y)).slice(0,20).map(v=>({y:P.scrollValue(v.y)})) : []
      };
    }
  } catch { /* First launch or malformed settings: start fresh, never execute settings. */ }
}
function bookState(id) { return state.books[id] ||= { scroll:0, zoom:1, bookmarks:[] }; }
function hardenSession(ses, id) {
  if(hardenedSessions.has(ses))return;
  hardenedSessions.add(ses);
  ses.setPermissionRequestHandler((_wc,_permission,callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);
  ses.setDisplayMediaRequestHandler((_request, callback) => callback({}));
  ses.on('will-download', event => event.preventDefault());
  ses.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !P.allowedResource(details.url, id) }));
}
function title() { return `Offline Book Reader — ${current ? path.basename(current.file) : 'Open a book'}${development ? ' [DEVELOPMENT: OS network block not verified]' : ''}`; }
function hardenWindow(w, id) {
  const wc = w.webContents;
  wc.setWindowOpenHandler(() => ({ action:'deny' }));
  wc.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');
  wc.on('will-navigate',(event,url)=>{ if (!P.allowedBookURL(url,id)) event.preventDefault(); });
  wc.on('will-frame-navigate', (event,details) => {
    // Current Electron exposes details on the event; retain the explicit details form too.
    const d = details && typeof details === 'object' ? details : event;
    if (!d.isMainFrame || !P.allowedBookURL(d.url,id)) event.preventDefault();
  });
  wc.on('will-redirect',(event,url)=>{ if (!P.allowedBookURL(url,id)) event.preventDefault(); });
  wc.on('will-attach-webview', event => event.preventDefault());
  wc.on('select-bluetooth-device', (event,_devices,callback) => { event.preventDefault();callback(''); });
  w.on('page-title-updated', event => { event.preventDefault(); w.setTitle(title()); });
  wc.on('before-input-event',(event,input)=>{
    if ((input.control || input.meta) && (input.key.toLowerCase()==='l' || input.key.toLowerCase()==='k')) event.preventDefault();
    if (input.key==='F12' || ((input.control || input.meta) && input.shift && ['i','j','c'].includes(input.key.toLowerCase()))) event.preventDefault();
  });
}
async function capturePosition(w = win, id = current?.id) {
  if (!w || w.isDestroyed() || !id) return;
  try { bookState(id).scroll = P.scrollValue(await w.webContents.executeJavaScript('window.scrollY', true)); } catch {}
  try { await writeState(); } catch { /* A later save can retry. */ }
}
function openBook(file) {
  const next = openQueue.catch(()=>{}).then(()=>openBookNow(file));
  openQueue = next;
  return next;
}
async function openBookNow(file) {
  await verifyGuard();
  P.validateFileName(file);
  if (process.platform === 'win32') await guard('LocalFile', file);
  const canonical = await fs.realpath(file);
  P.validateFileName(canonical);
  if (process.platform === 'win32') await guard('LocalFile', canonical);
  const stat = await fs.stat(canonical);
  if (!stat.isFile() || stat.size > P.MAX_BOOK_BYTES) throw new Error('Choose an HTML file no larger than 25 MiB.');
  const bytes = await fs.readFile(canonical);
  if (bytes.length > P.MAX_BOOK_BYTES) throw new Error('The book is too large.');
  const id = P.bookId(canonical), previous = win, previousBook = current;
  await capturePosition();
  const ses = session.fromPartition(`persist:book-${id}`);
  hardenSession(ses, id);
  snapshots.set(id, bytes);
  if (!ses.protocol.isProtocolHandled || !(await ses.protocol.isProtocolHandled('book'))) {
    ses.protocol.handle('book', request => {
      if (request.method !== 'GET' || !P.allowedBookURL(request.url,id)) return new Response('Blocked', { status:403 });
      return new Response(snapshots.get(id), { headers:{
        'Content-Type':'text/html; charset=utf-8', 'Content-Security-Policy':P.CSP,
        'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-store',
        'Permissions-Policy':'camera=(), microphone=(), geolocation=(), usb=(), serial=(), bluetooth=(), display-capture=()'
      }});
    });
  }
  current = { id, file:canonical };
  const prefs = bookState(id);
  win = new BrowserWindow({ width:1150,height:850,minWidth:650,minHeight:450,show:false,title:title(),backgroundColor:'#faf8f1',webPreferences:{
    session:ses, sandbox:true, contextIsolation:true, nodeIntegration:false, nodeIntegrationInWorker:false,
    nodeIntegrationInSubFrames:false, webviewTag:false, webSecurity:true, allowRunningInsecureContent:false,
    devTools:smoke, navigateOnDragDrop:false, safeDialogs:true, disableDialogs:true, spellcheck:false
  }});
  const opened = win;
  hardenWindow(opened,id);
  let closing = false;
  opened.on('close', event => {
    if (!closing && opened === win) {
      event.preventDefault(); closing = true;
      Promise.race([capturePosition(opened,id),new Promise(r=>setTimeout(r,1000))]).finally(()=>{ if(!opened.isDestroyed())opened.destroy(); });
    }
  });
  opened.on('closed', () => { if(win===opened)win=null; });
  opened.webContents.on('did-finish-load',()=>{
    opened.webContents.setZoomFactor(P.zoomValue(prefs.zoom));
    opened.webContents.executeJavaScript(`window.scrollTo(0, ${P.scrollValue(prefs.scroll)})`).catch(()=>{});
  });
  try { await opened.loadURL(P.bookURL(id)); } catch (error) { opened.destroy(); win = previous; current = previousBook; throw error; }
  state.recent = [canonical,...state.recent.filter(x=>x!==canonical)].slice(0,10);
  await writeState();
  buildMenu(); opened.setTitle(title()); if(!smoke)opened.show();
  if(previous && !previous.isDestroyed())previous.destroy();
}
function bundledFile() { return path.join(__dirname,'books','Algebra_Adventure.html'); }
async function chooseBook() {
  const result = await dialog.showOpenDialog(win || undefined,{title:'Open a self-contained HTML book',properties:['openFile'],filters:[{name:'HTML books',extensions:['html','htm']}]});
  if(!result.canceled && result.filePaths[0])await safely(()=>openBook(result.filePaths[0]));
}
async function safely(action) { try { await action(); } catch(error) { await dialog.showMessageBox(win || undefined,{type:'error',title:'Could not complete that action',message:error.message || 'Action failed.'}); } }
function zoom(delta) { if(!win)return; const b=bookState(current.id); b.zoom=delta===0?1:P.zoomValue(win.webContents.getZoomFactor()+delta);win.webContents.setZoomFactor(b.zoom);writeState().catch(()=>{}); }
async function bookmark() {
  if(!win)return;await capturePosition();const b=bookState(current.id);b.bookmarks.push({y:b.scroll});b.bookmarks=b.bookmarks.slice(-20);await writeState();buildMenu();
}
function buildMenu() {
  const b=current?bookState(current.id):{bookmarks:[]};
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'Book',submenu:[
      {label:'Open HTML book…',accelerator:'CmdOrCtrl+O',click:chooseBook},
      {label:'Open Algebra Adventure',click:()=>safely(()=>openBook(bundledFile()))},
      {label:'Recent books',submenu:state.recent.length?state.recent.map(file=>({label:path.basename(file).replaceAll('&','&&'),click:()=>safely(()=>openBook(file))})):[{label:'No recent books',enabled:false}]},
      {type:'separator'},
      {label:'Print…',accelerator:'CmdOrCtrl+P',click:()=>win?.webContents.print({silent:false,printBackground:true},(success,reason)=>{if(!success&&reason!=='cancelled')safely(()=>Promise.reject(new Error(reason || 'Printing failed.')));})},
      {label:'Exit',accelerator:'Alt+F4',click:()=>win?win.close():app.quit()}
    ]},
    {label:'View',submenu:[
      {label:'Zoom in',accelerator:'CmdOrCtrl+=',click:()=>zoom(.1)},
      {label:'Zoom out',accelerator:'CmdOrCtrl+-',click:()=>zoom(-.1)},
      {label:'Actual size',accelerator:'CmdOrCtrl+0',click:()=>zoom(0)},
      {type:'separator'},
      {label:'Reload book from disk',accelerator:'CmdOrCtrl+R',click:()=>current&&safely(()=>openBook(current.file))},
      {label:'Full screen',accelerator:'F11',click:()=>win?.setFullScreen(!win.isFullScreen())}
    ]},
    {label:'Bookmarks',submenu:[
      {label:'Bookmark this position',accelerator:'CmdOrCtrl+D',click:()=>safely(bookmark)},
      ...b.bookmarks.map((mark,i)=>({label:`Position ${i+1} (${mark.y}px)`,click:()=>win?.webContents.executeJavaScript(`window.scrollTo(0, ${P.scrollValue(mark.y)})`).catch(()=>{})})),
      {type:'separator'},{label:'Clear this book’s bookmarks',enabled:b.bookmarks.length>0,click:()=>{b.bookmarks=[];writeState().catch(()=>{});buildMenu();}}
    ]},
    {label:'Help',submenu:[{label:'About / network protection',click:()=>dialog.showMessageBox(win,{type:'info',message:'Offline Book Reader 0.1',detail:development?'Development mode: document requests are restricted, but OS network protection is NOT verified.': 'Windows firewall block rules verified at startup and periodically. Books have no address bar, external navigation, Node access, permissions, or download access. Only self-contained HTML files are supported. Saved progress is kept on this computer. This is not a kiosk: other applications can still use the internet.'})}]}
  ]));
}
app.on('window-all-closed',()=>{clearInterval(guardTimer);app.quit();});
app.on('web-contents-created',(_event,wc)=>{wc.setWindowOpenHandler(()=>({action:'deny'}));});
app.whenReady().then(async()=>{
  hardenSession(session.defaultSession,'none');
  await verifyGuard(); await readState();
  // Bundled copy is staged before npm start / packaging.
  await openBook(bundledFile());
  if(smoke) { await require('./test/electron-smoke.cjs').run({app,win,openBook,current:()=>current,session}); return; }
  guardTimer=setInterval(async()=>{
    if(guardBusy || development)return;guardBusy=true;
    try{await verifyGuard();}catch{dialog.showErrorBox('Network protection is no longer verified','The reader will close. Restore its firewall rules before reopening.');win?.destroy();app.quit();}finally{guardBusy=false;}
  },30000);
}).catch(error=>{
  if(smoke){console.error(error);app.exit(1);return;}
  dialog.showErrorBox('Offline Book Reader cannot start',`${error.stderr || error.message}\n\nOn Windows, run Enable-Network-Block.cmd as administrator from the extracted reader folder, then open the reader again. Do not move the folder after setup without running setup again.`);
  app.quit();
});
