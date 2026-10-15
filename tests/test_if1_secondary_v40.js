const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const e=path.join(__dirname,'..','engineering'),read=n=>JSON.parse(fs.readFileSync(path.join(e,n),'utf8')),g=read('PT44_Factory_Transcription_V3.json'),t=read('PT44_IF1_Secondary_Return_Trace_V1.json'),s=read('PT44_Schematic_Trace_Audit_V1.json');
const net=id=>g.factory_nets.find(x=>x.id===id);assert.equal(t.version,'0.40.0');assert.equal(t.verified_endpoints.length,3);
assert(net('F_AVC_RETURN').factory_members.includes('12:sReturn'));assert(net('F_BPLUS_FILT').factory_members.includes('13:a'));assert(net('F_SCREEN_45V').factory_members.includes('13:b'));
assert.equal(t.closure.first_if_transformer_all_four_component_ends_source_traced,true);assert.equal(t.closure.transformer_parameters_complete,false);assert.equal(t.closure.benchmark_ready,false);
assert(s.reviewed_terminal_membership_updates.some(x=>x.net_id==='F_BPLUS_FILT'&&x.reviewed_members.includes('13:a')));assert(s.reviewed_terminal_membership_updates.some(x=>x.net_id==='F_AVC_RETURN'&&x.reviewed_members.includes('12:sReturn')));
console.log('PASS v0.40: first IF secondary return and #13 grid-return resistor ends source-traced');
