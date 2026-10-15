function pt44DetectorBenchState(){const defaults={fault:'healthy',amplitude_v:2,modulation:.5,audio_hz:1000,volume:.6,c8_f:.05e-6,meter:'ideal',probe:'A'};return typeof R==='undefined'?defaults:(R.detectorBenchV56||(R.detectorBenchV56=defaults));}
function pt44DetectorBenchOptions(state){const f=PT44_DETECTOR_AVC_V1.faults.find(f=>f.id===state.fault);if(!f)throw Error('Unknown detector condition');const {fault:ignore,...options}=state;return {...options,...f.changes};}
function pt44DetectorModelHTML(stage,esc){
 if(!['ALL','IF','DETECTOR','AUDIO'].includes(stage))return '';
 const state=pt44DetectorBenchState(),key=JSON.stringify(pt44DetectorBenchOptions(state)),result=pt44DetectorModelHTML.result?.key===key?pt44DetectorModelHTML.result.value:null,option=(v,l,current)=>`<option value="${v}"${v===current?' selected':''}>${esc(l)}</option>`;
 return `<section class="sl-detector-v56"><h3>Detector and AVC bench · v0.56</h3><p>Apply a 455 kHz AM signal at the second IF secondary. Inspect recovered audio and the AVC rail as the signal arrives and stops. Probe loading is included in the solve.</p>
 <form id="detectorFormV56" class="sl-toolbar" style="flex-wrap:wrap;align-items:end;gap:10px">
 <label>Condition<br><select name="fault">${PT44_DETECTOR_AVC_V1.faults.map(f=>option(f.id,f.label,state.fault)).join('')}</select></label>
 <label>IF peak V<br><input name="amplitude_v" type="number" min="0" max="10" step=".1" value="${state.amplitude_v}" style="width:75px"></label>
 <label>Modulation fraction<br><input name="modulation" type="number" min="0" max="1" step=".1" value="${state.modulation}" style="width:75px"></label>
 <label>Audio<br><select name="audio_hz">${[400,1000,2000].map(v=>option(v,v+' Hz',state.audio_hz)).join('')}</select></label>
 <label>Volume fraction<br><input name="volume" type="number" min="0" max="1" step=".1" value="${state.volume}" style="width:75px"></label>
 <label>#8 experimental value<br><select name="c8_f">${[.05e-6,.1e-6].map(v=>option(v,(v*1e6).toFixed(2)+' µF',state.c8_f)).join('')}</select></label>
 <label>Probe<br><select name="probe">${[['A','AVC rail'],['U','Upper diode glyph / IF high'],['H','Volume top / IF low'],['W','Volume wiper'],['G','7C6 audio grid · pin 3']].map(([v,l])=>option(v,l,state.probe)).join('')}</select></label>
 <label>Instrument loading<br><select name="meter">${PT44_DETECTOR_AVC_V1.meters.map(m=>option(m.id,m.label,state.meter)).join('')}</select></label>
 <button class="sl-btn" id="detectorRunV56" type="submit">Run detector bench</button><button class="sl-btn" id="detectorRepairV56" type="button">Restore and rerun</button><button class="sl-btn" id="detectorExportV56" type="button">Export matching SPICE</button></form>
 <p id="detectorStatusV56" role="status">${pt44DetectorModelHTML.busy?'Solving detector and AVC in background…':pt44DetectorModelHTML.error?esc(pt44DetectorModelHTML.error):result?'Result matches the last submitted conditions.':'Run the bench to calculate these conditions.'}</p>
 ${result?pt44DetectorResultHTML(result):''}<p class="sl-footnote">Signal on: 0–12 ms. Release: 12–60 ms. Audio measurements cover the final four modulation cycles before switch-off. AVC is still charging; this is not a steady-state sensitivity measurement. All voltages reference B−. The trace shows cycle samples; it does not display IF ripple.</p>
 <details><summary>Parameters and remaining work</summary><p>Both #8 values remain unresolved source alternatives. The 7C6 diode plates are identified by schematic glyph; physical pins 5/6 remain unassigned. Diodes use an assumed space-charge law with no reverse leakage or contact potential. The input uses an assumed floating 50 kΩ source; volume is an assumed 500 kΩ linear track. This subset includes #7/#8/#15/#17/#18/#19 and the volume track, but it does not include active IF gain, tuned windings, AVC gain feedback, audio-tube grid current, supply coupling or shop repair jobs. A nonconducting lower diode can have little effect when the AVC rail stays negative. Meter R/C loads only the selected node; the 10 V service range is a defined simulator condition.</p></details></section>`;
}
function pt44DetectorResultHTML(r){
 const names={U:'Upper diode glyph',H:'Detector / volume top',A:'AVC rail',W:'Volume wiper',G:'Audio grid'},s=r.summary;
 const max=Math.max(.001,...r.samples.map(s=>Math.abs(s.x[2])))*1.1,points=r.samples.map(s=>(48+520*s.time_s/.06).toFixed(2)+','+(30-110*s.x[2]/max).toFixed(2)).join(' ');
 return `<table class="sl-table"><thead><tr><th>Node</th><th>Mean V</th><th>Audio fundamental peak V</th></tr></thead><tbody>${Object.keys(names).map(k=>`<tr><td>${names[k]}</td><td>${s[k].mean_v.toFixed(5)}</td><td>${s[k].audio_peak_v.toFixed(5)}</td></tr>`).join('')}</tbody></table><p>AVC at signal stop <b>${r.at_off.x[2].toFixed(5)} V</b> · after release <b>${r.final.x[2].toFixed(5)} V</b>. Fundamental projections include finite-window startup drift.</p><svg viewBox="0 0 600 180" role="img" aria-label="AVC voltage during signal arrival and release" style="width:100%;max-width:700px;background:#faf5e8;border:1px solid #b7aa89"><title>AVC arrival and release</title><path d="M48 30 V145 H568 M152 22 V145" fill="none" stroke="#81745a"/><text x="48" y="18" font-size="11">0 V</text><text x="3" y="145" font-size="11">−${max.toFixed(3)}</text><text x="48" y="165" font-size="11">0 ms</text><text x="143" y="165" font-size="11">12</text><text x="530" y="165" font-size="11">60 ms</text><polyline points="${points}" fill="none" stroke="#2f7154" stroke-width="1.3"/></svg>`;
}
function pt44DetectorRunBench(box,state){
 const options=pt44DetectorBenchOptions(state);pt44DetectorConfigure(PT44_DETECTOR_AVC_V1,PT44_FACTORY_V3,options);
 if(typeof Worker==='undefined')throw Error('This bench needs browser Web Worker support');
 const functions=[pt44DetectorValidate,pt44DetectorConfigure,pt44DetectorDiode,pt44DetectorLinearSolve,pt44DetectorSystem,pt44DetectorStep,pt44DetectorSimulate];
 const source=functions.map(f=>f.toString()).join('\n')+'\nonmessage=e=>{try{postMessage({result:pt44DetectorSimulate(...e.data)});}catch(error){postMessage({error:String(error.message||error)});}};';
 const url=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));let worker;try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
 pt44DetectorModelHTML.worker?.terminate();pt44DetectorModelHTML.worker=worker;pt44DetectorModelHTML.busy=true;pt44DetectorModelHTML.error=null;R.detectorBenchV56=state;renderViews();
 const failure=message=>{if(pt44DetectorModelHTML.worker!==worker)return;pt44DetectorModelHTML.busy=false;pt44DetectorModelHTML.error=message;worker.terminate();renderViews();};
 worker.onmessage=e=>{if(pt44DetectorModelHTML.worker!==worker)return;if(e.data.error){failure(e.data.error);return;}pt44DetectorModelHTML.result={key:JSON.stringify(options),value:e.data.result};pt44DetectorModelHTML.busy=false;worker.terminate();renderViews();};worker.onerror=e=>failure(e.message||'Detector worker failed');worker.postMessage([PT44_DETECTOR_AVC_V1,PT44_FACTORY_V3,options]);
}
function pt44BindDetectorWorkbench(box){
 const form=box.querySelector('#detectorFormV56');if(!form)return;
 const read=()=>Object.fromEntries(['fault','amplitude_v','modulation','audio_hz','volume','c8_f','meter','probe'].map(k=>[k,['fault','meter','probe'].includes(k)?form.elements[k].value:Number(form.elements[k].value)]));
 const fail=e=>{pt44DetectorModelHTML.error=String(e.message||e);box.querySelector('#detectorStatusV56').textContent=pt44DetectorModelHTML.error;};
 form.onsubmit=e=>{e.preventDefault();try{pt44DetectorRunBench(box,read());}catch(error){fail(error);}};
 box.querySelector('#detectorRepairV56').onclick=()=>{try{pt44DetectorRunBench(box,{...read(),fault:'healthy'});}catch(e){fail(e);}};
 box.querySelector('#detectorExportV56').onclick=()=>{try{const deck=pt44DetectorSpiceDeck(PT44_DETECTOR_AVC_V1,PT44_FACTORY_V3,pt44DetectorBenchOptions(read())),url=URL.createObjectURL(new Blob([deck],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='PT44_Detector_AVC_v0_56.cir';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){fail(e);}};
}
