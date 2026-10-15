// Joint MNA: hot DC supply, tuned IF, detector/AVC and nonlinear audio.
// The converter remains an explicit injection/load boundary, not a 7A8 model.
function pt44IFValidate(spec,audio,power,detector,graph){
 pt44AudioValidate(audio,graph);pt44PowerValidate(power,graph);pt44DetectorValidate(detector,graph);
 const map=new Map();for(const n of graph.factory_nets)for(const t of n.factory_members){if(map.has(t))throw Error('Duplicate IF terminal '+t);map.set(t,n.id);}
 for(const [t,n] of Object.entries(spec.factory_terminal_nets))if(map.get(t)!==n)throw Error('IF source topology mismatch '+t);
 if(spec.factory_parameters.r13_ohm!==27000||spec.factory_parameters.c11_f!==.05e-6)throw Error('Unreviewed IF factory value');
 for(const axis of [spec.curve.plate_v,spec.curve.grid_v])if(axis.some((v,i)=>!Number.isFinite(v)||(i&&v<=axis[i-1])))throw Error('Invalid IF tube axis');
 for(const key of ['plate_current_a','screen_current_a'])if(spec.curve[key].length!==spec.curve.grid_v.length||spec.curve[key].some(r=>r.length!==spec.curve.plate_v.length||r.some(v=>!Number.isFinite(v)||v<0)))throw Error('Invalid IF tube table');
 const dcr=spec.factory_parameters.if_winding_dcr_ohm;const expectedDcr={'12_primary':31,'12_secondary':29,'14_primary':45,'14_secondary':6.8};if(!dcr||Object.keys(dcr).length!==4||Object.entries(expectedDcr).some(([k,v])=>dcr[k]!==v))throw Error('Unreviewed IF winding DCR');
 if(Object.values(spec.acceptance).some(Boolean))throw Error('IF increment cannot certify receiver');return true;
}
function pt44IFTable(table,key,plate,grid){
 // Published curves stop at zero grid voltage. Continue the last slope to +3 V
 // as an explicit uncalibrated positive-grid law, instead of a zero-gain clamp at bias zero.
 if(grid<=0)return pt44AudioTable(table,key,plate,grid);
 const top=pt44AudioTable(table,key,plate,0),previous=pt44AudioTable(table,key,plate,table.grid_v.at(-2));
 return top+(top-previous)*Math.min(grid,3)/(-table.grid_v.at(-2));
}
function pt44IFSpiceTable(spec,key){
 const t=spec.curve,rows=t[key],gap=-t.grid_v.at(-2),extended={...t,grid_v:[...t.grid_v,3],[key]:[...rows,rows.at(-1).map((v,i)=>v+3*(v-rows.at(-2)[i])/gap)]};return pt44AudioSpiceTable(extended,key);
}
function pt44IFTube(spec,plate,screen,grid,emission=1){
 if(screen<=0||emission===0)return {plate_a:0,screen_a:0,grid_a:0};const q=screen/100,p=Math.max(0,plate)/q,g=grid/q,k=emission*Math.pow(q,1.5);
 return {plate_a:k*pt44IFTable(spec.curve,'plate_current_a',p,g),screen_a:k*pt44IFTable(spec.curve,'screen_current_a',p,g),grid_a:emission*spec.assumptions.grid_current_k_a*Math.pow(Math.max(0,grid),1.5)};
}
function pt44IFConfigure(spec,audio,power,detector,graph,input={}){
 pt44IFValidate(spec,audio,power,detector,graph);const p={...spec.defaults,...input};for(const k of Object.keys(input))if(!(k in spec.defaults))throw Error('Unknown IF input '+k);
 for(const [k,v] of Object.entries(spec.defaults)){if(typeof v==='number'&&(!Number.isFinite(p[k])||p[k]<0))throw Error('Invalid IF numeric input '+k);if(typeof v==='boolean'&&typeof p[k]!=='boolean')throw Error('Invalid IF flag '+k);}
 if(p.line_v<90||p.line_v>130||p.carrier_hz<420000||p.carrier_hz>490000||![1000,2000].includes(p.audio_hz)||p.input_peak_a>.0001||p.modulation>1||p.volume>1||p.duration_s<4/p.audio_hz||p.duration_s>.02||![48,96,192].includes(p.samples_per_carrier)||p.if_emission>2||p.upper_emission>2||p.lower_emission>2||p.if1_detune<.8||p.if1_detune>1.2||p.if2_detune<.8||p.if2_detune>1.2||p.coupling<.005||p.coupling>.08||![.05e-6,.1e-6].includes(p.c8_f)||p.c18_scale>2||p.c20_leak_ohm!==null&&(!Number.isFinite(p.c20_leak_ohm)||p.c20_leak_ohm<1e5))throw Error('Unsupported IF domain');
 if(p.c20_leak_ohm!==null&&p.samples_per_carrier<192)throw Error('Coupling leakage requires 192 steps per carrier cycle');
 for(const k of ['c12a_scale','c12b_scale','c14a_scale'])if(p[k]<.75||p[k]>1.25)throw Error('Unsupported IF trimmer range');
 const nodes=['A','B','H','W','G','P','O','K','T','X','FIELD_I','AUDIO_L_I','U','AVC','S','IG','IP','IS','PW','SW','CP','CW','I1P','I1S','I2P','I2S'];
 if(!['ideal','dmm','service'].includes(p.meter)||!['A','B','G','P','K','U','AVC','S','IG','IP','CP'].includes(p.probe))throw Error('Invalid IF probe');
 const base=pt44AudioConfigure(audio,power,graph,{line_v:p.line_v,line_mode:'DC',signal_peak_v:0,signal_start_s:0,volume:p.volume,c18_scale:p.c18_scale,c20_leak_ohm:p.c20_leak_ohm,meter:'ideal'});
 const a=spec.assumptions,w=2*Math.PI*455000,L=a.winding_h,C=1/(w*w*L),lossG=1/(w*L*a.core_loss_q);
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
 nl(16,-1,[16,14,15],z=>tube(z).plate_a);nl(14,-1,[16,14,15],z=>tube(z).screen_a);const gridU=Math.max(0,x[15]),gridK=p.if_emission*a.grid_current_k_a;branch(15,-1,gridK*Math.pow(gridU,1.5),[[15,1.5*gridK*Math.sqrt(gridU)]]);
 cap(15,-1,a.input_capacitance_f);cap(16,-1,a.output_capacitance_f);cap(15,16,a.grid_plate_capacitance_f);
 const transformer=(top,bottom,internal,secondaryTop,secondaryBottom,secondaryInternal,ip,is,Rp,Rs,Cp,Cs)=>{
  r(top,internal,Rp);r(secondaryTop,secondaryInternal,Rs);r(top,bottom,1/c.lossG);r(secondaryTop,secondaryBottom,1/c.lossG);
  cap(top,bottom,Cp);cap(secondaryTop,secondaryBottom,Cs);branch(internal,bottom,x[ip],[[ip,1]]);branch(secondaryInternal,secondaryBottom,x[is],[[is,1]]);
  const L=c.L/dt,mut=p.coupling*L;for(const [row,other,u,l] of [[ip,is,internal,bottom],[is,ip,secondaryInternal,secondaryBottom]]){F[row]=L*(x[row]-old[row])+mut*(x[other]-old[other])-v(u)+v(l);M[row][row]=L;M[row][other]=mut;M[row][u]=-1;if(l>=0)M[row][l]=1;}
 };
 const dc=spec.factory_parameters.if_winding_dcr_ohm;
 transformer(20,1,21,15,p.avc_feedback?13:-1,17,22,23,dc['12_primary'],dc['12_secondary'],c.C*p.if1_detune*p.c12a_scale,c.C*p.if1_detune*p.c12b_scale);
 transformer(16,1,18,12,2,19,24,25,dc['14_primary'],dc['14_secondary'],0,c.C*p.if2_detune*p.c14a_scale);
 const f=c.detector.factory_parameters;if(!p.r17_open)r(12,13,f.r17_ohm);r(13,-1,f.r7_ohm);cap(13,-1,p.c8_f);if(p.avc_short)r(13,-1,1);
 for(const [i,emission] of [[12,p.upper_emission],[13,p.lower_emission]]){const d=pt44DetectorDiode(x[i],c.detector.defaults.diode_k_a*emission);branch(i,-1,d.current_a,[[i,d.conductance_s]]);}
 const probe=c.nodes.indexOf(p.probe);if(c.meter.resistance_ohm)r(probe,-1,c.meter.resistance_ohm);cap(probe,-1,c.meter.capacitance_f);
 return {M,F,rect:bs.rect,drive,tube:tube(x)};
}
function pt44IFSingleStep(c,old,time,dt,equilibrium=false,method='midpoint'){
 const midpoint=!equilibrium&&method==='midpoint';if(!['midpoint','backward_euler'].includes(method))throw Error('Unknown IF integrator');const t=midpoint?time-dt/2:time,h=midpoint?dt/2:dt;let x=old.slice(),sys,residual;const norm=F=>Math.max(...F.map((v,i)=>Math.abs(v)/([10,11,22,23,24,25].includes(i)?1000:1)));
 for(let n=0;n<50;n++){sys=pt44IFSystem(c,x,old,t,h,equilibrium);residual=norm(sys.F);
  // Large supply-capacitor conductances hit floating-point subtraction noise at fine IF steps.
  // Keep high-impedance signal-node tolerance strict while allowing 1 nA at the two supply nodes.
  if(sys.F.every((v,i)=>Math.abs(v)/([10,11,22,23,24,25].includes(i)?1000:1)<(!equilibrium&&i<2?1e-9:method==='backward_euler'?2e-14:2e-11)))break;const dx=pt44AudioSolve(sys.M,sys.F.map(v=>-v));let alpha=1,z;for(let j=0;j<15;j++){z=x.map((v,i)=>v+alpha*dx[i]);if(norm(pt44IFSystem(c,z,old,t,h,equilibrium).F)<residual)break;alpha/=2;}x=z;}
 sys=pt44IFSystem(c,x,old,t,h,equilibrium);residual=norm(sys.F);if(!x.every(Number.isFinite)||residual>1e-8)throw Error('IF Newton convergence at '+time+': '+residual);
 if(midpoint)x=x.map((v,i)=>2*v-old[i]);
 return {time_s:time,x,kcl_residual_a:residual,if_plate_a:sys.tube.plate_a,if_screen_a:sys.tube.screen_a,speaker_v:(x[9]-x[8])/c.base.ratio,if_secondary_v:x[12]-x[2],rectifier_a:sys.rect.current_a};
}
function pt44IFStep(c,old,time,dt,equilibrium=false,depth=0,method='midpoint'){
 try{return pt44IFSingleStep(c,old,time,dt,equilibrium,method);}catch(error){
  if(equilibrium||depth>=4||!String(error.message).startsWith('IF Newton convergence'))throw error;
  const first=pt44IFStep(c,old,time-dt/2,dt/2,false,depth+1,method),second=pt44IFStep(c,first.x,time,dt/2,false,depth+1,method);
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
 let s=initial,maxResidual=initial.kcl_residual_a,subdivisions=0;const start=p.duration_s-4/p.audio_hz,keys=['B','S','AVC','IG','IP','H','G','P','T','speaker_v','if_secondary_v','if_plate_a','if_screen_a'],stats=Object.fromEntries(keys.map(k=>[k,{area:0,cos:0,sin:0,carrier_cos:0,carrier_sin:0,min:Infinity,max:-Infinity}]));let T=0;const value=(s,k)=>k in s?s[k]:s.x[c.nodes.indexOf(k)];
 for(let n=1;n<=count;n++){const prev=s;s=pt44IFStep(c,s.x,n*dt,dt);maxResidual=Math.max(maxResidual,s.kcl_residual_a);subdivisions+=s.subdivisions||0;if(n%p.samples_per_carrier===0||n===count)samples.push(s);
  if(prev.time_s>=start-1e-12){T+=dt;for(const k of keys){const z=stats[k],u=value(prev,k),v=value(s,k);z.area+=(u+v)*dt/2;for(const [f,cos,sin] of [[p.audio_hz,'cos','sin'],[p.carrier_hz,'carrier_cos','carrier_sin']]){z[cos]+=(u*Math.cos(2*Math.PI*f*prev.time_s)+v*Math.cos(2*Math.PI*f*s.time_s))*dt/2;z[sin]+=(u*Math.sin(2*Math.PI*f*prev.time_s)+v*Math.sin(2*Math.PI*f*s.time_s))*dt/2;}z.min=Math.min(z.min,u,v);z.max=Math.max(z.max,u,v);}}
 }
 const summary=Object.fromEntries(keys.map(k=>{const z=stats[k];return [k,{mean:z.area/T,audio_peak:2*Math.hypot(z.cos,z.sin)/T,carrier_peak:2*Math.hypot(z.carrier_cos,z.carrier_sin)/T,min:z.min,max:z.max}];}));return {parameters:p,initial,final:s,summary,samples,max_kcl_residual_a:maxResidual,steps:count,subdivisions,measurement_window_s:[start,p.duration_s],factory_calibrated:false,full_receiver_validated:false};
}
function pt44IFSpiceDeck(spec,audio,power,detector,graph,input={}){
 const c=pt44IFConfigure(spec,audio,power,detector,graph,input),{p}=c,a=spec.assumptions,f=detector.factory_parameters,dt=1/(p.carrier_hz*p.samples_per_carrier);
 const lines=pt44AudioSpiceDeck(audio,power,graph,{line_v:p.line_v,line_mode:'DC',signal_peak_v:0,signal_start_s:0,volume:p.volume,c18_scale:p.c18_scale,c20_leak_ohm:p.c20_leak_ohm}).split('\n').filter(s=>s&&!/^(RRF |BSIGNAL |RDET |\.options|\.tran|\.print|\.end)/.test(s)).map(s=>s.replace(/ IC=0/g,''));
 lines[0]='PT-44 v0.58 joint hot DC IF/detector/audio/power - uncalibrated';
 lines.push('* Converter injection/substitute loads and winding parameters are declared assumptions. No RF tracking claim.',`.func IFP(p,g) {${pt44IFSpiceTable(spec,'plate_current_a')}}`,`.func IFS(p,g) {${pt44IFSpiceTable(spec,'screen_current_a')}}`,'.func QIF(s) {max(s,1e-6)/100}',
 `RCP CP 0 ${a.converter_plate_ohm}`,`RCS S 0 ${a.converter_screen_ohm}`,`BDRIVE CP 0 I={${p.input_peak_a}*(1+${p.modulation}*sin(${2*Math.PI*p.audio_hz}*time))*sin(${2*Math.PI*p.carrier_hz}*time)}`,
 `C11 S 0 ${spec.factory_parameters.c11_f}`,`BIFP IP 0 I={${p.if_emission}*(V(S)>0)*QIF(V(S))^1.5*IFP(max(V(IP),0)/QIF(V(S)),V(IG)/QIF(V(S)))}`,
 `BIFS S 0 I={${p.if_emission}*(V(S)>0)*QIF(V(S))^1.5*IFS(max(V(IP),0)/QIF(V(S)),V(IG)/QIF(V(S)))}`,`BIFG IG 0 I={${p.if_emission*a.grid_current_k_a}*max(V(IG),0)^1.5}`,
 `CIG IG 0 ${a.input_capacitance_f}`,`CIP IP 0 ${a.output_capacitance_f}`,`CIGP IG IP ${a.grid_plate_capacitance_f}`);
 if(!p.screen_feed_open)lines.push(`R13 N_BPLUS_FILT S ${spec.factory_parameters.r13_ohm}`);
 const dc=spec.factory_parameters.if_winding_dcr_ohm;
 const trans=(id,t,b,i,st,sb,si,Cp,Cs)=>{lines.push(`R${id}P ${t} ${i} ${dc[id+'_primary']}`,`R${id}S ${st} ${si} ${dc[id+'_secondary']}`,`L${id}P ${i} ${b} ${c.L}`,`L${id}S ${si} ${sb} ${c.L}`,`K${id} L${id}P L${id}S ${p.coupling}`,`R${id}LP ${t} ${b} ${1/c.lossG}`,`R${id}LS ${st} ${sb} ${1/c.lossG}`);if(Cp)lines.push(`C${id}P ${t} ${b} ${Cp}`);if(Cs)lines.push(`C${id}S ${st} ${sb} ${Cs}`);};
 trans('12','CP','N_BPLUS_FILT','CW','IG',p.avc_feedback?'AVC':'0','IS',c.C*p.if1_detune*p.c12a_scale,c.C*p.if1_detune*p.c12b_scale);trans('14','IP','N_BPLUS_FILT','PW','U','H','SW',0,c.C*p.if2_detune*p.c14a_scale);
 lines.push(`R7 AVC 0 ${f.r7_ohm}`,`C8 AVC 0 ${p.c8_f}`,`BDUP U 0 I={${detector.defaults.diode_k_a*p.upper_emission}*max(V(U),0)^1.5}`,`BDLOW AVC 0 I={${detector.defaults.diode_k_a*p.lower_emission}*max(V(AVC),0)^1.5}`);
 if(!p.r17_open)lines.push(`R17 U AVC ${f.r17_ohm}`);if(p.avc_short)lines.push('RAVCSHORT AVC 0 1');
 const probe={A:'N_BPLUS_RECT',B:'N_BPLUS_FILT'}[p.probe]||p.probe;if(c.meter.resistance_ohm)lines.push(`RMETER ${probe} 0 ${c.meter.resistance_ohm}`);if(c.meter.capacitance_f)lines.push(`CMETER ${probe} 0 ${c.meter.capacitance_f}`);
 lines.push('.options method=trap maxord=2 reltol=1e-6 abstol=1e-12',`* DC operating point initializes hot equilibrium; no UIC. JS uses implicit midpoint at ${dt} s.`,`.tran ${dt} ${p.duration_s} 0 ${dt}`,'.print tran V(N_BPLUS_FILT) V(S) V(AVC) V(IG) V(IP) V(H) V(G) V(P) V(T) V(SPEAKER)','.end');return lines.join('\n')+'\n';
}
// Carrier-resolved arrival/ringdown, then the same unforced MNA with L-stable steps.
// No artificial AVC exponential, reset, or frozen supply/audio state.
function pt44IFRelease(spec,audio,power,detector,graph,input={},release={}){
 const q={duration_s:1,step_s:.0001,ringdown_s:.0002,...release};
 if(Object.keys(release).some(k=>!['duration_s','step_s','ringdown_s'].includes(k))||!Object.values(q).every(Number.isFinite)||q.duration_s<.1||q.duration_s>2||q.step_s<.000025||q.step_s>.0002||q.ringdown_s<.0001||q.ringdown_s>.001)throw Error('Unsupported AVC release domain');
 const args=[spec,audio,power,detector,graph],arrival=pt44IFSimulate(...args,input),c=pt44IFConfigure(...args,{...arrival.parameters,input_peak_a:0}),off=arrival.parameters.duration_s,initial=arrival.final;
 let state=initial,maxResidual=arrival.max_kcl_residual_a,steps=0;const samples=[initial],advance=(duration,limit,method)=>{const count=Math.ceil(duration/limit),dt=duration/count,start=state.time_s;for(let n=1;n<=count;n++){state=pt44IFStep(c,state.x,start+n*dt,dt,false,0,method);maxResidual=Math.max(maxResidual,state.kcl_residual_a);steps++;if(method==='backward_euler'||n===count)samples.push(state);}};
 advance(q.ringdown_s,1/(c.p.carrier_hz*c.p.samples_per_carrier),'midpoint');
 // Bound the early step by the probe's AVC RC scale; a 10 kohm service probe is much faster than the unloaded rail.
 const meterTau=c.p.probe==='AVC'&&c.meter.resistance_ohm?c.p.c8_f*c.meter.resistance_ohm:Infinity,early=Math.min(q.duration_s-q.ringdown_s,Math.max(0,20*meterTau-q.ringdown_s));
 advance(early,Math.min(q.step_s,meterTau/50),'backward_euler');advance(q.duration_s-q.ringdown_s-early,q.step_s,'backward_euler');
 const checkpoint=t=>{const target=off+t;let i=1;while(i<samples.length-1&&samples[i].time_s<target)i++;const a=samples[i-1],b=samples[i],f=(target-a.time_s)/(b.time_s-a.time_s);return {elapsed_s:t,avc_v:a.x[13]+f*(b.x[13]-a.x[13]),if_grid_v:a.x[15]+f*(b.x[15]-a.x[15]),filtered_bplus_v:a.x[1]+f*(b.x[1]-a.x[1])};};
 const checkpoints=[.01,.05,.1,.25,.5,1,2].filter(t=>t<=q.duration_s+1e-12).map(checkpoint),startMagnitude=Math.abs(initial.x[13]),threshold=startMagnitude*.1;let recovery=null;
 for(let i=1;i<samples.length;i++)if(startMagnitude>1e-8&&Math.abs(samples[i].x[13])<=threshold&&Math.abs(samples[i-1].x[13])>threshold){const a=samples[i-1],b=samples[i];recovery=a.time_s-off+(b.time_s-a.time_s)*(Math.abs(a.x[13])-threshold)/(Math.abs(a.x[13])-Math.abs(b.x[13]));break;}
 return {kind:'avc_release',parameters:arrival.parameters,release:q,arrival_summary:arrival.summary,initial,final:state,samples,checkpoints,recovery_to_10_percent_s:recovery,max_kcl_residual_a:maxResidual,release_steps:steps,signal_off_s:off,factory_calibrated:false,full_receiver_validated:false};
}
function pt44IFReleaseSpiceDeck(spec,audio,power,detector,graph,input={},snapshot){
 const c=pt44IFConfigure(spec,audio,power,detector,graph,input);
 if(!snapshot||snapshot.x?.length!==26||!snapshot.x.every(Number.isFinite)||!Number.isFinite(snapshot.time_s))throw Error('Release export needs the post-ringdown state');
 const names=['N_BPLUS_RECT','N_BPLUS_FILT','H','W','G','P','O','K','T','X',null,null,'U','AVC','S','IG','IP','IS','PW','SW','CP','CW'],inductors={LFIELD:10,L26:11,L12P:22,L12S:23,L14P:24,L14S:25};
 const lines=pt44IFSpiceDeck(spec,audio,power,detector,graph,{...input,input_peak_a:0}).split('\n').filter(line=>line&&!/^(BDRIVE |\.options|\.tran|\.print|\.end)/.test(line)).map(line=>{const i=inductors[line.split(' ')[0]];return i===undefined?line:line+` IC=${snapshot.x[i]}`;});
 lines[0]='PT-44 v0.59 coupled AVC release continuation - uncalibrated';
 lines.push(`* Common JS post-ringdown snapshot at absolute ${snapshot.time_s} s. Validates continuation only; arrival is checked separately.`,'.ic '+names.flatMap((name,i)=>name?[`V(${name})=${snapshot.x[i]}`]:[]).join(' '),'.options method=gear maxord=2 reltol=1e-8 abstol=1e-13',`.tran .0001 ${1-(snapshot.time_s-c.p.duration_s)} 0 .0001 UIC`,'.print tran V(N_BPLUS_FILT) V(S) V(AVC) V(IG) V(P) V(T)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports){const a=require('./pt44_audio_power_v55'),p=require('./pt44_power_model_v54'),d=require('./pt44_detector_avc_v56');var pt44AudioValidate=a.validate,pt44PowerValidate=p.validate,pt44DetectorValidate=d.validate,pt44AudioTable=a.table,pt44AudioSpiceTable=a.spiceTable,pt44AudioSpiceDeck=a.spiceDeck,pt44AudioConfigure=a.configure,pt44AudioSystem=a.system,pt44AudioSolve=a.solve,pt44DetectorDiode=d.diode;module.exports={validate:pt44IFValidate,tube:pt44IFTube,configure:pt44IFConfigure,system:pt44IFSystem,step:pt44IFStep,simulate:pt44IFSimulate,release:pt44IFRelease,releaseSpiceDeck:pt44IFReleaseSpiceDeck,spiceDeck:pt44IFSpiceDeck};}
