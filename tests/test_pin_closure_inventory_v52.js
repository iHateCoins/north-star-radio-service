const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8'));
const inventory=read('PT44_Pin_Closure_Inventory_V1.json'),graph=read('PT44_Factory_Transcription_V3.json'),tubes=read('PT44_Tube_Terminals_Review_V1.json'),internal=read('PT44_Tube_Internal_Topology_V1.json'),ready=read('PT44_Engineering_Readiness_V1.json');
const graphPins=new Set(graph.factory_nets.flatMap(n=>n.factory_members).filter(m=>m.startsWith('V')));
const roles=Object.entries(tubes.tube_pinouts).flatMap(([tube,d])=>Object.keys(d.pin_roles).map(pin=>`${tube}:${pin}`));
const expectedOptions=new Set(['V4:1','V4:6','V5:3','V5:4','V5:5','V5:6']);
const classify=records=>{
 const byTerminal=new Map(records.map(p=>[p.terminal,p]));const issues=[];
 if(byTerminal.size!==roles.length||roles.some(pin=>!byTerminal.has(pin)))issues.push('incomplete or duplicate socket positions');
 for(const pin of roles){const r=byTerminal.get(pin);if(!r)continue;const should=graphPins.has(pin)?'reviewed_graph_member':pin==='V3:4'?'internal_equivalent_receiver_net':expectedOptions.has(pin)?'manufacturer_nonfunctional_or_option':'external_receiver_crosswalk_open';if(r.status!==should)issues.push(pin+' misclassified');const memberships=graph.factory_nets.filter(n=>n.factory_members.includes(pin)).map(n=>n.id);if(r.graph_net!==null && !memberships.includes(r.graph_net))issues.push(pin+' invented or wrong net');if(r.status==='reviewed_graph_member' && !memberships.includes(r.graph_net))issues.push(pin+' missing reviewed net');}
 if(byTerminal.get('V3:4')?.internal_bond_peer!=='V3:7'||byTerminal.get('V3:7')?.internal_bond_peer!=='V3:4')issues.push('7C6 internal cathode bond omitted');
 return issues;
};
assert.deepEqual(classify(inventory.pin_records),[]);assert.equal(inventory.pin_records.length,40);assert.equal(graphPins.size,31);assert.equal(expectedOptions.size,6);assert.equal(inventory.open_terminal_list.length,2);assert.deepEqual(inventory.open_terminal_list,['V3:5','V3:6']);
assert(internal.certified_metallic_links.some(x=>x.from==='V3:4'&&x.to==='V3:7'));
assert.equal(ready.completion_gates.find(x=>x.id==='GATE-NETLIST').status,'NOT MET');
const corrupt=structuredClone(inventory.pin_records);corrupt.find(x=>x.terminal==='V2:5').status='manufacturer_nonfunctional_or_option';assert(classify(corrupt).length);
const falseBond=structuredClone(inventory.pin_records);falseBond.find(x=>x.terminal==='V3:7').internal_bond_peer=null;assert(classify(falseBond).length);
console.log('PASS v0.52 pin inventory: 40 classified positions, six manufacturer options, two open external roles; false closure rejected');
