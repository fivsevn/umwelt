// Authoring plans contain integer Pencil strokes, not generated raster files.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { pixelPainting, TEXTURE_KINDS } from "../../../rooftop/3d/pixel-materials.mjs";
import { PLANTS, POTS } from "../../../rooftop/botany.mjs";
import { ASSETS } from "../../../rooftop/scene.mjs";
import { objectReferences } from "../../../rooftop/object-references.mjs";
import { WEAPONS, paintWeapon } from "../../../rooftop/weapons.mjs";
const here = new URL("./", import.meta.url), root = new URL("../../../", here);
const out = new URL("rooftop/assets/pixel/", root);
mkdirSync(out, { recursive: true });
const acceptedCells = JSON.parse(readFileSync(new URL("approved-native-cells.json",here))).fields;
const fields = [], strokes = [];
const gray = ["#dddddd", "#ededed", "#c8c8c8", "#b0b0b0", "#979797", "#ffffff"];
function field(name, mode = "field", palette = gray, width = 32, height = 32) {
  const index = fields.length, x = index % 16 * 32, y = Math.floor(index / 16) * 32;
  const f = { name, x, y, width, height, mode, palette, rows: Array.from({ length: height }, () => Array(width).fill(0)) };
  fields.push(f); return f;
}
function rect(f, x, y, w, h, ink) {
  for (let j = Math.max(0,y); j < Math.min(f.height,y+h); j++) for (let i=Math.max(0,x);i<Math.min(f.width,x+w);i++) f.rows[j][i]=ink;
}
function patch(f,x,y,rows,ink) { rows.forEach((row,j)=>[...row].forEach((c,i)=>{ if(c!==".")rect(f,x+i,y+j,1,1,ink); })); }
function sampleField(name, tile, mode = "field") {
  const source=acceptedCells[tile], f = field(name,mode,[...source.palette]);
  f.rows = source.rows.map(row=>row.slice()); return f;
}
sampleField("wall",4); sampleField("room-wall",15); sampleField("paving",6);
sampleField("metal",2); sampleField("stone",7);
const roof=sampleField("roof",11);
// Door panels occupy atlas cells 5/14; timber uses its own quiet native grain.
const wood=field("wood","field",["#ffffff","#ededed","#cccccc","#ababab"]);
for(let x=0;x<32;x+=8){rect(wood,x,0,1,32,3);rect(wood,x+1,0,1,32,1);}
patch(wood,3,6,["222...",".2222.","..2222"],2);
patch(wood,20,22,["1111..",".11111","..1111"],1);
sampleField("clay",0); sampleField("clay-rim",1); sampleField("soil",8);
const brick=field("brick");
for(let y=0;y<32;y+=8){rect(brick,0,y,32,1,3);for(let x=(y%16?8:0);x<32;x+=16)rect(brick,x,y,1,8,3);}
patch(brick,2,4,["111111...","111111111",".1111111."],1);patch(brick,18,20,["2222..","222222",".22222"],2);
for(const name of ["paint","enamel","cloth","asphalt","wicker","water","leaf","leafRigid","cactus","canopy","petal","skin","hair","actor-cloth","leaf-striped","leaf-variegated","leaf-succulent","leaf-moss"]){
 const f=field(name);
 if(/leaf|canopy|cactus/.test(name)){
   f.palette=["#ffffff","#ededed","#bdbdbd","#919191"];
   f.rows=acceptedCells[9].rows.map(row=>row.slice());
   rect(f,15,0,2,32,1);
   for(const y of [8,20]){patch(f,5,y,["22......",".222....","...222..",".....222"],2);patch(f,17,y,["......22","....222.","..222...","222....."],2);}
   if(/striped|cactus/.test(name))for(let x=3;x<32;x+=8)rect(f,x,0,2,32,2);
   if(/variegated/.test(name)){f.palette.push("#f5ebc8");patch(f,3,1,["11111111","1111111.","111111..","111111..","11111...","1111....","111.....","11......"],4);}
   if(/succulent/.test(name)){rect(f,0,0,32,5,1);rect(f,0,25,32,7,2);}
   if(/moss/.test(name)){rect(f,0,0,32,32,0);for(const [x,y] of [[2,3],[16,8],[6,20],[23,25]])patch(f,x,y,["111..","11111",".1111","..111"],1);}
 }else{
   patch(f,3,8,["111111..","1111111.","11111111",".1111111","..11111."],1);
   patch(f,23,23,["2222..","22222.","222222",".22222","..222."],2);
   if(/soil|asphalt/.test(name))for(const [x,y] of [[4,25],[20,5]])patch(f,x,y,["33.","333",".33"],3);
   if(name==="wicker")for(let x=0;x<32;x+=4)rect(f,x,0,1,32,2);
   if(name==="cloth"||name==="actor-cloth")rect(f,0,28,32,1,2);
   if(name==="water")for(let y=3;y<32;y+=8)rect(f,5,y,14,1,1);
 }
}
const splitLeaf=field("leaf-split","field",["#ffffff","#ededed","#bdbdbd","#919191","#00000000"]);
splitLeaf.rows=acceptedCells[9].rows.map(row=>row.slice());
rect(splitLeaf,15,0,2,32,1);
rect(splitLeaf,13,25,1,1,4);rect(splitLeaf,18,20,1,1,4);
const stoneLeaf=field("leaf-stones","panel");
rect(stoneLeaf,0,0,32,32,0);rect(stoneLeaf,0,24,32,8,2);
patch(stoneLeaf,2,6,["11111111..","1111111111",".111111111","..1111111."],1);
patch(stoneLeaf,22,16,["3333..","333333",".33333","..3333"],3);
// Function and provenance remain visible in coarse panels. They are repainted
// at 32 native pixels; background stippling from the retired recipes is removed.
function recipeField(name, part=0) {
 const art=pixelPainting(name), w=art.width||art.size, h=art.height||art.size;
 const source=Array(w*h).fill(0);
 for(const [x,y,ww,hh,k] of art.commands)for(let j=Math.max(0,y);j<Math.min(h,y+hh);j++)for(let i=Math.max(0,x);i<Math.min(w,x+ww);i++)source[j*w+i]=k;
 const isVessel=name.startsWith("vessel-"), panel=/panel|glass|light|livery/.test(name);
 const f=field(name+(part?"-interior":""),isVessel?"vessel":panel?"panel":"panel", [...gray,...art.ramp]);
 const cellW=isVessel?w:(art.cellWidth||w), cellH=isVessel?h/2:(art.cellHeight||h), ox=0, oy=isVessel?part*cellH:0;
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
   const k=source[Math.min(h-1,oy+Math.floor((y+.5)*cellH/32))*w+ox+Math.floor((x+.5)*cellW/32)];
   // Ceramics retain iron/blue motifs and quiet glaze fields; neutral grains do
   // not turn the whole vessel into a point-noise texture.
   f.rows[y][x]=!panel&&k<(art.grayCount||9)?0:k+gray.length;
 }
 if(isVessel){
   const motif=f.rows, base=acceptedCells[0];
   f.palette.splice(0,6,"#ffffff","#ededed","#cccccc","#ababab","#999999","#ffffff");
   f.rows=base.rows.map(row=>row.map(k=>[1,0,2,3][k]));
   // Repaint the original coloured motif into native lower rows. A physical
   // 1px square stays one atlas pixel; no face-to-32px stretching at runtime.
   for(let y=0;y<8;y++)for(let x=0;x<32;x++){
    const ink=motif[y*4][x];
    if(ink>=gray.length+(art.grayCount||9)) f.rows[24+y][x]=ink;
   }
 }
 return f;
}
for(const name of TEXTURE_KINDS.filter(k=>/^(panel-|livery-|glass$|light$|face-|round-metal)/.test(k)))recipeField(name);
for(const p of POTS){recipeField("vessel-"+p.id);recipeField("vessel-"+p.id,1);}
for(const weapon of WEAPONS){
 const f=field(weapon.id,"panel",["#00000000"]), colors=new Map([["#00000000",0]]), saved=[];
 const c={fillStyle:"#ffffff",globalAlpha:1,x:0,y:0,
   save(){saved.push([this.x,this.y,this.globalAlpha]);},
   restore(){[this.x,this.y,this.globalAlpha]=saved.pop();},
   translate(x,y){this.x+=x;this.y+=y;},
   fillRect(x,y,w,h){if(this.globalAlpha<.5)return;const color=this.fillStyle;
    if(!colors.has(color)){colors.set(color,f.palette.length);f.palette.push(color);}
    const x0=Math.floor((x+this.x)*.043*8+16),y0=Math.floor((y+this.y)*.043*8+16),x1=Math.ceil((x+w+this.x)*.043*8+16),y1=Math.ceil((y+h+this.y)*.043*8+16);
    rect(f,x0,y0,Math.max(1,x1-x0),Math.max(1,y1-y0),colors.get(color));
   }};
 paintWeapon(c,weapon);
}
// Revision 3: native drawings for actual game furniture and architecture.
// Existing botanical fields are untouched; draw only edited non-plant fields.
const edited=new Set();
function repaint(name,palette){
 let f=fields.find(f=>f.name===name);
 if(!f)f=field(name);
 f.palette=palette;f.rows=Array.from({length:32},()=>Array(32).fill(0));
 edited.add(name);return f;
}
const timber=["#d8d8d8","#f1f1f1","#b8b8b8","#929292","#757575"];
for(const name of ["wood","face-board","face-cabinet","face-door","face-drawer"]){
 const f=repaint(name,timber);
 // Long broken fibres run with a board; each line is one native square wide.
 for(const y of [2,10,18,26]){
  rect(f,0,y,10,1,2);rect(f,13,y+1,11,1,1);rect(f,25,y,7,1,2);
  rect(f,2,y+2,14,1,1);rect(f,19,y+3,8,1,3);
 }
 patch(f,7,14,[".22222.","2233322","2334332",".23332.","..222.."],2);
 rect(f,9,15,3,1,3);rect(f,10,16,1,1,4);
 patch(f,23,5,["22222","2222.","222.."],2);
 patch(f,1,23,["33333...","3333333.",".3333333","..333333"],3);
 if(name==="wood")f.rows=f.rows[0].map((_,x)=>f.rows.map(row=>row[x]));
 if(/cabinet|door|drawer/.test(name)){
  for(const x of [3,16,28]){rect(f,x,0,1,32,3);rect(f,x+1,0,1,32,1);}
 }
}
const wall=repaint("wall",["#c9c9c9","#e5e5e5","#b7b7b7","#a0a0a0","#7e8b73","#aaa08a"]);
patch(wall,1,2,["1111111...","11111111..","111111111.",".111111111","..11111111","...111111."],1);
patch(wall,17,11,["222222...","22222222.",".22222222","..2222222","..222222.","...2222.."],2);
patch(wall,4,20,["3333....","333333..","33333333",".3333333","..333333"],3);
rect(wall,0,29,32,3,2);
for(const [x,h] of [[0,3],[6,5],[14,2],[23,4],[29,6]])rect(wall,x,29-h,3,h+3,4);
patch(wall,18,25,["55...","555..","55555",".5555"],5);
const parapet=repaint("parapet",["#c9c9c9","#e5e5e5","#b7b7b7","#9ba78f","#829071","#aaa08a"]);
// The actual parapet is six texels high. Its chart is centred at 16, rather
// than sampling the top of a 32px house wall and missing the wall foot.
rect(parapet,0,12,32,1,1);rect(parapet,0,18,32,3,2);
patch(parapet,3,13,["11111..","1111111","..11111"],1);
patch(parapet,19,14,["222222",".22222","..2222"],2);
for(const [x,h] of [[0,2],[8,3],[15,1],[24,2],[29,3]])rect(parapet,x,19-h,3,h+3,3);
rect(parapet,9,18,2,2,4);rect(parapet,29,19,3,2,4);
patch(parapet,18,17,["55...","55555",".5555"],5);
const paving=repaint("paving",["#c6c8b7","#d6d3bd","#b2b9a6","#93a18e","#a3ad98","#b2a58b"]);
for(let y=0;y<32;y+=8)for(let x=0;x<32;x+=8){
 rect(paving,x,y,8,8,0);rect(paving,x,y,8,1,3);rect(paving,x,y,1,8,3);
 // Worn corners and one broad dry/wet field, never a stochastic dot texture.
 const tile=(x/8+y/8)%4;
 if(tile===0)patch(paving,x+2,y+2,["1111..","111111",".11111","..1111"],1);
 if(tile===1)patch(paving,x+4,y+4,["22..","2222",".222"],2);
 if(tile===2)rect(paving,x+1,y+5,3,2,4);
 if(tile===3)patch(paving,x+1,y+1,["55..","555.",".555"],5);
}
const roofPaint=repaint("roof",["#a3795f","#bd9776","#89634f","#77533f","#c5a37f","#8b8e70"]);
for(let y=0;y<32;y+=8)for(let x=0;x<32;x+=8){
 rect(roofPaint,x,y,8,8,0);rect(roofPaint,x,y+7,8,1,3);rect(roofPaint,x,y,1,8,2);
 rect(roofPaint,x+1,y+1,2,5,1);rect(roofPaint,x+6,y+2,1,5,2);
 if((x+y)%24===0)patch(roofPaint,x+3,y+2,["44..","4444",".444"],4);
 if((x+y)%32===8)rect(roofPaint,x+4,y+6,3,1,5);
}
const metal=repaint("metal",["#dddddd","#f4f4f4","#b8b8b8","#8f8f8f","#957252","#bd9970"]);
// Connected scratches and dull oxide patches, still readable on narrow bars.
for(let y=0;y<32;y+=8){rect(metal,1,y+1,5,1,1);rect(metal,15,y+3,7,1,2);rect(metal,26,y+5,4,1,3);}
patch(metal,6,14,["1111...","1111111","..11111"],1);
patch(metal,22,22,["222..","22222",".2222","..222"],2);
patch(metal,1,27,["444..","44444",".4444","..444"],4);rect(metal,2,27,2,1,5);
for(const name of ["paint","enamel","round-metal","cloth","wicker","asphalt"]){
 const f=repaint(name,["#dddddd","#f0f0f0","#b8b8b8","#929292","#aaa18a"]);
 patch(f,2,4,["111111..","11111111",".1111111","..111111"],1);
 patch(f,18,16,["2222....","222222..","22222222",".2222222","..222222"],2);
 patch(f,4,25,["333...","33333.",".33333","..3333"],3);
 if(name==="cloth")for(const x of [5,19])rect(f,x,0,1,32,2);
 if(name==="wicker")for(let y=0;y<32;y+=4)for(let x=0;x<32;x+=4){rect(f,x,y,3,1,2);rect(f,x+1,y+1,1,2,1);}
}
// Coarse reflections occupy square pigment cells, including transparent panes.
const glass=repaint("glass",["#d8d8d8","#ffffff","#b0b0b0"]);
patch(glass,2,3,["11......","111.....",".111....","..111...","...111..","....111.",".....111","......11"],1);
patch(glass,19,17,["2222..","22222.",".22222","..2222"],2);
// Pot and appliance motifs remain in their original specialist fields. Clay
// shells keep coarse deposits, without changing the original vessel drawings.
for(const name of ["clay","clay-rim","stone","room-wall"]){
 const f=fields.find(f=>f.name===name);edited.add(name);
}
// Coherent deposits belong to material sources. They occupy a small corner of
// the original square grid, without sprinkling new dots across the whole face.
for(const base of ["wood","metal","paint","enamel","cloth","face-board","face-cabinet","face-door","face-drawer","round-metal"]){
 const source=fields.find(f=>f.name===base)||fields.find(f=>f.name==="paint");
 const f=field("weather-"+base,source.mode,[...source.palette,"#766552","#8d7b63","#526449"]);
 f.rows=source.rows.map(row=>row.slice());edited.add(f.name);const ink=source.palette.length;
 patch(f,1,27,["1111...","111111.","1111111",".111111","..11111"],ink+1);
 if(base==="metal")patch(f,27,23,["111","111","11.","11.","1.."],ink);
 else if(base!=="enamel")patch(f,3,28,["111..","11111",".1111","..111"],ink+2);
}
if(fields.length>256)throw Error("Native book capacity exceeded");
for(const f of fields.filter(f=>edited.has(f.name)))for(let y=0;y<f.height;y++)for(let x=0;x<f.width;){let end=x;while(end+1<f.width&&f.rows[y][end+1]===f.rows[y][x])end++;strokes.push({color:f.palette[f.rows[y][x]],points:[[f.x+x,f.y+y],[f.x+end,f.y+y]]});x=end+1;}
const manifest=Object.fromEntries(fields.map(({name,x,y,width,height,mode})=>[name,{x,y,width,height,mode}]));
writeFileSync(new URL("pencil-strokes.json",here),JSON.stringify({size:512,brush:1,fields:manifest,editedFields:[...edited],strokes})+"\n");
writeFileSync(new URL("book-layout.json",here),JSON.stringify({software:"Pixelorama",grid:8,tileSize:32,size:512,fields:manifest},null,2)+"\n");
writeFileSync(new URL("rooftop/3d/native-book.mjs",root),"// Native Pixelorama atlas coordinates; see docs/art/rooftop-game/material-book.pxo.\nexport const NATIVE_BOOK = "+JSON.stringify(manifest,null,2)+";\n");
writeFileSync(new URL("asset-ledger.json",here),JSON.stringify(ASSETS.map(a=>({id:a.id,name:a.name,category:a.category,plant:PLANTS.find(p=>p.id===a.id)||null,vessel:POTS.find(p=>p.id===a.vessel)||null,sources:objectReferences(a),note:a.note||"",status:"shared native materials; original form retained for individual review"})),null,2)+"\n");
console.log(JSON.stringify({fields:fields.length,strokes:strokes.length,assets:ASSETS.length,plants:PLANTS.length,vessels:POTS.length}));
