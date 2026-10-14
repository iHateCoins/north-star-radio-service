// v0.23: factory-graph -> SPICE-compatible passive subcircuit compiler.
// This emits source-traced passive nodes only; no tube/diode/transformer reactance
// is implied, and the deck has NOT been validated in an ngspice executable yet.
function pt44SpiceNode(net){
 if(!/^F_[A-Z0-9_]+$/.test(net))throw Error('Unapproved factory SPICE node: '+net);
 return 'N_'+net.substring(2);
}
function pt44SpiceSI(x,kind){
 if(!Number.isFinite(x)||!(x>0))throw Error('Nonpositive/nonfinite SPICE component value');
 for(const [scale,suffix] of (kind==='C'?[[1e-6,'u'],[1e-9,'n'],[1e-12,'p']]:[[1e6,'Meg'],[1e3,'k']])){
  if(x>=scale*0.999999){return Number((x/scale).toPrecision(10)).toString()+suffix;}
 }
 return Number(x.toPrecision(10)).toString();
}
function pt44SpicePassiveDeck(){
 const policy=PT44_SPICE_EXPORT_V1;
 const source=pt44PassiveComponents();
 const wanted=policy.detector_parts;
 if(source.length!==wanted.length||source.some(e=>!wanted.includes(e.name.split('#')[1])))throw Error('Detector device set mismatch');
 const columns=policy.detector_ports.map(pt44SpiceNode);
 if(columns.length!==4||new Set(columns).size!==4)throw Error('Missing unique source-traced subcircuit terminals');
 const lines=['PT-44 factory-derived passive subcircuits — v0.23.0',
  '* Philco 1941 RMS p.38: only documented passives #15 #18 #19 and #28/#30 resistor structures.',
  '* ISOLATED MODEL, NOT COMPLETE PT-44. 7C6 diodes, IF transformer L/K, AVR/AVC and pilot lamp I-V UNMODELED.',
  '* N_RETURN is an isolated testbench return. NEVER assume factory B-minus equals physical chassis.',
  '.subckt NSRS_PT44_DET_PASSIVE '+columns.join(' ')];
 const seen=new Set();for(const e of source){
  const num=e.name.split('#')[1];if(seen.has(num))throw Error('Duplicate source factory part');seen.add(num);
  if(!columns.includes(pt44SpiceNode(e.a))||!columns.includes(pt44SpiceNode(e.b)))throw Error('Passive terminal not in declared subcircuit ports');
  lines.push((e.type==='C'?'C':'R')+num+' '+pt44SpiceNode(e.a)+' '+pt44SpiceNode(e.b)+' '+pt44SpiceSI(e.value,e.type));
 }
 lines.push('.ends NSRS_PT44_DET_PASSIVE','','* Speaker #28 coil: ONLY its documented 500-ohm DC resistance, not magnetic inductance.');
 const coil=PT44_FACTORY_V3.factory_components['28'];
 if(!coil||coil.category!=='field_coil'||coil.terminals.join(',')!=='a,b')throw Error('Unknown #28 field-coil terminal type');
 const fields=PT44_FACTORY_V3.factory_nets.filter(n=>n.factory_members.some(x=>x==='28:a'||x==='28:b'));
 const n1=fields.find(n=>n.factory_members.includes('28:a')),n2=fields.find(n=>n.factory_members.includes('28:b'));
 if(!n1||!n2||n1.id===n2.id)throw Error('Unverified field coil net endpoints');
 const ci=PT44_SPICE_EXPORT_V1.field_coil_dcr_ohms;
 if(ci!==500)throw Error('Factory field-coil resistance mismatch');
 lines.push('.subckt NSRS_PT44_FIELD_DCR N_FIELD_A N_FIELD_B','R28_DCR N_FIELD_A N_FIELD_B '+pt44SpiceSI(ci,'R'),'.ends NSRS_PT44_FIELD_DCR','',
  '* #30: 40 + 80 ohm INTERNAL sections; #32 lamp is shunted across the 40-ohm section but is NOT modeled.');
 const tap=PT44_PASSIVE_V1.devices['30'];
 if(tap.kind!=='tapped_power_resistor'||tap.sections.length!==2)throw Error('Factory #30 section topology missing');
 if(tap.sections[0].ohms!==40||tap.sections[1].ohms!==80||tap.lamp_shunt.parallel_to_section!=='R30_40')throw Error('Factory tapped heater resistor #30 mismatch');
 const port=['30:endA','30:tap','30:endB'];
 if(tap.terminals.join('|')!==port.join('|'))throw Error('Factory #30 tap port order changed');
 lines.push('.subckt NSRS_PT44_LINE_R30 N_R30_ENDA N_R30_TAP N_R30_ENDB');
 for(const x of tap.sections){const local=t=>t==='30:endA'?'N_R30_ENDA':t==='30:tap'?'N_R30_TAP':t==='30:endB'?'N_R30_ENDB':null;
  const p=x.endpoints.map(local);if(p.some(v=>!v))throw Error('Unknown tapped resistor endpoint');
  lines.push(x.id+' '+p.join(' ')+' '+pt44SpiceSI(x.ohms,'R'));
 }
 lines.push('.ends NSRS_PT44_LINE_R30','',
  '* ISOLATED AC bench: wiper is an artificial AC 1 V source; diode conduction is not included.',
  'XDET '+columns.join(' ')+' NSRS_PT44_DET_PASSIVE',
  'VRETURN '+pt44SpiceNode('F_DET_PASSIVE_RETURN')+' 0 DC 0',
  'VIF2 '+pt44SpiceNode('F_IF2_SECONDARY_VOL_TOP')+' '+pt44SpiceNode('F_DET_PASSIVE_RETURN')+' DC 0 AC 0',
  'VWIPER '+pt44SpiceNode('F_VOL_WIPER_C18')+' '+pt44SpiceNode('F_DET_PASSIVE_RETURN')+' DC 0 AC 1',
  '.ac dec 60 0.1 1000000','.print ac vm(N_7C6_AUDIO_GRID)','.end');
 return lines.join('\n')+'\n';
}
function pt44SpiceExportAudit(){
 const issues=[];let deck='';
 try{
  deck=pt44SpicePassiveDeck();const x=PT44_SPICE_EXPORT_V1;
  if(x.detector_parts.join('|')!=='15|18|19')issues.push('Wrong source part scope');
  if(x.detector_ports.join('|')!=='F_IF2_SECONDARY_VOL_TOP|F_VOL_WIPER_C18|F_7C6_AUDIO_GRID|F_DET_PASSIVE_RETURN')issues.push('Source port configuration is not factory verified');
  if(x.factory_wiring_complete||x.spice_engine_validated||x.unknown_tube_models_filled||x.benchmark_ready)issues.push('Incomplete source declared ready');
  for(const required of ['C15 N_IF2_SECONDARY_VOL_TOP N_DET_PASSIVE_RETURN 250p',
    'C18 N_VOL_WIPER_C18 N_7C6_AUDIO_GRID 10n',
    'R19 N_7C6_AUDIO_GRID N_DET_PASSIVE_RETURN 4.7Meg',
    'R28_DCR N_FIELD_A N_FIELD_B 500','R30_40 N_R30_ENDA N_R30_TAP 40','R30_80 N_R30_TAP N_R30_ENDB 80']){
   if(!deck.includes(required))issues.push('Exported deck failed source element parity: '+required);
  }
  if(deck.includes('V3_DIODE')||deck.includes('CHASSIS_BONDED')||deck.includes('L_IF2'))issues.push('Unverified electrical element in SPICE deck');
 }catch(e){issues.push(String(e.message||e));}
 return {ok:!issues.length,issues,lines:deck.split('\n').length,deck};
}
function pt44SpiceExportHTML(stage,esc){
 if(stage!=='ALL' && stage!=='DETECTOR' && stage!=='POWER')return '';
 const audit=pt44SpiceExportAudit();
 return `<h3>Factory-driven SPICE draft export <small style="font:11px monospace">v0.23</small></h3>
 <div class="sl-alert" style="background:${audit.ok?'#dfe9d5':'#f1cdc7'}"><b>SPICE SOURCE PARITY: ${audit.ok?'PASS':'FAIL'}</b>${audit.issues.length?' · '+audit.issues.map(esc).join('; '):' · generated from the same documented factory net memberships as the bench'}</div>
 <p>Export an <b>incomplete, SPICE-compatible</b> passive circuit deck for the three detector components, field coil's known DC resistance, and tapped #30 resistor. It also includes an <b>isolated ideal 1 V AC test source</b>; it is not the PT-44 receiver simulation.</p>
 <button class="sl-btn" type="button" id="bSpiceExportV23" ${audit.ok?'':'disabled'}>Download source-generated .cir file</button>
 <pre style="max-height:130px;overflow:auto;background:#1c231f;color:#f0d79b;border-radius:4px;font:10px/1.4 monospace;padding:9px;white-space:pre-wrap">${esc(audit.deck.split('\n').slice(0,11).join('\n'))}</pre>
 <p class="sl-footnote">This is a source-parity and netlist syntax preparation milestone. It has <b>not been executed against ngspice</b>; tube models, IF winding L/K and lamp behavior remain unknown. Current gameplay still uses the old reduced-order solver.</p>`;
}
