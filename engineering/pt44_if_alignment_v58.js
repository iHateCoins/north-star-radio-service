// Frequency-domain linearization of the same coupled IF MNA, not a fitted transfer curve.
// AC is infinitesimal about the no-signal hot-DC point; it is not detected audio or large-signal sensitivity.
function pt44IFACSolve(real,imag,rhs){
 const n=rhs.length,R=real.map(r=>r.slice()),I=imag.map(r=>r.slice()),br=rhs.slice(),bi=Array(n).fill(0);
 // Normalize equations before pivoting: nodal KCL and inductor-voltage rows have different units.
 for(let i=0;i<n;i++){const scale=Math.max(...R[i].map((v,j)=>Math.hypot(v,I[i][j])));if(!(scale>0))throw Error('Unanchored IF AC row');for(let j=0;j<n;j++){R[i][j]/=scale;I[i][j]/=scale;}br[i]/=scale;}
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.hypot(R[i][k],I[i][k])>Math.hypot(R[pivot][k],I[pivot][k]))pivot=i;
  if(Math.hypot(R[pivot][k],I[pivot][k])<1e-18)throw Error('Singular IF AC matrix');
  for(const v of [R,I,br,bi])[v[k],v[pivot]]=[v[pivot],v[k]];
  const den=R[k][k]**2+I[k][k]**2;
  for(let i=k+1;i<n;i++){
   const fr=(R[i][k]*R[k][k]+I[i][k]*I[k][k])/den,fi=(I[i][k]*R[k][k]-R[i][k]*I[k][k])/den;if(fr===0&&fi===0)continue;
   for(let j=k+1;j<n;j++){const r=fr*R[k][j]-fi*I[k][j],im=fr*I[k][j]+fi*R[k][j];R[i][j]-=r;I[i][j]-=im;}R[i][k]=0;I[i][k]=0;
   br[i]-=fr*br[k]-fi*bi[k];bi[i]-=fr*bi[k]+fi*br[k];
  }
 }
 const xr=Array(n).fill(0),xi=Array(n).fill(0);for(let i=n-1;i>=0;i--){let r=br[i],im=bi[i];for(let j=i+1;j<n;j++){r-=R[i][j]*xr[j]-I[i][j]*xi[j];im-=R[i][j]*xi[j]+I[i][j]*xr[j];}const den=R[i][i]**2+I[i][i]**2;xr[i]=(r*R[i][i]+im*I[i][i])/den;xi[i]=(im*R[i][i]-r*I[i][i])/den;}
 let kcl=0,normalized=0;for(let i=0;i<n;i++){let r=-rhs[i],im=0,scale=Math.abs(rhs[i]);for(let j=0;j<n;j++){r+=real[i][j]*xr[j]-imag[i][j]*xi[j];im+=real[i][j]*xi[j]+imag[i][j]*xr[j];scale+=Math.hypot(real[i][j],imag[i][j])*Math.hypot(xr[j],xi[j]);}const e=Math.hypot(r,im);if(![10,11,22,23,24,25].includes(i))kcl=Math.max(kcl,e);normalized=Math.max(normalized,e/Math.max(scale,1e-30));}
 if(!xr.every(Number.isFinite)||!xi.every(Number.isFinite)||normalized>1e-8)throw Error('IF AC residual');return {real:xr,imag:xi,kcl_residual_a:kcl,normalized_residual:normalized};
}
function pt44IFACBuild(c,operatingPoint=null){
 if(c.p.c20_leak_ohm!==null)throw Error('IF AC fixture currently requires a restored audio coupling capacitor');
 const op=operatingPoint||pt44IFStep(c,Array(c.N).fill(0),0,Infinity,true),x=op.x,G=pt44IFSystem(c,x,x,0,Infinity,true).M,h=.001,M=pt44IFSystem(c,x,x,0,h,true).M,D=M.map((r,i)=>r.map((v,j)=>(v-G[i][j])*h));
 return {c,op,G,D};
}
function pt44IFACPoint(model,hz,drive=1e-6){
 if(!Number.isFinite(hz)||hz<350000||hz>600000||!Number.isFinite(drive)||drive<=0||drive>1e-4)throw Error('Unsupported IF AC frequency/drive');
 const w=2*Math.PI*hz,rhs=Array(model.c.N).fill(0);rhs[20]=-drive;const z=pt44IFACSolve(model.G,model.D.map(r=>r.map(v=>w*v)),rhs);
 const port=(i,j=-1)=>{const re=z.real[i]-(j<0?0:z.real[j]),im=z.imag[i]-(j<0?0:z.imag[j]);return {re,im,peak_v:Math.hypot(re,im),phase_rad:Math.atan2(im,re),transimpedance_ohm:Math.hypot(re,im)/drive};};
 return {frequency_hz:hz,IG:port(15),IP:port(16),IFout:port(12,2),kcl_residual_a:z.kcl_residual_a,normalized_residual:z.normalized_residual};
}
function pt44IFACSweep(spec,audio,power,detector,graph,input={},sweep={}){
 const p={start_hz:400000,stop_hz:510000,points:221,drive_peak_a:1e-6,...sweep};if(Object.keys(sweep).some(k=>!['start_hz','stop_hz','points','drive_peak_a'].includes(k))||!Number.isInteger(p.points)||p.points<11||p.points>1001||p.start_hz<350000||p.stop_hz>600000||p.start_hz>=p.stop_hz)throw Error('Unsupported IF sweep');
 const c=pt44IFConfigure(spec,audio,power,detector,graph,input),model=pt44IFACBuild(c),points=Array.from({length:p.points},(_,i)=>pt44IFACPoint(model,p.start_hz+i*(p.stop_hz-p.start_hz)/(p.points-1),p.drive_peak_a));let peak=0;for(let i=1;i<points.length;i++)if(points[i].IFout.peak_v>points[peak].IFout.peak_v)peak=i;
 const level=points[peak].IFout.peak_v/Math.SQRT2,cross=(i,j)=>{const a=points[i],b=points[j];return a.frequency_hz+(b.frequency_hz-a.frequency_hz)*(level-a.IFout.peak_v)/(b.IFout.peak_v-a.IFout.peak_v);};let low=null,high=null;
 for(let i=peak;i>0;i--)if(points[i-1].IFout.peak_v<=level){low=cross(i-1,i);break;}for(let i=peak;i<points.length-1;i++)if(points[i+1].IFout.peak_v<=level){high=cross(i,i+1);break;}
 return {parameters:c.p,sweep:p,operating_point:model.op,points,summary:{peak_hz:points[peak].frequency_hz,peak_transimpedance_ohm:points[peak].IFout.transimpedance_ohm,lower_3db_hz:low,upper_3db_hz:high,bandwidth_hz:low!==null&&high!==null?high-low:null,at_455khz:pt44IFACPoint(model,455000,p.drive_peak_a),max_normalized_residual:Math.max(...points.map(p=>p.normalized_residual))},factory_calibrated:false,full_receiver_validated:false};
}
function pt44IFAlign(spec,audio,power,detector,graph,input={}){
 const args=[spec,audio,power,detector,graph],knobs=['c12a_scale','c12b_scale','c14a_scale'];let options={...input};if((options.if1_detune??1)!==1||(options.if2_detune??1)!==1)throw Error('Use individual trimmers for alignment, not diagnostic detune aliases');
 const initial=pt44IFConfigure(...args,options),op=pt44IFACBuild(initial).op,measure=o=>pt44IFACPoint(pt44IFACBuild(pt44IFConfigure(...args,o),op),455000).IFout.transimpedance_ohm,history=[];const before=measure(options);let best=before;
 for(let pass=0;pass<5;pass++){const previous=best;for(const knob of knobs){let lo=.75,hi=1.25;const score=v=>measure({...options,[knob]:v});for(let n=0;n<24;n++){const l=lo+(hi-lo)*.38196601125,r=hi-(hi-lo)*.38196601125;if(score(l)<score(r))lo=l;else hi=r;}
  const candidates=[options[knob]??1,lo,(lo+hi)/2,hi,.75,1.25].map(value=>({value,gain:score(value)})).sort((a,b)=>b.gain-a.gain);options[knob]=candidates[0].value;best=candidates[0].gain;history.push({pass:pass+1,trimmer:knob,scale:options[knob],transimpedance_ohm:best});}
  if(best<=previous*(1+1e-6))break;
 }
 return {before_transimpedance_ohm:before,after_transimpedance_ohm:best,settings:Object.fromEntries(knobs.map(k=>[k,options[k]])),history,parameters:{...initial.p,...options},objective:'Maximize infinitesimal second-IF secondary voltage at 455 kHz about the declared hot DC point. Not historical AVC/audio-output alignment.',ec_support:['EC-02','EC-05','EC-07','EC-09'],factory_calibrated:false,full_receiver_validated:false};
}
function pt44IFACSpiceDeck(spec,audio,power,detector,graph,input={},sweep={}){
 const p={start_hz:400000,stop_hz:510000,points:221,drive_peak_a:1e-6,...sweep};
 // Validate the sweep domain and core without computing a full sweep.
 pt44IFACPoint(pt44IFACBuild(pt44IFConfigure(spec,audio,power,detector,graph,input)),p.start_hz,p.drive_peak_a);if(!Number.isInteger(p.points)||p.points<11||p.points>1001||p.stop_hz<=p.start_hz||p.stop_hz>600000||Object.keys(sweep).some(k=>!['start_hz','stop_hz','points','drive_peak_a'].includes(k)))throw Error('Unsupported IF sweep');
 const lines=pt44IFSpiceDeck(spec,audio,power,detector,graph,input).split('\n').filter(s=>s&&!/^(BDRIVE |\.options|\.tran|\.print|\.end)/.test(s));lines[0]='PT-44 v0.58 loaded infinitesimal IF response - uncalibrated';lines.push(`IAC CP 0 DC 0 AC ${p.drive_peak_a}`,'.options reltol=1e-8 abstol=1e-12',`.ac lin ${p.points} ${p.start_hz} ${p.stop_hz}`,'.print ac V(IG) V(IP) V(U,H)','.end');return lines.join('\n')+'\n';
}
if(typeof module!=='undefined'&&module.exports){const m=require('./pt44_if_receiver_v57');var pt44IFConfigure=m.configure,pt44IFStep=m.step,pt44IFSystem=m.system,pt44IFSpiceDeck=m.spiceDeck;module.exports={solve:pt44IFACSolve,build:pt44IFACBuild,point:pt44IFACPoint,sweep:pt44IFACSweep,align:pt44IFAlign,spiceDeck:pt44IFACSpiceDeck};}
