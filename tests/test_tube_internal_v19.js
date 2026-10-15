const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Tube_Internal_Topology_V1.json'),'utf8'));
const bench=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Factory_Measurement_and_Detector_V1.json'),'utf8'));
const cases=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Documented_Continuity_V1.json'),'utf8'));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.equal(scripts.length,4);scripts.forEach(s=>new Function(s));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const a=scripts[3].indexOf('function pt44BenchAudit()'),b=scripts[3].indexOf('function renderFactoryLedger(box){');
assert(a>=0&&b>a);vm.runInContext(scripts[3].slice(a,b),ctx);
const evalJSON=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));
assert.deepEqual(evalJSON('PT44_TUBE_INTERNAL_V1'),fixture);
assert.deepEqual(evalJSON('PT44_BENCH_V1'),bench);
assert.deepEqual(evalJSON('PT44_CONTINUITY_V1'),cases);
for(const fn of ['pt44BenchAudit','pt44InternalAudit','pt44ContinuityAudit'])assert(evalJSON(fn+'()').ok,fn+' failed');
const result=evalJSON('pt44ContinuityQuery("V3:4","V3:7")');
assert.equal(result.kind,'tube_internal_connection');assert.equal(result.ohms,0);
assert.deepEqual(result.path.map(e=>e.id),['V3:CATHODE_BOND']);
for(const endpoints of [['V3:5','V3:7'],['V3:6','V3:7'],['V3:4','__CHASSIS__']]){
 const statement='pt44ContinuityQuery('+JSON.stringify(endpoints[0])+','+JSON.stringify(endpoints[1])+')';
 assert.equal(evalJSON(statement).kind,'untraced',statement);
}
assert.equal(evalJSON('pt44ContinuityQuery("V3:7","29A:b")').kind,'same_wire_net');
assert(evalJSON('pt44ContinuityAudit()').total>=17);
const mutations=[
 {expr:'PT44_TUBE_INTERNAL_V1.certified_metallic_links[0]',key:'to',wrong:'V3:5'},
 {expr:'PT44_TUBE_INTERNAL_V1.certified_metallic_links[0]',key:'ohms',wrong:40},
 {expr:'PT44_TUBE_INTERNAL_V1.active_sections[0]',key:'cathode',wrong:'V3:5'},
 {expr:'PT44_TUBE_INTERNAL_V1.active_sections[0]',key:'external_anode_net_verified',wrong:true},
 {expr:'PT44_TUBE_INTERNAL_V1.acceptance',key:'chassis_return_confirmed',wrong:true},
 {expr:'PT44_BENCH_V1.detector_subdevices.V3',key:'cathode_pin_internal_equivalence_source_confirmed',wrong:false}
];
for(const [i,m] of mutations.entries()){
 const expression='(()=>{const d='+m.expr+',old=d['+JSON.stringify(m.key)+'];d['+JSON.stringify(m.key)+']='+JSON.stringify(m.wrong)+';const failed=!pt44InternalAudit().ok;d['+JSON.stringify(m.key)+']=old;return failed;})()';
 assert.equal(vm.runInContext(expression,ctx),true,'Undetected mutation '+i);
}
const spice=fs.readFileSync(path.join(root,'engineering/PT44_7C6_Cathode_Bond_DRAFT.cir'),'utf8');
assert(spice.includes('V7C6_CATHODE_BOND V3_K4 V3_K7 DC 0'));
const build=html.match(/<meta name="nsrs-build" content="(v\d+\.\d+\.\d+)">/); assert(build&&html.includes('BUILD '+build[1]));
console.log('PASS 7C6 internal link, two isolated diode plates, source fixture parity, six negative mutations, and build watermark');
