import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm, realpath, symlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { refreshIntake } from '../tools/engine/intake-refresh.js';
import { prepareUpdate, briefUpdatePost, checkpointUpdate, suggestUpdatePresentation, validateUpdateForBatch, finishUpdate } from '../tools/engine/operations.js';
import { loadContent, ingestBatch } from '../tools/engine/content.js';
import { parsePublicFeed } from '../tools/engine/verify-live.js';
import { threadDirectory } from '../tools/engine/thread-packages.js';
import { saveArchive, restoreArchive } from '../tools/operation-archive.mjs';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
const iso = value => new Date(value).toISOString();
function localStamp(now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'gsm-operation-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let root = join(directory, 'project/gsm');
  await mkdir(root, { recursive: true }); root = await realpath(root);
  const workDirectory = join(directory, 'current');
  for (const path of ['docs', 'environment', 'users', 'posts', 'assets', 'data', 'README.md', 'accounts.json', 'publication.json']) {
    await cp(join(sourceRoot, path), join(root, path), { recursive: true });
  }
  // A fixture-only catalog exercises image verification without generating or
  // publishing any new media in the real checkout.
  await cp(join(root, 'assets/avatars/gecko404.webp'), join(root, 'assets/emotes/gsm/test-face.webp'));
  await save(join(root, 'assets/emotes/gsm/manifest.json'), { version: 1, name: 'GSM',
    items: [{ id: 'test-face', name: '测试表情', src: 'assets/emotes/gsm/test-face.webp', alt: '测试守宫头像' }] });
  const now = Date.now();
  const text = '# Test-only material\n<!-- samples:start -->\n采集时间：' + localStamp(now - 60000) + '（北京时间）\n\n' +
    Array.from({ length: 8 }, (_, index) => `### 讨论 ${index}\n1. **发言者 1**：测试片段 ${index} 的东西又被挪走了。\n2. **发言者 2**：有点烦。`).join('\n\n') + '\n<!-- samples:end -->\n';
  const intake = await refreshIntake({ root, workDirectory, now, fetchImpl: async url =>
    new Response(url.startsWith('https://api.github.com/') ? JSON.stringify([{ sha: 'a'.repeat(40) }]) : text, { status: 200 }) });
  const options = { root, workDirectory, now, entropy: () => 'gsm-operation-integration', intakeReceipt: intake.intakeReceipt };
  return { directory, root, workDirectory, now, options };
}
function research(now) {
  return [
    { category: 'news', kind: 'feed', url: 'https://news.example.org/test', visitedAt: iso(now), publishedAt: iso(now - 60000), summary: 'Synthetic test source for the current announcement.' },
    { category: 'trend', kind: 'thread', url: 'https://forum.example.net/test', visitedAt: iso(now), publishedAt: iso(now - 60000), summary: 'Synthetic test source containing a root and replies.' },
    { category: 'daily', kind: 'thread', url: 'https://forum.example.net/daily', visitedAt: iso(now), publishedAt: null, summary: 'Synthetic test source containing everyday details.' }
  ];
}

test('GSM prepares and resumes locally, separates writer input, archives once and verifies its own public feed and media', async t => {
  const f = await fixture(t), initial = await loadContent(f.root), prepared = await prepareUpdate(f.options);
  const original = await json(prepared.operationPath);
  assert.match(original.id, /^gsm-/);
  assert.ok([1, 2].includes(original.plan.budget));
  assert.ok([1, 2].includes(original.plan.caseAdaptation.count));
  assert.ok(original.plan.selectedIds.every(id => !['backpackgecko', 'gedageda', 'isopodafugue'].includes(id)));
  const resumed = await prepareUpdate({ ...f.options, now: f.now + 1000, entropy: () => { throw Error('must not redraw'); } });
  assert.equal(resumed.status, 'resumed');
  assert.deepEqual((await json(resumed.operationPath)).plan, original.plan);
  await assert.rejects(prepareUpdate({ ...f.options, requestedCount: 3 }), /combined count override/);

  const roots = original.plan.caseAdaptation.rootOrder;
  const first = await briefUpdatePost({ ...f.options, postId: roots[0], view: 'writer' });
  assert.deepEqual(Object.keys(first).sort(), ['draft', 'id', 'postId', 'writer']);
  assert.match(JSON.stringify(first.writer), /守宫/);
  assert.doesNotMatch(first.writer.writing.text, /## 审读/);
  assert.ok((await briefUpdatePost({ ...f.options, postId: roots[0] })).editor);
  const initialHistory = await readFile(join(f.root, 'data/feed.mjs'), 'utf8');
  for (const [index, postId] of roots.entries()) {
    const brief = await briefUpdatePost({ ...f.options, postId, view: 'writer' });
    assert.ok(brief.writer);
    const operation = await json(prepared.operationPath);
    operation.posts.push({ ...brief.draft, createdAt: iso(f.now), text: `测试发言 ${index}：这堆东西又挡住了，真烦。` });
    operation.reviews.push({ postId, negative: true, reason: 'Synthetic review: the test text expresses annoyance.' });
    await save(prepared.operationPath, operation);
  }
  await checkpointUpdate({ ...f.options, stage: 'draft' });
  const operation = await json(prepared.operationPath);
  operation.research = research(f.now);
  operation.researchMaintenance = operation.plan.researchMaintenance.selectedPaths.map(path => ({ path, status: 'checked',
    summary: 'Synthetic test maintenance review.', sources: [{ url: 'https://research.example.org/test', visitedAt: iso(f.now), summary: 'Synthetic source.' }] }));
  // Exercise shared-media rendering as well as plain text without creating images.
  const emote = (await json(join(f.root, 'assets/emotes/gsm/manifest.json'))).items[0];
  const thread = threadDirectory(operation.posts[0], new Map(operation.posts.map(post => [post.id, post])));
  const localEmote = thread + '/media/test-reaction.webp';
  await mkdir(join(f.root, thread, 'media'), { recursive: true });
  await cp(join(f.root, emote.src), join(f.root, localEmote));
  operation.posts[0].media = [{ src: emote.src, alt: emote.alt, kind: 'emote' }, { src: localEmote, alt: '测试根串内表情', kind: 'emote' }];
  await save(prepared.operationPath, operation);
  const suggested = await suggestUpdatePresentation(f.options);
  operation.diversityReview = { ...suggested.reviewBasis, content: 'Synthetic comparison against the archived roots.', images: 'Synthetic review of the declared existing emote.' };
  await save(prepared.operationPath, operation);
  await checkpointUpdate({ ...f.options, stage: 'edited' });
  const batch = { version: 1, id: operation.id, mode: 'daily', posts: operation.posts };
  await validateUpdateForBatch(batch, { root: f.root, contextPath: prepared.operationPath, now: f.now });
  await assert.rejects(ingestBatch(prepared.operationPath, { root: f.root, ai: true }), /Review the entire public batch/);
  assert.equal(await readFile(join(f.root, 'data/feed.mjs'), 'utf8'), initialHistory);
  const archived = await ingestBatch(prepared.operationPath, { root: f.root, ai: true, reviewed: true });
  assert.equal(archived.status, 'archived');
  const count = (await loadContent(f.root)).feed.posts.length;
  assert.equal(count, initial.feed.posts.length + operation.posts.length);
  assert.equal((await ingestBatch(prepared.operationPath, { root: f.root, ai: true, reviewed: true })).status, 'already-archived');
  assert.equal((await loadContent(f.root)).feed.posts.length, count);
  assert.ok((await json(join(f.root, '.publishing/public.json'))).includes('gsm/' + localEmote));

  // The canonical source remains authoritative even if the derived feed still
  // matches the reviewed operation. A stale rendered copy cannot hide edits.
  const archivedPath = join(f.root, thread, 'index.md'), archivedText = await readFile(archivedPath, 'utf8');
  await writeFile(archivedPath, archivedText.replace(operation.posts[0].text, '测试：归档原文在审读后被改了。'));
  await assert.rejects(finishUpdate({ ...f.options, fetchImpl: async () => { throw Error('must check canonical source first'); } }), /Local posts do not yet match/);
  await writeFile(archivedPath, archivedText);

  let corruptFeed = true, corruptMedia = false;
  const requests = [];
  const fetchImpl = async value => {
    const url = new URL(value); requests.push(url.href);
    assert.equal(url.origin, 'https://umwelt.fivsevn.com');
    assert.ok(url.pathname.startsWith('/gsm/'));
    if (url.pathname === '/gsm/data/feed.mjs') {
      const source = await readFile(join(f.root, 'data/feed.mjs'), 'utf8');
      if (!corruptFeed) return new Response(source);
      const feed = parsePublicFeed(source); feed.posts.find(post => post.id === operation.posts[0].id).likes++;
      return new Response('// Synthetic corrupted response\nexport const profiles = ' + JSON.stringify(feed.profiles) + ';\nexport const posts = ' + JSON.stringify(feed.posts) + ';\n');
    }
    const bytes = await readFile(join(f.root, decodeURIComponent(url.pathname.slice('/gsm/'.length))));
    return new Response(corruptMedia ? Buffer.from('wrong-media-bytes') : bytes);
  };
  await assert.rejects(finishUpdate({ ...f.options, fetchImpl }), /Online GSM content does not match/);
  assert.equal((await json(prepared.operationPath)).status, 'awaiting-online');
  corruptFeed = false; corruptMedia = true;
  await assert.rejects(finishUpdate({ ...f.options, fetchImpl }), /Online GSM media differs/);
  assert.ok(await readFile(prepared.readingPath));
  corruptMedia = false;
  const localBytes = await readFile(join(f.root, localEmote));
  await rm(join(f.root, localEmote));
  await symlink(join(f.root, emote.src), join(f.root, localEmote));
  await assert.rejects(finishUpdate({ ...f.options, fetchImpl }), /symlink|symbolic link|regular/);
  await rm(join(f.root, localEmote));
  await writeFile(join(f.root, localEmote), localBytes);
  const finished = await finishUpdate({ ...f.options, fetchImpl });
  assert.equal(finished.status, 'published');
  assert.equal(finished.count, operation.posts.length);
  assert.ok(requests.some(url => url.includes('/assets/avatars/')));
  assert.ok(requests.some(url => url.includes('/assets/emotes/gsm/')));
  assert.ok(requests.some(url => url.includes('/' + localEmote)));
  await assert.rejects(readFile(prepared.operationPath), { code: 'ENOENT' });
  await assert.rejects(readFile(join(f.workDirectory, 'daily-material.json')), { code: 'ENOENT' });
  const history = await json(join(f.workDirectory, 'draft-history-' + operation.id + '.json'));
  assert.deepEqual(history.snapshots.map(snapshot => snapshot.stage), ['draft', 'edited']);
  assert.equal(history.snapshots[0].posts[0].media.length, 0);
  assert.equal(history.snapshots[1].posts[0].media.length, 2);
});

test('changing GSM source invalidates an existing brief while refresh preserves the original draw and draft', async t => {
  const f = await fixture(t), prepared = await prepareUpdate(f.options), before = await json(prepared.operationPath);
  const path = join(f.root, 'docs/writing.md');
  await writeFile(path, await readFile(path, 'utf8') + '\n<!-- synthetic local rule revision -->\n');
  await assert.rejects(briefUpdatePost({ ...f.options, postId: before.plan.caseAdaptation.rootOrder[0] }), /Source material changed/);
  await prepareUpdate({ ...f.options, entropy: () => { throw Error('must not redraw'); } });
  const after = await json(prepared.operationPath);
  assert.deepEqual(after.plan, before.plan);
  assert.deepEqual(after.posts, before.posts);
  assert.notEqual(after.sourceDigest, before.sourceDigest);
});

test('private archive replay relocates the pinned material and preserves the draw, and rejects checksum corruption before restore', async t => {
  const f = await fixture(t), repository = dirname(f.root);
  execFileSync('git', ['init', '--quiet', repository]);
  execFileSync('git', ['add', '.'], { cwd: repository });
  execFileSync('git', ['-c', 'user.name=GSM Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Synthetic committed GSM source'], { cwd: repository });
  const prepared = await prepareUpdate(f.options), before = await json(prepared.operationPath);
  const archive = join(f.directory, 'private-archive');
  const saved = await saveArchive({ root: f.root, work: f.workDirectory, archive, stage: 'prepared' });
  const manifest = await json(saved.manifestPath);
  assert.ok(manifest.files.some(file => file.path === 'work/daily-material.json'));
  assert.equal(saved.sourceRevision, execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim());
  const movedRoot = join(f.directory, 'relocated/gsm'), movedWork = join(f.directory, 'relocated-work');
  await cp(f.root, movedRoot, { recursive: true });
  const restored = await restoreArchive({ archive, operationId: before.id, stage: 'prepared', bundleId: saved.bundleId, root: movedRoot, work: movedWork });
  const after = await json(restored.operationPath), material = await json(join(movedWork, 'daily-material.json'));
  assert.equal(after.root, await realpath(movedRoot));
  assert.equal(material.root, after.root);
  assert.equal(after.sourceDigest, before.sourceDigest);
  assert.deepEqual({ ...after.plan, seal: before.plan.seal }, before.plan);
  assert.notEqual(after.plan.seal, before.plan.seal);
  assert.deepEqual(material.receipt, before.plan.caseAdaptation.intakeReceipt);
  const resumed = await refreshIntake({ root: movedRoot, workDirectory: movedWork, now: f.now + 3 * 86400000,
    fetchImpl: async () => { throw Error('restored operation must resume offline'); } });
  assert.equal(resumed.status, 'resumed');
  await prepareUpdate({ root: movedRoot, workDirectory: movedWork, now: f.now + 1000, entropy: () => { throw Error('restored draw must not change'); } });
  assert.equal((await json(restored.operationPath)).sourceDigest, before.sourceDigest);

  const archivedMaterial = join(dirname(saved.manifestPath), 'work/daily-material.json');
  await writeFile(archivedMaterial, (await readFile(archivedMaterial, 'utf8')) + '\n');
  const rejectedWork = join(f.directory, 'rejected-work');
  await assert.rejects(restoreArchive({ archive, operationId: before.id, stage: 'prepared', bundleId: saved.bundleId, root: movedRoot, work: rejectedWork }), /checksum mismatch/);
  await assert.rejects(readFile(join(rejectedWork, 'operation.json')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(rejectedWork, 'daily-material.json')), { code: 'ENOENT' });
});
