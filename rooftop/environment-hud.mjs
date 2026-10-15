import { CLIMATE_LOCATION, chongchuanDate } from './climate.mjs';
import { weatherSourceLabel, WEATHER_ATTRIBUTION } from './live-weather.mjs';
const pad = n => String(n).padStart(2,'0');
export function environmentHudSnapshot(state, date=new Date()) {
  const local=chongchuanDate(date);
  const source=state.weatherSource;
  let weather=source==='current'||source==='cached'
    ? weatherSourceLabel(state).replace(/^濠河附近 · /,'').replace(/ · Open-Meteo$/,'')
    : source==='pending'?'天气更新中':source==='fallback'?'天气暂不可用 · 模拟中':source==='manual'?`${state.name} · 预览`:'季节天气模拟';
  return {coordinates:`${CLIMATE_LOCATION.latitude.toFixed(2)}°N ${CLIMATE_LOCATION.longitude.toFixed(2)}°E`,
    clock:`${local.year}.${pad(local.month)}.${pad(local.day)} ${pad(Math.floor(local.hour))}:${pad(Math.floor(local.hour*60+1e-7)%60)}`,
    sunset:`日落 ${state.sunset}`,weather,live:source==='current'||source==='cached'};
}
export function createEnvironmentHud(element) {
  if(!element)return {update(){}};
  const rows=Object.fromEntries(['coordinates','clock','sunset','weather'].map(key=>{
    const row=document.createElement('div');row.dataset.info=key;element.append(row);return [key,row];
  }));
  const credit=document.createElement('a');credit.href=WEATHER_ATTRIBUTION;credit.target='_blank';credit.rel='noopener noreferrer';
  credit.textContent='Open-Meteo';credit.title='濠河附近当前网格天气 · CC BY 4.0 · 时间为北京时间';
  let lastTick=-1,lastKey='';
  return {update(state,date=new Date()) {
    const tick=Math.floor(date.getTime()/1000);if(tick===lastTick)return;lastTick=tick;
    const value=environmentHudSnapshot(state,date),key=JSON.stringify(value);if(key===lastKey)return;lastKey=key;
    for(const id of ['coordinates','clock','weather'])rows[id].textContent=value[id];
    rows.sunset.textContent=value.sunset;
    if(value.live){rows.sunset.append(' · ',credit);}
    rows.clock.title='北京时间（UTC+8）';
    rows.weather.title='天气后的钟点为数据更新时间';
  }};
}
