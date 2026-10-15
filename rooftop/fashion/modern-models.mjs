// Garment construction is separate from the historical records. Each study has
// its own cut, leg shape, collar, surface detail and matching pig element.
export function buildModernClothes(api, look, {body, arms, legs}, {taper,panel,trim}) {
  const {box,beam}=api,{cut,bottom,sleeve,collar,detail}=look.model,[a,b,c]=look.palette;
  const pants=['straight','wide','flare','cargo','shorts','breeches','legging'].includes(bottom);
  const wide=['relaxed','asymmetric','holes','kangaroo','wind','patchwork'].includes(detail);
  const width=wide?.65:detail==='power'?.67:cut==='puffer'?.70:.53;
  const depth=cut==='puffer'?.44:wide?.39:.35;
  const z=depth/2+.02;
  const front=(x,y,w,h,col,zz=z)=>trim(body,x,y,zz,w,h,col);
  const line=(x1,y1,x2,y2,col,w=.018,zz=z+.01)=>beam(body,[x1,y1,zz],[x2,y2,zz],w,col,.018,'actor-cloth');
  const pocket=(x,y,w=.17,h=.16,col=b)=>{box(body,x,y,z+.01,w,h,.055,col,'actor-cloth');front(x,y+h/2,w,.025,c,z+.043);};
  const buttons=(n=4,double=false,col=c)=>{for(let i=0;i<n;i++)for(const x of double?[-.10,.10]:[0])box(body,x,1.34-i*.11,z+.045,.028,.028,.028,col,'actor-plain');};
  const skirt=(top,bottomY,wt,wb,col=a,dt=.34,db=.44)=>taper(body,0,(top+bottomY)/2,0,wb,wt,top-bottomY,db,dt,col);
  const bottomColor=({sailor:b,denim:a,western:c,chore:a,overalls:a,breton:b,fairisle:c,varsity:c,peacoat:a,safari:a,jumpsuit:a,power:a,flare:a,relaxed:a,minimal:a,tracksuit:a,yohji:a,grunge:c,hoodie:c,preppy:b,patchwork:'#424f4b'})[look.id]||c;
  if(pants)taper(body,0,.93,0,.49,.49,.23,.30,.32,bottomColor);
  if(pants)for(const [i,leg] of legs.entries()) {
    const wideLeg=['wide','cargo'].includes(bottom),w=wideLeg?.28:bottom==='legging'?.18:.225;
    if(['shorts','breeches'].includes(bottom))taper(leg,0,bottom==='shorts'?-.10:-.20,0,w+.04,w+.02,bottom==='shorts'?.32:.54,.26,.26,bottomColor);
    else if(bottom==='flare'){
      taper(leg,0,-.20,0,.20,.25,.40,.23,.28,bottomColor);
      taper(leg,0,-.57,0,.36,.20,.34,.34,.23,bottomColor);
    } else taper(leg,0,-.34,0,w,w+.025,.76,wideLeg?.31:.26,.28,bottomColor);
    if(['cargo','utility'].includes(detail)){box(leg,(i?1:-1)*(w/2+.02),-.28,0,.07,.23,.21,a,'actor-cloth');box(leg,(i?1:-1)*(w/2+.06),-.17,0,.015,.035,.22,b,'actor-cloth');}
    if(detail==='track')for(const dx of [-.026,.026])box(leg,(i?1:-1)*.124,-.34,dx,.014,.72,.019,c,'actor-cloth');
    if(detail==='denim')for(const x of [-.083,.083])trim(leg,x,-.34,.146,.012,.70,b);
    if(detail==='punk')for(let y=-.65;y<0;y+=.15){trim(leg,0,y,.145,w,.025,b);trim(leg,.04,-.34,.149,.02,.70,b);}
    if(detail==='hotpants'||detail==='pirate')box(leg,0,-.57,0,.23,.43,.25,detail==='hotpants'?b:'#655444','actor-cloth');
    if(['tennis','track','wind','kangaroo','cargo'].includes(detail)){box(leg,0,-.76,.08,.238,.12,.34,'#d8d7c2','actor-cloth');trim(leg,0,-.737,.257,.17,.018,b);}
  }
  else if(bottom==='balloon') {
    skirt(1.11,.72,.40,.85,a,.30,.60);skirt(.72,.38,.85,.53,a,.60,.36);
  } else if(bottom==='full')skirt(1.04,.35,.39,.90,a,.30,.58);
  else if(bottom==='pleated') {
    skirt(1.01,.62,.42,.68,a,.30,.45);
    for(let i=-4;i<=4;i++)beam(body,[i*.045,.99,.17],[i*.073,.64,.237],.02,b,.02,'actor-cloth');
  } else if(bottom==='sack')skirt(1.12,.49,.60,.58,a,.40,.38);
  else if(['midi','mini','long'].includes(bottom))skirt(1.13,bottom==='long'?.16:bottom==='mini'?.66:.41,.43,bottom==='long'?.64:.59,a,.32,bottom==='long'?.47:.43);
  const hem=cut==='coat'?.47:cut==='jacket'?.91:cut==='vest'&&detail==='minimal'?.65:1.00;
  if(cut==='dress') {
    if(bottom==='sack')taper(body,0,1.29,0,.60,.52,.44,.40,.34,a);
    else taper(body,0,1.30,0,.42,.49,.46,.30,.34,a);
  } else if(cut==='bib') {
    taper(body,0,1.25,0,.52,.52,.53,.33,.34,c);box(body,0,1.17,.19,.34,.35,.05,a,'actor-cloth');
    for(const x of [-.16,.16]){box(body,x,1.40,0,.055,.32,.41,a,'actor-cloth');front(x,1.33,.038,.037,b,.225);}pocket(0,1.18,.21,.13,a);
  } else if(cut==='puffer') {
    for(let j=0;j<4;j++)taper(body,0,1.05+j*.13,0,.67,.69,.121,.44,.44,a);
  } else if(detail==='holes') {
    taper(body,0,1.25,0,.61,.60,.52,.34,.34,c);
    for(let row=0;row<5;row++)for(let col=0;col<6;col++)if(![[1,1],[2,4],[3,2],[0,4],[4,5]].some(([r,c])=>r===row&&c===col))box(body,(col-2.5)*.105,1.05+row*.10,.195,.108,.103,.045,a,'actor-cloth');
    box(body,0,1.25,-.20,.64,.54,.045,a,'actor-cloth');
  } else {
    taper(body,0,(1.52+hem)/2,0,cut==='coat'?.68:width-.02,width,1.52-hem,cut==='coat'?.43:depth,depth,a);
    if(cut==='vest')front(0,1.32,.23,.40,c,z+.01);
  }
  for(const [i,arm] of arms.entries()) {
    const armCol=detail==='varsity'||cut==='vest'?c:a;
    const short=sleeve==='short',bare=sleeve==='none';
    if(!bare){
      const w=sleeve==='wide'?.27:cut==='puffer'?.28:wide?.24:.20,h=short?.24:.49;
      taper(arm,0,-h/2+.015,0,w,w+.035,h,cut==='puffer'?.32:.26,.27,armCol);
      box(arm,0,-h+.035,0,w+.008,.055,.272,detail==='varsity'||detail==='flight'?b:armCol,'actor-cloth');
      if(detail==='stripe'||detail==='varsity'||detail==='track')for(let j=0;j<(detail==='stripe'?5:2);j++)box(arm,0,-.08-j*(detail==='stripe'?.08:.035),.139,w,.023,.018,b,'actor-cloth');
      if(detail==='quilt')for(let j=0;j<3;j++)box(arm,0,-.10-j*.135,0,w+.015,.025,.33,b,'actor-cloth');
      if(detail==='flight'&&i===0)box(arm,-.125,-.20,0,.055,.15,.15,b,'actor-cloth');
      if(detail==='power')box(arm,0,.015,0,.29,.12,.31,a,'actor-cloth');
      if(detail==='plaid')for(let j=0;j<4;j++)box(arm,0,-.05-j*.11,.139,.21,.028,.019,b,'actor-cloth');
    }
  }
  // Collars have closed thickness and a matching back, not painted symbols.
  if(collar==='lapel')for(const side of [-1,1]){
    panel(body,[[side*.10,1.53],[side*.29,1.42],[side*.16,1.29],[side*.19,1.24],[side*.035,1.04]],z+.04,.035,b);
    box(body,side*.10,1.52,-depth/2,.18,.07,.06,b,'actor-cloth');
  }
  if(['point','polo'].includes(collar))for(const side of [-1,1]){
    panel(body,[[side*.02,1.54],[side*.21,1.49],[side*.15,1.34],[side*.025,1.43]],z+.02,.035,detail==='western'?b:c);
    box(body,side*.08,1.53,-depth/2,.16,.055,.055,c,'actor-cloth');
  }
  if(['stand','rib','round','boat','hood'].includes(collar)) {
    const h=collar==='stand'?.12:.05,w=collar==='boat'?.36:.28;
    box(body,0,1.53,-.015,w,h,.24,collar==='rib'?b:a,'actor-cloth');
  }
  if(collar==='v') {line(-.12,1.54,0,1.32,b,.035);line(.12,1.54,0,1.32,b,.035);}
  if(collar==='hood') {
    taper(body,0,1.49,-.23,.27,.38,.32,.13,.20,a);
    for(const x of [-.09,.09])front(x,1.37,.014,.24,c,z+.035);
  }
  if(collar==='sailor') {
    box(body,0,1.40,-.197,.48,.28,.04,b,'actor-cloth');
    for(const side of [-1,1]){panel(body,[[side*.03,1.25],[side*.29,1.48],[side*.10,1.55]],z+.035,.035,b);line(side*.045,1.29,side*.25,1.48,c,.018,z+.06);}
    front(0,1.24,.055,.15,'#ad5545');
  }
  if(collar==='ruff')for(let j=-2;j<=2;j++)box(body,j*.047,1.48,z+.015,.04,.16,.05,c,'actor-cloth');
  if(collar==='one') {panel(body,[[-.245,1.56],[-.25,1.24],[.24,1.26],[.24,1.36]],z+.035,.035,a);box(body,.17,1.45,0,.17,.17,.35,'#d5ad8b','skin');}
  if(cut==='dress'&&sleeve==='none'&&collar!=='one')for(const side of [-1,1])box(body,side*.15,1.49,0,detail==='slip'?.04:.09,.13,.35,a,'actor-cloth');
  if(['double','power'].includes(detail)){
    buttons(4,true,b);for(const side of [-1,1])front(side*.19,.93,.15,.025,b);
    if(detail==='double'&&cut==='coat'){box(body,0,1.04,0,.59,.065,.40,b,'actor-cloth');front(.05,1.04,.10,.08,c,z+.04);box(body,.14,1.37,z+.01,.25,.18,.055,a,'actor-cloth');}
  } else if(detail==='zip-diagonal'){
    line(-.18,.97,.16,1.43,c,.025);for(const side of [-1,1]){line(side*.14,1.11,side*.24,1.23,b,.023);front(side*.22,1.44,.035,.035,c,z+.07);}box(body,0,.94,0,.55,.055,.38,b,'actor-cloth');
  } else if(['denim','western'].includes(detail)) {
    for(const side of [-1,1]){pocket(side*.15,1.28,.17,.18,a);panel(body,[[side*.06,1.40],[side*.25,1.40],[side*.15,1.32]],z+.05,.025,b);line(side*.06,1.1,side*.10,.94,b,.014);}
    buttons(4,false,b);front(0,.96,.52,.023,b);
  } else if(['pockets','safari','utility'].includes(detail)){
    for(const x of [-.16,.16])for(const y of detail==='pockets'?[1.04]:[1.10,1.36])pocket(x,y,.18,.16,detail==='utility'?b:a);
    if(detail==='pockets')pocket(-.15,1.36);buttons();
    if(detail==='safari'){box(body,0,1.01,0,.57,.07,.40,b,'actor-cloth');front(0,1.01,.10,.075,c,z+.055);}
  } else if(detail==='stripe') {
    for(const zz of [z,-z])for(let j=0;j<6;j++)trim(body,0,1.10+j*.067,zz,width,.026,b);
  } else if(['fairisle','argyle','folk'].includes(detail)) {
    for(const zz of [z,-z])for(let row=0;row<3;row++)for(let j=-2;j<=2;j++){const x=j*.095+(row%2?.025:0),y=1.14+row*.10;box(body,x,y,zz,.055,.055,.018,(row+j)%2?b:c,'actor-cloth',0,0,Math.PI/4);}
    if(detail==='folk')for(let j=-4;j<=4;j++)front(j*.055,.96,.022,.13,b);
  } else if(['placket','shirtwaist','sack'].includes(detail)) {
    buttons(detail==='sack'?2:4);if(detail==='shirtwaist'){box(body,0,1.04,0,.46,.055,.36,b,'actor-cloth');front(0,1.04,.08,.06,c,z+.05);}
  } else if(detail==='varsity') {
    buttons();front(-.15,1.30,.11,.15,c);front(0,1.01,width,.05,b);
  } else if(['flight','track','wind','tech','quilt'].includes(detail)) {
    line(0,1.47,0,hem+.02,b,.022,z+.045);for(const side of [-1,1])line(side*.15,1.05,side*.24,1.17,c,.022,z+.045);
    if(detail==='wind'){panel(body,[[-.31,1.45],[.31,1.27],[.31,1.12],[-.31,1.30]],z+.025,.035,b);front(0,1.06,.61,.09,c);}
    if(detail==='tech')for(const side of [-1,1])line(side*.08,1.30,side*.24,1.42,c,.02);
  } else if(detail==='toggle') {
    for(let j=0;j<3;j++){front(0,1.33-j*.15,.22,.024,b);box(body,.055,1.33-j*.15,z+.035,.08,.035,.03,c,'actor-plain');}pocket(-.18,.80,.20,.18,a);pocket(.18,.80,.20,.18,a);
  } else if(detail==='jumpsuit') {for(const x of [-.045,.045])front(x,1.27,.018,.43,b);box(body,0,1.00,0,.56,.065,.39,b,'actor-cloth');front(.08,1.00,.07,.06,c,z+.03);}
  else if(detail==='fringe') {box(body,0,.86,0,.53,.07,.40,b,'actor-cloth');for(let j=-4;j<=4;j++)for(const zz of [-.22,.22])trim(body,j*.06,.44,zz,.022,.18,b);}
  else if(detail==='bias'||detail==='slip'){line(-.20,1.25,.14,.90,b,.015);line(.14,.90,-.18,.28,b,.015,.235);}
  else if(detail==='beads'){for(let j=-3;j<=3;j++)box(body,j*.047,1.43-Math.sin((j+3)/6*Math.PI)*.14,z+.03,.028,.03,.025,c,'actor-plain');}
  else if(detail==='wrap'){line(.14,1.50,-.16,1.02,c,.035);line(-.16,1.02,.18,.43,b,.02,.24);box(body,-.23,1.02,z,.13,.08,.06,b,'actor-cloth');for(let j=-2;j<=2;j++)for(let k=0;k<5;k++)front(j*.08,.54+k*.13,.025,.025,b,.232);}
  else if(detail==='space'){front(0,1.32,.24,.22,b);front(0,.69,.62,.05,b,.235);for(const leg of legs)box(leg,0,-.60,0,.22,.35,.25,a,'actor-cloth');}
  else if(detail==='vinyl'){buttons(5,false,c);front(-.24,1.02,.025,.90,b);front(.24,1.02,.025,.90,b);}
  else if(detail==='hotpants'){front(0,1.09,.54,.04,b);for(const leg of legs)trim(leg,0,-.06,.15,.21,.03,b);}
  else if(detail==='disco'){line(-.20,1.53,.15,1.03,b,.055,z+.035);for(let j=-2;j<=2;j++)for(let k=0;k<7;k++)front(j*.075,.32+k*.16,.02,.045,b,.24);}
  else if(detail==='flare'){buttons(2);front(0,.98,.54,.04,b);}
  else if(detail==='punk'){for(let j=0;j<4;j++)front(0,1.08+j*.10,width,.033,b);front(-.21,1.40,.09,.02,c,z+.03);front(-.21,1.35,.09,.02,c,z+.03);line(-.25,1.40,-.25,1.35,c,.018,z+.03);}
  else if(detail==='pirate'){box(body,0,1.02,0,.57,.16,.40,b,'actor-cloth');front(-.19,.90,.11,.22,b);buttons(2,false,b);}
  else if(detail==='bodymap'){for(const [x,y,w,h]of [[-.15,1.35,.22,.30],[.16,1.12,.27,.24]])front(x,y,w,h,b);for(const [i,leg]of legs.entries())trim(leg,0,i?-.52:-.20,.15,.18,.28,b);}
  else if(detail==='asymmetric'){panel(body,[[-.29,1.40],[-.36,.32],[.06,.56],[.12,1.08]],z+.05,.05,b);front(.12,1.04,.04,.04,c,z+.08);}
  else if(detail==='plaid'){front(0,1.24,.24,.48,c);for(const side of [-1,1])for(let j=0;j<4;j++)front(side*.21,1.05+j*.12,.15,.027,b);}
  else if(detail==='minimal'||detail==='relaxed'){for(const side of [-1,1])front(side*.19,.94,.13,.018,b);buttons(1,false,b);}
  else if(detail==='kangaroo'){panel(body,[[-.18,1.17],[-.23,1.06],[-.20,1.01],[.20,1.01],[.23,1.06],[.18,1.17]],z+.02,.04,a);}
  else if(detail==='blocks'||detail==='patchwork')for(const zz of [z+.01,-z-.01])for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const x=(col-1)*.17,y=1.09+row*.16;trim(body,x,y,zz,.163,.153,(col+row)%3===0?b:(col+row)%3===1?c:a);
    if(detail==='patchwork')for(let j=0;j<3;j++)trim(body,x-.06+j*.05,y-.068,zz+(zz>0?.01:-.01),.016,.009,c);
  }
}

export function buildModernPig(api,look,{pig,pigFace}) {
  const {box}=api,[a,b,c]=look.palette,kind=look.model.pig;
  const collar=(col=a)=>{box(pig,0,.29,.60,.57,.10,.055,col,'actor-cloth');for(const side of [-1,1])box(pig,side*.29,.29,.42,.04,.10,.38,col,'actor-cloth');};
  const back=(col=a)=>{box(pig,0,.715,-.08,.70,.055,.64,col,'actor-cloth');for(const side of [-1,1])box(pig,side*.344,.55,-.08,.045,.28,.64,col,'actor-cloth');};
  if(['vest','patch','puff','cape','drape','knit','fringe','shoulder'].includes(kind)) {
    back();
    if(kind==='vest')for(const side of [-1,1])box(pig,side*.23,.56,.27,.20,.20,.04,b,'actor-cloth');
    if(kind==='patch')for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)box(pig,x*.22,.75,-.08+z*.20,.20,.02,.18,(x+z)%2?b:c,'actor-cloth');
    if(kind==='puff')for(let j=0;j<4;j++)box(pig,0,.75,-.34+j*.16,.71,.06,.135,a,'actor-cloth');
    if(kind==='knit')for(let j=-2;j<=2;j++)box(pig,j*.12,.75,-.05,.07,.02,.47,b,'actor-cloth');
    if(kind==='fringe')for(let j=0;j<5;j++)for(const side of [-1,1])box(pig,side*.36,.37,-.32+j*.12,.026,.17,.026,b,'actor-cloth');
    if(kind==='drape'){box(pig,-.36,.49,-.06,.06,.41,.58,b,'actor-cloth');box(pig,-.37,.68,.23,.06,.06,.03,c,'actor-plain');}
    if(kind==='shoulder')for(const side of [-1,1])box(pig,side*.29,.70,.20,.25,.09,.19,b,'actor-cloth');
  } else if(kind==='belt') {box(pig,0,.45,-.11,.70,.10,.81,b,'actor-cloth');box(pig,.36,.45,.04,.035,.09,.12,c,'actor-plain');}
  else {
    collar();
    if(['lapel','sailor','polo','v'].includes(kind))for(const side of [-1,1])box(pig,side*.15,.30,.65,.24,.12,.04,kind==='sailor'?b:c,'actor-cloth',0,0,side*.43);
    if(kind==='stripe')for(let j=-2;j<=2;j++)box(pig,j*.10,.29,.637,.035,.10,.014,b,'actor-cloth');
    if(['bib','pocket'].includes(kind)){box(pig,0,.21,.644,.33,.23,.04,b,'actor-cloth');if(kind==='pocket')box(pig,0,.30,.67,.33,.035,.025,c,'actor-cloth');}
    if(['ribbon','knot'].includes(kind))for(const side of [-1,1])box(pig,side*.08,.28,.65,.15,.10,.06,b,'actor-cloth',0,0,side*.3);
    if(kind==='kerchief'||kind==='sash')box(pig,.065,.18,.65,.16,.20,.05,b,'actor-cloth',0,0,.25);
    if(kind==='toggle') {box(pig,0,.27,.65,.25,.025,.025,b,'actor-cloth');box(pig,.065,.27,.67,.10,.045,.03,c,'actor-plain');}
    if(kind==='beads')for(let j=-3;j<=3;j++)box(pig,j*.073,.24+Math.abs(j)*.016,.65,.035,.04,.03,c,'actor-plain');
    if(kind==='pin'){box(pig,0,.27,.65,.13,.07,.03,c,'actor-plain');box(pig,0,.27,.67,.09,.035,.02,a,'actor-cloth');}
    if(kind==='hood'){box(pig,0,.73,.04,.39,.09,.27,a,'actor-cloth');box(pig,0,.66,-.055,.33,.18,.07,b,'actor-cloth');}
  }
}
