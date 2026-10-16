const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{m,html,scripts}=require('./gameplay_helpers_v63');
const source=fs.readFileSync('gameplay/pt44_tutorial_v66.js','utf8');assert(html.includes('// BEGIN PT44_TUTORIAL_V66\n'+source+'// END PT44_TUTORIAL_V66'));
const context={...m,S:{inv:{T7B7:1},jobs:[]},R:{},save(){},console};vm.createContext(context);vm.runInContext(source,context);
for(let n=0;n<50;n++){
 const job={id:101,radio:m.newRadio()};context.S={inv:{T7B7:1},jobs:[job],bench:101};context.setupFirstRepair(job);
 assert(!context.S.inv.T7B7);assert.equal(job.radio.slots.V2.heaterOk,false);assert.equal(context.S.tutorial.active,false);
 let d=m.settle(job.radio);assert(!d.lit&&d.signal.loud===0);
 job.radio.slots.V2=m.newPart('T7B7');for(const kc of [610,880,1150]){job.radio.dial=kc;d=m.settle(job.radio);assert(d.signal.station&&d.signal.loud>=.42&&d.signal.hum<=.05&&d.signal.dist<=.12);}
 for(let t=0;t<600;t++){d=m.settle(job.radio);assert.equal(m.applyStress(job.radio,d,1).length,0);}
}
const job={id:101};context.S={inv:{},jobs:[job],bench:101};context.setupFirstRepair(job);
context.R={power:true,sig:{lit:false}};context.tutorialEvent('symptom');assert(context.S.tutorial.evidence.observed);
context.tutorialEvent('off');assert(!context.S.tutorial.evidence.switchedOff);context.R.power=false;context.tutorialEvent('off');assert(context.S.tutorial.evidence.switchedOff);
context.tutorialEvent('tube',{heaterOk:true,from:'V1'});assert(!context.S.tutorial.evidence.diagnosed);context.tutorialEvent('tube',{heaterOk:false,from:'V2'});assert(context.S.tutorial.evidence.diagnosed);
context.tutorialEvent('buy','T7A8');assert(!context.S.tutorial.evidence.bought);context.S.bench=999;context.tutorialEvent('buy','T7B7');assert(!context.S.tutorial.evidence.bought);context.S.bench=101;context.tutorialEvent('buy','T7B7');assert(context.S.tutorial.evidence.bought);
context.tutorialEvent('checkout',false);assert(!context.S.tutorial.evidence.checkout);context.tutorialEvent('checkout',true);assert(context.S.tutorial.evidence.checkout);
console.log('PASS tutorial fixture across 50 radios, normal checkout stress, evidence guards and canonical embedding');
