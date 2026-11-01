// Execute the actual inline report logic. Rendering is checked separately.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'DeepDives/2026-10-31-sly-csharp-parser-deep-dive.html'),'utf8');
function contents(id){const m=html.match(new RegExp('<script[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)</script>'));assert.ok(m,'missing '+id);return m[1];}
const data=JSON.parse(contents('evidence-data')),ast=JSON.parse(contents('ast-data'));
const sandbox={module:{exports:{}}};
vm.runInNewContext(contents('sly-report-script'),sandbox,{filename:path.join(root,'docs/sly-deep-dive/inline-report.js')});
const api=sandbox.module.exports,rows=data.comparison.rows;
test('inventory preserves 23 shared expectations and six challenges',()=>{
 assert.equal(rows.length,29);assert.equal(rows.filter(r=>r.Scope==='shared').length,23);
 assert.equal(rows.filter(r=>r.Scope!=='shared').length,6);
 for(const r of rows.filter(r=>r.Scope==='shared')){assert.equal(r.candidate_accepted,r.expected,r.Id);assert.equal(r.baseline_accepted,r.expected,r.Id);assert.equal(api.classify(r).text,'Match');}
});
test('omitted productions, boundary gaps and unavailable evidence are distinct',()=>{
 for(const r of rows.filter(r=>r.Scope==='unimplemented-production'))assert.equal(api.classify(r).text,'Omitted');
 assert.equal(api.classify(rows.find(r=>r.Id==='end-marker-prefix')).text,'Boundary gap');
 assert.equal(api.classify({Scope:'shared',candidate_accepted:null,baseline_accepted:true}).text,'Unavailable');
 assert.equal(api.classify({Scope:'shared',candidate_accepted:false,baseline_accepted:true,expected:true}).text,'Mismatch');
});
test('filter is literal, case-insensitive, scoped and reversible',()=>{
 assert.deepEqual(Array.from(api.selectRows(rows,' DIFFERENTIAL ','shared'),r=>r.Id),['differential','missing-differential-node','extra-differential-node']);
 assert.equal(api.selectRows(rows,'','unimplemented-production').length,5);assert.equal(api.selectRows(rows,'','boundary-challenge').length,1);
 assert.equal(api.selectRows(rows,'[.*]','all').length,0);assert.equal(api.selectRows(rows,'<script>alert(1)</script>','all').length,0);
 assert.equal(api.selectRows(rows,'','all').length,29);assert.equal(api.acceptance(null),'Unavailable');assert.equal(api.acceptance(false),'Rejected');assert.equal(api.acceptance(true),'Accepted');
});
test('recorded ASTs distinguish precedence, grouping and malformed input',()=>{
 const plain=ast.find(r=>r.input==='1+2*3').result;assert.equal(plain.Accepted,true);assert.equal(plain.Node.Kind,'+');assert.equal(plain.Node.Children[1].Kind,'*');
 const grouped=ast.find(r=>r.input==='(1+2)*3').result.Node;assert.equal(grouped.Kind,'*');assert.equal(grouped.Children[0].Kind,'group');
 const bad=ast.find(r=>r.input==='1+').result;assert.equal(bad.Accepted,false);assert.equal(bad.Node,null);assert.ok(bad.Diagnostic);
});
test('source ZIP matches its advertised checksum',()=>{
 const m=html.match(/download="sly-csharp-lab\.zip" href="data:application\/zip;base64,([A-Za-z0-9+/=]+)"/);assert.ok(m);
 const bytes=Buffer.from(m[1],'base64');assert.equal(bytes.readUInt32LE(0),0x04034b50);
 assert.ok(html.includes('id="zip-hash">'+crypto.createHash('sha256').update(bytes).digest('hex')));
});
test('page is self-contained, truthful about execution, and has working section links',()=>{
 assert.ok(html.includes('does not execute Sly, ANTLR or the simulator'));assert.ok(!/<script[^>]+src=/i.test(html));assert.ok(!/<link[^>]+stylesheet/i.test(html));
 assert.ok(!contents('sly-report-script').includes('innerHTML'));assert.ok(!html.includes('__EVIDENCE_'));assert.ok(!html.includes('__LAB_ZIP__'));
 const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'broken section '+m[1]);
});
