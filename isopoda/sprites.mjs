import {STAGES} from './phenotypes.mjs?v=projection-7';
export const MOLT_REGIONS={anterior:['cephalon','p1','p2','p3','p4'],posterior:['p5','p6','p7','pleon','pleotelson','uropods']};
export const POSTURES=['normal','resting','probing','tucked','curled','turning','feeding','grooming','molting','emerging'];
export function stableHash(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0}
export function resolvePalette(p){const v={...p};for(const [key,parent] of [['cephalon','tergite'],['epimera','tergite'],['pleon','tergite'],['pleotelson','pleon'],['uropods','pleotelson'],['antennae','epimera'],['legs','epimera']])v[key]??=v[parent];return v}
const aliases={S:'juvenile',M:'subadult',L:'adult'};
export function renderModel(visual,{stage='adult',condition='normal',seed=0,moving=false}={}){
 stage=aliases[stage]||stage;const growth=visual.stageProfiles?.[stage]||STAGES[stage]||STAGES.adult;
 const posture=typeof condition==='object'?condition.posture||'normal':condition;
 const molt=typeof condition==='object'?condition.molt||'none':condition.startsWith('molt-')?condition.slice(5):'none';
 return {visual,stage:STAGES[stage]?stage:'adult',growth,palette:resolvePalette(visual.palette),seed,variant:stableHash(seed)%4,posture,molt,moving:posture==='moving'||moving};
}
const mix=(a,b,t)=>{const rgb=c=>c.slice(1).match(/../g).map(x=>parseInt(x,16));return '#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('')};
function regionPalette(m,region,n){
 const p=m.palette;let base=p[region==='pereon'?'tergite':region]||p.tergite,edge=p.epimera,tip=edge;
 for(const r of m.visual.patterns){const c=p[r.color]||r.color||p.dark;
  if(r.type==='trizone'){base=p[r.colors[region==='cephalon'||region==='pereon'&&n<=2?0:region==='pereon'&&n<=5?1:2]];edge=base;tip=base}
  if(r.target==='epimera'){if(r.type==='epimeraTip')tip=c;else edge=tip=c}
  if([region,'body','any'].includes(r.target)&&(['solid','headMask','posteriorPatch'].includes(r.type)||r.type==='saddle'&&(r.segments||[3,4,5]).includes(n)||r.type==='segmentBand'&&(r.segments||[2,5]).includes(n)))base=c;
 }return {base,edge,tip};
}
// Modules produce cells on one integer lattice. Rotation is nearest-neighbour
// sampling on that same lattice: even diagonally moving animals retain square pixels.
export function pixelAnatomy(m,{posture='normal',molt='none',phase=0,moving=m.moving}={}){
 const v=m.visual,p=m.palette,h=stableHash(m.seed),frame=phase%4;
 const full=posture==='curled'&&v.conglobation.ability==='full';
 const tucked=posture==='tucked'||posture==='curled';
 const closure=posture==='curled'?1: .55;
 const bend=posture==='turning'?.45:posture==='grooming'?-.3:0;
 const modules=[];
 function module(region){const cells=[];modules.push({region,cells});return (x,y,color)=>cells.push([Math.round(x),Math.round(y),color])}
 const pale=region=>MOLT_REGIONS[molt]?.includes(region);
 function color(c,region){return pale(region)?mix(c,'#eee6d1',.58):c}
 function line(put,x,y,xx,yy,c){const d=Math.ceil(Math.max(Math.abs(xx-x),Math.abs(yy-y)));for(let i=0;i<=d;i++)put(x+(xx-x)*i/(d||1),y+(yy-y)*i/(d||1),c)}
 const width=Math.round(14*v.body.width*m.growth.widthRatio),stride=3*v.body.length;
 const center=n=>({x:Math.round(10-(n-1)*stride),y:bend*Math.round((n-4)*(n-4)/5)});
 if(full){
  // The same seven tergites overlap around a closed dorsum; head and appendages fold inside.
  const r=width+2;
  for(let n=7;n>=1;n--){const put=module('p'+n),pal=regionPalette(m,'pereon',n);const x0=Math.round(-r+(7-n)*2*r/7),x1=Math.round(-r+(8-n)*2*r/7);
   for(let xx=x0-2;xx<x1+2;xx++)for(let y=-r;y<=r;y++){const shift=Math.round(y*y/(r*r)*2),x=xx+shift;if(xx<x0||xx>=x1||x*x+y*y>=r*r)continue;const c=(x+1)*(x+1)+y*y>(r-2)*(r-2)?pal.edge:(xx===x0&&Math.abs(y)>2)?mix(pal.base,'#201e1a',.3):y<0&&x%3===1?mix(pal.base,'#fff1cc',.24):pal.base;put(x,y,color(c,'p'+n))}
  }
  return modules;
 }
 // One projected envelope is shared by tergites, side plates and hidden feet.
 const front=14,back=center(7).x-7,projection=v.body.projection||{middle:.60,frontWidth:.60,rearWidth:.48},cap=(1-projection.middle)/2;
 const envelope=x=>{const t=(x-back)/(front+4-back);return width*(t<cap?projection.rearWidth+(1-projection.rearWidth)*Math.sin(Math.max(0,t)/cap*Math.PI/2):t>1-cap?projection.frontWidth+(1-projection.frontWidth)*Math.sin(Math.max(0,1-t)/cap*Math.PI/2):1)};
 const leg=module('legs');
 for(let n=1;n<=7;n++){const c=center(n);for(const s of [-1,1]){
  const gait=(frame+n*2+(s>0?2:0))%7;
  const active=!tucked&&(posture==='resting'?gait===0: moving||posture==='turning'||posture==='emerging'?gait<3:gait<1);
  const reach=active?Math.min(3,1+Number(v.legs.length>.35)+Number(posture==='turning'&&s>0)): -1;
  const edge=Math.round(envelope(c.x));
  line(leg,c.x+1,c.y+s*(edge-4),c.x+(frame%2),c.y+s*(edge+reach),mix(p.legs,'#353c2d',.55));
 }}
 const rear=center(7),tail=module('uropods');
 if(v.uropods.visibility>.2&&!tucked)for(const s of [-1,1])line(tail,back+2,rear.y+s*3,back-Math.round(v.uropods.projection*3),rear.y+s*(3+Math.round(v.uropods.spread*3)),color(p.uropods,'uropods'));
 const pleon=module('pleon');for(let n=0;n<5;n++){const x=rear.x-n-1,w=Math.round(envelope(x));for(let y=-w;y<=w;y++)pleon(x,rear.y+y,color(n%2?p.pleon:mix(p.pleon,'#292a24',.18),'pleon'))}
 const telson=module('pleotelson');for(let x=0;x<3;x++){const xx=rear.x-5-x,w=Math.round(envelope(xx));for(let y=-w;y<=w;y++)telson(xx,rear.y+y,color(Math.abs(y)>w-2?mix(p.pleotelson,'#292a24',.2):p.pleotelson,'pleotelson'))}
 for(let n=7;n>=1;n--){const c=center(n),region='p'+n,put=module(region),epi=module('epimera'+n),pal=regionPalette(m,'pereon',n);
  const plateWidth=Math.max(3,Math.round(stride+1));
  const cx=c.x;if(tucked)c.y+=Math.round((n-4)*(n-4)/12*closure);
  for(let x=0;x<plateWidth;x++){const half=Math.round(envelope(cx+x));for(let y=-half;y<=half;y++){
   // Each plate has a stepped edge and colour clusters, never a smooth band.
   const sideDepth=Math.max(1,Math.round(v.pereon.epimera.width*(1-v.body.convexity*.55)*3));
   let col=pal.base;const rh=stableHash(m.seed+':'+n),ny=(y+half)/(half*2);
   for(const rule of v.patterns){if(![ 'pereon','body','any'].includes(rule.target))continue;const ink=p[rule.color]||rule.color||p.dark;
    if(rule.type==='blotch'&&((Math.abs(y-((rh%9)-4))<2+(rh%2)&&x<2)||(Math.abs(y-(((rh>>>7)%11)-5))<2&&x>0)))col=ink;
    if(['dorsalStripe','centerField'].includes(rule.type)&&Math.abs(y)<Math.max(1,half*(rule.width||.35)))col=rule.opacity?mix(col,ink,rule.opacity):ink;
    if(rule.type==='lateralStripe'&&Math.abs(Math.abs(y)-half*.65)<1.5)col=ink;
    if(rule.type==='spotRow'&&[.25,.5,.75].some(a=>Math.abs(ny-a)<.06)&&x===1)col=ink;
    if(rule.type==='spot'&&Math.abs(y-(rh%7-3))<2&&x<2)col=ink;
   }
   if(x===0&&(Math.abs(y)>half*.6||y%4===0))col=mix(col,'#1d231c',.35);
   else if(x<3&&y>-half+2&&y<-half+5&&(n+h)%3!==0)col=mix(col,'#fff4d8',.25);
   if(v.surface.sculpture==='tuberculate'&&y%3===0&&x===1)col=mix(col,'#d8caca',.45);
   if((h>>>4)%7===n&&y===2&&x===2)col=mix(col,p.light,.5);
   if(Math.abs(y)>half-sideDepth)col=mix(x===0?pal.tip:pal.edge,'#252b23',.18+v.body.convexity*.16);
   else if(Math.abs(y)>half*.65)col=mix(col,'#252b23',v.body.convexity*.24);
   const arc=Math.round(v.pereon.plateArc*(y/half)**2);
   if(x===arc&&Math.abs(y)<half-1)col=mix(col,'#252b23',.24);
   (Math.abs(y)>half-sideDepth?epi:put)(cx+x,c.y+y,color(col,region));
  }
  }
 }
 const head=module('cephalon'),hx=tucked?12:14,hy=posture==='feeding'?2:posture==='emerging'?-2:bend?2:0;
 const hp=regionPalette(m,'cephalon'),hw=Math.round(width*(.70+v.cephalon.width*.12));
 for(let x=0;x<5;x++)for(let y=-Math.round(envelope(hx+x));y<=Math.round(envelope(hx+x));y++)head(hx+x,hy+y,color(x===4?mix(hp.base,'#222820',.25):hp.base,'cephalon'));
 if(!tucked)for(const s of [-1,1])head(hx+3,hy+s*(hw-1),'#20291f');
 const antenna=module('antennae'),length=Math.round((4+v.antennae.length*6)*(1+((h>>>8)%5-2)*.025)*m.growth.appendageRatio);
 for(const s of [-1,1]){
  const startX=hx+3,startY=hy+s*Math.round(hw*.65);
  const probe=posture==='probing'||posture==='emerging',groom=posture==='grooming';
  const sweep=Math.sin(frame*Math.PI/2)*.12;
  let angle=s*((posture==='resting'?.20:.38)+v.antennae.spread*.5+Math.sin(frame*Math.PI/2+s*.3)*.10)+sweep;
  const folds=tucked?[1.0,.9]:groom?[.95,.8]:probe?[.08,.08]:[v.antennae.bend+(frame===2?.48:0),frame===0?.04:.38];
  let x=startX,y=startY;
  for(let j=0;j<3;j++){if(j)angle+=s*folds[j-1];const len=length*(v.antennae.joints||[.44,.32,.24])[j]*(tucked?.6:1),xx=x+Math.cos(angle)*len,yy=y+Math.sin(angle)*len;line(antenna,x,y,xx,yy,p.antennae);x=xx;y=yy}

 }
 if(posture==='feeding'){const mouth=module('mouthparts');mouth(hx+5,hy+(frame%2),'#d0ba83');mouth(hx+4,hy+2,p.dark)}
 if(posture==='molting'){const old=module('exuvia');const back=molt!=='anterior';for(let i=0;i<5;i++)old((back?-12:12)+i,-width-3+i%2,'#bdbca2')}
 return modules;
}
const models=new WeakMap(),renderedStates=new WeakMap();
export function makeIsopod(species,options={}){
 const m=renderModel(species.visual||species,options),bug=document.createElement('span');bug.className='isobug isopod';bug.setAttribute('aria-hidden','true');
 for(const [k,v] of Object.entries({stage:m.stage,ability:m.visual.conglobation.ability,variant:m.variant,seed:m.seed}))bug.dataset[k]=v;
 const size=Math.round(80*m.growth.scale);bug.style.width=size+'px';bug.style.height=size+'px';
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;canvas.className='pixel-body';bug.append(canvas);
 // Retain anatomical DOM hooks for catalog, molt semantics and future module tools.
 const body=document.createElement('b');body.className='body';for(const name of ['legs','antennae']){const node=document.createElement('i');node.className=name;bug.append(node)}
 for(const region of ['cephalon',...Array.from({length:7},(_,i)=>'p'+(i+1)),'pleon','pleotelson','uropods']){
  const part=document.createElement('i');part.dataset.region=region;part.className='anatomy '+(/^p\d$/.test(region)?'plate '+region:region);part.style.setProperty('--base',regionPalette(m,/^p\d$/.test(region)?'pereon':region,Number(region[1])).base);
  if(/^p\d$/.test(region)){const epimera=document.createElement('i');epimera.className='epimera';part.append(epimera)}body.append(part);
 }bug.append(body);models.set(bug,{m,canvas,cache:new Map()});setIsopodState(bug,{posture:m.posture,molt:m.molt,moving:m.moving});return bug;
}
export function setIsopodState(bug,{posture='normal',molt='none',moving=false,phase=0,angle=0,occlusion=0,occlusionSide='rear'}={}){
 const model=models.get(bug);if(!model)return;
 if(posture==='emerging'&&occlusion===0&&!moving)occlusion=.48;
 if(posture.startsWith('molt-')){molt=posture.slice(5);posture='molting'}
 if(!POSTURES.includes(posture))posture='normal';
 const orientation=Math.round(angle/(Math.PI/32)),f=Math.floor(phase)%4,key=[posture,molt,moving,f,orientation,occlusionSide,Math.round(occlusion*8)].join(':');if(renderedStates.get(bug)===key)return;renderedStates.set(bug,key);
 bug.dataset.posture=posture;bug.dataset.molt=molt;bug.dataset.phase=f;bug.dataset.occlusion=occlusion.toFixed(2);bug.classList.toggle('moving',moving);
 for(const part of bug.querySelectorAll('[data-region]'))part.classList.toggle('molting',(MOLT_REGIONS[molt]||[]).includes(part.dataset.region));
 const {m,canvas,cache}=model,sourceKey=[posture,molt,f,moving].join(':');let cells=cache.get(sourceKey);
 if(!cells){cells=new Map();for(const part of pixelAnatomy(m,{posture,molt,phase:f,moving}))for(const [x,y,c] of part.cells)cells.set((y+32)*64+x+32,c);cache.set(sourceKey,cells);if(cache.size>64)cache.delete(cache.keys().next().value)}
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,64,64);ctx.imageSmoothingEnabled=false;
 const a=orientation*Math.PI/32,cos=Math.cos(a),sin=Math.sin(a);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const sx=Math.round((x-32)*cos+(y-32)*sin),sy=Math.round(-(x-32)*sin+(y-32)*cos);if(occlusion>0&&(occlusionSide==='front'?sx>24-occlusion*49:sx< -24+occlusion*49))continue;const c=cells.get((sy+32)*64+sx+32);if(c){ctx.fillStyle=c;ctx.fillRect(x,y,1,1)}}
}
export function makeBug(species,index=0){return makeIsopod(species,{seed:index})}
