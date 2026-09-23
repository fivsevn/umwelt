import {exportScene,importScene,shareCode} from './scene-codec.mjs';
import {drawSubstrate,drawLeaf,drawMossPatch,drawBark,drawStone,drawCuttlebone,drawTwig,drawWoodChip,LEGACY_BASE_SCENE,DEFAULT_LAYOUT} from './scenery/index.mjs';
import {drawAquaticBackground,drawAquaticPlant,drawAquaticDetail,AQUATIC_BACKDROPS} from './scenery/aquatic.mjs';
import {ACTOR_SCALE} from './scenery/grammar.mjs';
import {SCENE_LAYOUTS} from './scenery/authored-layouts.mjs';
import {SPECIES,speciesById} from './species-registry.mjs';
import {renderModel,pixelAnatomy} from './sprites.mjs';

const $=s=>document.querySelector(s);
const scene=$('#scene'),ctx=scene.getContext('2d');ctx.imageSmoothingEnabled=false;

// Exact projection multiplier used by habitat.mjs for live specimens.
// The scale is shared with the game renderer.
const GAME_ACTOR_SCALE=ACTOR_SCALE;
const reference={
 species:'dairy',stage:'M',x:226,y:286,a:-.34,seed:189,visible:true
};
let referenceHitCells=[];

for(const p of SPECIES.filter(p=>p.game?.habitatEligible!==false)){
 const option=new Option(`${p.label||p.name||p.id} · ${p.taxon||p.id}`,p.id);
 $('#referenceSpecies').append(option);
}
$('#referenceSpecies').value=reference.species;
$('#referenceStage').value=reference.stage;

const ASSETS=[
 {id:'substrate-dry',category:'substrate',kind:'background',scenes:['forest'],label:'Dry substrate',note:'基质 / 干燥',params:{wetZones:[],light:82}},
 {id:'substrate-wet-left',category:'substrate',kind:'background',scenes:['forest'],label:'Moisture gradient',note:'基质 / 左侧湿区',params:{wetZones:[{x:44,y:215,rx:92,ry:250,moisture:78}],light:82}},
 {id:'substrate-forest',category:'substrate',kind:'background',scenes:['forest'],label:'Forest floor',note:'基质 / 林地湿润斑块',params:{wetZones:[{x:60,y:120,rx:115,ry:170,moisture:74},{x:320,y:300,rx:90,ry:115,moisture:58}],light:76}},

 {id:'water-freshwater',category:'water',kind:'background',scenes:['freshwater'],label:'Freshwater pool',note:'淡水 / 深绿腐殖底',params:{aquatic:true,kind:'freshwater',palette:AQUATIC_BACKDROPS.freshwater.palette}},
 {id:'water-intertidal',category:'water',kind:'background',scenes:['intertidal'],label:'Intertidal pool',note:'潮间带 / 岩池底',params:{aquatic:true,kind:'intertidal',palette:AQUATIC_BACKDROPS.intertidal.palette}},
 {id:'water-shallow-marine',category:'water',kind:'background',scenes:['shallow-marine'],label:'Shallow seaweed bed',note:'浅海 / 藻场底',params:{aquatic:true,kind:'shallow-marine',palette:AQUATIC_BACKDROPS['shallow-marine'].palette}},
 {id:'water-abyssal',category:'water',kind:'background',scenes:['abyssal'],label:'Abyssal plain',note:'深海 / 深渊沉积平原',params:{aquatic:true,kind:'abyssal',palette:['#10181b','#172225','#223033','#343d3f']}},

 {id:'waterweed-tuft-01',category:'aquatic',scenes:['freshwater'],label:'Waterweed 01',note:'淡水水草 / 对生叶',radius:42,params:{kind:'waterweed',height:58,flow:36}},
 {id:'waterweed-tuft-02',category:'aquatic',scenes:['freshwater'],label:'Waterweed 02',note:'淡水水草 / 高株',radius:52,params:{kind:'waterweed',height:78,flow:42}},
 {id:'freshwater-detritus-01',category:'debris',scenes:['freshwater'],label:'Detritus mat',note:'淡水腐殖池 / 腐殖碎屑',radius:34,params:{detail:'detritus',count:13}},
 {id:'rockweed-tuft-01',category:'aquatic',scenes:['intertidal'],label:'Rockweed 01',note:'潮间带褐藻 / 短簇',radius:40,params:{kind:'rockweed',height:42,flow:58}},
 {id:'rockweed-tuft-02',category:'aquatic',scenes:['intertidal'],label:'Rockweed 02',note:'潮间带褐藻 / 高簇',radius:48,params:{kind:'rockweed',height:58,flow:64}},
 {id:'barnacle-cluster-01',category:'aquatic',scenes:['intertidal'],label:'Barnacle cluster',note:'潮间带 / 藤壶附着群',radius:34,params:{detail:'barnacle',count:12}},
 {id:'limpet-cluster-01',category:'aquatic',scenes:['intertidal'],label:'Limpet cluster',note:'潮间带 / 帽贝附着群',radius:30,params:{detail:'limpet',count:7}},
 {id:'seagrass-tuft-01',category:'aquatic',scenes:['shallow-marine'],label:'Seagrass 01',note:'浅海草丛 / 细叶',radius:36,params:{kind:'seagrass',height:46,flow:44}},
 {id:'ulva-clump-01',category:'aquatic',scenes:['shallow-marine'],label:'Sea lettuce',note:'浅海 / 石莼叶簇',radius:34,params:{kind:'ulva',height:38,flow:42}},
 {id:'kelp-frond-01',category:'aquatic',scenes:['shallow-marine'],label:'Kelp frond 01',note:'海带 / 交错宽叶',radius:64,params:{kind:'kelp',height:92,flow:46}},
 {id:'kelp-frond-02',category:'aquatic',scenes:['shallow-marine'],label:'Kelp frond 02',note:'海带 / 长株',radius:76,params:{kind:'kelp',height:118,flow:52}},
 {id:'shell-grit-01',category:'debris',scenes:['intertidal','shallow-marine'],label:'Shell grit',note:'海岸 / 贝壳碎屑',radius:32,params:{detail:'shellgrit',count:18}},

 {id:'root-tangle-01',category:'debris',scenes:['forest','freshwater'],label:'Root tangle',note:'细根 / 缠结根须',radius:44,params:{labDetail:'root-tangle'}},
 {id:'leaf-skeleton-01',category:'leaf',scenes:['forest','freshwater'],label:'Leaf skeleton',note:'半腐叶 / 裸露叶脉',radius:34,params:{labDetail:'leaf-skeleton'}},
 {id:'mycelium-patch-01',category:'moss',scenes:['forest'],label:'Mycelium patch',note:'菌丝 / 淡色腐殖斑',radius:34,params:{labDetail:'mycelium'}},
 {id:'humus-clump-01',category:'debris',scenes:['forest'],label:'Humus clump',note:'腐殖团 / 深色有机碎屑',radius:30,params:{labDetail:'humus'}},
 {id:'silt-pocket-01',category:'debris',scenes:['freshwater'],label:'Silt pocket',note:'淡水 / 细泥沉积',radius:38,params:{labDetail:'silt'}},
 {id:'rock-crack-01',category:'stone',scenes:['intertidal'],label:'Rock crack',note:'潮间带 / 岩面裂隙',radius:34,params:{labDetail:'rock-crack'}},
 {id:'algae-film-01',category:'aquatic',scenes:['intertidal'],label:'Algae film',note:'潮间带 / 岩面藻膜',radius:38,params:{labDetail:'algae-film'}},
 {id:'shell-fragment-01',category:'debris',scenes:['intertidal','shallow-marine','abyssal'],label:'Shell fragment',note:'海底 / 大块贝壳残片',radius:28,params:{labDetail:'shell-fragment'}},
 {id:'kelp-holdfast-01',category:'aquatic',scenes:['shallow-marine'],label:'Kelp holdfast',note:'浅海 / 海带固着器',radius:34,params:{labDetail:'holdfast'}},
 {id:'crustose-algae-01',category:'aquatic',scenes:['intertidal','shallow-marine'],label:'Crustose algae',note:'壳状藻 / 灰紫附着斑',radius:34,params:{labDetail:'crustose'}},
 {id:'abyssal-silt-01',category:'debris',scenes:['abyssal'],label:'Abyssal silt',note:'深海 / 细沉积物斑',radius:42,params:{labDetail:'abyssal-silt'}},
 {id:'nodule-cluster-01',category:'stone',scenes:['abyssal'],label:'Nodule cluster',note:'深海 / 锰结核状石块',radius:32,params:{labDetail:'nodule'}},
 {id:'deepsea-sponge-01',category:'aquatic',scenes:['abyssal'],label:'Deep-sea sponge',note:'深海 / 苍白固着海绵',radius:36,params:{labDetail:'sponge'}},
 {id:'sunken-wood-01',category:'bark',scenes:['abyssal'],label:'Sunken wood',note:'深海 / 沉木残片',radius:52,params:{labDetail:'sunken-wood'}},

 {id:'moss-sphagnum-01',category:'moss',scenes:['forest','freshwater'],label:'Sphagnum cluster 01',note:'水苔 / 大片',radius:52,params:{rx:48,ry:31,wetness:.76,alpha:.80}},
 {id:'moss-sphagnum-02',category:'moss',scenes:['forest','freshwater'],label:'Sphagnum cluster 02',note:'水苔 / 小片',radius:38,params:{rx:34,ry:22,wetness:.62,alpha:.76}},
 {id:'moss-carpet-03',category:'moss',scenes:['forest'],label:'Moss carpet 03',note:'苔藓 / 林地大片',radius:64,params:{variant:2,rx:58,ry:36,wetness:.70,alpha:.84}},

 {id:'leaf-broad-01',category:'leaf',scenes:['forest','freshwater'],label:'Oak leaf',note:'橡树 / 裂片枯叶',radius:58,params:{variant:0,tone:0,scale:1.04}},
 {id:'leaf-narrow-01',category:'leaf',scenes:['forest','freshwater'],label:'Willow leaf',note:'柳树 / 狭长枯叶',radius:46,params:{variant:1,tone:1,scale:.92}},
 {id:'leaf-broken-01',category:'leaf',scenes:['forest'],label:'Maple leaf',note:'枫树 / 掌状破损叶',radius:46,params:{variant:3,tone:2,scale:1.04,gap:true}},
 {id:'leaf-fan-01',category:'leaf',scenes:['forest'],label:'Ginkgo leaf',note:'银杏 / 扇形裂叶',radius:60,params:{variant:4,tone:0,scale:1.04}},
 {id:'leaf-curled-01',category:'leaf',scenes:['forest'],label:'Beech leaf',note:'林地阔叶 / 山毛榉',radius:58,params:{variant:5,tone:2,scale:1.0}},

 {id:'leaf-magnolia-01',category:'leaf',scenes:['forest'],label:'Magnolia leaf',note:'玉兰 / 大宽叶',radius:60,params:{variant:2,tone:3,scale:1.10}},
 {id:'leaf-oak-rust',category:'leaf',scenes:['forest'],label:'Oak · russet',note:'橡树 / 赤褐破损叶',radius:58,params:{variant:0,tone:1,scale:.72,gap:true}},
 {id:'leaf-ginkgo-brown',category:'leaf',scenes:['forest'],label:'Ginkgo · aged',note:'银杏 / 深棕枯叶',radius:58,params:{variant:4,tone:2,scale:.72}},
 {id:'bark-log-01',category:'bark',scenes:['forest','freshwater'],label:'Mossy broken log',note:'断木 / 附苔',radius:68,params:{variant:2,scale:1.02}},
 {id:'bark-shelter-01',category:'bark',scenes:['forest'],label:'Bark shelter 01',note:'树皮 / 躲避',radius:112,params:{variant:0,scale:1.16}},
 {id:'bark-fragment-01',category:'bark',scenes:['forest','freshwater'],label:'Bark fragment 01',note:'树皮 / 碎片',radius:68,params:{variant:1,scale:.96}},

 {id:'stone-round-01',category:'stone',scenes:['forest','freshwater','intertidal','shallow-marine'],label:'Stone round 01',note:'石块 / 圆',radius:18,params:{variant:0,scale:1}},
 {id:'stone-flat-01',category:'stone',scenes:['forest','freshwater','intertidal','shallow-marine'],label:'Stone flat 01',note:'石块 / 扁平',radius:20,params:{variant:1,scale:1}},
 {id:'stone-small-01',category:'stone',scenes:['forest','freshwater','intertidal','shallow-marine'],label:'Stone small 01',note:'石块 / 小',radius:15,params:{variant:3,scale:.82}},

 {id:'stone-shard-01',category:'stone',scenes:['forest','freshwater','intertidal','shallow-marine'],label:'Stone shard',note:'石块 / 缺角碎石',radius:18,params:{variant:2,scale:1}},
 {id:'stone-tide-01',category:'stone',scenes:['intertidal'],label:'Tide rock 01',note:'潮间带 / 大圆岩',radius:42,params:{variant:0,scale:2.35}},
 {id:'stone-tide-02',category:'stone',scenes:['intertidal'],label:'Tide rock 02',note:'潮间带 / 扁平岩',radius:48,params:{variant:1,scale:2.65}},
 {id:'cuttlebone-broken',category:'calcium',scenes:['forest'],label:'Broken cuttlebone',note:'墨鱼骨 / 破损片',radius:30,params:{variant:1,scale:.82}},
 {id:'cuttlebone-01',category:'calcium',scenes:['forest'],label:'Cuttlebone 01',note:'墨鱼骨 / 钙源',radius:30,params:{scale:.82}},

 {id:'twig-01',category:'debris',scenes:['forest','freshwater'],label:'Twig 01',note:'细枝',radius:24,params:{length:24}},
 {id:'woodchip-01',category:'debris',scenes:['forest','freshwater'],label:'Wood chip 01',note:'木屑 / 碎片',radius:26,params:{variant:0,scale:.82}},
 {id:'woodchip-02',category:'debris',scenes:['forest','freshwater'],label:'Wood chip 02',note:'木屑 / 长片',radius:30,params:{variant:1,scale:.72}}
];
const ASSET_BY_ID=new Map(ASSETS.map(a=>[a.id,a]));

const STARTER=LEGACY_BASE_SCENE.map(item=>{
 const assetId='game-'+item.id;
 const category=item.type==='cuttlebone'?'calcium':['twig','chip'].includes(item.type)?'debris':item.type;
 const {x,y,a,seed,z,...params}=item;
 const asset={id:assetId,category,label:item.id,note:'正式场景',radius:item.type==='bark'?90:item.type==='moss'?item.rx:45,params};
 ASSET_BY_ID.set(assetId,asset);
 return {assetId,x,y,a:a||0,scale:1,seed,z};
});

let state={background:'substrate-wet-left',backgroundSeed:57,items:[],selected:null,nextId:1};
let category='all',drag=null,currentPreset='forest';

function presetItem(assetId,x,y,scale=1,a=0,z=20,seed=57){
 return {assetId,id:'instance-'+Math.floor(seed*13+z*7+x+y),x,y,a,scale,z,seed};
}
function aquaticPreset(id){
 const seed=id==='freshwater'?83:id==='intertidal'?131:id==='shallow-marine'?197:251;
 if(id==='freshwater')return {
  background:'water-freshwater',backgroundSeed:seed,items:[
   presetItem('bark-log-01',176,248,1.05,.38,18,81),
   presetItem('moss-sphagnum-02',63,122,.92,-.2,19,82),
   presetItem('stone-round-01',226,230,1.2,0,21,83),presetItem('stone-flat-01',117,344,1.1,0,22,84),
   presetItem('stone-small-01',285,95,.9,0,23,85),presetItem('stone-shard-01',306,299,.85,.4,24,86),
   presetItem('leaf-narrow-01',82,176,.65,.7,25,87),presetItem('leaf-broad-01',309,159,.62,-.5,26,88),
   ...[[44,116,.86],[164,92,.95],[276,128,.82],[337,205,.9],[107,306,.88],[218,354,.92],[319,367,.82],[63,392,.74]].map((p,i)=>presetItem(i%3===0?'waterweed-tuft-02':'waterweed-tuft-01',p[0],p[1],p[2],(i%3-1)*.08,30+i,100+i)),
   ...[[68,245,.82],[184,323,.94],[302,264,.78],[258,397,.72]].map((p,i)=>presetItem('freshwater-detritus-01',p[0],p[1],p[2],(i%3-1)*.2,52+i,118+i))
  ],selected:null,nextId:900
 };
 if(id==='intertidal')return {
  background:'water-intertidal',backgroundSeed:seed,items:[
   ...[[72,113,1.25],[178,99,1.15],[245,116,1.1],[326,83,1.35],[119,196,1.4],[219,192,1.25],[331,218,1.5],[84,332,1.2],[196,300,1.55],[304,337,1.35]].map((p,i)=>presetItem(i%2?'stone-tide-01':'stone-tide-02',p[0],p[1],p[2],(i%3-1)*.12,18+i,130+i)),
   ...[[55,149,.78],[153,164,.7],[267,177,.82],[340,278,.74],[110,363,.72]].map((p,i)=>presetItem(i%2?'rockweed-tuft-02':'rockweed-tuft-01',p[0],p[1],p[2],(i%3-1)*.15,45+i,160+i)),
   ...[[70,108,.78],[177,96,.74],[246,112,.72],[326,80,.8],[118,191,.86],[220,188,.76]].map((p,i)=>presetItem('barnacle-cluster-01',p[0],p[1],p[2],(i%3-1)*.1,58+i,176+i)),
   ...[[329,214,.7],[83,329,.64],[194,296,.72]].map((p,i)=>presetItem('limpet-cluster-01',p[0],p[1],p[2],0,68+i,188+i)),
   presetItem('shell-grit-01',287,383,.74,-.1,75,195)
  ],selected:null,nextId:900
 };
 if(id==='abyssal')return {
  background:'water-abyssal',backgroundSeed:seed,items:[
   presetItem('abyssal-silt-01',76,96,1.25,-.12,12,301),
   presetItem('abyssal-silt-01',310,344,1.1,.18,13,302),
   presetItem('nodule-cluster-01',55,326,.82,0,22,303),
   presetItem('nodule-cluster-01',132,379,.66,.1,23,304),
   presetItem('nodule-cluster-01',325,112,.72,-.08,24,305),
   presetItem('nodule-cluster-01',278,286,.58,.12,25,306),
   presetItem('shell-fragment-01',102,181,.72,-.58,31,307),
   presetItem('shell-fragment-01',339,389,.54,.42,32,308),
   presetItem('sunken-wood-01',28,236,.9,.78,28,309),
   presetItem('deepsea-sponge-01',319,233,.95,-.08,36,310)
  ],selected:null,nextId:900
 };
 return {
  background:'water-shallow-marine',backgroundSeed:seed,items:[
   presetItem('stone-flat-01',109,369,1.35,.1,18,201),presetItem('stone-round-01',232,157,1.1,0,19,202),presetItem('stone-small-01',301,208,.9,0,20,203),
   ...[[36,149,.88],[93,229,.82],[142,124,.9],[191,276,.86],[240,112,.92],[287,247,.84],[337,146,.9],[72,348,.78],[166,377,.82],[260,360,.86],[331,349,.78]].map((p,i)=>presetItem(i%4===0?'kelp-frond-02':'kelp-frond-01',p[0],p[1],p[2],(i%5-2)*.08,28+i,220+i)),
   ...[[118,219,.7],[217,313,.66],[310,298,.72],[48,286,.64]].map((p,i)=>presetItem('seagrass-tuft-01',p[0],p[1],p[2],0,48+i,260+i)),
   ...[[83,274,.56],[193,206,.52],[286,386,.58],[344,307,.5]].map((p,i)=>presetItem('ulva-clump-01',p[0],p[1],p[2],(i%3-1)*.08,56+i,275+i)),
   ...[[126,397,.78],[250,333,.7],[51,374,.66]].map((p,i)=>presetItem('shell-grit-01',p[0],p[1],p[2],0,65+i,290+i))
  ],selected:null,nextId:900
 };
}


const labNoise=(x,y,seed=0)=>{let n=Math.imul(x+seed+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0};
const labPixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
function labLocalPixel(g,o,u,v,w,h,c){
 const s=o.scale??1,a=o.a||0,ca=Math.cos(a),sa=Math.sin(a);
 labPixel(g,o.x+(u*ca-v*sa)*s,o.y+(u*sa+v*ca)*s,w*s,h*s,c);
}
function labLocalLine(g,o,ax,ay,bx,by,width,color){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay))));
 for(let i=0;i<=steps;i++){const t=i/steps;labLocalPixel(g,o,ax+(bx-ax)*t,ay+(by-ay)*t,width,width,color)}
}
function drawAbyssalBackground(g,{palette=['#10181b','#172225','#223033','#343d3f'],seed=251}={}){
 const w=g.canvas?.width||384,h=g.canvas?.height||430;
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
  const n=labNoise(x>>1,y>>1,seed),band=n%113===0?3:n%11===0?2:n%3===0?1:0;
  labPixel(g,x,y,2,2,palette[band]);
 }
 for(let i=0;i<Math.round(w*h/680);i++){
  const n=labNoise(i,203,seed),x=n%w,y=(n>>>10)%h;
  labPixel(g,x,y,n%9===0?2:1,1,n%7===0?'rgba(165,176,169,.28)':'rgba(70,84,83,.30)');
 }
 for(let i=0;i<20;i++){
  const n=labNoise(i,211,seed),x=n%w,y=(n>>>11)%h,len=5+n%14;
  labPixel(g,x,y,len,1,'rgba(45,56,57,.34)');
 }
}
function withSoftWorldShadow(g,{alpha=.12,dy=2}={},draw){
 if(alpha<=0||dy<=0)return draw();
 g.save();
 g.shadowColor=`rgba(18,24,20,${alpha})`;
 g.shadowOffsetX=0;
 g.shadowOffsetY=dy;
 g.shadowBlur=0;
 try{return draw()}finally{g.restore()}
}
function labDetailShadow(kind){
 if(kind==='rock-crack')return {alpha:0,dy:0};
 if(kind==='mycelium'||kind==='humus'||kind==='silt'||kind==='abyssal-silt')return {alpha:.055,dy:1};
 if(kind==='algae-film'||kind==='crustose')return {alpha:.045,dy:1};
 if(kind==='leaf-skeleton'||kind==='root-tangle')return {alpha:.13,dy:2};
 if(kind==='shell-fragment'||kind==='holdfast'||kind==='nodule')return {alpha:.11,dy:2};
 if(kind==='sponge'||kind==='sunken-wood')return {alpha:.14,dy:3};
 return {alpha:.08,dy:2};
}
function drawLabDetailShape(g,{kind,x=0,y=0,a=0,scale=1,seed=57}={}){
 const o={x,y,a,scale};
 if(kind==='root-tangle'){
  for(let i=0;i<7;i++){
   const n=labNoise(i,17,seed),sy=-22+(n%45),len=28+((n>>>8)%28),bend=((n>>>15)%15)-7;
   labLocalLine(g,o,-28,sy,-8+bend,sy+((n>>>19)%9)-4,1,i%3===0?'#2f2b22':'#4b4130');
   labLocalLine(g,o,-8+bend,sy+((n>>>19)%9)-4,len-28,sy+((n>>>23)%13)-6,1,i%2?'#5b4d36':'#403729');
   if(i%2===0)labLocalLine(g,o,-2,sy+1,8,sy-7,1,'#6c5b3e');
  }
  return;
 }
 if(kind==='leaf-skeleton'){
  const dark='#67533a',mid='#8b7350',pale='#b19b70';
  labLocalLine(g,o,-24,0,24,0,2,dark);
  for(let i=-4;i<=4;i++){
   const u=i*5;
   labLocalLine(g,o,u,0,u+(i<0?-9:9),-9+Math.abs(i),1,mid);
   labLocalLine(g,o,u,0,u+(i<0?-8:8),9-Math.abs(i),1,mid);
  }
  for(let i=-20;i<=20;i+=5)if((labNoise(i,31,seed)&3)!==0)labLocalPixel(g,o,i,-1,2,1,pale);
  return;
 }
 if(kind==='mycelium'){
  for(let i=0;i<13;i++){
   const n=labNoise(i,41,seed),u=-22+(n%45),v=-14+((n>>>8)%29),len=4+((n>>>15)%9),dir=(n&1)?1:-1;
   labLocalLine(g,o,u,v,u+dir*len,v+((n>>>20)%7)-3,1,i%4===0?'#c4c0a7':'#9f9e89');
   if(i%3===0)labLocalPixel(g,o,u,v,2,1,'#d2cdb2');
  }
  return;
 }
 if(kind==='humus'||kind==='silt'||kind==='abyssal-silt'){
  const colors=kind==='humus'?['#29261f','#3a3327','#514634']:kind==='silt'?['#314039','#435046','#5a5d4b']:['#182326','#243033','#354043'];
  for(let i=0;i<26;i++){
   const n=labNoise(i,53,seed),u=-25+(n%51),v=-14+((n>>>8)%29),w=1+(n%5);
   labLocalPixel(g,o,u,v,w,1,colors[i%colors.length]);
   if(i%7===0)labLocalPixel(g,o,u+1,v-1,1,1,colors[2]);
  }
  return;
 }
 if(kind==='rock-crack'){
  const c='#2d3937';
  labLocalLine(g,o,-24,-9,-7,-2,1,c);labLocalLine(g,o,-7,-2,2,8,1,c);labLocalLine(g,o,2,8,19,15,1,c);
  labLocalLine(g,o,-5,0,4,-9,1,'#42504c');labLocalLine(g,o,1,8,-8,16,1,'#27322f');
  return;
 }
 if(kind==='algae-film'||kind==='crustose'){
  const colors=kind==='crustose'?['#5a5156','#6f5d63','#836b6b','#9a8077']:['#3b563f','#506a49','#6c7951','#899064'];
  for(let i=0;i<24;i++){
   const n=labNoise(i,67,seed),u=-22+(n%45),v=-13+((n>>>9)%27),w=3+(n%8),h=1+((n>>>14)%3);
   labLocalPixel(g,o,u,v,w,h,colors[i%colors.length]);
  }
  return;
 }
 if(kind==='shell-fragment'){
  labLocalPixel(g,o,-17,-4,31,8,'#6b7169');labLocalPixel(g,o,-14,-7,26,4,'#aba78e');labLocalPixel(g,o,-8,-10,16,3,'#cec5a2');
  labLocalPixel(g,o,6,-7,6,4,'#817f6d');labLocalPixel(g,o,-14,2,24,2,'#8e8b75');
  return;
 }
 if(kind==='holdfast'){
  const dark='#33432e',mid='#536240',hi='#74805a';
  labLocalPixel(g,o,-7,-2,14,5,dark);
  for(let i=0;i<8;i++){const ang=(i/8)*Math.PI*2,len=10+(labNoise(i,79,seed)%12);labLocalLine(g,o,0,0,Math.cos(ang)*len,Math.sin(ang)*len*.65,2,i%3===0?hi:mid)}
  return;
 }
 if(kind==='nodule'){
  const colors=['#111719','#202728','#323a38','#525a53'];
  for(let i=0;i<9;i++){
   const n=labNoise(i,83,seed),u=-20+(n%41),v=-11+((n>>>8)%23),r=3+(n%5);
   labLocalPixel(g,o,u-r/2,v-r/2,r,r,colors[i%3]);labLocalPixel(g,o,u,v-1,Math.max(1,r-2),1,colors[3]);
  }
  return;
 }
 if(kind==='sponge'){
  const dark='#676e69',mid='#969a8d',hi='#c2c0ab';
  labLocalPixel(g,o,-8,2,17,4,dark);
  for(let i=0;i<5;i++){
   const n=labNoise(i,97,seed),u=-8+i*4,h=12+((n>>>7)%19),w=3+(n%3);
   labLocalPixel(g,o,u,-h,w,h+2,mid);labLocalPixel(g,o,u+1,-h-2,Math.max(1,w-2),3,hi);
   if(i%2===0)labLocalPixel(g,o,u,-Math.floor(h*.55),1,2,dark);
  }
  return;
 }
 if(kind==='sunken-wood'){
  labLocalPixel(g,o,-30,-6,58,12,'#252a26');labLocalPixel(g,o,-27,-8,52,4,'#3b3c32');
  for(let i=0;i<7;i++){const u=-23+i*8;labLocalPixel(g,o,u,-7,4,2,i%2?'#4b4939':'#34362e')}
  labLocalLine(g,o,-18,5,-8,12,2,'#1b211f');labLocalLine(g,o,12,5,22,11,2,'#1b211f');
 }
}
function drawLabDetail(g,options={}){
 return withSoftWorldShadow(g,labDetailShadow(options.kind),()=>drawLabDetailShape(g,options));
}

function cloneStarter(){
 const imported=importScene(JSON.stringify(DEFAULT_LAYOUT),ASSET_BY_ID,reference);
 state=imported.state;Object.assign(reference,imported.reference);
 $('#referenceSpecies').value=reference.species;$('#referenceStage').value=reference.stage;
 $('#toggleReference').setAttribute('aria-pressed',String(reference.visible));
 $('#toggleReference').textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
}
function loadPreset(id){
 currentPreset=id;
 const layout=SCENE_LAYOUTS[id]||SCENE_LAYOUTS.forest;
 const imported=importScene(JSON.stringify(layout),ASSET_BY_ID,reference);
 state=imported.state;Object.assign(reference,imported.reference);drag=null;
 $('#referenceSpecies').value=reference.species;$('#referenceStage').value=reference.stage;
 $('#toggleReference').setAttribute('aria-pressed',String(reference.visible));
 $('#toggleReference').textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
 for(const button of document.querySelectorAll('[data-preset]'))button.setAttribute('aria-pressed',String(button.dataset.preset===id));
 renderAssetList();drawScene();
}
cloneStarter();

function drawBackground(target,assetId=state.background,seed=state.backgroundSeed){
 const asset=ASSET_BY_ID.get(assetId)||ASSET_BY_ID.get('substrate-dry');
 const params={...asset.params,...(target===ctx?state.backgroundParams:{})};
 if(params.aquatic){
  if(params.kind==='abyssal')return drawAbyssalBackground(target,{palette:params.palette,seed});
  return drawAquaticBackground(target,{kind:params.kind,palette:params.palette,seed});
 }
 drawSubstrate(target,{...params,seed});
}

function drawObjectRaw(target,asset,item,preview=false){
 const x=item.x,y=item.y,a=item.a||0,seed=item.seed||0,mult=item.scale??1,p=item.params??asset.params??{};
 if(p.labDetail)return drawLabDetail(target,{kind:p.labDetail,x,y,a,seed,scale:mult});
 if(asset.category==='leaf')return drawLeaf(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='moss')return drawMossPatch(target,{...p,x,y,a,seed,rx:(p.rx||30)*mult,ry:(p.ry||20)*mult});
 if(asset.category==='bark')return drawBark(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='stone')return drawStone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(asset.category==='calcium')return drawCuttlebone(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
 if(p.detail)return withSoftWorldShadow(target,{alpha:.065,dy:1},()=>drawAquaticDetail(target,{...p,kind:p.detail,x,y,a,seed,scale:mult}));
 if(asset.category==='aquatic')return withSoftWorldShadow(target,{alpha:.075,dy:2},()=>drawAquaticPlant(target,{...p,x,y,a,seed,scale:mult}));
 if(asset.id.startsWith('twig')||p.type==='twig')return drawTwig(target,{...p,x,y,a,seed,length:(p.length||18)*mult});
 if(asset.id.startsWith('woodchip')||p.type==='chip')return drawWoodChip(target,{...p,x,y,a,seed,scale:(p.scale||1)*mult});
}
function drawObject(target,asset,item,preview=false){
 if(!item.flipX)return drawObjectRaw(target,asset,item,preview);
 const pivotX=Math.round(item.x||0);
 target.save();
 target.translate(pivotX*2,0);
 target.scale(-1,1);
 try{return drawObjectRaw(target,asset,item,preview)}
 finally{target.restore()}
}

function drawReferenceSpecimen(){
 referenceHitCells=[];
 if(!reference.visible)return;
 const species=speciesById(reference.species);
 const model=renderModel(species.visual,{stage:reference.stage,seed:reference.seed});
 const scale=GAME_ACTOR_SCALE*model.growth.scale,ca=Math.cos(reference.a),sa=Math.sin(reference.a);
 const seen=new Map();
 for(const module of pixelAnatomy(model,{posture:'normal',phase:0,moving:false})){
  for(const [sx,sy,color] of module.cells){
   if(!color)continue;
   const ox=sx*scale,oy=sy*scale;
   const x=Math.round(reference.x+ox*ca-oy*sa),y=Math.round(reference.y+ox*sa+oy*ca);
   seen.set(x+','+y,[x,y,color]);
  }
 }
 referenceHitCells=[...seen.values()];
 for(const [x,y,color] of referenceHitCells){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}
 const size=species.renderSize?.referenceMm;
 $('#specimenReadout').textContent=`${species.label||species.name||species.id} · ${reference.stage} · 1× game habitat scale${Number.isFinite(size)?` · ref ${size.toFixed(size<2?1:0)} mm`:''}`;
}

function referenceHit(point){
 return reference.visible&&referenceHitCells.some(([x,y])=>point.x>=x-3&&point.x<=x+4&&point.y>=y-3&&point.y<=y+4);
}

function drawScene(){
 ctx.clearRect(0,0,scene.width,scene.height);
 drawBackground(ctx);
 const ordered=[...state.items].sort((a,b)=>(a.z||0)-(b.z||0));
 for(const item of ordered){
  const asset=ASSET_BY_ID.get(item.assetId);if(asset)drawObject(ctx,asset,item);
 }
 drawReferenceSpecimen();
 const selected=state.items.find(i=>i.id===state.selected);
 if(selected){
  const asset=ASSET_BY_ID.get(selected.assetId),r=Math.max(8,(asset?.radius||24)*selected.scale);
  ctx.save();ctx.strokeStyle='rgba(222,220,196,.72)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.strokeRect(Math.round(selected.x-r),Math.round(selected.y-r),Math.round(r*2),Math.round(r*2));ctx.restore();
 }
 $('#objectCount').textContent=`${state.items.length} OBJECTS`;
 $('#backgroundReadout').textContent=state.background;
 updateInspector();
}

function makePreview(asset){
 const c=document.createElement('canvas');c.width=148;c.height=128;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(asset.kind==='background'){
  drawBackground(g,asset.id,57);
 }else{
  const scale=asset.category==='bark'?.48:asset.category==='leaf'?.72:asset.category==='moss'?.88:asset.category==='aquatic'?.78:asset.id.startsWith('stone-tide')?.55:1;
  drawObject(g,asset,{x:c.width/2,y:c.height/2,a:asset.category==='leaf'?-.35:asset.category==='bark'?-.08:0,seed:57,scale});
 }
 return c;
}

function assetAvailableInPreset(asset,preset=currentPreset){
 return !Array.isArray(asset.scenes)||asset.scenes.includes(preset);
}
function renderAssetList(){
 const list=$('#assetList');list.replaceChildren();
 for(const asset of ASSETS){
  if(!assetAvailableInPreset(asset))continue;
  if(category!=='all'&&asset.category!==category)continue;
  const card=document.createElement('button');card.type='button';card.className='asset-card';card.dataset.kind=asset.kind||'object';
  const copy=document.createElement('div'),name=document.createElement('b'),type=document.createElement('span'),note=document.createElement('small');
  name.textContent=asset.label;type.textContent=asset.id;note.textContent=asset.note;
  copy.append(name,type,note);card.append(makePreview(asset),copy);
  card.onclick=()=>asset.kind==='background'?setBackground(asset.id):addAsset(asset);
  list.append(card);
 }
}

function setBackground(assetId){
 state.background=assetId;delete state.backgroundParams;state.backgroundSeed=(state.backgroundSeed+17)>>>0;drawScene();
}
function addAsset(asset){
 if(state.items.length>=150){$('#sceneMessage').textContent='最多放置 150 个物件';return}
 while(state.items.some(i=>i.id==='instance-'+state.nextId))state.nextId++;
 const n=state.items.length;
 const item={assetId:asset.id,id:'instance-'+state.nextId++,x:192+((n*29)%80)-40,y:215+((n*37)%90)-45,a:0,scale:1,seed:(57+n*31)>>>0,z:20+n};
 state.items.push(item);state.selected=item.id;drawScene();
}

function selectedItem(){return state.items.find(i=>i.id===state.selected)||null}
function updateInspector(){
 const item=selectedItem(),empty=$('#emptyInspector'),panel=$('#selectedInspector');
 empty.hidden=!!item;panel.hidden=!item;if(!item)return;
 const asset=ASSET_BY_ID.get(item.assetId);
 $('#selectedLabel').textContent=asset?.label||item.assetId;$('#selectedId').textContent=item.id+' / '+item.assetId;
 $('#selectedType').textContent=asset?.category||'—';$('#selectedPosition').textContent=`${Math.round(item.x)}, ${Math.round(item.y)}`;
 $('#selectedSeed').textContent=String(item.seed>>>0);$('#selectedScale').textContent=item.scale.toFixed(2);
 $('#selectedAngle').textContent=(item.a||0).toFixed(2)+' rad';$('#selectedFlip').textContent=item.flipX?'HORIZONTAL':'OFF';$('#selectedZ').textContent=String(item.z||0);
}

function canvasPoint(event){
 const r=scene.getBoundingClientRect();
 return {x:(event.clientX-r.left)*scene.width/r.width,y:(event.clientY-r.top)*scene.height/r.height};
}
function hitTest(point){
 return [...state.items].sort((a,b)=>(b.z||0)-(a.z||0)).find(item=>{
  const asset=ASSET_BY_ID.get(item.assetId),r=Math.max(8,(asset?.radius||24)*item.scale);
  return Math.hypot(point.x-item.x,point.y-item.y)<=r;
 })||null;
}
scene.addEventListener('pointerdown',event=>{
 const p=canvasPoint(event);
 if(referenceHit(p)){
  state.selected=null;drag={kind:'specimen',dx:p.x-reference.x,dy:p.y-reference.y};
  scene.setPointerCapture(event.pointerId);
 }else{
  const item=hitTest(p);state.selected=item?.id||null;
  if(item){drag={kind:'asset',id:item.id,dx:p.x-item.x,dy:p.y-item.y};scene.setPointerCapture(event.pointerId)}
 }
 $('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;drawScene();
});
scene.addEventListener('pointermove',event=>{
 const p=canvasPoint(event);$('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;
 if(!drag)return;
 if(drag.kind==='specimen'){
  reference.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));
  reference.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));
  drawScene();return;
 }
 const item=state.items.find(i=>i.id===drag.id);if(!item)return;
 item.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));item.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));drawScene();
});
scene.addEventListener('pointerup',()=>drag=null);scene.addEventListener('pointercancel',()=>drag=null);
scene.addEventListener('pointerleave',()=>{if(!drag)$('#pointerReadout').textContent='—'});

for(const button of document.querySelectorAll('[data-category]'))button.onclick=()=>{
 category=button.dataset.category;
 for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(b===button));
 renderAssetList();
};

$('#resetScene').onclick=()=>loadPreset(currentPreset);
for(const button of document.querySelectorAll('[data-preset]'))button.onclick=()=>loadPreset(button.dataset.preset);
$('#clearScene').onclick=()=>{state.items=[];state.selected=null;drawScene()};

$('#referenceSpecies').onchange=event=>{reference.species=event.target.value;reference.seed=(reference.seed+31)>>>0;drawScene()};
$('#referenceStage').onchange=event=>{reference.stage=event.target.value;drawScene()};
$('#toggleReference').onclick=event=>{
 reference.visible=!reference.visible;
 event.currentTarget.setAttribute('aria-pressed',String(reference.visible));
 event.currentTarget.textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
 drawScene();
};

document.querySelector('.control-grid').addEventListener('click',event=>{
 const button=event.target.closest('button[data-action]'),item=selectedItem();if(!button||!item)return;
 const action=button.dataset.action;
 if(action==='rotate-left')item.a=(item.a||0)-Math.PI/12;
 if(action==='rotate-right')item.a=(item.a||0)+Math.PI/12;
 if(action==='scale-down')item.scale=Math.max(.45,item.scale-.1);
 if(action==='scale-up')item.scale=Math.min(1.8,item.scale+.1);
 if(action==='back')item.z=(item.z||0)-1;
 if(action==='front')item.z=(item.z||0)+1;
 if(action==='flip-horizontal'){if(item.flipX)delete item.flipX;else item.flipX=true}
 if(action==='reroll')item.seed=(item.seed+97)>>>0;
 if(action==='delete'){state.items=state.items.filter(i=>i.id!==item.id);state.selected=null}
 drawScene();
});

renderAssetList();drawScene();

const sceneText=$('#sceneText'),message=$('#sceneMessage');
const snapshot=()=>exportScene(state,reference,ASSET_BY_ID);
async function copy(text){
 sceneText.value=text;
 try{await navigator.clipboard.writeText(text);message.textContent='已复制场景'}
 catch{sceneText.focus();sceneText.select();message.textContent='请复制下方已选中的场景文本'}
}
$('#copyScene').onclick=()=>copy(JSON.stringify(snapshot(),null,2));
$('#copyShare').onclick=()=>copy(shareCode(snapshot()));
$('#downloadScene').onclick=()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='habitat-layout.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='已下载场景';
};
function restore(text){
 try{
  const imported=importScene(text.trim(),ASSET_BY_ID,reference);
  if(!SPECIES.some(p=>p.id===imported.reference.species))throw new Error('未知标本种类');
  state=imported.state;Object.assign(reference,imported.reference);drag=null;
  $('#referenceSpecies').value=reference.species;$('#referenceStage').value=reference.stage;
  $('#toggleReference').setAttribute('aria-pressed',String(reference.visible));
  $('#toggleReference').textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
  drawScene();message.textContent='已精确还原 '+state.items.length+' 个物件';
 }catch(error){message.textContent=error.message}
}
$('#importScene').onclick=()=>restore(sceneText.value);
$('#sceneFile').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 if(file.size>1000000){message.textContent='场景文件过大';return}
 sceneText.value=await file.text();restore(sceneText.value);event.target.value='';
};
