// Seeds describe individual plants, independently of their position and vessel.
export function plantSeed(value){let seed=2166136261;for(const ch of String(value))seed=Math.imul(seed^ch.charCodeAt(0),16777619);return seed>>>0}
export function seedRandom(seed){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296}}
