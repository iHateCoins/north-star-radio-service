// Joint MNA: hot DC supply, tuned IF, detector/AVC and nonlinear audio.
// The converter remains an explicit injection/load boundary, not a 7A8 model.
function pt44IFValidate(spec,audio,power,detector,graph){
 pt44AudioValidate(audio,graph);pt44PowerValidate(power,graph);pt44DetectorValidate(detector,graph);
 const map=new Map();for(const n of graph.factory_nets)for(const t of n.factory_members){if(map.has(t))throw Error('Duplicate IF terminal '+t);map.set(t,n.id);}
 for(const [t,n] of Object.entries(spec.factory_terminal_nets))if(map.get(t)!==n)throw Error('IF source topology mismatch '+t);
 if(spec.factory_parameters.r13_ohm!==27000||spec.factory_parameters.c11_f!==.05e-6)throw Error('Unreviewed IF factory value');
 for(const axis of [spec.curve.plate_v,spec.curve.grid_v])if(axis.some((v,i)=>!Number.isFinite(v)||(i&&v<=axis[i-1])))throw Error('Invalid IF tube axis');
 for(const key of ['plate_current_a','screen_current_a'])if(spec.curve[key].length!==spec.curve.grid_v.length||spec.curve[key].some(r=>r.length!==spec.curve.plate_v.length||r.some(v=>!Number.isFinite(v)||v<0)))throw Error('Invalid IF tube table');
 if(Object.values(spec.acceptance).some(Boolean))throw Error('IF increment cannot certify receiver');return true;
}
function pt44IFTube(spec,plate,screen,grid,emission=1){
 if(screen<=0||emission===0)return {plate_a:0,screen_a:0,grid_a:0};const q=screen/100,p=Math.max(0,plate)/q,g=grid/q,k=emission*Math.pow(q,1.5);
 return {plate_a:k*pt44AudioTable(spec.curve,'plate_current_a',p,g),screen_a:k*pt44AudioTable(spec.curve,'screen_current_a',p,g),grid_a:emission*spec.assumptions.grid_current_k_a*Math.pow(Math.max(0,grid),1.5)};
}
function pt44IFConfigure(spec,audio,power,detector,graph,input={}){
 pt44IFValidate(spec,audio,power,detector,graph);const p={...spec.defaults,...input};for(const k of Object.keys(input))if(!(k in spec.defaults))throw Error('Unknown IF input '+k);
 for(const [k,v] of Object.entries(spec.defaults)){if(typeof v==='number'&&(!Number.isFinite(p[k])||p[k]<0))throw Error('Invalid IF numeric input '+k);if(typeof v==='boolean'&&typeof p[k]!=='boolean')throw Error('Invalid IF flag '+k);}
 if(p.line_v<90||p.line_v>130||p.carrier_hz<420000||p.carrier_hz>490000||![1000,2000].includes(p.audio_hz)||p.input_peak_a>.0001||p.modulation>1||p.volume>1||p.duration_s<4/p.audio_hz||p.duration_s>.02||![48,96,192].includes(p.samples_per_carrier)||p.if_emission>2||p.upper_emission>2||p.lower_emission>2||p.if1_detune<.8||p.if1_detune>1.2||p.if2_detune<.8||p.if2_detune>1.2||p.coupling<.005||p.coupling>.08||![.05e-6,.1e-6].includes(p.c8_f)||p.c18_scale>2||p.c20_leak_ohm!==null&&(!Number.isFinite(p.c20_leak_ohm)||p.c20_leak_ohm<1e5))throw Error('Unsupported IF domain');
 if(p.c20_leak_ohm!==null&&p.samples_per_carrier<192)throw Error('Coupling leakage requires 192 steps per carrier cycle');
 const nodes=['A','B','H','W','G','P','O','K','T','X','FIELD_I','AUDIO_L_I','U','AVC','S','IG','IP','IS','PW','SW','CP','CW','I1P','I1S','I2P','I2S'];
 if(!['ideal','dmm','service'].includes(p.meter)||!['A','B','G','P','K','U','AVC','S','IG','IP','CP'].includes(p.probe))throw Error('Invalid IF probe');
 const base=pt44AudioConfigure(audio,power,graph,{line_v:p.line_v,line_mode:'DC',signal_peak_v:0,signal_start_s:0,volume:p.volume,c18_scale:p.c18_scale,c20_leak_ohm:p.c20_leak_ohm,meter:'ideal'});
 const a=spec.assumptions,w=2*Math.PI*455000,L=a.winding_h,C=1/(w*w*L),lossG=1/(w*L*a.unloaded_q)-a.winding_dcr_ohm/(w*w*L*L);
 if(lossG<=0||p.duration_s*p.carrier_hz*p.samples_per_carrier>2000000)throw Error('IF passivity/work budget');
 const meter=p.meter==='ideal'?{resistance_ohm:null,capacitance_f:0}:p.meter==='dmm'?{resistance_ohm:1e7,capacitance_f:100e-12}:{resistance_ohm:1000*(p.probe==='AVC'?10:250),capacitance_f:0};
 return {spec,audio,power,detector,graph,p,base,N:26,nodes,L,C,lossG,meter};
}
function pt44IFSystem(c,x,old,time,dt,equilibrium=false){
 const {p,spec,base}=c,a=spec.assumptions,bs=pt44AudioSystem(base,x.slice(0,12),old.slice(0,12),time,dt),M=Array.from({length:c.N},(_,i)=>i<12?bs.M[i].concat(Array(c.N-12).fill(0)):Array(c.N).fill(0)),F=bs.F.concat(Array(c.N-12).fill(0));
 const v=i=>i<0?0:x[i],o=i=>i<0?0:old[i];
 const branch=(i,j,I,d)=>{if(i>=0)F[i]+=I;if(j>=0)F[j]-=I;for(const [k,g] of d){if(i>=0)M[i][k]+=g;if(j>=0)M[j][k]-=g;}};
 const r=(i,j,R)=>branch(i,j,(v(i)-v(j))/R,[[i,1/R],[j,-1/R]].filter(([k])=>k>=0));
 const cap=(i,j,C)=>branch(i,j,C/dt*(v(i)-v(j)-o(i)+o(j)),[[i,C/dt],[j,-C/dt]].filter(([k])=>k>=0));
 const nl=(i,j,controls,fn)=>{const I=fn(x),d=controls.map(k=>{const h=1e-7*Math.max(1,Math.abs(x[k])),z=x.slice();z[k]+=h;const u=fn(z);z[k]-=2*h;return [k,(u-fn(z))/(2*h)];});branch(i,j,I,d);};
 // Remove the audio bench's RF/IF resistor and synthetic detector source.
 r(1,-1,-base.p.rf_if_load_ohm);r(2,-1,-base.p.detector_source_ohm);
 // Converter substitutes are explicit and attached to their actual supply ports.
 r(20,-1,a.converter_plate_ohm);r(14,-1,a.converter_screen_ohm);
 const drive=equilibrium?0:p.input_peak_a*(1+p.modulation*Math.sin(2*Math.PI*p.audio_hz*time))*Math.sin(2*Math.PI*p.carrier_hz*time);branch(20,-1,drive,[]);
 if(!p.screen_feed_open)r(1,14,spec.factory_parameters.r13_ohm);cap(14,-1,spec.factory_parameters.c11_f);
 const tube=z=>pt44IFTube(spec,z[16],z[14],z[15],p.if_emission);
 nl(16,-1,[16,14,15],z=>tube(z).plate_a);nl(14,-1,[16,14,15],z=>tube(z).screen_a);nl(15,-1,[15],z=>tube(z).grid_a);
 cap(15,-1,a.input_capacitance_f);cap(16,-1,a.output_capacitance_f);cap(15,16,a.grid_plate_capacitance_f);
 const transformer=(top,bottom,internal,secondaryTop,secondaryBottom,secondaryInternal,ip,is,scale)=>{
  r(top,internal,a.winding_dcr_ohm);r(secondaryTop,secondaryInternal,a.winding_dcr_ohm);r(top,bottom,1/c.lossG);r(secondaryTop,secondaryBottom,1/c.lossG);
  cap(top,bottom,c.C*scale);cap(secondaryTop,secondaryBottom,c.C*scale);branch(internal,bottom,x[ip],[[ip,1]]);branch(secondaryInternal,secondaryBottom,x[is],[[is,1]]);
  const L=c.L/dt,mut=p.coupling*L;for(const [row,other,u,l] of [[ip,is,internal,bottom],[is,ip,secondaryInternal,secondaryBottom]]){F[row]=L*(x[row]-old[row])+mut*(x[other]-old[other])-v(u)+v(l);M[row][row]=L;M[row][other]=mut;M[row][u]=-1;if(l>=0)M[row][l]=1;}
 };
 transformer(20,1,21,15,p.avc_feedback?13:-1,17,22,23,p.if1_detune);transformer(16,1,18,12,2,19,24,25,p.if2_detune);
 const f=c.detector.factory_parameters;if(!p.r17_open)r(12,13,f.r17_ohm);r(13,-1,f.r7_ohm);cap(13,-1,p.c8_f);if(p.avc_short)r(13,-1,1);
 for(const [i,emission] of [[12,p.upper_emission],[13,p.lower_emission]]){const d=pt44DetectorDiode(x[i],c.detector.defaults.diode_k_a*emission);branch(i,-1,d.current_a,[[i,d.conductance_s]]);}
 const probe=c.nodes.indexOf(p.probe);if(c.meter.resistance_ohm)r(probe,-1,c.meter.resistance_ohm);cap(probe,-1,c.meter.capacitance_f);
 return {M,F,rect:bs.rect,drive,tube:tube(x)};
}
function pt44IFSingleStep(c,old,time,dt,equilibrium=false){
 const t=equilibrium?time:time-dt/2,h=equilibrium?dt:dt/2;let x=old.slice(),sys,residual;const norm=F=>Math.max(...F.map((v,i)=>Math.abs(v)/([10,11,22,23,24,25].includes(i)?1000:1)));
 for(let n=0;n<50;n++){sys=pt44IFSystem(c,x,old,t,h,equilibrium);residual=norm(sys.F);
  // Large supply-capacitor conductances hit floating-point subtraction noise at fine IF steps.
  // Keep high-impedance signal-node tolerance strict while allowing 1 nA at the two supply nodes.
  if(sys.F.every((v,i)=>Math.abs(v)/([10,11,22,23,24,25].includes(i)?1000:1)<(!equilibrium&&i<2?1e-9:2e-11)))break;const dx=pt44AudioSolve(sys.M,sys.F.map(v=>-v));let alpha=1,z;for(let j=0;j<15;j++){z=x.map((v,i)=>v+alpha*dx[i]);if(norm(pt44IFSystem(c,z,old,t,h,equilibrium).F)<residual)break;alpha/=2;}x=z;}
 sys=pt44IFSystem(c,x,old,t,h,equilibrium);residual=norm(sys.F);if(!x.every(Number.isFinite)||residual>1e-8)throw Error('IF Newton convergence at '+time+': '+residual);
 if(!equilibrium)x=x.map((v,i)=>2*v-old[i]);
 return {time_s:time,x,kcl_residual_a:residual,if_plate_a:sys.tube.plate_a,if_screen_a:sys.tube.screen_a,speaker_v:(x[9]-x[8])/c.base.ratio,rectifier_a:sys.rect.current_a};
}
function pt44IFStep(c,old,time,dt,equilibrium=false,depth=0){
 try{return pt44IFSingleStep(c,old,time,dt,equilibrium);}catch(error){
  if(equilibrium||depth>=4||!String(error.message).startsWith('IF Newton convergence'))throw error;
  const first=pt44IFStep(c,old,time-dt/2,dt/2,false,depth+1),second=pt44IFStep(c,first.x,time,dt/2,false,depth+1);
  second.kcl_residual_a=Math.max(first.kcl_residual_a,second.kcl_residual_a);second.subdivisions=1+(first.subdivisions||0)+(second.subdivisions||0);return second;
 }
}
function pt44IFSimulate(spec,audio,power,detector,graph,input={}){
 const c=pt44IFConfigure(spec,audio,power,detector,graph,input),{p}=c,count=Math.ceil(p.duration_s*p.carrier_hz*p.samples_per_carrier),dt=p.duration_s/count;
 let seed=Array(c.N).fill(0),initial;
 if(p.c20_leak_ohm!==null){
  const clean=pt44IFConfigure(spec,audio,power,detector,graph,{...input,c20_leak_ohm:null});seed=pt44IFStep(clean,seed,0,1e12,true).x;
  // Continue the leakage conductance from the healthy operating point.
  for(let n=1;n<=8;n++){const stage=pt44IFConfigure(spec,audio,power,detector,graph,{...input,c20_leak_ohm:p.c20_leak_ohm*8/n});initial=pt44IFStep(stage,seed,0,1e12,true);seed=initial.x;}
 }else initial=pt44IFStep(c,seed,0,1e12,true);
 const samples=[initial];
 let s=initial,maxResidual=initial.kcl_residual_a,subdivisions=0;const start=p.duration_s-4/p.audio_hz,keys=['B','S','AVC','IG','IP','H','G','P','T','speaker_v','if_plate_a','if_screen_a'],stats=Object.fromEntries(keys.map(k=>[k,{area:0,cos:0,sin:0,carrier_cos:0,carrier_sin:0,min:Infinity,max:-Infinity}]));let T=0;const value=(s,k)=>k in s?s[k]:s.x[c.nodes.indexOf(k)];
 for(let n=1;n<=count;n++){const prev=s;s=pt44IFStep(c,s.x,n*dt,dt);maxResidual=Math.max(maxResidual,s.kcl_residual_a);subdivisions+=s.subdivisions||0;if(n%p.samples_per_carrier===0||n===count)samples.push(s);
  if(prev.time_s>=start-1e-12){T+=dt;for(const k of keys){const z=stats[k],u=value(prev,k),v=value(s,k);z.area+=(u+v)*dt/2;for(const [f,cos,sin] of [[p.audio_hz,'cos','sin'],[p.carrier_hz,'carrier_cos','carrier_sin']]){z[cos]+=(u*Math.cos(2*Math.PI*f*prev.time_s)+v*Math.cos(2*Math.PI*f*s.time_s))*dt/2;z[sin]+=(u*Math.sin(2*Math.PI*f*prev.time_s)+v*Math.sin(2*Math.PI*f*s.time_s))*dt/2;}z.min=Math.min(z.min,u,v);z.max=Math.max(z.max,u,v);}}
 }
 const summary=Object.fromEntries(keys.map(k=>{const z=stats[k];return [k,{mean:z.area/T,audio_peak:2*Math.hypot(z.cos,z.sin)/T,carrier_peak:2*Math.hypot(z.carrier_cos,z.carrier_sin)/T,min:z.min,max:z.max}];}));return {parameters:p,initial,final:s,summary,samples,max_kcl_residual_a:maxResidual,steps:count,subdivisions,measurement_window_s:[start,p.duration_s],factory_calibrated:false,full_receiver_validated:false};
}
function pt44IFSpiceDeck(spec,audio,power,detector,graph,input={}){
 const c=pt44IFConfigure(spec,audio,power,detector,graph,input),{p}=c,a=spec.assumptions,f=detector.factory_parameters,dt=1/(p.carrier_hz*p.samples_per_carrier);
 const lines=pt44AudioSpiceDeck(audio,power,graph,{line_v:p.line_v,line_mode:'DC',signal_peak_v:0,signal_start_s:0,volume:p.volume,c18_scale:p.c18_scale,c20_leak_ohm:p.c20_leak_ohm}).split('\n').filter(s=>s&&!/^(RRF |BSIGNAL |RDET |\.options|\.tran|\.print|\.end)/.test(s)).map(s=>s.replace(/ IC=0/g,''));
 lines[0]='PT-44 v0.57 joint hot DC IF/detector/audio/power - uncalibrated';
 lines.push('* Converter injection/substitute loads and winding parameters are declared assumptions. No RF tracking claim.',`.func IFP(p,g) {${pt44AudioSpiceTable(spec.curve,'plate_current_a')}}`,`.func IFS(p,g) {${pt44AudioSpiceTable(spec.curve,'screen_current_a')}}`,'.func QIF(s) {max(s,1e-6)/100}',
 `RCP CP 0 ${a.converter_plate_ohm}`,`RCS S 0 ${a.converter_screen_ohm}`,`BDRIVE CP 0 I={${p.input_peak_a}*(1+${p.modulation}*sin(${2*Math.PI*p.audio_hz}*time))*sin(${2*Math.PI*p.carrier_hz}*time)}`,
 `C11 S 0 ${spec.factory_parameters.c11_f}`,`BIFP IP 0 I={${p.if_emission}*(V(S)>0)*QIF(V(S))^1.5*IFP(max(V(IP),0)/QIF(V(S)),V(IG)/QIF(V(S)))}`,
 `BIFS S 0 I={${p.if_emission}*(V(S)>0)*QIF(V(S))^1.5*IFS(max(V(IP),0)/QIF(V(S)),V(IG)/QIF(V(S)))}`,`BIFG IG 0 I={${p.if_emission*a.grid_current_k_a}*max(V(IG),0)^1.5}`,
 `CIG IG 0 ${a.input_capacitance_f}`,`CIP IP 0 ${a.output_capacitance_f}`,`CIGP IG IP ${a.grid_plate_capacitance_f}`);
 if(!p.screen_feed_open)lines.push(`R13 N_BPLUS_FILT S ${spec.factory_parameters.r13_ohm}`);
 const trans=(id,t,b,i,st,sb,si,scale)=>lines.push(`R${id}P ${t} ${i} ${a.winding_dcr_ohm}`,`R${id}S ${st} ${si} ${a.winding_dcr_ohm}`,`L${id}P ${i} ${b} ${c.L}`,`L${id}S ${si} ${sb} ${c.L}`,`K${id} L${id}P L${id}S ${p.coupling}`,`C${id}P ${t} ${b} ${c.C*scale}`,`C${id}S ${st} ${sb} ${c.C*scale}`,`R${id}LP ${t} ${b} ${1/c.lossG}`,`R${id}LS ${st} ${sb} ${1/c.lossG}`);
 trans('12','CP','N_BPLUS_FILT','CW','IG',p.avc_feedback?'AVC':'0','IS',p.if1_detune);trans('14','IP','N_BPLUS_FILT','PW','U','H','SW',p.if2_detune);
 lines.push(`R7 AVC 0 ${f.r7_ohm}`,`C8 AVC 0 ${p.c8_f}`,`BDUP U 0 I={${detector.defaults.diode_k_a*p.upper_emission}*max(V(U),0)^1.5}`,`BDLOW AVC 0 I={${detector.defaults.diode_k_a*p.lower_emission}*max(V(AVC),0)^1.5}`);
 if(!p.r17_open)lines.push(`R17 U AVC ${f.r17_ohm}`);if(p.avc_short)lines.push('RAVCSHORT AVC 0 1');
 const probe={A:'N_BPLUS_RECT',B:'N_BPLUS_FILT'}[p.probe]||p.probe;if(c.meter.resistance_ohm)lines.push(`RMETER ${probe} 0 ${c.meter.resistance_ohm}`);if(c.meter.capacitance_f)lines.push(`CMETER ${probe} 0 ${c.meter.capacitance_f}`);
 lines.push('.options method=trap maxord=2 reltol=1e-6 abstol=1e-12',`* DC operating point initializes hot equilibrium; no UIC. JS uses implicit midpoint at ${dt} s.`,`.tran ${dt} ${p.duration_s} 0 ${dt}`,'.print tran V(N_BPLUS_FILT) V(S) V(AVC) V(IG) V(IP) V(H) V(G) V(P) V(T) V(SPEAKER)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports){const a=require('./pt44_audio_power_v55'),p=require('./pt44_power_model_v54'),d=require('./pt44_detector_avc_v56');var pt44AudioValidate=a.validate,pt44PowerValidate=p.validate,pt44DetectorValidate=d.validate,pt44AudioTable=a.table,pt44AudioSpiceTable=a.spiceTable,pt44AudioSpiceDeck=a.spiceDeck,pt44AudioConfigure=a.configure,pt44AudioSystem=a.system,pt44AudioSolve=a.solve,pt44DetectorDiode=d.diode;module.exports={validate:pt44IFValidate,tube:pt44IFTube,configure:pt44IFConfigure,system:pt44IFSystem,step:pt44IFStep,simulate:pt44IFSimulate,spiceDeck:pt44IFSpiceDeck};}
