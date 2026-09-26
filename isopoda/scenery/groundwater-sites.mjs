import {GROUNDWATER_LAYOUT} from './authored-layouts.mjs';
// Follow the authored fissure/wet-film objects, including later laboratory edits.
export const CAVE_SITES=GROUNDWATER_LAYOUT.objects.filter(o=>o.type==='seep-film-01');
const focusIds=['instance-17','instance-10','instance-12','instance-23','instance-11','instance-26','instance-12','instance-26'];
export const caveFocusSite=index=>CAVE_SITES.find(o=>o.id===focusIds[index])||CAVE_SITES[0];
export const caveFocus=index=>{const o=caveFocusSite(index);return [o.x,o.y]};
