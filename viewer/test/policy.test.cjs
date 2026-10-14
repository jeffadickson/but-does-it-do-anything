'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const P=require('../policy.cjs');
const id='a'.repeat(32);
test('only the exact opened book origin and document can navigate',()=>{
  assert(P.allowedBookURL(P.bookURL(id),id));
  assert(P.allowedBookURL(P.bookURL(id)+'#lesson-2',id));
  for(const url of ['https://example.com','http://127.0.0.1:8000','file:///C:/secret.txt','javascript:alert(1)','data:text/html,hello','mailto:a@example.com','ms-settings:','book://other/index.html',`book://${id}/secret.txt`,`book://${id}/index.html?x=1`,`book://user@${id}/index.html`,`book://${id}:123/index.html`,`book://${id}/%2e%2e/secret.txt`,`book://${id}/%69ndex.html`]) assert.equal(P.allowedBookURL(url,id),false,url);
});
test('no resource network or local disk escape',()=>{
  assert(P.allowedResource('data:image/png;base64,AA==',id));
  for(const url of ['https://example.com/x.js','http://localhost','ws://localhost','wss://example.com','ftp://example.com','file:///etc/passwd','blob:book://other/x'])assert.equal(P.allowedResource(url,id),false,url);
});
test('book IDs isolate paths and are stable',()=>{
  assert.equal(P.bookId('/books/a.html'),P.bookId('/books/a.html'));
  assert.notEqual(P.bookId('/books/a.html'),P.bookId('/books/b.html'));
});
test('reject remote and non-HTML paths',()=>{
  P.validateFileName(path.resolve('book.html'));
  for(const file of ['https://example.com/x.html','relative.html','\\\\server\\share\\x.html','//server/share/x.html',path.resolve('a.exe'),path.resolve('a\0.html')]) assert.throws(()=>P.validateFileName(file));
});
test('bound persisted numeric values',()=>{
  assert.equal(P.scrollValue(Infinity),0);assert.equal(P.scrollValue(-3),0);assert.equal(P.scrollValue('alert(1)'),0);
  assert.equal(P.scrollValue(2e9),1e7);assert.equal(P.zoomValue(-1),.5);assert.equal(P.zoomValue(100),2.5);
});
test('CSP denies network and active embedding while allowing workbook scripts',()=>{
  for(const directive of ["connect-src 'none'","frame-src 'none'","worker-src 'none'","object-src 'none'","form-action 'none'","base-uri 'none'"])assert(P.CSP.includes(directive));
  assert(P.CSP.includes("script-src 'self' 'unsafe-inline'"));
  assert(!P.CSP.includes('unsafe-eval'));
});
