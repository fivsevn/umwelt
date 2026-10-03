// Museum references describe identity, period and form. Each sprite is an original pixel translation.
const met = (id) => ({ label: "大都会艺术博物馆 · 藏品记录", url: `https://www.metmuseum.org/art/collection/search/${id}` });
const nam = (id) => ({ label: "英国国家陆军博物馆 · 藏品记录", url: `https://collection.nam.ac.uk/detail.php?acc=${id}` });
const prm = (region, slug) => ({ label: "牛津大学皮特里弗斯博物馆 · 藏品记录", url: `https://weapons.prm.ox.ac.uk/index.php/tour-by-region/oceania/${region}/${slug}/index.html` });
const ra = (slug) => ({ label: "英国皇家军械博物馆 · 器物故事", url: `https://royalarmouries.org/objects-and-stories/${slug}` });
const si = (id) => ({ label: "史密森尼美国历史博物馆 · 藏品记录", url: `https://americanhistory.si.edu/collections/object/${id}` });
// [id, name, English name, origin, reference period, silhouette, note, source]
const guns = [
  ["matchlock", "日本火绳枪", "Japanese matchlock", "日本", "18世纪藏品", "matchlock", "长长的铁制枪管贴着木托，尾部略向下折，黄铜小件在暗木色上留下几处亮点。参考江户时期的火绳枪。", met(22491)],
  ["wheellock", "轮锁手枪", "Wheellock pistol", "法国", "约1600—1610年", "wheellock", "长枪管、倾斜握柄与圆形轮锁构成细长轮廓。浅色嵌饰沿深色木托排列，是早期欧洲手枪常见的装饰语言。", met(22385)],
  ["flintlock", "燧发手枪", "Flintlock pistol", "英国", "约1770年", "flintlock", "木质握柄向下弯，金属枪管向前延伸。侧面的燧发锁和黄铜护圈，让轮廓像一条带着小枝的弯木。", met(27862)],
  ["duelling", "沃格登决斗手枪", "Wogdon duelling pistol", "英国", "约1780年", "duelling", "参考博物馆的一对沃格登燧发手枪。直而修长的枪管、规整木柄和较少装饰，显出18世纪末的克制线条。", nam("1987-09-6-3")],
  ["blunderbuss", "喇叭口短铳", "Flintlock blunderbuss", "英国", "19世纪藏品", "blunderbuss", "短而厚的木托配一根逐渐张开的枪管，喇叭形口缘最醒目。铜色与旧木色留在朴素的短铳轮廓里。", nam("1956-02-394-1")],
  ["brown-bess", "褐贝丝长陆军型", "Brown Bess · Long Land", "英国", "18世纪", "brown-bess", "很长的木托几乎包住整根枪管，侧面留着燧发锁，黄铜护圈与托底形成温暖色点。参考长陆军型藏品。", nam("1994-06-2-1")],
  ["colt-1903", "柯尔特1903手枪", "Colt Model 1903", "美国", "20世纪初式样", "colt-1903", "小巧的深灰色枪身、短握柄和简洁滑套，使它与更大的军用手枪很好区分。参考博物馆记录的1897/1903型。", nam("1998-01-118-1")],
  ["enfield-1853", "恩菲尔德1853步枪", "Enfield Pattern 1853", "英国", "1853年式", "enfield-1853", "三道箍带沿着长木托排列，细枪管和弯曲托底连成一条平缓长线。这里保留了三箍式步枪最容易辨认的外形。", nam("1979-07-60-1")],
  ["colt-1849", "柯尔特1849袖珍左轮", "Colt Model 1849 Pocket", "美国", "1849年式", "colt-1849", "小尺寸木握柄上方是一只紧凑转轮，短枪管让整件显得轻巧。画面以钢色与木色概括藏品式样。", met(788188)],
  ["colt-1851", "柯尔特1851海军左轮", "Colt Model 1851 Navy", "美国", "1851年式", "colt-1851", "较长的多面枪管、外露转轮与向下弯的木握柄，构成19世纪中叶左轮的熟悉形态。小片黄铜留在护圈上。", met(35690)],
  ["colt-1860", "柯尔特1860陆军左轮", "Colt Model 1860 Army", "美国", "1860年式", "colt-1860", "细长圆形枪管接着较厚的转轮，木柄比袖珍型更舒展。以枪管下方的细杆和流畅过渡区别于1851型。", met(24892)],
  ["colt-saa", "柯尔特单动陆军左轮", "Colt Single Action Army", "美国", "1874年藏品", "colt-saa", "枪管、转轮和弯木柄形成紧凑三段轮廓；枪管下方有一条短金属壳线。参考博物馆19世纪后期的藏品。", met(24848)],
  ["webley-v", "韦伯利Mk V左轮", "Webley Mark V", "英国", "1915年藏品", "webley-v", "粗壮枪身、明显的顶部框架和方圆握柄组成厚实轮廓，握柄底下垂着小环。深钢色与木色都压得很低。", nam("1991-08-92--1")],
  ["mauser-c96", "毛瑟C96手枪", "Mauser C96", "德国", "1896年式", "mauser-c96", "细长枪管伸出方形枪身，弹仓在握柄前面，握柄像一截扫帚把。这样的排列是C96最鲜明的外形特点。", ra("stories/arms-of-the-first-world-war")],
  ["luger-p08", "鲁格P08手枪", "Luger P08", "德国", "1908年式", "luger-p08", "向后倾斜的握柄、细直枪管和顶部略突出的肘节，组合成很有辨识度的线条。木柄纹理用几行暗色像素表现。", ra("stories/arms-of-the-first-world-war")],
  ["m1911", "柯尔特M1911A1手枪", "Colt M1911A1", "美国", "20世纪藏品", "m1911", "矩形滑套与较直的握柄连成厚实轮廓，枪口和握柄底端都很平整。参考纽曼中校收藏的M1911A1。", nam("1992-05-133-1")],
  ["nambu-14", "南部十四年式手枪", "Nambu Type 14", "日本", "1925年式", "nambu-14", "窄长枪管、圆润后端与斜木柄相接，下方护圈显得较大。参考博物馆约1930年的十四年式藏品。", nam("1964-05-60-15")],
  ["lee-enfield", "李恩菲尔德No.4步枪", "Lee–Enfield No.4 Mk I", "英国", "1945年藏品", "lee-enfield", "长木护手、露出的枪口和枪身下方的盒形弹匣，构成No.4的轮廓。托底、枪管和机匣用不同深浅的色块分开。", nam("1993-07-143--1")],
  ["mosin", "莫辛纳甘1891步枪", "Mosin–Nagant M1891", "俄国", "1891年式", "mosin", "长枪管延伸在修长木托前方，直枪栓柄在侧边留下一个小凸点。参考1919年前后的1891型藏品。", nam("1992-08-177-1")],
  ["kar98k", "毛瑟Kar98k步枪", "Mauser Kar98k", "德国", "1940年藏品", "kar98k", "弯下的枪栓柄、紧凑的木托和露出的短段枪管，形成比长步枪更收拢的外形。两道箍带和皮带点保留在木色上。", nam("1996-07-97-1")],
  ["arisaka-38", "三八式步枪", "Arisaka Type 38", "日本", "1905年式", "arisaka-38", "细长木托与长枪管相连，后部圆形部件、枪栓和箍带只用少数暗亮像素点出。参考约1930年的三八式藏品。", nam("1993-04-55-1")],
  ["garand", "加兰德M1步枪", "M1 Garand", "美国", "20世纪藏品", "garand", "连续的木托包住枪身，较宽机匣位于中段，下方没有突出的长弹匣。前端与托底的金属件压在旧木色之上。", nam("1983-01-82-1")],
  ["m1-carbine", "M1卡宾枪", "M1 Carbine", "美国", "约1942年藏品", "m1-carbine", "短小木托、细枪管和小盒形弹匣，让它看起来比M1步枪轻巧很多。两者名字相近，外形和器物类型并不相同。", nam("1982-04-751-1")],
  ["henry", "亨利1860步枪", "Henry Model 1860", "美国", "1860年式", "henry", "黄铜机匣、长长的管状下线与木枪托连成暖色轮廓；机匣下方的杠杆护圈是识别这件器物的关键。", si("nmah_414668")],
  ["winchester", "温彻斯特1873步枪", "Winchester Model 1873", "美国", "1873年式", "winchester", "深色机匣夹在木枪托与前护木之间，枪管下方的细管几乎一样长。杠杆护圈留成一个清楚的小空洞。", met(904560)],
  ["thompson", "汤普森1928冲锋枪", "Thompson Model 1928", "美国", "1928年式", "thompson", "木枪托、独立握柄、前方竖握把与圆鼓形弹匣共同组成鲜明轮廓。深金属色间穿插两小块暖木色。", { label: "史密森尼博物馆 · Thompson 1928", url: "https://www.si.edu/object/thompson-model-1928-submachine-gun%3Anmah_743453" }],
  ["sten", "斯登Mk II冲锋枪", "Sten Mark II", "英国", "1941年藏品", "sten", "圆管枪身、简易骨架枪托和横向伸出的弹匣是主要特征。朝上伸出的短线表示侧置弹匣，枪身保持朴素钢灰色。", nam("1978-11-73-1")],
  ["mp40", "MP40冲锋枪", "MP40", "德国", "20世纪藏品", "mp40", "折叠金属枪托、短枪管与向下伸出的直弹匣连成利落轮廓，握柄处留一点深褐色。与木托冲锋枪并排时差别很明显。", nam("1982-04-755-1")],
  ["ppsh", "波波沙PPSh-41冲锋枪", "PPSh-41", "苏联", "1942年藏品", "ppsh", "木枪托连着带孔的金属护套，圆鼓形弹匣在下方形成宽圆块。枪口略斜、护套孔眼和木托保留了这件器物的特征。", nam("1992-11-64-1")],
  ["ak47", "卡拉什尼科夫AK步枪", "Kalashnikov AK · 1953", "苏联", "1953年藏品", "ak47", "弯曲弹匣、分开的木托与木护手、枪管上方的短管线，组合成非常鲜明的轮廓。参考皇家军械博物馆1953年的AK。", ra("up-close-online-exhibition/dillon-ak47")],
];
const arms = [
  ["bronze-sword", "青铜叶形剑", "Bronze leaf-shaped sword", "英国", "青铜时代", "bronze", "剑身像一片拉长的叶子，中部较宽，向尖端收拢。参考泰晤士河出土的青铜时代叶形剑，青铜色留着暗绿旧痕。", prm("europe", "arms-and-armour-europe-163")],
  ["rapier", "意大利护手刺剑", "Rapier", "意大利", "约1580年", "rapier", "细长直刃配复杂的弯曲护手，柄周围的金属线像几根缠绕枝条。参考大都会博物馆的16世纪刺剑。", met(25063)],
  ["basket-sword", "篮形护手阔剑", "Basket-hilted sword", "英国", "18世纪式样", "basket", "直而较宽的剑刃，配围住握柄的篮形护手。参考藏品的镂空金属结构，暗褐握柄藏在护手的小格子里。", prm("europe", "arms-and-armour-europe-169")],
  ["sabre", "1796轻骑兵军刀", "Light cavalry sabre", "英国", "1796年式", "sabre", "弯刀身逐渐向尖端收束，一道护手弓连着柄底。参考牛津志愿军军官使用过的式样，保留浅色柄与暗金属刀线。", prm("europe", "light-cavalry-sabre-2007561-230")],
  ["stiletto", "意大利细刃匕首", "Stiletto", "意大利", "16世纪中叶", "stiletto", "狭窄直刃、小横护手和细握柄几乎连在同一条线上。金属质地用窄亮边表现，比例与短刀、宽刃匕首都不同。", prm("europe", "arms-and-armour-europe-157")],
  ["kukri", "尼泊尔库克里弯刀", "Kukri", "尼泊尔", "1830年前收藏", "kukri", "刀身向前折弯，前半段明显加宽，木柄较短。它也曾是日常多用途工具，最特别的地方就是弯折的叶片轮廓。", prm("asia", "arms-and-armour-asia-78")],
  ["jian", "双剑", "Double jian", "中国", "约1800年", "jian", "两把直身双刃剑并排摆放，柄与小护手相互错开。参考同鞘收藏的双剑，保留黄铜护手和编绳握柄的颜色。", prm("asia", "arms-and-armour-asia-68")],
  ["katana", "日本打刀", "Katana", "日本", "约1850—1865年藏品", "katana", "长刀身略弯，圆形刀镡隔开刀刃与缠绳柄。黑色、暗木色和窄亮刃线概括了这件晚期江户藏品的外形。", prm("asia", "arms-and-armour-asia-125")],
  ["wakizashi", "日本胁差", "Wakizashi", "日本", "江户时期式样", "wakizashi", "胁差比打刀短，仍有微弯刀身、刀镡和缠绳柄。参考带夏季花蝶装饰的藏品，柄边留两点不抢眼的金色。", prm("asia", "arms-and-armour-asia-115")],
  ["tanto", "日本短刀", "Tantō", "日本", "18世纪末—19世纪初", "tanto", "短直刀身配小圆护手与缠绳柄，比例比胁差更紧凑。参考黑漆鞘、蓝金箭头纹装饰的藏品，颜色只留在柄边。", prm("asia", "tanto-1929176-229")],
  ["kris", "印尼克里斯匕首", "Keris / Kris", "印度尼西亚", "1884年入藏", "kris", "波浪形刀身与不对称弯握柄组成特别的曲线。克里斯也承载礼服、身份与象征传统，画面保留深色柄和起伏刃线。", prm("asia", "arms-and-armour-asia-71")],
  ["katar", "印度卡塔尔匕首", "Katar", "印度", "17—18世纪", "katar", "宽三角刀身后方接两根平行侧杆，中间横着双握条，形成H形握柄。黄铜色结构与银灰刀身很好辨认。", prm("asia", "arms-and-armour-asia-70")],
  ["talwar", "印度塔尔瓦弯刀", "Talwar", "印度", "18世纪末—19世纪初", "talwar", "弯刀身连着十字护手，柄底有明显圆盘。参考博物馆带红色织物与黄铜装饰的藏品，圆盘和暖色握柄保留下来。", prm("asia", "arms-and-armour-asia-84")],
  ["shamshir", "波斯沙姆希尔弯刀", "Shamshir", "伊朗", "约1650—1750年", "shamshir", "刀身弯度比军刀更明显，细刃像一道窄月牙。小十字护手与偏折柄头，使它的轮廓轻巧而连贯。", prm("asia", "arms-and-armour-asia-85")],
  ["halberd", "德国长柄戟", "Halberd", "德国", "15世纪末", "halberd", "长木杆顶端同时有尖头、宽斧刃和反向小钩，组合成不对称的金属头。参考晚15世纪的德国藏品。", met(25898)],
  ["battle-axe", "维京宽刃战斧", "Broad-bladed battle axe", "北欧式样", "10世纪末—11世纪", "axe", "宽而向外凸的斧刃挂在细木杆一侧。斧头参考泰晤士河出土藏品，木杆则按这类长柄斧的结构作轮廓转译。", { label: "大英博物馆 · 战斧头藏品", url: "https://www.britishmuseum.org/collection/object/H_1838-0110-2" }],
  ["mace", "意大利翼片钉头锤", "Flanged mace", "意大利", "约1575—1600年", "mace", "头部由数片三角金属翼构成，细柄下端带螺旋握纹。参考镀金藏品，保留低饱和黄铜色和放射状头部。", met(32223)],
  ["war-hammer", "法国战锤", "War hammer", "法国", "约1450年", "hammer", "锤头的一侧厚而方，另一侧延伸为尖钩，上方还有小尖。木柄与几处铜色箍带把这件非对称器物串在一起。", met(25073)],
  ["crossbow", "欧洲木弩", "European crossbow", "欧洲", "历史藏品式样", "crossbow", "长木身前端横着一张弓，弦收拢成三角轮廓，头部留出小环。弩身的暗木色、弓片和浅色弦在俯视角度里分得很清楚。", { label: "意大利VIVE博物馆 · 弩藏品", url: "https://vive.cultura.gov.it/en/catalog/crossbow" }],
  ["longbow", "英国长弓", "English longbow · replica", "英国", "1893年入藏复原件", "longbow", "一根窄木弓拉成长弧，两端由浅色弦相连，中间缠着深色握带。参考博物馆的历史长弓复原件，保持朴素木纹。", prm("europe", "arms-and-armour-europe-171")],
];
export const WEAPONS = [...guns.map((a) => [a, "枪械"]), ...arms.map((a) => [a, "武器"])].map(([row, category]) => {
  const [key, name, scientific, origin, era, profile, note, source] = row;
  const pistol = /^(wheellock|flintlock|duelling|colt-|webley|mauser-c96|luger|m1911|nambu)/.test(profile);
  const compact = ["stiletto", "kukri", "tanto", "kris", "katar"].includes(profile);
  return {
    id: "weapon-" + key, name, scientific, aliases: scientific + " " + origin + " " + era,
    category, origin, era, profile, weapon: true, detail: true,
    w: profile === "wheellock" ? 52 : pistol ? 42 : compact ? 44 : profile === "wakizashi" ? 52 : profile === "mosin" ? 76 : 68,
    h: profile === "crossbow" ? 38 : ["sten", "thompson", "ppsh", "shamshir"].includes(profile) ? 32 : 28,
    note, sources: [source],
  };
});
const C = { dark: "#414d47", metal: "#69746b", light: "#a5ad9b", edge: "#c0c3a9", wood: "#8e7358", woodDark: "#665443", woodLight: "#a18a69", brass: "#b0a06c", cloth: "#697a64" };
// Integer scanlines avoid antialiasing; these silhouettes share the roof's muted palette.
function polygon(c, points, color) {
  c.fillStyle = color;
  for (let y = Math.min(...points.map(p => p[1])); y < Math.max(...points.map(p => p[1])); y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y + .5 && y2 > y + .5) || (y2 <= y + .5 && y1 > y + .5)) xs.push(x1 + (y + .5 - y1) * (x2 - x1) / (y2 - y1));
    }
    xs.sort((a,b) => a-b);
    for (let i = 0; i + 1 < xs.length; i += 2) c.fillRect(Math.round(xs[i]), y, Math.round(xs[i+1]) - Math.round(xs[i]), 1);
  }
}
function pixels(c, x1, y1, x2, y2, color, width = 1) {
  c.fillStyle = color;
  let x = x1, y = y1, dx = Math.abs(x2-x1), dy = -Math.abs(y2-y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1, e = dx+dy;
  for (;;) { c.fillRect(x,y,width,width); if (x===x2 && y===y2) break; const twice=e*2; if(twice>=dy){e+=dy;x+=sx;}if(twice<=dx){e+=dx;y+=sy;} }
}
function draw(c, a, shadow) {
  const p = a.profile, col = (key) => shadow ? C.dark : C[key];
  const r = (x,y,w,h,key="metal") => { c.fillStyle=col(key);c.fillRect(x,y,w,h); };
  const poly = (points,key="metal") => polygon(c,points,col(key));
  const l = (x,y,xx,yy,key="metal",w=1) => pixels(c,x,y,xx,yy,col(key),w);
  const loop = (x,y,w,h,key="dark") => { r(x,y,w,1,key);r(x,y+h-1,w,1,key);r(x,y,1,h,key);r(x+w-1,y,1,h,key); };
  const grip = (x,y,w,h,key="wood") => { poly([[x,y],[x+w,y],[x+w-2,y+h],[x-3,y+h]],key);for(let j=2;j<h;j+=3)r(x-1,y+j,w,1,"woodDark"); };
  if (a.category === "枪械") {
    if (["wheellock","flintlock","duelling"].includes(p)) {
      const long = p==="duelling";
      poly([[-17,-1],[-8,-4],[3,-3],[4,1],[-6,2],[-10,10],[-17,9],[-15,4]],"woodDark");
      poly([[-15,-1],[-8,-3],[4,-2],[3,1],[-8,3],[-11,8],[-15,7]],"wood");
      r(-6,-4,p==="wheellock"?30:long?24:22,3);r(-5,-4,p==="wheellock"?29:long?23:21,1,p==="flintlock"?"brass":"light");loop(-8,1,10,5,"brass");r(-6,-6,2,4,"dark");r(-3,-7,4,2,"dark");
      if(p==="wheellock"){poly([[-7,-2],[-4,-5],[0,-3],[0,1],[-4,2]],"brass");for(let x=-14;x<2;x+=4)r(x,0,2,1,"edge");}
      if(long)r(9,-5,6,1,"dark");return;
    }
    if (/^(colt-|webley)/.test(p) && p!=="colt-1903") {
      const short=p==="colt-1849", army=p==="colt-1860", heavy=p==="webley-v", saa=p==="colt-saa";
      const end=short?11:heavy?14:18;
      grip(-13,1,8,9,heavy?"woodDark":"wood");r(-11,-4,11,7,"dark");r(-10,-4,9,5);r(-9,-3,7,1,"light");
      for(let x=-8;x<-1;x+=3)r(x,-1,1,3,"dark");r(0,-4,end,army?3:4);r(1,-4,end-1,1,"light");r(end-2,-6,2,2,"dark");r(-12,-7,3,4,"dark");loop(-6,3,8,5,heavy?"metal":"brass");
      if(!saa&&!heavy){r(-1,1,end-1,1,"metal");r(end-3,-1,2,3,"dark");}
      if(saa)r(2,0,12,2,"dark");if(heavy){r(-12,-6,17,2,"metal");loop(-13,10,4,3,"brass");}return;
    }
    if (["mauser-c96","luger-p08","m1911","nambu-14","colt-1903"].includes(p)) {
      const broom=p==="mauser-c96", luger=p==="luger-p08", nambu=p==="nambu-14", pocket=p==="colt-1903";
      grip(-12,0,broom?6:8,broom?11:9,broom||luger||nambu?"wood":"woodDark");loop(-7,1,8,nambu?7:5);
      if(broom){r(-10,-5,14,6,"dark");r(-8,-4,12,3);r(4,-4,14,2);r(-1,0,6,7);r(1,1,2,5,"light");r(-14,-7,4,3);}
      else if(luger||nambu){r(-10,-5,15,5);r(5,-4,13,2);r(-7,-7,nambu?6:9,2,"dark");r(nambu?-10:-5,-6,4,2,"light");if(nambu)r(-12,-3,2,3,"brass");}
      else{r(-13,-6,pocket?26:31,6,"dark");r(-12,-5,pocket?24:28,3);r(-10,-5,3,3,"light");r(12,-7,2,1);r(-5,-7,3,1);r(1,-4,5,1,"dark");}
      r(16,-5,2,1,"dark");return;
    }
    const old=["matchlock","blunderbuss","brown-bess","enfield-1853"].includes(p);
    const short=["m1-carbine","mp40","sten"].includes(p);
    const len=p==="mosin"?35:p==="kar98k"?26:short?24:30;
    if(p==="sten"||p==="mp40") {
      loop(-29,-1,13,5);l(-28,4,-17,-1);r(-16,-4,26,5,"dark");r(-15,-4,24,2);r(10,-3,16,2);r(24,-5,2,3);grip(-13,1,6,8,"dark");
      if(p==="sten"){r(-1,-12,5,11,"dark");r(0,-11,2,8);r(8,-4,4,5);}
      else{r(-1,0,5,11,"dark");r(0,1,2,8);r(12,-4,2,6,"woodDark");}return;
    }
    poly([[-30,-1],[-18,-3],[-11,-1],[-6,1],[-14,4],[-22,8],[-30,7]],"woodDark");
    poly([[-29,0],[-18,-2],[-10,0],[-13,3],[-23,6],[-29,5]],"wood");r(-30,0,2,6,"dark");
    if(p==="matchlock") {poly([[-29,0],[-20,-2],[-12,-1],[-20,4],[-25,8],[-29,6]],"wood");r(-17,-2,45,5,"woodDark");r(-15,-4,45,3);r(-14,-4,43,1,"light");l(-10,-6,-7,-3,"brass",2);loop(-15,3,8,4,"brass");r(17,-2,2,3,"brass");return;}
    const lever=p==="henry"||p==="winchester", drum=p==="thompson"||p==="ppsh", ak=p==="ak47";
    if(old)r(-17,-1,p==="blunderbuss"?28:44,4,"wood");else{r(-13,-1,19,5,"wood");r(8,-2,short?10:15,4,"wood");}
    r(-15,-4,len+15,3,"dark");r(-13,-4,len+12,1,"light");
    r(-14,-3,lever?14:16,4, p==="henry"?"brass":"metal");loop(-13,3,lever?13:8,5,lever?"brass":"dark");
    if(p==="blunderbuss") {poly([[4,-4],[24,-7],[28,-6],[28,4],[23,4],[4,0]],"brass");r(25,-5,3,8,"dark");return;}
    if(old) {r(-13,-6,3,4,"dark");r(-10,-7,3,2);for(const x of p==="enfield-1853"?[-4,10,23]:[14,23])r(x,-3,2,7,p==="brown-bess"?"brass":"dark");r(-26,5,3,2,"brass");}
    else if(lever){r(0,0,28,2);r(1,0,26,1,"light");r(4,-2,12,4,"wood");r(-12,-2,4,2,"dark");}
    else if(drum) {poly([[-5,2],[6,2],[10,5],[9,10],[5,12],[-3,12],[-7,9],[-8,5]],"dark");r(-4,4,10,6);r(-2,5,6,1,"light");grip(-16,2,5,7);
      if(p==="thompson"){grip(15,1,5,9);for(let x=15;x<29;x+=3)r(x,-4,1,4,"dark");}
      else{r(6,-4,22,4);for(let x=9;x<28;x+=4)r(x,-3,2,1,"dark");poly([[28,-5],[30,-4],[28,0],[26,0]],"dark");}}
    else if(ak) {grip(-14,2,5,8);poly([[-2,0],[4,0],[5,6],[9,11],[5,12],[0,8],[-2,4]],"dark");l(0,2,1,6);l(1,6,5,10);r(5,-7,17,2,"dark");r(20,-6,2,3);r(26,-6,2,3);}
    else {if(["lee-enfield","m1-carbine"].includes(p))r(-3,2,7,p==="lee-enfield"?7:5,"dark");r(-10,-5,11,2,"dark");if(!["garand","m1-carbine"].includes(p)){l(-5,-2,-3,2,"light");r(-4,1,3,2,"dark");}for(const x of p==="arisaka-38"?[-2,16,24]:[12,23])r(x,-3,2,5,"dark");if(p==="garand")r(26,-5,2,6,"metal");}
    r(len-2,-5,2,2,"dark");return;
  }
  if(p==="longbow") {const pts=[[-29,-6],[-23,-3],[-14,0],[0,2],[14,0],[23,-3],[29,-6]];for(let i=1;i<pts.length;i++)l(...pts[i-1],...pts[i],"wood",2);l(-28,-5,28,-5,"edge");r(-3,0,6,4,"woodDark");return;}
  if(p==="crossbow") {r(-26,-2,49,5,"woodDark");r(-25,-2,47,2,"wood");r(17,-15,3,30,"dark");l(18,-15,22,-7,"metal",2);l(22,-7,22,7,"metal",2);l(22,7,18,15,"metal",2);l(18,-14,-1,0,"edge");l(-1,0,18,14,"edge");r(-5,-2,5,4,"brass");loop(24,-4,6,8);r(-22,1,8,3,"woodLight");return;}
  if(["halberd","axe","mace","hammer"].includes(p)) {
    r(-28,-1,48,3,"woodDark");r(-27,-1,46,1,"woodLight");r(-27,1,6,2,"dark");r(12,-2,3,5,"brass");
    if(p==="halberd") {r(17,-5,4,11);poly([[19,-5],[25,-8],[30,0],[25,3],[19,4]],"light");poly([[17,-4],[10,-8],[13,-2],[17,0]],"dark");poly([[20,-1],[31,0],[21,2]],"edge");}
    if(p==="axe") {poly([[15,-3],[20,-5],[28,-9],[31,-6],[29,6],[26,9],[20,5],[15,3]]);l(29,-6,27,7,"light",2);r(14,-4,3,8,"dark");}
    if(p==="mace") {poly([[17,-6],[22,-8],[27,-5],[29,0],[26,6],[21,8],[16,5],[14,0]],"brass");r(20,-6,3,13,"woodDark");l(15,-4,27,5,"light");l(16,5,26,-5,"light");for(let x=-24;x<-12;x+=3)r(x,-1,1,3,"brass");}
    if(p==="hammer") {r(18,-7,5,14);r(17,-8,8,3,"light");poly([[20,1],[14,3],[12,7],[18,5],[22,3]],"dark");poly([[21,-2],[31,0],[21,2]],"light");r(-13,-2,2,5,"brass");}return;
  }
  const compact=["stiletto","kukri","tanto","kris","katar"].includes(p);
  const start=compact?-5:p==="wakizashi"?-10:-14,end=compact?18:p==="wakizashi"?22:30;
  if(p==="katar") {r(-18,-7,16,2,"brass");r(-18,6,16,2,"brass");r(-14,-5,2,11,"woodDark");r(-10,-5,2,11,"brass");poly([[-3,-6],[19,0],[-3,7]],"metal");l(-2,0,17,0,"edge");return;}
  if(p==="kukri") {grip(-18,-1,12,4);poly([[-6,-2],[1,-1],[7,3],[18,3],[15,8],[7,10],[0,5],[-6,2]],"metal");l(-4,-2,2,1,"light");l(2,1,9,4,"light");l(9,4,17,4,"light");return;}
  if(p==="kris") {poly([[-18,-3],[-12,-5],[-9,-3],[-10,0],[-5,2],[-6,5],[-13,3],[-16,1]],"woodDark");r(-7,-3,2,7,"brass");const pts=[[-5,0],[-1,-2],[3,1],[7,-1],[11,2],[15,0],[19,0]];for(let i=1;i<pts.length;i++)l(...pts[i-1],...pts[i],"metal",3);for(let i=1;i<pts.length;i++)l(...pts[i-1],...pts[i],"light");return;}
  const curve={katana:3,wakizashi:2,tanto:0,sabre:5,talwar:6,shamshir:9}[p]||0;
  const guard=compact?-7:p==="wakizashi"?-12:-16;
  const gripStart=compact?-17:p==="wakizashi"?-22:-28;
  r(gripStart,-2,guard-gripStart,4,p==="sabre"?"edge":p==="bronze"?"brass":"woodDark");
  r(guard,-5,2,10,p==="bronze"?"brass":"metal");r(gripStart-2,-2,2,4,"brass");
  if(p==="jian") {for(const y of [-4,4]){r(-28,y-1,12,3,"wood");r(-17,y-4,2,8,"brass");poly([[-14,y-2],[24,y-1],[30,y], [24,y+2],[-14,y+2]]);l(-13,y,28,y,"light");}return;}
  if(p==="bronze") {poly([[-14,-2],[-1,-5],[18,-4],[30,0],[18,5],[-1,5],[-14,2]],"brass");l(-14,0,29,0,"light");r(-3,-3,6,1,"cloth");return;}
  if(curve) {for(let x=start;x<end;x++){const t=(x-start)/(end-start), y=Math.round(curve*t*t);r(x,y-1,1,p==="shamshir"?3:4,"metal");r(x,y-1,1,1,"light");}l(end-4,curve+1,end,curve-1,"light");}
  else{poly([[start,-2],[end-5,-1],[end,0],[end-5,2],[start,2]]);l(start,0,end-1,0,"light");}
  if(["katana","wakizashi","tanto"].includes(p)) {r(guard,-4,2,8,"brass");for(let x=gripStart+2;x<guard;x+=3)r(x,-1,1,2,"cloth");r(guard+2,-2,2,4,"brass");}
  if(p==="rapier") {loop(-29,-5,15,10);l(-27,-5,-17,4,"light");l(-28,4,-16,-5,"light");r(-30,-1,2,3,"brass");}
  if(p==="basket") {loop(-30,-6,15,12);for(let x=-28;x<-16;x+=4)l(x,-5,x+2,4);r(-29,-4,12,1,"light");}
  if(p==="sabre") {l(-28,3,-27,7,"brass");l(-27,7,-16,4,"brass");}
  if(p==="talwar") {r(-30,-5,3,10,"brass");r(-25,-1,7,2,"wood");r(guard,-5,2,10,"brass");}
  if(p==="shamshir") {poly([[-30,-5],[-26,-5],[-24,-2],[-17,-1],[-17,2],[-27,1]],"wood");}
}
export function paintWeapon(c, a) {
  c.save();c.translate(1,2);c.globalAlpha *= .2;draw(c,a,true);c.restore();draw(c,a,false);
}
