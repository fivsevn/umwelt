import { lstat, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);

async function optionalRecord(path) {
  let stat;
  try { stat = await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 50_000_000) return null;
  const text = await readFile(path, 'utf8');
  try { return { text, value: JSON.parse(text) }; }
  catch { return null; }
}

// Called under the operation lock, only after local and online verification.
// Ownership comes from the saved operation identity, never the file's age.
// Checkpoints, media, unknown files and records of other operations stay intact.
export async function cleanupCompletedWork(directory, operation) {
  const documentDigest = operation.plan.caseAdaptation?.intakeReceipt?.documentDigest;
  const owners = {
    'briefs.json': value => Array.isArray(value) && value.length > 0 && value.every(brief =>
      plain(brief) && brief.id === operation.id && typeof brief.postId === 'string' &&
      brief.draft?.id === brief.postId && (brief.writer === null || plain(brief.writer))),
    'daily-material.json': value => plain(value) && value.version === 1 &&
      value.root === operation.root && typeof documentDigest === 'string' && value.receipt?.documentDigest === documentDigest
  };
  const removed = [];
  for (const [name, owns] of Object.entries(owners)) {
    const path = join(directory, name), record = await optionalRecord(path);
    if (!record || !owns(record.value)) continue;
    const current = await optionalRecord(path);
    if (!current || current.text !== record.text) continue;
    await rm(path, { force: true });
    removed.push(name);
  }
  return removed;
}
