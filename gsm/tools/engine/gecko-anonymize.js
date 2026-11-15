// Adapted once from lucifer0 collector 2f0fd378; GSM maintains this implementation.
const PLATFORM = /哔哩哔哩|嗶哩嗶哩|b站|bilibili|小红书|小紅書|rednote|微博|weibo|抖音|douyin|知乎|zhihu|豆瓣|douban|telegram|電報|电报|twitter|推特|reddit|v2ex|v站|x岛|a岛|x島|a島|nmbxd|nmb\.best|匿名版|adnmb|\bnga\b|晴风村|小黑盒|linux\.do|快手|贴吧|貼吧|微信|wechat|discord|instagram|facebook|youtube|tiktok|\bx(?=\s*(?:上|里|看到|发了|刷到))/gi;
const LINK = /(?:[a-z][a-z0-9+.-]{1,20}:\/\/|www\.|mailto:|data:)[^\s<>]+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|cn|io|tv|me|dev|app|co|best|xyz)(?:\b|\/)[^\s<>]*/gi;
const EMAIL = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
const CONTACT = /(?:\+?86[-\s]?)?1[3-9]\d{9}\b|\b0\d{2,3}[-\s]?\d{7,8}\b|\+\d{1,3}(?:[-\s]?\d){7,14}\b/g;
const QQ_CONTACT = /(?<![a-z0-9_])qq(?:\s*(?:群(?:号|號)?|号码|號碼|账号|帳號|帐号|号|號))?\s*(?:[:：=]|是|为|為)?\s*[1-9]\d{4,11}(?![a-z0-9_])/gi;
const SOCIAL_CONTACT_PREFIX = '(?:微信|wechat|weixin|telegram|电报|電報|tg|wx|vx)';
const ACCOUNT_END = '(?![a-z0-9_-]|\\s*(?:版|版本|客户端|用戶端|client\\b))';
// A label/separator, contact invitation, or mixed identifier distinguishes an account from ordinary platform talk.
const SOCIAL_CONTACT = new RegExp(`(?<![a-z0-9_])${SOCIAL_CONTACT_PREFIX}(?:\\s*(?:账号|帳號|帐号|用户名|用戶名|号码|號碼|号|號|id)\\s*(?:[:：=]|是|为|為)?\\s*|\\s*[:：=@]\\s*|\\s+(?!(?:windows|macos|android|ios|linux|desktop|web)(?![a-z0-9_-])))@?[a-z][a-z0-9_-]{4,31}${ACCOUNT_END}`, 'gi');
const ATTACHED_SOCIAL_CONTACT = new RegExp(`(?<![a-z0-9_])${SOCIAL_CONTACT_PREFIX}(?=[a-z0-9_-]*[0-9_])[a-z][a-z0-9_-]{4,31}${ACCOUNT_END}`, 'gi');
const INVITED_SOCIAL_CONTACT = new RegExp(`(?:加|添加|联系|聯繫|私聊|私信)(?:一下)?\\s*(?:我(?:的)?)?\\s*${SOCIAL_CONTACT_PREFIX}\\s*@?[a-z][a-z0-9_-]{4,31}${ACCOUNT_END}`, 'gi');
// These conservative exclusions supplement mechanical redaction; they do not claim semantic anonymity.
const PERSONAL = /身份证|身份證|银行卡|銀行卡|病历|病歷|诊断书|診斷書|密码|密碼|住址|门牌|門牌|工号|工號|学号|學號|(?:我|本人)(?:的真名|姓名)?叫[\p{Script=Han}A-Za-z]{2,20}|[\p{Script=Han}A-Za-z0-9]{2,25}(?:有限公司|集团|集團|大学|大學|中学|中學|医院|醫院|学院|學院|派出所)|[\p{Script=Han}A-Za-z0-9]{2,20}(?:路|街|巷)\s*\d+号|\d+\s*(?:栋|棟|单元|單元|室)/u;
const fail = message => { throw new Error(message); };
const chars = text => [...text].length;
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SOURCE_LABELS = /MorphMarket|Mastodon|GeckoForums/gi;
const genericName = name => !name || /^(?:无名氏|無名氏|匿名|Anonymous|名無し)$/i.test(name);

export function plainText(value) {
  if (typeof value !== 'string') return '';
  let text = value.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi, '\n').replace(/<[^>]*>/g, '');
  text = text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? whole;
    const value = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : '';
  });
  return text.replace(/[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uE000-\uF8FF]/g, '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function identityReplacements(text, replacements) {
  const items = [...replacements].filter(([name]) => !genericName(name)).sort((a, b) => b[0].length - a[0].length);
  if (!items.length) return text;
  const pattern = new RegExp(items.map(([name]) => /^[a-z0-9_.-]+$/i.test(name) ? `(?<![a-z0-9_])${escapeRegExp(name)}(?![a-z0-9_])` : escapeRegExp(name)).join('|'), 'gi');
  const lookup = new Map(items.map(([name, label]) => [name.toLowerCase(), label]));
  const protectedLabels = [];
  text = text.replace(pattern, match => { protectedLabels.push(lookup.get(match.toLowerCase())); return `\uE000${protectedLabels.length - 1}\uE001`; });
  text = redact(text);
  return text.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedLabels[Number(index)]);
}

function redact(text) {
  return text.replace(/!\[[^\]]*\]\([^)]*\)/g, '[图片省略]')
    .replace(QQ_CONTACT, '[联系标识隐去]')
    .replace(INVITED_SOCIAL_CONTACT, '[联系标识隐去]').replace(SOCIAL_CONTACT, '[联系标识隐去]').replace(ATTACHED_SOCIAL_CONTACT, '[联系标识隐去]')
    .replace(/(?:QQ|群号|微信号|手机号|电话|账号|帐号|UID|user[_ -]?id)\s*[：:=]\s*[a-z0-9][a-z0-9_.-]{3,}/gi, '[联系标识隐去]')
    .replace(EMAIL, '[联系方式隐去]').replace(LINK, '[链接隐去]').replace(CONTACT, '[数字标识隐去]')
    .replace(SOURCE_LABELS, '某社区').replace(PLATFORM, '某社区').replace(/\bV\s*友/gi, '网友').replace(/@[\p{L}\p{N}_.-]+/gu, '[某参与者]');
}

function markdownText(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/([\\`*_{}\[\]()#+!|])/g, '\\$1').replace(/\n/g, '  \n   ');
}

export function anonymizeDiscussion(discussion, limits) {
  const { root, replies } = discussion;
  if (!root.text || chars(root.text) > limits.rootCharacters || PERSONAL.test(root.text)) return null;
  const candidates = [root, ...replies.slice(0, 50).filter(reply => reply.text && chars(reply.text) <= limits.replyCharacters && !PERSONAL.test(reply.text))];
  const selected = [root];
  let total = chars(root.text);
  for (const message of candidates.slice(1)) {
    if (selected.length > limits.repliesPerThread) break;
    if (total + chars(message.text) > limits.threadCharacters) continue;
    selected.push(message); total += chars(message.text);
  }

  const actors = new Map();
  for (const message of selected) if (!actors.has(message.actor)) actors.set(message.actor, `发言者 ${actors.size + 1}`);
  const identities = new Map();
  for (const message of [root, ...replies]) for (const name of message.names) if (typeof name === 'string' && name.length <= 120 && !genericName(name)) identities.set(name, actors.get(message.actor) ?? '某参与者');
  const ids = new Map(selected.map((message, index) => [message.id, index + 1]));
  const messages = selected.map((message, index) => {
    const replyTo = ids.get(message.replyTo), target = replyTo && replyTo < index + 1 ? replyTo : null;
    let text = message.text.replace(/>>\s*(?:No\.?\s*)?(\d+)/gi, (_, rawId) => ids.has(rawId) && ids.get(rawId) < index + 1 ? `[引用第 ${ids.get(rawId)} 条]` : '[引用未收录发言]');
    text = identityReplacements(text, identities);
    if (!identities.size) text = redact(text);
    text = text.replace(/^\s*@?(?:发言者 \d+|\[某参与者\])\s+#\d+\b/, target ? `[引用第 ${target} 条]` : '[引用未收录发言]')
      .replace(/@(?=发言者 \d+|某参与者)/g, '');
    return { speaker: actors.get(message.actor), text, replyTo: target, missingTarget: Boolean(message.replyTo && !target) };
  });
  return { messages };
}


export { markdownText };
