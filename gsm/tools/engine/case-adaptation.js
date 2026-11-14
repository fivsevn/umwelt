import { caseFingerprint } from './case-usage.js';
import { createHash } from 'node:crypto';
import { parseSampleDocuments, selectSamples, sampleDocumentPaths } from './samples.js';

const DAY = 86400000, SOURCE = sampleDocumentPaths[0];
const validCount = count => count === 1 || count === 2;
const countWord = count => String(count);
const fail = message => { throw new Error('Case adaptation: ' + message); };
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const keys = (value, allowed, label) => {
  if (!plain(value) || Object.keys(value).some(key => !allowed.includes(key)) || allowed.some(key => !Object.hasOwn(value, key))) fail('invalid ' + label);
};
const sha = (text, algorithm = 'sha256') => createHash(algorithm).update(text).digest('hex');
const validDate = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));

export function validateCasePolicy(policy) {
  if (policy === undefined) return;
  if (Object.hasOwn(policy, 'count')) {
    keys(policy, ['count'], 'policy');
    if (!validCount(policy.count)) fail('policy count must be one or two');
  } else {
    keys(policy, ['min', 'max'], 'policy');
    if (policy.min !== 1 || policy.max !== 2) fail('GSM case range must be 1–2');
  }
}
export function drawCaseCount(seed, policy = { min: 1, max: 2 }) {
  validateCasePolicy(policy);
  return policy.count ?? 1 + (parseInt(sha(seed + '\0gsm-case-count').slice(0, 8), 16) % 2);
}
export function validateIntakeReceipt(receipt, { documentText, now } = {}) {
  keys(receipt, ['repository', 'path', 'revision', 'documentSha', 'documentDigest', 'collectedAt', 'fetchedAt'], 'intake receipt');
  if (receipt.repository !== 'fivsevn/y29' || receipt.path !== 'lucifer0/environment/sources-daily-opinions.md' ||
    !/^[a-f0-9]{40}$/.test(receipt.revision) || !/^[a-f0-9]{40}$/.test(receipt.documentSha) ||
    !/^[a-f0-9]{64}$/.test(receipt.documentDigest) || !validDate(receipt.collectedAt) || !validDate(receipt.fetchedAt) ||
    Date.parse(receipt.collectedAt) > Date.parse(receipt.fetchedAt) + 300000) fail('invalid intake receipt');
  if (now !== undefined && (Date.parse(receipt.fetchedAt) > now + 300000 || Date.parse(receipt.collectedAt) > now + 300000 ||
    now - Date.parse(receipt.collectedAt) > DAY)) fail('a daily material collected within 24 hours is required before a new update');
  if (documentText !== undefined && (typeof documentText !== 'string' || sha(documentText) !== receipt.documentDigest ||
    sha('blob ' + Buffer.byteLength(documentText) + '\0' + documentText, 'sha1') !== receipt.documentSha)) fail('the current material does not match the intake receipt');
  return receipt;
}

function casePostId(operationId, seed, sampleId) {
  return operationId + '-' + sha(seed + '\0case-root\0' + sampleId).slice(0, 12);
}
function mixedRootOrder(operationId, seed, originalCount, caseIds) {
  const originals = Array.from({ length: originalCount }, (_, index) => ({ id: operationId + '-' + sha(seed + '\0root-slot\0' + index).slice(0, 12), position: (index + 1) / (originalCount + 1) }));
  return [...originals, ...caseIds.map((id, index) => ({ id, position: (index + 0.5) / caseIds.length }))]
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).map(item => item.id);
}

// Legacy callers omit count; new operations pass the current publication policy.
export function createCasePlan({ operationId, plan, documents, intakeReceipt, now, used = [], count = drawCaseCount(plan.seed) }) {
  validateCasePolicy({ count });
  if (!intakeReceipt) fail('read the current daily material before starting a new update');
  const document = documents.find(document => document.path === SOURCE);
  if (!document) fail('the refreshed daily material document is missing');
  validateIntakeReceipt(intakeReceipt, { documentText: document.text, now });
  const seen = new Set(used.map(item => item.fingerprint));
  const available = parseSampleDocuments([document]).filter(entry => {
    const fingerprint = caseFingerprint(entry.sample);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
  const selected = selectSamples(available, { seed: plan.seed + ':case-adaptation', limit: count });
  if (selected.length !== count) fail('the refreshed daily material needs ' + countWord(count) + ' distinct usable cases; do not invent or substitute selected cases');
  const items = selected.map(({ path, sample }) => ({ postId: casePostId(operationId, plan.seed, sample.id), sourcePath: path, sample: structuredClone(sample) }));
  return { count, intakeReceipt: structuredClone(intakeReceipt), items,
    rootOrder: mixedRootOrder(operationId, plan.seed, plan.budget, items.map(item => item.postId)) };
}

export function validateCasePlan(value, { operationId, plan }) {
  if (value === undefined) return;
  keys(value, ['count', 'intakeReceipt', 'items', 'rootOrder'], 'saved plan');
  if (!validCount(value.count) || !Array.isArray(value.items) || value.items.length !== value.count || !plan.timeWindow) fail('invalid saved cases');
  validateIntakeReceipt(value.intakeReceipt, { now: Date.parse(plan.timeWindow.end) });
  const ids = new Set();
  for (const item of value.items) {
    keys(item, ['postId', 'sourcePath', 'sample'], 'saved case');
    if (item.sourcePath !== SOURCE || !plain(item.sample) || Object.keys(item.sample).some(key => !['id', 'title', 'text', 'context'].includes(key)) || typeof item.sample.text !== 'string' ||
      item.sample.context !== undefined && typeof item.sample.context !== 'string') fail('invalid saved snapshot');
    const text = '<!-- samples:start -->\n' + (item.sample.context ? item.sample.context + '\n\n' : '') + item.sample.text + '\n<!-- samples:end -->';
    const parsed = parseSampleDocuments([{ path: SOURCE, text }]);
    if (parsed.length !== 1 || ['id', 'title', 'text', 'context'].some(key => parsed[0].sample[key] !== item.sample[key]) || ids.has(item.sample.id) ||
      item.postId !== casePostId(operationId, plan.seed, item.sample.id)) fail('the saved case snapshot or mapping was changed');
    ids.add(item.sample.id);
  }
  const expected = mixedRootOrder(operationId, plan.seed, plan.budget, value.items.map(item => item.postId));
  if (JSON.stringify(value.rootOrder) !== JSON.stringify(expected)) fail('the saved mixed root order was changed');
}

export const caseRootIds = plan => new Set(plan.caseAdaptation?.items.map(item => item.postId) || []);
export const caseRoot = (plan, id) => plan.caseAdaptation?.items.find(item => item.postId === id) || null;
export function caseForPost(plan, post, posts) {
  const byId = posts instanceof Map ? posts : new Map(posts.map(item => [item.id, item]));
  const seen = new Set();
  while (post) {
    const item = caseRoot(plan, post.id);
    if (item) return item;
    if (post.replyTo === null || seen.has(post.id)) return null;
    seen.add(post.id); post = byId.get(post.replyTo);
  }
  return null;
}

export function validateCasePosts(plan, posts, { complete = false } = {}) {
  if (!plan.caseAdaptation) return;
  const count = plan.caseAdaptation.count;
  const ids = caseRootIds(plan), cases = posts.filter(post => ids.has(post.id));
  if (cases.some(post => post.replyTo !== null)) fail('reserved case IDs must remain root posts');
  if (!complete) return;
  if (cases.length !== count || new Set(cases.map(post => post.id)).size !== count) fail('all ' + countWord(count) + ' fixed case roots are required in this update');
  const roots = posts.filter(post => post.replyTo === null).map((post, index) => ({ post, index }))
    .sort((a, b) => Date.parse(a.post.createdAt) - Date.parse(b.post.createdAt) || a.index - b.index).map(item => item.post);
  if (roots.length !== count + plan.budget || roots.some((post, index) => post.id !== plan.caseAdaptation.rootOrder[index])) fail('complete the saved 1–2 original roots and interleave them in the saved root order');
  const positions = roots.map((post, index) => ids.has(post.id) ? index : -1).filter(index => index >= 0);
  if (count > 1 && roots.length > count && positions.at(-1) - positions[0] === count - 1) fail('interleave the case roots with original roots instead of publishing a separate block');
}

export function casePlanSummary(plan) {
  return plan.caseAdaptation ? { count: plan.caseAdaptation.count, postIds: plan.caseAdaptation.items.map(item => item.postId),
    rootOrder: [...plan.caseAdaptation.rootOrder], intakeReceipt: structuredClone(plan.caseAdaptation.intakeReceipt) } : undefined;
}
