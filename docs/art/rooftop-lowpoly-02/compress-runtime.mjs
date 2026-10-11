import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

// A transport derivative only. The native export and its manifest stay intact.
export async function compressRuntime(directory = new URL('../../../rooftop/assets/background/', import.meta.url)) {
  const { BACKGROUND } = await import(new URL('empty-rooftop.mjs', directory));
  const raw = await readFile(new URL(BACKGROUND.binary, directory));
  const sha = value => createHash('sha256').update(value).digest('hex');
  if (raw.byteLength !== BACKGROUND.bytes || sha(raw) !== BACKGROUND.sha256)
    throw Error('Native background export does not match its manifest');
  const encoded = gzipSync(raw, { level: 9, mtime: 0 });
  if (!gunzipSync(encoded).equals(raw)) throw Error('Background compression changed the decoded model');
  const record = {
    format: 'gzip-v1', file: `${BACKGROUND.binary}.gz`, sha: sha(encoded),
    decodedSha: BACKGROUND.sha256, bytes: encoded.byteLength, decodedBytes: raw.byteLength,
  };
  await writeFile(new URL(record.file, directory), encoded);
  await writeFile(new URL('empty-rooftop-compression.mjs', directory),
    `export const BACKGROUND_COMPRESSION = Object.freeze(${JSON.stringify(record, null, 2)});\n`);
  return record;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await compressRuntime(), null, 2));
