import { CLIMATE_LOCATION, chongchuanDate } from './climate.mjs';
import { weatherSourceLabel } from './live-weather.mjs';
import { environmentSignal } from './terminal-signal.mjs';

const pad = n => String(n).padStart(2, '0');
export function environmentHudSnapshot(state, date = new Date()) {
  const local = chongchuanDate(date), source = state.weatherSource;
  const weather = source === 'current' || source === 'cached'
    ? weatherSourceLabel(state).replace(/^濠河附近 · /, '').replace(/ · Open-Meteo$/, '')
    : source === 'pending' ? '天气更新中' : source === 'fallback' ? '天气暂不可用 · 模拟中'
      : source === 'manual' ? `${state.name} · 预览` : '季节天气模拟';
  return {coordinates:`${CLIMATE_LOCATION.latitude.toFixed(2)}°N ${CLIMATE_LOCATION.longitude.toFixed(2)}°E`,
    clock:`${local.year}.${pad(local.month)}.${pad(local.day)} ${pad(Math.floor(local.hour))}:${pad(Math.floor(local.hour * 60 + 1e-7) % 60)}`,
    sunset:`日落 ${state.sunset}`, weather, live:source === 'current' || source === 'cached'};
}
export function createEnvironmentHud(element) {
  if (!element) return {update(){}};
  const originalLabel = element.getAttribute('aria-label') || '环境信息';
  const rows = Object.fromEntries(['coordinates','clock','sunset','weather'].map(key => {
    const row = document.createElement('div'); row.dataset.info = key; element.append(row); return [key,row];
  }));
  const credit = document.createElement('span');
  credit.className = 'weather-credit';
  const started = Date.now(); let lastTick = '';
  return { update(state, date = new Date()) {
    const terminal = document.body.classList.contains('terminal-mode-active');
    const tick = `${terminal}:${Math.floor(date.getTime() / 1000)}`;
    if (tick === lastTick) return; lastTick = tick;
    const elapsed = Math.max(0, Math.floor((date.getTime() - started) / 1000));
    const value = terminal ? environmentSignal(state, elapsed) : environmentHudSnapshot(state, date);
    element.setAttribute('aria-label', terminal ? 'ENV' : originalLabel);
    for (const key of ['coordinates','clock','sunset','weather']) rows[key].textContent = value[key];
    credit.textContent = terminal ? '⊙' : 'Open-Meteo';
    credit.setAttribute('aria-label', 'Weather data: Open-Meteo, CC BY 4.0');
    credit.title = terminal ? 'Open-Meteo · CC BY 4.0' : '濠河附近当前网格天气 · CC BY 4.0 · 时间为北京时间';
    if (value.live) (terminal ? rows.weather : rows.sunset).append(terminal ? ' ' : ' · ', credit);
    if (terminal) { rows.clock.removeAttribute('title'); rows.weather.removeAttribute('title'); }
    else { rows.clock.title = '北京时间（UTC+8）'; rows.weather.title = '天气后的钟点为数据更新时间'; }
  }};
}
