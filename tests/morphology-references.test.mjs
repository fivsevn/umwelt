import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPECIES} from '../isopoda/species-registry.mjs';
import {sources} from '../isopoda/sources-registry.mjs';
import {locomotionSourceIds} from '../isopoda/locomotion.mjs';

const template=readFileSync(new URL('../isopoda/morphology/template.txt',import.meta.url),'utf8');
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

test('morphology reference module resolves evidence for every registry specimen',()=>{
 assert.match(template,/referenceRowsFor\(species\)/);
 assert.doesNotMatch(template,/SPECIES_REFS\[species\.id\]\|\|\['shultz2018'\]/);
 for(const species of SPECIES){
  const mapped=[...evidenceIds(species)].filter(id=>sourceIds.has(id));
  const motion=locomotionSourceIds(species.locomotion);
  const hasCurated=template.includes('\n '+species.id+':[')||template.includes('\n'+species.id+':[');
  assert.ok(mapped.length||motion.length||hasCurated,species.id+' has no morphology-page source mapping');
 }
});

test('game credits keep only the umbrella World List source',()=>{
 const files=[
  ['../isopoda/credits.md','**主要资料来源**','**声明**'],
  ['../isopoda/credits.en.md','**Primary sources**','**Notes**'],
  ['../isopoda/credits.ja.md','**主な資料**','**注記**'],
  ['../isopoda/credits.isopod.md','**o:**','**o!**']
 ];
 for(const [url,startMark,endMark] of files){
  const body=readFileSync(new URL(url,import.meta.url),'utf8');
  const start=body.indexOf(startMark),end=body.indexOf(endMark,start+startMark.length);
  assert.ok(start>=0&&end>start,url);
  const section=body.slice(start,end);
  const links=[...section.matchAll(/^\s*- \[[^\]]+\]\(([^)]+)\)/gm)];
  assert.equal(links.length,1,url);
  assert.equal(links[0][1],'https://www.marinespecies.org/isopoda/',url);
 }
});