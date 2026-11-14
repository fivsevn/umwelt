import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { refreshIntake, readIntakeSnapshot, collectedAt, snapshotName } from '../tools/engine/intake-refresh.js';

const NOW = Date.parse('2026-11-15T01:00:00Z'), REVISION = 'a'.repeat(40);
const material = (time = '2026-11-15 08:30:00', count = 4) => '# 每日素材\n<!-- samples:start -->\n采集时间：' + time + '（北京时间）\n\n' +
  Array.from({ length: count }, (_, index) => `### 讨论 ${index}\n1. **发言者 1**：不同的实际情况 ${index}。\n2. **发言者 2**：嗯。`).join('\n\n') + '\n<!-- samples:end -->\n';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'gsm-intake-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let root = join(directory, 'repository/gsm');
  const workDirectory = join(directory, 'work');
  await mkdir(root, { recursive: true });
  root = await realpath(root);
  const state = { root, workDirectory, text: material(), revision: REVISION, calls: [], fail: false };
  state.fetchImpl = async (url, options) => {
    state.calls.push({ url, options });
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.ok(!Object.keys(options.headers).some(key => key.toLowerCase() === 'authorization'));
    if (state.fail) throw Error('synthetic network unavailable');
    if (url.startsWith('https://api.github.com/repos/fivsevn/y29/commits?')) return new Response(JSON.stringify([{ sha: state.revision }]), { status: 200 });
    assert.equal(url, 'https://raw.githubusercontent.com/fivsevn/y29/' + state.revision + '/lucifer0/environment/sources-daily-opinions.md');
    return new Response(state.text, { status: 200 });
  };
  state.options = { root, workDirectory, now: NOW, fetchImpl: state.fetchImpl };
  return state;
}

test('the only remote work is two credential-free GETs for the daily document at an immutable revision', async t => {
  const f = await fixture(t), result = await refreshIntake(f.options);
  assert.equal(result.status, 'ready');
  assert.equal(result.intakeReceipt.revision, REVISION);
  assert.equal(result.intakeReceipt.repository, 'fivsevn/y29');
  assert.equal(result.intakeReceipt.collectedAt, '2026-11-15T00:30:00.000Z');
  assert.equal(f.calls.length, 2);
  assert.match(f.calls[0].url, /sha=main/);
  assert.ok(f.calls.every(call => !/dispatches|git\/refs|workflow/.test(call.url)));
  const saved = await readIntakeSnapshot(f.workDirectory, { root: f.root, now: NOW });
  assert.equal(saved.text, f.text);
  assert.deepEqual(saved.receipt, result.intakeReceipt);
  await assert.rejects(readFile(join(f.root, 'environment/sources-daily-opinions.md')), { code: 'ENOENT' });
});

test('a retry before operation creation keeps its exact current snapshot without another remote request', async t => {
  const f = await fixture(t), first = await refreshIntake(f.options);
  f.text = material().replace('实际情况', '远端改稿'); f.revision = 'b'.repeat(40); f.fail = true;
  const second = await refreshIntake(f.options);
  assert.deepEqual(second, first);
  assert.equal(f.calls.length, 2);
});

test('a prepared operation resumes offline from its frozen original material even after the daily file rotates', async t => {
  const f = await fixture(t), ready = await refreshIntake(f.options);
  await writeFile(join(f.workDirectory, 'operation.json'), JSON.stringify({ root: f.root, plan: { caseAdaptation: { intakeReceipt: ready.intakeReceipt } } }));
  f.fail = true;
  const resumed = await refreshIntake({ ...f.options, now: NOW + 3 * 86400000 });
  assert.equal(resumed.status, 'resumed');
  assert.equal(f.calls.length, 2);
  assert.deepEqual((await readIntakeSnapshot(f.workDirectory, { root: f.root })).receipt, ready.intakeReceipt);
});

test('new updates reject stale, missing, insufficient or identifying material without saving invented cases', async t => {
  for (const source of [material('2026-11-13 08:30:00'), material().replace('采集时间：', '不明时间：'), material(undefined, 1), material().replace('不同的实际情况 0', '@identifiable-user')]) {
    const f = await fixture(t); f.text = source;
    await assert.rejects(refreshIntake(f.options));
    await assert.rejects(readFile(join(f.workDirectory, snapshotName)), { code: 'ENOENT' });
    await assert.rejects(readFile(join(f.workDirectory, 'operation.json')), { code: 'ENOENT' });
  }
});

test('stale unbound snapshots refresh atomically while a failed refresh preserves the last valid snapshot', async t => {
  const f = await fixture(t); await refreshIntake(f.options);
  const before = await readFile(join(f.workDirectory, snapshotName), 'utf8');
  f.fail = true;
  await assert.rejects(refreshIntake({ ...f.options, now: NOW + 2 * 86400000 }), /network unavailable/);
  assert.equal(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
  f.fail = false;
  await assert.rejects(refreshIntake({ ...f.options, now: NOW + 2 * 86400000 }), /24 hours/);
  assert.equal(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
  f.text = material('2026-11-17 08:30:00'); f.revision = 'b'.repeat(40);
  const refreshed = await refreshIntake({ ...f.options, now: NOW + 2 * 86400000 });
  assert.equal(refreshed.status, 'ready');
  assert.equal(refreshed.intakeReceipt.revision, f.revision);
  assert.equal(refreshed.intakeReceipt.collectedAt, '2026-11-17T00:30:00.000Z');
  assert.notEqual(await readFile(join(f.workDirectory, snapshotName), 'utf8'), before);
  assert.equal(f.calls.length, 7);
});

test('receipt or body tampering and cross-site operation reuse cannot replace the pinned material', async t => {
  const f = await fixture(t); await refreshIntake(f.options);
  const path = join(f.workDirectory, snapshotName), before = await readFile(path, 'utf8');
  const value = JSON.parse(before); value.text += '\nchanged';
  await writeFile(path, JSON.stringify(value));
  await assert.rejects(readIntakeSnapshot(f.workDirectory, { root: f.root, now: NOW }), /does not match/);
  await writeFile(path, before);
  await assert.rejects(readIntakeSnapshot(f.workDirectory, { root: join(f.root, 'other'), now: NOW }), /another site/);
  await writeFile(join(f.workDirectory, 'operation.json'), JSON.stringify({ root: join(f.root, 'other'), plan: {} }));
  await assert.rejects(refreshIntake(f.options), /another site/);
  assert.equal(await readFile(path, 'utf8'), before);
});

test('working snapshots cannot be symlinks or live inside the source repository', async t => {
  const f = await fixture(t);
  await assert.rejects(refreshIntake({ ...f.options, workDirectory: join(f.root, 'work') }), /outside the repository/);
  await mkdir(f.workDirectory);
  const target = join(f.workDirectory, 'unrelated.json');
  await writeFile(target, '{}');
  await symlink(target, join(f.workDirectory, snapshotName));
  await assert.rejects(refreshIntake(f.options), /regular bounded/);
  assert.equal(await readFile(target, 'utf8'), '{}');
  assert.equal(f.calls.length, 0);
});

test('collection time is read from the material block and never inferred from the current clock', () => {
  assert.equal(collectedAt(material()), '2026-11-15T00:30:00.000Z');
  assert.throws(() => collectedAt('采集时间：2026-11-15 08:30:00（北京时间）\n<!-- samples:start -->\n没有日期\n<!-- samples:end -->'));
});
