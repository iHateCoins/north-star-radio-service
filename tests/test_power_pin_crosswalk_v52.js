const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const trace=read('engineering/PT44_Power_Pin_Crosswalk_V1.json'),graph=read('engineering/PT44_Factory_Transcription_V3.json');
assert.equal(trace.version,'0.52.0');assert.equal(trace.verified_endpoints.length,8);
assert.equal(graph.checks.factory_wiring_fully_transcribed,false);assert.equal(graph.checks.benchmark_ready,false);
assert.equal(read('engineering/PT44_Scope_Audit_V1.json').baseline.declared_component_terminals_not_in_partial_graph,0);
assert.deepEqual(graph.factory_nets.find(n=>n.id==='F_AC_PLUG_A_PRE_SWITCH').factory_members,['31:a','16:switch_a']);
assert.deepEqual(graph.factory_nets.find(n=>n.id==='F_DROPPER_HEATER_INPUT').factory_members,['30:endB','V5:1']);
assert(!graph.factory_nets.find(n=>n.id==='F_RF_CHASSIS').factory_members.includes('16:switch_b'));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const start=scripts[3].indexOf('function pt44BenchAudit()'),end=scripts[3].indexOf('function renderFactoryLedger(box){');assert(start>=0&&end>start);vm.runInContext(scripts[3].slice(start,end),ctx);
const inspect=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));
assert.deepEqual(inspect('PT44_POWER_PIN_CROSSWALK_V1'),trace);
assert(inspect('pt44PowerPinCrosswalkAudit()').ok);assert(inspect('pt44SchematicTraceAudit()').ok);
for(const [label,expression] of [
 ['lost switch contact',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_AC_PLUG_A_PRE_SWITCH'),v=n.factory_members.pop(),bad=!pt44PowerPinCrosswalkAudit().ok;n.factory_members.push(v);return bad;})()`],
 ['lost rectifier plate tap',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_30_40_LAMP_B'),i=n.factory_members.indexOf('V5:2'),v=n.factory_members.splice(i,1)[0],bad=!pt44PowerPinCrosswalkAudit().ok;n.factory_members.splice(i,0,v);return bad;})()`],
 ['invented chassis bond',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_RF_CHASSIS');n.factory_members.push('16:switch_b');const bad=!pt44PowerPinCrosswalkAudit().ok;n.factory_members.pop();return bad;})()`],
 ['premature physical lug claim',`(()=>{const c=PT44_POWER_PIN_CROSSWALK_V1.source_level_closure;c.physical_switch_lug_numbering_verified=true;const bad=!pt44PowerPinCrosswalkAudit().ok;c.physical_switch_lug_numbering_verified=false;return bad;})()`]
])assert.equal(vm.runInContext(expression,ctx),true,label);
assert(html.includes('BUILD v0.60.0<small>'));
console.log('PASS v0.52: power boundaries crosswalked; missing endpoints and unsafe physical claims rejected');
