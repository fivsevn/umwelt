// Test-only completed-observation fixture for suites that exercise an unlocked scene.
// Entry-gates separately verifies fresh locks and actual observation completion.
async function completedPrerequisites(page) {
 await page.evaluate(async()=>{
  const {restoreCollection}=await import('/isopoda/collection.mjs');
  const key='isopoda-fieldnotes-v1',collection=restoreCollection(JSON.parse(localStorage.getItem(key)),null,[]);
  collection.completedObservation=true;
  collection.completedHabitats=[...new Set([...collection.completedHabitats,'terrestrial','sandy-surf'])];
  if(!collection.unlocked.length)collection.unlocked.push('dairy');
  localStorage.setItem(key,JSON.stringify(collection));
 });
}
module.exports={completedPrerequisites};
