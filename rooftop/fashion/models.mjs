import { buildModernClothes, buildModernPig } from './modern-models.mjs';
import { LOOK_BY_ID, DEFAULT_LOOK } from './catalog.mjs';

// Shared authored geometry for the game, local study and editable Blender collections.
// All dimensions use the original actor units. Pig anatomy is preserved from residents.mjs.
export function buildFashionPerson(api, parent, id=DEFAULT_LOOK) {
  const look=Object.hasOwn(LOOK_BY_ID,id)?LOOK_BY_ID[id]:LOOK_BY_ID[DEFAULT_LOOK]; id=look.id;
  const {group,box,beam,solid}=api;
  const c=look.palette, skin='#d5ad8b', skinShade='#bb8c70', hair='#a67c49', gold='#c2a56a';
  const faces=[[1,2,3,0],[7,6,5,4],[4,5,1,0],[5,6,2,1],[6,7,3,2],[7,4,0,3]];
  function taper(g,x,y,z,wb,wt,h,db,dt,col,kind='actor-cloth') {
    return solid(g,[[x-wb/2,y-h/2,z-db/2],[x+wb/2,y-h/2,z-db/2],[x+wb/2,y-h/2,z+db/2],[x-wb/2,y-h/2,z+db/2],[x-wt/2,y+h/2,z-dt/2],[x+wt/2,y+h/2,z-dt/2],[x+wt/2,y+h/2,z+dt/2],[x-wt/2,y+h/2,z+dt/2]],faces,col,kind);
  }
  function panel(g,points,z,depth,col,kind='actor-cloth') {
    if(points.reduce((sum,p,i)=>sum+p[0]*points[(i+1)%points.length][1]-points[(i+1)%points.length][0]*p[1],0)<0)points=[...points].reverse();
    const n=points.length,verts=[...points.map(([x,y])=>[x,y,z]),...points.map(([x,y])=>[x,y,z-depth])];
    const fs=[points.map((_,i)=>i),points.map((_,i)=>2*n-1-i)];
    for(let i=0;i<n;i++)fs.push([i,i+n,(i+1)%n+n,(i+1)%n]);
    return solid(g,verts,fs,col,kind);
  }
  function trim(g,x,y,z,w,h,col){box(g,x,y,z,w,h,.018,col,'actor-plain');}
  const person=group(parent), body=group(person), head=group(body,0,1.89,0);
  person.userData.animated=body.userData.animated=true;
  person.userData.weathered=false;
  // Slightly longer legs and a narrower torso keep tailoring readable at game scale.
  box(body,0,1.56,0,.18,.18,.23,skin,'skin');
  box(head,0,0,0,.46,.46,.40,skin,'skin');
  taper(head,0,-.225,0,.37,.46,.09,.34,.40,skin,'skin');
  for(const side of [-1,1]) {
    box(head,side*.237,-.025,-.025,.064,.105,.075,skinShade,'skin');
    box(head,side*.119,-.020,.207,.052,.064,.018,'#3e3730','actor-plain');
    box(head,side*.119-.009,-.005,.220,.014,.018,.009,'#f1dfc0','actor-plain');
    trim(head,side*.119,.060,.207,.065,.013,'#806347');
  }
  box(head,0,-.075,.218,.037,.045,.033,'#c39978','skin');
  trim(head,0,-.151,.204,.057,.012,'#a87965');
  // A visible centre seam opens into an inverted V above the forehead.
  // Two parted crown masses, swept angular locks, clipped temples and a short nape.
  taper(head,-.121,.235,-.015,.255,.20,.14,.43,.36,hair,'hair');
  taper(head,.121,.235,-.015,.255,.20,.14,.43,.36,'#b18951','hair');
  box(head,0,.273,-.035,.022,.033,.32,'#715235','hair');
  box(head,0,.10,-.205,.46,.28,.065,'#8a643e','hair');
  for(const side of [-1,1]) {
    const outline=[[.018,.257],[.14,.295],[.246,.215],[.24,.05],[.18,.084],[.13,.175],[.042,.213]].map(([x,y])=>[x*side,y]);
    if(side<0)outline.reverse();
    panel(head,outline,.236,.125,side<0?'#ad834e':'#bb9158','hair');
    const glint=[[.054,.238],[.145,.264],[.215,.21],[.188,.177],[.12,.213]].map(([x,y])=>[x*side,y]);
    if(side<0)glint.reverse();
    panel(head,glint,.243,.009,side<0?'#c29b60':'#cea66b','hair');
    box(head,side*.223,.052,-.08,.068,.20,.23,'#967044','hair');
    box(head,side*.231,-.048,-.06,.040,.066,.12,'#85613d','hair');
  }
  const legs=[], arms=[], tools={};
  const trouser=['smoking','pleats'].includes(id), shortPants=id==='court';
  for(const side of [-1,1]) {
    const leg=group(person,side*.145,.84,0);legs.push(leg);leg.userData.animated=true;
    box(leg,0,-.365,0,.16,.73,.18,skin,'skin');
    if(trouser) {
      taper(leg,0,-.34,0,id==='pleats'?.29:.215,id==='pleats'?.25:.235,.76,.25,.27,id==='pleats'?c[0]:c[0]);
      if(id==='smoking') trim(leg,side*.108,-.34,.01,.014,.73,c[1]);
      if(id==='pleats')for(let j=0;j<5;j++)trim(leg,-.115+j*.055,-.34,.132,.013,.74,j%2?c[1]:c[2]);
    }
    if(shortPants){taper(leg,0,-.12,0,.19,.245,.42,.23,.26,c[0]);box(leg,0,-.50,0,.17,.37,.20,c[2],'actor-cloth');}
    if(['quant','tweed'].includes(id))box(leg,0,-.39,0,.167,.70,.188,id==='quant'?'#40383b':'#cab79b','actor-cloth');
    if(id==='tang'){box(leg,0,-.56,.015,.205,.40,.23,'#3e3934','actor-cloth');trim(leg,0,-.375,.135,.205,.025,'#69604b');}
    const sandal=['chiton','kosode'].includes(id),shoe=sandal?'#6d5138':id==='pleats'?'#d6d2bf':'#303536';
    box(leg,0,-.762,.07,.225,sandal?.065:.12,.33,shoe,'actor-plain');
    box(leg,0,-.816,.06,.231,.035,.34,'#333831','actor-plain');
    if(sandal){box(leg,0,-.705,.13,.223,.045,.055,'#826a43','actor-cloth');box(leg,0,-.67,0,.19,.04,.19,'#826a43','actor-cloth');}
    if(id==='mondrian'||id==='court')box(leg,0,-.722,.22,.085,.048,.025,gold,'actor-plain');
    const arm=group(body,side*.315,1.48,0);arm.userData.animated=true;arms.push(arm);
    box(arm,0,-.25,0,.145,.49,.16,skin,'skin');box(arm,0,-.50,.015,.152,.145,.17,skin,'skin');
    const sleeveless=['chiton','mondrian'].includes(id);
    if(!sleeveless&&!look.model) {
      const wide=id==='kosode'?.30:id==='pleats'?.25:.19;
      taper(arm,side*(id==='kosode'?.055:0),-.23,0,wide,wide+.035,.51,id==='kosode'?.34:.24,.27,c[0]);
      if(id==='kosode')box(arm,side*.08,-.48,-.10,.29,.32,.15,c[0],'actor-cloth');
      if(['smoking','court','bar','tweed','quant'].includes(id))box(arm,0,-.466,.001,.202,.065,.252,id==='tweed'?c[1]:id==='court'?c[1]:c[2],'actor-cloth');
      if(id==='pleats')for(let j=0;j<4;j++)trim(arm,-.10+j*.065,-.24,.143,.014,.47,c[j%2?1:2]);
    }
  }
  const lapels=(col)=>{
    for(const side of [-1,1]) {
      const pts=[[side*.11,1.53],[side*.255,1.42],[side*.135,1.31],[side*.17,1.27],[side*.035,1.05]];if(side>0)pts.reverse();panel(body,pts,.197,.035,col);
    }
  };
  const buttons=(x,y,n,col,step=.095)=>{for(let j=0;j<n;j++)box(body,x,y-j*step,.21,.028,.028,.026,col,'actor-plain');};
  const skirt=(top,bottom,wt,wb,col,depthTop=.32,depthBottom=.44)=>taper(body,0,(top+bottom)/2,0,wb,wt,top-bottom,depthBottom,depthTop,col);
  if(id==='smoking') {
    taper(body,0,1.19,0,.50,.52,.66,.34,.34,c[0]);
    panel(body,[[-.12,1.50],[-.06,1.05],[.06,1.05],[.12,1.50]],.181,.015,c[2]);
    lapels(c[1]);buttons(.075,1.02,2,c[1]);
    for(const side of [-1,1]){trim(body,side*.175,1.03,.182,.13,.023,c[1]);box(body,side*.055,1.46,.221,.105,.047,.04,'#272c2f','actor-cloth',0,0,side*.17);}
    trim(body,-.022,1.35,.222,.035,.20,c[0]);trim(body,.026,1.34,.222,.031,.22,c[0]);
    trim(body,-.16,1.30,.187,.10,.02,c[2]);
  } else if(id==='bar') {
    skirt(.99,.31,.40,.98,c[1],.32,.62);
    for(let j=-4;j<=4;j++)beam(body,[j*.043,.94,.17],[j*.101,.33,.32],.018,'#484944',.012,'actor-cloth');
    taper(body,0,1.27,0,.35,.53,.48,.29,.35,c[0]);skirt(1.05,.85,.35,.66,c[0],.29,.42);lapels('#ede2c9');buttons(0,1.32,4,'#a89576',.08);
  } else if(id==='tweed') {
    skirt(.99,.42,.44,.50,c[0],.32,.35);taper(body,0,1.25,0,.54,.53,.55,.36,.34,c[0]);
    for(const x of [-.035,.035])trim(body,x,1.25,.19,.024,.52,c[1]);
    trim(body,0,1.51,.185,.51,.027,c[1]);trim(body,0,.98,.19,.54,.03,c[1]);
    for(const x of [-.16,.16])for(const y of [1.33,1.10]){box(body,x,y,.19,.15,.12,.03,c[0],'actor-cloth');trim(body,x,y+.055,.211,.15,.02,c[1]);}
    buttons(0,1.43,5,gold,.087);
  } else if(id==='mondrian') {
    skirt(1.50,.63,.49,.65,c[0]);
    // Raised inlay surfaces have a physical thickness; no coplanar flashing.
    panel(body,[[-.245,1.50],[-.28,1.10],[-.025,1.10],[-.025,1.50]],.205,.03,c[1]);
    panel(body,[[.05,1.07],[.05,.65],[.32,.65],[.28,1.07]],.234,.03,c[2]);
    panel(body,[[-.31,.88],[-.32,.65],[-.04,.65],[-.04,.88]],.236,.03,c[3]);
    trim(body,-.025,1.075,.256,.035,.85,'#292f32');trim(body,0,1.09,.25,.575,.035,'#292f32');trim(body,-.18,.88,.254,.28,.035,'#292f32');
  } else if(id==='quant') {
    skirt(1.51,.68,.48,.73,c[0]);
    for(const side of [-1,1]){const pts=[[side*.03,1.53],[side*.22,1.48],[side*.16,1.35],[side*.04,1.40]];if(side>0)pts.reverse();panel(body,pts,.206,.025,c[1]);}
    box(body,-.19,.91,.229,.17,.15,.022,c[1],'actor-cloth');trim(body,0,.70,.254,.71,.038,c[1]);buttons(0,1.28,3,c[1],.10);
  } else if(id==='tang') {
    skirt(1.49,.30,.50,.67,c[0]);
    // Open flank seams and wrapped collar are distinct from the Japanese lapel.
    trim(body,0,1.51,.182,.20,.035,c[2]);for(const x of [-.10,.10])trim(body,x,1.48,.183,.025,.08,c[2]);
    box(body,0,1.02,0,.585,.10,.41,c[1],'actor-cloth');box(body,0,1.02,.219,.092,.075,.03,c[2],'actor-plain');
    for(const x of [-.30,.30])box(body,x,.47,.02,.018,.32,.29,c[1],'actor-cloth');
    trim(body,.19,.76,.213,.025,.37,c[1]);
  } else if(id==='kosode') {
    skirt(1.50,.20,.51,.63,c[0]);
    beam(body,[-.12,1.54,.181],[0,1.36,.195],.055,'#e1d7b8',.02,'actor-cloth');
    beam(body,[.12,1.54,.188],[-.19,1.08,.217],.066,c[1],.025,'actor-cloth');
    box(body,0,1.01,0,.57,.20,.42,c[2],'actor-cloth');trim(body,0,1.01,.22,.57,.025,c[1]);
    for(const [x,y,z] of [[-.15,.57,.225],[.16,1.33,-.184],[-.12,.60,-.215]])for(const [dx,dy] of [[0,0],[-.064,0],[.064,0],[0,-.064],[0,.064]])box(body,x+dx,y+dy,z,.052,.052,.02,c[1],'actor-cloth');
    box(body,0,1.01,-.265,.30,.18,.12,c[2],'actor-cloth');box(body,0,1.01,-.337,.065,.20,.035,c[1],'actor-cloth');
  } else if(id==='court') {
    taper(body,0,1.25,0,.49,.53,.57,.34,.33,c[0]);box(body,0,1.22,.174,.23,.50,.025,c[2],'actor-cloth');
    box(body,0,1.52,-.01,.30,.13,.27,c[0],'actor-cloth');
    for(const side of [-1,1]) {
      box(body,side*.16,.76,-.15,.245,.52,.11,c[0],'actor-cloth');trim(body,side*.13,1.25,.198,.035,.50,c[1]);
      for(let j=0;j<6;j++){box(body,side*(.16+(j%2)*.02),1.45-j*.075,.205,.029,.029,.015,c[1],'actor-plain');}
    }
    buttons(0,1.40,5,gold,.087);box(body,0,1.49,.228,.14,.09,.05,c[2],'actor-cloth');
  } else if(id==='chiton') {
    skirt(1.50,.65,.49,.67,c[0]);box(body,0,1.09,0,.55,.065,.39,c[2],'actor-cloth');
    for(let j=-2;j<=2;j++)beam(body,[j*.08,1.46,.177],[j*.12,.68,.223],.018,'#c0b59a',.013,'actor-cloth');
    panel(body,[[-.31,1.52],[-.34,.87],[-.08,.81],[.23,1.09],[.22,1.23]],.252,.045,c[1]);
    box(body,-.26,1.50,0,.16,.09,.48,c[1],'actor-cloth');box(body,-.27,1.48,.28,.065,.065,.03,c[2],'actor-plain');
    box(body,-.19,1.16,-.225,.31,.69,.06,c[1],'actor-cloth');
  } else if(id==='pleats') {
    taper(body,0,.96,0,.52,.49,.23,.29,.30,c[0]);
    taper(body,0,1.28,0,.66,.54,.55,.38,.34,c[0]);
    for(let j=-5;j<=5;j++)beam(body,[j*.049,1.54,.18],[j*.058,1.02,.205],.016,c[j%2?1:2],.016,'actor-cloth');
    box(body,0,1.55,0,.24,.10,.24,c[0],'actor-cloth');
  }
  if(look.model)buildModernClothes(api,look,{body,arms,legs},{taper,panel,trim});
  return {person,body,head,legs,arms,tools};
}

export function buildFashionPig(api,parent,id=DEFAULT_LOOK,accessory=true) {
  const look=Object.hasOwn(LOOK_BY_ID,id)?LOOK_BY_ID[id]:LOOK_BY_ID[DEFAULT_LOOK],c=look.palette;id=look.id;
  const {box}=api;
  const pigData=buildBarePig(api,parent),{pig,pigFace}=pigData;
  if(accessory) {
    const collar=(col,width=.10)=>{box(pig,0,.30,.49,.60,width,.07,col,'actor-cloth');for(const x of [-.29,.29])box(pig,x,.31,.34,.04,width,.28,col,'actor-cloth');};
    if(look.model)buildModernPig(api,look,pigData);
    else if(id==='smoking'||id==='quant') {
      collar(id==='smoking'?c[2]:c[1],.12);
      for(const side of [-1,1])box(pig,side*.16,.30,.62,.20,.13,.04,id==='smoking'?c[2]:c[1],'actor-cloth',0,0,side*.25);
      if(id==='smoking'){for(const side of [-1,1])box(pig,side*.073,.26,.657,.13,.085,.045,c[0],'actor-cloth',0,0,side*.18);box(pig,0,.26,.683,.06,.055,.04,c[1],'actor-cloth');}
    } else if(id==='tang') {
      box(pig,0,.46,-.12,.695,.10,.81,c[1],'actor-cloth');box(pig,.357,.46,.02,.035,.085,.12,c[2],'actor-plain');
    } else if(id==='kosode') {
      box(pig,0,.45,-.14,.69,.24,.35,c[2],'actor-cloth');
      for(const side of [-1,1])box(pig,side*.09,.75,-.16,.18,.13,.13,c[2],'actor-cloth',0,0,side*.2);
      box(pig,0,.75,-.16,.06,.16,.16,c[1],'actor-cloth');
    } else if(id==='court') {
      collar(c[0],.17);box(pig,0,.235,.627,.56,.08,.035,c[0],'actor-cloth');for(let j=-2;j<=2;j++)box(pig,j*.095,.235,.651,.034,.032,.018,c[1],'actor-plain');
    } else if(id==='bar') {
      box(pig,0,.70,-.10,.73,.055,.67,c[0],'actor-cloth');for(const side of [-1,1])box(pig,side*.35,.54,-.11,.07,.31,.64,c[0],'actor-cloth');
      for(const side of [-1,1])box(pig,side*.23,.57,.30,.20,.19,.05,'#eee2c7','actor-cloth',0,0,side*.35);
    } else if(id==='tweed') {
      box(pig,0,.43,-.06,.698,.556,.816,c[0],'actor-cloth');for(const x of [-.354,.354])box(pig,x,.44,-.05,.026,.31,.60,c[0],'actor-cloth');
      box(pig,0,.71,-.05,.70,.025,.81,c[1],'actor-cloth');for(const side of [-1,1])box(pig,side*.355,.29,-.05,.018,.025,.80,c[1],'actor-cloth');
    } else if(id==='mondrian') {
      collar(c[0]);box(pig,0,.21,.64,.35,.28,.04,c[0],'actor-cloth');box(pig,-.085,.21,.666,.16,.26,.015,c[1],'actor-cloth');box(pig,.085,.15,.667,.16,.13,.015,c[2],'actor-cloth');box(pig,0,.21,.68,.018,.28,.014,'#292f32','actor-plain');
    } else if(id==='pleats') {
      collar(c[0],.16);for(let j=-5;j<=5;j++)box(pig,j*.05,.25,.63,.026,.19,.06,c[j%2?1:0],'actor-cloth');
    } else {
      box(pig,0,.714,-.04,.72,.055,.56,c[1],'actor-cloth');box(pig,-.35,.51,-.02,.06,.39,.55,c[1],'actor-cloth');box(pig,-.36,.69,.22,.075,.065,.03,c[2],'actor-plain');
    }
  }
  return pigData;
}

export function buildFashionActors(api,parent,id=DEFAULT_LOOK,accessory=true) {
  return {...buildFashionPerson(api,parent,id),...buildFashionPig(api,parent,id,accessory)};
}

function buildBarePig(api, parent) {
  const { group, box, beam, P } = api;
  const cyl = (g,x,y,z,rt,rb,h,color,_sides,kind) => box(g,x,y,z,Math.max(rt,rb)*2,h,Math.max(rt,rb)*2,color,kind);
  const block = (g,x,y,z,rx,ry,rz,color,kind) => box(g,x,y,z,rx*2,ry*2,rz*2,color,kind);
  const g = group(parent);
  g.userData.weathered = false;
  g.userData.animated = true;
  block(g, 0, 0.43, -0.06, 0.335, 0.265, 0.395, "#dfb5a5", "skin");
  const face = group(g);
  face.userData.animated = true;
  block(face, 0, 0.49, 0.32, 0.275, 0.25, 0.27, "#edc6b1", "skin");
  block(face, 0, 0.435, 0.605, 0.132, 0.092, 0.1, "#dba59c", "skin");
  for (const x of [-0.062, 0.062])
    box(face, x, 0.452, 0.706, 0.026, 0.028, 0.012, "#986b63");
  const ears = [],
    eyes = [];
  for (const side of [-1, 1]) {
    const ear = group(face, side * 0.235, 0.715, 0.27);
    ear.userData.animated = true;
    box(
      ear,
      0,
      0.028,
      0.008,
      0.135,
      0.16,
      0.12,
      "#d6a194",
      "skin",
      0.22,
      0,
      side * -0.42,
    );
    box(
      ear,
      side * 0.008,
      0.02,
      0.073,
      0.065,
      0.095,
      0.015,
      "#c58a83",
      "skin",
      0.2,
      0,
      side * -0.42,
    );
    ears.push(ear);
    const eye = group(face, side * 0.148, 0.565, 0.608);
    eye.userData.animated = true;
    box(eye, 0, 0, 0, 0.052, 0.066, 0.028, "#50433c");
    box(eye, -0.008, 0.014, 0.018, 0.019, 0.019, 0.015, "#fff0dc");
    eyes.push(eye);
    block(
      face,
      side * 0.212,
      0.448,
      0.609,
      0.047,
      0.031,
      0.015,
      "#dc9e95",
      "skin",
    );
    beam(
      face,
      [side * 0.02, 0.345, 0.606],
      [side * 0.065, 0.327, 0.607],
      0.014,
      "#986b63",
    );
    beam(
      face,
      [side * 0.065, 0.327, 0.607],
      [side * 0.092, 0.347, 0.606],
      0.014,
      "#986b63",
    );
  }
  const pigLegs = [];
  for (const x of [-0.18, 0.18])
    for (const z of [-0.28, 0.25]) {
      const leg = group(g, x, 0.21, z);
      leg.userData.animated = true;
      box(leg, 0, -0.065, 0, 0.112, 0.15, 0.125, "#c99a8e", "skin");
      box(leg, 0, -0.157, 0.01, 0.12, 0.07, 0.145, "#826762");
      box(leg, 0, -0.157, 0.087, 0.012, 0.054, 0.012, "#4e4844");
      pigLegs.push(leg);
    }
  const tail = group(g, 0.045, 0.49, -0.445);
  tail.userData.animated = true;
  const curl = [
    [0, 0, 0],
    [0.075, 0.055, -0.025],
    [0.115, 0.015, -0.045],
    [0.072, -0.038, -0.05],
    [0.045, -0.015, -0.052],
  ];
  for (let j = 1; j < curl.length; j++)
    beam(tail, curl[j - 1], curl[j], 0.025, "#c89690", 0.025, "skin");
  return { pig: g, pigLegs, ears, tail, pigFace: face, pigEyes: eyes };
}
