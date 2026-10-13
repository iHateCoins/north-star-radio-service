"""Export documented PT44 passive wiring for future ngspice integration.
Not a complete or factory-validated simulation; deliberately omits unknown coils/tube models.
"""
from pathlib import Path
import json
DIR=Path(__file__).parent
r=json.loads((DIR/'PT44_Factory_Transcription_V3.json').read_text())
net_for={}
for net in r['factory_nets']:
 for ref in net['factory_members']:
  if ref in net_for:raise RuntimeError('Factory terminal on multiple nets: '+ref)
  net_for[ref]=net['id']

# Part values from the original Philco 1941 replacement register p.38.
# Inductance values are NOT present; never invent them.
pairs={
 '29A':('C','20u','20 µF electrolytic'),
 '29B':('C','20u','20 µF electrolytic'),
 '20':('C','10n','0.01 µF coupling capacitor'),
 '21':('R','470k','470 kΩ plate load'),
 '23':('R','470k','470 kΩ output grid return'),
 '24':('R','130','130 Ω output cathode bias'),
}
netnames={'F_BPLUS_RECT':'BPLUS_RECT','F_BPLUS_FILT':'BPLUS_FILT','F_7C6_PLATE':'AUDIO_PLATE','F_50L6_GRID':'OUTPUT_GRID','F_50L6_CATH':'OUTPUT_CATH','F_BMINUS':'BMINUS'}
rows=[]
for part,(typ,val,desc) in pairs.items():
 a,b=net_for.get(part+':a'),net_for.get(part+':b')
 if not a or not b or a==b:raise RuntimeError('Missing/shorted traced terminal '+part+': '+str((a,b)))
 if a not in netnames or b not in netnames:raise RuntimeError('Outside exported network '+part+': '+str((a,b)))
 rows.append((typ+part,netnames[a],netnames[b],val,desc))
# Speaker field coil has known 500-ohm DC resistance, NOT a known inductance.
assert net_for['28:a']=='F_BPLUS_RECT' and net_for['28:b']=='F_BPLUS_FILT'
rows.insert(0,('R28_DC_ONLY','BPLUS_RECT','BPLUS_FILT','500','500 Ω DC equivalent for speaker field coil, NOT AC-accurate'))

text=['* Philco PT-44 — factory-source passive topology subset (not a complete radio)',
 '* Based on Philco 1941 RMS Year Book p.38 (Models PT-42/PT-44).',
 '* Document reference: '+r['source'],
 '* This is a partial connectivity export for engineering validation, NOT an operational radio.',
 '* Field coil #28 appears as a 500-ohm RESISTANCE PLACEHOLDER; inductance unverified.',
 '* IF transformers, RF/oscillator, 7C6 detector, rectifier and output transformer omitted.',
 '* BMINUS represents circuit common only; NOT asserted to be metal chassis.',
 '.subckt PT44_FACTORY_PASSIVE BPLUS_RECT BPLUS_FILT AUDIO_PLATE OUTPUT_GRID OUTPUT_CATH BMINUS',
]
for id,a,b,val,desc in rows:
 text.append(f'* #{id[1:].split("_")[0]} {desc}')
 text.append(f'{id} {a} {b} {val}')
text+=['.ends PT44_FACTORY_PASSIVE','','* TODO: replace R28_DC_ONLY with measured/modelled field-coil R+L.',
 '* TODO: add magnetically coupled transformer windings and authentic tube models.',
 '* TODO: complete remaining source networks before using as the game simulator.',
 '.end','']
(DIR/'PT44_Factory_Passive_Subcircuit_DRAFT.cir').write_text('\n'.join(text))

audit={'source':'Philco RMS 1941 p.38','status':'non-operational topology subset',
 'spice_parts':[r[0] for r in rows],
 'factory_part_numbers':list(pairs)+['28'],
 'all_terminal_pairs_traceable':True,
 'source_wiring_complete':False,
 'missing':['IF, RF and oscillator','7C6 detector/AVC','tube and rectifier models','coil and transformer inductances','AC mains and return isolation']}
(DIR/'PT44_Spice_Subset_Audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('exported',len(rows),'two-terminal devices; 1 field-coil DC-only placeholder')
