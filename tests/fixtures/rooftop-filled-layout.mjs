import { readFileSync } from 'node:fs';
import { initialLayout } from '../../rooftop/scene.mjs';
import { canonicalItemId, getItemDefinition } from '../../rooftop/item-catalog.mjs';
const historical=JSON.parse(readFileSync(new URL('./rooftop-authored-layout-legacy.json',import.meta.url),'utf8'));

// Dense care/navigation fixtures preserve the original plants, seeds, vessels,
// and floor positions. The retired cabinets are excluded from this care fixture;
// current furniture collisions and nesting have their own native spatial suite.
export function filledLayoutFixture(){
  const layout=initialLayout();
  for(const scene of Object.keys(layout.scenes))layout.scenes[scene]=historical.scenes[scene]
    .map(o=>({...o,type:canonicalItemId(o.type),support:null}))
    .filter(o=>o.type&&(!['架子','桌椅与居室'].includes(getItemDefinition(o.type).category)));
  return layout;
}
