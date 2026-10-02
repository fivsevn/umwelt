// Furniture shares a small material palette, while gaps expose the roof beneath it.
export const FURNITURE=[
 ['room-bed','木床与薄被',46,62],['room-wardrobe','双门衣柜',44,52],['room-dresser','三屉斗柜',42,35],['room-armchair','布面小扶手椅',32,34],
 ['tierstand','三层铁花架',48,38],['ladderstand','梯形木花架',38,48],['wallrack','窄高格花架',30,54],['plantcart','带轮花车',46,32],['pottingbench','带抽屉换盆台',60,38],['gardenbench','靠背长凳',58,32],['bistrotable','圆形铁桌',36,32],['foldingchair','折叠木椅',25,33],['storagechest','户外储物箱',48,30],['trellis','攀藤格栅',38,52]
].map(([id,name,w,h])=>({id,name,w,h,category:'家具',furniture:true,note:'北天台实物与日常园艺家具：木板留有纹理，铁件保留网格、连接点和支脚。',care:'放在稳固平面上；花架可承托盆底。',sources:[]}));
const WOOD={edge:'#70614f',side:'#70614d',face:'#8d7a5f',light:'#a59478',grain:'#7e7059'},METAL={edge:'#525a4e',side:'#4f584e',face:'#6c7465',light:'#929584',grain:'#5a6252'};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function line(c,x,y,xx,yy,col){const n=Math.max(Math.abs(xx-x),Math.abs(yy-y),1);for(let i=0;i<=n;i++)rect(c,x+(xx-x)*i/n,y+(yy-y)*i/n,1,1,col)}
function oval(c,x,y,rx,ry,col){for(let j=-ry;j<=ry;j++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));rect(c,x-span,y+j,span*2+1,1,col)}}
function plank(c,x,y,w,h,m,seed=0){rect(c,x,y,w,h,m.face);rect(c,x,y+h-2,w,2,m.side);rect(c,x+2,y,w-4,1,m.light);if(w>12){line(c,x+5,y+2,x+Math.min(w-4,17+seed%9),y+2,m.grain);rect(c,x+w-5,y+2,1,1,m.side);rect(c,x+3,y+2,1,1,m.side);if(w>28){const knot=x+Math.floor(w*.62);rect(c,knot,y+2,2,1,m.grain);rect(c,knot+1,y+3,2,1,m.side);rect(c,knot+3,y+2,2,1,m.light);rect(c,x+w-3,y+1,1,Math.max(1,h-3),m.grain)}for(let xx=x+9+(seed%3);xx<x+w-4;xx+=13){rect(c,xx,y+1,3,1,m.grain);rect(c,xx+2,y+h-3,2,1,m.light)}}}
function post(c,x,y,h,m){rect(c,x,y,3,h,m.side);rect(c,x,y+2,2,h-4,m.face);for(let yy=y+4;yy<y+h-4;yy+=9){rect(c,x,yy,1,1,m.light);rect(c,x+1,yy+1,1,1,m.grain)}}
const BLACK={edge:'#27322e',side:'#303b36',face:'#435047',light:'#657267',grain:'#35433a'};
export function paintFurniture(c,t,w,h,{rotation=0}={}){const m=t==='shelf'?BLACK:['shelf','tierstand','wallrack','plantcart','bistrotable','trellis'].includes(t)?METAL:WOOD,x=-Math.floor(w/2),y=-Math.floor(h/2);
 if(t.startsWith('room-')){const side=rotation%180!==0,rear=rotation===180;
  if(t==='room-bed'){for(const xx of [x+3,x+w-6])post(c,xx,y+8,h-7,m);plank(c,x,y,w,7,m);rect(c,x+4,y+7,w-8,h-13,'#c9bea1');rect(c,x+7,y+10,w-14,9,'#e1d3b3');rect(c,x+4,y+23,w-8,h-29,'#82917c');for(let yy=y+25;yy<y+h-9;yy++)for(let xx=x+5;xx<x+w-5;xx++)if((xx+yy)%4===0)rect(c,xx,yy,1,1,'#9ba78b');plank(c,x,y+h-7,w,5,m);return}
  if(t==='room-armchair'){for(const xx of [x+3,x+w-6])post(c,xx,y+h-7,7,m);rect(c,x+3,y+4,w-6,h-10,'#6c7e70');rect(c,x+5,y+6,w-10,10,'#91a08a');rect(c,x+5,y+17,w-10,h-24,'#a1aa90');for(const xx of [x+1,x+w-5])plank(c,xx,y+12,4,h-17,m);if(side)rect(c,rotation===90?x+3:x+w-8,y+3,5,h-12,'#778b7a');return}
  for(const xx of [x+3,x+w-6])post(c,xx,y+h-7,7,m);rect(c,x,y+3,w,h-10,m.side);plank(c,x,y,w,5,m);if(rear||side){for(let yy=y+6;yy<y+h-8;yy+=6)plank(c,x+2,yy,w-4,6,m,yy);return}
  if(t==='room-wardrobe'){for(const xx of [x+2,1]){rect(c,xx,y+5,w/2-3,h-14,m.face);rect(c,xx+2,y+8,w/2-7,h-20,'#9b8768')}for(const xx of [-4,2])rect(c,xx,y+h*.55,2,3,'#c6b386');line(c,0,y+5,0,y+h-9,m.edge)}else for(let i=0;i<3;i++){plank(c,x+2,y+5+i*(h-13)/3,w-4,(h-13)/3,m,i);rect(c,-3,y+7+i*(h-13)/3,6,2,'#b9ad8b')}return
 }
 if(['shelf','woodshelf','tierstand','ladderstand','wallrack'].includes(t)){
  const tiers=t==='wallrack'?4:3,step=(h-9)/tiers,ladder=t==='ladderstand',wood=t==='woodshelf'||ladder;
  if(ladder){line(c,x+9,y,x+2,y+h-2,m.edge);line(c,-x-10,y,-x-3,y+h-2,m.edge);line(c,x+10,y,x+3,y+h-2,m.light);line(c,-x-9,y,-x-2,y+h-2,m.side)}
  else {post(c,x+1,y,h,m);post(c,x+w-4,y,h,m);line(c,x+4,y+4,x+w-5,y+h-5,m.side);line(c,x+w-5,y+4,x+4,y+h-5,m.side)}
  for(let i=0;i<tiers;i++){const inset=ladder?Math.round((rotation%180?5:9)-i*(rotation%180?1:3)):4,yy=y+3+i*step;plank(c,x+inset,yy,w-inset*2,rotation%180?(wood?8:7):wood?6:5,m,i);if(!wood)for(let xx=x+inset+5;xx<x+w-inset;xx+=6)line(c,xx,yy+1,xx,yy+3,m.edge)}
  for(const xx of [x+1,x+w-5])plank(c,xx,y+h-3,4,3,m);return
 }
 if(t==='trellis'){post(c,x+1,y,h,m);post(c,x+w-4,y,h,m);for(let yy=y+2;yy<y+h-5;yy+=8)line(c,x+3,yy,x+w-4,yy,m.face);for(let xx=x+7;xx<x+w-5;xx+=8){line(c,xx,y+2,xx,y+h-5,m.side);rect(c,xx,y+2,1,2,m.light)}return}
 if(t==='bistrotable'){for(const xx of [-9,8])post(c,xx,0,h/2-1,m);line(c,-9,8,9,1,m.side);line(c,8,8,-8,1,m.side);oval(c,0,-4,w/2-1,9,m.edge);oval(c,0,-6,w/2-2,8,m.face);oval(c,0,-7,w/2-4,6,m.side);for(let xx=-10;xx<=10;xx+=5)line(c,xx,-11,xx,-3,m.face);for(let yy=-10;yy<=-3;yy+=3)line(c,-10,yy,10,yy,m.face);line(c,-8,-13,4,-13,m.light);return}
 if(t==='foldingchair'){line(c,x+4,y+3,x+w-5,y+h-2,m.edge);line(c,x+w-5,y+3,x+4,y+h-2,m.edge);post(c,x+3,y,h-3,m);post(c,x+w-6,y,h-3,m);const rear=rotation===180,side=rotation%180,seat=y+h/2;for(let i=0;i<2;i++)plank(c,x+1,seat+i*4,w-2,5,m,i);if(side){const bx=rotation===90?x+2:x+w-6;post(c,bx,y,Math.round(h*.68),m);plank(c,bx-1,y+2,5,9,m);line(c,bx+1,y+12,bx+1,seat,m.light)}else for(let i=0;i<2;i++)plank(c,x+2,rear?y+h-11+i*5:y+2+i*5,w-4,5,m,i);rect(c,x+4,seat,1,1,'#b3b79e');return}
 if(t==='storagechest'){rect(c,x,y+5,w,h-7,m.edge);rect(c,x+2,y+7,w-4,h-11,m.side);for(let yy=y+7;yy<y+h-5;yy+=5)plank(c,x+2,yy,w-4,5,m,yy);plank(c,x,y+1,w,7,m);for(const xx of [x+7,x+w-10]){rect(c,xx,y+1,3,5,METAL.edge);rect(c,xx,y+2,1,2,METAL.light)}if(rotation!==180){rect(c,-3,y+10,6,3,METAL.edge);rect(c,-2,y+10,4,1,METAL.light)}else for(const xx of [x+7,x+w-10])rect(c,xx,y+h-5,3,3,METAL.edge);return}
 const cart=t==='plantcart',work=t==='pottingbench',back=t==='gardenbench',table=t==='table'||work,seatY=back?(rotation===180?y+2:y+13):work?y+9:y+2;
 for(const xx of [x+3,x+w-6])post(c,xx,seatY+3,y+h-seatY-3,m);
 if(back||work){post(c,x+3,y,h-2,m);post(c,x+w-6,y,h-2,m);if(rotation%180){const xx=rotation===90?x+2:x+w-5;post(c,xx,y,13,m)}else if(rotation!==180||!back)for(let i=0;i<(back?2:1);i++)plank(c,x+1,y+i*5,w-2,5,m,i)}
 const seatH=table?12:cart?9:8;
 for(let yy=seatY;yy<seatY+seatH;yy+=4)plank(c,x,yy,w,5,m,yy);
 if(cart||work||table){plank(c,x+4,y+h-10,w-8,5,m,2);line(c,x+5,seatY+seatH,x+w-7,y+h-6,m.side)}
 if(work){for(const xx of [x+5,2]){plank(c,xx,seatY+seatH+1,w/2-7,7,m);rect(c,xx+6,seatY+seatH+3,5,2,METAL.edge);rect(c,xx+6,seatY+seatH+3,4,1,METAL.light)}}
 if(cart){for(const xx of [x+4,x+w-5]){oval(c,xx,y+h-3,3,3,METAL.edge);rect(c,xx,y+h-4,1,2,METAL.light)}post(c,x+w-3,y,12,m);line(c,x+w-3,y,x+w-8,y,m.light)}
 if(back&&rotation===180){for(let i=0;i<2;i++)plank(c,x+1,y+h-12+i*5,w-2,5,m,i)}if(back){for(const xx of [x+1,x+w-4]){post(c,xx,seatY-3,7,m);plank(c,xx-1,seatY-4,5,3,m)}}
}
