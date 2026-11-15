import { readFile, writeFile, rename, rm, appendFile, lstat, realpath } from 'node:fs/promises';
import { dirname, basename, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { caseFingerprint, readCaseUsage } from './case-usage.js';
import { parseSampleDocuments } from './samples.js';
import { geckoSources, parseGeckoTopics, parseGeckoDiscussion, reptileCandidate, excludedHumanOrClinical } from './gecko-sources.js';
import { plainText, anonymizeDiscussion, markdownText } from './gecko-anonymize.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const REPOSITORY = resolve(ROOT, '..');
const DEFAULT_DOCUMENT = resolve(ROOT, 'environment/sources-daily-opinions.md');
const START = '<!-- samples:start -->', END = '<!-- samples:end -->';
export const collectionLimits = Object.freeze({ threadsPerSource: 5, detailRequests: 8, repliesPerThread: 5,
  rootCharacters: 1200, replyCharacters: 400, threadCharacters: 2200, responseBytes: 2_000_000,
  timeoutMs: 12_000, maxFragments: 8, maxRequests: 24, durationMs: 120_000, concurrency: 3 });
const fail = message => { throw Error('Gecko collection: ' + message); };
const chars = text => [...text].length;

async function concurrent(items, count, action) {
  const results = new Array(items.length); let index = 0;
  await Promise.all(Array.from({ length: Math.min(count, items.length) }, async () => {
    while (index < items.length) { const position = index++; results[position] = await action(items[position]); }
  }));
  return results;
}

async function requestPublic(url, { fetchImpl, stats, limits, format }) {
  stats.requests++;
  try {
    const response = await fetchImpl(url, { headers: { Accept: format === 'rss' ? 'application/rss+xml, application/xml, text/xml' : 'application/json',
      'User-Agent': 'GSM-gecko-intake/1.0 (+https://github.com/fivsevn/umwelt)' }, redirect: 'error', signal: AbortSignal.timeout(limits.timeoutMs) });
    if (!response.ok) { stats.errors.push('HTTP ' + response.status); throw Error('HTTP failure'); }
    if (Number(response.headers.get('content-length')) > limits.responseBytes) throw Error('response too large');
    let text = '', bytes = 0; const decoder = new TextDecoder();
    for await (const chunk of response.body) {
      bytes += chunk.byteLength; if (bytes > limits.responseBytes) throw Error('response too large');
      text += decoder.decode(chunk, { stream: true });
    }
    text += decoder.decode();
    const payload = format === 'rss' ? text : JSON.parse(text);
    stats.succeeded++;
    return payload;
  } catch (error) {
    stats.failed++; if (stats.errors.length < 4 && !stats.errors.length) stats.errors.push(error.name === 'TimeoutError' ? 'request timeout' : 'unavailable or invalid public response');
    return null;
  }
}

function renderFragment(fragment, number, sourceKind) {
  const scope = sourceKind === 'discourse-rss' ? '公开 RSS 中实际取得的根帖及回复短节选，RSS 未给出的楼中楼父关系保持未知。' : '公开标签原帖及可见回复短节选，仅包含本次公开接口实际返回的内容。';
  return [`### 讨论 ${number}`, `近七天爬宠主题。${scope}已自动去除明显标识，未作语义转述；人类观察者的判断不是守宫的内心事实，图片标记不代表看过画面。`,
    fragment.messages.map((message, i) => `${i + 1}. **${message.speaker}**${message.replyTo ? `（回复第 ${message.replyTo} 条）` : message.missingTarget ? '（引用未收录发言）' : ''}：${markdownText(message.text)}`).join('\n\n')].join('\n\n');
}

export async function collectGeckoOpinions({ fetchImpl = globalThis.fetch, now = Date.now(), limits = collectionLimits,
  seed = randomUUID(), used = [], sources = geckoSources, requiredCases = 2 } = {}) {
  if (!Number.isFinite(now) || ![1, 2].includes(requiredCases)) fail('invalid collection time or required case count');
  limits = { ...collectionLimits, ...limits };
  for (const value of Object.values(limits)) if (!Number.isSafeInteger(value) || value < 1) fail('invalid bounded collection limits');
  const observations = sources.map(source => ({ name: source.name, requests: 0, succeeded: 0, failed: 0, topicsSeen: 0,
    discussionsRead: 0, fragments: 0, messages: 0, excluded: 0, errors: [] }));
  const deadline = Date.now() + limits.durationMs; let requests = 0;
  const request = (url, source, stats) => {
    const remaining = deadline - Date.now();
    if (requests >= limits.maxRequests || remaining <= 0) return null;
    requests++;
    return requestPublic(url, { fetchImpl, stats, limits: { ...limits, timeoutMs: Math.min(limits.timeoutMs, remaining) },
      format: source.kind === 'discourse-rss' ? 'rss' : 'json' });
  };
  const rank = value => createHash('sha256').update(seed + ':' + value).digest('hex');
  const queues = await concurrent(sources.map((source, i) => ({ source, stats: observations[i] })), limits.concurrency, async ({ source, stats }) => {
    const found = new Map();
    for (const url of source.lists) {
      const payload = await request(url, source, stats); if (payload === null) continue;
      try { for (const topic of parseGeckoTopics(source, payload, plainText)) found.set(topic.id, topic); }
      catch { stats.errors.push('unrecognized public topic shape'); }
    }
    stats.topicsSeen = found.size;
    const eligible = [...found.values()].filter(topic => Number.isFinite(topic.created) && topic.created <= now &&
      now - topic.created < 7 * 86400000 && topic.text && chars(topic.text) <= limits.rootCharacters)
      .sort((a, b) => rank(source.key + ':' + a.id).localeCompare(rank(source.key + ':' + b.id))).slice(0, limits.detailRequests);
    stats.excluded += found.size - eligible.length;
    return { source, stats, eligible };
  });
  queues.sort((a, b) => rank(a.source.key).localeCompare(rank(b.source.key)));
  const fragments = [], seen = new Set(used.map(item => item.fingerprint));
  while (fragments.length < limits.maxFragments && requests < limits.maxRequests && Date.now() < deadline) {
    const active = queues.filter(q => q.eligible.length && q.stats.fragments < limits.threadsPerSource).slice(0, limits.maxFragments - fragments.length);
    if (!active.length) break;
    const results = await concurrent(active, limits.concurrency, async ({ source, stats, eligible }) => {
      const topic = eligible.shift(), payload = await request(source.detail(topic.id, topic), source, stats);
      if (payload === null) return null;
      try {
        const discussion = parseGeckoDiscussion(source, topic, payload, plainText); stats.discussionsRead++;
        if (!Number.isFinite(discussion.root.created) || discussion.root.created > now || now - discussion.root.created >= 7 * 86400000 ||
          !reptileCandidate(discussion.root.text, topic.category || topic.title || '') ||
          [discussion.root, ...discussion.replies].some(message => excludedHumanOrClinical(message.text))) { stats.excluded++; return null; }
        const fragment = anonymizeDiscussion(discussion, limits);
        if (!fragment || fragment.messages[0].text.replace(/\[[^\]]*\]/g, '').replace(/[\s\p{P}\p{S}]/gu, '').length < 8) { stats.excluded++; return null; }
        const markdown = renderFragment(fragment, fragments.length + 1, source.kind);
        const entry = parseSampleDocuments([{ path: 'environment/sources-daily-opinions.md', text: `${START}\n${markdown}\n${END}` }])[0];
        return entry ? { fragment, stats, source, fingerprint: caseFingerprint(entry.sample) } : null;
      } catch { stats.excluded++; return null; }
    });
    for (const result of results) {
      if (!result || seen.has(result.fingerprint)) continue;
      seen.add(result.fingerprint); fragments.push(result); result.stats.fragments++; result.stats.messages += result.fragment.messages.length;
    }
  }
  const markdown = [`采集时间：${new Date(now + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ')}（北京时间）`,
    ...fragments.map(({ fragment, source }, i) => renderFragment(fragment, i + 1, source.kind))].join('\n\n') + '\n';
  return { markdown, collectedAt: new Date(now).toISOString(), sources: observations, fragments: fragments.length,
    messages: fragments.reduce((n, f) => n + f.fragment.messages.length, 0), ready: fragments.length >= requiredCases,
    requiredCases, allFailed: observations.every(s => s.succeeded === 0), exitCode: fragments.length >= requiredCases ? 0 : 2 };
}

export function replaceCurrentSamples(document, markdown) {
  if (typeof document !== 'string' || document.split(START).length !== 2 || document.split(END).length !== 2 || document.indexOf(START) > document.indexOf(END)) fail('expected exactly one ordered samples marker pair');
  return document.slice(0, document.indexOf(START) + START.length) + '\n\n' + markdown.trim() + '\n\n' + document.slice(document.indexOf(END));
}

async function regularText(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2_000_000) fail('expected a regular bounded material file');
  return readFile(path, 'utf8');
}
async function outputTarget(documentPath, outputPath) {
  if ([documentPath, outputPath].filter(Boolean).some(path => basename(path).toLowerCase() === 'sources-selected-cases.md')) fail('selected cases are not a collector target');
  await regularText(documentPath);
  if (outputPath === undefined) return resolve(documentPath);
  if (!isAbsolute(outputPath)) fail('preview output must be an absolute path outside the repository');
  const parent = dirname(outputPath), stat = await lstat(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('preview parent must be a regular directory');
  const output = resolve(await realpath(parent), basename(outputPath)), rel = relative(await realpath(REPOSITORY), output);
  if (!rel || !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../')) fail('preview output must stay outside the repository');
  try { await regularText(output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (output === await realpath(documentPath)) fail('preview output cannot overwrite the input');
  return output;
}

export async function updateGeckoOpinionDocument({ documentPath = DEFAULT_DOCUMENT, outputPath, ...options } = {}) {
  const target = await outputTarget(documentPath, outputPath);
  replaceCurrentSamples(await regularText(documentPath), '');
  const used = options.used ?? await readCaseUsage(ROOT);
  const result = await collectGeckoOpinions({ ...options, used });
  // Insufficient/unavailable sources do not replace a valid batch or manufacture a fresh date.
  if (!result.ready) return { ...result, written: false };
  const updated = replaceCurrentSamples(await regularText(documentPath), result.markdown);
  parseSampleDocuments([{ path: 'environment/sources-daily-opinions.md', text: updated }]);
  const temp = resolve(dirname(target), '.gecko-opinions-' + randomUUID() + '.tmp');
  try { await writeFile(temp, updated, { flag: 'wx', mode: 0o600 }); await rename(temp, target); }
  finally { await rm(temp, { force: true }); }
  return { ...result, written: true };
}

export function collectionSummary(result) {
  return ['## GSM 守宫素材采集', '', `实际采集：${result.collectedAt}；${result.fragments}段、${result.messages}条发言。`,
    result.ready ? '新材料已验证，可供独立选择1–2条案例。' : '材料不足，原文件和原采集时间保持原样；不可据此启动新轮。', '',
    '| 来源 | 成功 / 失败请求 | 候选 | 读取原串 | 采用 | 限制 |', '| --- | --- | --- | --- | --- | --- |',
    ...result.sources.map(s => `| ${s.name} | ${s.succeeded} / ${s.failed} | ${s.topicsSeen} | ${s.discussionsRead} | ${s.fragments} | ${[...new Set(s.errors)].join('；') || '仅公开返回范围'} |`), '',
    '只采集公开原文短片段；未读取的图片、未返回的楼层和未知父关系不计为已读。不代替逐条守宫化及独立审读。', ''].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--output' || !args[1])) fail('Usage: collect-gecko-opinions.js [--output /outside/preview.md]');
    const result = await updateGeckoOpinionDocument(args.length ? { outputPath: args[1] } : {});
    const summary = collectionSummary(result); console.error(summary);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
    process.exitCode = result.exitCode;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
