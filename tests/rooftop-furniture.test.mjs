import test from 'node:test';
import assert from 'node:assert/strict';
import {FURNITURE} from '../rooftop/furniture.mjs';
import {POTS} from '../rooftop/botany.mjs';
import {resizedObject,fits,validateLayout} from '../rooftop/scene.mjs';
test('furniture resizing persists at every orientation and rejects impossible sizes',()=>{for(const type of ['shelf','woodshelf',...FURNITURE.map(a=>a.id)])for(const rotation of [0,90,180,270])for(const scale of [.5,1,1.5,2]){const o={id:'f',type,x:312,y:240,scale:1,rotation},next=resizedObject('north',o,scale);assert.ok(next,type);assert.ok(fits('north',next));assert.deepEqual(validateLayout({version:1,scenes:{north:[next],south:[]}}).scenes.north[0],next)}assert.ok(resizedObject('south',{id:'f',type:'drying',x:284,y:285,rotation:90,scale:1},2));assert.equal(resizedObject('south',{id:'f',type:'shelf',x:284,y:285,rotation:0,scale:1},3),null);});
test('enlarging an edge shelf nudges it inward minimally and leaves the source unchanged',()=>{const o={id:'f',type:'shelf',x:180,y:196,rotation:90,scale:1},next=resizedObject('north',o,1.5);assert.ok(next);assert.ok(fits('north',next));assert.ok(Math.hypot(next.x-o.x,next.y-o.y)<=32);assert.equal(o.scale,1);});
test('ceramic silhouettes and notebook references remain varied without region prefixes',()=>{const ceramics=POTS.filter(p=>p.kind==='ceramic');assert.ok(new Set(ceramics.map(p=>p.shape)).size>=12);for(const p of ceramics)assert.ok(p.shapeLabel&&p.sources.length);for(const p of POTS)for(const source of p.sources)assert.doesNotMatch(source.label,/^(EN|JP|TW|CN)\s*·/)});
