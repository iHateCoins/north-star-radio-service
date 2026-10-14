const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const model=JSON.parse(fs.readFileSync(path.join(root,'engineering/PT44_Heater_String_Model_V1.json'),'utf8'));
const deckPath=path.join(root,model.spice_artifact),deck=fs.readFileSync(deckPath,'utf8');
const heaterR=model.heaters.map(x=>x.voltage_v/x.current_a);
const heaterV=model.heaters.reduce((n,x)=>n+x.voltage_v,0),heaterOhms=heaterR.reduce((n,x)=>n+x,0);
assert(Math.abs(heaterV-model.derived_nominal_targets.heater_sum_v)<1e-9);
assert(Math.abs(heaterOhms-model.derived_nominal_targets.heater_equivalent_resistance_ohm)<1e-9);
assert(Math.abs(model.source_line_voltage_v-heaterV-model.derived_nominal_targets.line_minus_heater_sum_v)<1e-9);
assert(Math.abs((model.source_line_voltage_v-heaterV)/model.heater_reference_current_a-model.derived_nominal_targets.equivalent_drop_at_reference_current_ohm)<1e-9);
assert.equal(model.heaters.length,5);assert.equal(model.factory_dropper.sections_ohm[0]+model.factory_dropper.sections_ohm[1],120);
assert.equal(model.factory_dropper.lamp_shunts_section_ohm,40);assert.equal(model.factory_dropper.lamp_iv_model,null);
assert.equal(model.validation_status.full_receiver_behavior_validated,false);assert.equal(model.validation_status.benchmark_ready,false);
for(const term of ['VOPEN NOSRC 0 DC 115','R30_OPEN_40 NOSRC NOTAP 40','R30_OPEN_80 NOTAP NOHEATER 80','R30_SHORT_40 NBSRC NBTAP 40','VLAMP_IDEAL_SHORT NBSRC NBTAP DC 0','R30_SHORT_80 NBTAP NBHEATER 80','R35Z3_OPEN NOHEATER NO50 233.33333333333334','R50L6_OPEN NO50 NO7A8 333.3333333333333','R7A8_OPEN NO7A8 NO7B7 42','R7B7_OPEN NO7B7 NO7C6 42','R7C6_OPEN NO7C6 0 42','.control','op','print -i(VOPEN)','print v(NOHEATER)','print -i(VSHORT)','print v(NBHEATER)'])assert(deck.includes(term),term);
for(const s of model.spice_scenarios){
 const current=model.source_line_voltage_v/(heaterOhms+s.effective_part_30_ohm);
 assert(Math.abs(current-s.current_a)<1e-12,s.id+' current parity');
 assert(Math.abs(current*heaterOhms-s.heater_sum_v)<1e-9,s.id+' voltage parity');
}
if(process.argv.includes('--ngspice')){
 const run=spawnSync('ngspice',['--batch',deckPath],{encoding:'utf8'});
 assert.equal(run.status,0,(run.stdout||'')+'\n'+(run.stderr||''));
 const log=(run.stdout||'')+'\n'+(run.stderr||'');
 const value=expr=>{const m=log.match(expr);assert(m,'ngspice output missing '+expr);return Number(m[1]);};
 const openI=value(/-i\(vopen\)\s*=\s*([+-]?[0-9.eE+-]+)/i),openV=value(/v\(noheater\)\s*=\s*([+-]?[0-9.eE+-]+)/i);
 const shortI=value(/-i\(vshort\)\s*=\s*([+-]?[0-9.eE+-]+)/i),shortV=value(/v\(nbheater\)\s*=\s*([+-]?[0-9.eE+-]+)/i);
 for(const [actual,expected,label,tolerance] of [[openI,model.spice_scenarios[0].current_a,'open-lamp current',2e-6],[openV,model.spice_scenarios[0].heater_sum_v,'open-lamp heater voltage',1e-4],[shortI,model.spice_scenarios[1].current_a,'ideal-short current',2e-6],[shortV,model.spice_scenarios[1].heater_sum_v,'ideal-short heater voltage',1e-4]])assert(Math.abs(actual-expected)<tolerance,label+' SPICE parity');
}
console.log('PASS v0.35: 115 V nominal heater arithmetic, #30/lamp boundary cases, sourced resistor-equivalent SPICE deck'+(process.argv.includes('--ngspice')?' executed with ngspice':''));
