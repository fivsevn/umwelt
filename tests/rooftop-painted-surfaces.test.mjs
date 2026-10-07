import { cubeContactPaint } from "../rooftop/3d/contact-paint.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { latheSurface, leafSurface, beveledBoxSurface } from "../rooftop/3d/model-surfaces.mjs";
import {
  pixelPainting,
  TEXTURE_KINDS,
  pigmentPalette,
  createPixelMaterials,
} from "../rooftop/3d/pixel-materials.mjs";
import { surfaceSeed, soilParticles } from "../rooftop/3d/surface-variation.mjs";
import { carShell, buildStreetCar, buildStreetLantern } from "../rooftop/3d/street-models.mjs";
import { buildNeighborhood } from "../rooftop/3d/neighborhood.mjs";
import { recessedBowlGeometry, roundedRectangle } from "../rooftop/3d/washstation.mjs";
import { soilBagGeometry } from "../rooftop/3d/soft-goods.mjs";
import { buildVessel } from "../rooftop/3d/vessel-models.mjs";
import { POTS } from "../rooftop/botany.mjs";
const context = { console: { warn() {} } };
vm.runInNewContext(
  readFileSync(
    new URL("../rooftop/3d/vendor/three.min.js", import.meta.url),
    "utf8",
  ),
  context,
);
const T = context.THREE;
function closed(geometry, label) {
  const mesh = geometry.index ? geometry.toNonIndexed() : geometry;
  const data = mesh.attributes.position.array,
    edges = new Map();
  assert.ok([...data].every(Number.isFinite), label + " finite vertices");
  assert.ok(
    [...mesh.attributes.normal.array].every(Number.isFinite),
    label + " finite normals",
  );
  const vertex = (i) =>
    Array.from(data.slice(i * 3, i * 3 + 3), (n) => Math.round(n * 1e6)).join(
      ",",
    );
  for (let i = 0; i < data.length / 3; i += 3)
    for (const [a, b] of [
      [i, i + 1],
      [i + 1, i + 2],
      [i + 2, i],
    ]) {
      const key = [vertex(a), vertex(b)].sort().join("/");
      if (vertex(a) === vertex(b)) continue;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  assert.ok(
    [...edges.values()].every((n) => n === 2),
    label + " watertight shell",
  );
  assert.ok(data.length / 9 < 1200, label + " bounded triangle count");
}
test("every modern ceramic shell is closed, hollow and retains a drainage hole", () => {
  for (const pot of POTS.filter((p) => !/box|bag/.test(p.shape))) {
    const shells = [];
    buildVessel(
      {
        box() {},
        beam() {},
        shade: (c) => c,
        profile(g, points, sides, color, kind, shape) {
          shells.push({
            points,
            geometry: latheSurface(T, points, sides, shape),
          });
        },
      },
      {},
      pot,
      0.46,
      0.38,
      { empty: true },
    );
    assert.ok(shells.length >= 2, pot.id + " body and rim");
    for (const shell of shells) closed(shell.geometry, pot.id);
    const body = shells[0].points;
    assert.ok(Math.min(...body.map((p) => p[0])) > 0, pot.id + " open drain");
    assert.ok(
      body.some(
        (p, i) => i > 0 && p[1] === body[i - 1][1] && p[0] !== body[i - 1][0],
      ),
      pot.id + " wall thickness",
    );
  }
});
test("upright, horizontal and fleshy leaves have actual closed thickness", () => {
  for (const end of [
    [0, 1, 0],
    [0, 0, 1],
    [0.4, 0.7, 0.3],
  ])
    for (const fleshy of [false, true]) {
      const leaf = leafSurface(T, [0, 0, 0], end, 0.3, false, fleshy);
      closed(leaf, "leaf");
      leaf.computeBoundingBox();
      const size = leaf.boundingBox.getSize(new T.Vector3());
      assert.ok(
        Math.min(size.x, size.y, size.z) > 0.005,
        "nonzero thickness in every orientation",
      );
    }
});
test("all painted material tiles use deterministic integer texels and bounded palettes", () => {
  const kinds = [
    ...TEXTURE_KINDS,
    ...new Set(POTS.map((p) => "pot-" + p.pattern)),
    ...POTS.map(p=>"vessel-"+p.id),
  ];
  const signatures = new Set();
  for (const kind of kinds) {
    const tile = pixelPainting(kind);
    assert.deepEqual(tile, pixelPainting(kind), kind + " deterministic");
    assert.equal(tile.size, 64);
    assert.ok(tile.ramp.length <= 9, kind + " bounded palette");
    for (const [x, y, w, h, ink] of tile.commands) {
      assert.ok(
        [x, y, w, h, ink].every(Number.isInteger),
        kind + " whole pixels",
      );
      assert.ok(
        w > 0 && h > 0 && ink >= 0 && ink < tile.ramp.length,
        kind + " valid paint",
      );
    }
    signatures.add(JSON.stringify(tile));
  }
  assert.ok(signatures.size >= 18, "distinct material construction details");
});

test("sun-facing leaf panels have outward normals above their midrib", () => {
  for (const fleshy of [false,true]) {
    const g=leafSurface(T,[0,0,0],[0,0,1],.4,false,fleshy);
    const p=g.attributes.position, n=g.attributes.normal;
    for(let j=0;j<p.count;j+=3) {
      const z=(p.getZ(j)+p.getZ(j+1)+p.getZ(j+2))/3;
      const upper = [j,j+1,j+2].every(k => p.getY(k) > Math.sin(p.getZ(k)*Math.PI)*(fleshy?.11:.035)+.001);
      if(upper && z>.15 && z<.85)
        assert.ok(n.getY(j)>0, "upper faces receive light");
    }
  }
});

test("a recessed washstation retains a closed sloping shell and inward-facing cavity", () => {
  for(const [w,d] of [[1.55,1.78],[2.8,1.95]]) {
    const geo=recessedBowlGeometry(T,w,d,.42,.6);
    closed(geo,"washstation bowl");
    geo.computeBoundingBox();
    assert.ok(geo.boundingBox.min.y<-.42,"the bowl is recessed");
    const p=geo.attributes.position,n=geo.attributes.normal;
    const radial=p.getX(0)-.6;
    assert.ok(radial*n.getX(0)<0,"cavity normal faces into the bowl");
    assert.equal(roundedRectangle(w,d,.18).length,16);
  }
});

test("paint uses the selected base pigment once and preserves ceramic motif colors", () => {
  const wood=pigmentPalette("wood","#89663e");
  assert.equal(wood[3],"#89663e");
  assert.notEqual(wood[0],wood[4]);
  const pot=pigmentPalette("pot-blue","#d6cdb7");
  assert.equal(pot[5],pixelPainting("pot-blue").ramp[5]);
});

test("living and manufactured surfaces use distinct shadow and highlight pigments",()=>{
  const tint="#71875a",leaf=pigmentPalette("leaf",tint),metal=pigmentPalette("metal",tint);
  assert.equal(leaf[3],tint);assert.equal(metal[3],tint);
  assert.notEqual(leaf[0],metal[0]);assert.notEqual(leaf[4],metal[4]);
  const green=hex=>parseInt(hex.slice(3,5),16),blue=hex=>parseInt(hex.slice(5,7),16);
  assert.ok(green(leaf[4])-blue(leaf[4])>green(metal[4])-blue(metal[4]),"leaf highlights keep their yellow-green pigment");
});

test("seeded soil stays inside the soil opening and varies without moving the pot",()=>{
  for(const options of [{dry:true},{rectangular:true,trough:true},{}]) {
    const a=soilParticles(.6,7182,options),b=soilParticles(.6,49113,options);
    assert.deepEqual(a,soilParticles(.6,7182,options));assert.notDeepEqual(a,b);
    assert.ok(a.length<=34);assert.notEqual(surfaceSeed(7182),surfaceSeed(49113));
    for(const p of a) {
      assert.ok(p.height>0 && p.height<.025);
      assert.ok(Math.abs(p.x)+p.size<.6*(options.trough?1.5:1));
      assert.ok(Math.abs(p.z)+p.size<.6*(options.trough?.62:1));
    }
  }
});

test("the GPU selects paint after instance color exactly once and separates material programs",()=>{
  const saved=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({clearRect(){},fillRect(){}})})};
  try {
    const materials=createPixelMaterials(T,{value:0},{value:0});
    const clay=materials.mat('#b0714e','vessel-terra'),leaf=materials.mat('#71875a','leaf');
    assert.notEqual(clay.customProgramCacheKey(),leaf.customProgramCacheKey());
    assert.notEqual(clay.customProgramCacheKey(),materials.mat('#ffffff','enamel').customProgramCacheKey());
    const shader={vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <color_fragment>\n#include <dithering_fragment>',uniforms:{}};
    clay.onBeforeCompile(shader);
    assert.equal(shader.fragmentShader.match(/diffuseColor\.rgb \*= vColor/g).length,1);
    assert.ok(shader.fragmentShader.indexOf('diffuseColor.rgb *= vColor')<shader.fragmentShader.indexOf('float gray'));
    assert.ok(shader.vertexShader.includes('vPaintSeed=paintSeed'));
  } finally {globalThis.document=saved;}
});

test("soft soil packaging is a closed outward-facing bag with a pinched mouth",()=>{
 const g=soilBagGeometry(T);closed(g,"soil bag");const p=g.attributes.position,n=g.attributes.normal;
 assert.ok(n.getX(0)*p.getX(0)+n.getZ(0)*p.getZ(0)>0);
 g.computeBoundingBox();assert.ok(g.boundingBox.max.y>.98);
});

test("bevelled construction parts remain closed and keep their exact placement bounds",()=>{
 const geometry=beveledBoxSurface(T);closed(geometry,"bevelled board");geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new T.Vector3());for(const n of[size.x,size.y,size.z])assert.ok(Math.abs(n-1)<1e-6);
});

test("contact paint darkens an enclosed face and stays clear on exposed faces",()=>{
 const cube=new T.BoxGeometry(1,1,1),m={userData:{kind:"wood"}},part={geo:cube,m,matrix:new T.Matrix4()},over={geo:cube,m,matrix:new T.Matrix4().makeTranslation(0,1.015,0)};
 const masks=cubeContactPaint(T,[part,over],cube);assert.equal(masks.get(part).positive[1],1);assert.equal(masks.get(part).negative[1],0);assert.equal(masks.get(part).positive[0],0);assert.equal(masks.get(over).negative[1],1);
});

test("shaded blue paint retains its hue and white enamel stays neutral",()=>{
 const channels=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 for(const hex of pigmentPalette('metal','#398db5')) {
   const [r,g,b]=channels(hex);assert.ok(b>g&&g>r,'blue is not replaced by a shared gray shadow');
 }
 const [r,g,b]=channels(pigmentPalette('enamel','#e8e8e8')[4]);
 assert.ok(Math.max(r,g,b)-Math.min(r,g,b)<5,'white highlight does not become yellow');
});

test("manufactured surfaces keep quiet paint between structural details",()=>{
 for(const [kind,min]of[['metal',.95],['paint',.96],['enamel',.94],['wood',.73]]) {
   const pixels=new Uint8Array(4096),recipe=pixelPainting(kind);
   for(const [x,y,w,h,ink]of recipe.commands)for(let yy=Math.max(0,y);yy<Math.min(64,y+h);yy++)
     for(let xx=Math.max(0,x);xx<Math.min(64,x+w);xx++)pixels[yy*64+xx]=ink;
   assert.ok(pixels.filter(n=>n===3).length/4096>=min,kind+' preserves the broad base plane');
 }
});

test("faceted car shells are closed, outward facing and bounded",()=>{
 const rings=[[1.61,.19,1.69,-1.69],[1.76,.32,1.74,-1.74],[1.73,.58,1.67,-1.65],[1.55,.66,1.40,-1.47]];
 const g=carShell(T,rings);closed(g,'street car');
 const p=g.attributes.position,n=g.attributes.normal;
 const middle=new T.Vector3(0,.43,0);
 for(let j=0;j<p.count;j+=3) {
   const center=new T.Vector3();for(let k=0;k<3;k++)center.add(new T.Vector3().fromBufferAttribute(p,j+k));
   center.divideScalar(3).sub(middle);
   assert.ok(center.dot(new T.Vector3().fromBufferAttribute(n,j))>0,'shell normal is outward');
 }
});

test("street props have independent glass, fittings and bounded detail counts",()=>{
 const parts=[],surfaces=[],kinds=new Set(),root=new T.Group();
 const api={T,P:{metalDark:'#26323e'},surface:(parent,geometry,x,y,z,w,h,d,color,kind)=>{kinds.add(kind);surfaces.push(geometry);},
   box:(...p)=>parts.push(p),cyl:(...p)=>parts.push(p),beam:(...p)=>parts.push(p),
   group:(parent,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}};
 buildStreetCar(api,root,'#b6a090');buildStreetLantern(api,root);
 assert.ok(kinds.has('panel-glass'));assert.ok(kinds.has('livery-car'));
 assert.ok(parts.length<110,'fittings do not grow into a voxel shell');
 assert.equal(surfaces.length,10,'body, roof, six panes and two door panels');
});

test("cars with different paint reuse the same immutable surfaces for city batching",()=>{
 const records=[],root=new T.Group();
 const api={T,P:{metalDark:'#26323e'},box(){},cyl(){},beam(){},
   surface:(parent,geometry,x,y,z,w,h,d,color,kind)=>records.push({geometry,color,kind}),
   group:(parent,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}};
 buildStreetCar(api,root,'#b6a090');buildStreetCar(api,root,'#48899d');
 assert.equal(records.length,20);assert.equal(new Set(records.map(r=>r.geometry)).size,9);
 for(let j=0;j<10;j++)assert.equal(records[j].geometry,records[j+10].geometry);
 assert.notEqual(records[0].color,records[10].color);
});

test("the outdoor ground belongs to the city hidden by the indoor view",()=>{
 const scene=new T.Scene(),city=new T.Group();scene.add(city);
 const api={T,P:{metalDark:'#26323e',wood:'#b7834c'},box(){},cyl(){},beam(){},ellipsoid(){},surface(){},
   mat:color=>new T.MeshBasicMaterial({color}),
   group:(parent,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}};
 buildNeighborhood(api,city,-18.15,()=>{});
 const ground=city.getObjectByName('neighborhood-ground');
 assert.ok(ground);assert.equal(ground.parent,city);
 assert.equal(scene.children.length,1,'room does not retain a separate outdoor ground');
});
