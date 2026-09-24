import {access,readFile} from 'node:fs/promises';
import {constants} from 'node:fs';

const root=new URL('../../',import.meta.url);
const required=[
 'index.html',
 'isopoda/index.html',
 'isopoda/game.js',
 'isopoda/style.css',
 'isopoda/interface-tuning.css',
 'isopoda/i18n.css',
 'isopoda/system-ui.mjs',
 'isopoda/runtime-locales.mjs',
 'isopoda/morphology/index.html',
 'isopoda/morphology/app.mjs',
 'isopoda/morphology/style.css',
 'isopoda/habitat.html',
 'isopoda/habitat.css',
 'isopoda/habitat-lab.mjs'
];
const errors=[];
for(const path of required){
 try{await access(new URL(path,root),constants.R_OK)}
 catch{errors.push(`missing public runtime file: ${path}`)}
}
const read=path=>readFile(new URL(path,root),'utf8');
const game=await read('isopoda/index.html');
const morphology=await read('isopoda/morphology/index.html');
const morphologyApp=await read('isopoda/morphology/app.mjs');
const habitat=await read('isopoda/habitat.html');
const habitatLab=await read('isopoda/habitat-lab.mjs');

for(const [label,source,needles] of [
 ['game',game,['./game.js','./system-ui.mjs','./runtime-locales.mjs','./style.css']],
 ['morphology',morphology,['./style.css','./app.mjs']],
 ['habitat',habitat,['./habitat.css','./habitat-lab.mjs','data-preset="groundwater"','data-preset="estuary"','data-preset="sandy-surf"','data-preset="petri-dish"']]
]){
 for(const needle of needles)if(!source.includes(needle))errors.push(`${label}: expected runtime reference not found: ${needle}`);
 if(/(?:href|src)=["'][^"']*(?:\/dev\/|\/docs\/)/.test(source))errors.push(`${label}: public page references a development-only path`);
}
for(const id of ['water-groundwater','water-estuary','water-sandy-surf','water-petri-dish'])if(!habitatLab.includes(`id:'${id}'`))errors.push(`habitat: ${id} background asset is not registered in Habitat Lab`);
for(const source of [morphology,morphologyApp]){
 if(source.includes('anatomy-test'))errors.push('morphology: retired anatomy-test path is still referenced');
}
if(errors.length){
 for(const error of errors)console.error(`[public-surface] ${error}`);
 process.exitCode=1;
}else console.log(`[public-surface] OK — ${required.length} required runtime files and 3 ISOPODA public entry surfaces verified.`);
