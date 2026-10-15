import { CLIMATE_LOCATION } from './climate.mjs';

export const WEATHER_CACHE_KEY = 'umwelt-rooftop-haohe-weather-v1';
export const WEATHER_REFRESH_MS = 20 * 60 * 1000;
export const WEATHER_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const WEATHER_TIMEOUT_MS = 4000;
export const WEATHER_ATTRIBUTION = 'https://open-meteo.com/';
const fields = 'temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,precipitation,snowfall';
export const LIVE_WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${CLIMATE_LOCATION.latitude}&longitude=${CLIMATE_LOCATION.longitude}&current=${fields}&wind_speed_unit=ms&timeformat=unixtime&timezone=Asia%2FShanghai&forecast_days=1`;
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const codes = new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99]);
const inRange = (n,min,max) => Number.isFinite(n) && n>=min && n<=max;

// Only requested scalar weather values are retained. No returned grid metadata,
// location lookup, user location, SDK or API credentials enter the game.
export function parseCurrentWeather(data, receivedAt = Date.now()) {
  const c=data?.current;
  if (!c || !codes.has(c.weather_code) || !inRange(c.time*1000,receivedAt-WEATHER_MAX_AGE_MS,receivedAt+15*60000)
    || !inRange(c.interval,60,3600) || !inRange(c.temperature_2m,-60,60)
    || !inRange(c.cloud_cover,0,100) || !inRange(c.wind_speed_10m,0,100)
    || !inRange(c.wind_gusts_10m,0,150) || !inRange(c.precipitation,0,300) || !inRange(c.snowfall,0,100)) return null;
  const code=c.weather_code;
  let condition=code===0||code===1?'clear':code===2?'partly-cloudy':code===3?'overcast':code===45||code===48?'mist'
    :[71,73,75,77,85,86].includes(code)?'snow':code>=95?'thunderstorm'
    :[63,65,67,81,82].includes(code)?'heavy':'rain';
  if (['clear','partly-cloudy'].includes(condition) && c.wind_speed_10m>=8) condition='wind';
  // A strong wind does not establish a typhoon; isolated rain does not establish
  // a Meiyu episode. Those two labels remain manual/simulated previews.
  const rainRate = c.precipitation*3600/c.interval;
  const effects={cloud:c.cloud_cover/100,wind:clamp(.15+c.wind_speed_10m*.2+c.wind_gusts_10m*.025,.15,3.8),
    rain:['rain','heavy','thunderstorm'].includes(condition)?clamp(.12+rainRate*.09,.15,1):0,
    snow:condition==='snow'?clamp(.25+c.snowfall*3600/c.interval*.25,.25,1):0};
  return {condition,effects,temperature:c.temperature_2m,observedAt:c.time*1000,receivedAt,code};
}
function validRecord(record, now) {
  return record && codes.has(record.code) && inRange(record.observedAt,now-WEATHER_MAX_AGE_MS,now+15*60000)
    && inRange(record.receivedAt,now-WEATHER_MAX_AGE_MS,now+60000) && inRange(record.temperature,-60,60)
    && ['clear','partly-cloudy','overcast','mist','wind','rain','heavy','thunderstorm','snow'].includes(record.condition)
    && inRange(record.effects?.wind,0,3.8) && inRange(record.effects?.cloud,0,1)
    && inRange(record.effects?.rain,0,1) && inRange(record.effects?.snow,0,1);
}
export function createLiveWeather({fetcher=(...args)=>fetch(...args),storage=null,now=Date.now,
  timeoutMs=WEATHER_TIMEOUT_MS,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let record=null, inFlight=null, controller=null, timer=null, stopped=false, failed=false, lastAttempt=-Infinity;
  let enabled=()=>true, doc=null, loadedCache=false;
  function readCache() {
    if(loadedCache)return;loadedCache=true;
    try { const cache=JSON.parse(storage?.getItem(WEATHER_CACHE_KEY)||'null');
      if(cache?.version===1&&validRecord(cache.record,now())) record=cache.record;
    } catch {} // Storage restrictions must never prevent rendering or fetching.
  }
  function snapshot() {
    readCache();
    if(!validRecord(record,now()))return {status:failed||record?'unavailable':'pending',record:null};
    return {status:failed||now()-record.receivedAt>=WEATHER_REFRESH_MS?'cached':'current',record};
  }
  function refresh() {
    if(stopped)return Promise.resolve(snapshot());
    if(inFlight)return inFlight;
    readCache();
    if(now()-lastAttempt<WEATHER_REFRESH_MS || (validRecord(record,now())&&now()-record.receivedAt<WEATHER_REFRESH_MS))return Promise.resolve(snapshot());
    lastAttempt=now();controller=new AbortController();
    inFlight=(async()=>{
      let timeout;
      try {
        const deadline=new Promise((_,reject)=>{timeout=setTimer(()=>{controller?.abort();reject(new Error('Weather timeout'));},timeoutMs);});
        const data=await Promise.race([(async()=>{
          const response=await fetcher(LIVE_WEATHER_URL,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
          if(!response.ok)throw new Error('Weather unavailable');
          return response.json();
        })(),deadline]);
        const next=parseCurrentWeather(data,now());if(!next)throw new Error('Invalid weather');
        if(!stopped){record=next;failed=false;try{storage?.setItem(WEATHER_CACHE_KEY,JSON.stringify({version:1,record}));}catch{}}
      } catch {if(!stopped)failed=true;}
      finally {clearTimer(timeout);controller=null;}
      return snapshot();
    })().finally(()=>{inFlight=null;});
    return inFlight;
  }
  function schedule() {
    clearTimer(timer);
    if(stopped)return;
    // Manual previews and background tabs perform no weather requests.
    if(enabled()&&!doc?.hidden)void refresh();
    timer=setTimer(schedule,WEATHER_REFRESH_MS);
  }
  function resume() {if(!stopped&&enabled()&&!doc?.hidden)void refresh();}
  return {snapshot,refresh,resume,
    start({isEnabled=()=>true,document:documentRef=null}={}) {
      enabled=isEnabled;doc=documentRef;stopped=false;readCache();
      doc?.addEventListener('visibilitychange',resume);schedule();
    },
    stop(){stopped=true;clearTimer(timer);controller?.abort();doc?.removeEventListener('visibilitychange',resume);},
  };
}
const weatherClock = new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false});
function observedName(code, fallback) {
  if(code===0)return '晴';if(code===1)return '大部晴朗';if(code===2)return '多云';if(code===3)return '阴';
  if([45,48].includes(code))return '雾';if([51,53,55].includes(code))return '毛毛雨';
  if([56,57,66,67].includes(code))return '冻雨';
  if(code===61)return '小雨';if(code===63)return '中雨';if(code===65)return '大雨';
  if([80,81,82].includes(code))return '阵雨';if([85,86].includes(code))return '阵雪';
  if([71,73,75,77].includes(code))return '雪';if(code>=95)return '雷雨';return fallback;
}
export function weatherSourceLabel(state, locationLabel='濠河附近') {
  if(!state.weatherSource || state.weatherSource==='manual')return '';
  if(state.weatherSource==='simulated')return '季节天气模拟';
  if(state.weatherSource==='fallback')return '实时天气暂不可用 · 暂用季节天气';
  if(state.weatherSource==='pending')return '正在更新实时天气 · 先用季节天气';
  const clock=weatherClock.format(new Date(state.weatherObservedAt));
  return `${locationLabel} · ${observedName(state.weatherCode,state.name)} ${Math.round(state.temperature)}° · ${clock}${state.weatherSource==='cached'?' 缓存':''} · Open-Meteo`;
}
export function updateWeatherCredit(element,state,locationLabel) {
  if(!element)return;
  const label=weatherSourceLabel(state,locationLabel),live=state.weatherSource==='current'||state.weatherSource==='cached';
  if(element.textContent===label)return;
  element.replaceChildren();element.hidden=!label;
  if(live) {
    const link=document.createElement('a');link.href=WEATHER_ATTRIBUTION;link.target='_blank';link.rel='noopener noreferrer';link.textContent=label;
    link.title='Open-Meteo 当前网格天气；用于游戏效果的映射。数据许可 CC BY 4.0。';element.append(link);
  } else element.textContent=label;
}
