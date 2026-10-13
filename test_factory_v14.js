const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dir=__dirname, raw=fs.readFileSync(dir+'/North_Star_Radio_Service_v0_14_PT44.html','utf8');
const scripts=[...raw.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
for(const [i,src] of scripts.entries()){try{new Function(src)}catch(e){throw new Error('script '+i+': '+e.message)}}
const ctx=vm.createContext({console,module:{exports:{}}});vm.runInContext(scripts[1],ctx);
const begin=scripts[3].indexOf("function factoryV3Audit(){"),end=scripts[3].indexOf("function renderFactoryLedger(box)");
assert(begin>=0 && end>begin);vm.runInContext(scripts[3].slice(begin,end),ctx);
const ref=JSON.parse(fs.readFileSync(dir+'/PT44_Factory_Transcription_V3.json','utf8'));
const embedded=JSON.parse(vm.runInContext('JSON.stringify(PT44_FACTORY_V3)',ctx));
assert.deepStrictEqual(embedded,ref);
const audit=JSON.parse(vm.runInContext('JSON.stringify(factoryV3Audit())',ctx));
assert.deepStrictEqual(audit.issues,[]);
assert.equal(audit.parts,33);assert.equal(audit.sourceNets,16);assert.equal(audit.tracedTerminals,39);
assert.equal(audit.benchmarkReady,false);
assert.equal(audit.unknownConnections.length,6);
assert.deepStrictEqual(Object.keys(audit.stages).sort(),['Audio','Heaters','IF (partial)','Output','Power','Return']);
assert(ref.factory_components['29A'].category==='capacitor');
assert(ref.factory_components['29B'].category==='capacitor');
assert(ref.factory_components['28'].category==='field_coil');
const heaterChains=ref.factory_nets.filter(n=>n.stage==='Heaters');
assert.equal(heaterChains.length,4);
assert(heaterChains.some(n=>n.factory_members.includes('V4:7')&&n.factory_members.includes('V1:1')));
for(const c of Object.values(ref.factory_components)){
 assert.equal(c.source_page,38);
 assert.equal(c.geometry_certified,false);
}
let test=vm.runInContext(`(()=>{
 calibrate();
 let good=0;for(let i=0;i<30;i++){
 const r=newRadio(),d=settle(r),s=sigPath(r,d);
 if(d.lit&&d.V.every(Number.isFinite)&&Number.isFinite(s.hum)&&Number.isFinite(s.loud))good++;
 }
 return good;
})()`,ctx);
assert.equal(test,30);
// Negative tests: ensure graph checker rejects unsourced component and terminal assignments.
const tamper=vm.runInContext(`(()=>{
 const a=PT44_FACTORY_V3.factory_nets[0].factory_members;
 a.push('999:a');const unknown=factoryV3Audit().issues.some(x=>x.includes('factory part/tube not declared'));
 a.pop(); a.push('28:fantasy');const badPin=factoryV3Audit().issues.some(x=>x.includes('terminal not declared'));
 a.pop();return {unknown,badPin};})()`,ctx);
assert(tamper.unknown&&tamper.badPin);
const oldAudit=vm.runInContext('pt44FactorySubgraphAudit()',ctx);assert(oldAudit.ok);
console.log(JSON.stringify({result:'PASS',factoryComponents:audit.parts,sourceNetworks:audit.sourceNets,knownTerminalRefs:audit.tracedTerminals,remainingPhase1Blockers:audit.unknownConnections.length,benchmarkReady:false,reducedOrderGoodSamples:test,negativeChecks:tamper},null,2));
