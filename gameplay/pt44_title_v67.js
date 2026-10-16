// A title screen never creates or overwrites a shop before the player chooses.
const SHOP_RUNTIME_DEFAULTS=JSON.stringify(R);
function resetShopRuntime(){
  if(R.audio)R.audio.ctx.close().catch(()=>{});
  for(const key of Object.keys(R))delete R[key];
  Object.assign(R,JSON.parse(SHOP_RUNTIME_DEFAULTS));
}
function showTitleScreen(){
  if(S&&!R.atTitle){save();R.power=false;R.warm=0;R.dc=null;R.sig=null;audioUpdate();}
  R.atTitle=true;closeModal();
  $('#gameShell').hidden=true;$('#titleScreen').hidden=false;
  const saved=load();$('#titleLoad').disabled=!saved;
  $('#titleSaveInfo').textContent=saved?`Saved shop · ${dateStr(saved.day)} · ${money(saved.cash)} on hand`:'No saved shop on this browser yet.';
  $('#titleNew').onclick=()=>{
    if(load())confirmModal('Start a new game?','This replaces your saved shop, including its cash, parts and jobs.','Start new game',()=>enterShopGame(true));
    else enterShopGame(true);
  };
  $('#titleLoad').onclick=()=>enterShopGame(false);
  (saved?$('#titleLoad'):$('#titleNew')).focus();
}
function enterShopGame(fresh){
  const saved=fresh?null:load();if(!fresh&&!saved){showTitleScreen();return;}
  resetShopRuntime();R.atTitle=false;
  if(fresh){newGame();S.tutorial.active=true;}else S=saved;
  closeModal();$('#titleScreen').hidden=true;$('#gameShell').hidden=false;renderAll();
  if(fresh)save();
  (fresh?$('#tutorialLocate'):$('#bTitle'))?.focus({preventScroll:true});
}
