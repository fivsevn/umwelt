import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,template,legacy]=await Promise.all([
 read('morphology/index.html'),
 read('morphology/template.txt'),
 read('anatomy-test.html')
]);

const errors=[];
const expect=(condition,message)=>{if(!condition)errors.push(message)};

expect(page.includes("fetch('./template.txt'"),'canonical morphology page must load morphology/template.txt');
expect(page.includes("#speciesSelect')?.options.length"),'MORPHOLOGY ARRAY count must be derived from the rendered species selector');
expect(!/MORPHOLOGY ARRAY\s+\d+/.test(page),'canonical morphology page must not hard-code a species count');
expect(template.includes("from './species-registry.mjs'"),'internal template must read the shared species registry directly');
expect(!template.includes('species-registry.mjs?v=species-'),'internal template must not pin a species-count cache tag');
expect(legacy.includes("location.replace('./morphology/')"),'legacy anatomy-test.html must redirect to the canonical morphology page');

if(errors.length){
 for(const error of errors)console.error(`[morphology page] ${error}`);
 process.exitCode=1;
}else{
 console.log('[morphology page] OK — canonical route, shared registry and legacy redirect are consistent.');
}
