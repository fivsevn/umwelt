import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createCasePlan, validateCasePlan, validateCasePosts, validateCasePolicy, validateIntakeReceipt, drawCaseCount, caseForPost } from '../tools/engine/case-adaptation.js';
import { drawRootBudget } from '../tools/engine/lottery.js';
import { caseFingerprint } from '../tools/engine/case-usage.js';

const NOW = Date.parse('2026-11-15T01:00:00Z');
const hash = (text, kind = 'sha256') => createHash(kind).update(text).digest('hex');
const material = (count = 6) => ({ path: 'environment/sources-daily-opinions.md', text:
  '# 每日素材\n<!-- samples:start -->\n采集时间：2026-11-15 08:30:00（北京时间）\n\n' +
  Array.from({ length: count }, (_, index) => `### 讨论 ${index}\n1. **发言者 1**：另一段实际情况 ${index}。\n2. **发言者 2**：哦。`).join('\n\n') + '\n<!-- samples:end -->\n' });
const receipt = text => ({ repository: 'fivsevn/y29', path: 'lucifer0/environment/sources-daily-opinions.md', revision: 'a'.repeat(40),
  documentSha: hash('blob ' + Buffer.byteLength(text) + '\0' + text, 'sha1'), documentDigest: hash(text),
  collectedAt: '2026-11-15T00:30:00.000Z', fetchedAt: new Date(NOW).toISOString() });
const basePlan = (budget = 1, seed = 'gsm-cases-stable') => ({ seed, budget,
  timeWindow: { start: new Date(NOW - 86400000).toISOString(), end: new Date(NOW).toISOString() } });
function create(budget = 1, count = 1, source = material()) {
  const plan = basePlan(budget), options = { operationId: 'gsm-synthetic', plan, documents: [source], intakeReceipt: receipt(source.text), now: NOW, count };
  const caseAdaptation = createCasePlan(options);
  const roots = caseAdaptation.rootOrder.map((id, index) => ({ id, replyTo: null, createdAt: new Date(NOW - 10000 + index * 1000).toISOString() }));
  return { options, plan: { ...plan, caseAdaptation }, roots };
}

test('all four GSM case/original combinations validate, including the formerly impossible single case', () => {
  for (const budget of [1, 2]) for (const count of [1, 2]) {
    const { plan, roots } = create(budget, count);
    assert.equal(plan.caseAdaptation.count, count);
    assert.equal(roots.length, count + budget);
    validateCasePlan(plan.caseAdaptation, { operationId: 'gsm-synthetic', plan });
    validateCasePosts(plan, roots, { complete: true });
  }
});

test('case and original counts are independent stable 1–2 draws and keep the reference proportions', () => {
  const policy = JSON.parse(readFileSync(new URL('../publication.json', import.meta.url), 'utf8'));
  validateCasePolicy(policy.caseAdaptation);
  assert.deepEqual(policy.caseAdaptation, { min: 1, max: 2 });
  const combinations = new Set();
  for (let index = 0; index < 1024; index++) {
    const seed = 'gsm-independent-counts-' + index;
    const cases = drawCaseCount(seed, policy.caseAdaptation), originals = drawRootBudget(seed, policy.lottery);
    assert.equal(drawCaseCount(seed, policy.caseAdaptation), cases);
    combinations.add(cases + '/' + originals);
  }
  assert.deepEqual([...combinations].sort(), ['1/1', '1/2', '2/1', '2/2']);
  for (const count of [0, 3, 6, -1, 1.5]) assert.throws(() => validateCasePolicy({ count }));
  for (const range of [{ min: 0, max: 2 }, { min: 1, max: 3 }, { min: 1, max: 2, quota: 4 }]) assert.throws(() => validateCasePolicy(range));
});

test('publication requires both original and case roots and their frozen mixed order', () => {
  const { plan, roots } = create(2, 2);
  for (const missing of roots) assert.throws(() => validateCasePosts(plan, roots.filter(post => post.id !== missing.id), { complete: true }));
  const swapped = [...roots].reverse().map((post, index) => ({ ...post, createdAt: new Date(NOW - 10000 + index * 1000).toISOString() }));
  assert.throws(() => validateCasePosts(plan, swapped, { complete: true }));
  assert.throws(() => validateCasePosts(plan, [...roots, { id: 'extra-original', replyTo: null, createdAt: new Date(NOW).toISOString() }], { complete: true }));
  const caseId = plan.caseAdaptation.items[0].postId;
  assert.throws(() => validateCasePosts(plan, roots.map(post => post.id === caseId ? { ...post, replyTo: 'other-root' } : post)));
});

test('case mapping and opaque identifiers freeze exact material and cannot silently switch source or redraw', () => {
  const { options, plan } = create(1, 2);
  assert.deepEqual(createCasePlan(options), plan.caseAdaptation);
  for (const mutation of [
    value => { value.items[0].sample.text += '\n替换文字。'; },
    value => { value.items[0].postId = 'gsm-synthetic-replacement'; },
    value => { value.items[0].sourcePath = 'environment/sources-selected-cases.md'; },
    value => { value.rootOrder.reverse(); },
    value => { value.count = 1; }
  ]) {
    const changed = structuredClone(plan.caseAdaptation); mutation(changed);
    assert.throws(() => validateCasePlan(changed, { operationId: 'gsm-synthetic', plan }));
  }
});

test('fresh exact daily material is required and insufficient cases are never invented or substituted', () => {
  const { options } = create();
  validateIntakeReceipt(options.intakeReceipt, { documentText: options.documents[0].text, now: NOW });
  for (const patch of [{ repository: 'fivsevn/umwelt' }, { path: 'different.md' }, { revision: 'main' },
    { documentSha: 'b'.repeat(40) }, { documentDigest: 'b'.repeat(64) },
    { collectedAt: '2026-11-13T00:30:00Z' }, { fetchedAt: '2026-11-16T00:30:00Z' }]) {
    assert.throws(() => validateIntakeReceipt({ ...options.intakeReceipt, ...patch }, { documentText: options.documents[0].text, now: NOW }));
  }
  assert.throws(() => validateIntakeReceipt(options.intakeReceipt, { documentText: options.documents[0].text + '\n', now: NOW }));
  assert.throws(() => create(1, 2, material(1)), /distinct usable cases/);
  assert.throws(() => createCasePlan({ ...options, intakeReceipt: undefined }), /daily material/);
});

test('local recent-use hashes exclude consumed cases without using or modifying the human site ledger', () => {
  const { options, plan } = create(1, 2);
  const used = plan.caseAdaptation.items.map(item => ({ fingerprint: caseFingerprint(item.sample), usedAt: new Date(NOW).toISOString() }));
  const next = createCasePlan({ ...options, used });
  assert.ok(next.items.every(item => !used.some(previous => previous.fingerprint === caseFingerprint(item.sample))));
  const all = [...used, ...next.items.map(item => ({ fingerprint: caseFingerprint(item.sample) }))];
  const third = createCasePlan({ ...options, used: all });
  assert.throws(() => createCasePlan({ ...options, used: [...all, ...third.items.map(item => ({ fingerprint: caseFingerprint(item.sample) }))] }), /distinct usable cases/);
});

test('case replies retain ancestry and do not turn nested replies into new independent cases', () => {
  const { plan, roots } = create(1, 1), root = roots.find(post => post.id === plan.caseAdaptation.items[0].postId);
  const reply = { id: 'gsm-synthetic-reply', replyTo: root.id }, nested = { id: 'gsm-synthetic-nested', replyTo: reply.id };
  const posts = [...roots, reply, nested];
  assert.equal(caseForPost(plan, nested, posts), plan.caseAdaptation.items[0]);
  assert.equal(caseForPost(plan, roots.find(post => post.id !== root.id), posts), null);
  validateCasePosts(plan, posts, { complete: true });
});
