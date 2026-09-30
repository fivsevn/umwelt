// Furniture shares a small material palette, while gaps expose the roof beneath it.
export const FURNITURE=[
 ['tierstand','三层铁花架',48,38],['ladderstand','梯形木花架',38,48],['wallrack','窄高格花架',30,54],['plantcart','带轮花车',46,32],['pottingbench','带抽屉换盆台',60,38],['gardenbench','靠背长凳',58,32],['bistrotable','圆形铁桌',36,32],['foldingchair','折叠木椅',25,33],['storagechest','户外储物箱',48,30],['trellis','攀藤格栅',38,52]
].map(([id,name,w,h])=>({id,name,w,h,category:'家具',furniture:true}));
const WOOD={edge:'#736149',side:'#746147',face:'#927957',light:'#aa9370',grain:'#817052'},METAL={edge:'#515b4b',side:'#4d594c',face:'#6b7561',light:'#919680',grain:'#59634e'};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function line(c,x,y,xx,yy,col){const n=Math.max(Math.abs(xx-x),Math.abs(yy-y),1);for(let i=0;i<=n;i++)rect(c,x+(xx-x)*i/n,y+(yy-y)*i/n,1,1,col)}
function oval(c,x,y,rx,ry,col){for(let j=-ry;j<=ry;j++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));rect(c,x-span,y+j,span*2+1,1,col)}}
function plank(c,x,y,w,h,m,seed=0){rect(c,x,y,w,h,m.face);rect(c,x,y+h-2,w,2,m.side);rect(c,x+2,y,w-4,1,m.light);if(w>12){line(c,x+5,y+2,x+Math.min(w-4,17+seed%9),y+2,m.grain);rect(c,x+w-5,y+2,1,1,m.side);rect(c,x+3,y+2,1,1,m.side);for(let xx=x+9+(seed%3);xx<x+w-4;xx+=13){rect(c,xx,y+1,3,1,m.grain);rect(c,xx+2,y+h-3,2,1,m.light)}}}
function post(c,x,y,h,m){rect(c,x,y,3,h,m.side);rect(c,x,y+2,2,h-4,m.face);for(let yy=y+4;yy<y+h-4;yy+=9)rect(c,x,yy,2,2,m.light)}
export function paintFurniture(c,t,w,h){const m=['shelf','tierstand','wallrack','plantcart','bistrotable','trellis'].includes(t)?METAL:WOOD,x=-Math.floor(w/2),y=-Math.floor(h/2);
 if(['shelf','woodshelf','tierstand','ladderstand','wallrack'].includes(t)){
  const tiers=t==='wallrack'?4:3,step=(h-9)/tiers,ladder=t==='ladderstand',wood=t==='woodshelf'||ladder;
  if(ladder){line(c,x+9,y,x+2,y+h-2,m.edge);line(c,-x-10,y,-x-3,y+h-2,m.edge);line(c,x+10,y,x+3,y+h-2,m.light);line(c,-x-9,y,-x-2,y+h-2,m.side)}
  else {post(c,x+1,y,h,m);post(c,x+w-4,y,h,m);line(c,x+4,y+4,x+w-5,y+h-5,m.side);line(c,x+w-5,y+4,x+4,y+h-5,m.side)}
  for(let i=0;i<tiers;i++){const inset=ladder?Math.round(9-i*3):4,yy=y+3+i*step;plank(c,x+inset,yy,w-inset*2,wood?6:5,m,i);if(!wood)for(let xx=x+inset+5;xx<x+w-inset;xx+=6)line(c,xx,yy+1,xx,yy+3,m.edge)}
  for(const xx of [x+1,x+w-5])plank(c,xx,y+h-3,4,3,m);return
 }
 if(t==='trellis'){post(c,x+1,y,h,m);post(c,x+w-4,y,h,m);for(let yy=y+2;yy<y+h-5;yy+=8)line(c,x+3,yy,x+w-4,yy,m.face);for(let xx=x+7;xx<x+w-5;xx+=8){line(c,xx,y+2,xx,y+h-5,m.side);rect(c,xx,y+2,1,2,m.light)}return}
 if(t==='bistrotable'){for(const xx of [-9,8])post(c,xx,0,h/2-1,m);line(c,-9,8,9,1,m.side);line(c,8,8,-8,1,m.side);oval(c,0,-4,w/2-1,9,m.edge);oval(c,0,-6,w/2-2,8,m.face);oval(c,0,-7,w/2-4,6,m.side);for(let xx=-10;xx<=10;xx+=5)line(c,xx,-11,xx,-3,m.face);for(let yy=-10;yy<=-3;yy+=3)line(c,-10,yy,10,yy,m.face);line(c,-8,-13,4,-13,m.light);return}
 if(t==='foldingchair'){line(c,x+4,y+3,x+w-5,y+h-2,m.edge);line(c,x+w-5,y+3,x+4,y+h-2,m.edge);post(c,x+3,y,h-3,m);post(c,x+w-6,y,h-3,m);for(let i=0;i<2;i++)plank(c,x+2,y+2+i*5,w-4,5,m,i);for(let i=0;i<2;i++)plank(c,x+1,y+h/2+i*4,w-2,5,m,i);rect(c,x+4,y+h/2,1,1,'#b3b898');return}
 if(t==='storagechest'){rect(c,x,y+5,w,h-7,m.edge);rect(c,x+2,y+7,w-4,h-11,m.side);for(let yy=y+7;yy<y+h-5;yy+=5)plank(c,x+2,yy,w-4,5,m,yy);plank(c,x,y+1,w,7,m);for(const xx of [x+7,x+w-10]){rect(c,xx,y+1,3,5,METAL.edge);rect(c,xx,y+2,1,2,METAL.light)}rect(c,-3,y+10,6,3,METAL.edge);rect(c,-2,y+10,4,1,METAL.light);return}
 const cart=t==='plantcart',work=t==='pottingbench',back=t==='gardenbench',table=t==='table'||work,seatY=back?y+13:work?y+9:y+2;
 for(const xx of [x+3,x+w-6])post(c,xx,seatY+3,y+h-seatY-3,m);
 if(back||work){post(c,x+3,y,h-2,m);post(c,x+w-6,y,h-2,m);for(let i=0;i<(back?2:1);i++)plank(c,x+1,y+i*5,w-2,5,m,i)}
 const seatH=table?12:cart?9:8;
 for(let yy=seatY;yy<seatY+seatH;yy+=4)plank(c,x,yy,w,5,m,yy);
 if(cart||work||table){plank(c,x+4,y+h-10,w-8,5,m,2);line(c,x+5,seatY+seatH,x+w-7,y+h-6,m.side)}
 if(work){for(const xx of [x+5,2]){plank(c,xx,seatY+seatH+1,w/2-7,7,m);rect(c,xx+6,seatY+seatH+3,5,2,METAL.edge);rect(c,xx+6,seatY+seatH+3,4,1,METAL.light)}}
 if(cart){for(const xx of [x+4,x+w-5]){oval(c,xx,y+h-3,3,3,METAL.edge);rect(c,xx,y+h-4,1,2,METAL.light)}post(c,x+w-3,y,12,m);line(c,x+w-3,y,x+w-8,y,m.light)}
 if(back){for(const xx of [x+1,x+w-4]){post(c,xx,seatY-3,7,m);plank(c,xx-1,seatY-4,5,3,m)}}
}
