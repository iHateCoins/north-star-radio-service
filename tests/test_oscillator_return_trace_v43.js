const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const trace=read('PT44_Oscillator_Return_Trace_V1.json'),graph=read('PT44_Factory_Transcription_V3.json'),scope=read('PT44_Scope_Audit_V1.json'),ready=read('PT44_Engineering_Readiness_V1.json'),audit=read('PT44_Schematic_Trace_Audit_V1.json');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(trace.version,'0.43.0');assert.equal(trace.verified_endpoints.length,2);assert.equal(trace.benchmark_ready,false);
const b=graph.factory_nets.find(n=>n.id==='F_BMINUS'),chassis=graph.factory_nets.find(n=>n.id==='F_RF_CHASSIS');
assert(b.factory_members.includes('9:b')&&b.factory_members.includes('11:b'));assert(!chassis.factory_members.includes('9:b')&&!chassis.factory_members.includes('11:b'));
assert.equal(graph.checks.traced_network_count,30);assert.equal(graph.checks.factory_terminals_on_traced_nets,92);assert.equal(graph.checks.benchmark_ready,false);
assert.equal(scope.baseline.component_terminal_memberships_in_partial_graph,71);assert.equal(scope.baseline.component_terminal_reference_coverage_percent,85.5);assert.equal(scope.subsystems.find(x=>x.id==='RF').terminals_referenced_in_partial_graph,22);
assert.equal(ready.version,'0.49.0');assert.equal(ready.evidence_snapshot.source_reviewed_terminal_memberships,92);assert.equal(ready.evidence_snapshot.oscillator_return_endpoints_source_traced,2);assert.equal(ready.benchmark_ready,false);
assert(audit.milestones.some(m=>m.version==='0.43.0'&&m.status==='SOURCE_CHECKED_OSCILLATOR_RETURN_PARTIAL'));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);const a=scripts[3].indexOf('function pt44BenchAudit()'),z=scripts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&z>a);vm.runInContext(scripts[3].slice(a,z),ctx);
const inspect=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));assert.deepEqual(inspect('PT44_OSCILLATOR_RETURN_TRACE_V1'),trace);
assert.equal(inspect('pt44OscillatorReturnTraceAudit()').ok,true,JSON.stringify(inspect('pt44OscillatorReturnTraceAudit()').errors));assert.equal(inspect('pt44SchematicTraceAudit()').ok,true,JSON.stringify(inspect('pt44SchematicTraceAudit()').errors));
for(const [label,expr] of [
 ['incorrect chassis merge',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==="F_RF_CHASSIS");n.factory_members.push("9:b");const bad=!pt44OscillatorReturnTraceAudit().ok;n.factory_members.pop();return bad;})()`],
 ['missing capacitor return',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==="F_BMINUS");const i=n.factory_members.indexOf("11:b");const v=n.factory_members.splice(i,1)[0];const bad=!pt44OscillatorReturnTraceAudit().ok;n.factory_members.splice(i,0,v);return bad;})()`],
 ['premature oscillator closure','(()=>{const x=PT44_OSCILLATOR_RETURN_TRACE_V1.source_level_closure;x["7a8_socket_pin_crosswalk_complete"]=true;const bad=!pt44OscillatorReturnTraceAudit().ok;x["7a8_socket_pin_crosswalk_complete"]=false;return bad;})()']
])assert.equal(vm.runInContext(expr,ctx),true,label);
assert(html.includes('BUILD v0.49.0<small>'));
console.log('PASS v0.43: #9/#11 lower endpoints source-traced to B−; converter and socket crosswalk remain open');
