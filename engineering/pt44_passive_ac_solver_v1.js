// v0.21 PT-44: isolated frequency-domain passive solver. No vacuum-tube, detector,
// mains, winding inductance, volume-track or unverified factory connections are modeled.
// This layer compiles device endpoints from the source-traced PT44_FACTORY_V3 graph.
function pt44PassiveC(re=0,im=0){return {re,im};}
function pt44PassiveAdd(a,b){return {re:a.re+b.re,im:a.im+b.im};}
function pt44PassiveSub(a,b){return {re:a.re-b.re,im:a.im-b.im};}
function pt44PassiveMul(a,b){return {re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re};}
function pt44PassiveAbs(a){return Math.hypot(a.re,a.im);}
function pt44PassiveDiv(a,b){const q=b.re*b.re+b.im*b.im;if(!(q>0))throw Error('Singular passive complex division');return {re:(a.re*b.re+a.im*b.im)/q,im:(a.im*b.re-a.re*b.im)/q};}
function pt44PassiveSI(spec){
 const actual=PT44_FACTORY_V3.factory_components[spec.factory_part];
 if(!actual || actual.category!==spec.factory_category)throw Error('Factory component type mismatch: '+spec.factory_part);
 if(!(spec.value_si>0) || !Number.isFinite(spec.value_si))throw Error('Invalid passive element value');
 const nets=new Map();
 for(const net of PT44_FACTORY_V3.factory_nets){
  for(const ref of net.factory_members){
   if(nets.has(ref)&&nets.get(ref)!==net.id)throw Error('Conflicting factory net memberships: '+ref);
   nets.set(ref,net.id);
  }
 }
 const a=spec.factory_part+':'+spec.terminals[0],b=spec.factory_part+':'+spec.terminals[1];
 if(!actual.terminals.includes(spec.terminals[0]) || !actual.terminals.includes(spec.terminals[1]))throw Error('Unrecognized factory component terminal');
 if(!nets.has(a) || !nets.has(b) || nets.get(a)===nets.get(b))throw Error('Passive component endpoints lack separate source-traced nets: '+spec.factory_part);
 if(nets.get(a)!==spec.expected_nets[0] || nets.get(b)!==spec.expected_nets[1])throw Error('Passive component wiring changed without source approval: '+spec.factory_part);
 return {name:'Philco #'+spec.factory_part,type:spec.kind,value:spec.value_si,a:nets.get(a),b:nets.get(b)};
}
function pt44PassiveComponents(spec=PT44_PASSIVE_STUDY_V1){return spec.elements.map(pt44PassiveSI);}
// Complex nodal analysis of an independent passive circuit with Dirichlet test sources.
// Fixed nodes use test voltages, NEVER actual factory operating voltages.
function pt44SolvePassiveNetwork(elements,frequencyHz,fixed){
 if(!Number.isFinite(frequencyHz)||frequencyHz<0)throw Error('Frequency must be nonnegative');
 const known=new Map(Object.entries(fixed||{}).map(([n,v])=>[n,typeof v==='number'?pt44PassiveC(v,0):v]));
 const all=new Set();for(const x of elements){all.add(x.a);all.add(x.b);}
 const unknown=[...all].filter(x=>!known.has(x));if(!known.size)throw Error('A test reference node is required');
 const at=new Map(unknown.map((x,i)=>[x,i])), n=unknown.length;
 const A=Array.from({length:n},()=>Array.from({length:n},()=>pt44PassiveC()));
 const B=Array.from({length:n},()=>pt44PassiveC());
 for(const x of elements){
  if(!['R','C'].includes(x.type)||!(x.value>0))throw Error('Invalid supported R/C device');
  const y=x.type==='R'?pt44PassiveC(1/x.value,0):pt44PassiveC(0,2*Math.PI*frequencyHz*x.value);
  for(const [node,other] of [[x.a,x.b],[x.b,x.a]]){
   const i=at.get(node);if(i===undefined)continue;
   A[i][i]=pt44PassiveAdd(A[i][i],y);
   if(at.has(other))A[i][at.get(other)]=pt44PassiveSub(A[i][at.get(other)],y);
   else if(known.has(other))B[i]=pt44PassiveAdd(B[i],pt44PassiveMul(y,known.get(other)));
  }
 }
 for(let k=0;k<n;k++){
  let pick=k;for(let i=k+1;i<n;i++)if(pt44PassiveAbs(A[i][k])>pt44PassiveAbs(A[pick][k]))pick=i;
  if(pt44PassiveAbs(A[pick][k])<1e-30)throw Error('Unanchored or singular passive test network');
  [A[k],A[pick]]=[A[pick],A[k]];[B[k],B[pick]]=[B[pick],B[k]];
  for(let i=k+1;i<n;i++){
   const factor=pt44PassiveDiv(A[i][k],A[k][k]);
   for(let j=k;j<n;j++)A[i][j]=pt44PassiveSub(A[i][j],pt44PassiveMul(factor,A[k][j]));
   B[i]=pt44PassiveSub(B[i],pt44PassiveMul(factor,B[k]));
  }
 }
 const V=new Map(known);
 for(let i=n-1;i>=0;i--){let rhs=B[i];for(let j=i+1;j<n;j++)rhs=pt44PassiveSub(rhs,pt44PassiveMul(A[i][j],V.get(unknown[j])));V.set(unknown[i],pt44PassiveDiv(rhs,A[i][i]));}
 const result=Object.fromEntries([...V.entries()]);
 // Evaluate KCL at solved, non-boundary nodes as an engineering check.
 let residual=0;
 for(const node of unknown){let sum=pt44PassiveC();for(const e of elements){if(e.a!==node&&e.b!==node)continue;const other=e.a===node?e.b:e.a;
  const y=e.type==='R'?pt44PassiveC(1/e.value):pt44PassiveC(0,2*Math.PI*frequencyHz*e.value);
  sum=pt44PassiveAdd(sum,pt44PassiveMul(y,pt44PassiveSub(V.get(node),V.get(other))));
 }residual=Math.max(residual,pt44PassiveAbs(sum));}
 return {voltages:result,kclResidualAmps:residual,frequencyHz};
}
function pt44PassiveExperiments(){
 const elements=pt44PassiveComponents();const find=p=>elements.find(e=>e.name==='Philco #'+p);
 const cap15=find('15'),cap18=find('18'),res19=find('19');
 if(!cap15||!cap18||!res19)throw Error('Missing sourced detector parts');
 const gains={};const kcl={};
 for(const hz of [0,1,10,1000,455000]){
  const sol=pt44SolvePassiveNetwork([cap18,res19],hz,{[cap18.a]:1,[res19.b]:0});
  gains[hz]=pt44PassiveAbs(sol.voltages[res19.a]);kcl[hz]=sol.kclResidualAmps;
 }
 const z15AtIF=1/(2*Math.PI*455000*cap15.value);
 const stage={c15:cap15,c18:cap18,r19:res19,gain:gains,kcl,z15AtIF,
  analyticalCutoffHz:1/(2*Math.PI*cap18.value*res19.value)};
 return stage;
}
function pt44PassiveStudyAudit(){
 const issues=[];let result=null;try{
  const e=PT44_PASSIVE_STUDY_V1.elements;
  if(e.length!==3||e.map(x=>x.factory_part).join(',')!=='15,18,19')issues.push('Expected source-bounded passive component set differs');
  for(const x of e){
   const documented=({'15':250e-12,'18':10e-9,'19':4.7e6})[x.factory_part];
   if(Math.abs(x.value_si/documented-1)>1e-12)issues.push('Component #'+x.factory_part+' no longer has factory specified value');
  }
  if(PT44_PASSIVE_STUDY_V1.is_complete_receiver_model || PT44_PASSIVE_STUDY_V1.detector_diode_model_verified || PT44_PASSIVE_STUDY_V1.spice_validated)issues.push('Improper complete-receiver claim');
  result=pt44PassiveExperiments();
  if(Math.abs(result.analyticalCutoffHz-3.3862753849339435)>1e-9)issues.push('Audio coupling RC cutoff changed');
  const f=result.gain;
  for(const hz of [0,1,10,1000,455000]){
   const w=2*Math.PI*hz*10e-9*4.7e6;
   if(Math.abs(f[hz]-w/Math.hypot(1,w))>1e-11)issues.push('RC gain inconsistent at '+hz+' Hz');
   if(result.kcl[hz]>1e-10)issues.push('KCL residual too high at '+hz+' Hz');
  }
  if(Math.abs(result.z15AtIF-(1/(2*Math.PI*455000*250e-12)))>1e-8)issues.push('250 pF 455 kHz impedance inconsistent');
  if(PT44_BENCH_V1.detector_subdevices.V3.section_D1.external_net_id!==null || PT44_BENCH_V1.detector_subdevices.V3.section_D2.external_net_id!==null)issues.push('Unresolved diode external wiring prematurely assigned');
 }catch(err){issues.push(String(err.message||err));}
 return {ok:!issues.length,issues,result};
}
function pt44PassiveStudyHTML(stage,esc){
 if(stage!=='ALL'&&stage!=='DETECTOR'&&stage!=='IF')return '';
 const audit=pt44PassiveStudyAudit();let content='';
 if(audit.result){const x=audit.result;
  const rows=[0,1,10,1000].map(hz=>`<tr><td>${hz} Hz</td><td>${(100*x.gain[hz]).toFixed(3)}%</td></tr>`).join('');
  content=`<p>Source-traced <b>#18 coupling capacitor (0.01 µF)</b> and <b>#19 grid resistor (4.7 MΩ)</b> are solved as an <em>isolated ideal RC high-pass testbench</em>. The wiper receives an artificial 1 V AC source; it is <b>not the PT-44's actual audio gain</b>.</p>
  <table class="sl-table sl-passive-study"><thead><tr><th>Test source frequency</th><th>Voltage across #19 / 1 V drive</th></tr></thead><tbody>${rows}</tbody></table>
  <p>Calculated ideal isolated RC cutoff: <b>${x.analyticalCutoffHz.toFixed(3)} Hz</b>. Factory <b>#15 250 pF</b> has calculated capacitive reactance of <b>${(x.z15AtIF/1000).toFixed(3)} kΩ at 455 kHz</b>, with no claim about the full loaded detector response.</p>`;
 }
 return `<h3>AC passive solver — factory-sourced testbench <small style="font:11px monospace">v0.21</small></h3>
 <div class="sl-alert" style="background:${audit.ok?'#dfe9d5':'#f1cdc7'}"><b>PASSIVE MNA AUDIT: ${audit.ok?'PASS':'FAIL'}</b>${audit.issues.length?' · '+audit.issues.map(esc).join('; '):' · complex nodal analysis, source-traced #15/#18/#19 only'}</div>${content}
 <p class="sl-footnote">AC-source and missing-volume-track boundary conditions are illustrative. No 7C6 diode or triode conduction, winding reactance, AVC feedback, coil Q, speaker behavior, line voltage or complete ngspice model is simulated here. B− is not assumed to be chassis.</p>`;
}
