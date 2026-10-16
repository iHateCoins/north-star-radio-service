// Player-facing cause/effect model. No carrier stepping, tube-curve solver or fault-ID lookup.
function pt44GameClamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function pt44GameLeak(p,v){return !p?Infinity:Math.max(.5,(p.leak0??1000)*1e6/(1+(p.vcoef??0)*Math.abs(v)*((p.leak0??1000)>50?1:20)));}
function pt44GameStoredVoltage(initial,time,capUf=20,leakMohm=4){
 const tau=Math.max(.25,40*Math.max(.01,capUf)/20*Math.min(1,Math.max(.01,leakMohm)/4));return initial*Math.exp(-Math.max(0,time)/tau);
}
function pt44GameEvaluate(spec,r,env={}){
 const s=r.slots,C=pt44GameClamp,good=id=>!!s[id]&&!s[id].open,ohm=(id,fallback)=>good(id)?Math.max(.1,s[id].ohms??fallback):Infinity,cap=id=>good(id)?Math.max(0,s[id].uF||0):0;
 const lit=['V1','V2','V3','V4','V5'].every(id=>s[id]&&s[id].heaterOk),warm=C(env.warm??1),powered=env.power!==false,lineV=env.line_v??r.lineV??115,lineMode=env.line_mode??r.lineMode??'AC';
 if(!Number.isFinite(lineV)||lineV<90||lineV>130||!['AC','DC'].includes(lineMode))throw Error('Supported supply is 90–130 V AC/DC');
 const e=id=>lit&&powered?C(s[id]?.emis||0,0,1.2)*warm:0,rect=e('V5'),a=r.alignment||{},centers=['12A','12B','14A'].map(k=>a[k]??455),oscShift=a['4A']??0,rfTrim=a['5']??0;
 if(centers.some(x=>!Number.isFinite(x)||x<440||x>470)||!Number.isFinite(oscShift)||Math.abs(oscShift)>30||!Number.isFinite(rfTrim)||Math.abs(rfTrim)>30)throw Error('Alignment control outside supported range');
 const r2=ohm('R2',130)/130,leak=C((1e6/pt44GameLeak(s.C3,30)-.01)/3,0,2),gas=C(s.V4?.gas||0),shortLoad=C(1e5/pt44GameLeak(s.C2,100)-.5,0,4),screenConnected=good('R1');
 const loadGate=screenConnected?1:0,outputReturn=good('R2')?1:0;
 const I5p=.045*e('V4')*loadGate*outputReturn*(good('T1')?1:0)*(1+.8*leak+gas)/(.4+.6*r2),I5s=.005*e('V4')*loadGate*outputReturn;
 const Icv=.0045*e('V1')*loadGate,Iif=.007*e('V2')*loadGate*(good('R7')?1:0),I6=.00017*e('V3')*loadGate;
 const filteredLoad=I5s+Icv+Iif+I6+.04*shortLoad,totalLoad=I5p+filteredLoad;
 const reservoirFactor=(.65+.35*cap('C1')/(cap('C1')+2))/(.65+.35*20/22);
 let B1=110*(lineV/115)*Math.sqrt(rect)*reservoirFactor/(1+.15*(totalLoad/.06167-1)),B2=screenConnected?Math.max(0,B1-filteredLoad*ohm('R1',500)):0;B2/=1+shortLoad*3;
 if(!powered){B1=pt44GameStoredVoltage(env.off_v?.[spec.nodes.indexOf('B1')]||0,env.off_elapsed_s||0,cap('C1'),s.C1?.leak0);B2=pt44GameStoredVoltage(env.off_v?.[spec.nodes.indexOf('B2')]||0,env.off_elapsed_s||0,cap('C2'),s.C2?.leak0);}
 const supply=C(B2/102),r6=ohm('R6',22000),osc=powered&&good('L1')&&good('C4')&&pt44GameLeak(s.C4,10)>1e6&&r6>=3000&&r6<=250000?C(e('V1')*supply):0;
 const meter=env.meter,sourceR={B1:500,B2:1000,P5:1500,K5:130,G5:470000,P6:220000,G6:4700000,PCV:1500,PIF:1500,KIF:68,OSC:22000,AVC:4700000,SCREEN:27000},loading=node=>meter?.node===node?meter.R/(meter.R+sourceR[node]):1;
 if(meter&&(!(meter.node in sourceR)||!Number.isFinite(meter.R)||meter.R<=0))throw Error('Invalid behavioral meter port');
 const oscActive=osc*(meter?.node==='OSC'?C(meter.R/10000):1),loKHz=(r.dial??880)+455+oscShift*(r.dial??880)/1600,pass=f=>centers.reduce((g,x)=>g/(1+Math.pow((f-x)/8,2)),1);
 const aerial=(r.loopConnected!==false?1:0)*Math.exp(-Math.pow(rfTrim*(r.dial??880)/1600/15,2)),convGain=oscActive*C(e('V1'))*aerial,ifGain=C(e('V2'))*(good('R7')?1:0)*(good('T2')?1:0)*(good('T3')?1:0)*supply;
 const stations=env.stations||spec.stations,upstream=stations.map(st=>st.pwr*pass(Math.abs(loKHz-st.kc))*convGain),weights=upstream.map(x=>x*ifGain),bestIndex=weights.indexOf(Math.max(...weights)),radioRaw=weights[bestIndex]||0,gen=env.generator||{},enabled=!!gen.enabled;
 let generated=0;
 if(enabled){if(!['aerial','if','audio'].includes(gen.point)||!Number.isFinite(gen.khz)||!Number.isFinite(gen.mv)||gen.mv<0||gen.mv>50||gen.khz<.1||gen.khz>1600)throw Error('Invalid generator conditions');const input=C(gen.mv/(gen.point==='audio'?20:1),0,2);generated=gen.point==='aerial'?input*pass(Math.abs(loKHz-gen.khz))*convGain*ifGain:gen.point==='if'?input*pass(gen.khz)*ifGain:input;}
 const received=radioRaw+(enabled&&gen.point!=='audio'?generated:0),avcTarget=-4*received/(.3+received)*loading('AVC'),dt=env.dt_s??0;
 let avc=avcTarget;if(Number.isFinite(env.avc_v)&&dt>0){const tau=Math.abs(avcTarget)>Math.abs(env.avc_v)?.15:.6;avc=env.avc_v+(avcTarget-env.avc_v)*(1-Math.exp(-dt/tau));}
 const detector=C(e('V3'))*1.2*received/(1+.6*Math.abs(avc))/(.25+received/(1+.6*Math.abs(avc))),volume=good('VR1')?C(r.vol??.6):0;
 const audioSource=enabled&&gen.point==='audio'?generated:detector,det=audioSource*volume;
 const r4=ohm('R4',470000),audioGain=good('R4')?e('V3')*supply/(1+Math.abs(Math.log(r4/470000))*1.8):0;
 const hp=cap('C3')>0?400/Math.hypot(400,1/(2*Math.PI*Math.max(1,ohm('R3',470000))*cap('C3')*1e-6)):0;
 const V={B1,B2,P5:good('T1')?Math.max(0,B1-25*(I5p/.045)*(ohm('T1',250)/250)):0,K5:good('R2')?(I5p+I5s)*ohm('R2',130):B2*.8,G5:leak*7+gas*5,P6:good('R4')?Math.min(B2,30*supply/(Math.pow(r4/470000,.55)*Math.max(.1,e('V3')))):0,G6:good('R5')?-.35*e('V3'):-.05,PCV:good('T2')?Math.max(0,B2-5*e('V1')):0,PIF:good('T3')?Math.max(0,B2-5*e('V2')):0,KIF:good('R7')?.007*e('V2')*ohm('R7',68):B2,OSC:-10*oscActive,AVC:avc,SCREEN:45*supply};
 if(!powered){for(const k of Object.keys(V))if(!['B1','B2'].includes(k))V[k]=0;}
 if(meter&&meter.node!=='AVC')V[meter.node]*=loading(meter.node);
 const af=audioGain*loading('P6')*loading('G6'),outputGain=e('V4')*supply*outputReturn*(good('T1')?1:0)*(good('SP1')?1:0)*C(2/(1+r2));
 const a1=det*af,g5=a1*hp,loud=C(g5*1.7*outputGain,0,1.6),bias=V.K5-V.G5,drive=g5*8;
 const ripple1=lineMode==='AC'?Math.min(B1,totalLoad/(60*Math.max(cap('C1'),.5)*1e-6)*.55):0,ripple2=lineMode==='AC'?ripple1/(1+377*(good('R1')?ohm('R1',500):1e9)*Math.max(cap('C2'),.05)*1e-6):0;
 let hum=(ripple2*.003+ripple1*.0004)*outputGain;
 for(const id of ['V1','V2','V3','V4'])hum+=(s[id]?.hk||0)*(id==='V3'?.5:.25)*outputGain;
 if(!good('R5'))hum+=.35*outputGain*volume;
 const dist=C(.02+C((drive-Math.max(.5,bias))/6)+C((2-bias)/4)*C(drive)+C((.65-e('V4')))*C(drive)+C((.6-supply))*C(drive)+(s.SP1?.rub||0));
 const active=powered&&lit&&warm>.05,signal={loud:active?loud:0,hum:active?C(hum,0,1.5):0,dist:active?dist:0,stat:active?.03*volume*ifGain*outputGain/(1+received*5):0,crackle:active?(s.VR1?.scratch||0):0,lit:active,osc:oscActive,strength:radioRaw,station:active&&radioRaw>.025?stations[bestIndex]:null,stationWeights:weights,levels:{conv:Math.max(...upstream)+(enabled&&gen.point==='if'?C(gen.mv):0),if:received,det,a1,g5,spk:loud},generatorTone:active&&enabled?loud:0,generatorActive:active&&enabled,avc_v:avc,if_khz:455,lo_khz:loKHz};
 if(!active)for(const k of Object.keys(signal.levels))signal.levels[k]=0;
 const stress={};for(const [id,dv] of Object.entries({R1:B1-B2,R2:V.K5,R3:V.G5,R4:B2-V.P6,R5:V.G6,R6:V.OSC,R7:V.KIF})){if(good(id))stress[id]={P:dv*dv/ohm(id,1),ratio:dv*dv/ohm(id,1)/(s[id].W||.5)};}
 for(const [id,v] of Object.entries({C1:B1,C2:B2,C3:V.P6-V.G5})){if(s[id])stress[id]={Vc:Math.abs(v),ratio:Math.abs(v)/s[id].V,Ileak:Math.abs(v)/pt44GameLeak(s[id],v)};}
 stress.T1={I:I5p,ratio:I5p/.075};stress.V4={P:I5p*Math.max(0,V.P5-V.K5),ratio:I5p*Math.max(0,V.P5-V.K5)/5.5};stress.V5={I:totalLoad,ratio:totalLoad/.1};
 return {model:'PT44_BEHAVIOR_V63',V:spec.nodes.map(n=>V[n]),ports:V,lit,A:oscActive,warm,signal,stress,Irect:totalLoad,Itotal:totalLoad,I5p,I5s,Icv,Iif,I6,P5diss:stress.V4.P,Vgk5:V.G5-V.K5,arg5:4,arg6:.5,AVC:avc,ripple_v:ripple2,source:'Game behavioral reference; not a factory voltage calibration'};
}
if(typeof module!=='undefined'&&module.exports)module.exports={evaluate:pt44GameEvaluate,storedVoltage:pt44GameStoredVoltage};
