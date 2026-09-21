// Fictional isopod language used only at the presentation layer.
// It intentionally compresses human sentences into a small survival-oriented lexicon.

const EXACT=new Map([
 ['湿区喷水','\\o/  +'],
 ['增加通风','<o>  ~'],
 ['添一片枯叶','=o=  [o]  +'],
 ['少量投食','=o=  +'],
 ['取走剩食','=o=  -'],
 ['降低光线','o^  -'],
 ['保持原样','o.'],
 ['湿苔','\\o/'],
 ['木片','[o]'],
 ['叶缘','=o=  |'],
 ['食物','=o='],
 ['阴影','[o]'],
 ['边缘','|'],
 ['去哪里？','<o>  ?'],
 ['把观察点放在哪里？','o:  ?'],
 ['留在这里','o.'],
 ['碰一下','O  >o<  o'],
 ['拿近一点看','O  >o<  o:'],
 ['不碰它','O  o#  >o<'],
 ['收起来','O  (o)'],
 ['记下轮廓','O  o:'],
 ['留在原处','o.'],
 ['等它出来','o.  <o>'],
 ['轻抬木片','O  [o]  ^'],
 ['不再追看','O  o#  o:'],
 ['留一条窄缝','[o]  |'],
 ['平放叶片','=o=  _'],
 ['保留原处','o.'],
 ['记录为疑似旧壳','o:  (o)  o?'],
 ['当作残渣取走','O  =o=  <o>'],
 ['暂不命名','o:  o?'],
 ['观察个体','oo  o:'],
 ['收集到的蜕皮','(o)  o+']
]);

const MULTI=/两只|三只|四只|几只|它们|多个个体|two individuals|three individuals|several|both bodies|they\b|二匹|三匹|数匹|何匹か|個体たち/iu;
const SINGLE=/一个个体|个体|它\b|鼠妇|isopod|individual|one body|一匹|個体/iu;
const HUMAN=/你|你的|手|指尖|手指|observer|your hand|\byou\b|あなた|手|指/iu;

const CONCEPTS=[
 ['^o^',/触角|antennae?/iu],
 ['\\o/',/湿|水滴|水珠|苔|水线|humidity|wet|damp|moist|water|湿った|湿り|水際/iu],
 ['/o\\',/干|乾|发白|白っぽ|dry|drier|driest|pale/iu],
 ['=o=',/食物|餌|叶|葉|碎屑|破片|欠片|枯叶|crumb|food|leaf|debris|litter/iu],
 ['[o]',/木片|樹皮|树皮|阴影|陰影|暗处|暗い|下面|下へ|下に|隙間|缝|遮蔽物|bark|shadow|under|gap|shelter|cover/iu],
 ['o^',/光|亮|明る|照|light|bright/iu],
 ['|',/边缘|边界|入口|盒壁|縁|境界|壁|edge|boundary|entrance|wall|corner|角/iu],
 ['<o>',/移动|经过|路线|走|离开|进入|出来|靠近|转向|爬|穿过|通り|進|経路|離|入|出|近づ|曲が|登|move|route|walk|leave|enter|emerge|approach|turn|climb|pass|cross/iu],
 ['o.',/停|等待|等它|留在|原处|静止|止ま|待|残る|pause|wait|stay|remain|stop/iu],
 ['>o<',/碰|接触|触れ|触っ|拿|抬|持ち上|敲|叩|touch|contact|lift|tap|pick up|grab/iu],
 ['o:',/观察|记录|笔记|画|纸|名字|命名|看|観察|記録|ノート|紙|名前|見る|見え|observe|record|note|draw|paper|name|look|see|archive/iu],
 ['o?',/不确定|也许|可能|无法|猜|疑似|未命名|不知道|maybe|may|might|could|guess|possible|uncertain|cannot|unknown|分から|かもしれ|予想|可能性|未/iu],
 ['o!',/危险|震动|振動|分散|scatter|danger|vibration|disturb/iu],
 ['o+',/更多|变多|增加|多出|増え|多く|more|increase|crowd/iu],
 ['o-',/更少|减少|缩短|变薄|少|減|短く|薄く|less|decrease|shorter|thinner/iu],
 ['(o)',/旧壳|蜕皮|脱皮殻|殻|exuviae?|shed shell|shell/iu],
 ['o#',/不要|不再|没有|不能|拒绝|do not|does not|cannot|no longer|ない|ません|できない/iu]
];

const TIME=/今天|明天|七天|时刻|时间|秒|后来|此刻|day|today|tomorrow|time|second|later|now|日|時刻|あとで|いま/iu;
const STRONG=/很|太|非常|立刻|迅速|very|immediately|strong|すぐ|とても/iu;

function pushUnique(list,token){if(token&&!list.includes(token))list.push(token)}

export function encodeIsopodText(value){
 if(value==null)return '';
 const text=String(value).trim();
 if(!text)return '';
 const exact=EXACT.get(text);
 if(exact)return exact;

 const tokens=[];
 const specimen=text.match(/(?:个体|specimen|個体)\s*([A-G])/iu);
 if(specimen)pushUnique(tokens,'o'+specimen[1].toUpperCase());
 else if(MULTI.test(text))pushUnique(tokens,'oo');
 else if(SINGLE.test(text))pushUnique(tokens,'o');
 if(HUMAN.test(text))pushUnique(tokens,'O');

 const hits=[];
 for(const [token,rx] of CONCEPTS){
  const index=text.search(rx);
  if(index>=0)hits.push({index,token});
 }
 hits.sort((a,b)=>a.index-b.index);
 for(const hit of hits)pushUnique(tokens,hit.token);

 if(TIME.test(text))pushUnique(tokens,'o..');
 if(STRONG.test(text))pushUnique(tokens,'o*');
 if(/[?？]/u.test(text))pushUnique(tokens,'?');
 if(/[!！]/u.test(text))pushUnique(tokens,'!');

 const numbers=[...text.matchAll(/\b\d+\b/g)].map(match=>match[0]).slice(0,2);
 for(const number of numbers)pushUnique(tokens,number);

 if(!tokens.length)return text.length<=10?'o?':'o:  ...';
 if(tokens.length===1&&text.length>18)pushUnique(tokens,'...');
 return tokens.slice(0,9).join('  ');
}

export const ISOPOD_LEXICON=Object.freeze({
 isopod:'o',group:'oo',human:'O',wet:'\\o/',dry:'/o\\',shelter:'[o]',
 move:'<o>',food:'=o=',antenna:'^o^',contact:'>o<',wait:'o.',
 record:'o:',uncertain:'o?',danger:'o!',more:'o+',less:'o-',shell:'(o)',
 blocked:'o#',edge:'|',light:'o^',time:'o..',strong:'o*'
});
