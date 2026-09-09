import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {SPECIES,speciesById} from '../isopoda/species.mjs';import {renderModel,resolvePalette,stableHash,MOLT_REGIONS} from '../isopoda/sprites.mjs';import {sources,evidence} from '../isopoda/sources.mjs';import {validRun,advance,choose,ensureScene} from '../isopoda/engine.mjs';
const ids=['dairy','cappuccino','diablo','echinatus','pink','coros','bolivari','ducky','daxin','ember','amber','vex','orange'];
test('13 stable identities: taxonomy, trade, locality, morph and uncertainty stay separate',()=>{
 assert.deepEqual(SPECIES.map(s=>s.id),ids);assert.equal(speciesById('ducky').names.zhCN,'鸭仔');
 assert.equal(speciesById('coros').trade.locality.label,'Coros');assert.equal(speciesById('coros').trade.morph,null);
 assert.equal(speciesById('orange').trade.morph,'Orange');assert.equal(speciesById('orange').taxonomy.acceptedScientificName,'Armadillidium frontetriangulum');
 assert.equal(speciesById('dairy').taxonomy.acceptedScientificName,null);assert.equal(speciesById('dairy').taxonomy.identificationQualifier,'cf.');
 for(const id of ['diablo','ember']){assert.equal(speciesById(id).taxonomy.genus,'Ardentiella');assert.equal(speciesById(id).taxonomy.species,null)}
 for(const p of SPECIES){assert.equal(p.literature.lines.length,2);assert.ok(p.literature.basis.length);assert.equal(p.genetics.knowledge,'unknown');assert.equal(p.breeding.crossCompatibility,'unknown');assert.ok(p.visual);assert.equal(p.profile.adultLengthMm,null);for(const id of p.evidenceIds)assert.ok(sources.some(s=>s.id===id)||evidence.some(e=>e.id===id))}
});
test('stage modifies proportions, appendages and expression without changing palette',()=>{
 for(const p of SPECIES){const a=renderModel(p.visual,{stage:'L'}),s=renderModel(p.visual,{stage:'S'}),m=renderModel(p.visual,{stage:'M'});assert.equal(s.stage,'juvenile');for(const k of ['scale','widthRatio','plateMaturity','appendageRatio','patternExpression'])assert.ok(s.growth[k]<m.growth[k]&&m.growth[k]<a.growth[k]);assert.deepEqual(s.palette,a.palette)}
});
test('anterior and posterior are disjoint, complete P4/P5 anatomical halves',()=>{
 assert.deepEqual(MOLT_REGIONS.anterior,['cephalon','p1','p2','p3','p4']);assert.deepEqual(MOLT_REGIONS.posterior,['p5','p6','p7','pleon','pleotelson','uropods']);assert.equal(new Set(Object.values(MOLT_REGIONS).flat()).size,11);
});
test('stable seed produces four variants and palette resolves through regional fallbacks',()=>{
 assert.equal(new Set([0,1,2,3].map(s=>stableHash(s)%4)).size,4);assert.equal(stableHash('157:4'),stableHash('157:4'));assert.deepEqual(resolvePalette({tergite:'#777'}),{tergite:'#777',cephalon:'#777',epimera:'#777',pleon:'#777',pleotelson:'#777',uropods:'#777',antennae:'#777',legs:'#777'});
});
test('benchmark coefficients and composed patterns preserve contrasting morphology',()=>{
 const v=id=>speciesById(id).visual;assert.ok(v('ducky').body.convexity>v('bolivari').body.convexity);assert.ok(v('bolivari').antennae.length>v('ducky').antennae.length);assert.ok(v('coros').pereon.epimera.width>v('dairy').pereon.epimera.width);assert.equal(v('echinatus').surface.sculpture,'tuberculate');assert.equal(v('dairy').conglobation.ability,'none');assert.equal(v('diablo').conglobation.ability,'partial');assert.equal(v('ducky').conglobation.ability,'full');assert.equal(v('orange').patterns[0].type,'spotRow');assert.equal(v('amber').patterns[0].type,'saddle');assert.equal(v('daxin').patterns[0].type,'trizone');
});
test('actual pre-migration v3 saves resume every species and finish without persisting definitions',()=>{
 const fixtures=JSON.parse(readFileSync(new URL('./fixtures/v3-saves.json',import.meta.url)));
 for(let s of fixtures){assert.ok(validRun(s));assert.equal(s.records.length,6);assert.equal(choose(s,ensureScene(s).options[0].id),false);advance(s);while(s.stage!=='ended'){choose(s,ensureScene(s).options[0].id);advance(s);s=JSON.parse(JSON.stringify(s));assert.ok(validRun(s))}assert.equal(s.records.length,21);for(const field of ['visual','taxonomy','sources','evidence'])assert.ok(!JSON.stringify(s).includes('"'+field+'"'))}
});
