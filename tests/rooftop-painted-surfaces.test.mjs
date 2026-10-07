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
} from "../rooftop/3d/pixel-materials.mjs";
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
      const upper = [j,j+1,j+2].every(k => p.getY(k) > Math.sin(p.getZ(k)*Math.PI)*(fleshy?.11:.075)+.001);
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
