if(!process.argv.includes('--ngspice')){console.log('SKIP detector ngspice execution (run --ngspice)');process.exit(0);}
// Independent ngspice execution of the exported nodal circuit, not a second call to the JS solver.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process'),readline=require('node:readline');
const model=require('../engineering/pt44_detector_avc_v56'),spec=require('../engineering/PT44_Detector_AVC_Model_V1.json'),graph=require('../engineering/PT44_Factory_Transcription_V3.json'),out=path.resolve(__dirname,'../tmp/v56/spice');fs.mkdirSync(out,{recursive:true});
async function measurements(file,p){
 const input=readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity});let prev=null,area=Array(5).fill(0),sine=Array(5).fill(0),cosine=Array(5).fill(0),T=0,atOff=null,final=null;const from=p.on_until_s-4/p.audio_hz,w=2*Math.PI*p.audio_hz;
 for await(const line of input){const a=line.trim().split(/\s+/).map(Number);if(a.length!==6||!a.every(Number.isFinite))continue;final=a;if(a[0]<=p.on_until_s+1e-12)atOff=a;
  if(prev&&prev[0]>=from&&a[0]<=p.on_until_s){const dt=a[0]-prev[0];T+=dt;for(let k=0;k<5;k++){area[k]+=(prev[k+1]+a[k+1])*dt/2;sine[k]+=(prev[k+1]*Math.sin(w*prev[0])+a[k+1]*Math.sin(w*a[0]))*dt/2;cosine[k]+=(prev[k+1]*Math.cos(w*prev[0])+a[k+1]*Math.cos(w*a[0]))*dt/2;}}
  prev=a;
 }
 assert(T>3.9/p.audio_hz);return {mean:area.map(a=>a/T),fundamental:sine.map((a,k)=>2*Math.hypot(a,cosine[k])/T),at_off:atOff.slice(1),final:final.slice(1)};
}
(async()=>{const records={};for(const [name,options] of Object.entries({healthy:{},upper_dead:{upper_emission:0},loaded_avc:{meter:'service'},c8_parts_list:{c8_f:.1e-6}})){
 const js=model.simulate(spec,graph,options),data=path.join(out,name+'.dat'),deck=model.spiceDeck(spec,graph,options).replace('.print tran V(U) V(H) V(A) V(W) V(G)',`.control\nset wr_singlescale\nset wr_vecnames\nrun\nwrdata ${data} v(U) v(H) v(A) v(W) v(G)\nquit\n.endc`),file=path.join(out,name+'.cir');fs.writeFileSync(file,deck);
 const result=cp.spawnSync(process.env.NGSPICE_BIN||'ngspice',['-b',file],{encoding:'utf8',timeout:180000,maxBuffer:2e6});fs.writeFileSync(path.join(out,name+'.log'),(result.stdout||'')+(result.stderr||''));assert.equal(result.status,0,result.error?.message||result.stderr);assert(fs.existsSync(data),'ngspice produced no measurements');
 const spice=await measurements(data,js.parameters),checks=[];for(const [k,node] of [[1,'H'],[2,'A'],[4,'G']]){
  for(const [metric,a,b,floor] of [['mean',js.summary[node].mean_v,spice.mean[k],.0001],['audio',js.summary[node].audio_peak_v,spice.fundamental[k],.0001]]){const tolerance=.02*Math.max(Math.abs(b),floor)+.00005,error=Math.abs(a-b);assert(error<=tolerance,`${name} ${node} ${metric}: JS ${a}, SPICE ${b}, tolerance ${tolerance}`);checks.push({node,metric,javascript:a,ngspice:b,absolute_error:error,tolerance});}
 }
 for(const [metric,a,b] of [['AVC_at_off',js.at_off.x[2],spice.at_off[2]],['AVC_after_release',js.final.x[2],spice.final[2]]]){const tolerance=.01*Math.max(Math.abs(b),.0001)+.00005;assert(Math.abs(a-b)<=tolerance,`${name} ${metric} ${a} ${b}`);checks.push({metric,javascript:a,ngspice:b,absolute_error:Math.abs(a-b),tolerance});}
 records[name]={parameters:js.parameters,checks};fs.unlinkSync(data);console.log('PASS ngspice detector '+name);
 }
 const artifact={schema:'PT44_DETECTOR_AVC_SPICE_VALIDATION_V1',version:'0.56.0',scope:'Numerical parity for the declared diode/source circuit. Does not validate assumed parameters or a complete receiver.',ngspice_version:(cp.spawnSync(process.env.NGSPICE_BIN||'ngspice',['--version'],{encoding:'utf8'}).stdout||'').trim().split('\n').find(s=>s.includes('ngspice-')),cases:records};
 if(process.argv.includes('--record'))fs.writeFileSync(path.resolve(__dirname,'../engineering/PT44_Detector_AVC_Spice_Validation_V1.json'),JSON.stringify(artifact,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1);});
