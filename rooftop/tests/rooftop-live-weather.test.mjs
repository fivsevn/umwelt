import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveWeather,parseCurrentWeather,LIVE_WEATHER_URL,WEATHER_CACHE_KEY,WEATHER_REFRESH_MS,WEATHER_MAX_AGE_MS,weatherSourceLabel } from '../live-weather.mjs';
import { makeWeather } from '../weather.mjs';
import { calendarAir } from '../calendar-air.mjs';
const epoch=Date.parse('2026-10-16T12:00:00+08:00');
const data=(code=2,time=epoch)=>({current:{time:time/1000,interval:900,weather_code:code,temperature_2m:18.4,cloud_cover:60,wind_speed_10m:4,wind_gusts_10m:7,precipitation:.2,snowfall:.1}});
const response=body=>({ok:true,json:async()=>body});
const memory=()=>{const map=new Map();return {getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};};

test('current WMO data maps to bounded effects without inferring a typhoon or Meiyu event',()=>{
  for(const [codes,condition] of [[[0,1],'clear'],[[2],'partly-cloudy'],[[3],'overcast'],[[45,48],'mist'],
    [[51,53,55,56,57,61,66,80],'rain'],[[63,65,67,81,82],'heavy'],[[71,73,75,77,85,86],'snow'],[[95,96,97,99],'thunderstorm']])
    for(const code of codes){const result=parseCurrentWeather(data(code),epoch);assert.equal(result.condition,condition);for(const key of ['cloud','rain','snow'])assert.ok(result.effects[key]>=0&&result.effects[key]<=1);}
  const gale=data(0);gale.current.wind_speed_10m=25;assert.equal(parseCurrentWeather(gale,epoch).condition,'wind');
  gale.current.weather_code=65;assert.equal(parseCurrentWeather(gale,epoch).condition,'heavy');
  assert.equal(parseCurrentWeather(data(61),epoch).effects.rain,.12+.8*.09);
  const query=new URL(LIVE_WEATHER_URL).searchParams;assert.equal(query.get('latitude'),'32.02');assert.equal(query.get('longitude'),'120.86');assert.equal(query.get('wind_speed_unit'),'ms');
});

test('invalid, missing, stale or future provider values are rejected',()=>{
  for(const [key,value] of [['weather_code',123],['cloud_cover',null],['precipitation',-1],['wind_speed_10m',NaN],['temperature_2m',100],['snowfall',undefined],['interval',0]]){
    const bad=data();bad.current[key]=value;assert.equal(parseCurrentWeather(bad,epoch),null,key);
  }
  assert.equal(parseCurrentWeather(null,epoch),null);
  assert.equal(parseCurrentWeather(data(0,epoch-WEATHER_MAX_AGE_MS-1),epoch),null);
  assert.equal(parseCurrentWeather(data(0,epoch+16*60000),epoch),null);
});

test('creation does not fetch; duplicate requests share one request and fresh cache skips fetching',async()=>{
  let calls=0,release,options;const storage=memory();
  const feed=createLiveWeather({now:()=>epoch,storage,fetcher:(_,o)=>{calls++;options=o;return new Promise(r=>{release=r;});}});
  assert.equal(calls,0);assert.equal(feed.snapshot().status,'pending');
  const first=feed.refresh(),second=feed.refresh();assert.equal(first,second);assert.equal(calls,1);
  release(response(data()));await first;assert.equal(feed.snapshot().status,'current');
  assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
  await feed.refresh();assert.equal(calls,1);
  const cached=createLiveWeather({now:()=>epoch+60000,storage,fetcher:()=>{throw Error('fresh cache should not fetch');}});
  assert.equal(cached.snapshot().record.temperature,18.4);await cached.refresh();assert.equal(cached.snapshot().status,'current');
  const record=JSON.parse(storage.getItem(WEATHER_CACHE_KEY)).record;assert.deepEqual(Object.keys(record).sort(),['code','condition','effects','observedAt','receivedAt','temperature']);
  feed.stop();cached.stop();
});

test('network failures retain usable cache, rate-limit retries, then expire after two hours',async()=>{
  const storage=memory();let time=epoch,calls=0,fail=false;
  const feed=createLiveWeather({now:()=>time,storage,fetcher:async()=>{calls++;if(fail)throw Error('offline');return response(data());}});
  await feed.refresh();time+=WEATHER_REFRESH_MS+1;fail=true;
  assert.equal(feed.snapshot().status,'cached');await feed.refresh();assert.equal(feed.snapshot().status,'cached');
  assert.equal(calls,2);await feed.refresh();assert.equal(calls,2);
  time=epoch+WEATHER_MAX_AGE_MS+1;assert.equal(feed.snapshot().status,'unavailable');assert.equal(feed.snapshot().record,null);
  feed.stop();
});

test('storage failures and a stalled request cannot block the fallback renderer',async()=>{
  let signal;const feed=createLiveWeather({now:()=>epoch,storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},timeoutMs:8,
    fetcher:(_,options)=>{signal=options.signal;return new Promise(()=>{});}});
  const request=feed.refresh();const weather=makeWeather({liveWeather:feed.snapshot,now:()=>new Date(epoch)});
  assert.ok(Number.isFinite(weather.update(.1).sunY));assert.equal(weather.state.weatherSource,'pending');
  await request;assert.ok(signal.aborted);assert.equal(feed.snapshot().status,'unavailable');
  weather.update(18);assert.equal(weather.state.weatherSource,'fallback');assert.ok(weatherSourceLabel(weather.state).includes('暂不可用'));feed.stop();
});

test('manual previews and hidden tabs suspend scheduled requests and visibility resumes them',async()=>{
  let enabled=false,calls=0,listener;const jobs=new Map();let id=0;
  const doc={hidden:false,addEventListener(_,fn){listener=fn;},removeEventListener(){listener=null;}};
  const feed=createLiveWeather({now:()=>epoch,setTimer:fn=>{jobs.set(++id,fn);return id;},clearTimer:key=>jobs.delete(key),fetcher:async()=>{calls++;return response(data());}});
  feed.start({isEnabled:()=>enabled,document:doc});assert.equal(calls,0);feed.resume();assert.equal(calls,0);
  enabled=true;doc.hidden=true;listener();assert.equal(calls,0);doc.hidden=false;listener();await feed.refresh();assert.equal(calls,1);
  feed.stop();assert.equal(listener,null);assert.equal(jobs.size,0);
});

test('real data blends in without changing selected month/time; manual weather never consumes it',()=>{
  let snapshot={status:'pending',record:null};const opts={month:'3',phase:'day',festival:'christmas',now:()=>new Date(epoch),liveWeather:()=>snapshot};
  const weather=makeWeather(opts),before=weather.state;
  snapshot={status:'current',record:parseCurrentWeather(data(65),epoch)};
  const initial=weather.update(0);assert.equal(initial.rain,before.rain);assert.equal(initial.weatherSource,'current');
  const after=weather.update(18);assert.equal(after.rain,snapshot.record.effects.rain);assert.equal(after.condition,'heavy');
  assert.equal(after.month,3);assert.equal(after.phase,'day');assert.equal(after.sunY,before.sunY);assert.equal(after.petals,.65);
  const manual=makeWeather({...opts,condition:'clear'}).state;assert.equal(manual.condition,'clear');assert.equal(manual.weatherSource,'manual');assert.equal(manual.temperature,null);
  const simulated=makeWeather({...opts,condition:'simulated'}).state;assert.equal(simulated.weatherSource,'simulated');assert.equal(simulated.temperature,null);
  assert.equal(calendarAir(3,{airSlots:[null]}).petals,.65);
  assert.deepEqual(calendarAir(10,{airSlots:[{kind:'petals',amount:2}]}),{petals:.8,source:'festival'});
});

test('full-screen HUD retains Beijing date/time, sunset and readable weather',async()=>{
  const {environmentHudSnapshot}=await import('../environment-hud.mjs');
  const state={weatherSource:'current',weatherCode:81,name:'大雨',temperature:18.4,weatherObservedAt:epoch,sunset:'17:24'};
  const view=environmentHudSnapshot(state,new Date('2026-10-15T16:05:00Z'));
  assert.deepEqual(view,{coordinates:'32.02°N 120.86°E',clock:'2026.10.16 00:05',sunset:'日落 17:24',weather:'阵雨 18° · 12:00',live:true});
  const fallback=environmentHudSnapshot({...state,weatherSource:'fallback'},new Date(epoch));
  assert.equal(fallback.live,false);assert.equal(fallback.weather,'天气暂不可用 · 模拟中');
  assert.match(environmentHudSnapshot({...state,weatherSource:'cached'},new Date(epoch)).weather,/缓存/);
});

test('terminal HUD uses fictional marks without encoding location or wall-clock data',async()=>{
  const {environmentSignal}=await import('../terminal-signal.mjs');
  const state={weatherSource:'current',weatherCode:81,name:'大雨',temperature:18.4,weatherObservedAt:epoch,sunset:'17:24'};
  const view=environmentSignal(state,32);
  assert.equal(view.coordinates,'7C4A : 0FB2');assert.equal(view.clock,'+ 0000.0020');assert.equal(view.live,true);
  assert.doesNotMatch(JSON.stringify(view),/32\.02|120\.86|2026|17:24|18\.4|南通|濠河|北京时间|UTC|°/);
  assert.deepEqual(environmentSignal({...state,latitude:0,longitude:0,weatherObservedAt:0,sunset:'01:23',temperature:99},32),view);
  const fallback=environmentSignal({...state,weatherSource:'fallback'},32);
  assert.equal(fallback.live,false);
  assert.equal(environmentSignal({...state,weatherSource:'cached'},32).live,true);
});
