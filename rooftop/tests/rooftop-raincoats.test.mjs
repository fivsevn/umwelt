import test from 'node:test';
import assert from 'node:assert/strict';
import {createRainEpisode, actionCaption} from '../resident-weather.mjs';
import {makeWeather,weatherProfile} from '../weather.mjs';
import {makeWalker,actorFits} from '../scene.mjs';
import {filledLayoutFixture} from './fixtures/rooftop-filled-layout.mjs';
import {RAINCOAT_MESHES} from '../fashion/raincoat-meshes.mjs';
import {actorSolidGeometry} from '../3d/actor-solid.mjs';
import {createRequire} from 'node:module';
const T=createRequire(import.meta.url)('../3d/vendor/three.min.js');

test('each rain episode draws once at the exact 50/50 boundary, even across rain types',()=>{
  for(const [sample,expected] of [[0,'raincoat'],[.499999,'raincoat'],[.5,'shelter'],[.999999,'shelter']]) {
    let draws=0;const pick=createRainEpisode(()=>{draws++;return sample;});
    assert.equal(pick({condition:'clear',rain:0}),null);
    for(const condition of ['plum-rain','rain','heavy','thunderstorm','typhoon'])
      for(let i=0;i<30;i++)assert.equal(pick(weatherProfile(condition,'afternoon')),expected);
    assert.equal(draws,1);
    assert.equal(pick({condition:'clear',rain:.1}),expected);
    assert.equal(pick({condition:'clear',rain:0,wetness:1}),null);
    assert.equal(pick({condition:'clear',rain:0,rainIntent:.2}),expected);
    assert.equal(draws,2);
  }
});
test('weather shares the episode from first frame through transitions and redraws only after drying',()=>{
  let draws=0;const weather=makeWeather({condition:'rain',random:()=>++draws===1?.1:.9});
  assert.equal(weather.state.rainMode,'raincoat');
  weather.set('condition','heavy');weather.update(8);assert.equal(weather.state.rainMode,'raincoat');
  weather.set('phase','late');weather.update(8);assert.equal(draws,1);
  weather.set('condition','clear');weather.update(1);assert.equal(weather.state.rainMode,'raincoat');
  weather.update(8);assert.equal(weather.state.rainMode,null);
  weather.set('condition','rain');weather.update(.01);assert.equal(weather.state.rainMode,'shelter');assert.equal(draws,2);
});
test('both coated residents walk collision-free without gardening in both terraces, then remove coats indoors and when rain stops',()=>{
  for(const scene of ['north','south']) {
    const objects=filledLayoutFixture().scenes[scene];let state={...weatherProfile('rain','day'),rainMode:'raincoat'},pig;
    const person=makeWalker(scene,()=>objects,{environment:()=>state,company:()=>[pig?.person]});
    pig=makeWalker(scene,()=>objects,{visits:7,actor:'pig',environment:()=>state,body:{radius:.76,height:1},company:()=>[person.person]});
    person.randomize();pig.randomize();const starts=[person.person,pig.person].map(p=>[p.x,p.y]);const moved=[false,false];
    for(let i=0;i<3000;i++){
      person.update(.1);pig.update(.08);
      for(const [j,walker] of [person,pig].entries()){
        const p=walker.person;assert.equal(p.raincoat,true);assert.equal(p.radius,.76);assert.equal(p.sheltered,false);assert.ok(!p.insideShelter);
        assert.ok(!['water','prune','sweep','wash','tend'].includes(p.state));
        assert.ok(actorFits(scene,objects,p.x,p.y,j?{radius:.76,height:1}:{radius:.76,height:2.42}));
        moved[j] ||= Math.hypot(p.x-starts[j][0],p.y-starts[j][1])>15;
      }
    }
    assert.deepEqual(moved,[true,true]);
    assert.match(actionCaption(person.person,pig.person,{weather:state,scene}),/透明雨衣/);
    state=weatherProfile('clear','day');person.update(.1);pig.update(.1);
    assert.equal(person.person.raincoat,false);assert.equal(pig.person.raincoat,false);
  }
  const indoor=makeWalker('room',()=>[],{environment:()=>({...weatherProfile('heavy','day'),rainMode:'raincoat'})});
  indoor.update(.1);assert.equal(indoor.person.raincoat,false);
});
test('Blender-exported coats include articulated sleeves and open hoods with valid triangles',()=>{
  assert.deepEqual(new Set(RAINCOAT_MESHES.map(p=>p.joint)),new Set(['body','head','arm0','arm1','pig','pigFace']));
  for(const part of RAINCOAT_MESHES){
    const g=actorSolidGeometry(T,part.vertices,part.faces),p=g.attributes.position;
    assert.ok(p.count>0,part.name);
    for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).length()>1e-9,part.name);}
    g.dispose();
  }
});

test('wide kosode rain sleeves stay on the shoulder joints and cover the hanging cuffs',async()=>{
  const {attachRaincoat}=await import('../fashion/raincoats.mjs');
  const actor={body:new T.Group(),head:new T.Group(),arms:[new T.Group(),new T.Group()]};
  const api={group(parent){const group=new T.Group();parent.add(group);return group;},solid(){}};
  const coats=attachRaincoat(api,actor,'person','kosode');
  for(const arm of actor.arms){const layer=coats.find(g=>g.parent===arm);assert.deepEqual(layer.scale.toArray(),[1.25,1.25,1]);assert.equal(layer.visible,false);}
  const sleeve=RAINCOAT_MESHES.find(p=>p.name==='Dongdong-sleeve-0');
  assert.ok(Math.min(...sleeve.vertices.map(v=>v[1]))*1.25<-.64);
  assert.ok(Math.min(...sleeve.vertices.map(v=>v[0]))*1.25<-.225);
  assert.deepEqual(actor.arms[0].scale.toArray(),[1,1,1]);
});
