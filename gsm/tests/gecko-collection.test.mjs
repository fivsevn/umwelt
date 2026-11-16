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
const drugReport = '[Gecko] MDMA (244mg) – Basel, Switzerland – 2026-11-09\nDetected: MDMA (244mg)\nColor: blue\nLogo: Gecko\nWeight: 492 mg\nDrugsPRO app';

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
  assert.equal(geckoSources.length,10);
  assert.equal(new Set(geckoSources.flatMap(s=>s.lists.map(u=>new URL(u).hostname))).size,10);
  assert.ok(geckoSources.every(s=>s.lists.every(u=>u.startsWith('https://')&&!u.includes('y29'))));
  assert.equal(reptileCandidate('Gecko browser programming'),false);
  assert.equal(reptileCandidate('XMPP app #gecko'),false);
  assert.equal(reptileCandidate('My gecko under the branch'),true);
  assert.equal(reptileCandidate('Field herping the island of endemics'),true);
  assert.equal(reptileCandidate('Meerkats explore the new enclosure at Zoo Vivarium'),false);
  assert.equal(reptileCandidate('New plants and waterfall in my terrarium'),true);
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

test('drug-checking reports with Gecko logos never become animal topics', () => {
  for (const text of [drugReport, 'Gecko pill testing results', 'Gecko drug-checking report', 'Gecko ecstasy tablet']) {
    assert.equal(reptileCandidate(text), false, text);
    assert.equal(excludedHumanOrClinical(text), true, text);
  }
  const source = geckoSources[1];
  const roots = parseGeckoTopics(source, [status('101', '<p>' + drugReport + '</p>'), status('102')], plainText);
  assert.deepEqual(roots.map(root => root.id), ['102']);
  assert.equal(reptileCandidate('The gecko rests beneath the blue leaf.'), true);
});

test('Mastodon applies the full exclusion policy before spending a context request', async () => {
  const source = { ...geckoSources[1], lists: [geckoSources[1].lists[0]] }, calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    return new Response(JSON.stringify(url.endsWith('/context') ? { descendants: [] } : [
      status('101', '<p>' + drugReport + '</p>'),
      status('102', '<p>The gecko needs prescription medication.</p>'),
      status('103', '<p>New video out! Find the video here, reptiles.</p>'),
      status('104'), status('105', '<p>The gecko moved under a leaf.</p>')
    ]));
  };
  const result = await collectGeckoOpinions({ sources: [source], now: NOW, seed: 'homonym', fetchImpl });
  assert.equal(result.ready, true); assert.equal(result.fragments, 2);
  assert.doesNotMatch(result.markdown, /MDMA|DrugsPRO|prescription|New video/);
  assert.equal(calls.filter(url => url.endsWith('/context')).length, 2);
});

test('a drug-checking reply excludes the whole discussion before rendering the material', async () => {
  const source = { ...geckoSources[1], lists: [geckoSources[1].lists[0]] };
  const result = await collectGeckoOpinions({ sources: [source], now: NOW, fetchImpl: async url => new Response(JSON.stringify(
    url.endsWith('/context') ? { descendants: [{ ...status('201', '<p>' + drugReport + '</p>'), in_reply_to_id: '101' }] } : [status('101')]
  )) });
  assert.equal(result.fragments, 0); assert.equal(result.ready, false);
  assert.equal(result.sources[0].excluded, 1);
});

test('collection excludes replies with invalid, future or pre-root dates and preserves missing parents', async () => {
  const source = { ...geckoSources[1], lists: [geckoSources[1].lists[0]] };
  const reply = (id, text, created_at, parent = '101') => ({ ...status(id, '<p>' + text + '</p>'), created_at, in_reply_to_id: parent });
  const replies = [
    reply('201', 'BEFORE_ROOT', '2026-11-14T19:59:59Z'),
    reply('202', 'INVALID_TIME', 'not a date'),
    reply('203', 'FUTURE_REPLY', '2026-11-15T01:00:01Z'),
    reply('204', 'The leaf moved again.', '2026-11-14T20:01:00Z', '201'),
    reply('205', 'Now the gecko is resting.', '2026-11-14T20:02:00Z')
  ];
  const result = await collectGeckoOpinions({ sources: [source], now: NOW, fetchImpl: async url => new Response(JSON.stringify(
    url.endsWith('/context') ? { descendants: replies } : [status('101')]
  )) });
  assert.equal(result.messages, 3);
  assert.doesNotMatch(result.markdown, /BEFORE_ROOT|INVALID_TIME|FUTURE_REPLY/);
  assert.match(result.markdown, /引用未收录发言[\s\S]*The leaf moved again/);
  assert.match(result.markdown, /回复第 1 条[\s\S]*Now the gecko is resting/);
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
  assert.match(result.markdown,/父回复关系未提供/);
  assert.doesNotMatch(result.markdown,/已自动去除|未作语义转述|人类观察者/);
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

const forumPost = ({ id, actor, floor, date = '2026-11-14T20:00:00Z', text }) => `<article class="message message--post" data-author="${actor}" data-content="post-${id}"><meta itemprop="position" content="${floor}"/><meta itemprop="datePublished" content="${date}"/><article class="message-body"><div class="bbWrapper">${text}</div></article></article>`;

test('public forum HTML takes actual root date and preserves quoted text without inventing reply parents', () => {
  const source=geckoSources.find(s=>s.key==='geckoforums'), topic={id:'101',url:'https://geckoforums.net/threads/gecko-window.101/'};
  const html=forumPost({id:100,actor:'one',floor:1,date:'2025-01-01T10:00:00Z',text:'My gecko moved to the leaf.'})+
    forumPost({id:103,actor:'two',floor:3,text:'<blockquote class="bbCodeBlock"><div class="bbCodeBlock-content">My gecko moved.</div></blockquote>Mine is still hiding.'})+
    forumPost({id:101,actor:'one',floor:2,text:'Now it is under the branch.'});
  const discussion=parseGeckoDiscussion(source,topic,html,plainText);
  assert.equal(discussion.root.created,Date.parse('2025-01-01T10:00:00Z'));
  assert.deepEqual(discussion.replies.map(r=>r.id),['101','103']);
  assert.ok(discussion.replies.every(r=>r.replyTo===undefined));
  assert.match(discussion.replies[1].text,/引用开始，目标未知[\s\S]*My gecko moved[\s\S]*引用结束[\s\S]*Mine is still hiding/);
  assert.throws(()=>parseGeckoDiscussion(source,topic,forumPost({id:1,actor:'one',floor:2,text:'Only a reply.'}),plainText),/does not include the root/);
});

test('ReptileForums separate root section remains distinct from reply articles', () => {
  const source=geckoSources.find(s=>s.key==='reptileforums'), topic={id:'101',url:'https://www.reptileforums.co.uk/threads/gecko.101/'};
  const root='<div qid="thread-main-section"><span class="username" itemprop="name">owner</span><article class="message-body">The gecko sleeps below the leaf.</article><meta itemprop="datePublished" content="2026-11-14T18:00:00Z"/><meta itemprop="position" content="1"/></div>';
  const d=parseGeckoDiscussion(source,topic,root+forumPost({id:200,actor:'reader',floor:2,text:'The new perch looks narrow.'}),plainText);
  assert.equal(d.root.actor,'owner');assert.equal(d.root.id,'root');assert.equal(d.replies.length,1);
  assert.match(d.root.text,/gecko sleeps/);assert.doesNotMatch(d.root.text,/perch/);
});

test('expanded feed parser uses full RSS content and rejects cross-host links and sale categories', () => {
  const source=geckoSources.find(s=>s.key==='geckoforums');
  const entry=(url,category='Geckos')=>`<item><title>Gecko house</title><link>${url}</link><dc:creator>owner</dc:creator><category>${category}</category><content:encoded><![CDATA[<p>The gecko sleeps under the leaves.</p>]]></content:encoded><pubDate>${DATE}</pubDate></item>`;
  assert.equal(parseGeckoTopics(source,rss([entry('https://geckoforums.net/threads/house.101/')]),plainText).length,1);
  assert.equal(parseGeckoTopics(source,rss([entry('https://example.org/threads/house.101/')]),plainText).length,0);
  assert.equal(parseGeckoTopics(source,rss([entry('https://geckoforums.net/threads/house.101/','For Sale')]),plainText).length,0);
});

test('the same federated original is fetched once across public instances and lists', async () => {
  const sources=geckoSources.filter(s=>s.kind==='mastodon').map(s=>({...s,lists:[s.lists[0]]}));
  const calls=[];
  const fetchImpl=async url=>{
    calls.push(url);
    if(url.endsWith('/context')) return new Response('{"descendants":[]}');
    const id=url.includes('mastodon.online')?'202':'101';
    return new Response(JSON.stringify([{...status(id),uri:'https://animal.example/users/observer/statuses/shared-original'}]));
  };
  const a=await collectGeckoOpinions({sources,now:NOW,seed:'federated',fetchImpl});
  assert.equal(a.fragments,1);assert.equal(calls.filter(url=>url.endsWith('/context')).length,1);
  const b=await collectGeckoOpinions({sources:[...sources].reverse(),now:NOW,seed:'federated',fetchImpl});
  assert.equal(a.markdown,b.markdown);
});

test('new source scope excludes actual human trade, medical, fabrication and platform-promotion patterns', () => {
  for(const text of ['I added two new paintings to the shop today! Reptiles',
    'I prefer wild forms, not bland morphs. Enigma syndrome is deadly.',
    'I read about cancerous tumors in leos.',
    'Smashing paving slabs with a hammer for the terrarium.',
    'The reptile server has a post size of 5000. DM the admin to sign up.',
    'New video out! Find the video here, a day spent locating rattlesnakes.',
    'An RV toilet holding tank and bulkhead fitting for the chameleon drainage reservoir.',
    'Gargoyle gecko tips. Read the full guide for the setup.']) assert.equal(excludedHumanOrClinical(text),true,text);
  assert.equal(excludedHumanOrClinical('The gecko moved under a different leaf and rested there.'),false);
});

test('request concurrency is a global bound even with multiple sources and list feeds',async()=>{
  const sources=geckoSources.filter(s=>s.kind==='mastodon');let active=0,maximum=0;
  const fetchImpl=async()=>{active++;maximum=Math.max(maximum,active);await new Promise(done=>setTimeout(done,1));active--;return new Response('[]');};
  await collectGeckoOpinions({sources,fetchImpl,now:NOW,limits:{concurrency:2}});
  assert.ok(maximum<=2);assert.ok(maximum>0);
});

test('publisher RSS keeps only its supplied excerpt and never invents full-article access or comments', async () => {
  const source=geckoSources.find(s=>s.kind==='publisher-rss');
  const entry=(url,body)=>`<item><title>Wild reptiles return to rocky habitat</title><link>${url}</link><description><![CDATA[${body}]]></description><content:encoded>Unacquired full article and comment text.</content:encoded><pubDate>${DATE}</pubDate></item>`;
  const payload=rss([entry('https://reptilesmagazine.com/reptile-return/','<p>Reptiles were observed resting near sheltered rocks.</p><p>The post My title appeared first on Publisher.</p>'),
    entry('https://reptilesmagazine.com/new-branch/','<p>The lizard returned to a shaded branch.</p>'),
    entry('https://elsewhere.example/article/','<p>A gecko is here.</p>')]);
  const topics=parseGeckoTopics(source,payload,plainText);
  assert.equal(topics.length,2);assert.equal(topics[0].actor,source.name);
  assert.doesNotMatch(topics[0].text,/Unacquired|appeared first on/);
  assert.deepEqual(parseGeckoDiscussion(source,topics[0],null,plainText).replies,[]);
  const calls=[];
  const result=await collectGeckoOpinions({sources:[source],now:NOW,seed:'publisher',fetchImpl:async url=>{
    calls.push(url);return new Response(payload);
  }});
  assert.equal(result.ready,true);assert.equal(result.fragments,2);assert.equal(result.messages,2);
  assert.deepEqual(calls,source.lists);assert.match(result.markdown,/RSS 摘要/);
  assert.doesNotMatch(result.markdown,/Unacquired/);
  assert.equal(parseGeckoTopics(source,rss([entry('https://reptilesmagazine.com/empty/','')]),plainText).length,0);
});

test('all ten groups receive list reads within the bounded collection budget',async()=>{
  const calls=[];
  const result=await collectGeckoOpinions({now:NOW,fetchImpl:async url=>{
    calls.push(url);return new Response(url.includes('/api/')?'[]':'<rss><channel></channel></rss>');
  }});
  assert.equal(result.sources.length,10);
  assert.equal(calls.length,geckoSources.reduce((n,s)=>n+s.lists.length,0));
  for(const source of geckoSources) for(const url of source.lists) assert.ok(calls.includes(url),url);
  assert.ok(calls.length<collectionLimits.maxRequests);
  assert.equal(result.ready,false);
});
