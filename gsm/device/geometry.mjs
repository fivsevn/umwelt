export const geometry = {
  "screen": [
    262,
    355,
    557,
    754
  ],
  "bezel": [
    202,
    297,
    682,
    879
  ],
  "keys": [
    [
      351,
      1267
    ],
    [
      541,
      1284
    ],
    [
      744,
      1262
    ]
  ],
  "keyFaces": [
  "M322 1223 H379 Q383 1223 383 1228 Q383 1232 389 1233 H393 Q398 1233 398 1238 Q398 1242 403 1244 Q407 1244 407 1248 V1273 Q407 1277 402 1278 Q397 1279 396 1284 Q396 1288 391 1288 H388 Q383 1289 382 1294 Q381 1299 377 1299 H325 Q321 1299 320 1294 Q319 1289 314 1288 H309 Q305 1288 305 1284 Q304 1279 299 1278 Q293 1277 293 1273 V1248 Q293 1244 298 1243 Q303 1242 304 1238 Q304 1233 309 1233 H313 Q319 1232 319 1227 Q319 1223 322 1223 Z",
  "M509 1236 H574 Q578 1236 578 1241 Q578 1245 585 1246 H588 Q592 1246 593 1250 Q593 1255 598 1256 Q603 1257 604 1262 V1289 Q604 1295 598 1296 Q593 1297 592 1301 V1304 Q592 1308 586 1309 H581 Q575 1310 574 1315 Q574 1318 570 1318 H513 Q510 1318 509 1314 Q508 1310 501 1309 H497 Q491 1309 491 1304 V1301 Q491 1297 486 1297 Q479 1296 479 1291 V1263 Q479 1258 484 1257 Q490 1256 490 1251 Q491 1247 496 1246 H500 Q505 1245 505 1241 Q505 1236 509 1236 Z",
  "M715 1221 H772 Q776 1221 776 1226 Q776 1230 782 1231 H786 Q791 1231 791 1236 Q791 1240 796 1242 Q800 1242 800 1246 V1271 Q800 1275 795 1276 Q790 1277 789 1282 Q789 1286 784 1286 H781 Q776 1287 775 1292 Q774 1297 770 1297 H718 Q714 1297 713 1292 Q712 1287 707 1286 H702 Q698 1286 698 1282 Q697 1277 692 1276 Q686 1275 686 1271 V1246 Q686 1242 691 1241 Q696 1240 697 1236 Q697 1231 702 1231 H706 Q712 1230 712 1225 Q712 1221 715 1221 Z"
],
  "keySizes": [
    {
      "width": 133.5,
      "height": 98.25
    },
    {
      "width": 153,
      "height": 113.25
    },
    {
      "width": 133.5,
      "height": 98.25
    }
  ],
  "bodyScale": 0.95,
  "origin": [
    512,
    820
  ],
  "topPad": 160,
  "mobileView": [32, 24, 960, 1608],
  "canvas": [
    1280,
    1696
  ],
  "shellCanvas": [
    1024,
    1536
  ],
  "eyelet": [
    807,
    244
  ],
  "socket": [
    253,
    167.318
  ],
  "rigWidth": 560
};

// Keep the pendant at its original scale, and join the laid cord to the two
// existing attachment ends. Only the cord receives an affine transform.
export function mobileCharmLayout(fit,mobile){
 const [sx,sy,width,height]=mobile.crop,[left,top]=mobile.position;
 const radians=(mobile.angle??0)*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
 const tip=[mobile.tip[0]-sx,mobile.tip[1]-sy];
 const end=[left+cos*tip[0]-sin*tip[1],top+sin*tip[0]+cos*tip[1]];
 const eyelet=geometry.eyelet.map((v,i)=>geometry.origin[i]+(v-geometry.origin[i])*geometry.bodyScale);
 const start=eyelet.map((v,i)=>v-fit.anchor[i]+mobile.entry[i]);
 const [sourceStart,sourceEnd]=mobile.cordEnds,span=sourceStart[1]-sourceEnd[1];
 const a=mobile.cordScale??.5,b=mobile.cordShearY??0,c=(start[0]-end[0]-a*(sourceStart[0]-sourceEnd[0]))/span;
 const d=(start[1]-end[1]-b*(sourceStart[0]-sourceEnd[0]))/span,e=end[0]-a*sourceEnd[0]-c*sourceEnd[1],f=end[1]-b*sourceEnd[0]-d*sourceEnd[1];
 return {left,top,width,height,angle:mobile.angle??0,backgroundPosition:`${-sx}px ${-sy}px`,cordMatrix:[a,b,c,d,e,f],start,end};
}

// Key faces use absolute M/H/V/Q/Z coordinates on the shared shell artwork.
// Keep the same outline in the small button surface instead of clipping a full shell.
export function localKeyFace(index){
 const [x,y]=geometry.keys[index],{width,height}=geometry.keySizes[index];
 const offset=[x-width/2,y-height/2];
 return geometry.keyFaces[index].replace(/([MHVQLZ])([^MHVQLZ]*)/g,(_,command,values)=>{
  let coordinate=0;
  return command+values.replace(/-?\d+(?:\.\d+)?/g,value=>{
   const axis=command==='H'?0:command==='V'?1:coordinate++%2;
   return Number((Number(value)-offset[axis]).toFixed(3));
  });
 });
}

// Bend only the last cord section into the ferrule. End position and tangent
// are both constrained; the rest of the coil and the pendant stay unchanged.
export function mobileCordPoint(mobile,layout,[x,y]){
 const [a,b,c,d,e,f]=layout.cordMatrix,[ex,ey]=mobile.cordEnds[1];
 const base=[a*x+c*y+e,b*x+d*y+f];
 if(!mobile.join)return base;
 const radius=mobile.join.radius??300;
 const direction=mobile.join.sourceDirection??[.78,.63],length=Math.hypot(...direction);
 const [tx,ty]=direction.map(v=>v/length),dx=x-ex,dy=y-ey;
 const u=dx*tx+dy*ty,v=-dx*ty+dy*tx;
 const distance=Math.hypot(dx,dy);
 if(distance>=radius||u<=-radius)return base;
 const bx=a*tx+c*ty,by=b*tx+d*ty,speed=Math.hypot(bx,by);
 const target=(mobile.join.direction+(mobile.angle??0))*Math.PI/180,scale=mobile.join.scale??1;
 const vx=Math.cos(target)*speed*scale,vy=Math.sin(target)*speed*scale;
 const t=Math.min(1,1+u/radius),bend=t*t*(t-1),slope=3*t*t-2*t;
 const cx=layout.end[0]+bx*u+bend*radius*(vx-bx),cy=layout.end[1]+by*u+bend*radius*(vy-by);
 const angle=Math.atan2(by+slope*(vy-by),bx+slope*(vx-bx))-Math.atan2(by,bx);
 const nx=(-a*ty+c*tx)*v,ny=(-b*ty+d*tx)*v,width=1+(scale-1)*t*t*(3-2*t);
 // A Hermite bend matches both endpoint tangents without lifting the coil
 // into a loop. Rotate the original cross-section so its texture stays aligned.
 const bent=[cx+width*(Math.cos(angle)*nx-Math.sin(angle)*ny),cy+width*(Math.sin(angle)*nx+Math.cos(angle)*ny)];
 const edge=Math.max(0,(distance/radius-.75)/.25),blend=1-edge*edge*(3-2*edge);
 return base.map((value,i)=>value+(bent[i]-value)*blend);
}
