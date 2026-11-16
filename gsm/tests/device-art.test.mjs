import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {shells,charms} from '../device/catalog.mjs';
import {geometry,mobileCharmLayout} from '../device/geometry.mjs';
import {paintDevice,ART_SIZE} from '../tools/paint-device.mjs';
const sharp=createRequire(new URL('../tools/engine/package.json',import.meta.url))('sharp');

test('complete mobile attachments have clear negative space and one connected silhouette',async()=>{
 for(const charm of charms){
  const image=sharp(fileURLToPath(new URL(charm.mobileImage,new URL('../device/catalog.mjs',import.meta.url))));
  const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],[1280,1280]);
  const alpha=(x,y)=>data[(y*info.width+x)*4+3];
  for(const [x,y] of [[0,0],[350,300],[640,1200]])assert.equal(alpha(x,y),0,`${charm.id}: background and loop interior have no haze or backdrop`);
  const frame=mobileCharmLayout(charm.mobileFit),co=Math.cos(frame.angle),si=Math.sin(frame.angle),[viewX,viewY,viewWidth]=geometry.mobileView;
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(alpha(x,y)>=96){
   const sx=x*frame.width/info.width,sy=y*frame.height/info.height,px=frame.left+co*sx-si*sy,py=frame.top+si*sx+co*sy;
   left=Math.min(left,px);top=Math.min(top,py);right=Math.max(right,px);bottom=Math.max(bottom,py);
  }
  assert.ok(left>=viewX,`${charm.id}: the complete cord fits the left edge`);
  assert.ok(right<=viewX+viewWidth,`${charm.id}: the complete cord fits the right edge`);
  assert.ok(top>=viewY-geometry.topPad-1,`${charm.id}: the whole top arc fits without being clipped`);
  assert.ok(bottom<350,`${charm.id}: the attachment stays clear of the screen`);
  const seen=new Uint8Array(info.width*info.height),queue=new Int32Array(seen.length),components=[];
  for(let start=0;start<seen.length;start++){
   if(seen[start]||data[start*4+3]<96)continue;
   let read=0,write=1;queue[0]=start;seen[start]=1;
   while(read<write){
    const point=queue[read++],x=point%info.width,y=Math.floor(point/info.width);
    for(const next of [x>0?point-1:-1,x+1<info.width?point+1:-1,y>0?point-info.width:-1,y+1<info.height?point+info.width:-1]){
     if(next>=0&&!seen[next]&&data[next*4+3]>=96){seen[next]=1;queue[write++]=next;}
    }
   }
   if(write>100)components.push(write);
  }
  components.sort((a,b)=>b-a);
  assert.ok(components[0]>30_000,`${charm.id}: the full attachment has substantial artwork`);
  assert.ok(components.slice(1).reduce((sum,size)=>sum+size,0)<components[0]*.005,`${charm.id}: rope and hardware stay connected without detached fragments`);
 }
});

test('published device artwork is a bounded WebP with an open native screen',async()=>{
 for(const [shell,charm,mobile] of [[shells[0],charms[0],true],[shells[1],charms[2],true],[shells[5],charms[7],false]]){
  const output=await paintDevice(shell,charm,mobile),image=sharp(output),meta=await image.metadata();
  assert.equal(meta.format,'webp');assert.deepEqual([meta.width,meta.height],ART_SIZE);
  assert.ok(output.length<400_000,'one selected composite stays below 400 KB');
  const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>data[(y*info.width+x)*4+3];
  assert.equal(alpha(540,900),0,'the LCD opening remains transparent');
  assert.equal(alpha(245,100),0,'shared antennas remain separate from shell/charm composites');
  assert.ok(alpha(520,1480)>240,'the device body is present');
 }
});
