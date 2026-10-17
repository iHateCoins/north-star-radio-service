// First-job coaching uses normal game actions, prices, instruments and checkout.
function setupFirstRepair(job){
  job.radio=newRadio();
  for(const p of Object.values(job.radio.slots)){
    const c=CATALOG[p.sku];p.used=true;
    if(c.ohms)p.ohms=c.ohms;
    if(p.kind==='TUBE')p.emis=1;
    if(p.kind==='C'){p.uF=c.uF;p.leak0=p.ctype==='electrolytic'?4:1000;}
  }
  job.radio.slots.V2.heaterOk=false;job.faults=['heater'];
  job.complaint='Completely dead. No dial light, no tube glow, and no sound.';
  job.tutorial='open-heater-v1';
  // This first repair teaches the normal purchase flow; other starter stock is retained.
  delete S.inv.T7B7;
  S.tutorial={jobId:job.id,active:false,step:0,evidence:{},completed:false};
  pt44GameMigrate(S);
}
function tutorialJob(){const t=S?.tutorial;return t&&S.jobs.find(j=>j.id===t.jobId&&j.tutorial==='open-heater-v1');}
function tutorialEvent(kind,value){
  const t=S?.tutorial,j=tutorialJob();if(!t||!j||S.bench!==j.id||t.completed)return;
  const e=t.evidence;let key=null;
  if(kind==='symptom'&&R.power&&R.sig&&!R.sig.lit)key='observed';
  if(kind==='off'&&e.observed&&!R.power)key='switchedOff';
  if(kind==='tube'&&value&&value.from&&value.heaterOk===false)key='diagnosed';
  if(kind==='buy'&&value==='T7B7')key='bought';
  if(kind==='install'&&value==='V2'&&j.radio.slots.V2?.sku==='T7B7'&&j.radio.slots.V2.heaterOk)key='installed';
  if(kind==='listening'&&e.installed&&R.power&&R.warm>=.95&&R.sig?.station&&R.sig.loud>=.42)key='listened';
  if(kind==='checkout'&&value===true)key='checkout';
  if(key&&!e[key]){e[key]=true;save();}
}
const FIRST_REPAIR_STEPS=[
  {title:'Read the repair order',text:'Select the first repair order at the Service counter. Note the complaint, parts allowance and due date. A symptom tells you where to start; it does not identify the failed part.',target:'#tickets',ready:()=>S.bench===S.tutorial.jobId},
  {title:'Confirm the symptoms',text:'Switch the radio ON with the round power button. Watch the dial and tube glow, and read the Speaker line (you can play muted). This set stays completely dark and silent. Its tube heaters form a series string: one open heater stops every tube from warming.',target:'#bPow',ready:()=>S.tutorial.evidence.observed},
  {title:'Make the set safe',text:'Switch OFF before pulling parts. If Discharge B+ appears, use it before working. This dead heater string normally leaves no B+ charge, so that button may not appear. On a working radio the filter capacitors can remain charged after switch-off.',target:'#bPow',ready:()=>S.tutorial.evidence.switchedOff&&!R.power&&!charged()},
  {title:'Remove and test a tube',text:'Choose Chassis top on the 3D bench, then tap a tube. In its actions below the view, use Pull & test tube. Removed parts appear on the 3D Parts tray; tap one there to inspect or test it. Look for “heater open — no emission.” A good tube should be reinstalled at its original location before trying another. An open heater explains why the whole series string went dark.',target:'#viewBox',ready:()=>S.tutorial.evidence.diagnosed},
  {title:'Buy the matching replacement',text:'The failed tube is a 7B7. Open Catalog → Tubes & parts and find 7B7. Today buys one immediately for $2.13; Order costs $1.70 but arrives after you close for the day (rent is charged). Buy one, then wait for it to be in Parts. Match the tube type, not just the socket.',target:'[data-rush="T7B7"]',ready:()=>S.tutorial.evidence.bought&&S.inv.T7B7>0},
  {title:'Install the replacement',text:'On the 3D Chassis top, tap the empty V2 socket where the failed 7B7 was removed. The old tube was removed for its test, leaving an empty socket. Choose 7B7 under Install from stock and press Install. Refit any other good tubes you tested from the tray. For soldered components, use Unsolder & remove first, then install the correctly rated part.',target:'#viewBox',ready:()=>S.tutorial.evidence.installed&&!hasEmpty(tutorialJob().radio)},
  {title:'Listen to the repaired radio',text:'Switch ON, tune to 880 kc and set volume near 0.6. Allow about ten seconds for warm-up. The Speaker line should now name a station, and the tubes should glow. This before/after check tests your diagnosis; swapping a part alone is not proof of a repair.',target:'#dial',ready:()=>S.tutorial.evidence.listened},
  {title:'Run the service checkout',text:'Press Run checkout, then Start checkout. It checks three stations, hum, distortion, component ratings and a ten-minute run. Every row must pass. If anything fails, keep working from that evidence; checkout does not repair the set for you.',target:'#bChk',ready:()=>S.tutorial.evidence.checkout},
  {title:'Return the set and collect',text:'The checkout passed. In its report, choose Return set & collect to finish the job and receive labor plus parts. If you closed the report, run checkout again to reopen it. The old failed tube remains on the tray until the job closes; salvage is untested, so do not treat it as a good spare.',target:'#bChk',ready:()=>false}
];
function startFirstRepair(){const t=S.tutorial;if(!tutorialJob()||t.completed)return;t.active=true;save();closeModal();renderAll();$('#firstRepairGuide')?.scrollIntoView({block:'nearest'});}
function showTutorialControl(){
  const t=S.tutorial,s=FIRST_REPAIR_STEPS[t.step];
  if(t.step===3||t.step===5){R.view=B3.ok?'bench3d':'top';R.cam='top';renderViewTabs();renderViews();if(B3.ok)B3.view('top');}
  if(t.step===4){R.side='cat';R.catTab='T';renderSide();}
  if(t.step===6){R.view=B3.ok?'bench3d':'top';renderBench();}
  const el=$(s.target);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true});el.classList.add('tutorial-target');}
}
function renderTutorial(){
  const host=$('#firstRepairGuide');if(!host)return;
  const t=S?.tutorial,j=tutorialJob();
  if(!t?.active||(!j&&!t.completed)){host.hidden=true;host.dataset.state='';document.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));return;}
  host.hidden=false;
  if(t.completed){if(host.dataset.state==='done')return;host.dataset.state='done';host.innerHTML='<div class="stack"><b>First repair complete</b><span>You confirmed the symptom, tested the cause, bought and fitted a replacement, and proved the repair. On future jobs: observe → measure → repair → test.</span><button class="btn sm" id="tutorialHide">Finish tutorial</button></div>';$('#tutorialHide').onclick=()=>{t.active=false;save();renderTutorial();};return;}
  const s=FIRST_REPAIR_STEPS[t.step],onBench=S.bench===j.id,ready=!!(onBench&&s.ready());
  const state=[t.step,ready,onBench,t.hint,!!S.orders.find(o=>o.sku==='T7B7')].join(':');if(host.dataset.state===state)return;host.dataset.state=state;document.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
  host.innerHTML=`<div class="row"><b id="tutorialHeading" aria-live="polite">First repair · ${t.step+1}/${FIRST_REPAIR_STEPS.length}: ${s.title}</b><span class="sp"></span><button class="btn sm" id="tutorialPause">Pause guide</button></div><p>${onBench||t.step===0?s.text:'Select the tutorial repair order at the Service counter to continue. Your progress is saved.'}</p>${t.step===4&&S.orders.some(o=>o.sku==='T7B7')?'<p class="note">Your replacement is on order. Close for the day to receive it, then select this repair order again.</p>':''}${t.step===3?`<div class="note">${t.hint?'Hint: test V2, the 7B7 IF amplifier. Confirm its heater result before buying.':'Try the tester rather than replacing every tube.'}</div>`:''}<div class="row"><button class="btn sm" id="tutorialLocate">Show me the control</button>${t.step===3&&!t.hint?'<button class="btn sm" id="tutorialHint">Need a hint?</button>':''}${t.step<8?`<button class="btn pri sm" id="tutorialNext" ${ready?'':'disabled'}>${ready?'Continue':'Waiting for your action'}</button>`:''}</div>`;
  $('#tutorialPause').onclick=()=>{t.active=false;save();renderTutorial();};
  $('#tutorialLocate').onclick=()=>{if(!onBench&&t.step>0){$('#tickets').scrollIntoView({block:'center'});return;}showTutorialControl();};
  const hint=$('#tutorialHint');if(hint)hint.onclick=()=>{t.hint=true;save();renderTutorial();};
  const next=$('#tutorialNext');if(next)next.onclick=()=>{if(S.bench!==j.id||!s.ready())return;t.step++;save();renderTutorial();};
}
