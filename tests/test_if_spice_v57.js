if(!process.argv.includes('--ngspice')){console.log('SKIP v0.57 ngspice (use --ngspice)');process.exit(0);}
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process'),readline=require('node:readline'),m=require('../engineering/pt44_if_receiver_v57'),s=require('../engineering/PT44_IF_Receiver_Model_V1.json'),a=require('../engineering/PT44_Audio_Power_Model_V1.json'),p=require('../engineering/PT44_Power_Dynamic_Model_V1.json'),d=require('../engineering/PT44_Detector_AVC_Model_V1.json'),g=require('../engineering/PT44_Factory_Transcription_V3.json'),out=path.resolve(__dirname,'../tmp/v57/spice');fs.mkdirSync(out,{recursive:true});
const keys=['B','S','AVC','IG','IP','H','G','P','T','speaker_v'];
async function measure(file,params){
 let prev=null,T=0;const rows=[],from=params.duration_s-4/params.audio_hz,to=params.duration_s;
 for await(const line of readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity})){
  const v=line.trim().split(/\s+/).map(Number);if(v.length!==11||!v.every(Number.isFinite))continue;
  if(prev){const lo=Math.max(from,prev[0]),hi=Math.min(to,v[0]);if(hi>lo){const at=t=>[t,...keys.map((_,i)=>prev[i+1]+(v[i+1]-prev[i+1])*(t-prev[0])/(v[0]-prev[0]))];rows.push([at(lo),at(hi)]);T+=hi-lo;}}prev=v;
 }
 assert(Math.abs(T-4/params.audio_hz)<1e-10);
 return Object.fromEntries(keys.map((k,i)=>{
  let area=0;for(const [u,v] of rows)area+=(u[i+1]+v[i+1])*(v[0]-u[0])/2;const mean=area/T,amp=f=>{let sine=0,cosine=0;for(const [u,v] of rows){const dt=v[0]-u[0],a=u[i+1]-mean,b=v[i+1]-mean;sine+=(a*Math.sin(2*Math.PI*f*u[0])+b*Math.sin(2*Math.PI*f*v[0]))*dt/2;cosine+=(a*Math.cos(2*Math.PI*f*u[0])+b*Math.cos(2*Math.PI*f*v[0]))*dt/2;}return 2*Math.hypot(sine,cosine)/T;};return [k,{mean,audio_peak:amp(params.audio_hz),carrier_peak:amp(params.carrier_hz)}];
 }));
}
(async()=>{const cases={healthy:{},if_dead:{if_emission:0},loaded_grid:{meter:'dmm',probe:'IG'},c20_leak:{c20_leak_ohm:2e6,samples_per_carrier:192}},records={};for(const [name,options] of Object.entries(cases)){
 const opts={duration_s:.003,audio_hz:2000,...options},js=m.simulate(s,a,p,d,g,opts);
 const data=path.join(out,name+'.dat'),file=path.join(out,name+'.cir'),deck=m.spiceDeck(s,a,p,d,g,opts).replace(/\.print tran .*/,`.control\nset wr_singlescale\nset wr_vecnames\nrun\nwrdata ${data} v(N_BPLUS_FILT) v(S) v(AVC) v(IG) v(IP) v(H) v(G) v(P) v(T) v(SPEAKER)\nquit\n.endc`);
 {fs.writeFileSync(file,deck);const run=cp.spawnSync(process.env.NGSPICE_BIN||'ngspice',['-b',file],{encoding:'utf8',timeout:300000,maxBuffer:3e6});fs.writeFileSync(path.join(out,name+'.log'),(run.stdout||'')+(run.stderr||''));assert.equal(run.status,0,run.error?.message||run.stderr);}
 const spice=await measure(data,js.parameters),checks=[];for(const [node,metric] of [['B','mean'],['S','mean'],['AVC','mean'],['IG','carrier_peak'],['IP','carrier_peak'],['H','audio_peak'],['G','audio_peak'],['P','audio_peak'],['speaker_v','audio_peak']]){const u=js.summary[node][metric],v=spice[node][metric],tolerance=.04*Math.abs(v)+(['B','S'].includes(node)?.002:.00005);assert(Math.abs(u-v)<=tolerance,`${name} ${node} ${metric}: JS=${u}, SPICE=${v}, tolerance=${tolerance}`);checks.push({node,metric,javascript:u,ngspice:v,absolute_error:Math.abs(u-v),tolerance});}records[name]={parameters:js.parameters,checks};console.log('PASS independent ngspice coupled IF '+name);
 }
 if(process.argv.includes('--record'))fs.writeFileSync(path.resolve(__dirname,'../engineering/PT44_IF_Receiver_Spice_Validation_V1.json'),JSON.stringify({schema:'PT44_IF_RECEIVER_SPICE_VALIDATION_V1',version:'0.57.0',scope:'Independent circuit execution checks numerical implementation under declared parameters, not factory calibration.',cases:records},null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1);});
