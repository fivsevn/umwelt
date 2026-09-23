import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {HABITATS} from '../isopoda/habitats.mjs';
import {ABYSSAL_NODES} from '../isopoda/data/habitats/abyssal-dialogue.mjs';
import {validateSpecies} from '../isopoda/tools/validate-species.mjs';
import {validateHabitats} from '../isopoda/tools/validate-habitats.mjs';
import {validateNarrative,validateTextCatalog,validateNewNarrative} from '../isopoda/tools/validate-narrative.mjs';

test('current species, habitats and narrative satisfy extension invariants',()=>{
 assert.deepEqual(validateSpecies(),[]);
 assert.deepEqual(validateHabitats(),[]);
 assert.deepEqual(validateNarrative(),[]);
});
test('species validation rejects identity, provenance, renderer and habitat corruption',()=>{
 const rows=structuredClone(SPECIES);rows[1].id=rows[0].id;rows[0].evidenceIds=['missing-source'];rows[0].visual.body.width=0;rows[0].taxonomy.acceptedScientificName='Invented species';rows[0].game={referenceOnly:true,habitatEligible:true};
 const errors=validateSpecies(rows).join('\n');for(const message of ['duplicate ID','unknown source','body.width','unresolved trade','reference-only'])assert.ok(errors.includes(message),errors);
});
test('habitat validation rejects locale, metric, motion, salinity and species corruption',()=>{
 const rows=structuredClone(HABITATS),fresh=rows.find(h=>h.id==='freshwater');
 fresh.names=['淡水'];fresh.metrics.push('missingMetric');fresh.motion.pop();fresh.defaults.salinity=99;fresh.species.push('no-such-species');
 const errors=validateHabitats(rows).join('\n');
 for(const message of ['names must contain zh/en/ja','metric missingMetric has no default','motion must align with species','defaults.salinity out of range','unknown species'])assert.ok(errors.includes(message),errors);
});
test('narrative validates all dialogue nodes including turns after nine',()=>{
 const nodes=structuredClone(ABYSSAL_NODES);nodes[14].prompt[2]='';nodes[14].options[0].id=nodes[0].options[0].id;
 const errors=validateNarrative({nodes}).join('\n');assert.match(errors,/zh\/en\/ja coverage/);assert.match(errors,/duplicate\/missing option/);
});
test('new stable-key catalog requires locale coverage and valid references',()=>{
 const row={key:'story:example:prompt',locales:{zh:'示例',en:'Example',ja:'例'},refs:{habitat:['abyssal'],species:['giganteus'],ending:['freshwater-calm','ordinary']}};
 assert.deepEqual(validateTextCatalog([row]),[]);
 assert.ok(validateTextCatalog([row,row]).some(e=>e.includes('duplicate')));
 assert.ok(validateTextCatalog([{...row,locales:{zh:'示例'},refs:{species:['no-such-id']}}]).length>=3);
});

test('all newly authored keyed pools pass validation',async()=>{assert.deepEqual(await validateNewNarrative(),[])});
