import {plant,vessel} from './botany.mjs';
// Pixels are rasterized on a logical grid, including curved leaves. No antialiased paths.
const pixel=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
function line(c,x0,y0,x1,y1,col,width=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;for(;;){pixel(c,x0-Math.floor(width/2),y0-Math.floor(width/2),width,width,col);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
function oval(c,x,y,rx,ry,col){for(let yy=-ry;yy<=ry;yy++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry||1))));pixel(c,x-span,y+yy,span*2+1,1,col)}}
function polygon(c,pts,col){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}if(inside)pixel(c,x,y,1,1,col)}}
function mix(a,b,t){const ar=a.slice(1).match(/../g).map(v=>parseInt(v,16)),br=b.slice(1).match(/../g).map(v=>parseInt(v,16));return '#'+ar.map((v,i)=>Math.round(v+(br[i]-v)*t).toString(16).padStart(2,'0')).join('')}
// Shared, restrained colour ramps. Shadows carry material colour instead of drawing a frame.
function shade(hex,delta){const [r,g,b]=hex.slice(1).match(/../g).map(v=>parseInt(v,16)),green=g>r*1.05&&g>b*1.05,purple=b>g*1.04&&r>g*1.04,blue=b>r*1.07;
 const target=delta<0?(green?'#39432c':purple?'#534451':blue?'#40534f':'#514333'):(green?'#abaa70':purple?'#b09a99':blue?'#a7b599':'#c1ad7e');return mix(hex,target,Math.min(.7,Math.abs(delta)/(delta<0?46:74)));}
function leaf(c,x,y,dx,dy,width,col,serrate=false){const len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 // Nearby leaves share a plane; right/lower leaves sit behind the lit cluster.
 col=shade(col,dx>0?-12:y>-7?-8:4);
 // Block in the leaf, then two connected inner planes; no enclosing dark contour.
 polygon(c,[[x,y],[x+dx*.38+nx*width,y+dy*.38+ny*width],[x+dx,y+dy],[x+dx*.52-nx*width,y+dy*.52-ny*width]],col);
 polygon(c,[[x+dx*.15,y+dy*.15],[x+dx*.38+nx*width*.86,y+dy*.38+ny*width*.86],[x+dx*.8,y+dy*.8],[x+dx*.48,y+dy*.48]],shade(col,17));
 polygon(c,[[x+dx*.3,y+dy*.3],[x+dx*.78,y+dy*.78],[x+dx*.52-nx*width*.85,y+dy*.52-ny*width*.85]],shade(col,-27));
 if(width>=3){line(c,x+dx*.35,y+dy*.35,x+dx*.65,y+dy*.65,shade(col,8));pixel(c,x+dx*.48+nx*width*.4,y+dy*.48+ny*width*.4,2,1,shade(col,24));}
 if(serrate)for(let t=.3;t<.75;t+=.2){pixel(c,x+dx*t+nx*width*.65,y+dy*t+ny*width*.65,1,1,col);pixel(c,x+dx*t-nx*width*.65,y+dy*t-ny*width*.65,1,1,col)}}
function flower(c,x,y,col,size=3,petals=5){for(let i=0;i<petals;i++){const a=i*Math.PI*2/petals;oval(c,x+Math.round(Math.cos(a)*size*.7),y+Math.round(Math.sin(a)*size*.55),Math.max(1,size-1),Math.max(1,size-1),i%2?shade(col,-10):col)}pixel(c,x-1,y,3,2,shade(col,-30));pixel(c,x,y,1,1,'#e8b849')}
// Each profile changes the silhouette, mouth, belly, foot and rim independently.
const vesselProfiles={
 round:{h:9,rows:[[0,1],[1,.68]]}, deep:{h:12,rows:[[0,1],[1,.75]]},
 shallow:{h:4,rows:[[0,1],[1,.8]]}, basket:{h:9,rows:[[0,1],[.45,.95],[1,.6]]}, bag:{h:10,rows:[[0,.92],[.7,1],[1,.87]]},
 oval:{h:7,rows:[[0,1],[.6,.95],[1,.7]],feet:true},
 bowl:{h:9,rows:[[0,1],[.35,.97],[.7,.78],[1,.46]],foot:true},
 jar:{h:11,mouth:.7,rows:[[0,.7],[.25,.94],[.55,1],[.85,.83],[1,.55]],foot:true},
 flare:{h:9,rows:[[0,1],[.3,.85],[1,.52]],flutes:true},
 cylinder:{h:11,rows:[[0,.9],[.9,.9],[1,.83]],band:true},
 square:{h:9,rows:[[0,1],[.8,.86],[1,.8]],square:true,feet:true},
 mokko:{h:6,rows:[[0,1],[.4,.94],[1,.65]],lobes:4,foot:true},
 scallop:{h:8,rows:[[0,1],[.5,.86],[1,.5]],lobes:8,foot:true},
 footed:{h:7,rows:[[0,1],[.5,.8],[1,.48]],foot:true},
 cup:{h:11,mouth:.83,rows:[[0,.83],[.65,.71],[1,.58]],foot:true},
 pedestal:{h:6,rows:[[0,1],[.6,.76],[1,.36]],lobes:8,pedestal:true},
 rolled:{h:9,rows:[[0,1],[.5,.94],[1,.58]],rolled:true,foot:true},
 faceted:{h:11,mouth:.77,rows:[[0,.77],[.3,1],[.7,.95],[1,.58]],facets:true},
 irregular:{h:9,rows:[[0,.94],[.35,1],[1,.65]],irregular:true}
};
export function paintVessel(c,v,y=7,size=24){v=v||vessel('terra');v={...v,ink:mix(v.color,v.ink,.52),rim:mix(v.color,v.rim,.58)};const half=Math.floor(size/2),profile=vesselProfiles[v.shape]||vesselProfiles.round,height=profile.h;
 if(v.shape==='box'){pixel(c,-half,y-3,size,height,v.ink);pixel(c,-half+1,y-2,size-2,height-2,v.color);pixel(c,-half,y-4,size,3,v.rim);pixel(c,-half+2,y-3,size-4,2,'#4b4834');pixel(c,half-5,y-1,4,height-3,shade(v.color,-25));pixel(c,-half+2,y+1,1,3,shade(v.color,22));for(let x=-half+4;x<half-2;x+=5)pixel(c,x,y+height-5,1,1,shade(v.color,-18));return}
 const top=y-3,base=top+height,rows=profile.rows;
 // Scanline contour leaves genuinely transparent corners and gaps between the feet.
 for(let row=0;row<height;row++){const t=row/(height-1);let k=1;while(k<rows.length-1&&t>rows[k][0])k++;const [t0,r0]=rows[k-1],[t1,r1]=rows[k],radius=Math.round(half*(r0+(r1-r0)*(t-t0)/(t1-t0))),offset=profile.irregular?(row<3?-1:row>6?1:0):0;
  pixel(c,-radius+offset,top+row,radius*2+1,1,shade(v.color,-8));pixel(c,-radius+1+offset,top+row,radius*2-1,1,v.color);
  pixel(c,Math.max(1,radius-5)+offset,top+row,Math.min(5,radius-1),1,shade(v.color,-24));if(row>0&&row<height-2)pixel(c,-radius+2+offset,top+row,3,1,shade(v.color,14));
  // Small interlocking clusters taper the face transition, rather than a full checkerboard.
  if(row>1&&row<height-2&&row%3!==0)pixel(c,Math.max(0,radius-7)+(row%2),top+row,2,1,shade(v.color,-11));if(row===3||row===4)pixel(c,-radius+6,top+row,3,1,shade(v.color,7));
  if(profile.facets){pixel(c,-Math.round(radius*.35),top+row,2,1,shade(v.color,8));pixel(c,Math.round(radius*.3),top+row,1,1,shade(v.color,-17));}
  if(profile.flutes)for(let x=-radius+5;x<radius-3;x+=4)pixel(c,x,top+row,1,1,shade(v.color,-13));
 }
 const lower=Math.round(half*rows.at(-1)[1]);line(c,-lower+1,base-1,lower-1,base-1,shade(v.color,-12));
 if(profile.feet){for(const x of [-lower+1,lower-4]){pixel(c,x,base,3,2,v.ink);pixel(c,x,base,2,1,shade(v.color,12))}}
 else if(profile.foot||profile.pedestal){const foot=profile.pedestal?4:Math.max(3,lower-1);pixel(c,-foot,base,foot*2+1,profile.pedestal?3:2,v.ink);line(c,-foot+1,base,foot-1,base,shade(v.color,8));if(profile.pedestal)line(c,-foot-2,base+2,foot+2,base+2,v.rim)}
 const mouth=Math.round(half*(profile.mouth||1)),mouthY=y-5;
 if(profile.square){pixel(c,-mouth,mouthY-2,mouth*2+1,5,shade(v.rim,-20));pixel(c,-mouth,mouthY-2,mouth*2+1,2,v.rim);pixel(c,-mouth+2,mouthY,mouth*2-3,2,'#4b4834');line(c,-mouth+1,mouthY-2,-1,mouthY-2,shade(v.rim,11));line(c,-mouth,mouthY+2,mouth,mouthY+2,v.rim)}
 else {oval(c,profile.irregular?-1:0,mouthY+1,mouth,profile.rolled?4:3,shade(v.rim,-20));oval(c,profile.irregular?-1:0,mouthY,mouth,profile.rolled?3:2,v.rim);
  if(profile.lobes){for(let i=0;i<profile.lobes;i++){const angle=i*Math.PI*2/profile.lobes;oval(c,Math.cos(angle)*(mouth-1),mouthY+Math.sin(angle)*2,profile.lobes===4?3:2,1,v.rim)} }
  oval(c,profile.irregular?-1:0,mouthY,mouth-2,1,'#4b4834');line(c,-mouth+2,mouthY-1,-2,mouthY-1,shade(v.rim,11));
 }
 if(profile.band)line(c,-half+2,y+3,half-2,y+3,shade(v.color,-18));
 // A small, readable ornament on the front face, not a texture over the entire object.
 const ink=v.ink,front=y+1;
 if(v.pattern==='blue'||v.pattern==='grass'){line(c,-5,front+3,4,front-1,ink);for(const x of [-5,-1,3]){pixel(c,x,front,2,1,ink);pixel(c,x+2,front+2,2,1,ink)}}
 if(v.pattern==='scroll'){for(const x of [-6,0,6]){line(c,x-2,front+2,x,front,ink);line(c,x,front,x+2,front+2,ink);pixel(c,x-1,front+3,2,1,ink)}}
 if(v.pattern==='stripe')for(let x=-7;x<=7;x+=4)line(c,x,front-1,x-1,front+4,ink);
 if(v.pattern==='speckle')for(const [x,yy] of [[-6,1],[-2,3],[4,0],[7,3],[0,0]])pixel(c,x,front+yy,1,1,ink);
 if(v.pattern==='dash')for(let x=-7;x<=7;x+=3){pixel(c,x,front,1,2,ink);pixel(c,x+1,front+3,1,1,ink)}
 if(v.pattern==='brush'){line(c,-8,front-1,6,front+2,v.rim,2);pixel(c,4,front+3,3,1,v.rim)}
 if(v.pattern==='fire'){line(c,-7,front,2,front+3,shade(v.color,28),2);line(c,-3,front-1,7,front+2,v.ink)}
 if(v.pattern==='crackle'){line(c,-6,front-1,-1,front+4,v.ink);line(c,-2,front+2,4,front,shade(v.ink,22));line(c,4,front,6,front+4,shade(v.ink,22))}
 if(v.pattern==='drip'||v.pattern==='oribe'){pixel(c,-half+2,y-2,half+2,3,v.ink);pixel(c,-5,front-1,3,4,v.ink);pixel(c,0,front-1,2,2,v.ink);if(v.pattern==='oribe')line(c,5,front,7,front+3,'#514f3d')}
 if(v.pattern==='flower'||v.pattern==='kutani'||v.pattern==='imari'){line(c,-6,front+3,5,front,ink);flower(c,0,front+1,v.pattern==='flower'?'#b5848a':'#b47b5d',1);pixel(c,-5,front,2,2,ink);pixel(c,5,front+2,2,1,ink);if(v.pattern==='imari')pixel(c,-9,front,2,4,ink)}
 if(v.shape==='basket'){for(let x=-8;x<9;x+=4)line(c,x,front,x-2,front+4,shade(v.color,-25));line(c,-9,y-3,-5,y-10,ink);line(c,9,y-3,5,y-10,ink)}
 if(v.shape==='bag'){pixel(c,-half+2,front,2,4,shade(v.color,-22));pixel(c,half-3,front,2,4,shade(v.color,-22));line(c,-8,y-3,-5,y-8,v.rim);line(c,8,y-3,5,y-8,v.rim)}
}
function paintPlantPixels(c,o){const p=plant(o.type),v=vessel(o.pot||p.defaultPot),col=p.leaf,dark=shade(col,-29),light=shade(col,21),f=p.form,fc=p.flower;
 const y=p.h/2-10; // Every plant fits its declared transparent footprint.
 const potY=['tails','ivy','fuchsia'].includes(f)?1:y;
 paintVessel(c,v,potY,v.shape==='box'?28:v.shape==='deep'?28:24);
 c.save();c.translate(0,potY-6);
 if(f==='barrel'||f==='cluster'){
  const centers=f==='cluster'?[[-6,-4,6],[5,-3,6],[0,-11,6]]:[[0,-7,11]];
  for(const [x,yy,r] of centers){oval(c,x,yy,r,r,col);for(let row=-r+2;row<r;row++){const span=Math.floor(r*Math.sqrt(Math.max(0,1-row*row/(r*r))));if(span>2)pixel(c,x+Math.floor(span*.25),yy+row,Math.max(1,span-Math.floor(span*.25)),1,dark)}oval(c,x-3,yy-3,Math.max(2,r-5),Math.max(2,r-4),shade(col,12));for(let dx=-r+3;dx<r;dx+=4)line(c,x+dx,yy-r+3,x+dx,yy+r-2,light);for(let i=0;i<20;i++){const a=i*2.399,rr=Math.sqrt(i/20)*(r-1);pixel(c,x+Math.cos(a)*rr,yy+Math.sin(a)*rr,1,1,f==='barrel'?'#b6ae73':'#c0b8a1')};if(f==='cluster')for(let i=0;i<6;i++){const a=i*Math.PI/3;pixel(c,x+Math.cos(a)*4,yy-3+Math.sin(a)*2,2,1,fc)}else oval(c,x,yy-r+2,3,2,'#cec498')}
 }else if(f==='column'){
  for(const [x,top] of [[-7,-15],[0,-24],[7,-18]]){polygon(c,[[x-3,0],[x-3,top+2],[x,top],[x+3,top+2],[x+3,0]],col);pixel(c,x+1,top+3,2,-top-3,dark);line(c,x-1,top+2,x-1,0,light);for(let yy=top+5;yy<0;yy+=4){pixel(c,x-3,yy,1,1,'#d3c496');pixel(c,x+3,yy+1,1,1,'#d3c496')}}
 }else if(f==='pads'){
  for(const [x,yy,rx,ry] of [[0,-5,5,7],[-6,-15,5,7],[6,-18,5,7]]){oval(c,x,yy,rx,ry,col);oval(c,x+2,yy+2,2,Math.max(2,ry-2),dark);oval(c,x-2,yy-3,2,2,light);for(let xx=-3;xx<=3;xx+=3)for(let dy=-4;dy<=4;dy+=4)pixel(c,x+xx,yy+dy,1,1,'#dbd8b4')}
 }else if(f==='tails'){
  for(const [x,end] of [[-8,18],[0,22],[8,15]]){line(c,x,-4,x+3,4,dark,5);line(c,x+3,4,x+2,end,'#b6b9a1',5);line(c,x+2,5,x+1,end,'#dbd8be');for(let yy=5;yy<end;yy+=3)pixel(c,x-1,yy,1,1,'#e6debc');}flower(c,-7,13,fc,2)
 }else if(['swords','agave','zebra','snake','spider','onion','spikes','needles'].includes(f)){
  const isOnion=f==='onion',isSnake=f==='snake',isSpider=f==='spider',thin=['onion','spikes','needles'].includes(f);
  if(f==='needles')for(const [x,top] of [[-8,-16],[0,-23],[8,-18]]){line(c,0,0,x,top,'#81775d',2);for(let yy=top+2;yy<-1;yy+=3){line(c,x*(yy/top),yy,x*(yy/top)-4,yy-3,col);line(c,x*(yy/top),yy,x*(yy/top)+3,yy-3,light)}}
  else for(let i=0;i<7;i++){const dx=(i-3)*(isSnake?3:4),dy=-14-(3-Math.abs(i-3))*3+(isSpider?Math.abs(i-3)*3:0);if(thin){line(c,(i-3)*1.5,0,dx,dy,col,2);line(c,dx,dy,dx+2,dy-2,light);if(isOnion)line(c,(i-3)*1.5,0,(i-3)*1.5,-3,'#dce2c5');if(f==='spikes'||p.id==='chives')flower(c,dx,dy-2,fc,2,5)}else{leaf(c,(i-3),0,dx,dy,f==='agave'?4:isSnake?3:2.5,col);if(f==='zebra'||isSnake)for(let yy=-3;yy>dy+3;yy-=4){const xx=(i-3)+dx*yy/dy;line(c,xx-1,yy,xx+1,yy-1,f==='zebra'?'#d1d4bd':dark)}if(isSnake)line(c,(i-3),0,dx+i-3,dy,fc);if(isSpider)line(c,(i-3),0,dx+i-3,dy,'#d8dbc3');if(p.id==='aloe'||f==='agave')for(let t=.3;t<.9;t+=.25)pixel(c,dx*t+(i<3?-2:2),dy*t,1,1,'#c2c7ad')}}
  if(isSpider){line(c,7,-2,13,2,col);line(c,13,2,10,10,col);for(const dx of [-4,0,4])leaf(c,10,10,dx,-5,1.5,col)}
 }else if(f==='rosette'){
  for(let ring=0;ring<3;ring++){const len=12-ring*3;for(let i=0;i<8;i++){const a=i*Math.PI/4+ring*.3;leaf(c,0,-6,Math.cos(a)*len,Math.sin(a)*len*.6,4-ring*.7,shade(col,ring*12));}}pixel(c,-1,-7,3,2,light)
 }else if(f==='beads'||f==='jade'){
  for(const [x,top] of [[-7,-12],[0,-20],[7,-15]]){line(c,0,0,x,top,f==='jade'?'#8c7660':dark,2);for(let yy=top+3;yy<0;yy+=5){const xx=x*yy/top;for(const side of [-1,1]){oval(c,xx+side*3,yy, f==='jade'?4:3,2,col);pixel(c,xx+side*3,yy+1,3,1,dark);pixel(c,xx+side*4,yy-2,2,1,p.id==='sedum'?fc:light)}}oval(c,x,top,3,3,col);pixel(c,x-1,top-2,2,1,p.id==='sedum'?fc:light)}
 }else if(f==='fern'){
  // Fronds rise from the crown and arch outward; tapered pinnae follow the curve.
  for(let i=-3;i<=3;i++){const side=Math.sign(i)||1,reach=i*4,peak=-20+Math.abs(i)*2;
   let last=[0,0];for(let k=1;k<=8;k++){const t=k/8,x=reach*t,yy=peak*Math.sin(t*Math.PI*.62)+Math.abs(i)*t*t*1.4;
    line(c,...last,x,yy,dark);const len=5*(1-t)+1;
    leaf(c,x,yy,-len,-2,1.5,shade(col,i>0?-9:3));leaf(c,x,yy,len,-2,1.5,shade(col,i>0?-3:9));last=[x,yy];}
  }
 }else if(f==='split'){
  for(const [x,yy,side] of [[-8,-12,-1],[8,-17,1],[0,-26,-1]]){line(c,0,0,x,yy,'#677d58',2);oval(c,x,yy,7,5,col);polygon(c,[[x,yy],[x+6,yy-2],[x+4,yy+4],[x-1,yy+4]],dark);oval(c,x-3,yy-2,3,2,light);line(c,x+side*3,yy-4,x-side*4,yy+3,light);// Transparent cuts through the isolated sprite expose the scene.
  c.save();c.globalCompositeOperation='destination-out';for(let i=0;i<3;i++)line(c,x+side*4,yy-3+i*2,x+side*7,yy-2+i*2,'#000',1);pixel(c,x-1,yy-2,1,2,'#000');c.restore()}
 }else if(f==='ivy'){
  for(const [x,end] of [[-10,17],[0,22],[9,15]]){line(c,x,-3,x+2,end,dark);for(let yy=-1;yy<end;yy+=5){const side=yy%2?1:-1,xx=x+side*2;polygon(c,[[xx,yy+3],[xx-4,yy],[xx-2,yy-1],[xx-2,yy-4],[xx+1,yy-2],[xx+4,yy-2],[xx+3,yy+1]],col);line(c,xx,yy+2,xx,yy-2,light)}}
 }else if(['herb','tiny','parsley','coleus','hosta','round'].includes(f)){
  const id=p.id;
  if(f==='tiny'){
   const creeping=id==='thyme';for(const [x,top] of creeping?[[-11,-6],[-5,-10],[3,-8],[10,-5]]:[[-8,-12],[0,-20],[8,-14]]){line(c,0,0,x,top,dark);for(let t=.15;t<=1;t+=.18){const xx=x*t,yy=top*t;oval(c,xx-2,yy,creeping?2:3,1,col);oval(c,xx+2,yy-2,creeping?2:3,1,light)}flower(c,x,top,fc,1)}
  }else if(f==='parsley'){
   for(const [x,top] of [[-9,-10],[-4,-18],[5,-15],[10,-7]]){line(c,0,0,x,top,dark);for(let k=0;k<5;k++){const a=k*1.25;const xx=x+Math.cos(a)*3,yy=top+Math.sin(a)*2;if(id==='coriander'){oval(c,xx,yy,2,2,col);pixel(c,xx,yy-2,1,1,light)}else{polygon(c,[[xx-3,yy+1],[xx-3,yy-2],[xx-1,yy-1],[xx,yy-4],[xx+1,yy-1],[xx+3,yy-2],[xx+2,yy+2]],col);pixel(c,xx,yy-1,1,2,light)}}}
  }else if(f==='hosta'){
   for(const [dx,dy] of [[-13,-9],[-9,-17],[0,-23],[8,-19],[13,-10]]){leaf(c,0,0,dx,dy,5,col);for(const side of [-1,1])line(c,side*2,-2,dx*.75+side*2,dy*.75,light)}line(c,2,0,5,-26,dark);flower(c,5,-26,fc,2)
  }else if(f==='round'){
   for(const [x,yy,r] of [[-8,-9,5],[7,-14,5],[-2,-19,4],[9,-3,4]]){line(c,0,0,x,yy,dark);oval(c,x,yy,r,r-1,col);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;line(c,x,yy,x+Math.cos(a)*(r-1),yy+Math.sin(a)*(r-2),light)}if(id==='pelargonium')oval(c,x,yy,3,2,dark)}
   for(const [x,yy] of [[-10,-18],[7,-20],[10,-9]]){line(c,0,-2,x,yy,dark);flower(c,x,yy,fc,id==='pelargonium'?3:4,id==='pelargonium'?7:5)}
  }else{
   const broad=['basil','lemonbalm','shiso','coleus'].includes(id),tall=id==='peppermint',soft=id==='sage';
   const stems= id==='basil'?[[-6,-16],[3,-22],[9,-12]]:id==='lemonbalm'?[[-10,-12],[0,-18],[10,-10]]:id==='shiso'?[[-6,-18],[5,-24]]:soft?[[-9,-10],[-2,-22],[8,-15]]:tall?[[-5,-24],[5,-20]]:[[-9,-12],[-2,-21],[8,-16]];
   for(const [x,top] of stems){line(c,0,0,x,top,id==='shiso'||tall?'#947e87':dark,2);for(let yy=top+3;yy<-1;yy+=broad?7:5){const xx=x*yy/top;for(const side of [-1,1]){const dx=side*(soft?7:broad?7:5),dy=soft?-3:broad?-5:-3,w=soft?2.2:broad?3.5:2.4;leaf(c,xx,yy,dx,dy,w,col,!soft&&id!=='basil');if(id==='coleus')leaf(c,xx,yy,dx*.75,dy*.8,2,fc);if(id==='lemonbalm')for(let k=1;k<3;k++)line(c,xx+dx*k/3,yy+dy*k/3,xx+dx*k/3+side,yy+dy*k/3-2,light)}}if(soft)for(let yy=top;yy<top+8;yy+=3)flower(c,x,yy,fc,1)}
  }
 }else if(f==='lettuce'){
  for(let i=0;i<9;i++){const a=i*2.399,len=12-i*.65;leaf(c,0,-3,Math.cos(a)*len,Math.sin(a)*len*.7-5,5,col,true)}oval(c,0,-4,3,3,light)
 }else if(f==='oxalis'){
  for(const [x,yy] of [[-9,-11],[7,-15],[0,-22],[9,-5]]){line(c,0,0,x,yy,'#a58b83');for(let i=0;i<3;i++){const a=i*Math.PI*2/3;polygon(c,[[x,yy],[x+Math.cos(a-.5)*7,yy+Math.sin(a-.5)*5],[x+Math.cos(a+.5)*7,yy+Math.sin(a+.5)*5]],i%2?col:light)}}flower(c,-6,-20,fc,2)
 }else{
  const shrub=['berries','rose','camellia','gardenia','hibiscus','bougainvillea','jasmine','hydrangea'].includes(f),round=['round','strawberry','hosta'].includes(f),tiny=['tiny','cosmos','parsley','portulaca','marigold'].includes(f);
  const branches=f==='fuchsia'?[[-8,-10],[0,-13],[8,-9]]:shrub?[[-10,-17],[0,-29],[10,-20]]:[[-8,-15],[0,-23],[8,-17]];
  for(const [x,top] of branches){line(c,0,0,x,top,shrub?'#85705b':dark,shrub?2:1);for(let yy=top+4;yy<0;yy+=tiny?4:6){const xx=x*yy/top,side=(yy%4)?1:-1,dx=side*(tiny?4:6);if(round){oval(c,xx+dx,yy,4,3,col);pixel(c,xx+dx,yy+2,3,1,dark);pixel(c,xx+dx-2,yy-2,3,1,light);line(c,xx,yy,xx+dx,yy,light);if(p.id==='pelargonium')oval(c,xx+dx,yy,2,1,dark)}else if(tiny){for(let k=0;k<3;k++){leaf(c,xx,yy,dx, -2-k,1.5,col)}}else{leaf(c,xx,yy,dx,-4,f==='hosta'?4:3,col,true);if(f==='coleus')leaf(c,xx,yy,dx*.7,-3,1.5,fc)}}
   if(['spikes','daisy','cosmos','pansy','marigold','trumpet','kalanchoe','hydrangea','rose','camellia','gardenia','hibiscus','bougainvillea','jasmine','portulaca','fuchsia'].includes(f)){
    const size=f==='hydrangea'?5:['rose','camellia','gardenia','hibiscus'].includes(f)?4:3;
    if(f==='fuchsia'){line(c,x,top,x+3,top+8,dark);flower(c,x+3,top+7,'#c87f8d',2,4);oval(c,x+3,top+10,2,3,fc);line(c,x+3,top+10,x+3,top+14,'#dec8aa')}
    else{flower(c,x,top,fc,size,f==='kalanchoe'?4:f==='cosmos'?8:5);if(f==='hydrangea')for(const [dx,dy] of [[-3,-2],[2,-3],[-2,2],[3,2]])flower(c,x+dx,top+dy,shade(fc,dx*5),1,4);if(['rose','gardenia','marigold','daisy'].includes(f)){oval(c,x,top,2,2,shade(fc,-25));pixel(c,x,top,1,1,shade(fc,28))}if(f==='pansy')pixel(c,x-1,top,3,2,shade(fc,-45));if(f==='hibiscus')line(c,x,top,x+5,top-3,'#dcc078');if(f==='bougainvillea')pixel(c,x,top,1,2,'#e6dec7')}
   }
   if(f==='berries')for(let i=0;i<3;i++){oval(c,x+3-i*2,top+5+i*3,2,2,fc);pixel(c,x+2-i*2,top+4+i*3,1,1,'#b6c3ce')}
   if(f==='tomato'){line(c,0,0,0,-29,'#b4a47b');oval(c,x+2,top+9,3,3,fc);pixel(c,x+1,top+7,2,1,col);flower(c,x-3,top+3,'#dcc16c',1)}
   if(f==='pepper'){line(c,x+3,top+6,x+4,top+9,col);polygon(c,[[x+3,top+8],[x+6,top+9],[x+4,top+17],[x+2,top+12]],fc);pixel(c,x+3,top+10,1,3,shade(fc,25))}
  }
  if(f==='strawberry'){for(const [x,yy] of [[-7,-8],[5,-14],[0,-19]]){for(const dx of [-3,0,3])leaf(c,x,yy,dx,-5,2,col,true)}for(const x of [-10,9]){line(c,0,0,x,6,col);oval(c,x,7,3,3,fc);pixel(c,x-1,6,1,1,'#e3c590');pixel(c,x+1,8,1,1,'#e3c590');pixel(c,x-2,4,4,1,col)}flower(c,-9,-14,'#e9e3cf',2)}
  if(f==='radish'){for(const x of [-6,0,7]){oval(c,x,0,3,2,fc);pixel(c,x-1,-1,1,1,shade(fc,25))}}
 }
 c.restore();
}

const sprites=new Map();
export function paintPlant(c,o){const p=plant(o.type),key=o.type+':'+(o.pot||p.defaultPot);let sprite=sprites.get(key);if(!sprite){sprite=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(p.w+4,p.h+4):document.createElement('canvas');sprite.width=p.w+4;sprite.height=p.h+4;const ctx=sprite.getContext('2d');ctx.translate(sprite.width/2,sprite.height/2);paintPlantPixels(ctx,o);if(sprites.size>=256)sprites.delete(sprites.keys().next().value);sprites.set(key,sprite)}c.imageSmoothingEnabled=false;c.drawImage(sprite,-sprite.width/2,-sprite.height/2);}
