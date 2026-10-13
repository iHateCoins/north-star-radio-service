from pathlib import Path
import json, re, copy
BASE=Path('/mnt/data/North_Star_Radio_Service_v0_12_PT44.html')
DIR=Path('/mnt/data/pt44_v13')
old=json.loads(Path('/mnt/data/pt44_v12/PT44_Factory_Reference_V2.json').read_text())
base=BASE.read_text()
# Rename prototype-local slot names into unambiguous Philco factory part IDs.
by_slot={'R1':'28','R2':'24','R3':'23','R4':'21','C1':'29A','C2':'29B','C3':'20','T1':'26','SP1':'27','T2':'12','T3':'14'}

# Part terminal counts: 'structural' terminals are engineering placeholders until each winding is traced.
passive={'capacitor':('a','b'),'resistor':('a','b')}
kind={}
for num,entry in old['factory_part_register'].items():
 d=entry['description'].lower()
 if 'capacitor' in d or 'condenser' in d or 'mica' in d or 'electrolytic' in d: k='capacitor'
 elif 'resistor' in d: k='resistor'
 elif 'aerial transformer' in d: k='aerial_transformer'
 elif 'loop aerial' in d: k='loop_aerial'
 elif 'tuning' in d or 'compensator' in d: k='tuning_assembly'
 elif 'choke assembly' in d: k='compound_assembly'
 elif 'oscillator transformer' in d: k='oscillator_transformer'
 elif 'if transformer' in d or 'if transformer' in d.replace('.', ''): k='if_transformer'
 elif 'output transformer' in d: k='output_transformer'
 elif 'field coil' in d: k='field_coil'
 elif 'speaker' in d: k='speaker'
 elif 'volume control' in d: k='potentiometer'
 elif 'pilot lamp' in d: k='lamp'
 else: k='unclassified'
 kind[num]=k

part_term={
 '2':['primary_a','primary_b','secondary_a','secondary_b'],
 '3':['loop_a','loop_b'],
 '4':['rf_stator','osc_stator','rotor'],
 '6':['cap_a','cap_b','choke_a','choke_b'],
 '10':['primary_a','primary_b','secondary_a','secondary_b'],
 '12':['pPlate','pSupply','sGrid','sReturn'],
 '14':['pPlate','pSupply','sDetector','sReturn'],
 '16':['a','wiper','b','switch_a','switch_b'],
 '26':['a','b','sA','sB'],
 '27':['voiceA','voiceB'],
 '28':['a','b'],
 '30':['endA','tap','endB'],
 '32':['a','b'],
}
for n,k in kind.items():
 if n not in part_term:
  part_term[n]=['a','b'] if k in ['capacitor','resistor','field_coil','lamp'] else ['a','b']

known_nets=[]
for n in old['nets']:
 net=copy.deepcopy(n)
 net['stage_status']='traced_limited' if n['stage'] not in ('IF (partial)',) else 'partial_signal_side_only'
 net['evidence']={'document':'Philco 1941 RMS Year Book','printed_page':38,'figure':'Schematic diagram — PT-42, PT-44', 'verification':'source-traced from v0.12, still pending independent second-reader verification'}
 def refconvert(ref):
  part,sep,term=ref.partition(':');return by_slot.get(part,part)+sep+term
 net['factory_members']=[refconvert(x) for x in n['members']]
 # preserve model crosswalk for legacy game, but never assert factory paths from the model
 net['prototype_member_crosswalk']=net.pop('members')
 known_nets.append(net)

# Component registry treats an electrical device as present even when its pins/networks are not yet traced.
components={}
for n,p in old['factory_part_register'].items():
 terminals=part_term[n]
 slots=[s for s,fac in by_slot.items() if fac==n]
 components[n]={
  'description':p['description'],
  'category':kind[n],
  'terminals':terminals,
  'terminal_definition_status':'functional_only' if n in ['2','3','4','6','10','12','14','16','26','30'] else 'two_terminal_physical_structure',
  'factory_schematic_position':'1941 RMS p.38; numeric callout #'+n,
  'source_page':38,
  'model_slots':slots,
  'connectivity':'traced_subset' if p['connection_status']=='traced' else p['connection_status'],
  'geometry_certified':False,
 }
# Speaker field coil #28 and voice-coil #27 are separate real electrical devices,
# even though one speaker assembly houses both.

# Consistency check against factory IDs and known terminal lists.
invalid=[];used={}; stage_tallies={}
for net in known_nets:
 stage_tallies[net['stage']]=stage_tallies.get(net['stage'],0)+1
 for ref in net['factory_members']:
  if ':' not in ref:invalid.append('no terminal on '+ref);continue
  comp,pin=ref.split(':',1)
  if comp.startswith('V'):
   if comp not in ['V1','V2','V3','V4','V5']:invalid.append('invalid tube '+ref)
   elif pin not in [str(i) for i in range(1,9)]:invalid.append('invalid tube pin '+ref)
  elif comp not in components:invalid.append('unknown factory part '+ref)
  elif pin not in components[comp]['terminals']:invalid.append('undefined terminal '+ref)
  if ref in used and used[ref]!=net['id']:invalid.append('short: '+ref+' is in '+used[ref]+' and '+net['id'])
  used[ref]=net['id']
# Only match stage membership on exact crosswalk. Do not treat part-value identity as a connection.

reference={
 'schema':'PT44_FACTORY_TRANSCRIPTION_V3', 'model':'Philco PT-44','year':1941,
 'source':old['source'],'source_page':38,
 'status':'PARTIAL_FACTORY_TRANSCRIPTION_NOT_SPICE_READY',
 'evidence_policy':'The published source is a schematic and parts diagram. Device terminal naming is provisional where exact pins/winding contacts have not been read from the drawing. 3D lead dress is not documented wire-for-wire.',
 'factory_components':components,
 'tube_pin_reference':{
  'V1':{'type':'7A8','heater':['1','8'],'role':'converter'},
  'V2':{'type':'7B7','heater':['1','8'],'role':'IF amplifier'},
  'V3':{'type':'7C6','heater':['1','8'],'role':'detector, AVC, first audio'},
  'V4':{'type':'50L6GT','heater':['2','7'],'role':'output pentode'},
  'V5':{'type':'35Z3','heater':['1','8'],'role':'rectifier'},
 },
 'factory_nets':known_nets,
 'subcircuits':[
  {'id':'RF','name':'Loop aerial and converter input','parts':['1','2','3','4','5','6','7','8','9','10','11'], 'status':'not_fully_transcribed','unverified':'RF coil, tuning condenser, 7A8 grid/screen nodes'},
  {'id':'IF','name':'455-kHz IF amplifier and transformers','parts':['12','13','14'], 'status':'partial','unverified':'Both complete winding pairs, supply, detector side, trimmer capacitors'},
  {'id':'DETECTOR','name':'7C6 detection, AVC and volume','parts':['15','16','17','18','19'], 'status':'not_fully_transcribed','unverified':'All diode load/AVC/filter junctions and volume control pot tracks'},
  {'id':'AUDIO','name':'7C6 / 50L6GT and speaker','parts':['20','21','22','23','24','25','26','27'], 'status':'partial','unverified':'#22 and #25 return paths, transformer/speaker winding characteristics'},
  {'id':'POWER','name':'Rectifier, field-coil filter and AC line','parts':['28','29A','29B','30','31','32'], 'status':'partial','unverified':'Line dropper taps, pilot-lamp branch, B- vs metal chassis isolation, field-coil inductance'}
 ],
 'verified_part_ledger':list(components.keys()),
 'open_issues':[
  {'id':'P1-RF','severity':'blocker','stage':'RF','description':'Transcribe all aerial, tuning, oscillator and 7A8 connections from p.38; do not infer winding returns from component proximity.'},
  {'id':'P1-IF','severity':'blocker','stage':'IF','description':'Trace #12/#14 primary and secondary winding terminals, trimmers, 7B7 screen and AVC connections.'},
  {'id':'P1-DET','severity':'blocker','stage':'DETECTOR','description':'Trace 7C6 diode pins and all #15–#19 passive connections; distinguish detector return, AVC and audio grid.'},
  {'id':'P1-OUTPUT','severity':'blocker','stage':'AUDIO','description':'Verify #22 and #25 routes; trace full output-transformer primary and secondary plus voice coil.'},
  {'id':'P1-AC','severity':'blocker','stage':'POWER','description':'Trace the #30 40/80 Ω assembly, #31 line capacitor and #32 pilot lamp exactly, including AC line/common return.'},
  {'id':'P1-SOURCE','severity':'blocker','stage':'ALL','description':'Independently recheck every connection on a legible high-resolution factory scan and record confidence for all net memberships.'},
  {'id':'P2-SPICE','severity':'later','stage':'ALL','description':'Replace reduced-order model with validated tube, transformer and passive SPICE models.'},
 ],
 'checks':{
  'factory_register_count':len(components),'traced_network_count':len(known_nets),
  'factory_terminals_on_traced_nets':len(used),'unresolved_graph_errors':invalid,
  'factory_wiring_fully_transcribed':False,'simulator_matches_factory':False,
  'chassis_lead_dress_factory_verified':False,
  'benchmark_ready':False,
 },
 'version':'0.13.0'
}
assert len(components)==33 and len(known_nets)==16 and not invalid,invalid
(DIR/'PT44_Factory_Transcription_V3.json').write_text(json.dumps(reference,ensure_ascii=False,indent=2)+'\n')

# Added source ledger in the playable game with data exported from the same machine-readable json.
needle='// ===== PT-44 engineering milestone 0.8: one circuit graph'
idx=base.find(needle)
assert idx>0
embedded='const PT44_FACTORY_V3 = Object.freeze('+json.dumps(reference,ensure_ascii=False,separators=(',',':'))+');\n\n'
base=base[:idx]+embedded+base[idx:]

js=r'''
// ===== v0.13 · Philco factory transcription / provenance gate =====
function factoryV3Audit(){
  const r=PT44_FACTORY_V3, issues=[], assigned=new Map(), stage={}, unmapped=[];
  for(const [id,c] of Object.entries(r.factory_components)){
    if(!Array.isArray(c.terminals)||new Set(c.terminals).size!==c.terminals.length)issues.push('#'+id+': invalid terminal declarations');
  }
  for(const n of r.factory_nets){
    stage[n.stage]=(stage[n.stage]||0)+1;
    for(const ref of n.factory_members){
      const [id,pin]=ref.split(':');
      const exists=id.startsWith('V')?r.tube_pin_reference[id] : r.factory_components[id];
      if(!exists)issues.push(ref+': factory part/tube not declared');
      else if(id.startsWith('V') ? !/^\d$/.test(pin)||Number(pin)<1||Number(pin)>8 : !exists.terminals.includes(pin)) issues.push(ref+': terminal not declared');
      if(assigned.has(ref)&&assigned.get(ref)!==n.id)issues.push(ref+': multiple electrical nets');
      assigned.set(ref,n.id);
    }
    if(!n.evidence||n.evidence.printed_page!==38)issues.push(n.id+': source provenance missing');
  }
  for(const [id,c] of Object.entries(r.factory_components))if(!c.model_slots.length)unmapped.push(id);
  const unknownConnections = r.open_issues.filter(x=>x.severity==='blocker');
  return {issues,sourceNets:r.factory_nets.length,parts:Object.keys(r.factory_components).length,
    tracedTerminals:assigned.size,stages:stage,unmapped,unknownConnections,
    benchmarkReady:issues.length===0&&r.checks.factory_wiring_fully_transcribed&&r.checks.simulator_matches_factory&&r.checks.chassis_lead_dress_factory_verified&&unknownConnections.length===0};
}
function renderFactoryLedger(box){
  const g=PT44_FACTORY_V3,a=factoryV3Audit();
  const all=['ALL',...g.subcircuits.map(s=>s.id)];
  const choice=R.factoryStage||'ALL';
  const sub=choice==='ALL'?null:g.subcircuits.find(s=>s.id===choice);
  const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const scope=sub?new Set(sub.parts):null;
  const relevant=Object.entries(g.factory_components).filter(([id])=>!scope||scope.has(id));
  const wired = new Set(g.factory_nets.flatMap(n=>n.factory_members.map(ref=>ref.split(':')[0])));
  const candidates = Object.fromEntries(Object.entries(PT44_FACTORY_SUBGRAPH.factory_part_register).map(([n,p])=>[n,p.game_slot||'—']));
  box.style.background='#ece2ca';box.style.color='#312a20';
  box.innerHTML=`<section class="source-ledger">
   <div class="sl-eyebrow">ENGINEERING NOTEBOOK · PT-44 · FACTORY DOCUMENT p. 38 · v0.13</div>
   <h2>Factory circuit transcription</h2>
   <p>Every Philco-numbered part is represented as a distinct electrical device. <b>Only connections read from the factory sheet appear as traced;</b> other terminal definitions specify the device structure, not invented wiring. The current 3D and simplified receiver solver remain provisional.</p>
   <div class="sl-kpi"><div><strong>${a.parts}/33</strong><span>Factory part records</span></div><div><strong>${a.sourceNets}</strong><span>Partial traced networks</span></div><div><strong>${a.tracedTerminals}</strong><span>Terminal references</span></div><div><strong>${a.unknownConnections.length}</strong><span>Open Phase-1 blockers</span></div></div>
   <div class="sl-alert">${a.benchmarkReady?'BENCHMARK READY':'FACTORY TRANSCRIPTION INCOMPLETE'} · ${a.issues.length?'Audit errors: '+a.issues.map(escapeHTML).join(', '):'Source-ledger integrity checks pass, but the full radio and SPICE verification are still outstanding.'}</div>
   <div class="sl-toolbar"><span>Inspect stage:</span>${all.map(id=>`<button type="button" class="sl-btn ${id===choice?'sl-on':''}" data-stage="${id}">${id}</button>`).join('')}</div>
   <h3>${sub?escapeHTML(sub.name):'All factory parts'}</h3>
   ${sub?`<p><b>Still missing:</b> ${escapeHTML(sub.unverified)}</p>`:'<p>Select a stage to see which connections are traced, which parts still lack pin mapping, and what blocks certification.</p>'}
   <table class="sl-table"><thead><tr><th>Philco #</th><th>Component</th><th>Declared terminals</th><th>Traced?</th><th>Prototype slot</th></tr></thead><tbody>
   ${relevant.map(([id,c])=>`<tr><td><b>${id}</b></td><td>${escapeHTML(c.description)}</td><td>${c.terminals.map(escapeHTML).join(' · ')}</td><td class="${wired.has(id)?'sl-yes':'sl-no'}">${wired.has(id)?'Some terminals':'Pending'}</td><td>${escapeHTML(candidates[id]||'—')}</td></tr>`).join('')}
   </tbody></table>
   <h3>Traceable electrical nets</h3>
   <div class="sl-net-list">${g.factory_nets.filter(n=>!sub|| n.factory_members.some(m=>scope.has(m.split(':')[0]))).map(n=>`<div class="sl-net"><b>${escapeHTML(n.title)}</b><small>${escapeHTML(n.id)} · ${escapeHTML(n.stage)}</small><div>${n.factory_members.map(escapeHTML).join(' — ')}</div><small>${escapeHTML(n.evidence.figure)} · p.38 · ${escapeHTML(n.evidence.verification)}</small></div>`).join('')||'<p>No traced source nets yet for this stage.</p>'}</div>
   <h3>Outstanding acceptance work</h3><div class="sl-issues">${g.open_issues.filter(x=>x.severity==='blocker'&&(!sub||x.stage===choice||x.stage==='ALL')).map(x=>`<div><b>${escapeHTML(x.id)}</b> ${escapeHTML(x.description)}</div>`).join('')}</div>
   <div class="sl-toolbar"><button class="sl-btn sl-export" id="bExportFactoryV3">Export factory graph JSON</button><a href="${g.source}" target="_blank" rel="noopener noreferrer">Original 1941 service document ↗</a></div>
   <p class="sl-footnote">Engineering principle: 3D routing can only be certified after all electrical nets have documented pin membership. A plausible physical wire path is not a factory schematic connection.</p>
  </section>`;
  box.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{R.factoryStage=b.dataset.stage;renderViews();});
  const exp=box.querySelector('#bExportFactoryV3');if(exp)exp.onclick=()=>{
    const blob=new Blob([JSON.stringify(g,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='PT44_Factory_Transcription_V3.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
}
'''
pos=base.find('function renderViewTabs(){')
assert pos!=-1
base=base[:pos]+js+'\n'+base[pos:]
# source audit table tab
base=base.replace("['factorytopo','Factory benchmark'],['factory','1941 factory data']", "['factorytopo','Factory benchmark'],['ledger','Factory ledger'],['factory','1941 factory data']")
base=base.replace("(R.view==='sch'||R.view==='factory'||R.view==='nets'||R.view==='factorytopo')", "(R.view==='sch'||R.view==='factory'||R.view==='nets'||R.view==='factorytopo'||R.view==='ledger')")
base=base.replace("if(R.view==='factory'){ renderPT44Factory(box); return; }", "if(R.view==='factory'){ renderPT44Factory(box); return; }\n  if(R.view==='ledger'){ renderFactoryLedger(box); return; }")
# version identifiers in factory view, without undermining provenance
base=base.replace('VERSION 0.12','VERSION 0.13')
css='''
/* v0.13 factory electrical transcription notebook */
.source-ledger{max-height:min(75vh,740px);overflow:auto;padding:20px 22px;font:13px/1.48 var(--body),Arial,sans-serif}
.source-ledger h2{font:700 27px var(--display),Georgia,serif;margin:6px 0 10px;color:#33281b}
.source-ledger h3{font:700 18px var(--display),Georgia,serif;margin:20px 0 7px}
.source-ledger p{max-width:100ch;margin:8px 0 12px;color:#4f4535}
.sl-eyebrow{font:700 10px var(--mono);letter-spacing:.12em;color:#856f4b}
.sl-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0}
.sl-kpi>div{background:#ddd1b5;border:1px solid #b8a783;border-radius:5px;padding:11px}
.sl-kpi strong{display:block;font:700 20px var(--mono);color:#33281b}
.sl-kpi span{display:block;font-size:11px;color:#645740}
.sl-alert{padding:12px;border:1px solid #9d8859;background:#e7d5a9;color:#60421e;border-radius:4px;font-weight:700;margin:12px 0}
.sl-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0;font-size:12px}
.sl-btn{border:1px solid #a18e6b;background:#f6edd7;color:#493821;border-radius:3px;padding:5px 8px;font:700 12px var(--mono);cursor:pointer}
.sl-btn.sl-on,.sl-btn:hover{background:#8b632c;color:#fff;border-color:#8b632c}
.sl-table{width:100%;border-collapse:collapse;font:12px/1.3 var(--mono);min-width:530px}
.sl-table th,.sl-table td{padding:7px 6px;border-bottom:1px solid #c3b494;text-align:left;vertical-align:top}
.sl-table th{background:#d5c6a6;color:#4b3a27}
.sl-yes{color:#346246;font-weight:700}.sl-no{color:#9a6539}
.sl-net-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:7px}
.sl-net{border:1px solid #c3b494;border-radius:4px;padding:9px;min-width:0;background:#f5eeda}
.sl-net b,.sl-net small{display:block}.sl-net small{font:10px var(--mono);color:#766749;margin:4px 0}
.sl-net div{font:12px var(--mono);overflow-wrap:anywhere}
.sl-issues>div{border-left:3px solid #a87134;background:#e5d9bf;padding:8px 12px;margin:5px 0}
.sl-footnote{font:11px/1.4 var(--mono);padding-top:12px;border-top:1px solid #b8a783}
@media(max-width:680px){.source-ledger{padding:12px}.sl-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}}
'''
base=base.replace('</style>',css+'</style>',1)
output=DIR/'North_Star_Radio_Service_v0_13_PT44.html'
output.write_text(base)
Path('/mnt/data/North_Star_Radio_Service_v0_13_PT44.html').write_text(base)
print('built',output,'bytes',output.stat().st_size)
print('components',len(components),'nets',len(known_nets),'terminals',len(used),'errors',invalid)
