import { readFile, lstat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { buildFeed } from './content.js';
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object'
  ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
export function parsePublicFeed(text) {
  // Parse generated JSON literals; never execute remote JavaScript.
  const match = /^\/\/[^\n]*\nexport const profiles = ([\s\S]*);\nexport const posts = ([\s\S]*);\s*$/.exec(text);
  if (!match) throw Error('Invalid GSM public feed');
  const profiles = JSON.parse(match[1]), posts = JSON.parse(match[2]);
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles) || !Array.isArray(posts)) throw Error('Invalid GSM public data');
  return { profiles, posts };
}
export function publicIdentity(value) {
  if (Array.isArray(value)) return value.map(publicIdentity);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (['src', 'avatarImage'].includes(key) && typeof item === 'string' && item.startsWith('/gsm/')) {
      const url = new URL(item, 'https://umwelt.fivsevn.com');
      url.searchParams.delete('v');
      return [key, url.pathname + url.search + url.hash];
    }
    return [key, publicIdentity(item)];
  }));
}
export async function verifyLiveOperation({ root, operation, fetchImpl = globalThis.fetch, now = Date.now() }) {
  await buildFeed(root);
  const local = parsePublicFeed(await readFile(join(root, 'data/feed.mjs'), 'utf8'));
  const response = await fetchImpl('https://umwelt.fivsevn.com/gsm/data/feed.mjs?verify=' + operation.id + '-' + now,
    { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error('Online GSM feed is unavailable; keep the working record');
  const online = parsePublicFeed(await response.text());
  const media = new Set();
  for (const post of operation.posts) {
    const expected = local.posts.find(item => item.id === post.id), actual = online.posts.find(item => item.id === post.id);
    if (!expected || !actual || canonical(publicIdentity(actual)) !== canonical(publicIdentity(expected)) ||
      canonical(publicIdentity(online.profiles[post.author])) !== canonical(publicIdentity(local.profiles[post.author]))) throw Error('Online GSM content does not match; keep the working record');
    media.add(online.profiles[post.author].avatarImage);
    for (const blocks of Object.values(actual.blocks)) for (const block of blocks) if (block.type === 'image') media.add(block.src);
  }
  for (const src of media) {
    if (typeof src !== 'string' || !src.startsWith('/gsm/')) throw Error('Unexpected public media URL');
    const url = new URL(src, 'https://umwelt.fivsevn.com');
    const path = decodeURIComponent(url.pathname.slice('/gsm/'.length)), absolute = resolve(root, path);
    if (!path || relative(root, absolute).startsWith('..')) throw Error('Public media escaped GSM');
    let cursor = root;
    for (const part of path.split('/')) {
      cursor = join(cursor, part);
      if ((await lstat(cursor)).isSymbolicLink()) throw Error('Public media must use regular files');
    }
    const bytes = await readFile(absolute);
    url.searchParams.set('verify', createHash('sha256').update(bytes).digest('hex').slice(0, 16));
    const image = await fetchImpl(url.href, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!image.ok || !Buffer.from(await image.arrayBuffer()).equals(bytes)) throw Error('Online GSM media differs; keep the working record');
  }
  return { posts: operation.posts.length, media: media.size };
}
