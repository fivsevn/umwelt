import test from "node:test";
import assert from "node:assert/strict";
import { AIR_GROUPS, SEASONS, seasonAt, seasonalParticle, seasonalStrength, paintSeasonalAir } from "../seasons.mjs";
import { makeWeather } from "../weather.mjs";
test("calendar season includes December/January and switches smoothly at a month boundary",()=>{
  assert.deepEqual(Array.from({length:12},(_,i)=>seasonAt(new Date(`2026-${String(i+1).padStart(2,'0')}-15T12:00:00+08:00`))),["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"]);
  let date=new Date('2026-02-28T23:59:00+08:00');const weather=makeWeather({now:()=>date,condition:"clear",phase:"day"});
  assert.equal(weather.state.season,"winter"); date=new Date('2026-03-01T00:00:00+08:00');
  const first=weather.update(.05); assert.equal(first.season,"spring");assert.ok(first.seasonwinter>.99&&first.seasonspring>0);
  for(let i=0;i<400;i++)weather.update(.05);
  assert.equal(weather.state.seasonspring,1);assert.equal(weather.state.seasonwinter,0);
  weather.set("season","autumn");for(let i=0;i<170;i++)weather.update(.05);assert.equal(weather.state.seasonautumn,1);
  weather.set("season","auto");for(let i=0;i<170;i++)weather.update(.05);assert.equal(weather.state.season,"spring");
});
test("bounded particles distinguish all four seasons, move under reduced motion, and keep stable identities",()=>{
  assert.ok(SEASONS.reduce((n,s)=>n+s.count,0)<=300);
  for(const season of SEASONS){
    for(let i=0;i<season.count;i++){
      const p=seasonalParticle(season.id,i,10,2.8),q=seasonalParticle(season.id,i,11,2.8,true);
      assert.deepEqual(p,seasonalParticle(season.id,i,10,2.8));
      assert.ok([p.x,p.y,p.z,p.angle,p.size].every(Number.isFinite));
      assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&p.z>=0&&p.z<=1);
      assert.notDeepEqual([p.x,p.y,p.z],[q.x,q.y,q.z]);
    }
  }
  assert.equal(seasonalParticle("summer",0,0).kind,1);
  assert.equal(seasonalParticle("spring",0,0).kind,0);
  assert.equal(seasonalParticle("winter",0,0).kind,4);
  assert.deepEqual([0,1,2].map(i=>seasonalParticle("autumn",i,0).kind),[2,3,3]);
  assert.equal(seasonalStrength({season:"summer",rain:1},"summer"),0);
  assert.equal(seasonalStrength({season:"summer",wind:2.8},"summer"),0);
});
test("canvas fallback paints changing seasonal silhouettes and restores drawing state",()=>{
  for(const s of SEASONS){const marks=[];let balance=0;const ctx={save(){balance++},restore(){balance--},fillRect(...args){marks.push(args)}};
    paintSeasonalAir(ctx,640,520,{season:s.id,snow:s.id==='winter'?1:0,wind:.4},2,{reduced:true});
    assert.ok(marks.length>=s.count);assert.equal(balance,0);
  }
});

test('month-selected petals are separate from catkins, rain, and reserved festival art',()=>{
  assert.ok(AIR_GROUPS.reduce((n,s)=>n+s.count,0)<=300);
  const march=makeWeather({condition:'clear',phase:'day',month:'3'}).state;
  const april=makeWeather({condition:'clear',phase:'day',month:'4'}).state;
  const october=makeWeather({condition:'clear',phase:'day',month:'10'}).state;
  assert.ok(march.petals>april.petals&&april.petals>0);assert.equal(october.petals,0);
  assert.ok(seasonalStrength(april,'spring')>seasonalStrength(march,'spring'));
  for(let i=0;i<24;i++)for(const reduced of [false,true]){
    const a=seasonalParticle('petals',i,10,1,reduced),b=seasonalParticle('petals',i,11,1,reduced);
    assert.equal(a.kind,5);assert.ok(a.size<.16);assert.notDeepEqual([a.x,a.y,a.z],[b.x,b.y,b.z]);
    for(const value of [a.x,a.y,a.z])assert.ok(value>=0&&value<=1);
  }
  assert.ok(seasonalStrength({...march,rain:1},'petals')<seasonalStrength(march,'petals'));
  assert.equal(seasonalStrength({...march,snow:1},'petals'),0);
  const marks=[];paintSeasonalAir({save(){},restore(){},fillRect(...v){marks.push(v)}},640,520,march,1,{reduced:true});
  assert.ok(marks.length>72);
});
