const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const spec=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Spice_Export_Policy_V1.json'),'utf8'));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.equal(scripts.length,4);scripts.forEach(x=>new Function(x));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const a=scripts[3].indexOf('function pt44BenchAudit()'),b=scripts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&b>a);vm.runInContext(scripts[3].slice(a,b),ctx);
const read=e=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',ctx));
const traceAt=scripts[3].indexOf('const PT44_DETECTOR_TRACE_V1 = Object.freeze('),traceStart=scripts[3].indexOf('(',traceAt)+1,traceEnd=scripts[3].indexOf(');',traceStart);const detectorTrace=JSON.parse(scripts[3].slice(traceStart,traceEnd));
assert.equal(detectorTrace.verified_schematic_symbol_connections[0].socket_pin_number,null);assert.deepEqual(detectorTrace.verified_schematic_symbol_connections[0].source_terminals,['14:sDetector','17:a']);assert(detectorTrace.unresolved.some(x=>x.includes('pin (#5 or #6)')));
assert.deepEqual(read('PT44_SPICE_EXPORT_V1'),spec);
const report=read('pt44SpiceExportAudit()');assert(report.ok,JSON.stringify(report.issues));
const deck=report.deck; assert.equal(deck,fs.readFileSync(path.join(root,'engineering/PT44_Factory_Generated_Spice_v23.cir'),'utf8'),'Checked-in SPICE draft differs from game-generated source deck'); const instances=deck.trim().split('\n').filter(x=>/^[CR]\d+\s|^R28_DCR\s|^R30_/.test(x));
assert.equal(instances.length,6);
for(const [part,first] of [['C15','N_IF2_SECONDARY_VOL_TOP'],['C18','N_VOL_WIPER_C18'],['R19','N_7C6_AUDIO_GRID']]){
 const line=instances.find(x=>x.startsWith(part+' '));assert(line&&line.split(' ')[1]===first);
}
for(const line of ['C15 N_IF2_SECONDARY_VOL_TOP N_BMINUS 250p','C18 N_VOL_WIPER_C18 N_7C6_AUDIO_GRID 10n','R19 N_7C6_AUDIO_GRID N_BMINUS 4.7Meg','R28_DCR N_FIELD_A N_FIELD_B 500','R30_40 N_R30_ENDA N_R30_TAP 40','R30_80 N_R30_TAP N_R30_ENDB 80','VRETURN N_BMINUS 0 DC 0','VWIPER N_VOL_WIPER_C18 N_BMINUS DC 0 AC 1']){
 assert(deck.includes(line),line);
}
assert(deck.endsWith('.end\n')&&deck.includes('.ac dec 60 0.1 1000000')&&deck.includes('.print ac vm(N_7C6_AUDIO_GRID)'));
assert.equal(spec.isolation_and_unknowns.passive_deck_ngspice_validated,true);assert.equal(spec.spice_engine_validated,false);assert.equal(spec.benchmark_ready,false);
for(const [label,expr] of [
 ['wrong #15 capacitance','(()=>{const x=PT44_PASSIVE_STUDY_V1.elements[0],v=x.value_si;x.value_si=100e-12;const bad=!pt44SpiceExportAudit().ok;x.value_si=v;return bad;})()'],
 ['crossed factory grid wire','(()=>{const x=PT44_FACTORY_V3.factory_nets.find(n=>n.id==="F_7C6_AUDIO_GRID"),v=x.factory_members[0];x.factory_members[0]="V3:5";const bad=!pt44SpiceExportAudit().ok;x.factory_members[0]=v;return bad;})()'],
 ['untraced field-coil endpoint','(()=>{const x=PT44_FACTORY_V3.factory_nets.find(n=>n.id==="F_BPLUS_RECT"),i=x.factory_members.indexOf("28:a"),v=x.factory_members[i];x.factory_members[i]="28:b";const bad=!pt44SpiceExportAudit().ok;x.factory_members[i]=v;return bad;})()'],
 ['incorrect lamp shunt','(()=>{const x=PT44_PASSIVE_V1.devices["30"].lamp_shunt,v=x.parallel_to_section;x.parallel_to_section="R30_80";const bad=!pt44SpiceExportAudit().ok;x.parallel_to_section=v;return bad;})()']
])assert.equal(vm.runInContext(expr,ctx),true,label);
assert(html.includes('BUILD v0.55.0<small>'));
console.log('PASS v0.35: 6 factory-driven SPICE passives, isolated AC deck, 4 unsafe source mutation checks, watermark');
