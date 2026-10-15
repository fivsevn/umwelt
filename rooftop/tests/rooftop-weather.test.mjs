import test from 'node:test';
import assert from 'node:assert/strict';
import {WEATHER,TIMES,timeOfDay,automaticWeather,weatherProfile,makeWeather,foliageOffset,materialColor} from '../weather.mjs';
import { lightingProfile, atmosphereCaption } from '../atmosphere.mjs';
import { weatherAction } from '../resident-weather.mjs';
import {litWindows} from '../city.mjs';
test('night stages follow the clock and late lights are a strict subset of evening rooms',()=>{assert.deepEqual([0,6,8,17,19,23].map(h=>timeOfDay(h,{year:2026,month:10,day:15})),['late','dawn','morning','dusk','evening','late']);for(const uprightCity of [false,true]){const bounds={x:0,y:0,w:640,h:520},key=w=>w.seed+':'+w.index,early=new Set(litWindows(bounds,.42,{uprightCity}).map(key)),late=litWindows(bounds,.045,{uprightCity});assert.ok(late.length>0&&late.length<early.size/3);assert.ok(late.every(w=>early.has(key(w))));}});
test('all weather and time combinations remain finite, distinguishable and transition smoothly',()=>{const states=WEATHER.flatMap(w=>TIMES.map(p=>weatherProfile(w.id,p.id)));assert.ok(states.every(s=>['wind','rain','cloud','fog','night','lamps','lightAmount'].every(k=>Number.isFinite(s[k])&&s[k]>=0)));const clock=makeWeather({condition:'clear',phase:'day'}),before=clock.state;clock.set('condition','heavy');clock.set('phase','late');clock.update(.05);assert.ok(clock.state.rain>0&&clock.state.rain<1);assert.ok(clock.state.lightAmount>before.lightAmount&&clock.state.lightAmount<.82);for(let i=0;i<200;i++)clock.update(.05);assert.equal(clock.state.lightTint,weatherProfile('heavy','late').lightTint);assert.ok(clock.state.rain>.999)});
test('thin foliage responds to wind while succulent bodies stay rigid',()=>{const offsets=wind=>Array.from({length:80},(_,i)=>foliageOffset(-24,0,i*.1,wind,'fern',2));assert.ok(offsets(.32).some(v=>v!==0),'even a gentle breeze has visible leaf movement');assert.ok(Math.max(...offsets(2.1).map(Math.abs))>Math.max(...offsets(.32).map(Math.abs)));assert.ok(Array.from({length:80},(_,i)=>foliageOffset(-24,0,i*.1,2.1,'barrel',2)).every(v=>Math.abs(v)<=1));});

test('material lighting preserves colour separation and sunset distinguishes light from shade',()=>{const s=weatherProfile('clear','dusk');const lit=materialColor(160,155,135,s,.95),shadow=materialColor(160,155,135,s,.18);assert.ok(lit[0]-shadow[0]>40);assert.ok(lit[0]>lit[2]+40);const leaf=materialColor(85,120,65,s,.18);assert.ok(leaf[1]>leaf[0]&&leaf[1]>leaf[2]);const night=weatherProfile('clear','late');assert.ok(materialColor(165,160,140,night,.5)[1]-materialColor(60,65,45,night,.5)[1]>40)});
test('water accumulates in rain and remains while the roof dries after clearing',()=>{const clock=makeWeather({condition:'clear',phase:'day'});clock.set('condition','heavy');for(let i=0;i<200;i++)clock.update(.05);const water=clock.state.wetness;assert.ok(water>.8);clock.set('condition','clear');for(let i=0;i<160;i++)clock.update(.05);assert.ok(clock.state.rain<.001);assert.ok(clock.state.wetness>water*.7&&clock.state.wetness<water)});

test('daytime stages and map orientations have distinct solar directions',async()=>{const {shadowVector}=await import('../weather.mjs');assert.deepEqual([6,9,12,15,17].map(h=>timeOfDay(h,{year:2026,month:10,day:15})),['dawn','morning','day','afternoon','dusk']);for(const phase of ['dawn','morning','day','afternoon','dusk']){const n=shadowVector(phase),s=shadowVector(phase,'south');assert.equal(s.x,n.y);assert.equal(s.y,-n.x)}assert.ok(shadowVector('dawn').x<0);assert.ok(shadowVector('dusk').x>0);assert.ok(shadowVector('day').y<0);assert.equal(shadowVector('day').x,0)});

test('garage manual changes settle promptly and rapid changes continue from the current appearance', () => {
  const clock = makeWeather({ condition: 'clear', phase: 'day', season: 'spring', manualTransition: .65 });
  assert.equal(clock.update(0).transition.mix, 1, 'an unchanged initial sky is already settled');
  clock.set('season', 'winter');
  clock.update(.3);
  const partial = clock.state.seasonwinter;
  assert.ok(partial > 0 && partial < 1);
  clock.set('phase', 'late');
  assert.equal(clock.update(0).seasonwinter, partial, 'interrupting a blend does not jump');
  clock.update(.65);
  assert.equal(clock.state.transition.mix, 1);
  assert.equal(clock.state.seasonwinter, 1);
  assert.equal(clock.state.lightTint, weatherProfile('clear', 'late', 'winter').lightTint);
  const automatic = makeWeather({ condition: 'clear', phase: 'auto', now: () => new Date(2026, 9, 8, 12) });
  automatic.set('condition', 'heavy');
  assert.equal(automatic.update(.65).transition.duration, 8, 'ordinary weather keeps its gradual transition');
});

test('weather choices share one overcast option and the automatic clock retains its cadence', () => {
  assert.deepEqual(WEATHER.map(({ id }) => id), ['clear', 'partly-cloudy', 'overcast', 'plum-rain', 'rain', 'heavy', 'wind', 'thunderstorm', 'typhoon', 'mist', 'snow']);
  assert.equal(WEATHER.find(({ id }) => id === 'overcast').name, '阴天');
  for (let i = 0; i < 240; i++) {
    const start = i * 720000, condition = automaticWeather(start, 6);
    assert.ok(WEATHER.some(w=>w.id===condition));
    assert.equal(automaticWeather(start + 719999, 6), condition);
  }
  assert.ok(WEATHER.some(w=>w.id===automaticWeather(-1)));
});

test('legacy cloudy links, saved choices and direct calls resolve to the unchanged overcast profile', () => {
  for (const season of ['spring', 'summer', 'autumn', 'winter']) for (const { id: phase } of TIMES) {
    assert.deepEqual(weatherProfile('cloudy', phase, season), weatherProfile('overcast', phase, season));
    assert.deepEqual(lightingProfile({ id: 'cloudy' }, phase, season), lightingProfile({ id: 'overcast' }, phase, season));
  }
  const saved = { condition: 'cloudy', phase: 'afternoon', season: 'autumn' },
    restored = makeWeather(saved), overcast = makeWeather({...saved,condition:'overcast'}).state;
  assert.equal(saved.condition, 'cloudy', 'restoring a legacy choice does not mutate stored data');
  assert.equal(restored.choices.condition, 'overcast', 'the shared selectors receive an existing option');
  assert.deepEqual(restored.state, overcast);
  assert.equal(overcast.tint, '#67777e');
  assert.equal(overcast.direct, 0);
  const legacy = { ...overcast, condition: 'cloudy', visualCondition: 'cloudy', activityCondition: 'cloudy' };
  assert.equal(atmosphereCaption(legacy), atmosphereCaption(overcast));
  for (const actor of ['person', 'pig']) for (let step = 0; step < 3; step++) {
    assert.deepEqual(weatherAction(legacy, actor, step), weatherAction(overcast, actor, step));
  }
  const clock = makeWeather({ condition: 'clear', phase: 'day', season: 'spring', manualTransition: .65 });
  clock.set('condition', 'cloudy');
  assert.equal(clock.choices.condition, 'overcast');
  const partial = clock.update(.3);
  assert.equal(partial.condition, 'overcast');
  assert.equal(partial.transition.duration, .65);
  assert.ok(partial.cloud > .2 && partial.cloud < 1, 'a legacy manual choice still blends instead of jumping');
  clock.set('condition', 'overcast');
  assert.equal(clock.update(0).transition.elapsed, .3, 'an alias of the same weather does not restart its transition');
  assert.equal(clock.update(.35).lightTint, weatherProfile('overcast', 'day', 'spring').lightTint);
});
