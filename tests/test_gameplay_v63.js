const assert=require('node:assert/strict'),fs=require('node:fs'),{m,healthy,html,scripts}=require('./gameplay_helpers_v63'),spec=require('../gameplay/PT44_Game_Model_V1.json'),core=require('../gameplay/pt44_behavior_v63');
let checks=0;function check(x,msg){checks++;assert(x,msg);}const ev=(r,e)=>m.settle(r,e),clone=x=>JSON.parse(JSON.stringify(x)),base=ev(healthy());
check(html.includes('// BEGIN PT44_BEHAVIOR_V63\n'+fs.readFileSync('gameplay/pt44_behavior_v63.js','utf8')+'// END PT44_BEHAVIOR_V63'),'canonical runtime embedded exactly');
for(let i=0;i<scripts.length;i++)new(require('node:vm').Script)(scripts[i]);
check(JSON.stringify(base)===JSON.stringify(core.evaluate(spec,healthy())),'standalone and runtime agree');
check(base.signal.loud>.42&&base.signal.hum<.05&&base.signal.dist<.12,'healthy service limits');
check(base.ports.B1>100&&base.ports.B2>90&&base.ports.P5>70&&base.ports.K5>5&&base.ports.P6>20&&base.ports.SCREEN>40,'plausible declared service reference');
const matrix=[
 ['heater','V2',p=>p.heaterOk=false,d=>!d.lit&&d.signal.loud===0],
 ['c1dry','C1',p=>p.uF=3,d=>d.signal.hum>.05],['c2dry','C2',p=>p.uF=2,d=>d.signal.hum>.05],
 ['c3leak','C3',p=>{p.leak0=2;p.vcoef=.03},d=>d.ports.G5>2&&d.stress.R2.ratio>1.2&&d.signal.dist>.12],
 ['c3open','C3',p=>p.uF=.00003,d=>d.signal.levels.a1>.3&&d.signal.levels.g5<.02],
 ['r4drift','R4',p=>p.ohms*=8,d=>d.signal.levels.det>.3&&d.signal.levels.a1<.12&&d.ports.P6<15],
 ['r2open','R2',p=>p.open=true,d=>d.signal.levels.g5>.3&&d.signal.loud===0],
 ['v4weak','V4',p=>p.emis=.3,d=>d.signal.loud<.3&&d.signal.dist>.12],
 ['v1weak','V1',p=>p.emis=.3,d=>d.signal.osc<.4&&d.signal.loud<.3],
 ['v2weak','V2',p=>p.emis=.2,d=>d.signal.levels.conv>.8&&d.signal.levels.if<.2],
 ['v5weak','V5',p=>p.emis=.2,d=>d.ports.B1<60&&d.signal.loud<.1],
 ['r6open','R6',p=>p.open=true,d=>d.ports.OSC===0&&d.signal.loud===0],
 ['otopen','T1',p=>p.open=true,d=>d.ports.P5===0&&d.signal.levels.g5>.3&&d.signal.loud===0],
 ['vrscratch','VR1',p=>p.scratch=.8,d=>d.signal.crackle>.2],
 ['hk','V3',p=>p.hk=.5,d=>d.signal.hum>.2],
 ['c2short','C2',p=>p.leak0=.00005,d=>d.ports.B2<10&&d.stress.R1.ratio>3],
 ['spkopen','SP1',p=>p.open=true,d=>d.ports.P5>70&&d.signal.levels.g5>.3&&d.signal.loud===0],
 ['v4gas','V4',p=>p.gas=.8,d=>d.stress.R2.ratio>1.2],
 ['osccoil','L1',p=>p.open=true,d=>d.signal.osc===0],['c4open','C4',p=>p.open=true,d=>d.signal.osc===0]
];
check(matrix.length===m.FAULTS.length&&matrix.every(x=>m.FAULTS.some(f=>f.id===x[0])),'every stock fault represented');
const evidence=[];for(const [id,slot,damage,predicate]of matrix){const r=healthy(),original=clone(r.slots[slot]);damage(r.slots[slot]);const bad=ev(r);check(predicate(bad),id+' has diagnostic symptom');const wrong=clone(r);wrong.slots.VR1=clone(healthy().slots.VR1);if(slot!=='VR1')check(predicate(ev(wrong)),id+' unrelated repair ineffective');r.slots[slot]=original;check(JSON.stringify(ev(r))===JSON.stringify(base),id+' replacement restores all outputs');evidence.push({id,slot,loud:bad.signal.loud,hum:bad.signal.hum});}
for(let dial=540;dial<=1600;dial+=10){const r=healthy();r.dial=dial;const d=ev(r,{generator:{enabled:true,point:'aerial',khz:dial,mv:1}});check(d.signal.lo_khz-dial===455&&d.signal.generatorTone>.4,'full band high-side conversion '+dial);}
for(const kc of [610,880,1150,1340]){const r=healthy();r.dial=kc;check(ev(r).signal.station.kc===kc,'station selection '+kc);r.dial=kc+40;check(ev(r).signal.loud<.05,'off-station suppression');}
let r=healthy();r.vol=0;check(ev(r).signal.loud===0,'volume zero');r.vol=1;check(ev(r).signal.loud>base.signal.loud,'volume rises');
r=healthy();r.slots.V2.emis=0;let d=ev(r);check(d.signal.levels.conv>.8&&d.signal.levels.if===0,'upstream tracer survives dead IF');
r=healthy();r.slots.L1.open=true;const gen={enabled:true,point:'if',khz:455,mv:1};check(ev(r,{generator:gen}).signal.loud>.4,'IF injection bypasses dead oscillator');check(ev(r,{generator:{...gen,point:'aerial',khz:880}}).signal.loud===0,'aerial injection still needs oscillator');
r=healthy();r.slots.V2.emis=0;check(ev(r,{generator:{...gen,point:'audio',khz:1,mv:20}}).signal.loud>.4,'audio injection bypasses IF');
for(const k of ['12A','12B','14A','4A','5']){r=healthy();r.alignment={[k]:k==='4A'||k==='5'?25:465};const bad=ev(r);check(bad.signal.loud<base.signal.loud*.9,'misalignment '+k);r.alignment[k]=k==='4A'||k==='5'?0:455;check(ev(r).signal.loud===base.signal.loud,'manual peak '+k);}
r=healthy();r.loopConnected=false;check(ev(r).signal.loud===0&&ev(r).signal.osc>0,'loop loss distinguished from dead oscillator');r.loopConnected=true;check(ev(r).signal.loud===base.signal.loud,'loop repair');
const vt=ev(healthy(),{meter:{node:'P6',R:11e6}}),vom=ev(healthy(),{meter:{node:'P6',R:50000}});check(vom.ports.P6<vt.ports.P6*.3&&vom.signal.loud<vt.signal.loud*.3,'loaded plate probe affects audio and voltage');
const loaded=ev(healthy(),{meter:{node:'AVC',R:10000}});check(Math.abs(loaded.AVC)<Math.abs(base.AVC)*.01&&loaded.signal.loud>base.signal.loud,'AVC probe unloads gain');
let avc=0;for(let i=0;i<20;i++)avc=ev(healthy(),{avc_v:avc,dt_s:.05}).AVC;check(Math.abs(avc)>Math.abs(base.AVC)*.99,'AVC attack');r=healthy();r.loopConnected=false;const release=ev(r,{avc_v:avc,dt_s:.6}).AVC;check(Math.abs(release)>Math.abs(avc)*.36&&Math.abs(release)<Math.abs(avc)*.38,'AVC release');
check(ev(healthy(),{warm:0}).signal.loud===0,'cold startup silent');check(ev(healthy(),{power:false,off_v:base.V,off_elapsed_s:10}).signal.loud===0,'off silent despite stored charge');check(core.storedVoltage(110,10)>30&&core.storedVoltage(110,100)<30,'charge decays');
check(ev(healthy(),{line_mode:'DC'}).signal.hum===0,'DC removes filter ripple');check(ev(healthy(),{line_v:90}).ports.B1<ev(healthy(),{line_v:130}).ports.B1,'line voltage follows supply');
r=healthy();r.slots.C3.leak0=2;r.slots.C3.vcoef=.03;for(let i=0;i<30;i++)m.applyStress(r,ev(r),1);check(r.slots.R2.open||r.slots.R2.charred,'unrepaired leakage causes downstream damage');
assert.throws(()=>ev(healthy(),{line_v:200}));assert.throws(()=>ev(healthy(),{generator:{...gen,mv:NaN}}));
const contract=require('../gameplay/PT44_Game_Completion_V2.json');check(contract.packages.length===9&&['EC-04','EC-06'].every(id=>contract.closed_ec_ids.includes(id)),'fixed nine package standard and explicit closures');
fs.mkdirSync('tmp/pt44-gameplay',{recursive:true});fs.writeFileSync('tmp/pt44-gameplay/core-evidence.json',JSON.stringify({checks,baseline:base,faults:evidence},null,2));console.log('PASS '+checks+' behavioral gameplay checks');
