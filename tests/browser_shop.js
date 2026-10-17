const physicalMotion=new WeakMap();
// Enter through the same title choices as players; older suites do not exercise coaching.
async function enterShop(page,{tutorial=false}={}){
  if(await page.locator('#titleScreen').isVisible()){
    if(await page.locator('#titleLoad').isEnabled())await page.locator('#titleLoad').click();
    else await page.locator('#titleNew').click();
  }
  if(!tutorial&&await page.locator('#tutorialPause').isVisible())await page.locator('#tutorialPause').click();
}
module.exports={enterShop};
async function pickPhysical(page,kind,id,{touch=false}={}){
  const motion=touch?'no-preference':'reduce';if(physicalMotion.get(page)!==motion){await page.emulateMedia({reducedMotion:motion});physicalMotion.set(page,motion);}
  await page.locator('[data-v="bench3d"]').click();
  const cam=kind==='tray'?'tray':kind==='node'?'under':await page.evaluate(id=>id==='SP1'?'speaker':['R1','R2','R3','R4','R5','R6','R7','C3','C4'].includes(id)?'under':'top',id);
  await page.locator(`[data-cam="${cam}"]`).click();
  if(kind==='node'&&!await page.evaluate(()=>R.showTestPosts))await page.locator('#bShowTestPosts').click();
  await page.locator('#v3 canvas').scrollIntoViewIfNeeded();await page.waitForTimeout(1150);
  const point=await page.evaluate(({kind,id})=>B3.pickPoint(kind,id),{kind,id});
  if(!point)throw Error('No visible 3D ray target: '+kind+' '+id+' / '+cam);
  if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  if(kind==='slot')await page.waitForFunction(id=>R.sel?.slot===id,id);
  if(kind==='tray')await page.waitForFunction(id=>R.sel?.tray===id,id);
  if(kind==='node')await page.waitForFunction(id=>R.probe===id||R.ohmTarget?.node===id,id);
}
module.exports.pickPhysical=pickPhysical;
