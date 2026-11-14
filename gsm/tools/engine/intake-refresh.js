// The sole remote dependency: read the already-collected daily document.
// No credentials, workflow dispatch, repository mutation or crawler runs here.
import { readFile, writeFile, rename, rm, lstat, mkdir, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { socialRoot } from './content.js';
import { externalFolder } from './profiles.js';
import { defaultWorkDirectory } from './operations.js';
import { parseSampleDocuments } from './samples.js';
import { validateIntakeReceipt } from './case-adaptation.js';

export const intakeRepository = 'fivsevn/y29';
export const intakeDocument = 'lucifer0/environment/sources-daily-opinions.md';
export const snapshotName = 'daily-material.json';
const hash = text => createHash('sha256').update(text).digest('hex');
const blob = text => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0' + text).digest('hex');
const fail = message => { throw Error('Daily material: ' + message); };

async function readJSON(path, optional = false) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 5_000_000) fail('expected a regular bounded working file');
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
}
async function saveJSON(path, value) {
  const temp = path + '.' + randomUUID() + '.tmp';
  try {
    await readJSON(path, true);
    await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await rename(temp, path);
  } finally { await rm(temp, { force: true }); }
}
export function collectedAt(text) {
  const body = text.split('<!-- samples:start -->')[1]?.split('<!-- samples:end -->')[0];
  const match = body?.match(/^采集时间：[ \t]*(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})（北京时间）[ \t]*$/m);
  if (!match) fail('the daily document has no verifiable collection time');
  return new Date(match[1] + 'T' + match[2] + '+08:00').toISOString();
}
export async function readIntakeSnapshot(work, { root, now } = {}) {
  const value = await readJSON(join(work, snapshotName));
  if (value.version !== 1 || root && value.root !== resolve(root) || typeof value.text !== 'string') fail('snapshot belongs to another site or is invalid');
  validateIntakeReceipt(value.receipt, { documentText: value.text, now });
  if (collectedAt(value.text) !== value.receipt.collectedAt) fail('collection time does not match its receipt');
  parseSampleDocuments([{ path: 'environment/sources-daily-opinions.md', text: value.text }]);
  return value;
}
async function get(url, fetchImpl) {
  const response = await fetchImpl(url, { method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(30000),
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'GSM-daily-material-reader' } });
  if (!response.ok) fail('read failed (HTTP ' + response.status + '); existing work is retained');
  return response;
}
export async function refreshIntake({ root = socialRoot, workDirectory, now = Date.now(), fetchImpl = globalThis.fetch } = {}) {
  root = resolve(root);
  const stat = await lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('project root must be a regular directory');
  root = await realpath(root);
  const work = await externalFolder(workDirectory || defaultWorkDirectory(), root, true);
  const lock = join(work, '.intake-refresh.lock');
  try { await mkdir(lock); } catch (error) { if (error.code === 'EEXIST') fail('another preparation is active'); throw error; }
  try {
    const operation = await readJSON(join(work, 'operation.json'), true);
    if (operation) {
      if (operation.root !== root) fail('the operation belongs to another site');
      const saved = await readIntakeSnapshot(work, { root });
      if (JSON.stringify(saved.receipt) !== JSON.stringify(operation.plan?.caseAdaptation?.intakeReceipt)) fail('snapshot differs from the saved operation');
      return { status: 'resumed', workDirectory: work };
    }
    // A failed prepare can retry its current snapshot without refetching or redrawing.
    const prior = await readJSON(join(work, snapshotName), true);
    if (prior) {
      const saved = await readIntakeSnapshot(work, { root });
      if (now - Date.parse(saved.receipt.collectedAt) <= 86400000) {
        validateIntakeReceipt(saved.receipt, { now });
        return { status: 'ready', workDirectory: work, intakeReceipt: saved.receipt };
      }
      // No operation owns this stale snapshot. Replace only after a fresh,
      // fully checked GET succeeds; every failure leaves these bytes intact.
    }
    const url = `https://api.github.com/repos/${intakeRepository}/commits?path=${encodeURIComponent(intakeDocument)}&sha=main&per_page=1`;
    const commits = await (await get(url, fetchImpl)).json();
    const revision = commits?.[0]?.sha;
    if (!/^[a-f0-9]{40}$/.test(revision)) fail('cannot identify the current material revision');
    const response = await get(`https://raw.githubusercontent.com/${intakeRepository}/${revision}/${intakeDocument}`, fetchImpl);
    const text = await response.text();
    if (Buffer.byteLength(text) > 2_000_000 || text.includes('\0')) fail('invalid material document');
    const receipt = { repository: intakeRepository, path: intakeDocument, revision, documentSha: blob(text), documentDigest: hash(text),
      collectedAt: collectedAt(text), fetchedAt: new Date(now).toISOString() };
    validateIntakeReceipt(receipt, { documentText: text, now });
    const entries = parseSampleDocuments([{ path: 'environment/sources-daily-opinions.md', text }]);
    if (entries.length < 2) fail('the current daily material needs at least two usable cases; no substitute is invented');
    await saveJSON(join(work, snapshotName), { version: 1, root, receipt, text });
    return { status: 'ready', workDirectory: work, intakeReceipt: receipt };
  } finally { await rm(lock, { recursive: true, force: true }); }
}
