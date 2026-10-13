from pathlib import Path
p=Path('/mnt/data/North_Star_Radio_Service_v0_14_PT44.html');src=p.read_text()
portable='''// Source-traced electrical contacts only. This does NOT validate the physical bends or wire dressing.
function pt44FactoryContactScope(net,a,b){
  const nets=PT44_FACTORY_V3.factory_nets;
  if(net==='HEATER')return nets.some(n=>n.stage==='Heaters'&&
    n.prototype_member_crosswalk.slice().sort().join('|')===[a,b].sort().join('|'));
  const members=new Set(nets.filter(n=>n.model===net).flatMap(n=>n.prototype_member_crosswalk));
  if(!members.size)return false;
  const hub=r=>r===net || (net==='GND' && /^G[1-5]$/.test(r));
  return (members.has(a) && (members.has(b)||hub(b))) || (members.has(b)&&hub(a));
}
'''
point=src.index('// ===== PT-44 engineering milestone 0.8: one circuit graph')
src=src[:point]+portable+src[point:]
old='''  function isSourceScopedConductor(mesh){
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
  }'''
assert old in src
src=src.replace(old,'''  function isSourceScopedConductor(mesh){
    const [a,b]=mesh.userData.endpoints||[];
    return a&&b ? pt44FactoryContactScope(mesh.userData.net,a,b) : false;
  }''',1)
# Remove duplicate unused maps
old_dup='''  const factoryAllowedByModel=new Map();
  const factoryHeaterEdges=new Set();
  for(const n of PT44_FACTORY_V3.factory_nets){
    if(n.model){
      if(!factoryAllowedByModel.has(n.model)) factoryAllowedByModel.set(n.model,new Set());
      n.prototype_member_crosswalk.forEach(ref=>factoryAllowedByModel.get(n.model).add(ref));
    }
    if(n.stage==='Heaters')factoryHeaterEdges.add(n.prototype_member_crosswalk.slice().sort().join('|'));
  }
'''
assert old_dup in src
src=src.replace(old_dup,'',1)
p.write_text(src)
Path('/mnt/data/pt44_v13/North_Star_Radio_Service_v0_14_PT44.html').write_text(src)
print('updated',p,p.stat().st_size)
