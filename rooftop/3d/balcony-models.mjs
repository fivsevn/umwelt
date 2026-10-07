import { BALCONY_EXTRAS } from '../balcony-extras.mjs';
const ids=new Set(BALCONY_EXTRAS.map(a=>a.id));
function polygon(api,g,points,depth,color,kind='metal') {
 const shape=new api.T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const geo=new api.T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.015,bevelThickness:.015});geo.userData.transient=true;
 api.surface(g,geo,0,0,-depth/2,1,1,1,color,kind);
}
export function buildBalconyExtra(api,g,type,w,d,h) {
 if(!ids.has(type))return false;
 const {box,cyl,beam,profile,ellipsoid,group,P,shade}=api,wood='#b38b55',bamboo='#af9866',iron='#405459';
 const rim=(r,y,color,width=.055)=>profile(g,[[r-width,y-width*.5],[r+width*.3,y-width*.5],[r+width*.3,y+width*.5],[r-width,y+width*.5],[r-width,y-width*.5]],24,color,'wicker');
 if(type==='bamboo-basket') {
  // Narrow strips weave over and under each other; the inside stays open.
  const r=w*.47;box(g,0,.035,0,w*.68,.07,d*.67,bamboo,'wicker');
  for(let j=0;j<24;j++){const a=j*Math.PI*2/24,rr=r*(j%2?.985:1.015);
   beam(g,[Math.cos(a)*r*.74,.05,Math.sin(a)*d*.35],[Math.cos(a)*rr,h*.72,Math.sin(a)*d*.48],.035,j%3?bamboo:'#86734e');
  }
  for(let k=1;k<=7;k++){const y=h*.72*k/7,rr=r*(.74+.26*k/7);rim(rr,y,k%2?bamboo:'#c2af7d',.033)}
  rim(r,h*.73,'#c4af7d',.065);
  const handle=group(g);handle.scale.z=d/w;
  for(let k=0;k<20;k++){const a=k*Math.PI/20,b=(k+1)*Math.PI/20;
    beam(handle,[Math.cos(a)*r,h*.74+Math.sin(a)*h*.58,0],[Math.cos(b)*r,h*.74+Math.sin(b)*h*.58,0],.065,k%3?bamboo:'#c7b884');
  }
  for(const x of[-r,r])for(let j=0;j<3;j++)box(g,x,h*(.67+j*.025),0,.095,.017,.13,'#6c6044','wicker');
 } else if(type==='broom') {
  box(g,0,.034,0,w*.55,.068,d*.42,'#746d52','wood');
  const handle=group(g,0,0,0);handle.rotation.z=-.12;
  beam(handle,[0,h*.18,0],[0,h*.96,0],.055,wood);cyl(handle,0,h*.965,0,.039,.039,.10,'#806343',8,'wood');
  for(let j=0;j<7;j++){const x=(j-3)*w*.065;ellipsoid(handle,x,h*.22,0,w*.057,h*.125,d*.13,j%2?'#8f6c42':'#a58752','wicker');
    for(let k=0;k<4;k++)beam(handle,[x+(k-1.5)*.024,h*.22,d*.11],[x*1.25+(k-1.5)*.038,h*.026,d*.15],.017,k%2?'#b89b63':'#715437');
    for(const y of[h*.25,h*.30])box(handle,x,y,d*.146,w*.106,.017,.017,'#a47c4c','metal');
  }
 } else if(type==='pruning-shears') {
  const tool=group(g,0,.11,0);tool.rotation.x=-Math.PI/2;
  polygon(api,tool,[[.02,.03],[.15,.28],[.29,.39],[.35,.40],[.31,.29],[.19,.15],[.08,-.01]],.04,'#b8c2be');
  polygon(api,tool,[[-.03,.04],[-.17,.29],[-.20,.39],[-.13,.36],[.02,.17]],.05,'#6b7a79');
  for(const sign of[-1,1]){const arm=group(tool,0,0,sign*.026);arm.rotation.z=sign*.36;
   polygon(api,arm,[[-.048,0],[-.09,-.22],[-.075,-.62],[.025,-.72],[.080,-.68],[.059,-.50],[.045,-.10]],.075,sign<0?'#ad604a':'#c07959','paint');
   box(arm,0,-.52,.055,.065,.19,.013,'#db9470','paint');
  }
  for(let j=0;j<11;j++)beam(tool,[-.17+j*.033,-.29+Math.sin(j*2.3)*.028,.02],[-.17+(j+1)*.033,-.29+Math.sin((j+1)*2.3)*.028,.02],.012,'#9aa6a0');
  const bolt=group(tool,0,0,.055);bolt.rotation.x=Math.PI/2;cyl(bolt,0,0,0,.057,.057,.07,'#c8b886',6,'metal');
 } else if(type==='pinwheel') {
  cyl(g,0,.045,0,.23,.27,.09,'#aa8e62',16,'wood');beam(g,[0,.08,0],[0,h*.85,0],.045,wood);
  const rotor=group(g,0,h*.77,.075),r=w*.47;
  for(let j=0;j<4;j++){const vane=group(rotor);vane.rotation.z=j*Math.PI/2;
   const points=[[0,0,.02],[r,0,0],[r,r,-.04],[r*.14,r*.56,.19]],pos=[];
   for(const triangle of[[0,1,3],[1,2,3]])for(const i of triangle)pos.push(...points[i]);
   const geo=new api.T.BufferGeometry();geo.setAttribute('position',new api.T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new api.T.Float32BufferAttribute([0,0,1,0,.2,.5,1,0,1,1,.2,.5],2));geo.computeVertexNormals();geo.userData.transient=true;
   const color=['#c08961','#bcb078','#689595','#8a9e75'][j];api.surface(vane,geo,0,0,0,1,1,1,color,'cloth');
   const back=group(vane);back.scale.z=-1;api.surface(back,geo,0,0,-.01,1,1,1,shade(color,.78),'cloth');
  }
  ellipsoid(rotor,0,0,.21,.075,.075,.032,'#bfa76e','metal');api.registerMotion?.(rotor,'spin');
 } else if(type==='parasol') {
  cyl(g,0,.08,0,.47,.51,.16,'#858875',16,'wall');cyl(g,0,.24,0,.15,.20,.32,iron,12,'metal');
  beam(g,[0,.18,0],[0,h*.97,0],.068,wood);cyl(g,0,h*.55,0,.07,.07,.15,'#a6b1a1',12,'metal');box(g,.08,h*.55,.05,.08,.065,.075,'#806b44','metal');
  const r=w*.49;
  for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4,vertices=[],uv=[];
   const q=[[0,h*.96,0],[Math.cos(a)*r*.5,h*.86,Math.sin(a)*r*.5],[Math.cos(b)*r*.5,h*.86,Math.sin(b)*r*.5],[Math.cos(a)*r,h*.75,Math.sin(a)*r],[Math.cos(b)*r,h*.75,Math.sin(b)*r]];
   for(const triangle of[[0,2,1],[1,2,4],[1,4,3],[0,1,2],[1,4,2],[1,3,4]])for(const k of triangle){vertices.push(...q[k]);uv.push(k%2,k/4)}
   const geo=new api.T.BufferGeometry();geo.setAttribute('position',new api.T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new api.T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();geo.userData.transient=true;
   api.surface(g,geo,0,0,0,1,1,1,j%2?'#d1c5a0':'#bdb28f','cloth');
   beam(g,[0,h*.83,0],q[3],.027,'#706953');beam(g,q[1],q[3],.018,'#e0d4b0');beam(g,q[3],q[4],.027,'#a28f6e');
  }
  cyl(g,0,h*.98,0,.055,.078,.09,'#806848',8,'wood');
 } else if(type==='rainbarrel') {
  const r=w*.42,base=h*.15,hh=h*.78;
  for(const x of[-r*.65,r*.65])for(const z of[-r*.60,r*.60])box(g,x,base*.5,z,.12,base,.12,'#806d4b','wood');box(g,0,base,0,w*.81,.10,d*.79,wood,'wood');
  profile(g,[[.01,base],[r*.84,base],[r,base+.15],[r,base+hh*.84],[r*.91,base+hh],[.01,base+hh],[.01,base]],24,'#668b74','paint');
  for(const y of[base+.12,base+hh*.32,base+hh*.62,base+hh*.86])rim(r+.02,y,'#829a7b',.028);
  cyl(g,0,base+hh+.027,0,r*.96,r*.96,.06,'#475f50',24,'paint');
  box(g,0,base+hh+.064,0,.32,.075,.08,'#8da48b','paint');
  beam(g,[0,base+hh*.23,r*.96],[0,base+hh*.23,r+.24],.066,'#b49c65');beam(g,[0,base+hh*.23,r+.24],[0,base+hh*.16,r+.24],.07,'#b49c65');box(g,0,base+hh*.30,r+.07,.16,.035,.035,'#c0ac74','metal');
  beam(g,[r*.50,base+hh*.83,-r*.75],[r*.50,base+hh*.98,-r*.75],.11,'#a4b4a0');beam(g,[r*.50,base+hh*.98,-r*.75],[r*.50,base+hh*.98,-r*1.06],.11,'#a4b4a0');
 } else if(type==='stepstool') {
  for(const x of[-w*.42,w*.42]){
   beam(g,[x*.93,.02,-d*.45],[x,h*.97,-d*.24],.10,wood);beam(g,[x*.93,.02,d*.45],[x,h*.97,d*.05],.10,wood);
   beam(g,[x,h*.20,-d*.4],[x,h*.20,d*.38],.08,'#806642');
  }
  box(g,0,h*.48,d*.26,w,.11,d*.42,'#bf9c66','wood');
  // Top consists of four boards around a real carrying slot.
  box(g,0,h, -d*.34,w,.12,d*.20,'#c8a66e','wood');box(g,0,h,-d*.03,w,.12,d*.24,'#b99761','wood');
  for(const x of[-w*.33,w*.33])box(g,x,h,-d*.195,w*.33,.12,d*.10,'#bf9f6a','wood');
  for(const y of[h*.39,h*.88])box(g,0,y,-d*.29,w*.84,.10,.085,'#8d6f46','wood');
  for(const x of[-w*.41,w*.41])for(const y of[h*.48,h])box(g,x,y+.064,y<h*.6?d*.26:-d*.31,.027,.01,.027,'#8b7857','metal');
 } else if(type==='windchime') {
  box(g,0,.035,0,w*.8,.07,d*.55,wood,'wood');beam(g,[-w*.31,.06,0],[-w*.31,h,0],.07,wood);beam(g,[-w*.31,h,0],[w*.3,h,0],.07,'#c19e63');
  beam(g,[w*.18,h,0],[w*.18,h*.80,0],.014,'#887f5c');
  const bell=group(g,w*.18,h*.71,0),r=w*.22;
  profile(bell,[[r*.22,h*.09],[r*.6,h*.07],[r*.91,0],[r,-h*.04],[r*.87,-h*.04],[r*.78,.008],[r*.47,h*.055],[r*.16,h*.065],[r*.22,h*.09]],24,'#56786b','metal');
  beam(bell,[0,h*.068,0],[0,-h*.24,0],.012,'#968c69');ellipsoid(bell,0,-h*.02,0,.05,.03,.05,'#927c57','metal');
  api.registerMotion?.(bell,'sway');
  const paper=group(bell,0,-h*.25,0);box(paper,0,-h*.09,0,w*.19,h*.18,.012,'#d0c39d','cloth');
  for(let j=0;j<4;j++)box(paper,-w*.035,-h*(.055+j*.025),.009,.020,.029,.006,'#587d7a','paint');
 }
 return true;
}
