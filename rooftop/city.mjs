// One continuous city layer: whole buildings may leave the viewport, never a scene-tile seam.
const BLOCKS=[[-20,-20,130,105],[145,-18,106,77],[429,-29,173,127],[-35,162,137,145],[516,173,150,121],[22,385,108,126],[154,394,181,133],[495,368,177,147]];
const random=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
const overlaps=(a,b,pad=0)=>a[0]<b[0]+b[2]+pad&&a[0]+a[2]+pad>b[0]&&a[1]<b[1]+b[3]+pad&&a[1]+a[3]+pad>b[1];
export function buildingWindows(w,h){const cols=Math.max(1,Math.floor((w-16)/23)),rows=Math.max(1,Math.floor((h-42)/26)),left=Math.floor((w-(cols-1)*23-13)/2);return Array.from({length:rows},(_,row)=>Array.from({length:cols},(_,col)=>({x:left+col*23,y:35+row*26}))).flat()}
function building(c,block,seed,upright){let [x,y,w,h]=block;const rng=random(seed);c.save();if(upright){c.translate(x+w/2,y+h/2);c.rotate(-Math.PI/2);[w,h]=[h,w];x=-w/2;y=-h/2}
 rect(c,x+6,y+10,w,h,'#606c62');rect(c,x,y,w,h,'#a69575');rect(c,x+w-4,y,4,h,'#817b63');rect(c,x,y+h-3,w,3,'#8f8269');
 // Wear stays on the wall, behind the windows, with an intact building silhouette.
 for(let i=0;i<100;i++)rect(c,x+3+rng()*(w-8),y+30+rng()*(h-35),2,2,rng()<.5?'#b0a183':'#948f73');
 rect(c,x-3,y-6,w+6,31,'#485e52');rect(c,x-3,y-6,w+6,2,'#839074');rect(c,x-3,y+23,w+6,2,'#354e43');
 for(let k=0;k<5;k++)rect(c,x-2,y-2+k*5,w+4,1,'#6d8061');for(let j=8;j<w;j+=18)rect(c,x+j,y-4,1,27,'#344f43');
 for(const win of buildingWindows(w,h)){const wx=x+win.x,wy=y+win.y;rect(c,wx-1,wy-1,15,18,'#7f8c73');rect(c,wx,wy,13,16,'#365c54');rect(c,wx+2,wy+1,4,13,'#91a48b');rect(c,wx+8,wy+1,1,13,'#c5ba94');rect(c,wx-2,wy+16,17,2,'#b5a480');if(wy+25<y+h-5&&rng()<.28){rect(c,wx+1,wy+20,12,5,'#ac9c78');rect(c,wx+3,wy+21,7,2,'#547c52')}}c.restore()}
export function paintCity(c,bounds,{uprightCity=false}={}){rect(c,bounds.x,bounds.y,bounds.w,bounds.h,'#899cbc');const blocks=BLOCKS.map((b,i)=>({block:b,seed:1826+i*7919}));for(let row=Math.floor(bounds.y/160)-1;row<=Math.ceil((bounds.y+bounds.h)/160);row++)for(let col=Math.floor(bounds.x/176)-1;col<=Math.ceil((bounds.x+bounds.w)/176);col++){const seed=(row*8147+col*1901+1826)>>>0,rng=random(seed),block=[col*176+Math.floor(rng()*18),row*160+Math.floor(rng()*20),96+Math.floor(rng()*38),89+Math.floor(rng()*25)];const [x,y,w,h]=block;if(x+w/2>=0&&x+w/2<=640&&y+h/2>=0&&y+h/2<=520)continue;if(BLOCKS.some(b=>overlaps(block,b,18))||overlaps(block,[112,56,384,432],20))continue;blocks.push({block,seed})}
 for(const {block,seed} of blocks)if(overlaps(block,[bounds.x-20,bounds.y-20,bounds.w+40,bounds.h+40]))building(c,block,seed,uprightCity);
 const rng=random(1987);for(let i=0;i<100;i++)rect(c,38+rng()*70,318+rng()*53,3+rng()*4,3+rng()*4,['#6f8b4e','#8da753','#5d824c'][Math.floor(rng()*3)]);
}
