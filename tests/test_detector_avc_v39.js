const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),g=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Factory_Transcription_V3.json'))),t=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Detector_AVC_Trace_V1.json'))),a=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Schematic_Trace_Audit_V1.json')));
const net=id=>g.factory_nets.find(x=>x.id===id);
assert.equal(t.version,'0.39.0');assert.equal(t.traced_component_endpoints.length,3);
assert(net('F_IF2_AVC_FEED').factory_members.includes('14:sDetector'));assert(net('F_IF2_AVC_FEED').factory_members.includes('17:a'));assert(net('F_DET_PASSIVE_RETURN').factory_members.includes('17:b'));
assert.equal(t.verified_symbol_connections[0].socket_pin_number,null);assert.equal(t.closure.numbered_7C6_diode_pin_resolved,false);assert.equal(t.closure.complete_avc_route_resolved,false);assert.equal(t.closure.benchmark_ready,false);
assert(a.reviewed_net_memberships.some(n=>n.net_id==='F_IF2_AVC_FEED'&&n.reviewed_members.join('|')==='14:sDetector|17:a'));assert(a.reviewed_terminal_membership_updates.some(x=>x.reviewed_members.includes('17:b')));
assert.deepEqual(t.traced_component_endpoints[0].source_box_px,[750,265,1400,810]);console.log('PASS v0.39: #17 AVC load and return source-traced; diode pin remains unassigned');
