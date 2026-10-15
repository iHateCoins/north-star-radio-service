const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const trace=read('PT44_Oscillator_Tank_Trace_V1.json'),graph=read('PT44_Factory_Transcription_V3.json'),audit=read('PT44_Schematic_Trace_Audit_V1.json');
assert.equal(trace.version,'0.50.0');assert.deepEqual(trace.verified_endpoints.map(x=>x.terminal),['4:osc_stator','10:primary_a','10:primary_b']);
assert.equal(graph.factory_nets.length,35);assert.equal(graph.factory_nets.reduce((n,x)=>n+x.factory_members.length,0),114);
assert.equal(read('PT44_Scope_Audit_V1.json').baseline.component_terminal_memberships_in_partial_graph,83);
assert.equal(audit.reviewed_terminal_membership_updates.find(x=>x.milestone_version==='0.50.0').reviewed_members[0],'10:primary_b');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);const start=scripts[3].indexOf('function pt44BenchAudit()'),end=scripts[3].indexOf('function renderFactoryLedger(box){');assert(start>=0&&end>start);vm.runInContext(scripts[3].slice(start,end),ctx);
const inspect=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));assert.deepEqual(inspect('PT44_OSCILLATOR_TANK_TRACE_V1'),trace);
assert.equal(inspect('pt44OscillatorTankTraceAudit()').ok,true);assert.equal(inspect('pt44SchematicTraceAudit()').ok,true,JSON.stringify(inspect('pt44SchematicTraceAudit()').errors));
for(const [label,expression] of [
 ['missing tuned plate',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_OSC_TUNED_LEFT_WINDING');const t=n.factory_members.pop(),bad=!pt44OscillatorTankTraceAudit().ok;n.factory_members.push(t);return bad;})()`],
 ['false B-minus bond',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_BMINUS');n.factory_members.push('10:primary_b');const bad=!pt44OscillatorTankTraceAudit().ok;n.factory_members.pop();return bad;})()`],
 ['premature winding role',`(()=>{const c=PT44_OSCILLATOR_TANK_TRACE_V1.source_level_closure;c.oscillator_transformer_winding_roles_or_polarity_verified=true;const bad=!pt44OscillatorTankTraceAudit().ok;c.oscillator_transformer_winding_roles_or_polarity_verified=false;return bad;})()`]
])assert.equal(vm.runInContext(expression,ctx),true,label);
assert(html.includes('BUILD v0.54.0<small>'));
console.log('PASS v0.50: oscillator tuning plate and left winding endpoints traced; incomplete converter claims rejected');
