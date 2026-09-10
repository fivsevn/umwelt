import {STAGES} from './phenotypes.mjs?v=fieldnotes-5';
export const MOLT_REGIONS={anterior:['cephalon','p1','p2','p3','p4'],posterior:['p5','p6','p7','pleon','pleotelson','uropods']};
export function stableHash(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0}
export function resolvePalette(p){const v={...p};for(const [key,parent] of [['cephalon','tergite'],['epimera','tergite'],['pleon','tergite'],['pleotelson','pleon'],['uropods','pleotelson'],['antennae','epimera'],['legs','epimera']])v[key]??=v[parent];return v}
const aliases={S:'juvenile',M:'subadult',L:'adult'};
const pct=n=>`${Number(n.toFixed(3))}%`;
export function renderModel(visual,{stage='adult',condition='normal',seed=0,moving=false}={}){
 stage=aliases[stage]||stage;const growth=visual.stageProfiles?.[stage]||STAGES[stage]||STAGES.adult;
 const posture=typeof condition==='object'?condition.posture||'normal':condition;
 const molt=typeof condition==='object'?condition.molt||'none':condition.startsWith('molt-')?condition.slice(5):'none';
 return {visual,stage:STAGES[stage]?stage:'adult',growth,palette:resolvePalette(visual.palette),seed,variant:stableHash(seed)%4,posture,molt,moving:posture==='moving'||moving};
}
function patternLayers(m,region,n){
 const layers=[],p=m.palette,v=m.visual;
 let base=p[region==='pereon'?'tergite':region]||p.tergite,edge=p.epimera,tip=null;
 for(const rule of v.patterns){
  const c=p[rule.color]||rule.color||p.dark;
  const match=rule.target===region||rule.target==='body'||rule.target==='any';
  if(rule.type==='trizone'){
   const zone=region==='cephalon'||(region==='pereon'&&n<=2)?0:region==='pereon'&&n<=5?1:2;
   base=p[rule.colors[zone]]||rule.colors[zone];edge=base;continue;
  }
  if(rule.target==='epimera'){if(rule.type==='epimeraTip')tip=c;else edge=c;continue}
  if(!match)continue;
  if(['solid','headMask','posteriorPatch'].includes(rule.type)||(rule.type==='saddle'&&(rule.segments||[3,4,5]).includes(n))||(rule.type==='segmentBand'&&(rule.segments||[2,5]).includes(n)))base=c;
  if(['dorsalStripe','centerField','lateralStripe'].includes(rule.type)){
   const w=(rule.width||.35)*50,col=rule.opacity?`color-mix(in srgb, ${c} ${rule.opacity*100}%, transparent)`:c;
   layers.push(rule.type==='lateralStripe'?`linear-gradient(0deg,transparent 12%,${col} 12% 24%,transparent 24% 76%,${col} 76% 88%,transparent 88%)`:`linear-gradient(0deg,transparent ${50-w}%,${col} ${50-w}% ${50+w}%,transparent ${50+w}%)`);
  }
  if(rule.type==='blotch'){
   const h=stableHash(`${m.variant}-${n}`),y=10+h%72,x=-30+(h>>>8)%150;
   if(h%5===0)continue;
   layers.push(`radial-gradient(ellipse 95% 30% at ${x}% ${y}%,${c} 65%,transparent 70%)`,`radial-gradient(ellipse 80% 26% at ${100-x}% ${(y+42)%90}%,${c} 60%,transparent 68%)`);
  }
  if(rule.type==='spotRow'||rule.type==='spot')for(const y of rule.type==='spotRow'?[27,50,73]:[22+(stableHash(n+m.variant)%55)])layers.push(`radial-gradient(ellipse 21% 7% at 48% ${y}%,${c} 75%,transparent 85%)`);
  if(rule.type==='segmentSeam')layers.push(`linear-gradient(90deg,${c} 0 9%,transparent 10%)`);
 }
 return {base,edge,tip,layers:layers.length?layers.join(','):'none'};
}
export function makeIsopod(species,options={}){
 const v=species.visual||species,m=renderModel(v,options),g=m.growth,bug=document.createElement('span');
 bug.className='isobug isopod';bug.setAttribute('aria-hidden','true');
 for(const [k,val] of Object.entries({stage:m.stage,ability:v.conglobation.ability,variant:m.variant,sculpture:v.surface.sculpture,material:v.surface.material,seed:m.seed}))bug.dataset[k]=String(val);
 bug.style.width=`${38*v.body.length*g.scale}px`;bug.style.height=`${30*v.body.width*g.widthRatio*g.scale}px`;
 const vars={convexity:v.body.convexity,'epimera-size':pct(8+v.pereon.epimera.width*24),'plate-arc':pct(10+v.pereon.plateArc*48*g.plateMaturity),
  'epimera-round':pct(v.pereon.epimera.roundness*70),'epimera-angle':`${v.pereon.epimera.angle*30}deg`,
  'seam-alpha':v.pereon.seamStrength,'surface-alpha':v.surface.intensity,'shell-opacity':1-v.surface.translucency,
  'pattern-expression':g.patternExpression,'leg-color':m.palette.legs,'leg-height':pct(100+v.legs.length*35*g.appendageRatio),'leg-opacity':v.legs.visibility,
  'antenna-color':m.palette.antennae,'antenna-length':pct(v.antennae.length*42*g.appendageRatio),'antenna-thickness':`${.5+v.antennae.thickness*3}px`,'antenna-angle':`${v.antennae.spread*50}deg`,'antenna-bend':`${v.antennae.bend*60}deg`,
  'uropod-color':m.palette.uropods,'uropod-length':pct(v.uropods.projection*22*g.appendageRatio),'uropod-thickness':`${.6+v.uropods.thickness*4}px`,'uropod-angle':`${v.uropods.spread*65}deg`,'uropod-opacity':v.uropods.visibility,
  closure:v.conglobation.closure};
 for(const [k,val] of Object.entries(vars))bug.style.setProperty('--'+k,val);
 function part(region,n){const el=document.createElement('i');el.className='anatomy '+(region==='pereon'?`plate p${n}`:region);el.dataset.region=region==='pereon'?`p${n}`:region;
  const pattern=patternLayers(m,region,n);el.style.setProperty('--base',pattern.base);el.style.setProperty('--pattern',pattern.layers);el.style.setProperty('--edge',pattern.edge);el.style.setProperty('--tip',pattern.tip||pattern.edge);return el}
 const legs=document.createElement('i');legs.className='legs';const antennae=document.createElement('i');antennae.className='antennae';
 const body=document.createElement('b');body.className='body';
 const pleon=part('pleon');pleon.style.width=pct(v.pleon.length*100);pleon.style.height=pct(v.pleon.width*100);pleon.style.setProperty('--rear-taper',pct(v.pleon.taper*35));body.append(pleon);
 const telson=part('pleotelson');telson.dataset.apex=v.pleotelson.apex;telson.style.width=pct(v.pleotelson.length*100);telson.style.height=pct(v.pleotelson.width*100);body.append(telson);
 const uropods=part('uropods');body.append(uropods);
 const pereon=document.createElement('i');pereon.className='pereon';
 for(let n=7;n>=1;n--){const plate=part('pereon',n),taper=n<3?v.body.anteriorTaper*(3-n)*.15:n>5?v.body.posteriorTaper*(n-5)*.2:0;
  plate.style.left=pct(72-(n-1)*8.7);plate.style.width=pct(9.5+v.pereon.overlap*12);plate.style.height=pct(v.pereon.heightProfile[n-1]*(1-taper)*100);
  const epi=document.createElement('i');epi.className='epimera';epi.dataset.tip=v.pereon.epimera.tip;epi.style.setProperty('--flare',pct(v.pereon.epimera.flare*32));plate.append(epi);pereon.append(plate)}
 body.append(pereon);
 const head=part('cephalon');head.style.width=pct(12+v.cephalon.length*8);head.style.height=pct(v.cephalon.width*100);head.style.right=pct(2+v.cephalon.embedding*5);head.style.borderRadius=`${v.cephalon.roundness*25}% ${30+v.cephalon.roundness*50}% ${30+v.cephalon.roundness*50}% ${v.cephalon.roundness*25}%`;body.append(head);
 bug.append(legs,antennae,body);setIsopodState(bug,{posture:m.posture,molt:m.molt,moving:m.moving});return bug;
}
const renderedStates=new WeakMap();
export function setIsopodState(bug,{posture='normal',molt='none',moving=false}={}){
 const key=posture+':'+molt+':'+moving;if(renderedStates.get(bug)===key)return;renderedStates.set(bug,key);
 bug.dataset.posture=posture;bug.dataset.molt=molt;bug.classList.toggle('moving',moving&&posture!=='curled'&&posture!=='resting');
 for(const part of bug.querySelectorAll('[data-region]'))part.classList.toggle('molting',(MOLT_REGIONS[molt]||[]).includes(part.dataset.region));
}
export function makeBug(species,index=0){return makeIsopod(species,{seed:index})}
