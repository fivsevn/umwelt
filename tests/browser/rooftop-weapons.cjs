const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const fs = require("node:fs/promises");
const base = process.env.BASE_URL || "http://127.0.0.1:8773";
const engine = process.env.BROWSER || "chromium";
(async () => {
  const browser = await (engine === "webkit" ? webkit : chromium).launch({headless:true, ...(engine === "chromium" && !process.env.CI ? {channel:"chrome"} : {})});
  try {
    const context = await browser.newContext(), page = await context.newPage(), errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/rooftop/arrange/");
    await page.waitForFunction(() => window.rooftop);
    assert.equal(await page.locator("#assetCount").count(), 0);
    const render = await page.evaluate(async () => {
      const {WEAPONS} = await import("/rooftop/weapons.mjs");
      const {ASSETS, paintObject, displayBounds, validateLayout, initialLayout} = await import("/rooftop/scene.mjs");
      const canvas = document.createElement("canvas");canvas.width=canvas.height=192;
      const c=canvas.getContext("2d"), hashes=[], counts=[], badBounds=[];
      for(const a of WEAPONS) {
        if(ASSETS.filter(v=>v.id===a.id).length!==1 || !a.note || !a.era || a.sources.length!==1 || !a.sources[0].url.startsWith("https://")) throw Error("Catalogue contract: " + a.id);
        for(const rotation of [0,90,180,270]) {
          c.clearRect(0,0,192,192);paintObject(c,{type:a.id,x:96,y:96,scale:1,rotation});
          const data=c.getImageData(0,0,192,192).data, b=displayBounds({type:a.id,rotation,scale:1});
          let count=0, hash=2166136261;
          for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]){count++;const x=(i/4|0)%192-96,y=(i/4/192|0)-96;if(x<b.left-4||x>b.right+4||y<b.top-4||y>b.bottom+5)badBounds.push(a.id+":"+rotation+":"+x+","+y);}}
          counts.push(count);if(rotation===0)hashes.push([a.id,hash>>>0]);
          const layout=initialLayout();layout.scenes.north=[{id:a.id,type:a.id,x:210,y:230,rotation,scale:1}];
          if(validateLayout(layout).scenes.north[0].type!==a.id)throw Error("Save lost " + a.id);
        }
      }
      return {hashes,counts,badBounds};
    });
    assert.equal(render.hashes.length,86);
    assert.equal(new Set(render.hashes.map(v=>v[1])).size,86,"Each object needs its own drawing");
    assert.ok(render.counts.every(n=>n>40),"Every object paints at every facing");
    assert.deepEqual(render.badBounds,[],"Drawings fit placement and selection bounds");
    await page.locator("#clear").click();
    for(const [category, count] of [["枪械",66],["武器",20]]) {
      await page.locator("#categories button").filter({hasText:new RegExp("^"+category+"$")}).click();
      assert.equal(await page.locator("#assets button").count(),count);
      const ids=await page.locator("#assets button").evaluateAll(nodes=>nodes.map(n=>n.dataset.asset));
      for(const id of ids){
        await page.locator(`[data-asset="${id}"]`).click();
        const added=await page.evaluate(()=>rooftop.layout.scenes.north.at(-1));
        assert.equal(added.type,id);
        assert.equal(await page.locator("#noteName").innerText(),await page.locator(`[data-asset="${id}"] span`).innerText());
        assert.match(await page.locator("#noteAliases").innerText(),/·/);
        assert.ok((await page.locator("#noteShape").innerText()).length>20);
        await page.locator(".notebook details summary").click();
        assert.equal(await page.locator("#noteSources a").count(),1);
        assert.equal(await page.locator("#vesselControls").isVisible(),false);
      }
    }
    await page.locator("#categories button").filter({hasText:/^枪械$/}).click();
    await page.locator("#search").fill("格洛克");
    assert.equal(await page.locator("#assets button").count(),6);
    const glocks=["17","19","26","34","43","43x"];
    for(const model of glocks){
      await page.locator(`[data-asset="weapon-glock-${model}"]`).click();
      assert.match(await page.locator("#noteName").innerText(),/格洛克/);
      await page.locator(".notebook details summary").click();
      assert.ok((await page.locator("#noteSources a").getAttribute("href")).startsWith("https://eu.glock.com/en/products/pistols/"));
    }
    await page.locator("#search").fill("");
    const before=await page.evaluate(()=>rooftop.layout);
    await page.locator("#rotate").click();
    assert.equal((await page.evaluate(()=>rooftop.layout.scenes.north.at(-1))).rotation,90);
    await page.keyboard.press("Control+z");
    assert.deepEqual(await page.evaluate(()=>rooftop.layout),before);
    const download=page.waitForEvent("download");await page.locator("#export").click();
    const file=await download,data=JSON.parse(await fs.readFile(await file.path(),"utf8"));
    assert.deepEqual(data.scenes.north,before.scenes.north);
    await page.reload();await page.waitForFunction(()=>window.rooftop);
    assert.deepEqual(await page.evaluate(()=>rooftop.layout.scenes.north),before.scenes.north);
    await page.locator("#categories button").filter({hasText:/^枪械$/}).click();
    await page.locator("#search").fill("PPSh");assert.equal(await page.locator("#assets button").count(),1);
    await page.locator("[data-asset=weapon-ppsh]").click();
    assert.match(await page.locator("#noteName").innerText(),/PPSh/);
    const output=process.env.QA_OUTPUT;
    for(const width of [1366,390]){
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.locator("#search").fill("");
      if(output)await page.screenshot({path:output+"/weapons-"+width+"-"+engine+".png",fullPage:true});
    }
    const room=await context.newPage();await room.goto(base+"/rooftop/room/");await room.waitForFunction(()=>window.room);
    assert.deepEqual(errors,[]);console.log(engine+" weapons: 86 drawings, 344 facings, notebook, placement, export, reload and mobile passed");
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
