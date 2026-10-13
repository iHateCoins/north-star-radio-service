const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const graph=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Factory_Transcription_V3.json')));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Detector_Audio_Trace_Evidence_V1.json')));
const continuity=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Documented_Continuity_V1.json')));
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length,4);scripts.forEach(s=>new Function(s));
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);
const a=scripts[3].indexOf('function pt44BenchAudit()'),b=scripts[3].indexOf('function renderFactoryLedger(box){');assert(a>=0&&b>a);vm.runInContext(scripts[3].slice(a,b),ctx);
const inspect=src=>JSON.parse(vm.runInContext('JSON.stringify('+src+')',ctx));
assert.deepEqual(inspect('PT44_FACTORY_V3'),graph);assert.deepEqual(inspect('PT44_CONTINUITY_V1'),continuity);assert.deepEqual(inspect('PT44_DETECTOR_TRACE_V1'),evidence);
const audit=inspect('pt44DetectorTraceAudit()'),test=inspect('pt44ContinuityAudit()');assert(audit.ok,JSON.stringify(audit.errors));assert.equal(audit.tracedGroups,4);assert.equal(audit.certifiedTerminals,11);
assert(test.ok,JSON.stringify(test.issues));assert.equal(test.total,26);assert.equal(test.passed,26);assert.equal(test.wireGroups,22);
for(const [a,b] of [['14:sReturn','16:a'],['15:a','16:a'],['16:wiper','18:a'],['18:b','V3:3'],['19:a','V3:3'],['15:b','19:b']]){const q=inspect('pt44ContinuityQuery('+JSON.stringify(a)+','+JSON.stringify(b)+')');assert.equal(q.kind,'same_wire_net',a+' '+b)}
for(const [a,b] of [['14:sDetector','V3:5'],['14:sDetector','V3:6'],['18:a','18:b'],['V3:3','V3:7'],['15:b','__CHASSIS__']]){const q=inspect('pt44ContinuityQuery('+JSON.stringify(a)+','+JSON.stringify(b)+')');assert.equal(q.kind,'untraced',a+' '+b)}
const injected=vm.runInContext(`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_VOL_WIPER_C18');const prev=n.factory_members[1];n.factory_members[1]='17:b';const caught=!pt44DetectorTraceAudit().ok;n.factory_members[1]=prev;return caught;})()`,ctx);assert(injected);
assert(!graph.checks.benchmark_ready);const semanticBuild=html.match(/<meta name="nsrs-build" content="(v\d+\.\d+\.\d+)">/); assert(semanticBuild&&html.includes('BUILD '+semanticBuild[1]+'<small>'));
const spice=fs.readFileSync(path.join(root,'engineering/PT44_Detector_Passive_Subcircuit_DRAFT.cir'),'utf8');assert(spice.includes('C15_BYPASS VOL_TOP PASSIVE_RETURN 250p'));assert(spice.includes('C18_AUDIO WIPER AUDIO_GRID 10n'));assert(spice.includes('R19_GRID_LEAK AUDIO_GRID PASSIVE_RETURN 4.7Meg'));
console.log('PASS: 4 native 300dpi documented detector nets, 11 terminals, 26 continuity tests, source claim mutation, SPICE passive draft and watermark');
