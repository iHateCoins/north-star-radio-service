// v0.22: physically calculated defects in the *isolated* Philco #18/#19 RC
// testbench; these are not wired into the provisional 3D game or full receiver.
function pt44FaultNetwork(scenario){
 const known=PT44_PASSIVE_FAULTS_V1.scenarios.find(x=>x.id===scenario);
 if(!known)throw Error('Unknown isolated RC failure scenario');
 const e=pt44PassiveComponents(),base=[e.find(x=>x.name==='Philco #18'),e.find(x=>x.name==='Philco #19')].map(x=>({...x}));
 if(base.some(x=>!x))throw Error('Required factory passive model absent');
 const cap=base[0],res=base[1];
 switch(known.action){
  case 'healthy':break;
  case 'open_capacitor':return [res]; // capacitor becomes nonconducting, source remains unconnected
  case 'short_capacitor':cap.type='R';cap.value=known.example_ohms;break;
  case 'leaky_capacitor':return [cap,res,{name:'Illustrative insulation leakage across Philco #18',type:'R',value:known.example_ohms,a:cap.a,b:cap.b}];
  case 'drift_resistor':res.value=known.example_ohms;break;
  default:throw Error('Unsupported fault type in source-limited testbench');
 }
 return base;
}
function pt44FaultProbe(scenario,frequencyHz){
 const model=pt44FaultNetwork(scenario);
 const output=pt44SolvePassiveNetwork(model,frequencyHz,{
  F_VOL_WIPER_C18:1,F_DET_PASSIVE_RETURN:0
 });
 const node=output.voltages.F_7C6_AUDIO_GRID;
 if(!node)throw Error('Isolated grid node was lost');
 return {scenario,frequencyHz,amplitude:pt44PassiveAbs(node),phaseRadians:Math.atan2(node.im,node.re),gridVoltage:node,kclResidualAmps:output.kclResidualAmps,model};
}
function pt44FaultStudyAudit(){
 const f=PT44_PASSIVE_FAULTS_V1,issues=[];let results=null;
 try{
  if(f.factory_part_ids.join(',')!=='18,19')issues.push('Fault testbench may only alter source-traced #18/#19');
  const expected=[['healthy','healthy',null],['open18','open_capacitor',null],['short18','short_capacitor',0.01],['leak18','leaky_capacitor',100000],['drift19','drift_resistor',470000]];
  if(f.scenarios.length!==expected.length)issues.push('Unexpected fault scenario list');
  for(const [id,action,ohms] of expected){const s=f.scenarios.find(x=>x.id===id);
   if(!s||s.action!==action||s.example_ohms!==ohms)issues.push('Unsupported/mutated fault fixture: '+id);
  }
  if(f.is_factory_failure_measurement||f.full_receiver_fault_validated||f.complete_spice_model)issues.push('Hypothetical faults must not be treated as historical evidence or completed SPICE');
  if(PT44_BENCH_V1.detector_subdevices.V3.section_D1.external_net_id!==null || PT44_BENCH_V1.detector_subdevices.V3.section_D2.external_net_id!==null)issues.push('Detector diode connection guessed');
  results=Object.fromEntries(f.scenarios.map(s=>[s.id, Object.fromEntries([0,1,10,1000].map(hz=>[hz,pt44FaultProbe(s.id,hz)]))]));
  const at=(id,hz)=>results[id][hz].amplitude;
  if(at('healthy',0)>1e-12 || at('open18',1000)>1e-12)issues.push('DC-block or open-capacitor behavior inconsistent');
  if(at('short18',0)<0.999999 || at('leak18',0)<0.95)issues.push('Ohmic failure behavior inconsistent');
  if(at('drift19',10)>=at('healthy',10))issues.push('Grid resistance drift should increase highpass cutoff');
  if(at('healthy',1000)<=0.999 || at('open18',0)>1e-12)issues.push('Source-driven high-frequency behavior inconsistent');
  for(const s of f.scenarios)for(const hz of [0,1,10,1000])if(results[s.id][hz].kclResidualAmps>1e-10)issues.push('KCL mismatch '+s.id+' @ '+hz+' Hz');
 }catch(e){issues.push(String(e.message||e));}
 return {ok:issues.length===0,issues,results};
}
function pt44FaultStudyHTML(stage,esc){
 if(!['ALL','DETECTOR'].includes(stage))return '';
 const audit=pt44FaultStudyAudit();let table='';
 if(audit.results){const fmt=(v)=>`${(v*100).toFixed(2)}%`;
  table=`<table class="sl-table sl-fault-study"><thead><tr><th>Isolated fault condition</th><th>0 Hz (DC)</th><th>10 Hz</th><th>1 kHz</th></tr></thead><tbody>${PT44_PASSIVE_FAULTS_V1.scenarios.map(s=>`<tr><td>${esc(s.label)}</td><td>${fmt(audit.results[s.id][0].amplitude)}</td><td>${fmt(audit.results[s.id][10].amplitude)}</td><td>${fmt(audit.results[s.id][1000].amplitude)}</td></tr>`).join('')}</tbody></table>`;
 }
 return `<h3>Component fault laboratory — source-wired #18/#19 <small style="font:11px monospace">v0.22</small></h3>
 <div class="sl-alert" style="background:${audit.ok?'#dfe9d5':'#f1cdc7'}"><b>ISOLATED FAULT AUDIT: ${audit.ok?'PASS':'FAIL'}</b>${audit.issues.length?' · '+audit.issues.map(esc).join('; '):' · 5 fault scenarios solved using complex nodal analysis'}</div>
 <p>Comparing a <b>factory-value healthy RC coupling section</b> with <b>illustrative</b> component faults. Output is the AC grid voltage as a fraction of an <b>ideal 1 V signal applied to the volume wiper</b>. No tube, pot, AVC, IF transformer or chassis source is included.</p>
 ${table}
 <p class="sl-footnote">Fault assumptions (not factory measurements): a short is approximated by 0.01 Ω, leakage by 100 kΩ across #18, and #19 drift by 470 kΩ instead of the factory 4.7 MΩ. These are isolated network calculations; they do not yet drive the playable radio or indicate the actual sound/voltages of a damaged PT-44.</p>`;
}
