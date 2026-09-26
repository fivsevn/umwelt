// Shared procedural geometry: the painted blade, contact surface and hit mask
// use the same integer pixels. No imported images or canvas readbacks.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(n,s)=>{let x=Math.imul(n+1,374761393)^s;x=Math.imul(x^(x>>>13),1274126177);return (x^(x>>>16))>>>0};
export function surfacePoint(surface,t){
 const q=clamp(t,0,1)*(surface.length-1),i=Math.min(surface.length-2,Math.floor(q)),f=q-i,a=surface[i],b=surface[i+1];
 return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,a:Math.atan2(b.y-a.y,b.x-a.x)};
}
function polygon(cells,points,seed,ramp){
 const minY=Math.floor(Math.min(...points.map(p=>p.y))),maxY=Math.ceil(Math.max(...points.map(p=>p.y)));
 for(let y=minY;y<=maxY;y++){
  const cuts=[];
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j];if((a.y>y+.5)!==(b.y>y+.5))cuts.push(a.x+(y+.5-a.y)/(b.y-a.y)*(b.x-a.x));
  }
  cuts.sort((a,b)=>a-b);
  for(let i=0;i+1<cuts.length;i+=2)for(let x=Math.ceil(cuts[i]);x<cuts[i+1];x++){
   const n=hash(x*31+y*97,seed),color=n%23===0?ramp[2]:x<(cuts[i]+cuts[i+1])/2?ramp[0]:ramp[1];
   cells.set(x+','+y,[x,y,color]);
  }
 }
}
function line(cells,a,b,width,color){
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
 for(let i=0;i<=steps;i++){const x=Math.round(a.x+(b.x-a.x)*i/steps),y=Math.round(a.y+(b.y-a.y)*i/steps);for(let j=0;j<width;j++)cells.set((x+j)+','+y,[x+j,y,color])}
}
export function kelpGeometry(item,{time=0,flow=item.flow??46,motion=1,bend=0}={}){
 const {x=0,y=0,a=0,scale=1,height=100,seed=0}=item,flip=item.flipX?-1:1,ca=Math.cos(a),sa=Math.sin(a),cells=new Map();
 const transform=(u,v)=>{u*=flip;return {x:x+(u*ca-v*sa)*scale,y:y+(u*sa+v*ca)*scale}};
 const drift=t=>Math.sin(t*5.5+seed*.41)*(2.2+t*4)+motion*(Math.sin(time*.48+seed*.071)*9+Math.sin(time*.29+seed*.13+t*1.8)*3)*(flow/55)*t*t+bend*t*t;
 const stem=Array.from({length:21},(_,i)=>transform(drift(i/20),-height*i/20));
 const near=item.z>=60,ramp=near?['#8e9759','#627641','#aeb076']:item.z<30?['#71864f','#4b673e','#929e63']:['#859453','#5c7541','#a4ab6b'];
 for(let i=1;i<stem.length;i++)line(cells,stem[i-1],stem[i],Math.max(1,Math.round(scale)),ramp[1]);
 const surfaces=[stem],joins=[0];
 for(let j=13,i=0;j<height+8;j+=17,i++){
  const root=clamp(j/height,0,1),side=(i+seed)&1?1:-1,len=((near?29:23)+hash(i,seed)%13)*.92,width=((near?9:5)+hash(i+21,seed)%4)*.72;
  const theta=side>0?-.65:Math.PI+.65,local=[];
  for(let k=0;k<=8;k++){const t=k/8,lag=Math.sin(time*.63+seed*.071+root*1.9)*motion*t*t*2.5;local.push(transform(drift(root)+Math.cos(theta)*len*t+lag,-height*root+Math.sin(theta)*len*t))}
  const points=[];
  for(const sign of [-1,1])for(let k=0;k<local.length;k++){
   const idx=sign<0?k:local.length-1-k,t=idx/8,p=local[idx],before=local[Math.max(0,idx-1)],after=local[Math.min(8,idx+1)],angle=Math.atan2(after.y-before.y,after.x-before.x),w=Math.pow(Math.sin(Math.PI*t),.8)*width*scale;
   points.push({x:p.x-Math.sin(angle)*w*sign,y:p.y+Math.cos(angle)*w*sign});
  }
  polygon(cells,points,seed+i,ramp);
  for(let k=1;k<local.length;k++)line(cells,local[k-1],local[k],1,ramp[2]);
  surfaces.push(local);joins.push(root);
 }
 return {id:item.id,z:item.z??40,item,cells:[...cells.values()],surfaces,joins};
}
const buffers=new WeakMap();
export function drawKelp(g,geometry){
 // One composite shadow per plant when called by the environment editor.
 if((g.shadowBlur>0||g.shadowOffsetY>0)&&typeof document!=='undefined'){
  let canvas=buffers.get(g);if(!canvas){canvas=document.createElement('canvas');canvas.width=384;canvas.height=430;buffers.set(g,canvas)}
  const c=canvas.getContext('2d');c.clearRect(0,0,384,430);paint(c,geometry);g.drawImage(canvas,0,0);
 }else paint(g,geometry);
}
function paint(g,geometry){
 // Cells are unique, so grouping the palette preserves the exact painted pixels
 // while avoiding thousands of Canvas fillStyle changes for every moving blade.
 const colors=new Map();
 for(const [x,y,color] of geometry.cells){let pixels=colors.get(color);if(!pixels){pixels=[];colors.set(color,pixels)}pixels.push(x,y)}
 for(const [color,pixels] of colors){g.fillStyle=color;for(let i=0;i<pixels.length;i+=2)g.fillRect(pixels[i],pixels[i+1],1,1)}
}
export function kelpDepth(geometry,width=384,height=430,target=null,base=null,ownerOffset=0){
 const depth=target?.depth??new Float32Array(width*height);
 const owners=target?.owners??new Int16Array(width*height);
 if(base){depth.set(base.depth);owners.set(base.owners)}else{depth.fill(-Infinity);owners.fill(-1)}
 geometry.forEach((plant,i)=>{const owner=Array.isArray(ownerOffset)?ownerOffset[i]:i+ownerOffset;for(const [x,y] of plant.cells)if(x>=0&&x<width&&y>=0&&y<height){const p=y*width+x;if(plant.z>depth[p]||(plant.z===depth[p]&&owner>=owners[p])){depth[p]=plant.z;owners[p]=owner}}});
 return {depth,owners,width,height};
}
export function visibleKelpCell(mask,x,y,z){x=Math.round(x);y=Math.round(y);return x<0||y<0||x>=mask.width||y>=mask.height||mask.depth[y*mask.width+x]<=z}
export function hitKelp(frame,point){
 // A small touch margin applies to plants, never through the visible front leaf.
 for(let r=0;r<=3;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const x=Math.round(point.x)+dx,y=Math.round(point.y)+dy;
  if(x>=0&&x<384&&y>=0&&y<430){const i=frame.mask.owners[y*384+x];if(i>=0)return frame.plants[i].item.interactive===false?null:frame.plants[i]}
 }
 return null;
}
