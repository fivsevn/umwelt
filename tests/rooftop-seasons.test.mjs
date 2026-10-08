import test from "node:test";
import assert from "node:assert/strict";
import { SEASONS, seasonAt, seasonalParticle, seasonalStrength, paintSeasonalAir } from "../rooftop/seasons.mjs";
import { makeWeather } from "../rooftop/weather.mjs";
test("calendar season includes December/January and switches smoothly at a month boundary",()=>{
  assert.deepEqual(Array.from({length:12},(_,i)=>seasonAt(new Date(2026,i,15))),["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"]);
  let date=new Date(2026,1,28,23,59);const weather=makeWeather({now:()=>date,condition:"clear",phase:"day"});
  assert.equal(weather.state.season,"winter"); date=new Date(2026,2,1);
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
    paintSeasonalAir(ctx,640,520,{season:s.id,wind:.4},2,{reduced:true});
    assert.ok(marks.length>=s.count);assert.equal(balance,0);
  }
});
