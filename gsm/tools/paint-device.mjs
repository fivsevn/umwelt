import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {createCanvas,loadImage,Path2D}=createRequire(new URL('./engine/package.json',import.meta.url))('@napi-rs/canvas');
import {geometry as g,mobileCharmLayout,mobileCordPoint} from '../device/geometry.mjs';

// A device is a still image, not a live tree of full-size filtered layers.
// Raster dimensions are deliberately independent of DPR and pinch zoom.
export const ART_SIZE=Object.freeze([...g.canvas]);
const sourceURL=path=>fileURLToPath(new URL(path,new URL('../device/catalog.mjs',import.meta.url)));
const images=new Map();
async function imageFor(path){
 const src=sourceURL(path);
 if(!images.has(src))images.set(src,loadImage(src));
 return images.get(src);
}
const canvas=()=>createCanvas(...ART_SIZE);
function clipped(ctx,path,draw){ctx.save();ctx.clip(new Path2D(path));draw();ctx.restore();}
function shadowed(ctx,draw,blur=4,dy=3,alpha=.25){
 ctx.save();ctx.shadowColor=`rgba(16,28,15,${alpha})`;ctx.shadowBlur=blur;ctx.shadowOffsetY=dy;draw();ctx.restore();
}
function tint(image,amount,gray=false){
 const surface=createCanvas(image.width,image.height);
 const ctx=surface.getContext('2d'),pixels=(()=>{ctx.drawImage(image,0,0);return ctx.getImageData(0,0,surface.width,surface.height);})();
 for(let i=0;i<pixels.data.length;i+=4){
  const p=pixels.data,y=.2126*p[i]+.7152*p[i+1]+.0722*p[i+2];
  for(let c=0;c<3;c++)p[i+c]=gray?p[i+c]*(1-amount)+y*amount:p[i+c]*amount;
 }
 ctx.putImageData(pixels,0,0);return surface;
}
function drawCrop(ctx,image,[sx,sy,w,h],x,y,width=w,height=h){
 const ratio=image.width/g.rigWidth;
 ctx.drawImage(image,sx*ratio,sy*ratio,w*ratio,h*ratio,x,y,width,height);
}

function laidCord(image,mobile,layout){
 const surface=createCanvas(1280,640);
 const ctx=surface.getContext('2d');ctx.translate(0,g.topPad);
 if(!mobile.join){ctx.transform(...layout.cordMatrix);ctx.drawImage(image,0,0,...mobile.cordSize);return surface;}
 const [ex,ey]=mobile.cordEnds[1],r=mobile.join.radius??160;
 const left=ex-r,top=ey-r,size=r*2,step=16;
 ctx.save();ctx.transform(...layout.cordMatrix);
 const outside=new Path2D();outside.rect(0,0,...mobile.cordSize);outside.rect(left,top,size,size);ctx.clip(outside,'evenodd');
 ctx.drawImage(image,0,0,...mobile.cordSize);ctx.restore();
 function triangle(points){
  const target=points.map(p=>mobileCordPoint(mobile,layout,p));
  const [p,q,r]=points,[u,v,w]=target,det=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);
  const a=((v[0]-u[0])*(r[1]-p[1])-(w[0]-u[0])*(q[1]-p[1]))/det;
  const b=((v[1]-u[1])*(r[1]-p[1])-(w[1]-u[1])*(q[1]-p[1]))/det;
  const c=((w[0]-u[0])*(q[0]-p[0])-(v[0]-u[0])*(r[0]-p[0]))/det;
  const d=((w[1]-u[1])*(q[0]-p[0])-(v[1]-u[1])*(r[0]-p[0]))/det;
  const center=[(u[0]+v[0]+w[0])/3,(u[1]+v[1]+w[1])/3];
  ctx.save();ctx.beginPath();
  target.forEach(([x,y],i)=>{const dx=x-center[0],dy=y-center[1],k=.35/Math.hypot(dx,dy);ctx[i?'lineTo':'moveTo'](x+dx*k,y+dy*k);});ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,d,u[0]-a*p[0]-c*p[1],u[1]-b*p[0]-d*p[1]);ctx.drawImage(image,0,0,...mobile.cordSize);ctx.restore();
 }
 for(let y=top;y<top+size;y+=step)for(let x=left;x<left+size;x+=step){
  const x2=Math.min(x+step,left+size),y2=Math.min(y+step,top+size);
  triangle([[x,y],[x2,y],[x,y2]]);triangle([[x2,y],[x2,y2],[x,y2]]);
 }
 return surface;
}

export async function paintDevice(shell,charm,coiled){
 const paths=[shell.image,charm.image,...(shell.buttonFinish?[shell.buttonFinish]:[]),...(coiled?[charm.mobileCord]:[])];
 // Release sources from the previous combination while building the catalog.
 const keep=new Set(paths.map(sourceURL));for(const key of images.keys())if(!keep.has(key))images.delete(key);
 const sources=await Promise.all(paths.map(imageFor)),source=new Map(paths.map((path,i)=>[path,sources[i]]));
 const surface=canvas(),ctx=surface.getContext('2d');
 if(!ctx)throw new Error('Device artwork is unavailable');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(0,g.topPad);
 const originalShell=source.get(shell.image),body=shell.code==='S01'?tint(originalShell,.28,true):originalShell;
 const rig=source.get(charm.image),ex=g.origin[0]+(g.eyelet[0]-g.origin[0])*g.bodyScale,ey=g.origin[1]+(g.eyelet[1]-g.origin[1])*g.bodyScale;
 const rigX=ex-charm.fit.anchor[0],rigY=ey-charm.fit.anchor[1];
 const bodyTransform=()=>{ctx.translate(g.origin[0]*(1-g.bodyScale),g.origin[1]*(1-g.bodyScale));ctx.scale(g.bodyScale,g.bodyScale);};
 const drawBody=()=>ctx.drawImage(body,0,0,1024,1536);
 ctx.save();bodyTransform();
 const shellPaint=()=>{
  if(shell.socketFit){
   clipped(ctx,'M0 0H195V189H300V0H1024V1536H0Z',drawBody);
   ctx.save();ctx.translate(253,189);ctx.scale(.87,.86);ctx.translate(-247,-189);
   clipped(ctx,'M207 130H289V189H207Z',drawBody);ctx.restore();
  }else drawBody();
 };
 shadowed(ctx,shellPaint,6,4,.25);
 if(shell.buttonFinish)clipped(ctx,g.keyFaces.join(' '),()=>ctx.drawImage(source.get(shell.buttonFinish),0,0,1024,1536));
 ctx.restore();
 if(coiled){
  const mobile=charm.mobileFit,layout=mobileCharmLayout(charm.fit,mobile),cord=tint(source.get(charm.mobileCord),.9);
  const laid=laidCord(cord,mobile,layout);shadowed(ctx,()=>ctx.drawImage(laid,0,-g.topPad),4,4,.25);laid.width=laid.height=1;cord.width=cord.height=1;
  ctx.save();ctx.translate(layout.left,layout.top);ctx.rotate(layout.angle*Math.PI/180);
  shadowed(ctx,()=>drawCrop(ctx,rig,mobile.crop,0,0),4,3,.3);ctx.restore();
  // The original knot covers the end of the laid cord, just as a real ferrule does.
  const head=createCanvas(...mobile.head),headCtx=head.getContext('2d');
  drawCrop(headCtx,rig,[0,0,...mobile.head],0,0);
  if(mobile.join){
   const fade=headCtx.createLinearGradient(mobile.head[0]-22,0,mobile.head[0],0);fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');
   headCtx.globalCompositeOperation='destination-in';headCtx.fillStyle=fade;headCtx.fillRect(0,0,...mobile.head);
  }
  shadowed(ctx,()=>ctx.drawImage(head,rigX,rigY),2,2,charm.fit.contact);head.width=head.height=1;
 }else{
  shadowed(ctx,()=>ctx.drawImage(rig,rigX,rigY,560,1120),5,3,.3);
 }
 // Restore only the near rim over the returning strand: no CSS mask/filter surface.
 ctx.save();ctx.translate(rigX,rigY);ctx.clip(new Path2D(charm.fit.rear));ctx.translate(-rigX,-rigY);bodyTransform();drawBody();ctx.restore();
 // The live HTML screen supplies its own background; leave its opening clear.
 ctx.save();bodyTransform();ctx.beginPath();ctx.roundRect(...g.screen,29);ctx.clip();ctx.clearRect(...g.screen);ctx.restore();
 if(body!==originalShell)body.width=body.height=1;
 try{return await surface.encode('webp',94);}
 finally{surface.width=surface.height=1;}
}
