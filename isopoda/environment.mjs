// Spatial traces advance with observation turns, never with frame rate or wall time.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function environmentFor(s){
 if(s.environment?.version===1)return s.environment;
 return s.environment={version:1,wetZones:[{x:42,y:215,rx:30,ry:202,moisture:s.humidity}],leaves:[{id:'leaf-a',x:275,y:110,a:-.45,gap:true,age:0},{id:'leaf-b',x:290,y:344,a:.35,gap:true,age:0},...(s.cover>65?[{id:'leaf-old',x:90,y:315,a:-.15,gap:true,age:0}]:[])],foodNodes:s.food?[{x:320,y:258,amount:s.food,age:0}]:[],shelter:{x:190,y:215},disturbance:0,scuffs:[],removedShells:[]};
}
export function changeEnvironment(s,id){
 const e=environmentFor(s),turn=s.records.length;
 if(['mist','wet-left','wet-all'].includes(id)){
  e.wetZones[0].moisture=clamp(e.wetZones[0].moisture+22,15,100);
  if(id==='wet-all'){if(!e.wetZones[1])e.wetZones.push({x:265,y:235,rx:90,ry:145,moisture:25});e.wetZones[1].moisture=clamp(e.wetZones[1].moisture+40,15,100)}
 }
 if(id==='air')for(const z of e.wetZones)z.moisture=Math.max(12,z.moisture-15);
 if(['leaf','gap','flat'].includes(id)){const n=e.leaves.length;e.leaves.push({id:'leaf-'+turn,x:85+(n%3)*85,y:300-Math.floor(n/3)*48,a:(n%3-1)*.35,gap:id!=='flat',age:0})}
 if(id==='food')e.foodNodes.push({x:310-(turn%3)*24,y:258+(turn%2)*30,amount:1,age:0});
 if(id==='clean'){let left=2;for(const f of e.foodNodes){const take=Math.min(left,f.amount);f.amount-=take;left-=take}}
 if(id==='remove'&&s.scene?.encounter&&!e.removedShells.includes(s.scene.encounter))e.removedShells.push(s.scene.encounter);
 if(['lift','clean','remove','wet-all','flat'].includes(id)){
  e.disturbance=3;e.scuffs.push({x:e.shelter.x,y:e.shelter.y+30,turn});
  if(id==='lift'){e.shelter.x=190+(turn%2?12:-12);e.shelter.y=209}
 }
 return e;
}
export function ageEnvironment(s){
 const e=environmentFor(s);
 for(const z of e.wetZones)z.moisture=Math.max(12,z.moisture-(s.vent>70?8:4));
 for(const l of e.leaves)l.age++;
 if(s.period===0){let remaining=1;for(const f of e.foodNodes){const take=Math.min(remaining,f.amount);f.amount-=take;remaining-=take;f.age++}}
 e.disturbance=Math.max(0,e.disturbance-1);
}
export function environmentTarget(s,c){
 const e=s.environment;if(!e)return null;
 const food=e.foodNodes.filter(f=>f.amount>0);
 if(e.disturbance||s.light>65)return {...e.shelter,kind:'shelter'};
 if(food.length&&c.id%2===0)return {...food[c.id%food.length],kind:'food'};
 if(c.id%2===1||s.humidity<58){const z=e.wetZones.reduce((a,b)=>a.moisture>b.moisture?a:b);return {x:z.x+12+c.id*4,y:90+c.id*55,kind:'wet'}}
 const leaf=e.leaves[c.id%e.leaves.length];return {...leaf,kind:leaf.gap?'shelter':'edge'};
}
