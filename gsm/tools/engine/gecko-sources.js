// Public reptile discussions only. No authenticated endpoint or cross-project runtime.
export const geckoSources = Object.freeze([
  { name: 'MorphMarket 爬宠社区', key: 'morphmarket', kind: 'discourse-rss',
    lists: ['https://community.morphmarket.com/latest.rss'],
    detail: (id, topic) => `${topic?.url || `https://community.morphmarket.com/t/${id}`}.rss` },
  { name: 'Mastodon 守宫与爬宠标签', key: 'mastodon', kind: 'mastodon',
    lists: ['https://mastodon.social/api/v1/timelines/tag/gecko?limit=20', 'https://mastodon.social/api/v1/timelines/tag/geckos?limit=20',
      'https://mastodon.social/api/v1/timelines/tag/reptiles?limit=20', 'https://mastodon.social/api/v1/timelines/tag/lizard?limit=20'],
    detail: id => `https://mastodon.social/api/v1/statuses/${id}/context` }
]);

const REPTILE = /geckos?|reptiles?|lizards?|snake[\s-]?s?|python[\s-]?(?:snake|regius)|boa\b|colubrids?|tortoises?|terrarium|vivarium|herpetolog|蜥蜴|守宫|守宮|爬宠|爬寵|豹纹|豹紋|睫角|饲养箱|飼養箱/i;
const HUMAN_ONLY = /firefox|mozilla|opensuse|browser|web[\s-]?engine|xmpp|software|node[.]?js|programming|geckodriver|kobold|furry|anthro|ai[\s-]?(?:art|video)|commissions?\s+open|\bfor sale\b|\bdiscount\b|\bcoupon\b|shop\s+now|buy\s+now|sale\s+ends|\bparasites?\b|\binfect(?:ed|ion)\b|\bbleeding\b|\bdiagnos|\bvet(?:erinar)?|\bterramycin\b|\bantibiotic\b|\bby user\s*:|\bcredit\s*:|some rights reserved|\btreatment\s*:|\bpublication\s*:|\bbreeding\b|\bmorph\b|\bhet\b|\bclutch\b|\bcontest\b|\bwinners?\b|\baffordable\b|\b(?:office|commute|knitting|headphones?|workplace|salary|coding|painting|drawing|sketch|osint|election|politic|legislat)\b|政府|公務|政党|政黨|立法|投票|戰爭|战争|薪资|职场|通勤|针织|地图上传|呼吸困难|处方|诊断|確診|确诊|驱虫|出血/i;

// Topic selection narrows subject matter before adaptation. It cannot establish an animal's thoughts.
export function reptileCandidate(text, category = '') {
  return typeof text === 'string' && REPTILE.test(text + ' ' + category) && !HUMAN_ONLY.test(text);
}
export const excludedHumanOrClinical = text => HUMAN_ONLY.test(text) || /\b(?:poop|stool|urates?|feces|faeces|deworm|surgery|injur(?:y|ies|ed)|prescription|medication)\b/i.test(text);

const unCDATA = value => (value || '').replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1');
const field = (text, name) => unCDATA(text.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');
export function rssItems(xml) {
  if (typeof xml !== 'string' || !/<rss\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('Invalid public RSS response');
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([, item]) => ({
    title: field(item, 'title'), text: field(item, 'description'), url: field(item, 'link'),
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
const mastodonMessage = (s, plainText) => ({ id: s.id, actor: s.account.acct,
  names: [s.account.acct, s.account.username, s.account.display_name].filter(Boolean),
  text: socialBody(s.content, plainText) +
    (Array.isArray(s.media_attachments) && s.media_attachments.length ? '\n[图片或视频省略，未读取画面]' : ''), created: Date.parse(s.created_at) });

export function parseGeckoTopics(source, payload, plainText) {
  if (source.kind === 'discourse-rss') return rssItems(payload).flatMap(item => {
    const id = item.url.match(/^https:\/\/community\.morphmarket\.com\/t\/(?:[a-z0-9-]+\/)?([0-9]+)\/?$/i)?.[1];
    const text = bodyText(item.text, plainText), title = plainText(item.title);
    return id && item.actor && reptileCandidate(title + '\n' + text, plainText(item.category)) && !excludedHumanOrClinical(title + '\n' + text) ?
      [{ id, actor: item.actor, names: [item.actor], title, text, url: item.url, created: item.created }] : [];
  });
  if (source.kind !== 'mastodon' || !Array.isArray(payload)) throw Error('Invalid public topic response');
  return payload.filter(validStatus).filter(s => !s.account.bot && reptileCandidate(plainText(s.content))).map(s => ({ ...mastodonMessage(s, plainText),
    category: (s.tags || []).map(tag => tag.name).filter(name => /^(?:geckos?|lizards?|reptiles?|wildlife|animals?|nature)$/i.test(name)).join(' ') }));
}

export function parseGeckoDiscussion(source, topic, payload, plainText) {
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
