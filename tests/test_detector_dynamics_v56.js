const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),model=require('../engineering/pt44_detector_avc_v56'),spec=require('../engineering/PT44_Detector_AVC_Model_V1.json'),graph=require('../engineering/PT44_Factory_Transcription_V3.json');
const clone=x=>structuredClone(x),close=(a,b,t,message)=>assert(Math.abs(a-b)<=t,`${message}: ${a} vs ${b}`),records={};
function run(name,options={}){const r=model.simulate(spec,graph,options);records[name]={parameters:r.parameters,summary:r.summary,at_off:r.at_off.x,final:r.final.x,steps:r.steps,max_kcl_residual_a:r.max_kcl_residual_a};assert(r.max_kcl_residual_a<1e-10);assert(!r.full_receiver_validated);assert(!r.factory_calibrated);assert(r.samples.every(s=>s.x.every(Number.isFinite)));return r;}
assert(model.validate(spec,graph));
// Independent source-topology expectations: neither diode is silently assigned to a socket pin.
const expected={'14:sDetector':'F_IF2_AVC_FEED','17:a':'F_IF2_AVC_FEED','17:b':'F_AVC_RETURN','8:b':'F_AVC_RETURN','7:b':'F_AVC_RETURN','7:a':'F_BMINUS','8:a':'F_BMINUS','14:sReturn':'F_IF2_SECONDARY_VOL_TOP','16:a':'F_IF2_SECONDARY_VOL_TOP','15:a':'F_IF2_SECONDARY_VOL_TOP','V3:7':'F_BMINUS'};
for(const [t,n] of Object.entries(expected))assert.equal(graph.factory_nets.find(n=>n.factory_members.includes(t)).id,n);
assert.equal(spec.diode_ports.socket_pins,null);
let bad=clone(graph);bad.factory_nets.find(n=>n.id==='F_AVC_RETURN').factory_members=bad.factory_nets.find(n=>n.id==='F_AVC_RETURN').factory_members.filter(t=>t!=='17:b');bad.factory_nets.find(n=>n.id==='F_BMINUS').factory_members.push('17:b');assert.throws(()=>model.validate(spec,bad),/topology/);
for(const edit of [s=>s.factory_parameters.r17_ohm=1e6,s=>s.diode_ports.socket_pins=[5,6],s=>s.acceptance.benchmark_ready=true]){bad=clone(spec);edit(bad);assert.throws(()=>model.validate(bad,graph));}
for(const p of [{source_ohm:0},{c8_f:1e-6},{modulation:1.1},{amplitude_v:NaN},{samples_per_carrier:20},{release_dt_s:0},{duration_s:0},{meter:'oops'},{probe:'chassis'},{audio_hz:100},{on_until_s:.001},{audio_hz:400,on_until_s:.004},{r17_open:1},{injected:1}])assert.throws(()=>model.configure(spec,graph,p));
// Zero signal is an exact zero solution. Independent diode law and derivative checks.
const quiet=run('no_signal',{amplitude_v:0});assert(quiet.final.x.every(x=>x===0));
close(model.diode(4,1e-4).current_a,.0008,1e-15,'space-charge current');assert.equal(model.diode(-5,1e-4).current_a,0);close(model.diode(4,1e-4).conductance_s,.0003,1e-15,'diode slope');
// Isolate #7/#8 with #17 open: negative AVC decay must equal the closed-form BE RC solution.
const c=model.configure(spec,graph,{r17_open:true}),dt=1e-4;let x=[0,0,-1,0,0];for(let i=1;i<=100;i++)x=model.step(c,x,i*dt,dt,false).x;
close(x[2],-Math.pow(1+dt/(4.7e6*.05e-6),-100),1e-10,'isolated AVC RC release');
const healthy=run('healthy');assert(healthy.summary.H.mean_v<-.5);assert(healthy.summary.G.audio_peak_v>.2);assert(healthy.at_off.x[2]<-.02);assert(Math.abs(healthy.final.x[2])<Math.abs(healthy.at_off.x[2]));
const upper=run('upper_dead',{upper_emission:0});assert(upper.summary.G.audio_peak_v<healthy.summary.G.audio_peak_v*.1);
const open=run('r17_open',{r17_open:true});close(open.at_off.x[2],0,1e-12,'open AVC feed');assert(open.summary.G.audio_peak_v>healthy.summary.G.audio_peak_v*.9);
const short=run('avc_short',{avc_short:true});assert(Math.abs(short.at_off.x[2])<1e-5);
const coupling=run('c18_open',{c18_scale:0});assert(coupling.summary.G.audio_peak_v<1e-12);
const bypass=run('c15_open',{c15_scale:0});assert(Math.abs(bypass.summary.H.audio_peak_v-healthy.summary.H.audio_peak_v)>.001);
const weak=run('weak_signal',{amplitude_v:.2}),strong=run('strong_signal',{amplitude_v:5});assert(weak.summary.G.audio_peak_v<healthy.summary.G.audio_peak_v);assert(strong.summary.G.audio_peak_v>healthy.summary.G.audio_peak_v);assert(strong.at_off.x[2]<healthy.at_off.x[2]);
const mute=run('volume_zero',{volume:0});assert(mute.summary.G.audio_peak_v<1e-4);
const variant=run('c8_parts_list',{c8_f:.1e-6});assert(Math.abs(variant.at_off.x[2])<Math.abs(healthy.at_off.x[2])*.6);
const loaded=run('service_avc',{meter:'service'});assert(Math.abs(loaded.at_off.x[2])<Math.abs(healthy.at_off.x[2])*.1);
const grid=run('service_grid',{meter:'service',probe:'G'});assert(grid.summary.G.audio_peak_v<healthy.summary.G.audio_peak_v*.8);
const lower=run('lower_dead',{lower_emission:0});assert(lower.at_off.x[2]<0); // Negative AVC does not forward-bias this diode.
const noMod=run('no_modulation',{modulation:0});assert(noMod.summary.H.audio_peak_v<healthy.summary.H.audio_peak_v*.03);
const low=run('audio_400',{audio_hz:400}),high=run('audio_2000',{audio_hz:2000});assert(low.summary.G.audio_peak_v>0&&high.summary.G.audio_peak_v>0);
const coarse=run('carrier_24',{samples_per_carrier:24}),fine=run('carrier_96',{samples_per_carrier:96});
for(const k of ['H','G']){const e48=Math.abs(healthy.summary[k].audio_peak_v-fine.summary[k].audio_peak_v),e24=Math.abs(coarse.summary[k].audio_peak_v-fine.summary[k].audio_peak_v);assert(e24/fine.summary[k].audio_peak_v<.01);assert(e48/fine.summary[k].audio_peak_v<.01);assert(Math.abs(healthy.summary[k].mean_v-fine.summary[k].mean_v)<Math.abs(coarse.summary[k].mean_v-fine.summary[k].mean_v));}
const release=run('release_refined',{release_dt_s:5e-6});close(release.final.x[2],healthy.final.x[2],1e-6,'release step refinement');
const repaired=run('restored');assert.deepEqual(repaired.summary,healthy.summary);assert.deepEqual(repaired.final,healthy.final);
// Browser embeds the exact canonical functions and must produce the same deterministic result.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=html.split('// BEGIN PT44_DETECTOR_AVC_V56\n')[1].split('// END PT44_DETECTOR_AVC_V56')[0];assert.equal(source,fs.readFileSync(path.join(root,'engineering/pt44_detector_avc_v56.js'),'utf8'));
const ctx=vm.createContext({});vm.runInContext(source,ctx);ctx.s=spec;ctx.g=graph;const browser=vm.runInContext('pt44DetectorSimulate(s,g,{amplitude_v:0})',ctx);assert.equal(JSON.stringify(browser.summary),JSON.stringify(quiet.summary));
assert.equal(fs.readFileSync(path.join(root,'engineering/PT44_Detector_AVC_v56.cir'),'utf8'),model.spiceDeck(spec,graph));
if(process.argv.includes('--record'))fs.writeFileSync(path.join(root,'engineering/PT44_Detector_AVC_Validation_V1.json'),JSON.stringify({schema:'PT44_DETECTOR_AVC_VALIDATION_V1',version:'0.56.0',scope:'Numerical/functional validation under explicit detector/source assumptions; not full receiver or factory calibration.',scenarios:records,closed_form_release_checked:true,browser_node_identity_checked:true},null,2)+'\n');
console.log(`PASS v0.56 detector: ${Object.keys(records).length} signal/fault/loading/variant/convergence scenarios, source mutations, analytic RC and browser identity`);
