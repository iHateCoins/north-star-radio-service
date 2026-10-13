from pathlib import Path
src=Path('/mnt/data/pt44_v13/North_Star_Radio_Service_v0_13_PT44.html').read_text()
old='''  function updateTrace(){
    for(const mesh of conductorRecords){
      const selected=traceNet && mesh.userData.net===traceNet;
      mesh.material.emissive.setHex(selected?0xff9c2a:0x000000);
      mesh.material.emissiveIntensity=selected?0.85:0;
      mesh.material.transparent=!!traceNet;
      mesh.material.opacity=traceNet?(selected?1:0.13):1;
    }
  }
  api.trace=function(node){ traceNet=node||null;updateTrace(); };'''
new='''  // Evidence scope is deliberately terminal-level, NOT a certification of the 3D wire bends.
  // Factory connections are selected only from source-constrained graph memberships.
  let sourceScoped=false;
  const factoryAllowedByModel=new Map();
  const factoryHeaterEdges=new Set();
  for(const n of PT44_FACTORY_V3.factory_nets){
    if(n.model){
      if(!factoryAllowedByModel.has(n.model)) factoryAllowedByModel.set(n.model,new Set());
      n.prototype_member_crosswalk.forEach(ref=>factoryAllowedByModel.get(n.model).add(ref));
    }
    if(n.stage==='Heaters')factoryHeaterEdges.add(n.prototype_member_crosswalk.slice().sort().join('|'));
  }
  function isSourceScopedConductor(mesh){
    const net=mesh.userData.net,[a,b]=mesh.userData.endpoints||[];
    if(!a||!b) return false;
    if(net==='HEATER')return factoryHeaterEdges.has([a,b].sort().join('|'));
    const allowed=factoryAllowedByModel.get(net);
    if(!allowed)return false;
    // Provisional 3D model-junction points are permitted for inspecting memberships;
    // they DO NOT establish a source-certified physical path.
    const member=r=>allowed.has(r);
    const hub=r=>r===net || (net==='GND' && /^G[1-5]$/.test(r));
    return (member(a)&& (member(b)||hub(b))) || (member(b)&&hub(a));
  }
  function updateTrace(){
    for(const mesh of conductorRecords){
      mesh.visible=!sourceScoped || isSourceScopedConductor(mesh);
      const selected=traceNet && mesh.userData.net===traceNet;
      mesh.material.emissive.setHex(selected?0xff9c2a:0x000000);
      mesh.material.emissiveIntensity=selected?0.85:0;
      mesh.material.transparent=!!traceNet;
      mesh.material.opacity=traceNet?(selected?1:0.13):1;
    }
  }
  api.sourceScope=function(on){sourceScoped=!!on;updateTrace();};
  api.sourceScopeSummary=function(){return {sourceScope:sourceScoped,shown:conductorRecords.filter(m=>m.visible).length,total:conductorRecords.length};};
  api.trace=function(node){ traceNet=node||null;updateTrace(); };'''
if old not in src:raise RuntimeError('updateTrace not found')
src=src.replace(old,new,1)
# update trace is called when rebuild? check / add after rebuilding.
seg='''    updateTrace();
  }
  // ---------- camera ----------'''
print('segment test',seg in src)
# update UI for 3D cam row: find exact fragment
k=src.find('id="bShowTestPosts"')
print('cam snippet',src[k-300:k+350])
if k==-1:raise RuntimeError('probe button missing')
# Insert button following button template literal end without modifying existing internals.
needle='<button class="btn sm ${R.showTestPosts?\'on\':\'\'}" id="bShowTestPosts" title="Virtual probe markers, not factory hardware">Probe markers ${R.showTestPosts?\'on\':\'off\'}</button>'
if needle not in src:raise RuntimeError('needle cam missing')
src=src.replace(needle,needle+'''<button class="btn sm ${R.sourceScope?'on':''}" id="bSourceScope" title="Show only source-traced electrical memberships. Physical wire routes are illustrative.">Source scope ${R.sourceScope?'on':'off'}</button>''',1)
# Attach event listener after bShowTestPosts binding
binding="box.querySelector('#bShowTestPosts').onclick=()=>{ R.showTestPosts=!R.showTestPosts; B3.showTestPosts(R.showTestPosts); const btn=box.querySelector('#bShowTestPosts'); btn.textContent='Probe markers '+(R.showTestPosts?'on':'off'); btn.classList.toggle('on',R.showTestPosts); };"
print('binding found',binding in src)
if binding not in src:raise RuntimeError('probe listener mismatch')
src=src.replace(binding,binding+"""\n    box.querySelector('#bSourceScope').onclick=()=>{ R.sourceScope=!R.sourceScope; B3.sourceScope(R.sourceScope); const btn=box.querySelector('#bSourceScope'); btn.textContent='Source scope '+(R.sourceScope?'on':'off');btn.classList.toggle('on',R.sourceScope); };\n    B3.sourceScope(!!R.sourceScope);""",1)
# Add simple mode note in 3D view. Ensure contextual accuracy.
src=src.replace('wires end on modeled solder points', 'wires end on modeled solder points; Source scope filters verified electrical contacts, not factory wire paths')
# source ledger in app notes.
src=src.replace('FACTORY TRANSCRIPTION INCOMPLETE', 'FACTORY TRANSCRIPTION INCOMPLETE')
# bump builder metadata in v13 only no old model version claims in user-facing app except ledger
src=src.replace('FACTORY DOCUMENT p. 38 · v0.13','FACTORY DOCUMENT p. 38 · v0.14')
out=Path('/mnt/data/North_Star_Radio_Service_v0_14_PT44.html')
out.write_text(src)
Path('/mnt/data/pt44_v13/North_Star_Radio_Service_v0_14_PT44.html').write_text(src)
print('wrote',out,out.stat().st_size)
