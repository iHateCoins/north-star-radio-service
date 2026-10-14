const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const trace=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Output_IF_Supply_Trace_V1.json'),'utf8'));
const graph=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Factory_Transcription_V3.json'),'utf8'));
const readiness=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Engineering_Readiness_V1.json'),'utf8'));
const auditFile=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Schematic_Trace_Audit_V1.json'),'utf8'));
const passive=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Passive_Device_Topology_V1.json'),'utf8'));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.equal(scripts.length,4);scripts.forEach(s=>new Function(s));
for(const [name,value] of [['PT44_OUTPUT_IF_SUPPLY_TRACE_V1',trace],['PT44_FACTORY_V3',graph],['PT44_ENGINEERING_READINESS_V1',readiness],['PT44_SCHEMATIC_TRACE_AUDIT_V1',auditFile],['PT44_PASSIVE_V1',passive]]){const match=html.match(new RegExp('const '+name+' = Object\\.freeze\\((\\{.*?\\})\\);'));assert(match,name+' embedded fixture missing');assert.deepEqual(JSON.parse(match[1]),value);}
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);ctx.PT44_OUTPUT_IF_SUPPLY_TRACE_V1=trace;const start=scripts[3].indexOf('function pt44OutputIfSupplyAudit()'),end=scripts[3].indexOf('function renderFactoryLedger(box)');assert(start>=0&&end>start);vm.runInContext(scripts[3].slice(start,end),ctx);
const read=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));const a=read('pt44OutputIfSupplyAudit()');assert(a.ok,JSON.stringify(a.errors));assert.equal(a.verifiedEndpoints,4);assert.equal(a.symbolConnections,3);assert.equal(trace.benchmark_ready,false);
assert.equal(readiness.version,'0.40.0');assert.equal(readiness.evidence_snapshot.terminal_memberships_on_partial_graph,66);assert.equal(readiness.evidence_snapshot.source_reviewed_terminal_memberships,66);assert.equal(readiness.benchmark_ready,false);
assert.deepEqual(graph.factory_nets.find(n=>n.id==='F_BPLUS_FILT').factory_members.slice(-3),['25:a','12:pSupply','14:pSupply']);assert(graph.factory_nets.find(n=>n.id==='F_BMINUS').factory_members.includes('25:b'));
assert.equal(passive.devices['25'].connection_status,'SOURCE_TRACED_P38_NATIVE_300DPI');assert.equal(passive.devices['25'].connection_nets.join('|'),'F_BPLUS_FILT|F_BMINUS');
assert.equal(auditFile.milestones.find(x=>x.version==='0.38.0').version,'0.38.0');assert.equal(auditFile.reviewed_terminal_membership_updates.filter(x=>x.milestone_version==='0.38.0').length,4);
const mutation=vm.runInContext(`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_BPLUS_FILT'),i=n.factory_members.indexOf('14:pSupply'),m=n.factory_members.splice(i,1)[0],bad=!pt44OutputIfSupplyAudit().ok;n.factory_members.splice(i,0,m);return bad;})()`,ctx);assert(mutation,'output/IF audit must reject a missing source-traced terminal');
console.log('PASS v0.38: #25 bypass and #12/#14 IF supply endpoints source-traced; screen glyphs remain unnumbered');
