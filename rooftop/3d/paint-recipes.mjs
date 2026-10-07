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
  if (/wood|wicker|bag/.test(kind)) return ['#3a2928','#ecc88f'];
  if (/metal|water|glass/.test(kind)) return ['#273341','#d0dbd0'];
  if (/clay|vessel|pot-/.test(kind)) return ['#502e29','#f2dbb4'];
  if (kind==='soil') return ['#292820','#b4a17b'];
  return ['#343d44','#eee2c1'];
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
    // Uneven broad grain, end joins and dark rebates; the grain never reads as wire mesh.
    for(let row=0;row<4;row++) {
      const y=row*16;
      add(0,y,64,1,0);add(0,y+1,64,1,4);add(0,y+14,64,2,1);
      const join=[11,43,25,57][row];add(join,y+2,1,12,1);
      cluster((row*17+3)%47,y+5,15,3,2);
      cluster((row*13+27)%47,y+9,17,2,row%2?2:1);
      add((row*11+7)%45,y+3,19,1,4);
      add((row*7+33)%51,y+12,12,1,2);
    }
    for(const [x,y] of [[24,9],[46,40]]) {
      add(x-4,y,9,1,1);add(x-2,y+1,5,2,0);
      add(x-6,y+3,13,1,2);add(x-2,y+4,7,1,4);
    }
  } else if(kind==='metal'||kind==='paint'||kind==='enamel') {
    add(0,0,64,2,4);add(0,62,64,2,1);
    add(0,2,2,60,2);add(61,3,2,59,1);
    cluster(5,5,18,4,4);cluster(34,18,16,7,2);
    cluster(12,41,24,5,2);cluster(40,53,12,3,4);
    if(kind==='metal') {
      add(27,0,2,64,1);add(29,0,1,64,4);
      for(const [x,y] of [[7,22],[54,42]]) {
        add(x,y,3,3,0);add(x,y,2,1,4);add(x+3,y+2,3,1,2);
      }
    }
    if(kind==='enamel') {
      for(const [x,y] of [[1,14],[58,46],[22,61]]) {
        add(x,y,5,2,0);add(x+2,y-1,4,1,2);
      }
    }
  } else if(kind==='wall') {
    // Large plaster repairs and the quiet area between them, rather than peppered noise.
    cluster(3,12,17,8,2);cluster(39,35,23,7,2);cluster(22,56,16,4,2);
    add(7,17,10,2,1);add(43,40,13,2,1);
    add(27,5,14,2,4);add(46,12,10,3,4);
    add(30,23,1,7,1);add(31,30,3,1,1);add(33,31,1,6,1);
    for(const [x,y] of [[14,29],[49,51],[21,48]]) {
      add(x,y,3,1,2);add(x+2,y+1,2,1,3);
    }
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
    cluster(3,6,15,17,4);cluster(38,35,20,12,2);cluster(19,52,16,8,1);
    for(let x=0;x<64;x+=16){add(x,0,2,64,2);add(x+2,0,1,64,4);}
    for(let y=0;y<64;y+=16)add(0,y,64,2,2);
    add(5,4,54,1,4);add(4,58,55,2,1);
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
  const colors=['#bbb6a4','#c8c0a9','#b8b6a6','#c5bba4','#bfbca9','#afaf9f'];
  for(let y=0;y<height;y+=16)for(let x=0;x<width;x+=16) {
    const cell=x/16*11+y/16*7;
    ctx.fillStyle='#777d74';ctx.fillRect(x,y,16,16);
    ctx.fillStyle=colors[cell%colors.length];ctx.fillRect(x+1,y+1,15,15);
    ctx.fillStyle='#d6ccb2';ctx.fillRect(x+1,y+1,14,1);
    ctx.fillStyle='#999b88';ctx.fillRect(x+14,y+3,1,12);
    if(cell%4===0){ctx.fillStyle='#a9ab97';ctx.fillRect(x+3,y+7,6,3);ctx.fillRect(x+5,y+5,3,2);}
    if(cell%7===0){ctx.fillStyle='#d0c7ad';ctx.fillRect(x+8,y+3,4,2);ctx.fillRect(x+10,y+5,3,2);}
    if(cell%17===0){ctx.fillStyle='#7f8975';ctx.fillRect(x,y+10,2,4);ctx.fillRect(x+1,y+12,3,3);}
  }
}
