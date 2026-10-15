import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIMATE_LOCATION, MONTHS, chongchuanDate, solarDay, solarVector, timeBands, phaseAtHour, phaseHour, climateWeatherWeights, localWeather } from '../climate.mjs';
import { FESTIVALS, festivalsAt, festivalContext } from '../festivals.mjs';
import { WEATHER, TIMES, makeWeather, timeOptions } from '../weather.mjs';
import { seasonalStrength } from '../seasons.mjs';
import { terraceAtmosphereMood } from '../3d/atmosphere.mjs';
import { reviewURL } from '../review-state.mjs';

const fixed = () => new Date('2026-10-15T12:00:00+08:00');
test('regional calendar uses Beijing time across UTC day, month and year boundaries', () => {
  assert.deepEqual(chongchuanDate(new Date('2026-02-28T16:00:00Z')), {year:2026,month:3,day:1,hour:0});
  assert.deepEqual(chongchuanDate(new Date('2026-12-31T16:30:00Z')), {year:2027,month:1,day:1,hour:.5});
  assert.equal(MONTHS.length,12);assert.equal(new Set(MONTHS.map(m=>m.name)).size,12);
  assert.equal(CLIMATE_LOCATION.timeZone,'Asia/Shanghai');
});

test('seven quarter-hour bands cover every local minute exactly once throughout the year', () => {
  for (let month=1;month<=12;month++) {
    const date={year:2026,month,day:15}, bands=timeBands(date);
    assert.deepEqual(bands.map(b=>b.id),TIMES.map(t=>t.id));
    for (const b of bands) {
      assert.ok(b.start<b.end);assert.equal(b.start*4,Math.round(b.start*4));
      assert.equal(phaseAtHour(phaseHour(b.id,date),date),b.id,'manual lighting stays within its displayed period');
    }
    for(let minute=0;minute<1440;minute++) {
      const h=minute/60, matches=bands.filter(b=>b.end>24?h>=b.start||h<b.end-24:h>=b.start&&h<b.end);
      assert.equal(matches.length,1);assert.equal(phaseAtHour(h,date),matches[0].id);
    }
    assert.equal(phaseAtHour(23,date),'late');assert.equal(phaseAtHour(24,date),'late');
    assert.deepEqual(timeOptions(String(month),fixed()),bands);
  }
});

test('Chongchuan solar geometry gives longer summer days and lower winter light', () => {
  const summer={year:2026,month:6,day:21}, winter={year:2026,month:12,day:21};
  const s=solarDay(summer),w=solarDay(winter);
  assert.ok(s.sunrise>4.6&&s.sunrise<5.1);assert.ok(s.sunset>18.8&&s.sunset<19.3);
  assert.ok(w.sunrise>6.7&&w.sunrise<7.2);assert.ok(w.sunset>16.7&&w.sunset<17.3);
  assert.ok(s.sunset-s.sunrise>w.sunset-w.sunrise+4);
  for(const date of [summer,winter,{year:2028,month:2,day:29}]) {
    const solar=solarDay(date), morning=solarVector(solar.sunrise+.6,date), dusk=solarVector(solar.sunset-.6,date), noon=solarVector(solar.noon,date);
    assert.ok(morning[0]>0&&dusk[0]<0&&morning[1]>0&&dusk[1]>0);
    assert.ok(Math.abs(noon[0])<1e-10&&noon[2]>0);
    assert.ok(Object.values(solar).every(Number.isFinite));
  }
  assert.ok(solarVector(w.noon,winter)[1]<solarVector(s.noon,summer)[1]*.65);
});

test('regional game weights constrain plum rain, typhoons and snow without forcing every winter day to snow', () => {
  for(let month=1;month<=12;month++) {
    const w=climateWeatherWeights(month);
    assert.ok(Object.values(w).every(n=>n>=0&&Number.isFinite(n)));
    assert.equal(w['plum-rain']>0,[6,7].includes(month));
    assert.equal(w.typhoon>0,month>=6&&month<=10);
    assert.equal(w.snow>0,[1,2,12].includes(month));
    assert.ok(w.clear>0&&w.overcast>0&&w.rain>0);
  }
  assert.ok(climateWeatherWeights(10).clear>climateWeatherWeights(6).clear);
  assert.ok(climateWeatherWeights(7,15).thunderstorm>climateWeatherWeights(7,8).thunderstorm);
  assert.ok(climateWeatherWeights(10,5).mist>climateWeatherWeights(10,12).mist);
  const ids=new Set(WEATHER.map(w=>w.id));
  for(let slot=0;slot<12000;slot++) {
    const ms=Date.UTC(2026,0,1)+slot*720000, choice=localWeather(ms,7);
    assert.ok(ids.has(choice));assert.equal(localWeather(ms+719999,7),choice);
    assert.notEqual(choice,'snow','summer simulation never produces snow');
  }
  assert.ok(!ids.has('summer-snow'));
});

test('month/weather/phase combinations remain finite and changing months retains manual weather', () => {
  for(const {id:month} of MONTHS) for(const {id:condition} of WEATHER) for(const {id:phase} of TIMES) {
    const weather=makeWeather({month,condition,phase,now:fixed}),state=weather.update(.1);
    assert.equal(state.month,Number(month));
    assert.ok(Object.entries(state).filter(([,v])=>typeof v==='number').every(([,v])=>Number.isFinite(v)));
    assert.ok(state.direct>=0&&state.sunY>=0,'manual daytime samples are above the horizon');
  }
  const weather=makeWeather({condition:'plum-rain',phase:'day',month:'6',now:fixed});
  weather.set('month','1');weather.update(9);
  assert.equal(weather.state.condition,'plum-rain');assert.equal(weather.state.season,'winter');
  const url=reviewURL('http://localhost/rooftop/',{month:'7',festival:'qixi'});
  assert.equal(url.searchParams.get('month'),'7');assert.equal(url.searchParams.get('festival'),'qixi');
});

test('snow is a weather event independent of winter and fades continuously', () => {
  const weather=makeWeather({condition:'clear',phase:'day',month:'1',now:fixed}),clear=weather.state;
  assert.equal(clear.snow,0);assert.equal(seasonalStrength(clear,'winter'),0);
  assert.equal(terraceAtmosphereMood(clear).snowCover,0);
  weather.set('condition','snow');const partial=weather.update(4);
  assert.ok(partial.snow>0&&partial.snow<.7);weather.update(4);
  assert.equal(seasonalStrength(weather.state,'winter'),.7);
  const strength=weather.state.snow;weather.set('condition','clear');assert.equal(weather.update(0).snow,strength);
  weather.update(8);assert.equal(weather.state.snow,0);

});

test('holiday slots resolve actual solar/lunar dates in Beijing time and stay empty', () => {
  for(const [date,id] of [['2026-01-01','new-year'],['2026-02-17','spring-festival'],['2026-03-03','lantern'],['2026-06-19','dragon-boat'],['2026-09-25','mid-autumn'],['2026-10-01','national-day']]) {
    assert.ok(festivalsAt(new Date(date+'T12:00:00+08:00')).some(f=>f.id===id),date);
  }
  assert.ok(festivalsAt(new Date('2026-02-16T16:00:00Z')).some(f=>f.id==='spring-festival'));
  assert.ok(!festivalsAt(new Date('2026-02-16T15:59:59Z')).some(f=>f.id==='spring-festival'));
  // Leap seventh month in 2006 must not repeat Qixi.
  assert.ok(!festivalsAt(new Date('2006-08-30T12:00:00+08:00')).some(f=>f.id==='qixi'));
  assert.equal(new Set(FESTIVALS.map(f=>f.id)).size,18);
  for(const f of FESTIVALS)assert.deepEqual(f.slots,{north:null,south:null,room:null});
  assert.deepEqual(festivalContext(fixed(),'none').ids,[]);
  const preview=makeWeather({month:'1',festival:'mid-autumn',now:fixed}).state;
  assert.deepEqual(preview.festivals.ids,['mid-autumn']);assert.ok(preview.festivals.reserved);
  assert.equal(preview.month,1,'previewing a festival does not change the chosen month');
});

test('automatic clock crosses a time boundary smoothly and keeps the intended solar horizon', () => {
  let date=new Date('2026-01-15T06:29:59+08:00');
  const weather=makeWeather({condition:'clear',now:()=>date});
  assert.equal(weather.state.phase,'late');
  date=new Date('2026-01-15T06:30:00+08:00');
  const initial=weather.update(0);
  assert.equal(initial.phase,'dawn');assert.equal(initial.transition.duration,18);
  weather.update(18);
  assert.equal(weather.state.direct,0,'no direct sun before sunrise');
  assert.equal(weather.state.sun,0,'canvas fallback also suppresses pre-sunrise shadows');
  date=new Date('2026-01-15T08:00:00+08:00');weather.update(18);
  assert.equal(weather.state.phase,'morning');assert.ok(weather.state.direct>0);
  assert.equal(weather.choices.condition,'clear','time updates preserve a manual weather choice');
});

test('Western and Japanese festival dates include variable dates and a manual seasonal slot',()=>{
  const dates=[['2026-02-14','valentine'],['2026-04-05','easter'],['2028-04-16','easter'],
    ['2026-10-31','halloween'],['2026-11-26','thanksgiving'],['2028-11-23','thanksgiving'],
    ['2026-12-25','christmas'],['2026-03-03','hinamatsuri'],['2026-05-05','children-japan'],
    ['2026-07-07','tanabata'],['2026-08-13','obon'],['2026-08-16','obon']];
  for(const [date,id]of dates)assert.ok(festivalsAt(new Date(date+'T12:00:00+08:00')).some(f=>f.id===id),date+id);
  for(const date of ['2026-08-12','2026-08-17'])assert.ok(!festivalsAt(new Date(date+'T12:00:00+08:00')).some(f=>f.id==='obon'));
  assert.deepEqual(festivalContext(fixed(),'hanami').airSlots,[null]);
  for(const f of FESTIVALS)assert.equal(f.airSlot,null);
  const base=makeWeather({condition:'clear',month:'3',phase:'day',festival:'none',now:fixed}).state;
  for(const f of FESTIVALS){const state=makeWeather({condition:'clear',month:'3',phase:'day',festival:f.id,now:fixed}).state;
    for(const key of ['petals','rain','snow','sunX','sunY','sunZ','month','phase'])assert.equal(state[key],base[key],f.id+key);}
});
