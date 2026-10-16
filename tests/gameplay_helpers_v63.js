const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]),c={module:{exports:{}},console};
vm.createContext(c);vm.runInContext(scripts[1],c);const m=c.module.exports;
function healthy(){const r=m.newRadio();for(const p of Object.values(r.slots)){const d=m.CATALOG[p.sku];if(d.ohms)p.ohms=d.ohms;if(p.kind==='TUBE')p.emis=1;if(p.kind==='C'){p.uF=d.uF;p.leak0=p.ctype==='electrolytic'?4:1000;}}return r;}
module.exports={m,healthy,html,scripts,root};
