const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Isolated_Passive_MNA_V1.json'),'utf8'));
const parts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.equal(parts.length,4);parts.forEach(x=>new Function(x));
const ctx=vm.createContext({console});vm.runInContext(parts[1],ctx);
const a=parts[3].indexOf('function pt44BenchAudit()'),b=parts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&b>a);vm.runInContext(parts[3].slice(a,b),ctx);
const read=x=>JSON.parse(vm.runInContext('JSON.stringify('+x+')',ctx));
assert.deepEqual(read('PT44_PASSIVE_STUDY_V1'),fixture);
const outcome=read('pt44PassiveStudyAudit()');assert(outcome.ok,JSON.stringify(outcome.issues));
assert.deepEqual(read('pt44PassiveComponents()').map(x=>[x.name,x.a,x.b]),[
 ['Philco #15','F_IF2_SECONDARY_VOL_TOP','F_DET_PASSIVE_RETURN'],
 ['Philco #18','F_VOL_WIPER_C18','F_7C6_AUDIO_GRID'],
 ['Philco #19','F_7C6_AUDIO_GRID','F_DET_PASSIVE_RETURN']]);
for(const hz of [0,0.02,0.1,1,2,3.3862753849339435,10,100,1000,10000,455000]){
 const v=read('pt44SolvePassiveNetwork([pt44PassiveComponents()[1],pt44PassiveComponents()[2]],'+hz+',{"F_VOL_WIPER_C18":1,"F_DET_PASSIVE_RETURN":0})');
 const y=v.voltages.F_7C6_AUDIO_GRID,w=2*Math.PI*hz*10e-9*4.7e6;
 assert(Math.hypot(y.re-w*w/(1+w*w),y.im-w/(1+w*w))<2e-12,'complex RC @ '+hz+' Hz');
 assert(v.kclResidualAmps<1e-14,'KCL @ '+hz+' Hz');
}
const cases=[
 '(()=>{const v=PT44_PASSIVE_STUDY_V1.elements[1],o=v.value_si;v.value_si=0.02e-6;const bad=!pt44PassiveStudyAudit().ok;v.value_si=o;return bad;})()',
 '(()=>{const v=PT44_BENCH_V1.detector_subdevices.V3.section_D1,o=v.external_net_id;v.external_net_id="F_IF2_SECONDARY_VOL_TOP";const bad=!pt44PassiveStudyAudit().ok;v.external_net_id=o;return bad;})()',
 '(()=>{const v=PT44_FACTORY_V3.factory_nets.find(n=>n.id==="F_7C6_AUDIO_GRID"),o=v.factory_members[0];v.factory_members[0]="15:a";const bad=!pt44PassiveStudyAudit().ok;v.factory_members[0]=o;return bad;})()',
 '(()=>{const v=PT44_PASSIVE_STUDY_V1.elements[2],o=v.terminals[1];v.terminals[1]="missing";const bad=!pt44PassiveStudyAudit().ok;v.terminals[1]=o;return bad;})()'
];
for(const [i,e] of cases.entries())assert.equal(vm.runInContext(e,ctx),true,'Missed mutation '+i);
assert.equal(vm.runInContext('Object.isFrozen(PT44_PASSIVE_STUDY_V1)',ctx),true);
for(const invalid of ['NaN','Infinity','-1'])assert.throws(()=>vm.runInContext('pt44SolvePassiveNetwork(pt44PassiveComponents(),'+invalid+',{"F_DET_PASSIVE_RETURN":0})',ctx),/Frequency must be nonnegative/);
assert.throws(()=>vm.runInContext('pt44SolvePassiveNetwork([{type:"R",a:"A",b:"B",value:100}],0,{"GROUND":0})',ctx),/singular/i);
assert(html.includes('BUILD v0.21.0<small>')&&html.includes('<meta name="nsrs-build" content="v0.21.0">'));
console.log('PASS v0.21: 11 complex AC results, KCL, 4 mutation checks, invalid frequencies and source-parity watermark');
