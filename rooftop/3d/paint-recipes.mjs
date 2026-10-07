// Small hand-authored clusters, generated in code. Every mark belongs to the
// material: wood runs along the board, leaves carry a midrib, metal wears at seams.
export const PAINT_RAMPS = {
  wood: ['#382c27','#694631','#997044','#c79a5b','#ebc78a'],
  metal: ['#252e38','#46535d','#73848b','#a2b1af','#d3d6bd'],
  wall: ['#555b5c','#83897e','#b0b2a0','#d0ccb5','#eee3c6'],
  leaf: ['#263b29','#435a32','#6a813c','#97ab56','#c7d187'],
  clay: ['#4e332e','#815039','#ae7950','#d0a077','#ebc698'],
};

export function paintTargets(kind) {
  if (/leaf|canopy|cactus/.test(kind)) return ['#233b32','#d0d987'];
  if (/wood|wicker|bag/.test(kind)) return ['#302a30','#f3d5a2'];
  if (/metal|water|glass/.test(kind)) return ['#273341','#e3edf0'];
  if (/clay|vessel|pot-/.test(kind)) return ['#392b30','#f8e6cd'];
  if (kind==='soil') return ['#292820','#b4a17b'];
  return ['#343d44','#f0efeb'];
}

export function referencePainting(kind) {
  if (!['wood','metal','wall','roof','brick','leaf','leafRigid','canopy','cactus',
    'clay','paint','cloth','enamel','soil','asphalt','wicker','water','petal'].includes(kind)) return null;
  const size=64, commands=[], add=(x,y,w,h,ink)=>commands.push([x,y,w,h,ink]);
  let ramp=PAINT_RAMPS.metal;
  if(kind==='wood'||kind==='wicker')ramp=PAINT_RAMPS.wood;
  else if(/leaf|canopy|cactus/.test(kind))ramp=PAINT_RAMPS.leaf;
  else if(kind==='clay'||kind==='brick')ramp=PAINT_RAMPS.clay;
  else if(kind==='wall'||kind==='roof')ramp=PAINT_RAMPS.wall;
  add(0,0,64,64,3);
  const cluster=(x,y,w,h,ink)=>{
    add(x,y,w,h,ink);add(x+2,y-2,Math.max(1,w-5),2,ink);
    add(x+3,y+h,Math.max(1,w-7),2,ink);
  };
  if(kind==='wood') {
    // One band describes ONE real board. Gaps and rebates belong to geometry,
    // never to a repeated picture of several boards pasted on every face.
    for(let row=0;row<4;row++) {
      const y=row*16;
      add(5+row*7,y+5,22-row*2,4,2);
      add(8+row*7,y+7,15-row,2,2);
      add(34-row*5,y+11,17,2,2);
      add(7+row*11,y+2,9,1,4);
      if(row===1) {add(40,y+8,5,1,1);add(39,y+9,8,1,2);}
      if(row===3) {add(14,y+12,6,1,1);add(12,y+13,11,1,2);}
    }
  } else if(kind==='metal'||kind==='paint'||kind==='enamel') {
    // Clean enamelled panels; scratches are sparse. Rivets, seams, handles and
    // recesses are actual parts, so arbitrary repeated seams are not painted here.
    add(6,12,13,2,4);add(40,43,11,3,2);
    add(43,46,6,1,2);
    if(kind==='metal') {add(17,52,6,1,4);add(51,9,3,1,2);}
    if(kind==='enamel') {add(2,59,5,2,1);add(3,58,3,1,2);}
  } else if(kind==='wall') {
    // Quiet plaster, with only isolated chips; broad masonry shade is lighting.
    cluster(8,41,9,3,2);cluster(45,11,8,2,2);
    add(30,58,6,1,4);add(17,44,2,1,1);
  } else if(kind==='brick'||kind==='roof') {
    const bw=kind==='roof'?8:16,bh=kind==='roof'?12:8;
    for(let row=0,y=0;y<64;row++,y+=bh)for(let x=-(row%2)*bw/2,k=0;x<64;x+=bw,k++) {
      add(x,y,bw,bh,0);add(x+1,y+1,bw-2,bh-2,(k+row)%3===0?2:3);
      add(x+1,y+1,bw-2,1,4);add(x+2,y+bh-2,bw-3,1,1);
      if((k+row)%2===0)add(x+2,y+3,Math.max(2,bw-5),2,2);
    }
  } else if(kind==='leaf'||kind==='leafRigid') {
    // Four-texel clusters create a different scale and softer mottling than furniture.
    add(0,0,64,64,2);add(32,0,32,64,3);
    cluster(3,10,20,12,1);cluster(8,38,17,13,3);
    cluster(39,5,17,13,4);cluster(42,32,21,12,2);
    cluster(35,51,17,10,4);add(29,0,3,64,1);add(32,0,2,64,4);
    for(let y=12;y<60;y+=16) {
      add(17,y,12,3,2);add(9,y+3,8,3,2);
      add(34,y+2,12,2,3);add(46,y+4,9,2,3);
    }
    if(kind==='leafRigid') {add(6,25,10,4,4);add(50,44,10,4,1);}
  } else if(kind==='canopy') {
    add(0,0,64,64,1);
    for(let j=0;j<20;j++) {
      const x=(j*19+3)%57,y=(j*13+4)%58;
      cluster(x,y,7+j%4,4+j%3,j%4===0?4:j%3===0?2:3);
      add(x+2,y+5,5,2,0);
    }
  } else if(kind==='cactus') {
    add(0,0,64,64,2);
    for(let x=0;x<64;x+=16) {
      add(x,0,4,64,0);add(x+4,0,4,64,1);add(x+8,0,4,64,3);
      cluster(x+8,13,5,13,4);cluster(x+9,43,5,9,3);
      for(let y=5;y<64;y+=16){add(x+10,y,3,3,4);add(x+11,y+3,1,3,1);}
    }
  } else if(kind==='cloth') {
    // Broad folds, no fine wire-like grid over bedding and cushions.
    add(7,8,14,5,4);add(10,13,8,2,4);
    add(42,37,13,7,2);add(44,44,8,2,2);
    add(19,54,17,2,2);
  } else if(kind==='wicker') {
    for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8) {
      add(x,y,7,7,(x+y)%16?2:3);add(x,y,6,2,4);
      add(x+6,y+2,1,5,0);add(x+1,y+6,5,1,1);
    }
  } else if(kind==='soil'||kind==='asphalt') {
    add(0,0,64,64,2);
    for(let j=0;j<28;j++) {
      const x=(j*23+3)%60,y=(j*17+11)%61;
      cluster(x,y,3+j%4,2+j%2,j%5);
    }
    if(kind==='soil')for(const [x,y] of [[6,8],[31,28],[47,48]]) {
      add(x,y,5,1,0);add(x+4,y+1,1,4,0);add(x+5,y+4,6,1,0);
      add(x+4,y+5,1,3,1);add(x+9,y+3,1,3,0);
      add(x+1,y+1,3,1,3);
    }
  } else if(kind==='clay') {
    add(0,4,64,3,4);add(0,7,64,2,2);add(0,52,64,3,1);
    cluster(7,17,15,10,2);cluster(37,31,20,8,4);cluster(12,43,13,6,1);
    add(3,11,16,2,4);add(43,57,14,2,2);
  } else if(kind==='water') {
    add(0,0,64,64,2);
    for(const [x,y,w] of [[3,10,23],[26,31,29],[8,53,19]]) {
      add(x,y,w,3,3);add(x+4,y+3,w-8,2,4);add(x+w,y-2,5,2,1);
    }
  } else if(kind==='petal') {
    add(0,0,64,64,3);cluster(3,8,20,16,4);cluster(38,35,20,17,2);
    add(0,53,64,6,1);add(0,59,64,5,2);
  }
  return {size,ramp,commands};
}

export function paintPaving(ctx,width,height) {
  const colors=['#c5c4b5','#d1cdbd','#bfbfb3','#ccc8b9','#c8c8bc','#b7bcb2'];
  for(let y=0;y<height;y+=16)for(let x=0;x<width;x+=16) {
    const cell=x/16*11+y/16*7;
    ctx.fillStyle='#838d87';ctx.fillRect(x,y,16,16);
    ctx.fillStyle=colors[cell%colors.length];ctx.fillRect(x+1,y+1,15,15);
    ctx.fillStyle='#e0ded1';ctx.fillRect(x+1,y+1,14,1);
    ctx.fillStyle='#a7aea1';ctx.fillRect(x+14,y+3,1,12);
    if(cell%7===0){ctx.fillStyle='#b6bbab';ctx.fillRect(x+3,y+10,5,2);}
    if(cell%17===0){ctx.fillStyle='#70856c';ctx.fillRect(x,y+10,2,4);ctx.fillRect(x+1,y+12,3,3);}
  }
}
