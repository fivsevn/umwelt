import {shells, antennas, charms} from './catalog.mjs';

export const APPEARANCE_STORAGE_KEY = 'umwelt-gsm-appearance';
export const DEFAULT_APPEARANCE = Object.freeze({shell:'leopard',antenna:'graphite',charm:'beads'});
export const APPEARANCE_KEYS = Object.freeze(['shell','antenna','charm']);
const choices = {shell:new Set(shells.map(item=>item.id)),antenna:new Set(antennas.map(item=>item.id)),charm:new Set(charms.map(item=>item.id))};
const shellAliases = new Map([['mint','leopard'],['blue','tokay'],['berry','day'],['blizzard','stone'],['crested','stone'],['mossy','stone']]);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function normalizeShell(value) {
  return choices.shell.has(value) ? value : shellAliases.get(value);
}

export function normalizeAppearance(value, fallback = DEFAULT_APPEARANCE) {
  const source = record(value) ? value : {};
  return Object.fromEntries(APPEARANCE_KEYS.map(key=>{
    const selected = key === 'shell' ? normalizeShell(source[key]) : choices[key].has(source[key]) ? source[key] : undefined;
    const previous = key === 'shell' ? normalizeShell(fallback?.[key]) : choices[key].has(fallback?.[key]) ? fallback[key] : undefined;
    return [key,selected ?? previous ?? DEFAULT_APPEARANCE[key]];
  }));
}

export function readAppearance(storage) {
  try { return normalizeAppearance(JSON.parse(storage?.getItem(APPEARANCE_STORAGE_KEY))); }
  catch { return {...DEFAULT_APPEARANCE}; }
}

export function writeAppearance(storage, appearance) {
  try {
    if (!storage) return false;
    storage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(normalizeAppearance(appearance)));
    return true;
  } catch { return false; }
}

export function appearanceFromURL(search, fallback = DEFAULT_APPEARANCE) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return normalizeAppearance(Object.fromEntries(APPEARANCE_KEYS.map(key=>[key,params.get(key)])),fallback);
}

export function setAppearanceURL(url, appearance, preview = false) {
  const selected = normalizeAppearance(appearance);
  for (const key of APPEARANCE_KEYS) url.searchParams.set(key,selected[key]);
  if (preview) url.searchParams.set('appearance-preview','1');
  else url.searchParams.delete('appearance-preview');
  return url;
}
