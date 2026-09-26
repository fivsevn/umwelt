import {shoreLayout,drawShoreWater} from './scenery/estuary-shore.mjs';
import {drawBaseScene,drawLeaf,DEFAULT_LAYOUT,drawLayoutScene,layoutForHabitat} from './scenery/index.mjs';
import {drawAquaticWater} from './scenery/aquatic.mjs';
import {habitatConfig} from './habitats.mjs';
import {freshwaterLayout} from './scenery/freshwater-stages.mjs';

const canvas=document.querySelector('#emptyHabitat');
if(canvas){
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem('isopoda-fugue-v4')||'null')}catch{}

 const requestedHabitat=typeof saved?.habitatId==='string'?saved.habitatId:'terrestrial';
 const config=habitatConfig(requestedHabitat),habitatId=config.id;
 const savedEnvironment=saved?.environment&&typeof saved.environment==='object'?saved.environment:null;
 const defaultLeaves=[];
 const foodAmount=Number.isFinite(Number(saved?.food))?Number(saved.food):1;
 const memory={
  wetZones:Array.isArray(savedEnvironment?.wetZones)?savedEnvironment.wetZones:DEFAULT_LAYOUT.background.params.wetZones,
  leaves:Array.isArray(savedEnvironment?.leaves)?savedEnvironment.leaves:defaultLeaves,
  foodNodes:Array.isArray(savedEnvironment?.foodNodes)?savedEnvironment.foodNodes:(foodAmount?[{x:320,y:258,amount:foodAmount,age:0}]:[]),
  scuffs:Array.isArray(savedEnvironment?.scuffs)?savedEnvironment.scuffs:[]
 };

 const previewState={habitatId,seed:Number.isFinite(Number(saved?.seed))?Number(saved.seed):4107,scene:saved?.scene||null,records:Array.isArray(saved?.records)?saved.records:[],...config.defaults};
 // The selector shows the suspended layout; it never changes a saved run.
 if(habitatId==='freshwater')previewState.scene={materialStage:3};
 for(const key of Object.keys(config.defaults)){
  const value=Number(saved?.[key]);
  if(Number.isFinite(value))previewState[key]=value;
 }
 const light=Number.isFinite(Number(saved?.light))?Number(saved.light):Number(previewState.light??54);

 const world=document.createElement('canvas');
 world.width=384;world.height=430;
 const ctx=world.getContext('2d');
 ctx.imageSmoothingEnabled=false;

 if(config.aquatic)drawLayoutScene(ctx,habitatId==='estuary'?shoreLayout():habitatId==='freshwater'?freshwaterLayout(previewState):layoutForHabitat(habitatId),{time:0});
 else drawBaseScene(ctx,{
  wetZones:memory.wetZones,
  light:DEFAULT_LAYOUT.background.params.light,
  shelterLift:0,
  seed:DEFAULT_LAYOUT.background.seed
 });

 const px=(x,y,w,h,color)=>{
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
 };
 for(const mark of memory.scuffs)for(let i=0;i<8;i++)px(mark.x-18+i*5,mark.y+i%2*2,3,1,'rgba(108,84,58,.55)');
 for(const leaf of memory.leaves){
  const hash=Math.abs(Math.round(leaf.x*17+leaf.y*31+leaf.a*100)),variant=hash%6,tone=(hash>>2)%4;
  const size=.68+(hash%6)*.055;
  drawLeaf(ctx,{x:leaf.x,y:leaf.y,a:leaf.a+((hash%7)-3)*.045,variant,scale:size,tone,gap:!!leaf.gap,age:leaf.age||0,seed:hash});
 }
 for(const food of memory.foodNodes){
  if(food.amount>0)for(let y=0;y<10;y+=2)for(let x=0;x<Math.min(20,8+food.amount*5);x+=2)
   px(food.x+x-8,food.y+y-5,2,2,y>6?'#80683f':'#c3a46b');
 }

 if(habitatId==='abyssal'){ctx.fillStyle='rgba(5,11,14,.10)';ctx.fillRect(0,0,world.width,world.height)}
 else if(light<55){ctx.fillStyle=`rgba(15,27,21,${(55-light)/120})`;ctx.fillRect(0,0,world.width,world.height)}

 ctx.strokeStyle='rgba(147,148,124,.55)';ctx.lineWidth=2;ctx.strokeRect(1,1,world.width-2,world.height-2);
 if(habitatId==='estuary')drawShoreWater(ctx,{habitatId:'estuary',shorePoint:1,records:[]},0,true);
 else if(config.aquatic)drawAquaticWater(ctx,previewState,0,{drawPlants:false});

 const rect=canvas.getBoundingClientRect();
 const cssWidth=rect.width||384,cssHeight=rect.height||430;
 const width=Math.max(80,Math.round(cssWidth)),height=Math.max(80,Math.round(cssHeight));
 const scale=Math.max(1,cssWidth/384),sw=cssWidth/scale,sh=cssHeight/scale;
 const x=Math.max(sw/2,Math.min(384-sw/2,192)),y=Math.max(sh/2,Math.min(430-sh/2,215));

 canvas.width=width;canvas.height=height;
 const display=canvas.getContext('2d');
 display.imageSmoothingEnabled=false;
 display.clearRect(0,0,width,height);
 display.drawImage(world,x-sw/2,y-sh/2,sw,sh,0,0,width,height);
 canvas.dataset.titlePreview='ready';
 canvas.dataset.previewHabitat=habitatId;

 const language=document.documentElement.dataset.uiLanguage||'zh';
 const languageIndex=language==='en'?1:language==='ja'?2:0;
 const title=document.querySelector('#titleCard .window-title span');
 if(title)title.textContent='ISOPODA / '+config.names[languageIndex];
}
