const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);let blobSource='',revoked=0,renderCount=0,workerInstance;
class BlobHost{constructor(parts){this.source=parts.join('');}}
class WorkerHost{constructor(){workerInstance=this;this.terminated=false;}postMessage(value){this.message=value;}terminate(){this.terminated=true;}}
const status={textContent:''},box={querySelector:()=>status},ctx=vm.createContext({console,Blob:BlobHost,Worker:WorkerHost,URL:{createObjectURL(blob){blobSource=blob.source;return 'blob:test';},revokeObjectURL(){revoked++;}}});
vm.runInContext(scripts[1],ctx);vm.runInContext(scripts[3].slice(scripts[3].indexOf('function pt44BenchAudit()'),scripts[3].indexOf('function renderFactoryLedger(box){')),ctx);ctx.box=box;ctx.renderHost=()=>renderCount++;vm.runInContext('globalThis.R={};globalThis.renderViews=()=>renderHost();pt44AudioRunBench(box,pt44AudioBenchState());',ctx);
assert(workerInstance.message.length===4);assert.equal(revoked,1);assert(renderCount>0);assert(vm.runInContext('pt44AudioModelHTML.busy',ctx));
// Execute the generated worker itself in an isolated JS global with short numerical conditions.
let reply;const workerCtx=vm.createContext({postMessage:message=>{reply=message;}});vm.runInContext(blobSource,workerCtx);const request=structuredClone(workerInstance.message);request[3]={...request[3],duration_s:.01,signal_start_s:0};workerCtx.event={data:request};vm.runInContext('onmessage(event)',workerCtx);assert(!reply.error,reply.error);assert(reply.result.summary.nodes.filtered_v.mean>0);assert(!reply.result.full_receiver_validated);
workerInstance.onmessage({data:reply});assert(workerInstance.terminated);assert(!vm.runInContext('pt44AudioModelHTML.busy',ctx));assert(vm.runInContext("pt44AudioModelHTML('POWER',x=>x)",ctx).includes('7C6 plate current'));
// A new run terminates the previous worker and displays numerical errors without accepting a result.
vm.runInContext('pt44AudioRunBench(box,pt44AudioBenchState());',ctx);workerInstance.onmessage({data:{error:'Numerical test failure'}});assert(workerInstance.terminated);assert.equal(status.textContent,'Numerical test failure');assert(!vm.runInContext('pt44AudioModelHTML.busy',ctx));
assert(html.includes('name="nsrs-build" content="v0.60.0"'));assert(html.includes('BUILD v0.60.0<small>'));assert(html.includes('audioBenchJumpV55'));
console.log('PASS v0.55 generated background worker, result/error lifecycle, rendering and version watermark');
