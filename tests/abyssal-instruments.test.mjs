import test from 'node:test';
import assert from 'node:assert/strict';
import {ABYSSAL_NODES} from '../isopoda/data/habitats/abyssal-dialogue.mjs';
import {abyssalReadings,abyssalDepth,abyssalInstrument} from '../isopoda/data/habitats/abyssal-instruments.mjs';
test('abyssal instruments follow story nodes and survive saved feedback',()=>{
 const depths=new Set(),rows=new Set();
 for(const node of ABYSSAL_NODES){const s={scene:{dialogueNode:node.id},records:[],stage:'choice'};const r=abyssalReadings(s);depths.add(r.depth);rows.add(abyssalInstrument(s).join('|'));assert.equal(abyssalDepth(s).value,r.depth.toFixed(1)+' m');assert.deepEqual(abyssalReadings(JSON.parse(JSON.stringify(s))),r);assert.match(abyssalDepth(s,'isopod').value,/^[▁▂▃▄▅▆▇]+$/)}
 assert.equal(depths.size,ABYSSAL_NODES.length);assert.equal(rows.size,ABYSSAL_NODES.length);
 assert.equal(abyssalReadings({scene:{dialogueNode:'ending'},stage:'feedback',records:[{choice:'ending-silent'}]}).lamp,0);
 assert.equal(abyssalReadings({scene:{dialogueNode:'light'},stage:'feedback',records:[{choice:'light-dim'}]}).lamp,44);
});
