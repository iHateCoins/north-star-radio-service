// Separately driven small-signal converter reference; deliberately isolated from receiver loads.
function pt44ConverterValidate(spec){
 if(spec.schema!=='PT44_7A8_CHARACTERISTICS_V1')throw Error('Invalid 7A8 specification');
 for(const s of Object.values(spec.slices)){
  if(s.axis.length<2||s.axis.some((x,i)=>!Number.isFinite(x)||(i&&x<=s.axis[i-1])))throw Error('Invalid 7A8 axis');
  for(const a of Object.values(s.columns))if(a.length!==s.axis.length||a.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid 7A8 characteristic');
 }return true;
}
function pt44ConverterInterpolate(axis,values,x){
 if(!Number.isFinite(x)||x<axis[0]||x>axis.at(-1))throw Error('Outside published 7A8 slice');
 let i=1;while(i<axis.length-1&&x>axis[i])i++;const f=(x-axis[i-1])/(axis[i]-axis[i-1]);return values[i-1]+f*(values[i]-values[i-1]);
}
function pt44ConverterCharacteristics(spec,slice,x){
 pt44ConverterValidate(spec);const s=spec.slices[slice];if(!s)throw Error('Unknown 7A8 slice');
 return {slice,coordinate:x,conditions:{...s.conditions,[s.axis_key]:x},values:Object.fromEntries(Object.entries(s.columns).map(([k,v])=>[k,pt44ConverterInterpolate(s.axis,v,x)])),extrapolated:false};
}
function pt44ConverterConfigure(spec,input={}){
 const p={...spec.defaults,...input};if(Object.keys(input).some(k=>!(k in spec.defaults))||!spec.slices[p.slice]||typeof p.lo_enabled!=='boolean'||!['bias_v','oscillator_grid_ua','rf_hz','lo_hz','rf_peak_v','modulation','samples_per_fast_cycle'].every(k=>Number.isFinite(p[k]))||p.rf_hz<540000||p.rf_hz>1600000||p.lo_hz<800000||p.lo_hz>2100000||p.rf_hz%1000||p.lo_hz%1000||Math.abs(p.lo_hz-p.rf_hz)<400000||Math.abs(p.lo_hz-p.rf_hz)>500000||p.rf_peak_v<0||p.rf_peak_v>.01||p.modulation<0||p.modulation>1||![32,64].includes(p.samples_per_fast_cycle))throw Error('Unsupported converter reference conditions');
 // Validate both retained controls so a hidden invalid setting cannot leak into a later selection.
 if(p.bias_v< -20||p.bias_v>0||p.oscillator_grid_ua<100||p.oscillator_grid_ua>1000)throw Error('Outside published 7A8 slice');
 const s=spec.slices[p.slice],reference=pt44ConverterCharacteristics(spec,p.slice,p[s.axis_key]),duration=spec.fixture_contract.duration_s,count=Math.ceil(duration*Math.max(p.rf_hz,p.lo_hz)*p.samples_per_fast_cycle);
 return {p,reference,duration,count,dt:duration/count,gc:p.lo_enabled?reference.values.conversion_s:0};
}
function pt44ConverterSimulate(spec,input={}){
 const c=pt44ConverterConfigure(spec,input),{p}=c,w=2*Math.PI,df=Math.abs(p.lo_hz-p.rf_hz),sf=p.lo_hz+p.rf_hz,audio=spec.fixture_contract.audio_hz,frequencies=[df-audio,df,df+audio,sf-audio,sf,sf+audio,455000],ports=[...new Set(frequencies)],z=ports.map(f=>({frequency_hz:f,cos:0,sin:0})),samples=[],stride=Math.max(1,Math.ceil(c.count/1500));let mean=0,square=0;
 for(let n=0;n<=c.count;n++){const t=n*c.dt,rf=p.rf_peak_v*(1+p.modulation*Math.cos(w*audio*t))*Math.cos(w*p.rf_hz*t),current=2*c.gc*rf*Math.cos(w*p.lo_hz*t),weight=(n===0||n===c.count)?.5:1;mean+=weight*current*c.dt;square+=weight*current*current*c.dt;for(const a of z){a.cos+=weight*current*Math.cos(w*a.frequency_hz*t)*c.dt;a.sin+=weight*current*Math.sin(w*a.frequency_hz*t)*c.dt;}if(n%stride===0||n===c.count)samples.push({time_s:t,plate_ac_a:current});}
 return {parameters:p,reference:c.reference,reference_dc_currents_a:p.lo_enabled&&p.slice==='bias_100v'?Object.fromEntries(['plate_a','screen_a','oscillator_anode_a'].map(k=>[k,c.reference.values[k]])):null,spectrum:z.map(a=>({frequency_hz:a.frequency_hz,peak_a:2*Math.hypot(a.cos,a.sin)/c.duration})),mean_ac_a:mean/c.duration,rms_ac_a:Math.sqrt(square/c.duration),difference_hz:df,sum_hz:sf,duration_s:c.duration,dt_s:c.dt,steps:c.count,samples,factory_calibrated:false,self_oscillation_validated:false,receiver_tracking_validated:false,receiver_loads_replaced:false};
}
function pt44ConverterSpiceTable(axis,values){let e=String(values.at(-1));for(let i=axis.length-2;i>=0;i--)e=`(x<${axis[i+1]}?(${values[i]}+(x-(${axis[i]}))*${(values[i+1]-values[i])/(axis[i+1]-axis[i])}):${e})`;return e;}
function pt44ConverterSpiceDeck(spec,input={}){
 const c=pt44ConverterConfigure(spec,input),{p}=c,s=spec.slices[p.slice],x=p[s.axis_key],lines=['PT-44 v0.62 separately driven 7A8 characteristic reference','* Isolated unloaded AC plate-current fixture; NOT a PT-44 receiver netlist.','* All voltages are cathode-relative. No chassis/B-minus identity is asserted.',`* Published reference conditions ${JSON.stringify(c.reference.conditions)}`,'* LO is a normalized imposed clock; no oscillator-grid voltage or startup is solved.','* DC reference currents are valid only for enabled excitation on the bias slice.'];
 for(const [k,v] of Object.entries(s.columns))lines.push(`.func C_${k}(x) {${pt44ConverterSpiceTable(s.axis,v)}}`);
 lines.push(`VX X 0 ${x}`,`BRF RF 0 V={${p.rf_peak_v}*(1+${p.modulation}*cos(${2*Math.PI*spec.fixture_contract.audio_hz}*time))*cos(${2*Math.PI*p.rf_hz}*time)}`,`BLO LO 0 V={${p.lo_enabled?1:0}*cos(${2*Math.PI*p.lo_hz}*time)}`,'BOUT 0 OUT I={2*C_conversion_s(V(X))*V(RF)*V(LO)}','VSENSE OUT 0 0');
 if(p.lo_enabled&&p.slice==='bias_100v')for(const k of ['plate_a','screen_a','oscillator_anode_a'])lines.push(`B_${k} 0 REF_${k} I={C_${k}(V(X))}`,`V_${k} REF_${k} 0 0`);
 lines.push('.options reltol=1e-9 abstol=1e-14',`.tran ${c.dt} ${c.duration} 0 ${c.dt}`,'.print tran I(VSENSE)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports)module.exports={validate:pt44ConverterValidate,characteristics:pt44ConverterCharacteristics,configure:pt44ConverterConfigure,simulate:pt44ConverterSimulate,spiceDeck:pt44ConverterSpiceDeck};
