const fs=require('fs'),vm=require('vm'),assert=require('assert');
const text=fs.readFileSync(__dirname+'/North_Star_Radio_Service_v0_14_PT44.html','utf8');
const scripts=[...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const ctx=vm.createContext({console,module:{exports:{}}});vm.runInContext(scripts[1],ctx);
const scope=(net,a,b)=>vm.runInContext(`pt44FactoryContactScope(${JSON.stringify(net)},${JSON.stringify(a)},${JSON.stringify(b)})`,ctx);
let cases=[
 ['HEATER','V5:8','V4:2',true],
 ['HEATER','V1:8','V2:1',true],
 ['HEATER','V5:8','V3:8',false],
 ['G5','C3:b','G5',true],
 ['G5','R5:a','G5',false],
 ['G5','C3:b','P6',false],
 ['OSC','R6:a','OSC',false],
 ['B1','V5:7','B1',true],
 ['B2','V1:3','B2',false],
 ['P6','V3:2','P6',true],
 ['GND','R2:b','G4',true],
 ['GND','R6:b','G1',false]
];
for(const [net,a,b,expected] of cases)assert.strictEqual(scope(net,a,b),expected,`${net} ${a} → ${b}`);
assert(text.includes('id="bSourceScope"'));
assert(text.includes('B3.sourceScope(!!R.sourceScope)'));
const ref=JSON.parse(fs.readFileSync(__dirname+'/PT44_Factory_Transcription_V3.json','utf8'));
assert.equal(ref.checks.benchmark_ready,false);
const netlist=fs.readFileSync(__dirname+'/PT44_Factory_Passive_Subcircuit_DRAFT.cir','utf8');
for(const n of ['R28_DC_ONLY','C29A','C29B','C20','R21','R23','R24'])assert(netlist.includes(n+' '));
assert(netlist.includes('NOT an operational radio'));
console.log(JSON.stringify({result:'PASS',evidenceFilterCases:cases.length,partialSpiceDevices:7,benchmarkReady:false},null,2));
