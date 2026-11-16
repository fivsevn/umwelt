import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {createCanvas,loadImage,Path2D}=createRequire(new URL('./engine/package.json',import.meta.url))('@napi-rs/canvas');
import {geometry as g,mobileCharmLayout} from '../device/geometry.mjs';

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
export async function paintDevice(shell,charm,coiled){
 const paths=[shell.image,coiled?charm.mobileImage:charm.image,...(shell.buttonFinish?[shell.buttonFinish]:[])];
 // Release sources from the previous combination while building the catalog.
 const keep=new Set(paths.map(sourceURL));for(const key of images.keys())if(!keep.has(key))images.delete(key);
 const sources=await Promise.all(paths.map(imageFor)),source=new Map(paths.map((path,i)=>[path,sources[i]]));
 const surface=canvas(),ctx=surface.getContext('2d');
 if(!ctx)throw new Error('Device artwork is unavailable');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(0,g.topPad);
 const originalShell=source.get(shell.image),body=shell.code==='S01'?tint(originalShell,.28,true):originalShell;
 const rig=source.get(coiled?charm.mobileImage:charm.image),ex=g.origin[0]+(g.eyelet[0]-g.origin[0])*g.bodyScale,ey=g.origin[1]+(g.eyelet[1]-g.origin[1])*g.bodyScale;
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
  const layout=mobileCharmLayout(charm.mobileFit);
  ctx.save();ctx.translate(layout.left,layout.top);ctx.rotate(layout.angle);
  shadowed(ctx,()=>ctx.drawImage(rig,0,0,layout.width,layout.height),4,3,.28);ctx.restore();
 }else{
  shadowed(ctx,()=>ctx.drawImage(rig,rigX,rigY,560,1120),5,3,.3);
 }
 // The returning half of the mounting loop passes behind the solid eyelet.
 // Keep this occlusion local to the real shell rim; the cord stays one image.
 ctx.save();
 if(coiled){
  const [sx,sy]=charm.mobileFit.exit,angle=(charm.mobileFit.angle??0)*Math.PI/180;
  const dx=Math.cos(angle)*sx-Math.sin(angle)*sy,dy=Math.sin(angle)*sx+Math.cos(angle)*sy;
  const length=Math.hypot(dx,dy),vx=dx/length,vy=dy/length,side=Math.sign(dx)||1;
  const nx=-vy*side,ny=vx*side,offset=charm.mobileFit.rearOffset??0,px=ex+nx*offset,py=ey+ny*offset;
  ctx.beginPath();ctx.arc(ex,ey,56,0,Math.PI*2);ctx.clip();
  ctx.beginPath();ctx.moveTo(px-vx*80,py-vy*80);ctx.lineTo(px+vx*80,py+vy*80);
  ctx.lineTo(px+vx*80-nx*80,py+vy*80-ny*80);ctx.lineTo(px-vx*80-nx*80,py-vy*80-ny*80);ctx.closePath();ctx.clip();
 }else{ctx.translate(rigX,rigY);ctx.clip(new Path2D(charm.fit.rear));ctx.translate(-rigX,-rigY);}
 bodyTransform();drawBody();ctx.restore();
 // The live HTML screen supplies its own background; leave its opening clear.
 ctx.save();bodyTransform();ctx.beginPath();ctx.roundRect(...g.screen,29);ctx.clip();ctx.clearRect(...g.screen);ctx.restore();
 if(body!==originalShell)body.width=body.height=1;
 try{return await surface.encode('webp',94);}
 finally{surface.width=surface.height=1;}
}
