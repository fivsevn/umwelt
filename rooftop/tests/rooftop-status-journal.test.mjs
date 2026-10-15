import test from 'node:test';
import assert from 'node:assert/strict';
import { createStatusJournal, statusTime } from '../status-journal.mjs';
import { createActionCard } from '../resident-weather.mjs';

test('timestamps use Beijing wall time and retain their original second across midnight', () => {
  assert.equal(statusTime(Date.parse('2026-10-15T15:59:59Z')), '23:59:59');
  assert.equal(statusTime(Date.parse('2026-10-15T16:00:00Z')), '00:00:00');
  const log = createStatusJournal();
  log.observe('weather', '雨停了。', 1000);log.flush(1800);
  for (let i=2;i<100;i++) { log.observe('weather', '雨停了。', i*1000);log.flush(i*1000); }
  assert.deepEqual(log.entries.map(e=>[e.text,e.at]), [['雨停了。',1000]]);
});
test('transient changes settle and reverted observations never enter the log', () => {
  const log=createStatusJournal();
  log.observe('activity','浇水。',0);log.flush(800);
  log.observe('activity','走动。',1000);log.flush(1200);
  log.observe('activity','浇水。',1300);log.flush(5000);
  assert.equal(log.entries.length,1);
  log.observe('activity','摘枯叶。',6000);log.flush(6799);assert.equal(log.entries.length,1);
  log.flush(6800);assert.equal(log.entries.at(-1).at,6000);
});
test('simultaneous events read environment, movement, presence, then activity', () => {
  const log=createStatusJournal();
  for(const [kind,text] of [['activity','等雨停。'],['presence','东东回来了。'],['scene','来到北天台。'],['weather','下雨了。']])log.observe(kind,text,1000);
  log.flush(1800);
  assert.deepEqual(log.entries.map(e=>e.kind),['weather','scene','presence','activity']);
});
test('repeat clicks and cross-channel duplicates are suppressed; later recurrences get a new time', () => {
  const log=createStatusJournal(),send=(kind,text,at)=>{log.observe(kind,text,at,{immediate:true});log.flush(at);};
  send('observer','有小鸟。',0);send('observer','有无人机。',1000);send('observer','有小鸟。',2000);
  send('activity','有小鸟！',3000);assert.equal(log.entries.length,2);
  send('observer','有无人机。',31000);send('observer','有小鸟。',32000);
  assert.equal(log.entries.filter(e=>e.text==='有小鸟。').length,1);
  assert.equal(log.entries.at(-1).at,32000);
});
test('the journal stays bounded and a scene change discards pending old activity', () => {
  const log=createStatusJournal();
  log.observe('activity','旧阳台动作',0);log.reset('activity');log.flush(1000);assert.equal(log.entries.length,0);
  for(let i=1;i<=12;i++){log.observe('activity','动作'+i,i*1000);log.flush(i*1000+800);}
  assert.deepEqual(log.entries.map(e=>e.text),['动作9','动作10','动作11','动作12']);
});
test('substantial work changes update the activity text, while walking and small rain poses do not', () => {
  const log=createActionCard(), context={scene:'north',present:true,weather:{condition:'clear',phase:'day',rain:0}};
  const first=log.update({state:'water'},{state:'rest'},context);
  assert.equal(log.update({state:'walk'},{state:'walk'},context),first);
  assert.notEqual(log.update({state:'prune',task:'摘枯叶'},{state:'rest'},context),first);
  const wet={...context,weather:{condition:'rain',phase:'day',rain:1}};
  const shelter=log.update({state:'tea',sheltered:true},{state:'curl',sheltered:true},wet);
  assert.equal(log.update({state:'dry-hands',sheltered:true},{state:'shake',sheltered:true},wet),shelter);
});
