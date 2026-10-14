import {filledLayoutFixture} from "./fixtures/rooftop-filled-layout.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLayout,validateLayout,makeWalker,inside,asset} from '../scene.mjs';
import {INITIAL_LAYOUT} from '../initial-layout.mjs';
test('the authored native starting layout keeps all three arrangements in independent copies',()=>{
  const a=initialLayout(),b=initialLayout();assert.deepEqual(validateLayout(a),a);assert.deepEqual(a,INITIAL_LAYOUT);
  assert.deepEqual(Object.fromEntries(Object.entries(a.scenes).map(([scene,objects])=>[scene,objects.length])),{north:83,south:14,room:21});
  a.scenes.north[0].x+=4;
  a.scenes.north.find(o=>o.support).support.id='changed';
  a.scenes.room.length=0;
  assert.deepEqual(b,INITIAL_LAYOUT,'editing one player arrangement cannot change the next player default');
});
test('Dongdong reaches tasks in the dense authored roof and inspects dry plants without watering them',()=>{const l=filledLayoutFixture();for(const scene of ['north','south']){const w=makeWalker(scene,()=>l.scenes[scene]),states=new Set();for(let i=0;i<90000;i++){w.update(.1);const p=w.person;states.add(p.state);assert.ok(inside(scene,p.x,p.y));assert.ok(['north','south','east','west'].includes(p.facing));const target=l.scenes[scene].find(o=>o.id===p.targetId);if(p.state==='water')assert.ok(!['仙人掌','多肉'].includes(asset(target.type).botanicalCategory));}assert.ok(w.person.visits>20);if(scene==='north')for(const state of ['water','tend','wipe','prune','inspect','sweep'])assert.ok(states.has(state),state)}});

test('Dongdong and the pig keep moving and taking turns among the imported initial furniture',()=>{
  const layout=initialLayout();
  for(const scene of ['north','south']){
    let person,pig;const objects=()=>layout.scenes[scene],environment=()=>({condition:'clear',phase:'afternoon'});
    person=makeWalker(scene,objects,{environment,company:()=>[pig?.person]});
    pig=makeWalker(scene,objects,{actor:'pig',visits:7,body:{radius:.76,height:1},environment,company:()=>[person.person]});
    person.randomize();pig.randomize();
    const actors=[person,pig],starts=actors.map(actor=>({...actor.person})),moved=[false,false];
    for(let step=0;step<12000;step++){
      person.update(.1);pig.update(.08);
      for(const [index,actor] of actors.entries()){
        const p=actor.person;assert.ok(inside(scene,p.x,p.y));
        if(Math.hypot(p.x-starts[index].x,p.y-starts[index].y)>2)moved[index]=true;
      }
    }
    for(const [index,actor] of actors.entries()){
      assert.ok(moved[index],scene+' '+(index?'pig':'Dongdong')+' walks among the furniture');
      assert.ok(actor.person.visits>starts[index].visits,scene+' activities continue beyond the starting task');
    }
  }
});

test('legacy terrace saves gain a room without changing terrace objects',()=>{const expected=initialLayout(),legacy=structuredClone(expected);delete legacy.scenes.room;assert.deepEqual(validateLayout(legacy),expected);const edited=structuredClone(expected);edited.scenes.room=[];assert.deepEqual(validateLayout(edited).scenes.room,[])});
