const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const trace=read('PT44_Aerial_Transformer_Trace_V1.json'),graph=read('PT44_Factory_Transcription_V3.json');
const audit=read('PT44_Schematic_Trace_Audit_V1.json'),scope=read('PT44_Scope_Audit_V1.json'),ready=read('PT44_Engineering_Readiness_V1.json');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const net=id=>graph.factory_nets.find(n=>n.id===id);
assert.equal(trace.version,'0.42.0');assert.equal(trace.verified_endpoints.length,7);assert.equal(trace.benchmark_ready,false);
assert.equal(graph.factory_components['2'].source_terminal_crosswalk.secondary_a,'upper terminal of the 11-turn winding; connected to loop #3:loop_b');assert.equal(graph.factory_components['2'].source_terminal_crosswalk.limits.includes('polarity'),true);
assert.deepEqual(net('F_RF_LOOP_SECONDARY').factory_members,['3:loop_b','2:secondary_a']);
assert.deepEqual(net('F_RF_EXTERNAL_ANTENNA').factory_members,['2:primary_a']);
assert.deepEqual(net('F_RF_ANTENNA_BYPASS').factory_members,['2:primary_b','1:a']);
assert(net('F_RF_CHASSIS').factory_members.includes('1:b'));assert(net('F_AVC_RETURN').factory_members.includes('2:secondary_b'));
assert.equal(trace.external_ports[0].represented_in_component_terminal_graph,false);
assert.equal(trace.source_level_closure.transformer_winding_polarity_or_inductance_verified,false);
assert.equal(graph.checks.traced_network_count,35);assert.equal(graph.checks.factory_terminals_on_traced_nets,114);assert.equal(graph.checks.benchmark_ready,false);
assert.equal(scope.baseline.component_terminal_memberships_in_partial_graph,83);assert.equal(scope.baseline.component_terminal_reference_coverage_percent,100);
assert.equal(ready.version,'0.58.0');assert.equal(ready.evidence_snapshot.source_reviewed_terminal_memberships,114);assert.equal(ready.benchmark_ready,false);
assert(audit.milestones.some(m=>m.version==='0.42.0'&&m.status==='SOURCE_CHECKED_LOOP_AND_EXTERNAL_ANTENNA_PATH_PARTIAL'));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);const fn=scripts[3].slice(scripts[3].indexOf('function pt44BenchAudit()'),scripts[3].indexOf('function renderFactoryLedger(box){'));assert(fn.includes('function pt44AerialTransformerTraceAudit()'));vm.runInContext(fn,ctx);
const inspect=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));
assert.deepEqual(inspect('PT44_AERIAL_TRANSFORMER_TRACE_V1'),trace);
assert.equal(inspect('pt44AerialTransformerTraceAudit()').ok,true,JSON.stringify(inspect('pt44AerialTransformerTraceAudit()').errors));
assert.equal(inspect('pt44SchematicTraceAudit()').ok,true,JSON.stringify(inspect('pt44SchematicTraceAudit()').errors));
for(const [label,expr] of [
 ['incorrect B− merge','(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==="F_RF_CHASSIS");n.factory_members.push("2:secondary_b");const bad=!pt44AerialTransformerTraceAudit().ok;n.factory_members.pop();return bad;})()'],
 ['invented winding polarity','(()=>{const x=PT44_AERIAL_TRANSFORMER_TRACE_V1.source_level_closure;x.transformer_winding_polarity_or_inductance_verified=true;const bad=!pt44AerialTransformerTraceAudit().ok;x.transformer_winding_polarity_or_inductance_verified=false;return bad;})()'],
 ['missing lower loop connection','(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==="F_RF_LOOP_SECONDARY");const i=n.factory_members.indexOf("2:secondary_a"),v=n.factory_members.splice(i,1)[0];const bad=!pt44AerialTransformerTraceAudit().ok;n.factory_members.splice(i,0,v);return bad;})()']
])assert.equal(vm.runInContext(expr,ctx),true,label);
assert(html.includes('BUILD v0.58.0<small>'));
console.log('PASS v0.42: loop return, both #2 windings, external ANT, #1 bypass and separate chassis/B− nets');
