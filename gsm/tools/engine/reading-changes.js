import { createHash } from 'node:crypto';

const sha = text => createHash('sha256').update(text).digest('hex');
const revisionOf = manifest => sha(JSON.stringify(manifest));
const lineCount = text => text.split('\n').length;

// Keep reading.md byte-compatible with existing archives. Section positions
// come from the source documents, never from headings inside quoted material.
export function readingPacket(operationId, overview, documents) {
  const sections = [], files = [], positions = new Map();
  let start = lineCount(overview);
  for (const { path, text } of documents) {
    const section = '---\n\n## 原文路径：' + path + '\n\n' + text;
    const end = start + lineCount(section) - 1;
    positions.set(path, { path, startLine: start + 2, endLine: end });
    files.push([path, sha(text)]);
    sections.push(section);
    start = end + 2;
  }
  const text = overview + sections.join('\n\n') + '\n';
  const manifest = { operationId, overviewHash: sha(overview), files };
  return { text, manifest, revision: revisionOf(manifest), positions, overviewEnd: lineCount(overview.trimEnd()) };
}

// The index is private, reconstructible metadata. A legacy archive, lost
// index, or unknown receipt always has the complete reading packet available.
export function readingComparison(packet, savedIndex, readSince) {
  let index;
  try { index = JSON.parse(savedIndex); } catch { /* Old or interrupted work directory. */ }
  if (index?.version !== 1 || index.operationId !== packet.manifest.operationId ||
      !index.snapshots || typeof index.snapshots !== 'object' || Array.isArray(index.snapshots)) {
    index = { version: 1, operationId: packet.manifest.operationId, snapshots: {} };
  }
  const base = index.snapshots[readSince];
  const reading = { mode: 'full', revision: packet.revision };
  if (readSince === packet.revision) Object.assign(reading, { mode: 'unchanged', from: readSince });
  else if (base?.operationId === packet.manifest.operationId && Array.isArray(base.files) && revisionOf(base) === readSince) {
    const oldFiles = new Map(base.files), added = [], modified = [], retained = [];
    for (const [path, digest] of packet.manifest.files) {
      if (!oldFiles.has(path)) added.push(packet.positions.get(path));
      else {
        retained.push(path);
        if (oldFiles.get(path) !== digest) modified.push(packet.positions.get(path));
      }
      oldFiles.delete(path);
    }
    const previousOrder = base.files.filter(([path]) => !oldFiles.has(path));
    if (previousOrder.every(([path], i) => path === retained[i])) {
      Object.assign(reading, { mode: 'changes', from: readSince, added, modified, removed: [...oldFiles.keys()],
        overview: base.overviewHash === packet.manifest.overviewHash ? null : { startLine: 1, endLine: packet.overviewEnd } });
    }
  }
  index.snapshots[packet.revision] = packet.manifest;
  return { reading, index };
}
