const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','engineering',n),'utf8'));
const x=read('PT44_IF_Oscillator_Continuity_Recheck_V1.json'),g=read('PT44_Factory_Transcription_V3.json');
assert.equal(x.status,'RESOLVED_BY_SOURCE_CONDUCTOR_RECONCILIATION');
assert.deepEqual(x.graph_claims_under_review_history.map(v=>v.terminal),['13:a','13:b','12:sReturn']);
for(const [terminal,net] of Object.entries(x.resolved_assignments))assert(g.factory_nets.find(n=>n.id===net).factory_members.includes(terminal));
assert.equal(x.netlist_gate_met,false);assert.equal(read('PT44_Engineering_Readiness_V1.json').completion_gates.find(v=>v.id==='GATE-NETLIST').status,'NOT MET');
assert.equal(x.resolution_artifact,'engineering/PT44_Supply_AVC_Reconciliation_V1.json');
console.log('PASS prior IF/oscillator dispute resolved by conductor paths, with remaining netlist gate retained');
