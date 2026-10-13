const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Isolated_RC_Faults_V1.json'),'utf8'));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,4);scripts.forEach(x=>new Function(x));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const a=scripts[3].indexOf('function pt44BenchAudit()'),b=scripts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&b>a);vm.runInContext(scripts[3].slice(a,b),ctx);
const read=s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx));
assert.deepEqual(read('PT44_PASSIVE_FAULTS_V1'),fixture);
const audit=read('pt44FaultStudyAudit()');assert(audit.ok,JSON.stringify(audit.issues));
assert.deepEqual(Object.keys(audit.results),['healthy','open18','short18','leak18','drift19']);
for(const scenario of fixture.scenarios)for(const hz of [0,1,10,1000]){
 const p=read('pt44FaultProbe('+JSON.stringify(scenario.id)+','+hz+')');
 const rg=scenario.id==='drift19'?470000:4700000;
 let real=0,imag=2*Math.PI*hz*1e-8;
 if(scenario.id==='open18'){real=0;imag=0}
 if(scenario.id==='short18'){real=100;imag=0}
 if(scenario.id==='leak18')real=1/100000;
 const independent=Math.hypot(real,imag)/Math.hypot(real+1/rg,imag);
 assert(Math.abs(p.amplitude-independent)<3e-12,scenario.id+' @ '+hz+' Hz');
 assert(p.kclResidualAmps<1e-13,scenario.id+' KCL');
 if(scenario.id==='open18')assert.equal(p.model.length,1);
 if(scenario.id==='leak18')assert.equal(p.model.length,3);
}
for(const [label,code] of [
 ['bad leak resistance','(()=>{const d=PT44_PASSIVE_FAULTS_V1.scenarios[3],v=d.example_ohms;d.example_ohms=5e6;const bad=!pt44FaultStudyAudit().ok;d.example_ohms=v;return bad;})()'],
 ['guessed detector diode','(()=>{const d=PT44_BENCH_V1.detector_subdevices.V3.section_D1,v=d.external_net_id;d.external_net_id="F_IF2_SECONDARY_VOL_TOP";const bad=!pt44FaultStudyAudit().ok;d.external_net_id=v;return bad;})()'],
 ['wrong source part','(()=>{const d=PT44_PASSIVE_FAULTS_V1.factory_part_ids,v=d[0];d[0]="20";const bad=!pt44FaultStudyAudit().ok;d[0]=v;return bad;})()']
])assert.equal(vm.runInContext(code,ctx),true,label);
assert.equal(vm.runInContext('Object.isFrozen(PT44_PASSIVE_FAULTS_V1)',ctx),true);
assert.throws(()=>vm.runInContext('pt44FaultProbe("unlisted",1000)',ctx),/Unknown isolated RC failure scenario/);
assert(!fixture.full_receiver_fault_validated&&!fixture.is_factory_failure_measurement&&!fixture.complete_spice_model);
assert(html.includes('BUILD v0.22.0<small>')&&html.includes('<meta name="nsrs-build" content="v0.22.0">'));
console.log('PASS v0.22: five physical RC conditions, 20 AC/DC independent comparisons, KCL, three negative source mutations and watermark');
