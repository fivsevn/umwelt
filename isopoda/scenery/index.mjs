import {drawSubstrate} from './substrate.mjs';
import {drawLeaf,LEAF_PALETTES} from './leaf.mjs';
import {drawMossPatch} from './moss.mjs';
import {drawBark} from './bark.mjs';
import {drawCuttlebone} from './cuttlebone.mjs';
import {drawTwig,drawWoodChip} from './debris.mjs';

export {drawSubstrate,drawLeaf,LEAF_PALETTES,drawMossPatch,drawBark,drawCuttlebone,drawTwig,drawWoodChip};

export const BASE_SCENE=[
 {type:'moss',id:'moss-upper',x:78,y:92,rx:82,ry:62,seed:3,alpha:.70,z:10},
 {type:'moss',id:'moss-lower',x:54,y:348,rx:48,ry:32,seed:11,alpha:.66,z:10},

 {type:'leaf',id:'leaf-top-right',x:312,y:94,a:-.58,variant:2,scale:1.02,tone:2,seed:17,z:24},
 {type:'leaf',id:'leaf-bottom-left',x:125,y:337,a:-2.48,variant:4,scale:.88,tone:1,seed:19,z:24},
 {type:'leaf',id:'leaf-bottom-right',x:307,y:354,a:.52,variant:3,scale:.82,tone:0,seed:23,z:24},
 {type:'leaf',id:'leaf-mid-left',x:78,y:198,a:.24,variant:5,scale:.60,tone:3,seed:29,z:23},
 {type:'leaf',id:'leaf-top-mid',x:230,y:67,a:2.55,variant:1,scale:.52,tone:1,seed:31,z:23},
 {type:'leaf',id:'leaf-right-mid',x:337,y:246,a:2.18,variant:0,scale:.58,tone:0,seed:37,z:23},

 {type:'twig',id:'twig-a',x:116,y:290,a:-.52,length:24,seed:41,z:18},
 {type:'twig',id:'twig-b',x:315,y:76,a:2.35,length:19,seed:43,z:18},
 {type:'chip',id:'chip-a',x:146,y:250,a:.50,variant:0,scale:.64,seed:47,z:20},
 {type:'chip',id:'chip-b',x:330,y:130,a:-.32,variant:1,scale:.58,seed:53,z:20},

 {type:'bark',id:'shelter',x:192,y:216,a:-.08,variant:0,scale:1.08,seed:57,z:30},
 {type:'bark',id:'bark-under',x:150,y:249,a:.10,variant:1,scale:.72,seed:61,z:29},

 {type:'cuttlebone',id:'cuttlebone',x:334,y:168,a:-.42,scale:.72,seed:67,z:33}
];

export function drawSceneElement(ctx,item,{shelterLift=0,wetness=.65}={}){
 if(item.type==='moss')return drawMossPatch(ctx,{...item,wetness});
 if(item.type==='leaf')return drawLeaf(ctx,item);
 if(item.type==='bark')return drawBark(ctx,{...item,lift:item.id==='shelter'?shelterLift:0});
 if(item.type==='cuttlebone')return drawCuttlebone(ctx,item);
 if(item.type==='twig')return drawTwig(ctx,item);
 if(item.type==='chip')return drawWoodChip(ctx,item);
}

export function drawBaseScene(ctx,{wetZones=[],light=100,shelterLift=0,seed=57}={}){
 drawSubstrate(ctx,{wetZones,light,seed});
 const wetness=Math.max(.25,Math.min(1,(wetZones[0]?.moisture||60)/100));
 for(const item of [...BASE_SCENE].sort((a,b)=>(a.z||0)-(b.z||0)))drawSceneElement(ctx,item,{shelterLift,wetness});
}
