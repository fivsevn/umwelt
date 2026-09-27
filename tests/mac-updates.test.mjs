import test from 'node:test';import assert from 'node:assert/strict';
import updates from '../mac/updates.cjs';
const {compareVersions,checkRelease}=updates;
test('release versions compare numerically and unknown tags are not called current',()=>{
 assert.equal(compareVersions('v0.10.0','0.9.9'),1);assert.equal(compareVersions('v1.0.0','1.0.0'),0);assert.equal(compareVersions('0.1.0','0.1.1'),-1);assert.equal(compareVersions('nightly','0.1.1'),null);
});
test('release lookup distinguishes no release, update, current, unknown and request failure',async()=>{
 const response=(status,data)=>async()=>({status,ok:status===200,json:async()=>data});
 assert.equal((await checkRelease('0.1.1',response(404))).status,'unpublished');
 for(const [tag,status] of [['v0.2.0','available'],['v0.1.1','current'],['v0.1.0','ahead'],['release-september','unknown']])assert.equal((await checkRelease('0.1.1',response(200,{tag_name:tag}))).status,status);
 await assert.rejects(checkRelease('0.1.1',response(403)),/403/);
 await assert.rejects(checkRelease('0.1.1',response(200,{tag_name:'v1.0.0',prerelease:true})),/Invalid/);
});
