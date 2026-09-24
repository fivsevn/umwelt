import {exportScene,importScene,shareCode} from './scene-codec.mjs';
import {drawSubstrate,drawLeaf,drawMossPatch,drawBark,drawStone,drawCuttlebone,drawTwig,drawWoodChip,drawSceneDetail,LEGACY_BASE_SCENE,DEFAULT_LAYOUT} from './scenery/index.mjs';
import {drawAquaticBackground,drawAquaticPlant,drawAquaticDetail,AQUATIC_BACKDROPS} from './scenery/aquatic.mjs';
import {sceneActorPixels} from './habitat.mjs';
import {habitatConfig,eligibleSpecies} from './habitats.mjs';
import {SCENE_LAYOUTS} from './scenery/authored-layouts.mjs';
import {SPECIES,speciesById} from './species-registry.mjs';
import {renderModel,pixelAnatomy} from './sprites.mjs';

const $=s=>document.querySelector(s);
const scene=$('#scene'),ctx=scene.getContext('2d');ctx.imageSmoothingEnabled=false;

const reference={
 species:'dairy',stage:'M',x:226,y:286,a:-.34,seed:189,visible:true
};
let referenceHitCells=[];

for(const p of SPECIES){
 const option=new Option(`${p.label||p.name||p.id} · ${p.taxon||p.id}${p.game?.referenceOnly?' · 参考标本':''}`,p.id);
 $('#referenceSpecies').append(option);
}
$('#referenceSpecies').value=reference.species;
$('#referenceStage').value=reference.stage;

const ASSETS=[
 {id:'substrate-dry',category:'substrate',kind:'background',scenes:['forest'],label:'Dry substrate',note:'基质 / 干燥',params:{wetZones:[],light:82}},
 {id:'substrate-wet-left',category:'substrate',kind:'background',scenes:['forest'],label:'Moisture gradient',note:'基质 / 左侧湿区',params:{wetZones:[{x:44,y:215,rx:92,ry:250,moisture:78}],light:82}},
 {id:'substrate-forest',category:'substrate',kind:'background',scenes:['forest'],label:'Forest floor',note:'基质 / 林地湿润斑块',params:{wetZones:[{x:60,y:120,rx:115,ry:170,moisture:74},{x:320,y:300,rx:90,ry:115,moisture:58}],light:76}},

 {id:'water-freshwater',category:'water',kind:'background',scenes:['freshwater'],label:'Freshwater pool',note:'淡水 / 深绿腐殖底',params:{aquatic:true,kind:'freshwater',palette:AQUATIC_BACKDROPS.freshwater.palette}},
 {id:'water-groundwater',category:'water',kind:'background',scenes:['groundwater'],label:'Limestone groundwater',note:'地下水 / 石灰岩洞穴',params:{aquatic:true,kind:'groundwater',palette:AQUATIC_BACKDROPS.groundwater.palette}},
 {id:'water-intertidal',category:'water',kind:'background',scenes:['intertidal'],label:'Intertidal pool',note:'潮间带 / 岩池底',params:{aquatic:true,kind:'intertidal',palette:AQUATIC_BACKDROPS.intertidal.palette}},
 {id:'water-sandy-surf',category:'water',kind:'background',scenes:['sandy-surf'],label:'Sandy surf zone',note:'沙滩 / 干沙·湿沙·浅水',params:{aquatic:true,kind:'sandy-surf',palette:AQUATIC_BACKDROPS['sandy-surf'].palette}},
 {id:'water-estuary',category:'water',kind:'background',scenes:['estuary'],label:'Brackish estuary',note:'河口 / 潮沟泥滩',params:{aquatic:true,kind:'estuary',palette:AQUATIC_BACKDROPS.estuary.palette}},
 {id:'saltmarsh-tuft-01',category:'aquatic',scenes:['estuary'],label:'Saltmarsh grass 01',note:'河口 / 盐沼草丛',radius:40,params:{kind:'saltmarsh',height:54,flow:34}},
 {id:'saltmarsh-tuft-02',category:'aquatic',scenes:['estuary'],label:'Saltmarsh grass 02',note:'河口 / 高株盐沼草',radius:48,params:{kind:'saltmarsh',height:72,flow:38}},
 {id:'tidal-runnel-01',category:'water',scenes:['estuary'],label:'Tidal runnel',note:'河口 / 细潮沟',radius:52,params:{labDetail:'tidal-runnel'}},
 {id:'mud-burrows-01',category:'debris',scenes:['estuary'],label:'Mud burrows',note:'河口 / 泥孔与泥丸',radius:34,params:{labDetail:'mud-burrows'}},
 {id:'wrack-line-01',category:'debris',scenes:['estuary','sandy-surf'],label:'Wrack line',note:'河口 / 漂积植物碎屑',radius:48,params:{labDetail:'wrack-line'}},
 {id:'estuary-silt-01',category:'debris',scenes:['estuary'],label:'Estuary silt',note:'河口 / 黄褐细泥',radius:42,params:{labDetail:'estuary-silt'}},
 {id:'water-shallow-marine',category:'water',kind:'background',scenes:['shallow-marine'],label:'Shallow seaweed bed',note:'浅海 / 藻场底',params:{aquatic:true,kind:'shallow-marine',palette:AQUATIC_BACKDROPS['shallow-marine'].palette}},
 {id:'water-abyssal',category:'water',kind:'background',scenes:['abyssal'],label:'Abyssal plain',note:'深海 / 深渊沉积平原',params:{aquatic:true,kind:'abyssal',palette:['#10181b','#172225','#223033','#343d3f']}},
 {id:'water-petri-dish',category:'water',kind:'background',scenes:['petri-dish'],label:"Asimov's dish",note:'特殊 / 培养皿与实验台',params:{aquatic:true,kind:'petri-dish',palette:AQUATIC_BACKDROPS['petri-dish'].palette}},

 {id:'limestone-shelf-01',category:'stone',scenes:['groundwater'],label:'Limestone shelf',note:'洞穴 / 石灰岩台地',radius:52,params:{labDetail:'limestone-shelf'}},
 {id:'flowstone-01',category:'stone',scenes:['groundwater'],label:'Flowstone',note:'洞穴 / 流石与方解石脊',radius:46,params:{labDetail:'flowstone'}},
 {id:'seep-film-01',category:'water',scenes:['groundwater'],label:'Seep film',note:'洞穴 / 薄层渗流水',radius:48,params:{labDetail:'seep-film'}},
 {id:'cave-silt-01',category:'debris',scenes:['groundwater'],label:'Cave silt',note:'洞穴 / 细泥沉积',radius:36,params:{labDetail:'cave-silt'}},
 {id:'sand-ripple-01',category:'debris',scenes:['sandy-surf'],label:'Sand ripple',note:'沙滩 / 平行砂纹',radius:50,params:{labDetail:'sand-ripple'}},
 {id:'foam-trace-01',category:'water',scenes:['sandy-surf'],label:'Foam trace',note:'沙滩 / 破碎泡沫线',radius:50,params:{labDetail:'foam-trace'}},
 {id:'dish-sediment-01',category:'debris',scenes:['petri-dish'],label:'Dish sediment',note:'培养皿 / 微粒沉积',radius:32,params:{labDetail:'dish-sediment'}},
 {id:'dish-bubbles-01',category:'water',scenes:['petri-dish'],label:'Trapped bubbles',note:'培养皿 / 附壁微气泡',radius:28,params:{labDetail:'dish-bubbles'}},
 {id:'dish-floc-01',category:'debris',scenes:['petri-dish'],label:'Sample floc',note:'培养皿 / 样本絮团',radius:28,params:{labDetail:'dish-floc'}},
 {id:'glass-scratch-01',category:'debris',scenes:['petri-dish'],label:'Glass scratch',note:'培养皿 / 玻璃细划痕',radius:40,params:{labDetail:'glass-scratch'}},

 {id:'waterweed-tuft-01',category:'aquatic',scenes:['freshwater'],label:'Waterweed 01',note:'淡水水草 / 对生叶',radius:42,params:{kind:'waterweed',height:58,flow:36}},
 {id:'waterweed-tuft-02',category:'aquatic',scenes:['freshwater'],label:'Waterweed 02',note:'淡水水草 / 高株',radius:52,params:{kind:'waterweed',height:78,flow:42}},
 {id:'freshwater-detritus-01',category:'debris',scenes:['freshwater'],label:'Detritus mat',note:'淡水腐殖池 / 腐殖碎屑',radius:34,params:{detail:'detritus',count:13}},
 {id:'rockweed-tuft-01',category:'aquatic',scenes:['intertidal'],label:'Rockweed 01',note:'潮间带褐藻 / 短簇',radius:40,params:{kind:'rockweed',height:42,flow:58}},
 {id:'rockweed-tuft-02',category:'aquatic',scenes:['intertidal'],label:'Rockweed 02',note:'潮间带褐藻 / 高簇',radius:48,params:{kind:'rockweed',height:58,flow:64}},
 {id:'barnacle-cluster-01',category:'aquatic',scenes:['intertidal'],label:'Barnacle cluster',note:'潮间带 / 藤壶附着群',radius:34,params:{detail:'barnacle',count:12}},
 {id:'limpet-cluster-01',category:'aquatic',scenes:['intertidal'],label:'Limpet cluster',note:'潮间带 / 帽贝附着群',radius:30,params:{detail:'limpet',count:7}},
 {id:'seagrass-tuft-01',category:'aquatic',scenes:['shallow-marine','estuary'],label:'Seagrass 01',note:'浅海草丛 / 河口下游细叶',radius:36,params:{kind:'seagrass',height:46,flow:44}},
 {id:'ulva-clump-01',category:'aquatic',scenes:['shallow-marine','estuary'],label:'Sea lettuce',note:'浅海 / 河口下游石莼',radius:34,params:{kind:'ulva',height:38,flow:42}},
 {id:'kelp-frond-01',category:'aquatic',scenes:['shallow-marine'],label:'Kelp frond 01',note:'海带 / 交错宽叶',radius:64,params:{kind:'kelp',height:92,flow:46}},
 {id:'kelp-frond-02',category:'aquatic',scenes:['shallow-marine'],label:'Kelp frond 02',note:'海带 / 长株',radius:76,params:{kind:'kelp',height:118,flow:52}},
 {id:'shell-grit-01',category:'debris',scenes:['intertidal','shallow-marine','estuary','sandy-surf'],label:'Shell grit',note:'海岸 / 河口下游贝壳碎屑',radius:32,params:{detail:'shellgrit',count:18}},

 {id:'root-tangle-01',category:'debris',scenes:['forest','freshwater'],label:'Root tangle',note:'细根 / 缠结根须',radius:44,params:{labDetail:'root-tangle'}},
 {id:'leaf-skeleton-01',category:'leaf',scenes:['forest','freshwater'],label:'Leaf skeleton',note:'半腐叶 / 裸露叶脉',radius:34,params:{labDetail:'leaf-skeleton'}},
 {id:'mycelium-patch-01',category:'moss',scenes:['forest'],label:'Mycelium patch',note:'菌丝 / 淡色腐殖斑',radius:34,params:{labDetail:'mycelium'}},
 {id:'humus-clump-01',category:'debris',scenes:['forest'],label:'Humus clump',note:'腐殖团 / 深色有机碎屑',radius:30,params:{labDetail:'humus'}},
 {id:'silt-pocket-01',category:'debris',scenes:['freshwater'],label:'Silt pocket',note:'细泥 / 浅水沉积',radius:38,params:{labDetail:'silt'}},
 {id:'rock-crack-01',category:'stone',scenes:['intertidal'],label:'Rock crack',note:'潮间带 / 岩面裂隙',radius:34,params:{labDetail:'rock-crack'}},
 {id:'algae-film-01',category:'aquatic',scenes:['intertidal'],label:'Algae film',note:'潮间带 / 岩面藻膜',radius:38,params:{labDetail:'algae-film'}},
 {id:'shell-fragment-01',category:'debris',scenes:['intertidal','shallow-marine','abyssal','sandy-surf'],label:'Shell fragment',note:'海底 / 大块贝壳残片',radius:28,params:{labDetail:'shell-fragment'}},
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

// Retain legacy asset IDs so previously exported layouts remain importable.
for(const item of LEGACY_BASE_SCENE){
 const assetId='game-'+item.id;
 const category=item.type==='cuttlebone'?'calcium':['twig','chip'].includes(item.type)?'debris':item.type;
 const {x,y,a,seed,z,...params}=item;
 const asset={id:assetId,category,label:item.id,note:'正式场景',radius:item.type==='bark'?90:item.type==='moss'?item.rx:45,params};
 ASSET_BY_ID.set(assetId,asset);
}

let state={background:'substrate-wet-left',backgroundSeed:57,items:[],selected:null,nextId:1};
let category='all',drag=null,currentPreset='forest';

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
 if(kind==='mycelium'||kind==='humus'||kind==='silt'||kind==='abyssal-silt'||kind==='estuary-silt')return {alpha:.055,dy:1};
 if(kind==='tidal-runnel')return {alpha:0,dy:0};
 if(kind==='mud-burrows'||kind==='wrack-line')return {alpha:.07,dy:1};
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
 if(kind==='humus'||kind==='silt'||kind==='abyssal-silt'||kind==='estuary-silt'){
  const colors=kind==='humus'?['#29261f','#3a3327','#514634']:kind==='silt'?['#314039','#435046','#5a5d4b']:kind==='estuary-silt'?['#47483a','#5d5a44','#777057']:['#182326','#243033','#354043'];
  for(let i=0;i<26;i++){
   const n=labNoise(i,53,seed),u=-25+(n%51),v=-14+((n>>>8)%29),w=1+(n%5);
   labLocalPixel(g,o,u,v,w,1,colors[i%colors.length]);
   if(i%7===0)labLocalPixel(g,o,u+1,v-1,1,1,colors[2]);
  }
  return;
 }
 if(kind==='tidal-runnel'){
  const dark='#263b38',mid='#36544e',edge='#77715a',glint='#8d9475';
  labLocalLine(g,o,-48,-3,-24,4,11,dark);labLocalLine(g,o,-24,4,2,-2,13,dark);labLocalLine(g,o,2,-2,28,6,11,dark);labLocalLine(g,o,28,6,48,1,9,dark);
  labLocalLine(g,o,-47,-3,-24,4,5,mid);labLocalLine(g,o,-24,4,2,-2,7,mid);labLocalLine(g,o,2,-2,28,6,5,mid);labLocalLine(g,o,28,6,47,1,4,mid);
  for(let i=0;i<8;i++){const u=-42+i*12,v=Math.sin(i*.9+seed)*5;labLocalPixel(g,o,u,v-8,6,1,edge);if(i%2===0)labLocalPixel(g,o,u+3,v-1,5,1,glint)}
  return;
 }
 if(kind==='mud-burrows'){
  const mud='#625f49',rim='#8b8061',hole='#293631';
  for(let i=0;i<9;i++){const n=labNoise(i,131,seed),u=-24+(n%49),v=-14+((n>>>8)%29),r=2+(n%3);labLocalPixel(g,o,u-r,v-r,2*r+2,2*r+1,mud);labLocalPixel(g,o,u-r+1,v-r,Math.max(2,2*r),1,rim);labLocalPixel(g,o,u-1,v-1,3,3,hole);if(i%3===0)labLocalPixel(g,o,u+r+2,v,2,1,rim)}
  return;
 }
 if(kind==='wrack-line'){
  const dark='#3a392b',mid='#5a5739',olive='#747047',pale='#8f8560';
  for(let i=0;i<11;i++){const n=labNoise(i,137,seed),u=-36+(n%73),v=-8+((n>>>9)%17),len=8+((n>>>15)%18),side=n&1?1:-1;labLocalLine(g,o,u,v,u+side*len,v+((n>>>21)%9)-4,1,i%3===0?dark:mid);if(i%2===0)labLocalPixel(g,o,u+side*Math.floor(len*.55),v-1,4,2,olive);if(i%4===0)labLocalPixel(g,o,u-side*3,v+2,2,1,pale)}
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

function syncControls(){
 $('#referenceSpecies').value=reference.species;$('#referenceStage').value=reference.stage;
 $('#toggleReference').setAttribute('aria-pressed',String(reference.visible));
 $('#toggleReference').textContent='GAME SCALE · '+(reference.visible?'ON':'OFF');
 for(const button of document.querySelectorAll('[data-preset]'))button.setAttribute('aria-pressed',String(button.dataset.preset===currentPreset));
 for(const button of document.querySelectorAll('[data-category]')){
  const available=button.dataset.category==='all'||ASSETS.some(asset=>assetAvailableInPreset(asset)&&asset.category===button.dataset.category);
  button.disabled=!available;
 }
 if(!ASSETS.some(asset=>assetAvailableInPreset(asset)&&asset.category===category))category='all';
 for(const button of document.querySelectorAll('[data-category]'))button.setAttribute('aria-pressed',String(button.dataset.category===category));
 renderAssetList();
}
function presetForBackground(background){return ASSET_BY_ID.get(background)?.scenes?.[0]||'forest'}
function loadPreset(id){
 currentPreset=id;
 const layout=SCENE_LAYOUTS[id]||DEFAULT_LAYOUT;
 const imported=importScene(JSON.stringify(layout),ASSET_BY_ID,reference);
 state=imported.state;Object.assign(reference,imported.reference);drag=null;
 const habitat=habitatConfig(id==='forest'?'terrestrial':id);
 const specimen=speciesById(reference.species);
 if(specimen.game?.referenceOnly||!eligibleSpecies(specimen,habitat.id)){
  reference.species=SPECIES.find(p=>!p.game?.referenceOnly&&eligibleSpecies(p,habitat.id)).id;
  if(habitat.dialogue)reference.stage='L';
 }
 syncControls();drawScene();
}

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
 if(p.labDetail)return drawSceneDetail(target,{...p,kind:p.labDetail,x,y,a,seed,scale:mult});
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
 const species=speciesById(reference.species);
 const size=species.renderSize?.referenceMm;
 $('#specimenReadout').textContent=`${species.label||species.name||species.id} · ${reference.stage} · ${reference.visible?'当前环境游戏比例':'参考标本已隐藏'}${Number.isFinite(size)?` · ref ${size.toFixed(size<2?1:0)} mm`:''}`;
 if(!reference.visible)return;
 const model=renderModel(species.visual,{stage:reference.stage,seed:reference.seed});
 const source=new Map();
 for(const module of pixelAnatomy(model,{posture:'normal',phase:0,moving:false}))
  for(const [x,y,color] of module.cells)source.set(x+','+y,color);
 const habitat=habitatConfig(currentPreset==='forest'?'terrestrial':currentPreset);
 referenceHitCells=sceneActorPixels(source,{...reference,model,habitatScale:habitat.actorScale||1});
 for(const [x,y,color] of referenceHitCells){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}
}

function referenceHit(point){
 return reference.visible&&referenceHitCells.some(([x,y])=>point.x>=x-3&&point.x<=x+4&&point.y>=y-3&&point.y<=y+4);
}

const hitCanvas=document.createElement('canvas');hitCanvas.width=scene.width;hitCanvas.height=scene.height;
const hitContext=hitCanvas.getContext('2d',{willReadFrequently:true});
let objectHits=[];
let hitCache=new Map();
function drawScene(){
 ctx.clearRect(0,0,scene.width,scene.height);
 drawBackground(ctx);
 const ordered=[...state.items].sort((a,b)=>(a.z||0)-(b.z||0));
 objectHits=[];
 const nextHitCache=new Map();
 for(const item of ordered){
  const asset=ASSET_BY_ID.get(item.assetId);if(!asset)continue;
  drawObject(ctx,asset,item);
  const key=JSON.stringify(item),cached=hitCache.get(item.id);
  let mask=cached?.key===key?cached.mask:null;
  if(!mask){
   hitContext.clearRect(0,0,scene.width,scene.height);drawObject(hitContext,asset,item);
   const rgba=hitContext.getImageData(0,0,scene.width,scene.height).data;
   mask=new Uint8Array(scene.width*scene.height);
   for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3]>32?1:0;
  }
  nextHitCache.set(item.id,{key,mask});objectHits.push({id:item.id,mask});
 }
 hitCache=nextHitCache;
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
 const r=scene.getBoundingClientRect(),style=getComputedStyle(scene);
 const left=parseFloat(style.borderLeftWidth)||0,top=parseFloat(style.borderTopWidth)||0;
 return {x:(event.clientX-r.left-left)*scene.width/(r.width-left-(parseFloat(style.borderRightWidth)||0)),y:(event.clientY-r.top-top)*scene.height/(r.height-top-(parseFloat(style.borderBottomWidth)||0))};
}
function hitTest(point){
 const x=Math.floor(point.x),y=Math.floor(point.y);
 if(x<0||y<0||x>=scene.width||y>=scene.height)return null;
 // Reverse the actual paint order, including ties in z.
 for(let i=objectHits.length-1;i>=0;i--)if(objectHits[i].mask[y*scene.width+x])return state.items.find(item=>item.id===objectHits[i].id);
 return null;
}
scene.addEventListener('pointerdown',event=>{
 if(event.button!==0||drag)return;
 const p=canvasPoint(event);
 if(referenceHit(p)){
  state.selected=null;drag={pointerId:event.pointerId,kind:'specimen',dx:p.x-reference.x,dy:p.y-reference.y};
  scene.setPointerCapture(event.pointerId);
 }else{
  const item=hitTest(p);state.selected=item?.id||null;
  if(item){drag={pointerId:event.pointerId,kind:'asset',id:item.id,dx:p.x-item.x,dy:p.y-item.y};scene.setPointerCapture(event.pointerId)}
 }
 $('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;drawScene();
});
scene.addEventListener('pointermove',event=>{
 const p=canvasPoint(event);$('#pointerReadout').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;
 if(!drag||drag.pointerId!==event.pointerId)return;
 if(drag.kind==='specimen'){
  reference.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));
  reference.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));
  drawScene();return;
 }
 const item=state.items.find(i=>i.id===drag.id);if(!item)return;
 item.x=Math.max(0,Math.min(scene.width,p.x-drag.dx));item.y=Math.max(0,Math.min(scene.height,p.y-drag.dy));drawScene();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])scene.addEventListener(type,event=>{if(drag?.pointerId===event.pointerId)drag=null});
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
 if(action==='scale-down')item.scale=Math.max(.05,Math.round((item.scale-.1)*100)/100);
 if(action==='scale-up')item.scale=Math.min(4,Math.round((item.scale+.1)*100)/100);
 if(action==='back')item.z=Math.max(-10000,Math.min(...state.items.map(i=>i.z||0))-1);
 if(action==='front')item.z=Math.min(10000,Math.max(...state.items.map(i=>i.z||0))+1);
 if(action==='flip-horizontal'){if(item.flipX)delete item.flipX;else item.flipX=true}
 if(action==='reroll')item.seed=(item.seed+97)>>>0;
 if(action==='delete'){state.items=state.items.filter(i=>i.id!==item.id);state.selected=null}
 drawScene();
});

loadPreset('forest');

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
 const previous={state,reference:{...reference},currentPreset,category};
 try{
  const imported=importScene(text.trim(),ASSET_BY_ID,reference);
  if(!SPECIES.some(p=>p.id===imported.reference.species))throw new Error('未知标本种类');
  state=imported.state;Object.assign(reference,imported.reference);drag=null;
  currentPreset=presetForBackground(state.background);
  drawScene();syncControls();message.textContent='已精确还原 '+state.items.length+' 个物件';
 }catch(error){
  state=previous.state;Object.assign(reference,previous.reference);currentPreset=previous.currentPreset;category=previous.category;drag=null;
  drawScene();syncControls();message.textContent='未导入，原布局已保留：'+error.message;
 }
}
$('#importScene').onclick=()=>restore(sceneText.value);
$('#sceneFile').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 try{
  if(file.size>1000000){message.textContent='场景文件过大';return}
  sceneText.value=await file.text();restore(sceneText.value);
 }catch{message.textContent='无法读取文件，原布局已保留'}
 finally{event.target.value=''}
};
