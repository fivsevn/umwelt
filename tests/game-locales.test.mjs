import test from 'node:test';
import assert from 'node:assert/strict';
import {gameText} from '../isopoda/locales/game.mjs';
import {encodeIsopodText} from '../isopoda/locales/isopod.mjs';
import {createRun,ensureScene,choose,advance,recordDirectInteraction} from '../isopoda/engine.mjs';
import {EVENING} from '../isopoda/content.mjs';

test('screenshot observations translate complete prompts and specimen memories',()=>{
 const examples=[
  ['你第一次把“A”写在一个个体旁边。它没有停下来等你写完。','今天你把个体 F放回了另一个位置。它后来的路线从那里继续。'],
  ['一段路走到一半，它开始清理自己。到达并不是唯一的事情。','个体 G 停在岔口。先猜它会靠近哪里，再看下一段记录。'],
  ['两只从根的两边接近同一条窄缝。较小的一只先穿过去。','个体 B 停在叶缘。触角仍在缓慢移动。你的手已经离它很近。']
 ];
 for(const parts of examples){
  const source=parts.join(' ');
  for(const lang of ['en','ja']){
   assert.equal(gameText(source,lang),parts.map(part=>gameText(part,lang)).join(' '));
   assert.notEqual(gameText(source,lang),source);
  }
  assert.equal(gameText(source,'zh'),source);
  assert.equal(gameText(source,'isopod'),encodeIsopodText(source));
 }
});

test('composed localization preserves complete dynamic sentences and known unchanged translations',()=>{
 const parts=['木片','个体 A 停在叶缘。触角仍在缓慢移动。你的手已经离它很近。','土粒之间的高度差没有进入仪表。'];
 for(const lang of ['en','ja'])assert.equal(gameText(parts.join(' '),lang),parts.map(part=>gameText(part,lang)).join(' '));
 const unknown='木片 unknown copy';
 assert.equal(gameText(unknown,'en'),unknown,'unknown copy must not be partly translated');
});

test('complete terrestrial observations and saved feedback stay localized across seven days',()=>{
 const kinds=new Set();
 for(let seed=1;seed<=40;seed++){
  const state=createRun('dairy',seed);
  for(let turn=0;turn<21;turn++){
   assert.ok(recordDirectInteraction(state,{type:'place',specimen:state.cohort[turn%7].id,point:{x:120,y:200}}));
   const scene=ensureScene(state);kinds.add(scene.kind);
   for(const lang of ['en','ja']){
    assert.notEqual(gameText(scene.text,lang),scene.text,`${lang}, seed ${seed}, turn ${turn}: ${scene.text}`);
    if(lang==='en')assert.doesNotMatch(gameText(scene.text,lang),/[\u3400-\u9fff]/u);
    for(const option of scene.options){
     assert.notEqual(gameText(option.text,lang),option.text);
     assert.ok(gameText(option.label,lang));
    }
   }
   assert.ok(choose(state,scene.options[turn%scene.options.length].id));
   for(const lang of ['en','ja'])assert.notEqual(gameText(state.records.at(-1).text,lang),state.records.at(-1).text);
   assert.ok(advance(state));
  }
 }
 assert.ok(kinds.has('route'));assert.ok(kinds.has('touch'));
 // Every evening variant can be paired with every specimen's saved movement memory.
 for(const lines of EVENING)for(const line of lines)for(const id of 'ABCDEFG')for(const lang of ['en','ja']){
  const memory=`今天你把个体 ${id}放回了另一个位置。它后来的路线从那里继续。`;
  assert.equal(gameText(`${line} ${memory}`,lang),`${gameText(line,lang)} ${gameText(memory,lang)}`);
 }
});
