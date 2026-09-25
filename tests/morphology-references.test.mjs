import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources-registry.mjs';
import {locomotionSourceIds} from '../isopoda/locomotion.mjs';
import {WIKI_SOURCES,WIKI_SOURCE_IDS_BY_SPECIES} from '../isopoda/data/wiki/specimen-sources.mjs';

const template=readFileSync(new URL('../isopoda/morphology/app.mjs',import.meta.url),'utf8');
const sourceIds=new Set(sources.map(source=>source.id));

function evidenceIds(species){
 return new Set([
  ...(species.evidenceIds||[]),
  ...(species.taxonomy?.evidenceIds||[]),
  ...(species.profile?.evidenceIds||[]),
  ...(species.biogeography?.evidenceIds||[]),
  ...(species.trade?.evidenceIds||[]),
  ...((species.literature?.basis||[]).flatMap(item=>item.evidenceIds||[]))
 ]);
}

test('morphology wiki resolves species-level evidence for every registry specimen',()=>{
 assert.match(template,/referenceRowsFor\(species\)/);
 assert.doesNotMatch(template,/SPECIES_REFS\[species\.id\]\|\|\['shultz2018'\]/);
 const wikiIds=new Set(WIKI_SOURCES.map(source=>source.id));
 for(const species of SPECIES){
  const mapped=[...evidenceIds(species)].filter(id=>sourceIds.has(id));
  const motion=locomotionSourceIds(species.locomotion);
  const wiki=(WIKI_SOURCE_IDS_BY_SPECIES[species.id]||[]).filter(id=>wikiIds.has(id));
  assert.ok(mapped.length||motion.length||wiki.length,species.id+' has no species-level morphology-wiki source');
 }
});

test('specimen wiki excludes commerce pages and all mapped wiki ids resolve',()=>{
 const byId=new Set(WIKI_SOURCES.map(source=>source.id));
 assert.equal(byId.size,WIKI_SOURCES.length);
 const commerce=/\/products?\/|\/product-page\/|\/for-sale\/|(?:^|\.)jd\.com|shop\.app|morphmarket\.com|shopee\.|myship\.7-11\.com\.tw|richardsinverts|pangeareptile|roachcrossing/i;
 for(const source of WIKI_SOURCES){
  assert.ok(source.title&&source.url&&source.type,source.id);
  assert.equal(commerce.test(source.url),false,source.id);
 }
 for(const [speciesId,ids] of Object.entries(WIKI_SOURCE_IDS_BY_SPECIES)){
  assert.ok(SPECIES.some(species=>species.id===speciesId),speciesId);
  for(const id of ids)assert.ok(byId.has(id),speciesId+':'+id);
 }
 for(const source of sources)assert.equal(commerce.test(source.url||''),false,source.id);
 assert.match(template,/COMMERCE_URL/);
});


test('morphology wiki also exposes renderer framework literature used by the simulation',()=>{
 assert.match(template,/frameworkSourceIdsFor\(species\)/);
 for(const id of ['external-anatomy','biphasic-molt','porcellio-scale-setae-2018','ardentiella-reassessment-2025','porcellio-spatulatus-comparison','porcellio-bolivari-characters'])assert.ok(template.includes("'"+id+"'"),id);
});

test('public specimen references avoid DOI redirectors and known empty pages',()=>{
 const files=[
  '../isopoda/morphology/app.mjs',
  '../isopoda/sources.mjs',
  '../isopoda/data/locomotion/sources.mjs',
  '../isopoda/data/wiki/specimen-sources.mjs'
 ];
 for(const url of files){
  const body=readFileSync(new URL(url,import.meta.url),'utf8');
  assert.equal(body.includes('https://doi.org/'),false,url);
  assert.equal(body.includes('armadillidae-venezillo-sp-daxin-tricolor'),false,url);
 }
});

test('game credits keep umbrella databases and literature platforms, not paper-level citations',()=>{
 const files=[
  ['../isopoda/credits.md','**主要资料来源**','**声明**'],
  ['../isopoda/credits.en.md','**Primary sources**','**Notes**'],
  ['../isopoda/credits.ja.md','**主な資料**','**注記**'],
  ['../isopoda/credits.isopod.md','**o:**','**o!**']
 ];
 const expected=[
  'https://www.marinespecies.org/isopoda/',
  'https://www.catalogueoflife.org/',
  'https://www.gbif.org/',
  'https://taicol.tw/',
  'https://www.tbn.org.tw/taxa',
  'https://www.godac.jamstec.go.jp/bismal/j/',
  'https://bmig.org.uk/',
  'https://www.jstage.jst.go.jp/',
  'https://onlinelibrary.wiley.com/',
  'https://pubmed.ncbi.nlm.nih.gov/',
  'https://www.persee.fr/',
  'https://digitalcommons.usf.edu/ijs/',
  'https://www.nps.gov/',
  'https://www.noaa.gov/'
 ];
 for(const [url,startMark,endMark] of files){
  const body=readFileSync(new URL(url,import.meta.url),'utf8');
  const start=body.indexOf(startMark),end=body.indexOf(endMark,start+startMark.length);
  assert.ok(start>=0&&end>start,url);
  const section=body.slice(start,end);
  const links=[...section.matchAll(/^\s*- \[[^\]]+\]\(([^)]+)\)/gm)].map(match=>match[1]);
  assert.deepEqual(links,expected,url);
  assert.equal(/doi\.org|\/doi\/|researchgate\.net|pmc\.ncbi\.nlm\.nih\.gov/i.test(body),false,url);
  for(const source of sources)if(source.url&&!expected.includes(source.url))assert.equal(body.includes(']('+source.url+')'),false,url+': paper detail outside laboratory');
  assert.ok(body.includes('https://umwelt.fivsevn.com/isopoda/morphology/'));
  assert.ok(body.includes('https://umwelt.fivsevn.com/isopoda/habitat'));
 }
});

test('cave citations are attached to the exact specimens and environment they support',async()=>{
 const {HABITAT_REFERENCES}=await import('../isopoda/data/habitats/references.mjs');
 const expected={cavaticus:['groundwater-biofilm'],valdensis:['groundwater-valdensis-key','groundwater-biofilm'],virei:['groundwater-virei-behaviour']};
 for(const [id,refs] of Object.entries(expected)){
  const specimen=SPECIES.find(p=>p.id===id);for(const ref of refs)assert.ok(evidenceIds(specimen).has(ref),id+':'+ref);
 }
 for(const entry of Object.values(HABITAT_REFERENCES))for(const ref of entry.entries){assert.ok(sourceIds.has(ref.sourceId));assert.ok(ref.use&&ref.note)}
 assert.deepEqual(HABITAT_REFERENCES.groundwater.entries.map(r=>r.sourceId),['groundwater-recharge','groundwater-biofilm','groundwater-survey']);
 for(const species of SPECIES)assert.ok(!evidenceIds(species).has('groundwater-survey'),'survey source belongs to environment');
});

test('estuary circulation evidence stays with its environment, not specimen behavior',async()=>{
 const {HABITAT_REFERENCES}=await import('../isopoda/data/habitats/references.mjs');
 const id='estuary-noaa-circulation',matched=sources.filter(source=>source.id===id);
 assert.equal(matched.length,1);
 assert.equal(matched[0].url,'https://oceanservice.noaa.gov/education/tutorial_estuaries/est05_circulation.html');
 assert.deepEqual(HABITAT_REFERENCES.estuary.entries.map(ref=>ref.sourceId),[id]);
 assert.ok(HABITAT_REFERENCES.estuary.limits);
 for(const [habitat,entry] of Object.entries(HABITAT_REFERENCES))if(habitat!=='estuary')assert.ok(!entry.entries.some(ref=>ref.sourceId===id));
 for(const species of SPECIES)assert.ok(!evidenceIds(species).has(id),'circulation source is not species-level behavioral evidence');
});
