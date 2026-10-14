const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const graph=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Factory_Transcription_V3.json'),'utf8'));
const legacyGraph=JSON.parse(fs.readFileSync(path.join(root,'PT44_Factory_Transcription_V3.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Output_Cathode_Bypass_Trace_V1.json'),'utf8'));
const readiness=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Engineering_Readiness_V1.json'),'utf8'));
const passive=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Passive_Device_Topology_V1.json'),'utf8'));
const deck=fs.readFileSync(path.join(root,'engineering/PT44_Cathode_Bypass_AC_v36.cir'),'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length,4);scripts.forEach(x=>new Function(x));
const embedded=html.match(/const PT44_OUTPUT_BYPASS_TRACE_V1 = Object\.freeze\((\{.*?\})\);/);assert(embedded,'embedded v0.36 trace fixture missing');assert.deepEqual(JSON.parse(embedded[1]),evidence);
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);ctx.PT44_OUTPUT_BYPASS_TRACE_V1=evidence;ctx.PT44_ENGINEERING_READINESS_V1=readiness;
const start=scripts[3].indexOf('function pt44OutputBypassAudit()'),end=scripts[3].indexOf('function renderFactoryLedger(box)');
assert(start>=0&&end>start);vm.runInContext(scripts[3].slice(start,end),ctx);
const read=expr=>JSON.parse(vm.runInContext('JSON.stringify('+expr+')',ctx));
assert.deepEqual(read('PT44_FACTORY_V3'),graph);assert.deepEqual(read('PT44_OUTPUT_BYPASS_TRACE_V1'),evidence);assert.deepEqual(read('PT44_ENGINEERING_READINESS_V1'),readiness);
const audit=read('pt44OutputBypassAudit()');
assert(audit.ok,JSON.stringify(audit.errors));
assert.equal(evidence.verified_endpoints.length,2);assert.equal(audit.verifiedMemberships,2);assert.equal(audit.netGroups,2);
assert.equal(graph.checks.traced_network_count,22);assert.equal(graph.checks.factory_terminals_on_traced_nets,56);assert.equal(legacyGraph.checks.factory_terminals_on_traced_nets,41);assert(legacyGraph.factory_nets.find(x=>x.id==='F_50L6_CATH').factory_members.includes('22:a'));assert(legacyGraph.factory_nets.find(x=>x.id==='F_BMINUS').factory_members.includes('22:b'));
assert.deepEqual(graph.factory_nets.find(x=>x.id==='F_50L6_CATH').factory_members,['V4:8','24:a','22:a']);
assert.deepEqual(graph.factory_nets.find(x=>x.id==='F_BMINUS').factory_members,['29A:b','29B:b','23:b','24:b','22:b']);
assert.equal(readiness.version,'0.36.0');assert.equal(readiness.evidence_snapshot.terminal_memberships_on_partial_graph,56);
assert.equal(readiness.evidence_snapshot.output_cathode_bypass_memberships,2);assert.equal(readiness.evidence_snapshot.spice.full_receiver_spice_validated,false);
assert.equal(readiness.benchmark_ready,false);assert.equal(graph.checks.benchmark_ready,false);assert.equal(evidence.acceptance.benchmark_ready,false);
assert.equal(passive.devices['22'].connection_nets.join('|'),'F_50L6_CATH|F_BMINUS');assert.equal(passive.devices['22'].parallel_with_factory_part,'24');
assert(deck.includes('R24 K_CATH 0 130'));assert(deck.includes('C22 K_CATH 0 250p'));assert(deck.includes('.measure ac I_1K FIND mag(i(VTEST)) AT=1000'));assert(deck.includes('.measure ac I_455K FIND mag(i(VTEST)) AT=455000'));assert(deck.includes('.print ac mag(i(VTEST))'));
const tau=130*250e-12,fc=1/(2*Math.PI*tau);assert(Math.abs(fc-evidence.derived_branch.corner_frequency_hz)<1e-6);assert(Math.abs(fc-4897075.172058318)<1e-6);
const htmlPanel=read('pt44OutputBypassHTML(x=>x)');assert(htmlPanel.includes('#22, 250 pF'));assert(htmlPanel.includes('4.897 MHz'));assert(htmlPanel.includes('#25 and full output model remain open'));
const mutation=vm.runInContext(`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_50L6_CATH'),v=n.factory_members.pop();const bad=!pt44OutputBypassAudit().ok;n.factory_members.push(v);return bad;})()`,ctx);assert(mutation,'bypass audit must reject a missing #22 endpoint');
if(process.argv.includes('--ngspice')){
 const run=spawnSync('ngspice',['--batch',path.join(root,'engineering/PT44_Cathode_Bypass_AC_v36.cir')],{encoding:'utf8'});
 assert.equal(run.status,0,(run.stdout||'')+'\n'+(run.stderr||''));const log=(run.stdout||'')+'\n'+(run.stderr||'');
 const expected=f=>Math.hypot(1/130,2*Math.PI*f*250e-12);
 for(const [label,f] of [['I_1K',1000],['I_455K',455000]]){const m=log.match(new RegExp(label+'\\s*=\\s*([+-]?[0-9.eE+-]+)','i'));assert(m,'ngspice output missing '+label+': '+log);assert(Math.abs(Number(m[1])-expected(f))<2e-7,label+' AC parity');}
}
console.log('PASS v0.36: #22 source trace across #24/B−, two graph memberships, isolated cathode-bypass AC model'+(process.argv.includes('--ngspice')?' executed with ngspice':''));
