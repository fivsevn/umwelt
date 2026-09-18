import {drawBaseScene,drawLeaf,drawMossPatch,drawBark,drawCuttlebone,drawSubstrate} from './scenery/index.mjs?v=1';

const $=s=>document.querySelector(s);
function canvas(w=180,h=140){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tile(parent,label,draw,w=180,h=140){
 const wrap=document.createElement('div');wrap.className='tile';const c=canvas(w,h),caption=document.createElement('small');caption.textContent=label;wrap.append(c,caption);parent.append(wrap);const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;draw(ctx,c);return c;
}

{
 const c=$('#scene'),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
 drawBaseScene(ctx,{wetZones:[{x:48,y:210,rx:72,ry:210,moisture:70}],light:78,seed:57});
}

for(let i=0;i<6;i++)tile($('#leaves'),`variant ${i} · scale ${(.65+i*.08).toFixed(2)}`,(ctx,c)=>{
 drawSubstrate(ctx,{wetZones:[],light:80,seed:70+i});
 drawLeaf(ctx,{x:c.width/2,y:c.height/2,a:-.65+i*.28,variant:i,scale:.65+i*.08,tone:i%4,seed:100+i,gap:i%2===0});
});

tile($('#moss'),'upper wet patch',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[{x:70,y:70,rx:80,ry:65,moisture:78}],light:80,seed:10});drawMossPatch(ctx,{x:85,y:80,rx:75,ry:50,seed:3,wetness:.8,alpha:.72})});
tile($('#moss'),'lower smaller patch',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[{x:65,y:90,rx:60,ry:45,moisture:62}],light:80,seed:11});drawMossPatch(ctx,{x:80,y:88,rx:53,ry:32,seed:11,wetness:.62,alpha:.66})});

tile($('#bark'),'main shelter',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:20});drawBark(ctx,{x:90,y:70,a:-.08,scale:.82,variant:0,seed:57})});
tile($('#bark'),'secondary fragment',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:21});drawBark(ctx,{x:90,y:70,a:.10,scale:.78,variant:1,seed:61})});

tile($('#cuttlebone'),'calcium source',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:25});drawCuttlebone(ctx,{x:90,y:70,a:-.42,scale:1.15,seed:67})});

tile($('#substrate'),'dry',(ctx)=>drawSubstrate(ctx,{wetZones:[],light:82,seed:57}));
tile($('#substrate'),'moisture gradient',(ctx,c)=>drawSubstrate(ctx,{wetZones:[{x:35,y:c.height/2,rx:58,ry:120,moisture:80}],light:82,seed:57}));
