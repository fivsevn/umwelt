import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { geckoSources, reptileCandidate, excludedHumanOrClinical, rssItems, parseGeckoTopics, parseGeckoDiscussion } from '../tools/engine/gecko-sources.js';
import { plainText, anonymizeDiscussion } from '../tools/engine/gecko-anonymize.js';
import { collectGeckoOpinions, updateGeckoOpinionDocument, collectionLimits } from '../tools/engine/collect-gecko-opinions.js';
import { parseSampleDocuments } from '../tools/engine/samples.js';
const NOW = Date.parse('2026-11-15T01:00:00Z');
const DATE = 'Sat, 14 Nov 2026 20:00:00 +0000';
const item = (floor, actor, text, topic = 101, title = 'Gecko window') => `<item><title>${title}</title><dc:creator><![CDATA[${actor}]]></dc:creator><description><![CDATA[${text}]]></description><link>https://community.morphmarket.com/t/gecko-window/${topic}${floor ? '/' + floor : ''}</link><pubDate>${DATE}</pubDate><category>Geckos</category></item>`;
const rss = items => `<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>${items.join('')}</channel></rss>`;
const status = (id, text = '<p>The lizard is basking.</p>') => ({id, created_at:'2026-11-14T20:00:00Z', visibility:'public', sensitive:false,
  spoiler_text:'',reblog:null, in_reply_to_id:null, account:{acct:'animalobserver',username:'animalobserver',display_name:'Animal Observer',bot:false},content:text,media_attachments:[]});

function fakeFetch({fail = false} = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url); assert.equal(options.redirect,'error'); assert.ok(options.signal);
    assert.ok(!Object.keys(options.headers).some(key=>key.toLowerCase()==='authorization'));
    if(fail) return new Response('blocked',{status:403});
    if(url.includes('latest.rss')) return new Response(rss([item(null,'rawowner','<p>The gecko sits on the window.</p>'),item(null,'otherowner','<p>The gecko moved under a leaf.</p>',102)]));
    if(url.endsWith('/101.rss')) return new Response(rss([item(3,'rawowner','<p>rawreply, I see.</p>'),item(2,'rawreply','<p>@rawowner it moved.</p>'),item(1,'rawowner','<p>The gecko sits on the window.</p>')]));
    if(url.endsWith('/102.rss')) return new Response(rss([item(1,'otherowner','<p>The gecko moved under a leaf.</p>',102)]));
    throw Error('unexpected URL '+url);
  };
  return {fetchImpl,calls};
}

test('source catalog is bounded to public reptile feeds and ignores human-only gecko homonyms', () => {
  assert.equal(geckoSources.length,2);
  assert.ok(geckoSources.every(s=>s.lists.every(u=>u.startsWith('https://')&&!u.includes('y29'))));
  assert.equal(reptileCandidate('Gecko browser programming'),false);
  assert.equal(reptileCandidate('XMPP app #gecko'),false);
  assert.equal(reptileCandidate('My gecko under the branch'),true);
  assert.equal(reptileCandidate('Leopard gecko vet diagnosis'),false);
  assert.equal(reptileCandidate('Snake breeding discount buy now'),false);
  assert.equal(excludedHumanOrClinical('Is this poop normal? Should I get the stool tested?'),true);
  assert.equal(excludedHumanOrClinical('I finished this painting of a gecko'),true);
});

test('Discourse RSS preserves source order, repeated speakers and unknown parent relationships', () => {
  const source=geckoSources[0], topic={id:'101'};
  const payload=rss([item(3,'owner','<p>Thanks.</p>'),item(1,'owner','<p>My gecko has a new perch.</p>'),item(2,'reply','<p>Does it move?</p>')]);
  const d=parseGeckoDiscussion(source,topic,payload,plainText);
  assert.equal(d.root.actor,'owner');assert.deepEqual(d.replies.map(r=>r.id),['2','3']);
  assert.ok(d.replies.every(r=>r.replyTo===undefined));
  assert.deepEqual(anonymizeDiscussion(d,collectionLimits).messages.map(m=>m.speaker),['发言者 1','发言者 2','发言者 1']);
  assert.throws(()=>parseGeckoDiscussion(source,topic,rss([item(2,'reply','Only a reply')]),plainText),/does not include the root/);
  assert.throws(()=>rssItems('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>'),/Invalid/);
});

test('Mastodon takes public roots, omits inaccessible media and keeps only returned public replies', () => {
  const source=geckoSources[1];
  const roots=parseGeckoTopics(source,[status('101'),{...status('102'),visibility:'private'},{...status('103'),sensitive:true},status('104','<p>Firefox Gecko browser</p>')],plainText);
  assert.equal(roots.length,1);
  const reply={...status('201'),in_reply_to_id:'101'};
  const d=parseGeckoDiscussion(source,roots[0],{descendants:[reply,{...reply,id:'202',visibility:'direct'}]},plainText);
  assert.equal(d.replies.length,1);assert.equal(d.replies[0].replyTo,'101');
  const withMedia={...status('105'),media_attachments:[{type:'image',description:'unread private opinion'}]};
  const m=parseGeckoTopics(source,[withMedia],plainText)[0];
  assert.match(m.text,/未读取画面/);assert.ok(!m.text.includes('unread private opinion'));
});

test('quoted statements keep boundaries and map only known floors from the same source topic', () => {
  const quote=(post,topic)=>`<aside class="quote" data-username="owner" data-post="${post}" data-topic="${topic}"><div class="title">owner:</div><blockquote><p>My gecko hid.</p></blockquote></aside><p>Mine stayed out.</p>`;
  const d=parseGeckoDiscussion(geckoSources[0],{id:'101'},rss([item(1,'owner','<p>My gecko hid.</p>'),item(2,'reply',quote(1,101)),item(3,'third',quote(1,999)),item(4,'fourth',quote(9,101))]),plainText);
  const a=anonymizeDiscussion(d,collectionLimits);
  assert.match(a.messages[1].text,/引用开始，\[引用第 1 条\]/);
  assert.match(a.messages[1].text,/My gecko hid\.[\s\S]*引用结束[\s\S]*Mine stayed out\./);
  assert.match(a.messages[2].text,/引用开始，目标未收录或未知/);
  assert.match(a.messages[3].text,/引用开始，目标未收录或未知/);
  assert.equal(a.messages[1].replyTo,null);
  assert.ok(!a.messages[1].text.includes('owner:'));
});

test('collection actually reads bounded root discussions and anonymizes actors without inventing replies',async()=>{
  const f=fakeFetch(),result=await collectGeckoOpinions({now:NOW,seed:'fixed',sources:[geckoSources[0]],fetchImpl:f.fetchImpl});
  assert.equal(result.ready,true);assert.equal(result.fragments,2);assert.equal(result.messages,4);
  assert.equal(f.calls.length,3);assert.ok(!/rawowner|rawreply|otherowner/.test(result.markdown));
  assert.match(result.markdown,/RSS 未给出的楼中楼父关系保持未知/);
  const entries=parseSampleDocuments([{path:'environment/sources-daily-opinions.md',text:'<!-- samples:start -->\n'+result.markdown+'<!-- samples:end -->'}]);
  assert.equal(entries.length,2);
});

test('used fragments and stale source roots do not return as new cases',async()=>{
  const f=fakeFetch(),a=await collectGeckoOpinions({now:NOW,seed:'fixed',sources:[geckoSources[0]],fetchImpl:f.fetchImpl});
  const entries=parseSampleDocuments([{path:'environment/sources-daily-opinions.md',text:'<!-- samples:start -->\n'+a.markdown+'<!-- samples:end -->'}]);
  const {caseFingerprint}=await import('../tools/engine/case-usage.js');
  const used=entries.map(e=>({fingerprint:caseFingerprint(e.sample)}));
  const b=await collectGeckoOpinions({now:NOW,seed:'fixed',used,sources:[geckoSources[0]],fetchImpl:f.fetchImpl});
  assert.equal(b.fragments,0);assert.equal(b.ready,false);
  const stale=await collectGeckoOpinions({now:NOW+8*86400000,sources:[geckoSources[0]],fetchImpl:f.fetchImpl});
  assert.equal(stale.fragments,0);
});

test('hashtags, bare links and unavailable images do not manufacture a readable root case',async()=>{
  const s={...status('101','<p>https://example.org/picture</p><p>#reptiles #macro #photography</p>'),tags:[{name:'reptiles'}],media_attachments:[{type:'image'}]};
  const fetchImpl=async url=>new Response(JSON.stringify(url.includes('/context')?{descendants:[{...status('201','<p>Gold eyes!</p>'),in_reply_to_id:'101'}]}:[s]));
  const result=await collectGeckoOpinions({now:NOW,sources:[{...geckoSources[1],lists:[geckoSources[1].lists[0]]}],fetchImpl});
  assert.equal(result.fragments,0);assert.equal(result.ready,false);
});

test('failed or insufficient collection preserves the prior material timestamp and bytes',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'gsm-gecko-collection-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const documentPath=join(directory,'daily.md'),old='# Local rules\n<!-- samples:start -->\n采集时间：2026-11-13 08:00:00（北京时间）\n<!-- samples:end -->\nManual suffix\n';
  await writeFile(documentPath,old);
  const f=fakeFetch({fail:true});
  const result=await updateGeckoOpinionDocument({documentPath,used:[],sources:[geckoSources[0]],fetchImpl:f.fetchImpl,now:NOW});
  assert.equal(result.written,false);assert.equal(result.ready,false);assert.equal(await readFile(documentPath,'utf8'),old);
  const ok=fakeFetch();
  const saved=await updateGeckoOpinionDocument({documentPath,used:[],sources:[geckoSources[0]],fetchImpl:ok.fetchImpl,now:NOW,seed:'fixed'});
  assert.equal(saved.written,true);const text=await readFile(documentPath,'utf8');
  assert.ok(text.startsWith('# Local rules\n'));assert.ok(text.endsWith('Manual suffix\n'));assert.match(text,/2026-11-15 09:00:00/);
  await assert.rejects(updateGeckoOpinionDocument({documentPath,outputPath:join(process.cwd(),'gsm/preview.md')}),/outside the repository/);
});
