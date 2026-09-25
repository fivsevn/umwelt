const assert=require('node:assert/strict');

// Native pointer input without WebKit's RAF-based stability wait. These canvas
// pages keep drawing continuously; visibility and hit testing remain mandatory.
async function click(page,target){
 const locator=typeof target==='string'?page.locator(target):target;
 await locator.waitFor({state:'visible'});
 assert.ok(await locator.isEnabled(),'pointer target must be enabled');
 const point=await locator.evaluate(element=>{
  element.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
  const r=element.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  return {x,y,hit:element.contains(document.elementFromPoint(x,y))};
 });
 assert.ok(point.hit,'pointer target must not be covered');
 await page.mouse.click(point.x,point.y);
}
module.exports={click};
