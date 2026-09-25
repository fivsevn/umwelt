const assert=require('node:assert/strict');

// Functional control checks use DOM activation, as public-regression does.
// Real pointer selection and proportional dragging remain in the lab tests.
async function click(page,target){
 const locator=typeof target==='string'?page.locator(target):target;
 await locator.waitFor({state:'visible'});
 assert.ok(await locator.isEnabled(),'control must be enabled');
 await locator.evaluate(element=>{
  // Clipboard handlers finish asynchronously; await them before importing so
  // their late status message cannot be mistaken for an import result.
  if(element.id==='copyScene'||element.id==='copyShare')return element.onclick();
  element.click();
 });
}
module.exports={click};
