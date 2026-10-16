// Enter through the same title choices as players; older suites do not exercise coaching.
async function enterShop(page,{tutorial=false}={}){
  if(await page.locator('#titleScreen').isVisible()){
    if(await page.locator('#titleLoad').isEnabled())await page.locator('#titleLoad').click();
    else await page.locator('#titleNew').click();
  }
  if(!tutorial&&await page.locator('#tutorialPause').isVisible())await page.locator('#tutorialPause').click();
}
module.exports={enterShop};
