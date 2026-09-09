import {SPECIES} from '../isopoda/species.mjs';import {makeIsopod,MOLT_REGIONS} from '../isopoda/sprites.mjs';
const result={passed:0,failures:[],staticAnimations:0,nodesPerSpecimen:0};
function check(ok,label){if(ok)result.passed++;else result.failures.push(label)}
const host=document.createElement('div');host.style.cssText='position:absolute;left:-10000px;top:0';document.body.append(host);
for(const p of SPECIES){for(const stage of ['S','M','L'])for(const condition of ['normal','molt-anterior','molt-posterior','curled']){
 const bug=makeIsopod(p,{stage,condition,seed:157});host.append(bug);check(bug.querySelectorAll('.plate').length===7,p.id+' seven plates');check(bug.querySelectorAll('.epimera').length===7,p.id+' epimera');check(bug.querySelectorAll('[data-region]').length===11,p.id+' anatomy');
 const expected=MOLT_REGIONS[condition.replace('molt-','')]||[];check(JSON.stringify([...bug.querySelectorAll('.molting')].map(x=>x.dataset.region).sort())===JSON.stringify([...expected].sort()),p.id+' '+condition+' molt bounds');
 check(bug.getAnimations({subtree:true}).length===0,p.id+' static animations');
 if(condition==='curled'){const antenna=getComputedStyle(bug.querySelector('.antennae'));check((antenna.visibility==='hidden')===(p.visual.conglobation.ability==='full'),p.id+' curl appendages');}
 check(bug.getBoundingClientRect().width>0&&bug.getBoundingClientRect().height>0,p.id+' nonzero geometry');result.nodesPerSpecimen=bug.querySelectorAll('*').length;bug.remove();
}}
const dairy=SPECIES[0];const variants=[0,1,2,3].map(seed=>makeIsopod(dairy,{seed}));check(new Set(variants.map(b=>b.outerHTML)).size===4,'four variants');check(makeIsopod(dairy,{seed:19}).outerHTML===makeIsopod(dairy,{seed:19}).outerHTML,'repeatable seed');
const daxin=makeIsopod(SPECIES.find(p=>p.id==='daxin'));check(daxin.querySelector('.cephalon').style.getPropertyValue('--base')===daxin.querySelector('.p1').style.getPropertyValue('--base'),'daxin warm anterior');check(daxin.querySelector('.p6').style.getPropertyValue('--base')===daxin.querySelector('.pleon').style.getPropertyValue('--base'),'daxin pale posterior');
host.remove();const output=document.createElement('pre');output.id='browserChecks';output.textContent=JSON.stringify(result,null,2);document.body.append(output);
