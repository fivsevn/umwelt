import {access,readFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {handsetThemes} from '../gsm/handsets.mjs';

const root=new URL('../',import.meta.url);
const required=[
 'index.html',
 'desktop.mjs',
 'shared/games.mjs',
 'shared/placeholder.mjs',
 'shared/placeholder.css',
 'gtb/index.html',
 'gtb/assets/icon.png',
 'gsm/index.html',
 'gsm/assets/icon.svg',
 'gsm/desktop-icon.css',
 'gsm/assets/lcd-matrix.svg',
 'gsm/assets/lcd-lens-wear.svg',
 'gsm/app.mjs',
 'gsm/avatars.mjs',
 'gsm/settings/index.html',
 'gsm/decorations.mjs',
 'gsm/dither.mjs',
 'gsm/assets/pixelarticons-LICENSE.txt',
 'gsm/style.css',
 'gsm/physical-shell.css',
 'gsm/pager-screen.css',
 'gsm/handsets.mjs',
 ...handsetThemes.flatMap(({id})=>['','-wide','-thumb'].map(suffix=>`gsm/assets/pocket-${id}${suffix}.webp`)),
 'gsm/data/feed.mjs',
 'gsm/locales.mjs',
 'gsm/state.mjs',
 'gsm/icons.mjs',
 'desktop-icons.mjs',
 'forest.js',
 'style.css',
 'window-controls.css',
 'window-system.css',
 'assets/audio/audio-engine.mjs',
 'assets/audio/sound-icon.mjs',
 'tick/index.html',
 'tick/game.js',
 'tick/sprite.mjs',
 'tick/style.css',
 'ophidia/index.html',
 'ophidia/game.js',
 'ophidia/style.css',
 'ophidia/assets/cabin.webp',
 'ophidia/assets/snake-normal.webp',
 'ophidia/assets/snake-curious.webp',
 'ophidia/assets/snake-away.webp',
 'ophidia/assets/snake-tongue.webp',
 'rooftop/index.html',
 'rooftop/app.mjs',
 'rooftop/scene.mjs',
 'rooftop/rooftop.css',
 'rooftop/arrange/index.html',
 'rooftop/room/index.html',
 'rooftop/room/room.mjs',
 'rooftop/room/room.css',
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
for(const [path,dependencies] of [
 ['index.html',['./desktop.mjs','./forest.js','./isopoda/','./tick/','./rooftop/','./ophidia/','./gtb/','./gsm/']],
 ['gtb/index.html',['../shared/placeholder.mjs','../shared/placeholder.css','./assets/icon.png']],
 ['gsm/index.html',['./app.mjs','./style.css','./physical-shell.css','./assets/icon.svg']],
 ['gsm/settings/index.html',['../app.mjs','../style.css','../physical-shell.css','../assets/icon.svg']],
 ['tick/index.html',['./game.js','./style.css']],
 ['ophidia/index.html',['./game.js','./style.css','./assets/cabin.webp']],
 ['rooftop/index.html',['./app.mjs','./rooftop.css']],
 ['rooftop/arrange/index.html',['../app.mjs','../rooftop.css']],
 ['rooftop/room/index.html',['./room.mjs','./room.css']]
]){const source=await read(path);for(const dependency of dependencies)if(!source.includes(dependency))errors.push(`${path}: missing ${dependency}`)}
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
}else console.log(`[public-surface] OK — ${required.length} required runtime files and all game entries and shared desktop/audio runtime verified.`);
