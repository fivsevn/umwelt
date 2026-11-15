// Public reptile discussions only. No authenticated endpoint or cross-project runtime.
const tags = ['gecko', 'geckos', 'crestedgecko', 'leopardgecko', 'gargoylegecko', 'daygecko', 'mourninggecko', 'reptiles', 'lizard', 'vivarium', 'terrarium'];
const mastodon = (host, key, name, selected) => ({ name, key, kind: 'mastodon',
  lists: selected.map(tag => `https://${host}/api/v1/timelines/tag/${tag}?limit=20`),
  detail: id => `https://${host}/api/v1/statuses/${id}/context` });
export const geckoSources = Object.freeze([
  { name: 'MorphMarket 爬宠社区', key: 'morphmarket', kind: 'discourse-rss',
    lists: ['https://community.morphmarket.com/latest.rss'],
    detail: (id, topic) => `${topic?.url || `https://community.morphmarket.com/t/${id}`}.rss` },
  mastodon('mastodon.social', 'mastodon', 'Mastodon 守宫、物种与栖居标签', tags),
  { name: 'GeckoForums 守宫生活与住处', key: 'geckoforums', kind: 'xenforo', host: 'geckoforums.net',
    lists: ['https://geckoforums.net/forums/general-gecko-discussion.202/index.rss',
      'https://geckoforums.net/forums/gecko-enclosures.203/index.rss'],
    detail: (_id, topic) => topic.url },
  { name: 'ReptileForums 蜥蜴与栖居环境', key: 'reptileforums', kind: 'xenforo', host: 'www.reptileforums.co.uk',
    lists: ['https://www.reptileforums.co.uk/forums/lizards.12/index.rss',
      'https://www.reptileforums.co.uk/forums/habitat.18/index.rss'],
    detail: (_id, topic) => topic.url },
  mastodon('mastodon.online', 'mastodon-online', 'Mastodon Online 守宫与爬宠标签', ['gecko', 'crestedgecko', 'leopardgecko', 'reptiles']),
  { name: 'ChameleonForums 照片与住处', key: 'chameleonforums', kind: 'xenforo', host: 'www.chameleonforums.com',
    lists: ['https://www.chameleonforums.com/forums/general-photography.30/index.rss',
      'https://www.chameleonforums.com/forums/enclosures-and-supplies.14/index.rss'],
    detail: (_id, topic) => topic.url },
  mastodon('flipping.rocks', 'flipping-rocks', 'Flipping Rocks 自然生物与爬行动物观察', ['gecko', 'reptiles', 'herpetology']),
  mastodon('ecoevo.social', 'ecoevo', 'EcoEvo 生态与爬行动物观察', ['gecko', 'reptiles', 'herpetology']),
  mastodon('mstdn.science', 'mstdn-science', 'Mastodon Science 爬行动物观察', ['gecko', 'reptiles', 'herpetology']),
  { name: 'Reptiles Magazine 生态与野外观察', key: 'reptiles-magazine', kind: 'publisher-rss', host: 'reptilesmagazine.com',
    lists: ['https://reptilesmagazine.com/feed/'] }
]);

const REPTILE = /geckos?|reptiles?|lizards?|chameleons?|skinks?|bearded[ -]?dragons?|snake[\s-]?s?|python[\s-]?(?:snake|regius)|boa\b|colubrids?|tortoises?|turtles?|herpetolog|\bherping\b|蜥蜴|变色龙|變色龍|石龙子|石龍子|守宫|守宮|爬宠|爬寵|豹纹|豹紋|睫角|饲养箱|飼養箱/i;
const HABITAT = /terrarium|vivarium|bioactive/i;
const HABITAT_DETAIL = /plants?|leaves|moss|substrate|waterfall|enclosure|branch|perch|humidity|basking|栖居|植物|枝条|苔藓|躲避|湿度/i;
const HABITAT_HOMONYM = /Zoo\s+Vivarium|meerkats?|erdmännchen|mangust|monkeys?|primates?|elephants?|birds?|狐獴|猴子|鸟类/i;
const HUMAN_ONLY = /firefox|mozilla|opensuse|browser|web[\s-]?engine|xmpp|software|node[.]?js|programming|geckodriver|kobold|furry|anthro|ai[\s-]?(?:art|video)|commissions?\s+open|\bfor sale\b|\bdiscount\b|\bcoupon\b|shop\s+now|buy\s+now|sale\s+ends|\bparasites?\b|\binfect(?:ed|ion)\b|\bbleeding\b|\bdiagnos|\bvet(?:erinar)?|\bterramycin\b|\bantibiotic\b|\bby user\s*:|\bcredit\s*:|some rights reserved|\btreatment\s*:|\bpublication\s*:|\bbreeding\b|\bmorphs?\b|\bhet\b|\bclutch\b|\bcontest\b|\bwinners?\b|\baffordable\b|\b(?:office|commute|knitting|headphones?|workplace|salary|coding|paintings?|drawings?|sketch(?:es)?|osint|election|politic|legislat)\b|政府|公務|政党|政黨|立法|投票|戰爭|战争|薪资|职场|通勤|针织|地图上传|呼吸困难|处方|诊断|確診|确诊|驱虫|出血/i;

// Topic selection narrows subject matter before adaptation. It cannot establish an animal's thoughts.
export function reptileCandidate(text, category = '') {
  const subject = text + ' ' + category;
  return typeof text === 'string' && (REPTILE.test(subject) || HABITAT.test(subject) && HABITAT_DETAIL.test(subject) && !HABITAT_HOMONYM.test(subject)) && !HUMAN_ONLY.test(text);
}
const HUMAN_ACTIVITY = /\b(?:shops?|breeders?|syndrome|cancer(?:ous)?|tumou?rs?|pregnan(?:t|cy)|paving|hammer|dremel|sanding|soldering|wiring|mains|plumbing)\b|\b(?:RV[ -](?:style|toilet)|holding tank|bulkhead fitting|drainage reservoir|wet vac|read the full guide|new video out|find the video|sign up|post size|DM the admin|join (?:our|this) server|my name is|my names?)\b/i;
export const excludedHumanOrClinical = text => HUMAN_ONLY.test(text) || HUMAN_ACTIVITY.test(text) || /\b(?:poop|stool|urates?|feces|faeces|deworm|surgery|injur(?:y|ies|ed)|prescription|medication)\b/i.test(text);

const unCDATA = value => (value || '').replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1');
const field = (text, name) => unCDATA(text.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
export function rssItems(xml) {
  if (typeof xml !== 'string' || !/<rss\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('Invalid public RSS response');
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([, item]) => ({
    title: field(item, 'title'), text: field(item, 'content:encoded') || field(item, 'description'), summary: field(item, 'description'), url: field(item, 'link'),
    actor: field(item, 'dc:creator'), category: field(item, 'category'), created: Date.parse(field(item, 'pubDate'))
  }));
}

function quoteBoundaries(html, topicId, knownFloors) {
  const stack = [];
  const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
  return html.replace(/<\/?aside\b[^>]*>/gi, tag => {
    if (/^<\//.test(tag)) return stack.pop() ? '\n[引用结束]\n' : tag;
    const quote = /(?:^|\s)quote(?:\s|$)/i.test(attr(tag, 'class') || ''); stack.push(quote);
    if (!quote) return tag;
    const floor = attr(tag, 'data-post'), topic = attr(tag, 'data-topic');
    const known = topicId && topic === String(topicId) && /^[1-9][0-9]*$/.test(floor || '') && knownFloors?.has(Number(floor));
    // The anonymous renderer maps >>floor to its actually selected excerpt number.
    return `\n[引用开始，${known ? '>>' + floor : '目标未收录或未知'}]\n`;
  });
}

function bodyText(html, plainText, topicId, knownFloors) {
  return plainText(quoteBoundaries(html, topicId, knownFloors).replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (whole, contents) =>
    /^(?:\s*#[\p{L}\p{N}_-]+\s*)+$/u.test(plainText(contents)) ? '' : whole)
    .replace(/<div\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<p><small>\d+ posts?\s*-\s*\d+ participants?<\/small><\/p>/gi, '')
    .replace(/<p><a\b[^>]*>Read full topic<\/a><\/p>/gi, '')
    .replace(/<img\b[^>]*>/gi, tag => /\b(?:avatar|emoji)\b/i.test(tag) ? '' : '[图片省略，未读取画面]'));
}
const validStatus = s => s && /^[0-9]+$/.test(s.id) && typeof s.account?.acct === 'string' && s.visibility === 'public' &&
  !s.reblog && !s.sensitive && typeof s.content === 'string' && !s.spoiler_text && !s.in_reply_to_id;
const socialBody = (content, plainText) => bodyText(content, plainText).split('\n').filter(line =>
  !/^(?:\s*#[\p{L}\p{N}_-]+\s*)+$/u.test(line)).join('\n').replace(/(^|\s)#([\p{L}\p{N}_]+)/gu, '$1$2').trim();
const mastodonMessage = (s, plainText) => ({ id: s.id, canonicalId: s.uri || s.url, actor: s.account.acct,
  names: [s.account.acct, s.account.username, s.account.display_name].filter(Boolean),
  text: socialBody(s.content, plainText) +
    (Array.isArray(s.media_attachments) && s.media_attachments.length ? '\n[图片或视频省略，未读取画面]' : ''), created: Date.parse(s.created_at) });

export function parseGeckoTopics(source, payload, plainText) {
  if (source.kind === 'publisher-rss') return rssItems(payload).flatMap(item => {
    let url; try { url = new URL(item.url); } catch { return []; }
    if (url.origin !== 'https://' + source.host) return [];
    const title = plainText(item.title), summary = bodyText(item.summary.replace(/<p\b[^>]*>\s*The post\b[\s\S]*?appeared first on\b[\s\S]*?<\/p>/gi, ''), plainText);
    const text = [title, summary].filter(Boolean).join('\n\n');
    if (!summary || !reptileCandidate(text) || excludedHumanOrClinical(text)) return [];
    return [{ id: url.href, canonicalId: url.href, actor: item.actor || source.name,
      names: [item.actor, source.name, 'Reptiles Magazine'].filter(Boolean), title, text, created: item.created }];
  });
  if (source.kind === 'xenforo') return rssItems(payload).flatMap(item => {
    let url; try { url = new URL(item.url); } catch { return []; }
    const id = url.origin === 'https://' + source.host && url.pathname.match(/^\/threads\/[a-z0-9_%.-]+\.(\d+)\/$/i)?.[1];
    const text = bodyText(item.text, plainText), title = plainText(item.title), category = plainText(item.category);
    return id && item.actor && !/classified|for.sale|wanted/i.test(category) &&
      reptileCandidate(title + '\n' + text, category) && !excludedHumanOrClinical(title + '\n' + text) ?
      [{ id, actor: item.actor, names: [item.actor], title, text, category, url: url.href, canonicalId: url.href, created: item.created }] : [];
  });
  if (source.kind === 'discourse-rss') return rssItems(payload).flatMap(item => {
    const id = item.url.match(/^https:\/\/community\.morphmarket\.com\/t\/(?:[a-z0-9-]+\/)?([0-9]+)\/?$/i)?.[1];
    const text = bodyText(item.text, plainText), title = plainText(item.title);
    return id && item.actor && reptileCandidate(title + '\n' + text, plainText(item.category)) && !excludedHumanOrClinical(title + '\n' + text) ?
      [{ id, actor: item.actor, names: [item.actor], title, text, url: item.url, canonicalId: item.url, created: item.created }] : [];
  });
  if (source.kind !== 'mastodon' || !Array.isArray(payload)) throw Error('Invalid public topic response');
  return payload.filter(validStatus).filter(s => !s.account.bot && reptileCandidate(plainText(s.content))).map(s => ({ ...mastodonMessage(s, plainText),
    category: (s.tags || []).map(tag => tag.name).filter(name => /^(?:geckos?|lizards?|reptiles?|wildlife|animals?|nature)$/i.test(name)).join(' ') }));
}

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
function xenforoBody(html, plainText) {
  const body = html.match(/<article\b[^>]*class=["'][^"']*\bmessage-body\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (!body) throw Error('The public page does not contain a readable post body');
  // Quoting is visible, but neither XenForo variant reliably exposes the actual
  // reply parent. Preserve the quotation without turning it into a parent link.
  return bodyText(body.replace(/<div\b[^>]*class=["'][^"']*\bbbCodeBlock-title\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '').replace(/<blockquote\b[^>]*>/gi, '\n[引用开始，目标未知]\n')
    .replace(/<\/blockquote>/gi, '\n[引用结束]\n'), plainText);
}

function xenforoDiscussion(source, topic, html, plainText) {
  if (typeof html !== 'string' || !topic.url || new URL(topic.url).hostname !== source.host) throw Error('Invalid public forum discussion');
  const starts = [...html.matchAll(/<article\b[^>]*\bdata-content=["']post-([0-9]+)["'][^>]*>/gi)];
  const posts = starts.map((match, index) => {
    const chunk = html.slice(match.index, starts[index + 1]?.index ?? html.length);
    const actor = plainText(attribute(match[0], 'data-author') || '');
    const floor = Number(chunk.match(/itemprop=["']position["']\s+content=["']([0-9]+)["']/i)?.[1] ||
      chunk.match(/>\s*#([0-9]+)\s*<\/a>/i)?.[1]);
    const time = chunk.match(/itemprop=["']datePublished["']\s+content=["']([^"']+)["']/i)?.[1] ||
      chunk.match(/<time\b[^>]*\bdatetime=["']([^"']+)["']/i)?.[1];
    return actor && Number.isSafeInteger(floor) && floor > 0 ?
      { id: match[1], actor, names: [actor], text: xenforoBody(chunk, plainText), floor, created: Date.parse(time) } : null;
  }).filter(Boolean);
  if (!posts.some(post => post.floor === 1) && source.host === 'www.reptileforums.co.uk') {
    // This site's first post is rendered separately from reply articles.
    const section = html.indexOf('qid="thread-main-section"'), end = starts[0]?.index ?? html.length;
    if (section >= 0) {
      const chunk = html.slice(section, end);
      const actor = plainText(chunk.match(/<span\b[^>]*class=["'][^"']*\busername\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || '');
      const time = chunk.match(/itemprop=["']datePublished["']\s+content=["']([^"']+)["']/i)?.[1];
      if (/itemprop=["']position["']\s+content=["']1["']/i.test(chunk) && actor && time) {
        posts.push({ id: 'root', actor, names: [actor], text: xenforoBody(chunk, plainText), floor: 1, created: Date.parse(time) });
      }
    }
  }
  posts.sort((a, b) => a.floor - b.floor);
  if (posts[0]?.floor !== 1) throw Error('The public page does not include the root; no root is reconstructed');
  return { root: posts[0], replies: posts.slice(1) };
}

export function parseGeckoDiscussion(source, topic, payload, plainText) {
  // The publisher's RSS excerpt is the complete acquired material. It does
  // not provide a comment thread or establish that the full article was read.
  if (source.kind === 'publisher-rss') return { root: topic, replies: [] };
  if (source.kind === 'xenforo') return xenforoDiscussion(source, topic, payload, plainText);
  if (source.kind === 'discourse-rss') {
    const posts = rssItems(payload).flatMap(item => {
      const floor = item.url.match(new RegExp(`^https://community\\.morphmarket\\.com/t/(?:[a-z0-9-]+/)?${topic.id}/([0-9]+)$`, 'i'))?.[1];
      return floor && item.actor ? [{ ...item, floor: Number(floor) }] : [];
    }).sort((a, b) => a.floor - b.floor);
    const first = posts.find(item => item.floor === 1);
    if (!first) throw Error('The public RSS window does not include the root; no root is reconstructed');
    const knownFloors = new Set(posts.map(item => item.floor));
    const message = item => ({ id: String(item.floor), actor: item.actor, names: [item.actor],
      text: bodyText(item.text, plainText, topic.id, knownFloors), created: item.created });
    const root = message(first); root.text = [plainText(first.title), root.text].filter(Boolean).join('\n\n');
    // RSS does not expose reply_to_post_number. Keep its visible order without inventing parent links.
    return { root, replies: posts.filter(item => item.floor !== 1).map(message) };
  }
  if (source.kind !== 'mastodon' || !payload || !Array.isArray(payload.descendants)) throw Error('Invalid public context response');
  const replies = payload.descendants.filter(s => s && /^[0-9]+$/.test(s.id) && typeof s.account?.acct === 'string' &&
    s.visibility === 'public' && !s.sensitive && !s.spoiler_text && !s.reblog && typeof s.content === 'string')
    .map(s => ({ ...mastodonMessage(s, plainText), replyTo: s.in_reply_to_id })).sort((a, b) => a.created - b.created);
  return { root: topic, replies };
}
