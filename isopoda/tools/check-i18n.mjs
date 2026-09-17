import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
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

// 2) Specimen annotations: every registered specimen must have both EN and JA copy.
const annotationSource=await read('annotation-locales.mjs');
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

const speciesFiles=['species.mjs','species-extra.mjs','species-extra-2.mjs','species-extra-3.mjs','species-extra-4.mjs','species-extra-5.mjs','species-extra-6.mjs'];
const speciesIds=new Set();
for(const file of speciesFiles){
 const source=await read(file);
 for(const match of source.matchAll(/"id"\s*:\s*"([A-Za-z0-9_-]+)"/g))speciesIds.add(match[1]);
 for(const match of source.matchAll(/\bid\s*:\s*'([A-Za-z0-9_-]+)'/g))speciesIds.add(match[1]);
 for(const match of source.matchAll(/\bcommon\('([A-Za-z0-9_-]+)'/g))speciesIds.add(match[1]);
}
for(const id of [...speciesIds].sort())if(!annotationIds.includes(id))fail(`annotation ${id}: no locale entry`);
for(const id of annotationIds)if(!speciesIds.has(id))warn(`annotation ${id}: entry has no matching specimen id`);

// 3) Authored game copy: active source strings must exist in the three-column translation table.
const gameSource=await read('game-locales.mjs');
const translatedZh=new Set([...gameSource.matchAll(/^\['([^'\n]*)',/gm)].map(match=>match[1]));
const rowTriples=[...gameSource.matchAll(/^\['([^'\n]*)','([^'\n]*)','([^'\n]*)'\],?$/gm)];
for(const [index,match] of rowTriples.entries()){
 if(!match[1]||!match[2]||!match[3])fail(`game locale row ${index+1}: empty zh/en/ja value`);
}

const encounterSource=await read('encounters.mjs');
for(const value of chineseStrings(encounterSource))if(!translatedZh.has(value))fail(`game locale: encounter text is not translated: ${value}`);

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
const creditFiles={zh:'credits.md',en:'credits.en.md',ja:'credits.ja.md'};
const credits={};
for(const [lang,file] of Object.entries(creditFiles))credits[lang]=await read(file);
const zhUrls=markdownUrls(credits.zh);
const zhHeadingCount=markdownHeadings(credits.zh);
for(const lang of ['en','ja']){
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
 console.log(`[i18n] OK — ${baseKeys.length} UI keys, ${speciesIds.size} specimens, ${annotationIds.length} annotation entries, ${rowTriples.length} game locale rows, 3 credit files.`);
}
