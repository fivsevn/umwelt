// Two 96px shade/tint tiles, generated once. No image downloads, blur filters or per-frame pixel scans.
export function caveIllumination(x,y){
 const r=Math.hypot(x,y),angle=Math.atan2(y,x);
 const edge=1+.025*Math.sin(angle*3)+.018*Math.cos(angle*5);
 const falloff=Math.max(0,Math.min(1,(edge-r)/.26));
 const core=.78+.10*Math.cos(x*3+y*2)+.07*Math.sin(y*5-x*2);
 return Math.max(0,Math.min(1,falloff*core));
}
export function createCaveLightTexture(doc){
 const tile=doc.createElement('canvas');tile.width=tile.height=96;
 const g=tile.getContext('2d'),data=g.createImageData(96,96);
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const light=caveIllumination((x-47.5)/44,(y-47.5)/44),i=(y*96+x)*4;
  data.data[i]=3;data.data[i+1]=6;data.data[i+2]=5;
  data.data[i+3]=light===0?Math.round(.68*255):Math.round(Math.max(0,.68-light*.8)*32)/32*255;
 }
 g.putImageData(data,0,0);
 const warm=doc.createElement('canvas');warm.width=warm.height=96;const tint=warm.getContext('2d');
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;data.data[i]=231;data.data[i+1]=220;data.data[i+2]=168;data.data[i+3]=Math.round(caveIllumination((x-47.5)/44,(y-47.5)/44)*.13*255)}
 tint.putImageData(data,0,0);tile.warm=warm;return tile;
}
export function caveMotes(time,width,height,beam){
 const cx=beam.x/100*width,cy=beam.y/100*height,r=beam.size/100*width/2,points=[];
 // Positions belong to the scene, never to the moving torch. Slow drift is independent of animal speed.
 for(let i=0;i<62;i++){
  const x=((i*97.31+Math.sin(time*.12+i)*3+time*(.35+i%3*.09))%width+width)%width;
  const y=((i*61.73+time*(.48+i%5*.11))%height+height)%height;
  const light=caveIllumination((x-cx)/r,(y-cy)/r);
  if(light>.12)points.push({x:Math.floor(x),y:Math.floor(y),alpha:light*(.21+(i%4)*.055),size:i%11===0?2:1});
 }
 return points;
}
export function drawCaveLight(g,tile,beam,time,lightsOut){
 const {width,height}=g.canvas;g.clearRect(0,0,width,height);g.imageSmoothingEnabled=false;
 g.fillStyle=lightsOut?'rgba(3,6,5,.76)':'rgba(3,6,5,.68)';g.fillRect(0,0,width,height);
 if(lightsOut)return;
 const r=beam.size/100*width/2,size=Math.round(r*96/44),x=Math.round(beam.x/100*width-size/2),y=Math.round(beam.y/100*height-size/2);
 g.clearRect(x,y,size,size);g.drawImage(tile,x,y,size,size);g.drawImage(tile.warm,x,y,size,size);
 for(const p of caveMotes(time,width,height,beam)){
  g.fillStyle=`rgba(204,207,170,${p.alpha})`;g.fillRect(p.x,p.y,p.size,1);
 }
}
