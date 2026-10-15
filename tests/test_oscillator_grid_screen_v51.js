const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const trace=read('PT44_Oscillator_Grid_Screen_Bypass_Trace_V1.json'),graph=read('PT44_Factory_Transcription_V3.json'),scope=read('PT44_Scope_Audit_V1.json');
assert.equal(trace.version,'0.51.0');assert.deepEqual(trace.verified_endpoints.map(x=>x.terminal),['9:a','V1:4','11:a']);
assert.deepEqual(graph.factory_nets.find(x=>x.id==='F_OSC_GRID_LEAK').factory_members,['9:a','V1:4']);
assert(graph.factory_nets.find(x=>x.id==='F_SCREEN_45V').factory_members.includes('11:a'));
assert.equal(scope.baseline.component_terminal_memberships_in_partial_graph,83);assert.equal(scope.baseline.tube_pin_memberships_in_partial_graph,31);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);const a=scripts[3].indexOf('function pt44BenchAudit()'),z=scripts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&z>a);vm.runInContext(scripts[3].slice(a,z),ctx);
const inspect=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));assert.deepEqual(inspect('PT44_OSCILLATOR_GRID_SCREEN_BYPASS_TRACE_V1'),trace);
assert.equal(inspect('pt44OscillatorGridScreenBypassAudit()').ok,true);assert.equal(inspect('pt44SchematicTraceAudit()').ok,true,JSON.stringify(inspect('pt44SchematicTraceAudit()').errors));
for(const [label,expr] of [
 ['missing screen capacitor',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_SCREEN_45V');const i=n.factory_members.indexOf('11:a'),v=n.factory_members.splice(i,1)[0],bad=!pt44OscillatorGridScreenBypassAudit().ok;n.factory_members.splice(i,0,v);return bad;})()`],
 ['false winding contact',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_OSC_TUNED_LEFT_WINDING');n.factory_members.push('9:a');const bad=!pt44OscillatorGridScreenBypassAudit().ok;n.factory_members.pop();return bad;})()`],
 ['false screen measurement target',`(()=>{const c=PT44_OSCILLATOR_GRID_SCREEN_BYPASS_TRACE_V1.source_level_closure;c.screen_45v_measurement_conditions_verified=true;const bad=!pt44OscillatorGridScreenBypassAudit().ok;c.screen_45v_measurement_conditions_verified=false;return bad;})()`]
])assert.equal(vm.runInContext(expr,ctx),true,label);
assert(html.includes('BUILD v0.58.0<small>'));
console.log('PASS v0.51: #9 grid leak and #11 screen bypass source-traced; false winding/measurement claims rejected');
