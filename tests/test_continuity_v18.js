const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Documented_Continuity_V1.json'),'utf8'));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,4);scripts.forEach(s=>new Function(s));
const ctx=vm.createContext({console});
vm.runInContext(scripts[1],ctx);
const a=scripts[3].indexOf('// ===== v0.19 · electrically documented');
const b=scripts[3].indexOf('function renderFactoryLedger(box){');
assert(a>=0&&b>a);
vm.runInContext(scripts[3].slice(a,b),ctx);
assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(PT44_CONTINUITY_V1)',ctx)),fixture);
const audit=JSON.parse(vm.runInContext('JSON.stringify(pt44ContinuityAudit())',ctx));
assert(audit.ok,'Continuity audit failure: '+audit.issues.join('; '));
assert(audit.total>=14);assert.equal(audit.passed,audit.total);assert.equal(audit.wireGroups,18);
assert(audit.deviceEdges>=18);
for(const c of fixture.analysis_cases){
  const q=JSON.parse(vm.runInContext('JSON.stringify(pt44ContinuityQuery('+JSON.stringify(c.a)+','+JSON.stringify(c.b)+'))',ctx));
  assert.equal(q.kind,c.expect,c.id);
  if(c.expected_component)assert(q.path.some(e=>e.id===c.expected_component),c.id);
  if(c.nominal_path_ohms!==undefined&&c.nominal_path_ohms!==null)assert.equal(q.ohms,c.nominal_path_ohms,c.id);
}
const mutations=[
  "(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_BMINUS');n.factory_members.push('__CHASSIS__');const result=pt44ContinuityAudit();n.factory_members.pop();return JSON.stringify(result)})()",
  "(()=>{const e=PT44_CONTINUITY_V1.known_passive_edges.find(x=>x.id==='FIELD_28_DC'),v=e.ohms;e.ohms=501;const result=pt44ContinuityAudit();e.ohms=v;return JSON.stringify(result)})()",
  "(()=>{const e=PT44_CONTINUITY_V1.known_passive_edges.find(x=>x.id==='R30_80'),v=e.to;e.to='30:tap';const result=pt44ContinuityAudit();e.to=v;return JSON.stringify(result)})()",
  "(()=>{const e=PT44_CONTINUITY_V1.analysis_cases.find(x=>x.id==='C09'),v=e.expect;e.expect='open';const result=pt44ContinuityAudit();e.expect=v;return JSON.stringify(result)})()"
];
for(const mutation of mutations)assert.equal(JSON.parse(vm.runInContext(mutation,ctx)).ok,false);
assert(fixture.analysis_cases.filter(c=>c.expect==='untraced').length>=5);
const match=html.match(/<meta name="nsrs-build" content="(v\d+\.\d+\.\d+)">/);
assert(match&&/^v\d+\.\d+\.\d+$/.test(match[1]));
assert(html.includes('BUILD '+match[1]+'<small>'));
console.log('PASS: '+audit.total+' continuity cases; '+audit.wireGroups+' traced nets; '+audit.deviceEdges+' device edges; four negative mutations; semantic watermark');
