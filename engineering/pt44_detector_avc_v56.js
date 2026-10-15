// Carrier-resolved 7C6 detector/AVC subset; symbol ports do not assign physical diode pins.
// Factory passives/topology are checked separately from the explicitly assumed tube/source laws.
function pt44DetectorValidate(spec,graph){
 const membership=new Map();for(const n of graph.factory_nets)for(const t of n.factory_members){if(membership.has(t))throw Error('Duplicate factory terminal '+t);membership.set(t,n.id);}
 for(const [t,n] of Object.entries(spec.factory_terminal_nets))if(membership.get(t)!==n)throw Error('Detector topology mismatch '+t);
 const expected={r7_ohm:4.7e6,r17_ohm:4.7e6,c15_f:250e-12,c18_f:10e-9,r19_ohm:4.7e6};for(const [k,v] of Object.entries(expected))if(spec.factory_parameters[k]!==v)throw Error('Unreviewed detector value '+k);
 if(spec.diode_ports.upper!=='F_IF2_AVC_FEED'||spec.diode_ports.lower!=='F_AVC_RETURN'||spec.diode_ports.cathode!=='F_BMINUS'||spec.diode_ports.socket_pins!==null)throw Error('Unreviewed diode symbol or pin claim');
 if(spec.acceptance.benchmark_ready||spec.acceptance.full_if_stage||spec.acceptance.factory_calibrated)throw Error('Detector subset cannot certify receiver');return true;
}
function pt44DetectorConfigure(spec,graph,input={}){
 pt44DetectorValidate(spec,graph);const d=spec.defaults;
 for(const k of Object.keys(input))if(!(k in d))throw Error('Unknown detector input '+k);const p={...d,...input};
 for(const k of Object.keys(d).filter(k=>typeof d[k]==='number'))if(!Number.isFinite(p[k])||p[k]<0)throw Error('Detector input must be finite and nonnegative: '+k);
 for(const k of ['carrier_hz','audio_hz','duration_s','on_until_s','source_ohm','volume_track_ohm','diode_k_a','samples_per_carrier','release_dt_s'])if(p[k]<=0)throw Error('Detector input must be positive: '+k);
 if(p.carrier_hz!==455000||p.audio_hz<400||p.audio_hz>2000||p.amplitude_v>10||p.modulation>1||p.volume>1||p.on_until_s>=p.duration_s||p.on_until_s<.004||p.on_until_s<4/p.audio_hz||p.on_until_s>.04||p.duration_s>.3||p.duration_s-p.on_until_s<.002||![24,48,96].includes(p.samples_per_carrier)||p.release_dt_s>1e-4||p.release_dt_s<1e-6||p.source_ohm<100||p.source_ohm>1e6||p.volume_track_ohm<1e4||p.volume_track_ohm>2e6||![.05e-6,.1e-6].includes(p.c8_f)||p.c15_scale>10||p.c18_scale>10||p.diode_k_a>1e-3||p.upper_emission>2||p.lower_emission>2||typeof p.r17_open!=='boolean'||typeof p.avc_short!=='boolean')throw Error('Unsupported detector domain');
 const meter=spec.meters.find(m=>m.id===p.meter),nodes=['U','H','A','W','G'];if(!meter||!nodes.includes(p.probe))throw Error('Invalid detector probe');
 // Bound work before allocating; release is coarse only after the carrier is switched off.
 if(Math.ceil(p.on_until_s*p.carrier_hz*p.samples_per_carrier)+Math.ceil((p.duration_s-p.on_until_s)/p.release_dt_s)>2000000)throw Error('Detector step budget exceeded');
 return {spec,p,meter,nodes};
}
function pt44DetectorDiode(v,k){
 // Assumed ideal space-charge diode: no reverse current or contact potential; not a curve fit.
 const u=Math.max(0,v);return {current_a:k*Math.pow(u,1.5),conductance_s:k*1.5*Math.sqrt(u)};
}
function pt44DetectorLinearSolve(M,b){
 const a=M.map((r,i)=>[...r,b[i]]),n=b.length;
 for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;if(Math.abs(a[pivot][k])<1e-20)throw Error('Singular detector circuit');[a[k],a[pivot]]=[a[pivot],a[k]];for(let i=k+1;i<n;i++){const f=a[i][k]/a[k][k];for(let j=k+1;j<=n;j++)a[i][j]-=f*a[k][j];}}
 const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=a[i][n];for(let j=i+1;j<n;j++)s-=a[i][j]*x[j];x[i]=s/a[i][i];}return x;
}
function pt44DetectorSystem(c,x,old,time,dt,on){
 const {p,spec,meter}=c,f=spec.factory_parameters,N=5,M=Array.from({length:N},()=>Array(N).fill(0)),F=Array(N).fill(0),v=i=>i<0?0:x[i],o=i=>i<0?0:old[i];
 const branch=(i,j,I,g)=>{if(i>=0){F[i]+=I;M[i][i]+=g;if(j>=0)M[i][j]-=g;}if(j>=0){F[j]-=I;M[j][j]+=g;if(i>=0)M[j][i]-=g;}};
 const r=(i,j,R)=>branch(i,j,(v(i)-v(j))/R,1/R),cap=(i,j,C)=>branch(i,j,C/dt*(v(i)-v(j)-o(i)+o(j)),C/dt);
 const source=on?p.amplitude_v*(1+p.modulation*Math.sin(2*Math.PI*p.audio_hz*time))*Math.sin(2*Math.PI*p.carrier_hz*time):0;
 // Floating second-IF secondary Thevenin port U-H. Both terminals load the rectifier network.
 branch(0,1,(x[0]-x[1]-source)/p.source_ohm,1/p.source_ohm);
 if(!p.r17_open)r(0,2,f.r17_ohm);r(2,-1,f.r7_ohm);cap(2,-1,p.c8_f);if(p.avc_short)r(2,-1,1);
 cap(1,-1,f.c15_f*p.c15_scale);r(1,3,Math.max(1,p.volume_track_ohm*(1-p.volume)));r(3,-1,Math.max(1,p.volume_track_ohm*p.volume));cap(3,4,f.c18_f*p.c18_scale);r(4,-1,f.r19_ohm);
 for(const [i,emission] of [[0,p.upper_emission],[2,p.lower_emission]]){const d=pt44DetectorDiode(x[i],p.diode_k_a*emission);branch(i,-1,d.current_a,d.conductance_s);}
 const probe=c.nodes.indexOf(p.probe);if(meter.resistance_ohm)r(probe,-1,meter.resistance_ohm);cap(probe,-1,meter.capacitance_f);
 return {M,F,source};
}
function pt44DetectorStep(c,old,time,dt,on){
 let x=old.slice(),sys,residual;
 const norm=F=>Math.max(...F.map(Math.abs));
 for(let n=0;n<20;n++){sys=pt44DetectorSystem(c,x,old,time,dt,on);residual=norm(sys.F);if(residual<1e-12)break;const dx=pt44DetectorLinearSolve(sys.M,sys.F.map(v=>-v));let alpha=1,z;
  for(let ls=0;ls<12;ls++){z=x.map((v,i)=>v+alpha*dx[i]);if(norm(pt44DetectorSystem(c,z,old,time,dt,on).F)<residual)break;alpha/=2;}x=z;
 }
 sys=pt44DetectorSystem(c,x,old,time,dt,on);residual=norm(sys.F);if(!x.every(Number.isFinite)||residual>1e-10)throw Error('Detector convergence failed at '+time+' s');return {time_s:time,x,source_v:sys.source,kcl_residual_a:residual};
}
function pt44DetectorSimulate(spec,graph,input={}){
 const c=pt44DetectorConfigure(spec,graph,input),{p}=c,onCount=Math.ceil(p.on_until_s*p.carrier_hz*p.samples_per_carrier),offCount=Math.ceil((p.duration_s-p.on_until_s)/p.release_dt_s),samples=[],windowStart=p.on_until_s-4/p.audio_hz;
 let old=Array(5).fill(0),maxResidual=0,peakAvc=0,atOff=null,area=Array(5).fill(0),cos=Array(5).fill(0),sin=Array(5).fill(0),windowTime=0,previous=null,steps=0;
 const step=(time,dt,on,n,stride)=>{const s=pt44DetectorStep(c,old,time,dt,on);old=s.x;steps++;maxResidual=Math.max(maxResidual,s.kcl_residual_a);peakAvc=Math.min(peakAvc,s.x[2]);
  if(on&&previous&&previous.time_s>=windowStart-1e-12){const a=previous,b=s,h=2*Math.PI*p.audio_hz;windowTime+=dt;for(let k=0;k<5;k++){area[k]+=(a.x[k]+b.x[k])*dt/2;cos[k]+=(a.x[k]*Math.cos(h*a.time_s)+b.x[k]*Math.cos(h*b.time_s))*dt/2;sin[k]+=(a.x[k]*Math.sin(h*a.time_s)+b.x[k]*Math.sin(h*b.time_s))*dt/2;}}
  if(n%stride===0||n===1)samples.push(s);previous=s;return s;
 };
 const dt=p.on_until_s/onCount;for(let n=1;n<=onCount;n++)atOff=step(n*dt,dt,true,n,p.samples_per_carrier);samples.push(atOff);
 // Match the source discontinuity exactly; preserve all capacitor voltages across it.
 const releaseDt=(p.duration_s-p.on_until_s)/offCount;let final;
 for(let n=1;n<=offCount;n++)final=step(p.on_until_s+n*releaseDt,releaseDt,false,n,Math.max(1,Math.ceil(offCount/1500)));samples.push(final);
 const summary={};for(let k=0;k<5;k++)summary[c.nodes[k]]={mean_v:area[k]/windowTime,audio_peak_v:2*Math.hypot(cos[k],sin[k])/windowTime};
 return {parameters:p,summary,samples,at_off:atOff,final,peak_avc_v:peakAvc,max_kcl_residual_a:maxResidual,steps,measurement_window_s:[windowStart,p.on_until_s],full_receiver_validated:false,factory_calibrated:false};
}
function pt44DetectorSpiceDeck(spec,graph,input={}){
 const {p,meter}=pt44DetectorConfigure(spec,graph,input),f=spec.factory_parameters,dt=1/(p.carrier_hz*p.samples_per_carrier),on=p.on_until_s;
 const lines=['PT-44 v0.56 detector/AVC subset - assumed diode/source parameters','* Symbol-level diode plates; physical pins 5/6 remain unresolved. 0 is B-minus, not chassis.',`BIF S H V={${p.amplitude_v}*(1+${p.modulation}*sin(${2*Math.PI*p.audio_hz}*time))*sin(${2*Math.PI*p.carrier_hz}*time)*(time<=${on})}`,`RSOURCE S U ${p.source_ohm}`,`R7 A 0 ${f.r7_ohm}`,`C8 A 0 ${p.c8_f} IC=0`,`R16TOP H W ${Math.max(1,p.volume_track_ohm*(1-p.volume))}`,`R16BOT W 0 ${Math.max(1,p.volume_track_ohm*p.volume)}`,`R19 G 0 ${f.r19_ohm}`,'.func DSPACE(v) {max(v,0)^1.5}',`BDUP U 0 I={${p.diode_k_a*p.upper_emission}*DSPACE(V(U))}`,`BDLOW A 0 I={${p.diode_k_a*p.lower_emission}*DSPACE(V(A))}`];
 if(!p.r17_open)lines.push(`R17 U A ${f.r17_ohm}`);if(p.avc_short)lines.push('RSHORT A 0 1');if(p.c15_scale)lines.push(`C15 H 0 ${f.c15_f*p.c15_scale} IC=0`);if(p.c18_scale)lines.push(`C18 W G ${f.c18_f*p.c18_scale} IC=0`);
 if(meter.resistance_ohm)lines.push(`RMETER ${p.probe} 0 ${meter.resistance_ohm}`);if(meter.capacitance_f)lines.push(`CMETER ${p.probe} 0 ${meter.capacitance_f} IC=0`);
 lines.push('.options method=gear maxord=1 reltol=1e-6 abstol=1e-12',`* Browser takes carrier steps until ${on} s, then uses ${p.release_dt_s} s maximum release steps.`, '* SPICE keeps fine steps through release; use this to check the coarser browser release.',`.tran ${dt} ${p.duration_s} 0 ${dt} UIC`,'.print tran V(U) V(H) V(A) V(W) V(G)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports)module.exports={validate:pt44DetectorValidate,configure:pt44DetectorConfigure,diode:pt44DetectorDiode,solve:pt44DetectorLinearSolve,system:pt44DetectorSystem,step:pt44DetectorStep,simulate:pt44DetectorSimulate,spiceDeck:pt44DetectorSpiceDeck};
