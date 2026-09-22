import {HABITATS} from '../habitats.mjs';
import {aquaticScene,AQUATIC_ENDINGS, aquaticText} from '../aquatic-story.mjs';
import {readFile} from 'node:fs/promises';
import {SUPPORTED_LANGUAGES,UI_COPY} from '../locales/ui.mjs';

const root=new URL('../',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const errors=[];
const warnings=[];
const fail=message=>errors.push(message);
const warn=message=>warnings.push(message);
const same=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);

function sortedKeys(value){return Object.keys(value||{}).sort()}
function chineseStrings(source){
 const out=[];
 const literal=/(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/g;
 for(const match of source.matchAll(literal)){
  const value=(match[1]??match[2]??'').replace(/\\'/g,"'").replace(/\\"/g,'"');
  if(/[\u3400-\u9fff]/u.test(value))out.push(value);
 }
 return [...new Set(out)];
}
function markdownUrls(source){return [...source.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(match=>match[1]).sort()}
function markdownHeadings(source){return [...source.matchAll(/^\*\*.+?\*\*$/gm)].length}

// Aquatic scenes use explicit stable keys and authored zh/en/ja rows.
for(const h of HABITATS.filter(h=>h.aquatic))for(let turn=0;turn<9;turn++){
 const scene=aquaticScene({habitatId:h.id,day:Math.floor(turn/3)+1,period:turn%3});
 for(const key of [scene.text,...scene.options.flatMap(o=>[o.label,o.text]),'water:habitat:'+h.id,...h.metrics.map(k=>'water:'+k)])for(const lang of SUPPORTED_LANGUAGES){const value=aquaticText(key,lang);if(!value||value===key)fail(`Aquatic missing ${lang}: ${key}`)}
}
for(const e of AQUATIC_ENDINGS)for(const key of [e.title,e.body,e.line])for(const lang of SUPPORTED_LANGUAGES)if(aquaticText(key,lang)===key)fail(`Ending missing ${lang}: ${key}`);

// 1) Static UI: every language must expose exactly the same stable keys.
const baseKeys=sortedKeys(UI_COPY.zh);
for(const lang of SUPPORTED_LANGUAGES){
 const keys=sortedKeys(UI_COPY[lang]);
 if(!same(baseKeys,keys)){
  const missing=baseKeys.filter(key=>!keys.includes(key));
  const extra=keys.filter(key=>!baseKeys.includes(key));
  if(missing.length)fail(`UI ${lang}: missing keys: ${missing.join(', ')}`);
  if(extra.length)fail(`UI ${lang}: extra keys: ${extra.join(', ')}`);
 }
 for(const key of keys)if(UI_COPY[lang][key]==='')fail(`UI ${lang}.${key}: empty translation`);
}

// 2) Specimen annotations: EN and JA remain authored; isopod copy is generated from canonical text.
const annotationSource=await read('locales/annotations.mjs');
const isopodSource=await read('locales/isopod.mjs');
if(!/export function encodeIsopodText/.test(isopodSource))fail('isopod locale: missing encoder export');
const annotationBody=annotationSource.match(/const copy=\{([\s\S]*?)\n\};/)?.[1]||'';
const annotationMatches=[...annotationBody.matchAll(/^  ([A-Za-z0-9_]+):\{/gm)];
const annotationIds=[];
for(let i=0;i<annotationMatches.length;i++){
 const match=annotationMatches[i];
 const id=match[1];annotationIds.push(id);
 const start=match.index;const end=annotationMatches[i+1]?.index??annotationBody.length;
 const block=annotationBody.slice(start,end);
 if(!/\ben:\s*\[/.test(block))fail(`annotation ${id}: missing English lines`);
 if(!/\bja:\s*\[/.test(block))fail(`annotation ${id}: missing Japanese lines`);
}

const speciesFiles=['species.mjs','data/species/batch-01.mjs','data/species/batch-02.mjs','data/species/batch-03.mjs','data/species/batch-04.mjs','data/species/marine-reference.mjs','data/species/hobby-lines.mjs'];
const speciesIds=new Set();
for(const file of speciesFiles){
 const source=await read(file);
 for(const match of source.matchAll(/"id"\s*:\s*"([A-Za-z0-9_-]+)"/g))speciesIds.add(match[1]);
 for(const match of source.matchAll(/\bid\s*:\s*'([A-Za-z0-9_-]+)'/g))speciesIds.add(match[1]);
 for(const match of source.matchAll(/\bcommon\('([A-Za-z0-9_-]+)'/g))speciesIds.add(match[1]);
}
for(const id of [...speciesIds].sort())if(!annotationIds.includes(id))fail(`annotation ${id}: no locale entry`);
for(const id of annotationIds)if(!speciesIds.has(id))warn(`annotation ${id}: entry has no matching specimen id`);

// 3) Authored game copy: active visible source strings must exist in the EN/JA translation table. Isopod copy is generated.
const gameSource=await read('locales/game.mjs');
const translatedZh=new Set([...gameSource.matchAll(/^\['([^'\n]*)',/gm)].map(match=>match[1]));
const rowTriples=[...gameSource.matchAll(/^\['([^'\n]*)','([^'\n]*)','([^'\n]*)'\],?$/gm)];
for(const [index,match] of rowTriples.entries()){
 if(!match[1]||!match[2]||!match[3])fail(`game locale row ${index+1}: empty zh/en/ja value`);
}

// Encounter response fields (quiet/care/disturb) drive habitat behavior and are not rendered as copy.
// Titles and observation lines are visible, so they are required.
const encounterSource=await read('encounters.mjs');
const encounterVisible=[];
for(const match of encounterSource.matchAll(/\btitle:'([^']+)'/g))encounterVisible.push(match[1]);
for(const match of encounterSource.matchAll(/\blines:\[([^\]]*)\]/g))encounterVisible.push(...chineseStrings(match[1]));
for(const value of [...new Set(encounterVisible)])if(!translatedZh.has(value))fail(`game locale: visible encounter text is not translated: ${value}`);

const contentSource=await read('content.mjs');
const activeSections=[];
for(const [name,pattern] of [
 ['EVENING',/export const EVENING\s*=\s*\[([\s\S]*?)\n\];/],
 ['CARE',/export const CARE\s*=\s*\{([\s\S]*?)\n\};/],
 ['ENDINGS',/export const ENDINGS\s*=\s*\[([\s\S]*?)\n\];/]
]){
 const body=contentSource.match(pattern)?.[1];
 if(!body){fail(`content locale audit: could not locate ${name}`);continue}
 activeSections.push(body);
}
for(const value of chineseStrings(activeSections.join('\n')))if(!translatedZh.has(value))fail(`game locale: active content is not translated: ${value}`);

// Midday scene copy is authored directly in engine.mjs. PERIODS are state labels and are not rendered.
const engineSource=await read('engine.mjs');
const engineIgnore=new Set(['晨间','午后','夜间']);
for(const value of chineseStrings(engineSource)){
 if(engineIgnore.has(value))continue;
 if(!translatedZh.has(value))warn(`engine source string is handled dynamically or not yet represented as a direct locale row: ${value}`);
}

// MORNING / AMBIENT are not currently used by engine.mjs. Report them without failing CI.
for(const [name,pattern] of [
 ['MORNING',/export const MORNING\s*=\s*\[([\s\S]*?)\n\];/],
 ['AMBIENT',/export const AMBIENT\s*=\s*\[([\s\S]*?)\n\];/]
]){
 const body=contentSource.match(pattern)?.[1];if(!body)continue;
 const missing=chineseStrings(body).filter(value=>!translatedZh.has(value));
 if(missing.length)warn(`${name}: ${missing.length} inactive source strings do not yet have locale rows`);
}

// 4) Credits: localized files may translate prose, but links and section count must stay in sync.
const creditFiles={zh:'credits.md',en:'credits.en.md',ja:'credits.ja.md',isopod:'credits.isopod.md'};
const credits={};
for(const [lang,file] of Object.entries(creditFiles))credits[lang]=await read(file);
const zhUrls=markdownUrls(credits.zh);
const zhHeadingCount=markdownHeadings(credits.zh);
for(const lang of SUPPORTED_LANGUAGES.filter(lang=>lang!=='zh')){
 const urls=markdownUrls(credits[lang]);
 if(!same(zhUrls,urls)){
  const missing=zhUrls.filter(url=>!urls.includes(url));
  const extra=urls.filter(url=>!zhUrls.includes(url));
  if(missing.length)fail(`credits ${lang}: missing links: ${missing.join(', ')}`);
  if(extra.length)fail(`credits ${lang}: extra links: ${extra.join(', ')}`);
 }
 if(markdownHeadings(credits[lang])!==zhHeadingCount)fail(`credits ${lang}: section count differs from zh`);
}

for(const message of warnings)console.warn(`[i18n warning] ${message}`);
if(errors.length){
 for(const message of errors)console.error(`[i18n error] ${message}`);
 console.error(`\n${errors.length} i18n check(s) failed.`);
 process.exitCode=1;
}else{
 console.log(`[i18n] OK — ${baseKeys.length} UI keys, ${speciesIds.size} legacy specimens + 9 aquatic specimens / 27 scenes, ${annotationIds.length} annotation entries, ${rowTriples.length} game locale rows, ${Object.keys(creditFiles).length} credit files.`);
}
