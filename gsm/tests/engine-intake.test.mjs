import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { refreshIntake, readIntakeSnapshot, collectedAt, snapshotName } from '../tools/engine/intake-refresh.js';

const NOW = Date.parse('2026-11-15T01:00:00Z');
const material = (time = '2026-11-15 08:30:00', count = 4) => '# 每日素材\n<!-- samples:start -->\n采集时间：' + time + '（北京时间）\n\n' +
  Array.from({ length: count }, (_, index) => `### 讨论 ${index}\n1. **发言者 1**：守宫的不同实际情况 ${index}。\n2. **发言者 2**：嗯。`).join('\n\n') + '\n<!-- samples:end -->\n';
const blob = text => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0' + text).digest('hex');
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'gsm-intake-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let root = join(directory, 'repository/gsm'); const workDirectory = join(directory, 'work');
  await mkdir(join(root, 'environment'), { recursive: true }); root = await realpath(root);
  const path = join(root, 'environment/sources-daily-opinions.md');
  await writeFile(path, material());
  return { root, workDirectory, path, options: { root, workDirectory, now: NOW, fetchImpl: () => { throw Error('network must not be used'); } } };
}

test('preparing freezes GSM-owned local material without network, credentials or another repository', async t => {
  const f = await fixture(t), result = await refreshIntake(f.options);
  assert.equal(result.status, 'ready');
  assert.equal(result.intakeReceipt.repository, 'fivsevn/umwelt');
  assert.equal(result.intakeReceipt.path, 'gsm/environment/sources-daily-opinions.md');
  assert.equal(result.intakeReceipt.revision, blob(material()));
  assert.equal(result.intakeReceipt.collectedAt, '2026-11-15T00:30:00.000Z');
  const saved = await readIntakeSnapshot(f.workDirectory, { root: f.root, now: NOW });
  assert.equal(saved.text, material()); assert.deepEqual(saved.receipt, result.intakeReceipt);
  assert.equal(await readFile(f.path, 'utf8'), material());
});

test('a retry before operation creation keeps its exact current snapshot after the local source rotates', async t => {
  const f = await fixture(t), first = await refreshIntake(f.options);
  await writeFile(f.path, material().replace('实际情况', '新采集内容'));
  assert.deepEqual(await refreshIntake(f.options), first);
});

test('a prepared operation resumes from frozen material even when the current document disappears', async t => {
  const f = await fixture(t), ready = await refreshIntake(f.options);
  await writeFile(join(f.workDirectory, 'operation.json'), JSON.stringify({ root: f.root, plan: { caseAdaptation: { intakeReceipt: ready.intakeReceipt } } }));
  await rm(f.path);
  assert.equal((await refreshIntake({ ...f.options, now: NOW + 3 * 86400000 })).status, 'resumed');
  assert.deepEqual((await readIntakeSnapshot(f.workDirectory, { root: f.root })).receipt, ready.intakeReceipt);
});

test('new updates reject stale, missing, insufficient or identifying material without invented cases', async t => {
  for (const source of [material('2026-11-13 08:30:00'), material().replace('采集时间：', '不明时间：'), material(undefined, 1), material().replace('不同实际情况 0', '@identifiable-user')]) {
    const f = await fixture(t); await writeFile(f.path, source);
    await assert.rejects(refreshIntake(f.options));
    await assert.rejects(readFile(join(f.workDirectory, snapshotName)), { code: 'ENOENT' });
    await assert.rejects(readFile(join(f.workDirectory, 'operation.json')), { code: 'ENOENT' });
  }
});

test('preparation counts usable cases without rewriting the acquired document or receipt', async t => {
  const f = await fixture(t);
  const contaminated = material(undefined, 3).replace('守宫的不同实际情况 0。', '[Gecko] MDMA (244mg). Logo: Gecko. DrugsPRO app.');
  await writeFile(f.path, contaminated);
  const ready = await refreshIntake(f.options);
  assert.equal(ready.intakeReceipt.documentSha, blob(contaminated));
  assert.equal((await readIntakeSnapshot(f.workDirectory, { root: f.root })).text, contaminated);
  assert.equal(await readFile(f.path, 'utf8'), contaminated);

  const insufficient = await fixture(t);
  await writeFile(insufficient.path, material(undefined, 2).replace('守宫的不同实际情况 0。', '[Gecko] MDMA (244mg). Logo: Gecko.'));
  await assert.rejects(refreshIntake(insufficient.options), /at least two usable cases/);
  await assert.rejects(readFile(join(insufficient.workDirectory, snapshotName)), { code: 'ENOENT' });
});

test('a retry rechecks an unbound snapshot against the current topic exclusions', async t => {
  const f = await fixture(t); await refreshIntake(f.options);
  const filename = join(f.workDirectory, snapshotName), saved = JSON.parse(await readFile(filename, 'utf8'));
  saved.text = material(undefined, 2).replace('守宫的不同实际情况 0。', '[Gecko] MDMA (244mg).');
  saved.receipt.revision = saved.receipt.documentSha = blob(saved.text);
  saved.receipt.documentDigest = createHash('sha256').update(saved.text).digest('hex');
  const before = JSON.stringify(saved); await writeFile(filename, before);
  await assert.rejects(refreshIntake(f.options), /at least two usable cases/);
  assert.equal(await readFile(filename, 'utf8'), before);
});

test('stale unbound snapshots refresh atomically; unavailable or stale local material preserves prior bytes', async t => {
  const f = await fixture(t); await refreshIntake(f.options);
  const before = await readFile(join(f.workDirectory, snapshotName), 'utf8'); await rm(f.path);
  await assert.rejects(refreshIntake({ ...f.options, now: NOW + 2 * 86400000 }), { code: 'ENOENT' });
  assert.equal(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
  await writeFile(f.path, material());
  await assert.rejects(refreshIntake({ ...f.options, now: NOW + 2 * 86400000 }), /24 hours/);
  assert.equal(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
  await writeFile(f.path, material('2026-11-17 08:30:00'));
  const refreshed = await refreshIntake({ ...f.options, now: NOW + 2 * 86400000 });
  assert.equal(refreshed.intakeReceipt.collectedAt, '2026-11-17T00:30:00.000Z');
  assert.notEqual(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
});

test('receipt or body tampering and cross-site reuse cannot replace pinned material', async t => {
  const f = await fixture(t); await refreshIntake(f.options);
  const path = join(f.workDirectory, snapshotName), before = await readFile(path, 'utf8');
  const value = JSON.parse(before); value.text += '\nchanged'; await writeFile(path, JSON.stringify(value));
  await assert.rejects(readIntakeSnapshot(f.workDirectory, { root: f.root, now: NOW }), /does not match/);
  await writeFile(path, before);
  await assert.rejects(readIntakeSnapshot(f.workDirectory, { root: join(f.root, 'other'), now: NOW }), /another site/);
  await writeFile(join(f.workDirectory, 'operation.json'), JSON.stringify({ root: join(f.root, 'other'), plan: {} }));
  await assert.rejects(refreshIntake(f.options), /another site/);
  assert.equal(await readFile(path, 'utf8'), before);
});

test('local documents and working snapshots reject symlinks and repository-local work directories', async t => {
  const f = await fixture(t);
  await assert.rejects(refreshIntake({ ...f.options, workDirectory: join(f.root, 'work') }), /outside the repository/);
  await mkdir(f.workDirectory); const target = join(f.workDirectory, 'unrelated.json'); await writeFile(target, '{}');
  await symlink(target, join(f.workDirectory, snapshotName));
  await assert.rejects(refreshIntake(f.options), /regular bounded/);
  assert.equal(await readFile(target, 'utf8'), '{}');
  await rm(join(f.workDirectory, snapshotName)); await rm(f.path); await symlink(target, f.path);
  await assert.rejects(refreshIntake(f.options), /regular bounded/);
});

test('collection time comes from the material block rather than the current clock', () => {
  assert.equal(collectedAt(material()), '2026-11-15T00:30:00.000Z');
  assert.throws(() => collectedAt('采集时间：2026-11-15 08:30:00（北京时间）\n<!-- samples:start -->\n没有日期\n<!-- samples:end -->'));
});
