const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const begin=scripts[3].indexOf('function pt44BenchAudit()'),end=scripts[3].indexOf('function renderFactoryLedger(box){');vm.runInContext(scripts[3].slice(begin,end),ctx);
const inspect=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));
assert.deepEqual(inspect('PT44_SUPPLY_AVC_RECONCILIATION_V1'),read('PT44_Supply_AVC_Reconciliation_V1.json'));
for(const fn of ['pt44SupplyAvcReconciliationAudit','pt44ContinuityAudit','pt44SchematicTraceAudit','pt44EngineeringReadinessAudit'])assert(inspect(fn+'()').ok,JSON.stringify(inspect(fn+'()')));
for(const [a,b,kind,edge,ohms] of [
 ['10:secondary_b','12:pSupply','same_wire_net',null,0],
 ['12:sReturn','17:b','same_wire_net',null,0],
 ['12:pSupply','V2:3','component_path','R13',27000],
 ['17:b','29A:b','component_path','R7',4700000],
 ['V3:4','29A:b','tube_internal_connection','V3:CATHODE_BOND',0],
 ['V2:4','V2:5','same_wire_net',null,0]
]){const q=inspect(`pt44ContinuityQuery(${JSON.stringify(a)},${JSON.stringify(b)})`);assert.equal(q.kind,kind,a+' to '+b);assert.equal(q.ohms,ohms);if(edge)assert(q.path.some(e=>e.id===edge));}
const graph=read('PT44_Factory_Transcription_V3.json'),membership=new Map(graph.factory_nets.flatMap(n=>n.factory_members.map(m=>[m,n.id])));
for(const [a,b] of [['12:sReturn','29A:b'],['13:a','V2:6'],['7:a','3:loop_b']])assert.notEqual(membership.get(a),membership.get(b),'Nonjunction promoted: '+a+' to '+b);
for(const [label,expression] of [
 ['AVC short to B-minus',`(()=>{const a=PT44_FACTORY_V3.factory_nets.find(n=>n.id==='F_AVC_RETURN'),b=PT44_FACTORY_V3.factory_nets.find(n=>n.id==='F_BMINUS'),i=a.factory_members.indexOf('12:sReturn'),t=a.factory_members.splice(i,1)[0];b.factory_members.push(t);const bad=!pt44SupplyAvcReconciliationAudit().ok;b.factory_members.pop();a.factory_members.splice(i,0,t);return bad;})()`],
 ['Wrong grid-return resistor',`(()=>{const a=PT44_FACTORY_V3.factory_nets.find(n=>n.id==='F_IF1_GRID');a.factory_members.push('13:a');const bad=!pt44SupplyAvcReconciliationAudit().ok;a.factory_members.pop();return bad;})()`],
 ['Invented diode socket assignment',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(n=>n.id==='F_AVC_RETURN');n.factory_members.push('V3:5');const bad=!pt44SupplyAvcReconciliationAudit().ok;n.factory_members.pop();return bad;})()`],
 ['Invented pin-4 jumper',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(n=>n.id==='F_BMINUS');n.factory_members.push('V3:4');const bad=!pt44SupplyAvcReconciliationAudit().ok;n.factory_members.pop();return bad;})()`]
])assert.equal(vm.runInContext(expression,ctx),true,label);
// Every passive device that declares receiver connection nets must agree with the active conductor graph.
for(const [id,d] of Object.entries(read('PT44_Passive_Device_Topology_V1.json').devices))if(d.connection_nets)assert.deepEqual(d.connection_nets,d.terminals.map(t=>membership.get(t)),id+' stale passive connection pair');
const history=read('PT44_Pre_v053_Membership_History_V1.json');assert(history.reviewed_terminal_membership_updates.some(v=>v.net_id==='F_IF1_GRID'&&v.reviewed_members.includes('13:a')),'Superseded claim must remain reviewable');
assert.equal(read('PT44_Pin_Closure_Inventory_V1.json').counts.external_receiver_crosswalk_open,2);
assert.equal(read('PT44_Wiring_Gate_Exceptions_V1.json').status,'NOT_MET');
assert(inspect('pt44SupplyAvcReconciliationHTML(x=>x)').includes('CONDUCTOR RECONCILIATION: PASS'));
console.log('PASS v0.53: corrected supply/screen/AVC paths, five external pin returns, internal cathode equivalence and false-junction regressions');
