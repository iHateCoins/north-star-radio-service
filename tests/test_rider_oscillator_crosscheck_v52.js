const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const cross=read('engineering/PT44_Rider_12_45_Crosscheck_V1.json'),graph=read('engineering/PT44_Factory_Transcription_V3.json'),scope=read('engineering/PT44_Scope_Audit_V1.json');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(cross.sources[1].printed_page,'12-45');assert.equal(cross.sources[1].pdf_page,45);
assert.deepEqual(graph.factory_nets.find(x=>x.id==='F_OSC_ANODE_RIGHT_WINDING').factory_members,['10:secondary_a','V1:3']);
assert.equal(scope.baseline.component_terminal_reference_coverage_percent,98.8);
assert.deepEqual(scope.subsystems.find(x=>x.id==='RF').unrepresented_terminals,['10:secondary_b']);
const ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);const a=scripts[3].indexOf('function pt44BenchAudit()'),b=scripts[3].indexOf('function renderFactoryLedger(box){');vm.runInContext(scripts[3].slice(a,b),ctx);
const inspect=x=>JSON.parse(vm.runInContext('JSON.stringify('+x+')',ctx));assert.deepEqual(inspect('PT44_RIDER_12_45_CROSSCHECK_V1'),cross);assert(inspect('pt44RiderCrosscheckAudit()').ok);assert(inspect('pt44SchematicTraceAudit()').ok);
for(const [label,expression] of [
 ['missing upper winding end',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_OSC_ANODE_RIGHT_WINDING'),i=n.factory_members.indexOf('10:secondary_a'),v=n.factory_members.splice(i,1)[0],bad=!pt44RiderCrosscheckAudit().ok;n.factory_members.splice(i,0,v);return bad;})()`],
 ['invented lower winding end',`(()=>{const n=PT44_FACTORY_V3.factory_nets.find(x=>x.id==='F_BMINUS');n.factory_members.push('10:secondary_b');const bad=!pt44RiderCrosscheckAudit().ok;n.factory_members.pop();return bad;})()`],
 ['premature gate',`(()=>{const c=PT44_FACTORY_V3.checks;c.factory_wiring_fully_transcribed=true;const bad=!pt44RiderCrosscheckAudit().ok;c.factory_wiring_fully_transcribed=false;return bad;})()`]
])assert.equal(vm.runInContext(expression,ctx),true,label);
console.log('PASS Rider XII 12-45: upper #10 winding to V1:3 source traced; lower winding and gate stay open');
