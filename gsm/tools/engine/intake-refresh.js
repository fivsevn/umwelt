// Freeze the GSM-owned daily material in the external operation directory.
// Collection is a separate local/Actions command; preparing never dispatches another project.
import { readFile, writeFile, rename, rm, lstat, mkdir, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { socialRoot } from './content.js';
import { externalFolder } from './profiles.js';
import { defaultWorkDirectory } from './operations.js';
import { parseSampleDocuments } from './samples.js';
import { validateIntakeReceipt } from './case-adaptation.js';

export const intakeRepository = 'fivsevn/umwelt';
export const intakeDocument = 'gsm/environment/sources-daily-opinions.md';
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
export async function refreshIntake({ root = socialRoot, workDirectory, now = Date.now() } = {}) {
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
      // fully checked local document succeeds; every failure preserves these bytes.
    }
    const folder = join(root, 'environment'), path = join(folder, 'sources-daily-opinions.md');
    const folderStat = await lstat(folder), sourceStat = await lstat(path);
    if (!folderStat.isDirectory() || folderStat.isSymbolicLink() || !sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.size > 2_000_000) fail('expected a regular bounded local material document');
    const text = await readFile(path, 'utf8');
    if (text.includes('\0')) fail('invalid material document');
    // A content-addressed revision also works in isolated exports without a .git folder.
    const revision = blob(text);
    const receipt = { repository: intakeRepository, path: intakeDocument, revision, documentSha: blob(text), documentDigest: hash(text),
      collectedAt: collectedAt(text), fetchedAt: new Date(now).toISOString() };
    validateIntakeReceipt(receipt, { documentText: text, now });
    const entries = parseSampleDocuments([{ path: 'environment/sources-daily-opinions.md', text }]);
    if (entries.length < 2) fail('the current daily material needs at least two usable cases; no substitute is invented');
    await saveJSON(join(work, snapshotName), { version: 1, root, receipt, text });
    return { status: 'ready', workDirectory: work, intakeReceipt: receipt };
  } finally { await rm(lock, { recursive: true, force: true }); }
}
