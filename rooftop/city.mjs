// One continuous city layer: whole buildings may leave the viewport, never a scene-tile seam.
const BLOCKS=[[-20,-20,130,105],[145,-18,106,77],[429,-29,173,127],[-35,162,137,145],[516,173,150,121],[22,385,108,126],[154,394,181,133],[495,368,177,147]];
const random=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const overlaps=(a,b,pad=0)=>a[0]<b[0]+b[2]+pad&&a[0]+a[2]+pad>b[0]&&a[1]<b[1]+b[3]+pad&&a[1]+a[3]+pad>b[1];
export function buildingWindows(w,h){const cols=Math.max(1,Math.floor((w-16)/23)),rows=Math.max(1,Math.floor((h-42)/26)),left=Math.floor((w-(cols-1)*23-13)/2);return Array.from({length:rows},(_,row)=>Array.from({length:cols},(_,col)=>({x:left+col*23,y:35+row*26}))).flat()}
function building(c,block,seed,upright){let [x,y,w,h]=block;const rng=random(seed);c.save();if(upright){c.translate(x+w/2,y+h/2);c.rotate(-Math.PI/2);[w,h]=[h,w];x=-w/2;y=-h/2}
 rect(c,x+6,y+10,w,h,'#929a8f');rect(c,x,y,w,h,'#afb0a1');rect(c,x+w-4,y,4,h,'#9ca596');rect(c,x,y+h-3,w,3,'#a5ab9b');
 // Wear stays on the wall, behind the windows, with an intact building silhouette.
 for(let i=0;i<100;i++)rect(c,x+3+rng()*(w-8),y+30+rng()*(h-35),2,2,rng()<.5?'#b9b9a7':'#a3aa99');
 rect(c,x-3,y-6,w+6,31,'#8b9487');rect(c,x-3,y-6,w+6,2,'#b0b49f');rect(c,x-3,y+23,w+6,2,'#798778');
 for(let k=0;k<5;k++)rect(c,x-2,y-2+k*5,w+4,1,'#a4ad9a');for(let j=8;j<w;j+=18)rect(c,x+j,y-4,1,27,'#828f7e');
 // Rooftop vents, a water tank and a slender aerial belong to the same building.
 if(w>115){rect(c,x+w-23,y-12,14,9,'#929b91');rect(c,x+w-22,y-13,12,2,'#bbc0ad');rect(c,x+w-17,y-4,2,5,'#788478')}
 rect(c,x+18,y-15,1,10,'#818a80');rect(c,x+13,y-12,11,1,'#939b8d');rect(c,x+8,y+4,14,7,'#9aa18f');rect(c,x+10,y+5,10,1,'#bac0aa');
 for(const win of buildingWindows(w,h)){const wx=x+win.x,wy=y+win.y;rect(c,wx-1,wy-1,15,18,'#a0a998');rect(c,wx,wy,13,16,'#87988d');rect(c,wx+2,wy+1,4,13,'#c0c5b0');rect(c,wx+8,wy+1,1,13,'#d0cbb5');rect(c,wx-2,wy+16,17,2,'#c1bfa8');if(rng()<.34){rect(c,wx+2,wy+2,2,10,'#aab3a1');rect(c,wx+10,wy+3,1,9,'#a3ae9e')}
 if(rng()<.15){rect(c,wx+3,wy+14,6,2,'#927b62');rect(c,wx+4,wy+11,2,3,'#7a8b6c')}
 if(wy+25<y+h-5&&rng()<.28){rect(c,wx+1,wy+20,12,5,'#c2c1ac');rect(c,wx+3,wy+21,7,2,'#9ba696')}}c.restore()}
function cityBlocks(bounds){const blocks=BLOCKS.map((b,i)=>({block:b,seed:1826+i*7919}));for(let row=Math.floor(bounds.y/160)-1;row<=Math.ceil((bounds.y+bounds.h)/160);row++)for(let col=Math.floor(bounds.x/176)-1;col<=Math.ceil((bounds.x+bounds.w)/176);col++){const seed=(row*8147+col*1901+1826)>>>0,rng=random(seed),block=[col*176+Math.floor(rng()*18),row*160+Math.floor(rng()*20),96+Math.floor(rng()*38),89+Math.floor(rng()*25)];const [x,y,w,h]=block;if(x+w/2>=0&&x+w/2<=640&&y+h/2>=0&&y+h/2<=520)continue;if(BLOCKS.some(b=>overlaps(block,b,18))||overlaps(block,[112,56,384,432],20))continue;blocks.push({block,seed})}
return blocks;}
export function paintCity(c,bounds,{uprightCity=false,sky=true}={}){if(sky)rect(c,bounds.x,bounds.y,bounds.w,bounds.h,'#bdc2ca');const blocks=cityBlocks(bounds);
 for(const {block,seed} of blocks)if(overlaps(block,[bounds.x-20,bounds.y-20,bounds.w+40,bounds.h+40]))building(c,block,seed,uprightCity);
 const rng=random(1987);for(let i=0;i<100;i++)rect(c,38+rng()*70,318+rng()*53,3+rng()*4,3+rng()*4,['#8c987e','#a1aa8d','#819279'][Math.floor(rng()*3)]);
}

// The same deterministic window sample is used at every hour: late-night lights
// are a subset of the evening lights, so homes go dark without shuffling rooms.
export function litWindows(bounds,lamps,{uprightCity=false}={}){const result=[];for(const {block,seed} of cityBlocks(bounds)){let [x,y,w,h]=block;const turned=uprightCity;if(turned)[w,h]=[h,w];let index=0;for(const win of buildingWindows(w,h)){const value=(((seed+ ++index*1103515245)>>>0)%1000)/1000;if(value>=lamps)continue;const world=turned?{x:block[0]+block[2]/2+win.y-h/2,y:block[1]+block[3]/2-win.x+w/2}:{x:x+win.x,y:y+win.y};result.push({...world,seed,index,turned,block,local:win,w,h})}}return result}
export function paintCityLights(c,bounds,lamps,options={}){if(lamps<.001)return;for(const win of litWindows(bounds,lamps,options)){c.save();if(win.turned){c.translate(win.block[0]+win.block[2]/2,win.block[1]+win.block[3]/2);c.rotate(-Math.PI/2);c.translate(-win.w/2,-win.h/2)}else c.translate(win.block[0],win.block[1]);const {x,y}=win.local;const tone=win.index%3?'#bbb18b':'#a6b5aa';c.globalAlpha=.1;rect(c,x-3,y-2,19,21,tone);c.globalAlpha=.85;rect(c,x+2,y+2,4,12,tone);rect(c,x+8,y+2,3,12,win.index%4?'#ad9c74':'#c4b699');rect(c,x+3,y+4,3,1,'#d0c5a0');rect(c,x+9,y+10,2,4,'#8a805e');c.restore()}}
