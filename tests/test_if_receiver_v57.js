const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),m=require('../engineering/pt44_if_receiver_v57'),s=require('../engineering/PT44_IF_Receiver_Model_V1.json'),a=require('../engineering/PT44_Audio_Power_Model_V1.json'),p=require('../engineering/PT44_Power_Dynamic_Model_V1.json'),d=require('../engineering/PT44_Detector_AVC_Model_V1.json'),g=require('../engineering/PT44_Factory_Transcription_V3.json');
const args=[s,a,p,d,g],out=path.resolve(__dirname,'../tmp/v57');fs.mkdirSync(out,{recursive:true});
const base={duration_s:.003,audio_hz:2000},records={};
function run(name,options={}){const r=m.simulate(...args,{...base,...options});assert(r.max_kcl_residual_a<1e-8);assert(!r.factory_calibrated&&!r.full_receiver_validated);records[name]={parameters:r.parameters,summary:r.summary,initial:r.initial,final:r.final,max_kcl_residual_a:r.max_kcl_residual_a,subdivisions:r.subdivisions};fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(records[name]));console.log('PASS coupled IF solve '+name);return r;}
// Direct manufacturer anchors and an independent slope bound; not factory receiver calibration.
for(const point of s.tube_reference.typical_points){const r=m.tube(s,point.plate_v,100,-3);assert(Math.abs(r.plate_a/point.plate_a-1)<1e-12);assert(Math.abs(r.screen_a/point.screen_a-1)<1e-12);const gm=(m.tube(s,point.plate_v,100,-2.99).plate_a-m.tube(s,point.plate_v,100,-3.01).plate_a)/.02;assert(Math.abs(gm/point.gm_s-1)<.15);}
assert(m.tube(s,100,100,-30).plate_a<m.tube(s,100,100,-3).plate_a*.04);assert.equal(m.tube(s,100,0,0).plate_a,0);
// Wiring mutation, value and input domain rejections.
for(const t of ['V2:6','V2:3','14:sReturn','12:sReturn']){const bad=structuredClone(g);for(const n of bad.factory_nets)n.factory_members=n.factory_members.filter(x=>x!==t);assert.throws(()=>m.configure(s,a,p,d,bad),/topology/);}
for(const options of [{carrier_hz:NaN},{line_v:140},{if1_detune:0},{avc_feedback:'yes'},{input_peak_a:.01},{meter:'fake'},{duration_s:.3},{c8_f:1},{c20_leak_ohm:NaN}])assert.throws(()=>m.configure(...args,options));
// Mutual-inductor stored energy is positive for every supported coupling. The
// independently computed energy derivative equals winding-port power (DC losses excluded).
for(const k of [.005,.02,.08]){const L=s.assumptions.winding_h,M=k*L,i=.001,j=-.0004,di=200,dj=-150,vp=L*di+M*dj,vs=M*di+L*dj;assert(.5*L*(i*i+j*j)+M*i*j>0);const h=1e-9,E=(x,y)=>.5*L*(x*x+y*y)+M*x*y;assert(Math.abs((E(i+h*di,j+h*dj)-E(i-h*di,j-h*dj))/(2*h)-vp*i-vs*j)<1e-12);}
const healthy=run('healthy');assert(healthy.summary.IP.carrier_peak>.2);assert(healthy.summary.speaker_v.audio_peak>.001);assert(healthy.final.x[13]<-.001);
// Supply and screen DC KCL checks against independent closed-form sums.
const x=healthy.initial.x,t=m.tube(s,x[16],x[14],x[15]);assert(Math.abs((x[1]-x[14])/27000-t.screen_a-x[14]/s.assumptions.converter_screen_ohm)<1e-8);assert(Math.abs(x[24]+(x[16]-x[1])*m.configure(...args).lossG+t.plate_a)<1e-8);
const quiet=run('no_signal',{input_peak_a:0});assert(quiet.summary.speaker_v.audio_peak<1e-6);assert(Math.abs(quiet.final.x[13])<1e-5);
const dead=run('if_dead',{if_emission:0});assert(dead.summary.IP.carrier_peak<healthy.summary.IP.carrier_peak*.02);assert(dead.summary.speaker_v.audio_peak<healthy.summary.speaker_v.audio_peak*.02);assert(dead.initial.x[1]>healthy.initial.x[1]);
const screen=run('screen_open',{screen_feed_open:true});assert(screen.initial.if_plate_a<1e-10);assert(screen.summary.speaker_v.audio_peak<healthy.summary.speaker_v.audio_peak*.02);
const detuned=run('if2_detuned',{if2_detune:1.1});assert(detuned.summary.speaker_v.audio_peak<healthy.summary.speaker_v.audio_peak*.6);
const c18=run('c18_open',{c18_scale:0});assert(c18.summary.G.audio_peak<healthy.summary.G.audio_peak*.02);assert(c18.summary.speaker_v.audio_peak<healthy.summary.speaker_v.audio_peak*.03);
const open=run('r17_open',{r17_open:true});// Grid rectification still biases the AVC rail through #12, even with #17 open.
assert(Math.abs(open.final.x[13])<Math.abs(healthy.final.x[13])*.6);assert(open.final.x[13]<0);assert(open.summary.G.audio_peak>healthy.summary.G.audio_peak*.2);
const loaded=run('loaded_grid',{meter:'dmm',probe:'IG'});assert(loaded.summary.IG.carrier_peak<healthy.summary.IG.carrier_peak*.5);
const strong=run('strong',{input_peak_a:.00002});const noAVC=run('strong_no_feedback',{input_peak_a:.00002,avc_feedback:false});assert(Math.abs(strong.final.x[13])>Math.abs(healthy.final.x[13])*3);assert(strong.summary.IG.mean<-.01);assert(Math.abs(noAVC.summary.IG.mean)<.001);assert(strong.summary.if_plate_a.mean<noAVC.summary.if_plate_a.mean);
const fine=run('timestep_192',{samples_per_carrier:192});for(const [k,metric] of [['IP','carrier_peak'],['G','audio_peak'],['speaker_v','audio_peak'],['AVC','mean']])assert(Math.abs(healthy.summary[k][metric]/fine.summary[k][metric]-1)<.06,`Timestep ${k} ${metric}`);
const restored=run('restored');assert.deepEqual(restored.summary,healthy.summary);assert.deepEqual(restored.final,healthy.final);
const artifact={schema:'PT44_IF_RECEIVER_VALIDATION_V1',version:'0.57.0',scope:'Integrated hot DC IF/detector/audio/supply numerical and fault checks, under declared parameters. Does not close full-receiver gates.',cases:records};if(process.argv.includes('--record'))fs.writeFileSync(path.resolve(__dirname,'../engineering/PT44_IF_Receiver_Validation_V1.json'),JSON.stringify(artifact,null,2)+'\n');console.log('PASS v0.57 manufacturer anchors, screen KCL, signal, faults, AVC feedback, probe detuning, timestep and exact restoration');
