import {DEFAULT_LAYOUT,DEFAULT_SHELTER,sceneObjects} from './default-layout.mjs?v=authored-1';
export {DEFAULT_LAYOUT,DEFAULT_SHELTER,sceneObjects};
export {SCENE_LAYOUTS,layoutForHabitat} from './authored-layouts.mjs?v=authored-2';

import {drawStone} from './stone.mjs?v=forest-10';
import {drawSubstrate} from './substrate.mjs?v=forest-10';
import {drawLeaf,LEAF_PALETTES} from './leaf.mjs?v=forest-10';
import {drawMossPatch} from './moss.mjs?v=forest-10';
import {drawBark} from './bark.mjs?v=forest-11';
import {drawCuttlebone} from './cuttlebone.mjs?v=forest-10';
import {drawTwig,drawWoodChip} from './debris.mjs?v=forest-10';
import {drawAquaticBackground,drawAquaticPlant,drawAquaticDetail} from './aquatic.mjs?v=motion-2';
import {drawSceneDetail,withSoftWorldShadow} from './details.mjs?v=authored-1';

export {drawStone,drawSubstrate,drawLeaf,LEAF_PALETTES,drawMossPatch,drawBark,drawCuttlebone,drawTwig,drawWoodChip,drawAquaticBackground,drawAquaticPlant,drawAquaticDetail,drawSceneDetail};

export const LEGACY_BASE_SCENE=[
 {type:'moss',id:'moss-upper',x:18,y:104,rx:38,ry:110,seed:3,alpha:.70,z:10},
 {type:'moss',id:'moss-lower',x:24,y:356,rx:44,ry:69,seed:11,alpha:.66,z:10},
 {type:'moss',id:'moss-bottom-right',x:352,y:414,rx:42,ry:30,seed:87,alpha:.66,z:10},

 {type:'leaf',id:'leaf-top-right',x:312,y:94,a:-.58,variant:2,scale:1.12,tone:0,seed:17,z:24},
 {type:'leaf',id:'leaf-bottom-left',x:125,y:337,a:-2.48,variant:4,scale:1.04,tone:0,seed:19,z:24},
 {type:'leaf',id:'leaf-bottom-right',x:307,y:354,a:.52,variant:0,scale:1.12,tone:0,seed:23,z:24},
 {type:'leaf',id:'leaf-mid-left',x:78,y:198,a:.24,variant:5,scale:.60,tone:3,seed:29,z:23},
 {type:'leaf',id:'leaf-top-mid',x:230,y:67,a:2.55,variant:1,scale:.52,tone:1,seed:31,z:23},
 {type:'leaf',id:'leaf-right-mid',x:337,y:246,a:2.18,variant:0,scale:.58,tone:0,seed:37,z:23},

 {type:'bark',id:'bark-top-right',x:311,y:76,a:-.32,variant:2,scale:.76,seed:91,z:27},
 {type:'bark',id:'bark-bottom-left',x:112,y:340,a:.18,variant:1,scale:.72,seed:93,z:26},
 {type:'bark',id:'bark-bottom-right',x:316,y:365,a:-.46,variant:2,scale:.64,seed:95,z:26},

 {type:'moss',id:'moss-corner',x:333,y:409,rx:48,ry:32,seed:81,z:10},
 {type:'twig',id:'root',x:283,y:20,a:Math.PI/2,length:320,seed:83,z:15},
 {type:'twig',id:'twig-a',x:116,y:290,a:-.52,length:24,seed:41,z:18},
 {type:'twig',id:'twig-b',x:315,y:76,a:2.35,length:19,seed:43,z:18},
 {type:'chip',id:'chip-a',x:146,y:250,a:.50,variant:0,scale:.64,seed:47,z:20},
 {type:'chip',id:'chip-b',x:330,y:130,a:-.32,variant:1,scale:.58,seed:53,z:20},

 {type:'bark',id:'shelter',x:192,y:216,a:-.08,variant:0,scale:1.20,seed:57,z:30},
 {type:'bark',id:'bark-under',x:162,y:249,a:.10,variant:1,scale:.90,seed:61,z:29},

 {type:'stone',id:'stone-flat',x:302,y:300,variant:1,seed:71,z:21},
 {type:'stone',id:'stone-small',x:283,y:318,variant:3,seed:73,z:21},
 {type:'cuttlebone',id:'cuttlebone',x:334,y:168,a:-.42,scale:.72,seed:67,z:33}
];


export const BASE_SCENE=LEGACY_BASE_SCENE;
export const DEFAULT_SCENE=sceneObjects();

function drawSceneElementRaw(ctx,item,{shelterLift=0,time=0,motion=1}={}){
 if(item.type==='scene-detail')return drawSceneDetail(ctx,{...item,kind:item.labDetail});
 if(item.type==='aquatic-detail')return withSoftWorldShadow(ctx,{alpha:.065,dy:1},()=>drawAquaticDetail(ctx,{...item,kind:item.detail}));
 if(item.type==='aquatic')return withSoftWorldShadow(ctx,{alpha:.075,dy:2},()=>drawAquaticPlant(ctx,{...item,time,motion}));
 if(item.type==='moss')return drawMossPatch(ctx,item);
 if(item.type==='stone')return drawStone(ctx,item);
 if(item.type==='leaf')return drawLeaf(ctx,item);
 if(item.type==='bark')return drawBark(ctx,{...item,lift:item.id===DEFAULT_SHELTER?.id?shelterLift:0});
 if(item.type==='cuttlebone')return drawCuttlebone(ctx,item);
 if(item.type==='twig')return drawTwig(ctx,item);
 if(item.type==='chip')return drawWoodChip(ctx,item);
}
export function drawSceneElement(ctx,item,options={}){
 if(!item.flipX||typeof ctx.save!=='function'||typeof ctx.restore!=='function'||typeof ctx.translate!=='function'||typeof ctx.scale!=='function')return drawSceneElementRaw(ctx,item,options);
 const pivotX=Math.round(item.x||0);
 ctx.save();ctx.translate(pivotX*2,0);ctx.scale(-1,1);
 try{return drawSceneElementRaw(ctx,item,options)}finally{ctx.restore()}
}
export function isAnimatedSceneElement(item){
 return item.type==='aquatic'&&['waterweed','rockweed','seagrass','ulva','kelp'].includes(item.kind);
}
export function drawSceneBackground(ctx,layout=DEFAULT_LAYOUT,overrides={}){
 const bg=layout.background||{},p={...(bg.params||{}),...overrides},seed=overrides.seed??bg.seed??57;
 if(p.aquatic)return drawAquaticBackground(ctx,{kind:p.kind,palette:p.palette,seed});
 return drawSubstrate(ctx,{...p,seed});
}
export function drawLayoutScene(ctx,layout=DEFAULT_LAYOUT,{time=0,shelterLift=0,backgroundOverrides={}}={}){
 drawSceneBackground(ctx,layout,backgroundOverrides);
 for(const item of sceneObjects(layout).sort((a,b)=>(a.z||0)-(b.z||0)))drawSceneElement(ctx,item,{time,shelterLift});
}
export function drawBaseScene(ctx,{wetZones=DEFAULT_LAYOUT.background.params.wetZones,light=DEFAULT_LAYOUT.background.params.light,shelterLift=0,seed=DEFAULT_LAYOUT.background.seed}={}){
 drawSceneBackground(ctx,DEFAULT_LAYOUT,{wetZones,light,seed});
 for(const item of [...DEFAULT_SCENE].sort((a,b)=>(a.z||0)-(b.z||0)))drawSceneElement(ctx,item,{shelterLift});
}
