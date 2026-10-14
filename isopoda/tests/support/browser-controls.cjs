const assert=require('node:assert/strict');

// Functional control checks use DOM activation, as public-regression does.
// Real pointer selection and proportional dragging remain in the lab tests.
async function click(page,target){
 const locator=typeof target==='string'?page.locator(target):target;
 await locator.waitFor({state:'visible'});
 assert.ok(await locator.isEnabled(),'control must be enabled');
 const trace=await locator.evaluate(e=>e.id==='habitatNext'||e.hasAttribute('data-preset'));
 await locator.evaluate(element=>{
  // Clipboard handlers finish asynchronously; await them before importing so
  // their late status message cannot be mistaken for an import result.
  if(element.id==='copyScene'||element.id==='copyShare')return element.onclick();
  element.click();
 });
 if(trace)console.log('[control state]',JSON.stringify(await page.evaluate(()=>({url:location.href,title:document.title,body:document.body?.innerText.slice(0,180),habitat:document.querySelector('#titleCard')?.dataset.habitat,preset:document.querySelector('[data-preset][aria-pressed=true]')?.dataset.preset}))));
}
module.exports={click};
