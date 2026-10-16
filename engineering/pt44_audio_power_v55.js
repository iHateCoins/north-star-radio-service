// Joint audio/supply MNA. Factory wiring and passives come from the explicit specification.
// Sparse tube curves, grid current, transformer and residual RF/IF demand remain declared approximations.
function pt44AudioInterpolate(axis,values,x){
 if(x<=axis[0])return values[0];if(x>=axis.at(-1))return values.at(-1);
 let i=0;while(axis[i+1]<x)i++;const f=(x-axis[i])/(axis[i+1]-axis[i]);return values[i]+f*(values[i+1]-values[i]);
}
function pt44AudioTable(table,kind,plate,grid){
 const axis=table.grid_v,rows=table[kind];if(grid<=axis[0])return pt44AudioInterpolate(table.plate_v,rows[0],plate);if(grid>=axis[axis.length-1])return pt44AudioInterpolate(table.plate_v,rows[rows.length-1],plate);
 let i=0;while(axis[i+1]<grid)i++;const u=pt44AudioInterpolate(table.plate_v,rows[i],plate),v=pt44AudioInterpolate(table.plate_v,rows[i+1],plate);return u+(v-u)*(grid-axis[i])/(axis[i+1]-axis[i]);
}
function pt44AudioTriode(spec,plate,grid,emission=1){return emission*pt44AudioTable(spec.curves.triode,'plate_current_a',Math.max(0,plate),grid);}
function pt44AudioOutput(spec,plate,screen,grid,emission=1){
 if(screen<=0||emission===0)return {plate_a:0,screen_a:0,grid_a:0};const t=spec.curves.output,q=screen/t.reference_screen_v,scale=emission*Math.pow(q,1.5),p=Math.max(0,plate)/q,g=grid/q;
 return {plate_a:scale*pt44AudioTable(t,'plate_current_a',p,g),screen_a:scale*pt44AudioTable(t,'screen_current_a',p,g),grid_a:emission*spec.assumptions.output_grid_k_a*Math.pow(Math.max(0,grid),1.5)};
}
function pt44AudioValidate(spec,graph){
 const values={c15_f:250e-12,c18_f:1e-8,r19_ohm:4.7e6,c20_f:1e-8,r21_ohm:470e3,c22_f:250e-12,r23_ohm:470e3,r24_ohm:130,c25_f:2e-8};
 for(const [k,v] of Object.entries(values))if(Math.abs(spec.factory_parameters[k]-v)>Math.abs(v)*1e-12)throw Error('Unreviewed audio factory value '+k);
 const map=new Map();for(const n of graph.factory_nets)for(const t of n.factory_members){if(map.has(t))throw Error('Duplicate factory terminal '+t);map.set(t,n.id);}
 for(const [t,n] of Object.entries(spec.factory_terminal_nets))if(map.get(t)!==n)throw Error('Audio source topology mismatch '+t);
 for(const t of Object.values(spec.curves)){
  for(const axis of [t.plate_v,t.grid_v])if(axis.some((v,i)=>!Number.isFinite(v)||(i&&v<=axis[i-1])))throw Error('Invalid tube curve axis');
  for(const key of ['plate_current_a',...(t.screen_current_a?['screen_current_a']:[])])if(t[key].length!==t.grid_v.length||t[key].some(row=>row.length!==t.plate_v.length||row.some(v=>!Number.isFinite(v)||v<0)))throw Error('Invalid tube current table');
 }
 if(spec.acceptance.benchmark_ready||spec.acceptance.full_receiver_loads_connected||spec.acceptance.factory_voltage_calibrated)throw Error('Audio subset cannot certify full receiver');return true;
}
function pt44AudioConfigure(spec,powerSpec,graph,input={}){
 pt44AudioValidate(spec,graph);const a=spec.assumptions,n=spec.numerical_contract;
 const defaults={cap_a_scale:1,rectifier_emission:1,rectifier_model:powerSpec.assumed_parameters.rectifier_model,line_v:115,line_mode:'AC',line_hz:60,volume:.6,signal_peak_v:.05,signal_hz:1000,signal_start_s:n.signal_start_s,duration_s:n.duration_s,dt_s:n.dt_s,triode_emission:1,output_emission:1,c18_scale:1,c20_scale:1,c20_leak_ohm:null,speaker_open:false,cap_b_scale:1,field_open:false,rf_if_load_ohm:a.rf_if_load_ohm,primary_dcr_ohm:a.primary_dcr_ohm,primary_magnetizing_h:a.primary_magnetizing_h,reflected_speaker_ohm:a.reflected_speaker_ohm,volume_track_ohm:a.volume_track_ohm,detector_source_ohm:a.detector_source_ohm,meter:'ideal',probe:'P',power_off_at_s:null};
 for(const k of Object.keys(input))if(!(k in defaults))throw Error('Unknown audio input '+k);const p={...defaults,...input};
 for(const k of Object.keys(defaults).filter(k=>typeof defaults[k]==='number'))if(!Number.isFinite(p[k])||p[k]<0)throw Error('Audio input must be finite and nonnegative: '+k);
 for(const k of ['line_hz','signal_hz','duration_s','dt_s','rf_if_load_ohm','primary_dcr_ohm','primary_magnetizing_h','reflected_speaker_ohm','volume_track_ohm','detector_source_ohm'])if(p[k]<=0)throw Error('Audio input must be positive: '+k);
 if(p.c20_leak_ohm!==null&&(!Number.isFinite(p.c20_leak_ohm)||p.c20_leak_ohm<=0))throw Error('Invalid coupling leakage');
 if(p.power_off_at_s!==null&&(!Number.isFinite(p.power_off_at_s)||p.power_off_at_s<0))throw Error('Invalid switch-off time');
 if(p.volume>1||p.signal_peak_v>2||p.signal_hz>5000||p.duration_s>2||p.duration_s<p.dt_s*10||p.signal_start_s>p.duration_s||p.duration_s/p.dt_s>250000||p.dt_s>1/24000||p.triode_emission>2||p.output_emission>2||p.rectifier_emission>2||typeof p.speaker_open!=='boolean'||typeof p.field_open!=='boolean')throw Error('Unsupported audio simulation domain');
 const meter=spec.measurement_contract.meters.find(m=>m.id===p.meter),nodes=['A','B','H','W','G','P','O','K','T','X'];if(!meter||!nodes.includes(p.probe))throw Error('Invalid service probe');
 const pc=pt44PowerConfigure(powerSpec,graph,{emission:p.rectifier_emission,cap_a_scale:p.cap_a_scale,rectifier_model:p.rectifier_model,line_v:p.line_v,line_mode:p.line_mode,line_hz:p.line_hz,cap_b_scale:p.cap_b_scale,field_open:p.field_open,power_off_at_s:p.power_off_at_s});
 return {spec,powerSpec,graph,p,pc,meter,nodes,N:12,ratio:Math.sqrt(p.reflected_speaker_ohm/a.speaker_ohm)};
}
function pt44AudioSolve(matrix,rhs){
 const n=rhs.length,a=matrix.map((r,i)=>[...r,rhs[i]]);
 for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;if(Math.abs(a[pivot][k])<1e-18)throw Error('Singular audio circuit');[a[k],a[pivot]]=[a[pivot],a[k]];for(let i=k+1;i<n;i++){const f=a[i][k]/a[k][k];if(!f)continue;for(let j=k+1;j<=n;j++)a[i][j]-=f*a[k][j];}}
 const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=a[i][n];for(let j=i+1;j<n;j++)s-=a[i][j]*x[j];x[i]=s/a[i][i];}return x;
}
function pt44AudioSystem(c,x,prev,time,dt){
 const {p,pc,spec,N}=c,f=spec.factory_parameters,a=spec.assumptions,M=Array.from({length:N},()=>Array(N).fill(0)),F=Array(N).fill(0),v=i=>i<0?0:x[i],old=i=>i<0?0:prev[i];
 const branch=(i,j,current,derivatives)=>{if(i>=0)F[i]+=current;if(j>=0)F[j]-=current;for(const [k,d] of derivatives){if(i>=0)M[i][k]+=d;if(j>=0)M[j][k]-=d;}};
 const conduct=(i,j,g)=>branch(i,j,g*(v(i)-v(j)),[[i,g],[j,-g]].filter(([k])=>k>=0));
 const cap=(i,j,C)=>{const g=C/dt;branch(i,j,g*(v(i)-v(j)-old(i)+old(j)),[[i,g],[j,-g]].filter(([k])=>k>=0));};
 const nonlinear=(i,j,controls,fn)=>{const current=fn(x),d=controls.map(k=>{const h=1e-7*Math.max(1,Math.abs(x[k])),z=x.slice();z[k]+=h;const plus=fn(z);z[k]-=2*h;return [k,(plus-fn(z))/(2*h)];});branch(i,j,current,d);};
 const on=p.power_off_at_s===null||time<p.power_off_at_s,line=on?(p.line_mode==='DC'?p.line_v:Math.SQRT2*p.line_v*Math.sin(2*Math.PI*p.line_hz*time)):0,rect=pt44PowerRectifier(pc,line*pc.plateRatio,x[0],on);
 branch(0,-1,-rect.current_a,[[0,rect.conductance_s]]);cap(0,-1,pc.capA);cap(1,-1,pc.capB);cap(1,-1,f.c25_f);conduct(1,-1,1/p.rf_if_load_ohm);
 // Field current and transformer magnetization are independent state variables.
 branch(0,1,p.field_open?0:x[10],p.field_open?[]:[[10,1]]);
 if(p.field_open){F[10]=x[10];M[10][10]=1;}else{F[10]=pc.fieldR*x[10]+pc.fieldL*(x[10]-prev[10])/dt-x[0]+x[1];M[10][10]=pc.fieldR+pc.fieldL/dt;M[10][0]=-1;M[10][1]=1;}
 const signal=time>=p.signal_start_s?p.signal_peak_v*Math.sin(2*Math.PI*p.signal_hz*(time-p.signal_start_s)):0;
 branch(2,-1,(x[2]-signal)/p.detector_source_ohm,[[2,1/p.detector_source_ohm]]);cap(2,-1,f.c15_f);
 conduct(2,3,1/Math.max(1,p.volume_track_ohm*(1-p.volume)));conduct(3,-1,1/Math.max(1,p.volume_track_ohm*p.volume));
 cap(3,4,f.c18_f*p.c18_scale);conduct(4,-1,1/f.r19_ohm);conduct(1,5,1/f.r21_ohm);
 nonlinear(5,-1,[5,4],z=>pt44AudioTriode(spec,z[5],z[4],p.triode_emission));
 nonlinear(4,-1,[4],z=>p.triode_emission*a.triode_grid_i0_a*Math.exp(Math.min(5,z[4]/a.triode_grid_thermal_v)));
 cap(5,6,f.c20_f*p.c20_scale);if(p.c20_leak_ohm!==null)conduct(5,6,1/p.c20_leak_ohm);conduct(6,-1,1/f.r23_ohm);conduct(7,-1,1/f.r24_ohm);cap(7,-1,f.c22_f);
 const out=z=>pt44AudioOutput(spec,z[8]-z[7],z[1]-z[7],z[6]-z[7],p.output_emission);
 nonlinear(8,7,[8,7,1,6],z=>out(z).plate_a);nonlinear(1,7,[8,7,1,6],z=>out(z).screen_a);nonlinear(6,7,[7,6,1],z=>out(z).grid_a);
 conduct(0,9,1/p.primary_dcr_ohm);if(!p.speaker_open)conduct(9,8,1/p.reflected_speaker_ohm);branch(9,8,x[11],[[11,1]]);
 F[11]=p.primary_magnetizing_h*(x[11]-prev[11])/dt-x[9]+x[8];M[11][11]=p.primary_magnetizing_h/dt;M[11][9]=-1;M[11][8]=1;
 const probe=c.nodes.indexOf(p.probe);if(c.meter.resistance_ohm)conduct(probe,-1,1/c.meter.resistance_ohm);cap(probe,-1,c.meter.capacitance_f);
 return {M,F,rect,signal};
}
function pt44AudioStep(c,previous,time,dt){
 const old=previous.x;let x=old.slice(),system,residual=Infinity;
 const norm=F=>Math.max(...F.map((v,i)=>Math.abs(v)/(i<10?1:1000)));
 for(let n=0;n<30;n++){
  system=pt44AudioSystem(c,x,old,time,dt);residual=norm(system.F);if(residual<2e-10)break;
  const dx=pt44AudioSolve(system.M,system.F.map(v=>-v));let alpha=1,candidate;
  for(let ls=0;ls<12;ls++){candidate=x.map((v,i)=>v+alpha*dx[i]);if(norm(pt44AudioSystem(c,candidate,old,time,dt).F)<residual||alpha<.0005)break;alpha/=2;}x=candidate;
 }
 system=pt44AudioSystem(c,x,old,time,dt);residual=norm(system.F);if(!x.every(Number.isFinite)||residual>1e-7)throw Error('Audio Newton convergence failed at '+time+' s ('+residual+')');
 const out=pt44AudioOutput(c.spec,x[8]-x[7],x[1]-x[7],x[6]-x[7],c.p.output_emission),tri=pt44AudioTriode(c.spec,x[5],x[4],c.p.triode_emission);
 return {time_s:time,x,reservoir_v:x[0],filtered_v:x[1],triode_grid_v:x[4],triode_plate_v:x[5],output_grid_v:x[6],cathode_v:x[7],output_plate_v:x[8],speaker_v:(x[9]-x[8])/c.ratio,field_current_a:c.p.field_open?0:x[10],rectifier_current_a:system.rect.current_a,heater_current_a:system.rect.plate_v/c.pc.heaterR,triode_current_a:tri,output_current_a:out.plate_a,screen_current_a:out.screen_a,grid_bias_v:x[6]-x[7],kcl_residual_a:residual};
}
function pt44AudioStatistics(samples,from,to,signalHz,speakerOhm){
 const keys=['reservoir_v','filtered_v','triode_grid_v','triode_plate_v','output_grid_v','cathode_v','output_plate_v','speaker_v','field_current_a','rectifier_current_a','heater_current_a','triode_current_a','output_current_a','screen_current_a','grid_bias_v'];const selected=samples.filter(s=>s.time_s>=from-1e-10&&s.time_s<=to+1e-10),T=to-from;if(selected.length<5)throw Error('Audio measurement window too short');
 const summary={};for(const k of keys){let area=0,square=0,min=Infinity,max=-Infinity;for(let j=1;j<selected.length;j++){const u=selected[j-1],v=selected[j],d=v.time_s-u.time_s;area+=(u[k]+v[k])*d/2;square+=(u[k]**2+u[k]*v[k]+v[k]**2)*d/3;min=Math.min(min,u[k],v[k]);max=Math.max(max,u[k],v[k]);}const t=selected.at(-1).time_s-selected[0].time_s,mean=area/t;summary[k]={mean,rms:Math.sqrt(Math.max(0,square/t)),ac_rms:Math.sqrt(Math.max(0,square/t-mean**2)),min,max,peak_to_peak:max-min};}
 const amplitudes=[];for(let h=1;h<=5;h++){let sine=0,cosine=0;for(let j=1;j<selected.length;j++){const u=selected[j-1],v=selected[j],d=v.time_s-u.time_s,w=2*Math.PI*signalHz*h;cosine+=d*(u.speaker_v*Math.cos(w*u.time_s)+v.speaker_v*Math.cos(w*v.time_s))/T;sine+=d*(u.speaker_v*Math.sin(w*u.time_s)+v.speaker_v*Math.sin(w*v.time_s))/T;}amplitudes.push(Math.hypot(sine,cosine));}
 return {nodes:summary,fundamental_peak_v:amplitudes[0],harmonics_peak_v:amplitudes,thd_2_to_5:amplitudes[0]>1e-6?Math.hypot(...amplitudes.slice(1))/amplitudes[0]:null,speaker_ac_w:summary.speaker_v.ac_rms**2/speakerOhm,window_s:[from,to]};
}
function pt44AudioSimulate(spec,powerSpec,graph,input={}){
 const c=pt44AudioConfigure(spec,powerSpec,graph,input),p=c.p,count=Math.ceil(p.duration_s/p.dt_s),dt=p.duration_s/count;let state={x:Array(c.N).fill(0)},samples=[],maxResidual=0,curveLimitSamples=0,startupCurveLimitSamples=0;
 for(let n=1;n<=count;n++){state=pt44AudioStep(c,state,n*dt,dt);samples.push(state);maxResidual=Math.max(maxResidual,state.kcl_residual_a);const q=(state.filtered_v-state.cathode_v)/110;if(state.triode_plate_v>250||state.triode_grid_v>1||(q>0&&((state.output_plate_v-state.cathode_v)/q>400||(state.output_grid_v-state.cathode_v)/q>6))){if(state.time_s>=Math.max(p.duration_s-.1,p.signal_start_s))curveLimitSamples++;else startupCurveLimitSamples++;}}
 const from=Math.max(p.duration_s-.1,p.signal_start_s),summary=pt44AudioStatistics(samples,from,p.duration_s,p.signal_hz,spec.assumptions.speaker_ohm);
 if(p.speaker_open)summary.speaker_ac_w=0;
 return {samples,final:state,summary,curve_limit_samples:curveLimitSamples,startup_curve_limit_samples:startupCurveLimitSamples,max_kcl_residual_a:maxResidual,parameters:p,full_receiver_validated:false,factory_calibrated:false};
}
function pt44AudioSpiceLinear(axis,values,x){let expression=String(values.at(-1));for(let i=axis.length-2;i>=0;i--)expression=`(${x}<${axis[i+1]}?(${values[i]}+(${values[i+1]-values[i]})*(${x}-${axis[i]})/${axis[i+1]-axis[i]}):${expression})`;return `(${x}<=${axis[0]}?${values[0]}:${expression})`;}
function pt44AudioSpiceTable(t,key){const rows=t[key].map(row=>pt44AudioSpiceLinear(t.plate_v,row,'p'));let expression=rows.at(-1);for(let i=t.grid_v.length-2;i>=0;i--)expression=`(g<${t.grid_v[i+1]}?(${rows[i]}+(${rows[i+1]}-${rows[i]})*(g-(${t.grid_v[i]}))/${t.grid_v[i+1]-t.grid_v[i]}):${expression})`;return `(g<=${t.grid_v[0]}?${rows[0]}:${expression})`;}
function pt44AudioSpiceDeck(spec,powerSpec,graph,input={}){
 const c=pt44AudioConfigure(spec,powerSpec,graph,input),{p}=c,f=spec.factory_parameters,a=spec.assumptions;
 let lines=pt44PowerSpiceDeck(powerSpec,graph,{emission:p.rectifier_emission,cap_a_scale:p.cap_a_scale,rectifier_model:p.rectifier_model,line_v:p.line_v,line_mode:p.line_mode,line_hz:p.line_hz,cap_b_scale:p.cap_b_scale,field_open:p.field_open,power_off_at_s:p.power_off_at_s,dt_s:p.dt_s,duration_s:p.duration_s}).split('\n').filter(s=>s&&!/^(RLOAD_|\.tran|\.print|\.end)/.test(s));lines[0]='PT-44 v0.55 coupled audio/power - uncalibrated explicit parameters';
 lines.push('* A/B are supplied rails. Transformer secondary is reflected, not galvanically bonded to B-minus.',`.func TRI(p,g) {${pt44AudioSpiceTable(spec.curves.triode,'plate_current_a')}}`,`.func OUTP(p,g) {${pt44AudioSpiceTable(spec.curves.output,'plate_current_a')}}`,`.func OUTS(p,g) {${pt44AudioSpiceTable(spec.curves.output,'screen_current_a')}}`,`.func Q(s) {max(s,1e-6)/110}`,`RRF N_BPLUS_FILT 0 ${p.rf_if_load_ohm}`,`C25 N_BPLUS_FILT 0 ${f.c25_f}`,
 `BSIGNAL INPUT 0 V={${p.signal_peak_v}*sin(${2*Math.PI*p.signal_hz}*(time-${p.signal_start_s}))*(time >= ${p.signal_start_s})}`,`RDET INPUT H ${p.detector_source_ohm}`,`C15 H 0 ${f.c15_f}`,`R16TOP H W ${Math.max(1,p.volume_track_ohm*(1-p.volume))}`,`R16BOT W 0 ${Math.max(1,p.volume_track_ohm*p.volume)}`,`R19 G 0 ${f.r19_ohm}`,`R21 N_BPLUS_FILT P ${f.r21_ohm}`,`BTRI P 0 I={${p.triode_emission}*TRI(max(V(P),0),V(G))}`,`BTRIG G 0 I={${p.triode_emission*a.triode_grid_i0_a}*exp(min(5,V(G)/${a.triode_grid_thermal_v}))}`,`R23 O 0 ${f.r23_ohm}`,`R24 K 0 ${f.r24_ohm}`,`C22 K 0 ${f.c22_f}`,`BOP T K I={${p.output_emission}*(V(N_BPLUS_FILT,K)>0)*Q(V(N_BPLUS_FILT,K))^1.5*OUTP(max(V(T,K),0)/Q(V(N_BPLUS_FILT,K)),V(O,K)/Q(V(N_BPLUS_FILT,K)))}`,`BOS N_BPLUS_FILT K I={${p.output_emission}*(V(N_BPLUS_FILT,K)>0)*Q(V(N_BPLUS_FILT,K))^1.5*OUTS(max(V(T,K),0)/Q(V(N_BPLUS_FILT,K)),V(O,K)/Q(V(N_BPLUS_FILT,K)))}`,`BOG O K I={${p.output_emission*a.output_grid_k_a}*(V(N_BPLUS_FILT,K)>0)*max(V(O,K),0)^1.5}`,`R26 N_BPLUS_RECT X ${p.primary_dcr_ohm}`,`L26 X T ${p.primary_magnetizing_h} IC=0`,`BSPEAKER SPEAKER 0 V={V(X,T)/${c.ratio}}`);
 if(p.c18_scale>0)lines.push(`C18 W G ${f.c18_f*p.c18_scale} IC=0`);if(p.c20_scale>0)lines.push(`C20 P O ${f.c20_f*p.c20_scale} IC=0`);if(p.c20_leak_ohm!==null)lines.push(`R20LEAK P O ${p.c20_leak_ohm}`);if(!p.speaker_open)lines.push(`RREF X T ${p.reflected_speaker_ohm}`);
 const probe=c.nodes.indexOf(p.probe),node=['N_BPLUS_RECT','N_BPLUS_FILT','H','W','G','P','O','K','T','X'][probe];if(c.meter.resistance_ohm)lines.push(`RMETER ${node} 0 ${c.meter.resistance_ohm}`);if(c.meter.capacitance_f)lines.push(`CMETER ${node} 0 ${c.meter.capacitance_f}`);
 lines.push(`.tran ${p.dt_s} ${p.duration_s} ${Math.max(p.duration_s-.1,p.signal_start_s)} ${p.dt_s} UIC`,'.print tran V(N_BPLUS_RECT) V(N_BPLUS_FILT) V(P) V(K) V(O) V(SPEAKER)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports){const pc=require('./pt44_power_model_v54.js');var pt44PowerConfigure=pc.configure,pt44PowerRectifier=pc.rectifier,pt44PowerSpiceDeck=pc.spiceDeck;module.exports={table:pt44AudioTable,spiceTable:pt44AudioSpiceTable,validate:pt44AudioValidate,configure:pt44AudioConfigure,triode:pt44AudioTriode,output:pt44AudioOutput,solve:pt44AudioSolve,system:pt44AudioSystem,step:pt44AudioStep,simulate:pt44AudioSimulate,statistics:pt44AudioStatistics,spiceDeck:pt44AudioSpiceDeck};}
