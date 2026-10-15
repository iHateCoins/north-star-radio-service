// Shared browser/Node power core. Source topology and model assumptions are supplied explicitly.
// Backward Euler keeps capacitor/field-inductor state; no factory-voltage fitting occurs here.
function pt44PowerValidate(spec,graph){
 const expected={cap_29a_f:20e-6,cap_29b_f:20e-6,field_dcr_ohm:500,dropper_40_ohm:40,dropper_80_ohm:80,line_nominal_v:115};
 for(const [k,v] of Object.entries(expected))if(spec.factory_parameters[k]!==v)throw Error('Unreviewed factory power value '+k);
 const map=new Map();for(const n of graph.factory_nets)for(const t of n.factory_members){if(map.has(t))throw Error('Duplicate source terminal '+t);map.set(t,n.id);}
 for(const [t,n] of Object.entries(spec.factory_terminal_nets))if(map.get(t)!==n)throw Error('Power topology source mismatch '+t);
 if(graph.factory_nets.find(n=>n.id==='F_BMINUS')?.factory_members.includes('__CHASSIS__'))throw Error('B-minus cannot be fused with chassis');
 for(const id of ['ge_legacy','rca_1947']){const m=spec.rectifier_models?.[id];if(!m||m.reference_v!==(id==='ge_legacy'?18:20)||m.reference_a!==.2||Math.abs(m.perveance_a_per_v_1_5-.2/m.reference_v**1.5)>1e-14)throw Error('Unreviewed rectifier curve '+id);if(JSON.stringify(m.checked_forward_range_v)!==JSON.stringify(id==='rca_1947'?[5,40]:null))throw Error('Unreviewed rectifier curve range');}
 const d=spec.rectifier_approximation;if(Math.abs(d.perveance_a_per_v_1_5-d.reference_a/Math.pow(d.reference_v,1.5))>1e-14)throw Error('Rectifier reference-point derivation changed');
 if(spec.acceptance.factory_voltage_calibrated||spec.acceptance.full_receiver_loads_connected||spec.acceptance.benchmark_ready)throw Error('Uncalibrated power model cannot certify receiver completion');
 return true;
}
function pt44PowerConfigure(spec,graph,input={}){
 pt44PowerValidate(spec,graph);
 const allowed=new Set([...Object.keys(spec.assumed_parameters),'line_v','cap_a_scale','cap_b_scale','leak_a_ohm','leak_b_ohm','field_open','power_off_at_s','dt_s','duration_s','initial','load_laws','coupled_load_law']);
 for(const k of Object.keys(input))if(!allowed.has(k))throw Error('Unknown power input '+k);
 const p={...spec.assumed_parameters,line_v:spec.factory_parameters.line_nominal_v,cap_a_scale:1,cap_b_scale:1,leak_a_ohm:null,leak_b_ohm:null,field_open:false,power_off_at_s:null,dt_s:spec.numerical_contract.default_dt_s,duration_s:spec.numerical_contract.default_duration_s,...input};
 for(const k of ['line_v','source_resistance_ohm','field_inductance_h','emission','cap_a_scale','cap_b_scale'])if(!Number.isFinite(p[k])||p[k]<0)throw Error('Power input must be finite and nonnegative: '+k);
 for(const k of ['line_hz','load_rect_ohm','load_filtered_ohm','hot_heater_resistance_ohm','dt_s','duration_s'])if(!Number.isFinite(p[k])||p[k]<=0)throw Error('Power input must be finite and positive: '+k);
 for(const k of ['lamp_hot_resistance_ohm','leak_a_ohm','leak_b_ohm'])if(p[k]!==null&&(!Number.isFinite(p[k])||p[k]<=0))throw Error('Resistance must be positive or null (open): '+k);
 if(p.power_off_at_s!==null&&(!Number.isFinite(p.power_off_at_s)||p.power_off_at_s<0))throw Error('Invalid switch-off time');
 if(!['AC','DC'].includes(p.line_mode)||![1,-1].includes(p.dc_polarity)||typeof p.field_open!=='boolean'||p.emission>2||p.line_v>250||p.line_hz<40||p.line_hz>100||p.duration_s>20||p.dt_s>1/(p.line_hz*100)||p.duration_s/p.dt_s>1000000)throw Error('Power input outside supported numerical domain');
 if(p.coupled_load_law&&(typeof p.coupled_load_law!=='function'||p.load_laws))throw Error('Use one coupled load function or two independent load callbacks');
 if(p.load_laws&&(!p.load_laws.rectifier||!p.load_laws.filtered))throw Error('Both load callbacks are required');
 if(!Object.hasOwn(spec.rectifier_models,p.rectifier_model))throw Error('Unknown rectifier model');
 const f=spec.factory_parameters,rParallel=p.lamp_hot_resistance_ohm===null?f.dropper_40_ohm:1/(1/f.dropper_40_ohm+1/p.lamp_hot_resistance_ohm),rHeater=f.dropper_80_ohm+p.hot_heater_resistance_ohm,rLine=p.source_resistance_ohm+rParallel;
 return {spec,p,capA:f.cap_29a_f*p.cap_a_scale,capB:f.cap_29b_f*p.cap_b_scale,fieldR:f.field_dcr_ohm,fieldL:p.field_inductance_h,plateRatio:rHeater/(rHeater+rLine),plateR:rHeater*rLine/(rHeater+rLine),heaterR:rHeater,rectK:spec.rectifier_models[p.rectifier_model].perveance_a_per_v_1_5*p.emission};
}
function pt44PowerRectifier(c,anodeTheveninV,cathodeV,on=true){
 const head=anodeTheveninV-cathodeV;if(!on||head<=0||c.rectK===0)return {current_a:0,conductance_s:0,plate_v:anodeTheveninV,forward_drop_v:0};
 // Solve the monotonic local relation x + R*K*x^(3/2) = available voltage.
 let lo=0,hi=head,x=head/(1+c.plateR*c.rectK*Math.sqrt(head));
 for(let i=0;i<24;i++){const y=x+c.plateR*c.rectK*Math.pow(x,1.5)-head;if(Math.abs(y)<1e-10)break;if(y>0)hi=x;else lo=x;const next=x-y/(1+1.5*c.plateR*c.rectK*Math.sqrt(x));x=next>lo&&next<hi?next:(lo+hi)/2;}
 const current=c.rectK*Math.pow(x,1.5),g=1.5*c.rectK*Math.sqrt(x);
 return {current_a:current,conductance_s:g/(1+c.plateR*g),plate_v:anodeTheveninV-c.plateR*current,forward_drop_v:x};
}
function pt44PowerLoad(c,port,v,t){
 const fn=c.p.load_laws?.[port];const resistance=port==='rectifier'?c.p.load_rect_ohm:c.p.load_filtered_ohm;
 const x=fn?fn(v,t):{current_a:v/resistance,conductance_s:1/resistance};
 if(!x||!Number.isFinite(x.current_a)||!Number.isFinite(x.conductance_s)||x.conductance_s<0)throw Error('Load callback must return finite current and nonnegative differential conductance');
 return x;
}
function pt44PowerLoads(c,a,b,t){
 if(!c.p.coupled_load_law){const x=pt44PowerLoad(c,'rectifier',a,t),y=pt44PowerLoad(c,'filtered',b,t);return {currents_a:[x.current_a,y.current_a],jacobian_s:[[x.conductance_s,0],[0,y.conductance_s]]};}
 const x=c.p.coupled_load_law({reservoir_v:a,filtered_v:b},t);
 if(!x||x.currents_a?.length!==2||x.jacobian_s?.length!==2||x.jacobian_s.some(r=>r.length!==2)||!x.currents_a.every(Number.isFinite)||!x.jacobian_s.flat().every(Number.isFinite)||x.jacobian_s[0][0]<0||x.jacobian_s[1][1]<0)throw Error('Coupled load must return two finite currents and a finite 2x2 Jacobian with nonnegative diagonal');
 return x;
}
function pt44PowerStep(c,previous,time,dt){
 const p=c.p,on=p.power_off_at_s===null||time<p.power_off_at_s;
 const input=on?(p.line_mode==='DC'?p.line_v*p.dc_polarity:Math.SQRT2*p.line_v*Math.sin(2*Math.PI*p.line_hz*time)):0,th=input*c.plateRatio;
 const ga=c.capA/dt,gb=c.capB/dt,la=p.leak_a_ohm===null?0:1/p.leak_a_ohm,lb=p.leak_b_ohm===null?0:1/p.leak_b_ohm;
 const z=c.fieldR+c.fieldL/dt,k=c.fieldL/dt;
 let a=previous.reservoir_v,b=previous.filtered_v,i=c.p.field_open?0:previous.field_current_a,residual=Infinity,rect;
 for(let n=0;n<24;n++){
  rect=pt44PowerRectifier(c,th,a,on);const loads=pt44PowerLoads(c,a,b,time);
  const fa=ga*(a-previous.reservoir_v)+la*a+loads.currents_a[0]+i-rect.current_a;
  const fb=gb*(b-previous.filtered_v)+lb*b+loads.currents_a[1]-i;
  const fi=c.p.field_open?i:z*i-a+b-k*previous.field_current_a;
  residual=Math.max(Math.abs(fa),Math.abs(fb),Math.abs(fi)/Math.max(1,z));
  if(residual<1e-10)break;
  const j=loads.jacobian_s,aa=ga+la+j[0][0]+rect.conductance_s,bb=gb+lb+j[1][1],fieldG=c.p.field_open?0:1/z;
  const A=aa+fieldG,B=j[0][1]-fieldG,C=j[1][0]-fieldG,D=bb+fieldG,rhsA=-fa+fi*fieldG,rhsB=-fb-fi*fieldG,det=A*D-B*C;
  if(!Number.isFinite(det)||Math.abs(det)<1e-24)throw Error('Singular coupled receiver load Jacobian');
  const da=(rhsA*D-B*rhsB)/det,db=(A*rhsB-C*rhsA)/det,di=c.p.field_open?0:(da-db-fi)/z;
  a+=da;b+=db;i+=di;
  if(![a,b,i].every(Number.isFinite))throw Error('Nonfinite power integration state');
 }
 if(residual>1e-7)throw Error('Power solver did not converge');
 rect=pt44PowerRectifier(c,th,a,on);
 return {time_s:time,reservoir_v:a,filtered_v:b,field_current_a:i,rectifier_current_a:rect.current_a,rectifier_forward_drop_v:rect.forward_drop_v,plate_v:rect.plate_v,heater_current_a:rect.plate_v/c.heaterR,kcl_residual_a:residual};
}
function pt44PowerSummary(samples,from,to){
 const keys=['reservoir_v','filtered_v','field_current_a','rectifier_current_a','heater_current_a'];const accum=Object.fromEntries(keys.map(k=>[k,{integral:0,square:0,min:Infinity,max:-Infinity}]));let duration=0;
 for(let j=1;j<samples.length;j++){
  const left=samples[j-1],right=samples[j],a=Math.max(from,left.time_s),b=Math.min(to,right.time_s);if(b<=a)continue;
  const interpolate=(key,t)=>left[key]+(right[key]-left[key])*(t-left.time_s)/(right.time_s-left.time_s);
  const dt=b-a;duration+=dt;
  for(const key of keys){const va=interpolate(key,a),vb=interpolate(key,b),x=accum[key];x.integral+=(va+vb)*dt/2;x.square+=(va*va+va*vb+vb*vb)*dt/3;x.min=Math.min(x.min,va,vb);x.max=Math.max(x.max,va,vb);}
 }
 if(duration<=0)throw Error('No samples in power measurement window');
 const result={duration_s:duration};for(const key of keys){const x=accum[key],mean=x.integral/duration;result[key]={mean,rms:Math.sqrt(Math.max(0,x.square/duration)),ripple_rms:Math.sqrt(Math.max(0,x.square/duration-mean*mean)),peak_to_peak:x.max-x.min,min:x.min,max:x.max};}return result;
}
function pt44PowerSimulate(spec,graph,input={}){
 const c=pt44PowerConfigure(spec,graph,input),p=c.p;
 const initial=p.initial||{reservoir_v:0,filtered_v:0,field_current_a:0};
 if(!['reservoir_v','filtered_v','field_current_a'].every(k=>Number.isFinite(initial[k])))throw Error('Invalid initial power state');
 let state={time_s:0,...initial,rectifier_current_a:0,heater_current_a:0,plate_v:0,kcl_residual_a:0};const samples=[state];let maxResidual=0;
 const count=Math.ceil(p.duration_s/p.dt_s),dt=p.duration_s/count;
 for(let n=1;n<=count;n++){state=pt44PowerStep(c,state,n*dt,dt);samples.push(state);maxResidual=Math.max(maxResidual,state.kcl_residual_a);}
 const from=Math.max(0,p.duration_s-spec.numerical_contract.report_cycles/p.line_hz),summary=pt44PowerSummary(samples,from,p.duration_s);
 const range=spec.rectifier_models[p.rectifier_model].checked_forward_range_v,coverage=from=>{const conducting=samples.filter(s=>s.time_s>=from&&s.rectifier_current_a>1e-12),outside=range?conducting.filter(s=>s.rectifier_forward_drop_v<range[0]||s.rectifier_forward_drop_v>range[1]).length:null;return {conducting_steps:conducting.length,outside_checked_curve_steps:outside,max_forward_drop_v:conducting.length?conducting.reduce((v,s)=>Math.max(v,s.rectifier_forward_drop_v),0):null};};
 return {samples,final:state,summary,rectifier_curve_coverage:{model:p.rectifier_model,emission_scale:p.emission,reference_perveance_unscaled:p.emission===1,checked_forward_range_v:range,whole_run:coverage(0),measurement_window:coverage(from)},measurement_from_s:from,max_kcl_residual_a:maxResidual,parameters:{...p,load_laws:undefined,coupled_load_law:undefined},model_calibrated:false,receiver_complete:false};
}
function pt44PowerSpiceDeck(spec,graph,input={}){
 const c=pt44PowerConfigure(spec,graph,input),p=c.p;
 if(p.load_laws||p.coupled_load_law)throw Error('Custom load callbacks require a separately reviewed SPICE load model');
 if(p.initial)throw Error('Custom initial states are not supported by this SPICE exporter');
 const r=spec.factory_parameters,off=p.power_off_at_s;
 const source=p.line_mode==='DC'?String(p.line_v*p.dc_polarity):`SIN(0 ${Math.SQRT2*p.line_v} ${p.line_hz})`;
 const lineExpression=p.line_mode==='DC'?String(p.line_v*p.dc_polarity):`${Math.SQRT2*p.line_v}*sin(${2*3.141592653589793*p.line_hz}*time)`;
 const lines=['PT-44 v0.54 dynamic power model - explicitly uncalibrated parameters','* Factory topology: Philco p.38. Load resistors, field L and lamp hot R are test inputs.',`* B-minus reference; no chassis bond. Rectifier model: ${p.rectifier_model}; ${spec.rectifier_models[p.rectifier_model].evidence}`,off===null?`VMAIN LINE 0 ${source}`:`BMAIN LINE 0 V={(${lineExpression})*(time < ${off})}`,p.source_resistance_ohm>0?`RSOURCE LINE LINE_IN ${p.source_resistance_ohm}`:'VLINE_LINK LINE LINE_IN 0',`R30_40 LINE_IN PLATE ${r.dropper_40_ohm}`];
 if(p.lamp_hot_resistance_ohm!==null)lines.push(`RLAMP LINE_IN PLATE ${p.lamp_hot_resistance_ohm}`);
 lines.push(`R30_80 PLATE HEATER_IN ${r.dropper_80_ohm}`,`RHEATERS HEATER_IN 0 ${p.hot_heater_resistance_ohm}`);
 const active=off===null?'1':`(time < ${off})`;
 lines.push(`BRECT PLATE N_BPLUS_RECT I={${active}*${c.rectK}*max(V(PLATE,N_BPLUS_RECT),0)^1.5}`);
 if(c.capA>0)lines.push(`C29A N_BPLUS_RECT 0 ${c.capA} IC=0`);
 if(c.capB>0)lines.push(`C29B N_BPLUS_FILT 0 ${c.capB} IC=0`);
 if(p.leak_a_ohm!==null)lines.push(`RLEAKA N_BPLUS_RECT 0 ${p.leak_a_ohm}`);
 if(p.leak_b_ohm!==null)lines.push(`RLEAKB N_BPLUS_FILT 0 ${p.leak_b_ohm}`);
 lines.push(`RLOAD_RECT N_BPLUS_RECT 0 ${p.load_rect_ohm}`,`RLOAD_FILT N_BPLUS_FILT 0 ${p.load_filtered_ohm}`);
 if(p.field_open)lines.push('VFIELD N_BPLUS_FILT OPEN_STUB 0');
 else {lines.push('VFIELD N_BPLUS_RECT FIELD_IN 0');if(c.fieldL>0)lines.push(`R28 FIELD_IN FIELD_L ${c.fieldR}`,`LFIELD FIELD_L N_BPLUS_FILT ${c.fieldL} IC=0`);else lines.push(`R28 FIELD_IN N_BPLUS_FILT ${c.fieldR}`);}
 lines.push('.options reltol=1e-5 abstol=1e-9 vntol=1e-5 method=gear maxord=2',`.tran ${p.dt_s} ${p.duration_s} ${Math.max(0,p.duration_s-spec.numerical_contract.report_cycles/p.line_hz)} ${p.dt_s} UIC`,'.print tran v(N_BPLUS_RECT) v(N_BPLUS_FILT) i(VFIELD)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports)module.exports={validate:pt44PowerValidate,configure:pt44PowerConfigure,rectifier:pt44PowerRectifier,step:pt44PowerStep,simulate:pt44PowerSimulate,summary:pt44PowerSummary,spiceDeck:pt44PowerSpiceDeck};
