const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,'engineering',n),'utf8')),spec=read('PT44_Power_Dynamic_Model_V1.json'),graph=read('PT44_Factory_Transcription_V3.json'),power=require('../engineering/pt44_power_model_v54.js');
const run=input=>power.simulate(spec,graph,input),healthy=run({});
assert.equal(healthy.model_calibrated,false);assert.equal(healthy.receiver_complete,false);assert(healthy.max_kcl_residual_a<1e-8);
const configured=power.configure(spec,graph,{}),point=power.rectifier({...configured,plateR:0},18,0);assert(Math.abs(point.current_a-0.2)<1e-12);
assert.equal(power.rectifier(configured,-100,100).current_a,0,'Vacuum rectifier must block reverse current');
// Independent DC operating point: parallel load (Rrect || (Rfield+Rfilt)) and diode power law.
const dc=run({line_mode:'DC'}),Rload=1/(1/3000+1/6500),vth=115*configured.plateRatio;
let lo=0,hi=vth;for(let n=0;n<100;n++){const a=(lo+hi)/2,i=a/Rload,f=a+configured.plateR*i+Math.pow(i/configured.rectK,2/3)-vth;if(f>0)hi=a;else lo=a;}
const reference=(lo+hi)/2;assert(Math.abs(dc.final.reservoir_v-reference)<1e-5);assert(Math.abs(dc.final.filtered_v-reference*6000/6500)<1e-5);
const reverse=run({line_mode:'DC',dc_polarity:-1});assert.equal(reverse.final.reservoir_v,0);assert(reverse.summary.heater_current_a.rms>0,'Reversed DC still drives hot heater resistances');
// Discrete passivity/energy balance, independent of the Newton update equations.
for(let j=1;j<healthy.samples.length;j+=137){const a=healthy.samples[j-1],b=healthy.samples[j],dt=b.time_s-a.time_s;
 const energy=x=>0.5*(configured.capA*x.reservoir_v**2+configured.capB*x.filtered_v**2+configured.fieldL*x.field_current_a**2);
 const loss=b.reservoir_v**2/3000+b.filtered_v**2/6000+500*b.field_current_a**2;
 const numericalLoss=(configured.capA*(b.reservoir_v-a.reservoir_v)**2+configured.capB*(b.filtered_v-a.filtered_v)**2+configured.fieldL*(b.field_current_a-a.field_current_a)**2)/(2*dt);
 assert(Math.abs(b.reservoir_v*b.rectifier_current_a-loss-(energy(b)-energy(a))/dt-numericalLoss)<2e-6,'Supply energy is not conserved apart from backward-Euler damping');}
const refined=run({dt_s:spec.numerical_contract.default_dt_s/2});
assert(Math.abs(refined.summary.filtered_v.mean-healthy.summary.filtered_v.mean)<0.2);assert(Math.abs(refined.summary.filtered_v.peak_to_peak-healthy.summary.filtered_v.peak_to_peak)<0.2);
const faults=Object.fromEntries(spec.faults.map(f=>[f.id,run(f.changes)]));
assert(faults.reservoir_dry.summary.reservoir_v.peak_to_peak>healthy.summary.reservoir_v.peak_to_peak*3);
assert(faults.smoothing_dry.summary.filtered_v.peak_to_peak>healthy.summary.filtered_v.peak_to_peak*5);
assert(faults.filter_leak.summary.filtered_v.mean<healthy.summary.filtered_v.mean*0.8);
assert.equal(faults.field_open.final.filtered_v,0);assert(faults.field_open.final.reservoir_v>healthy.final.reservoir_v);
assert(faults.rectifier_weak.summary.filtered_v.mean<healthy.summary.filtered_v.mean);assert.equal(faults.rectifier_open.final.reservoir_v,0);
const off=faults.switch_off,atOff=off.samples.find(s=>s.time_s>=1);assert(atOff.reservoir_v>100);assert(off.final.reservoir_v<0.01);assert(off.final.filtered_v<0.01);
const restored=run(spec.faults.find(f=>f.id==='healthy').changes);assert.deepEqual(restored.summary,healthy.summary,'Restoring parts must reproduce the healthy baseline');
const custom=run({load_laws:{rectifier:v=>({current_a:v/3000,conductance_s:1/3000}),filtered:v=>({current_a:v/6000,conductance_s:1/6000})}});assert.deepEqual(custom.summary,healthy.summary,'Receiver-load callback ports differ from equivalent resistors');
const bridgeR=30000,coupled=run({line_mode:'DC',coupled_load_law:({reservoir_v:a,filtered_v:b})=>({currents_a:[a/3000+(a-b)/bridgeR,b/6000+(b-a)/bridgeR],jacobian_s:[[1/3000+1/bridgeR,-1/bridgeR],[-1/bridgeR,1/6000+1/bridgeR]]})});
const fieldEquivalent=1/(1/500+1/bridgeR),coupledRload=1/(1/3000+1/(fieldEquivalent+6000));let ca=0,cb=vth;for(let n=0;n<100;n++){const v=(ca+cb)/2,current=v/coupledRload,residual=v+configured.plateR*current+Math.pow(current/configured.rectK,2/3)-vth;if(residual>0)cb=v;else ca=v;}assert(Math.abs(coupled.final.reservoir_v-(ca+cb)/2)<1e-5);assert(Math.abs(coupled.final.filtered_v-(ca+cb)/2*6000/(6000+fieldEquivalent))<1e-5,'Cross-rail receiver load Jacobian is not applied');
const noL=run({field_inductance_h:0}),largeL=run({field_inductance_h:15});assert(noL.summary.filtered_v.peak_to_peak>largeL.summary.filtered_v.peak_to_peak,'Unknown field inductance must affect the ripple result');
for(const input of [{line_v:NaN},{line_hz:0},{dt_s:1},{leak_b_ohm:0},{unknown:1},{field_open:'yes'},{duration_s:Infinity},{initial:{reservoir_v:0}},{load_laws:{rectifier:()=>({current_a:NaN,conductance_s:0}),filtered:()=>({current_a:0,conductance_s:0})}}])assert.throws(()=>run(input));
const corrupt=structuredClone(graph);corrupt.factory_nets.find(n=>n.id==='F_BPLUS_RECT').factory_members.splice(0,1);assert.throws(()=>power.validate(spec,corrupt),/topology source mismatch/);
const badValue=structuredClone(spec);badValue.factory_parameters.field_dcr_ohm=100;assert.throws(()=>power.validate(badValue,graph),/Unreviewed factory/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),embedded=html.split('// BEGIN PT44_POWER_MODEL_V54\n')[1].split('// END PT44_POWER_MODEL_V54')[0];assert.equal(embedded,fs.readFileSync(path.join(root,'engineering/pt44_power_model_v54.js'),'utf8'),'Browser power core differs from tested module');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]),ctx=vm.createContext({console});vm.runInContext(scripts[1],ctx);vm.runInContext(scripts[3].slice(scripts[3].indexOf('function pt44BenchAudit()'),scripts[3].indexOf('function renderFactoryLedger(box){')),ctx);
const inspect=x=>JSON.parse(vm.runInContext('JSON.stringify('+x+')',ctx));assert.deepEqual(inspect('PT44_POWER_DYNAMIC_V1'),spec);assert(inspect('pt44PowerModelAudit()').ok);const panel=vm.runInContext("pt44PowerModelHTML('POWER',x=>x)",ctx);assert(panel.includes('Restore parts')&&panel.includes('Ripple RMS')&&panel.includes('not factory-calibrated')&&panel.includes('powerModelFormV54'));assert.equal(vm.runInContext("pt44PowerModelHTML('RF',x=>x)",ctx),'');
// Exercise the actual form handlers with a minimal host; no shop-inventory changes are implied.
vm.runInContext('globalThis.R={};globalThis.renderViews=()=>{globalThis.powerRenderCount=(globalThis.powerRenderCount||0)+1;};',ctx);
const state=inspect('pt44PowerWorkbenchState()'),elements=Object.fromEntries(Object.entries({...state,fault:'smoothing_dry'}).map(([k,v])=>[k,{value:String(v)}])),form={elements},repair={},exportButton={},error={textContent:''};const host={querySelector:s=>({'#powerModelFormV54':form,'#powerRepairV54':repair,'#powerExportV54':exportButton,'#powerModelErrorV54':error})[s]};ctx.powerHost=host;vm.runInContext('pt44BindPowerWorkbench(powerHost)',ctx);form.onsubmit({preventDefault(){}});assert.equal(inspect('R.powerBenchV54.fault'),'smoothing_dry');repair.onclick();assert.equal(inspect('R.powerBenchV54.fault'),'healthy');elements.line_v.value='NaN';form.onsubmit({preventDefault(){}});assert(error.textContent.includes('finite'));assert.equal(inspect('R.powerBenchV54.line_v'),115);
const deck=power.spiceDeck(spec,graph,{});assert.equal(deck,fs.readFileSync(path.join(root,'engineering/PT44_Power_Dynamic_v54.cir'),'utf8'));assert(deck.includes('R30_40 LINE_IN PLATE 40'));assert(deck.includes('R30_80 PLATE HEATER_IN 80'));assert(deck.includes('LFIELD FIELD_L N_BPLUS_FILT 5'));assert(!deck.includes('CHASSIS'));
const parity=[];
if(process.argv.includes('--ngspice')){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pt44-power-'));
 try{for(const [name,input] of [...spec.faults.map(f=>[f.id,f.changes]),['dc_supply',{line_mode:'DC'}]]){
  const file=path.join(tmp,name+'.cir');fs.writeFileSync(file,power.spiceDeck(spec,graph,input));const exec=spawnSync(process.env.PT44_NGSPICE||'ngspice',['--batch',file],{encoding:'utf8',maxBuffer:30*1024*1024});assert.equal(exec.status,0,(exec.stdout||'').slice(-4000)+'\n'+(exec.stderr||'').slice(-2000)+' '+String(exec.error||''));
  const rows=[...exec.stdout.matchAll(/^\s*\d+\s+([0-9.eE+-]+)\s+([0-9.eE+-]+)\s+([0-9.eE+-]+)\s+([0-9.eE+-]+)\s*$/gm)].map(m=>({time_s:+m[1],reservoir_v:+m[2],filtered_v:+m[3],field_current_a:+m[4],rectifier_current_a:0,heater_current_a:0}));assert(rows.length>1000,'No SPICE transient samples');
  const result=run(input),summary=power.summary(rows,result.measurement_from_s,2);
  for(const key of ['reservoir_v','filtered_v']){assert(Math.abs(summary[key].mean-result.summary[key].mean)<0.6,name+' '+key+' DC parity');assert(Math.abs(summary[key].peak_to_peak-result.summary[key].peak_to_peak)<Math.max(0.05,0.02*summary[key].peak_to_peak),name+' '+key+' ripple parity '+summary[key].peak_to_peak+' vs '+result.summary[key].peak_to_peak);}
  assert(Math.abs(summary.field_current_a.mean-result.summary.field_current_a.mean)<0.0002,name+' field-current parity');parity.push({case:name,inputs:input,javascript:{reservoir_v:result.summary.reservoir_v,filtered_v:result.summary.filtered_v,field_current_a:result.summary.field_current_a},ngspice:{reservoir_v:summary.reservoir_v,filtered_v:summary.filtered_v,field_current_a:summary.field_current_a}});console.log('SPICE parity:',name);
 }}finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
if(process.argv.includes('--write-report')){assert(process.argv.includes('--ngspice'));fs.writeFileSync(path.join(root,'engineering/PT44_Power_Dynamic_Validation_V1.json'),JSON.stringify({schema:'PT44_POWER_DYNAMIC_VALIDATION_V1',version:'0.54.0',model:'Philco PT-44 dynamic power core',scope:'Independent numerical validation under explicit model assumptions; not measured factory acceptance targets.',checks:['Independent DC operating point','Discrete KCL and energy balance','Timestep convergence','Fault and restore behavior','Coupled receiver load Jacobian','Browser/module identity and form handlers','Source topology and value mutation guards','Nine independent ngspice transient comparisons'],spice_version:'42',comparison_limits:{mean_voltage_abs_v:0.6,ripple_peak_to_peak_abs_floor_v:0.05,ripple_peak_to_peak_relative:0.02,mean_field_current_abs_a:0.0002},cases:parity,full_receiver_validated:false},null,2)+'\n');}
console.log('PASS v0.54 power dynamics: DC operating point, energy/KCL, timestep convergence, fault/repair behavior, load ports, UI handlers and source guards'+(process.argv.includes('--ngspice')?' with independent ngspice transients':''));
