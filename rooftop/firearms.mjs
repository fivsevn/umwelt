// Additional records use museum accession pages and the maker's model pages.
const nam = id => ({label:"英国国家陆军博物馆 · 藏品记录",url:`https://collection.nam.ac.uk/detail.php?acc=${id}`});
const source = (label,url) => ({label,url});
const glock = slug => source("GLOCK 官方 · 型号与外形资料",`https://eu.glock.com/en/products/pistols/${slug}`);
// Geometry describes visible form, never operation or performance.
const records = [
  ["adams-1851","迪恩亚当斯1851左轮","Deane–Adams revolver","英国","约1851年藏品","revolver","闭合框架包住转轮，短促枪管接着下弯木柄。参考迪恩亚当斯早期左轮，转轮上方的连续金属线与柯尔特开放式框架不同。",nam("1963-12-251-271"),{barrel:15,grip:9,frame:1}],
  ["colt-new-service","柯尔特New Service左轮","Colt New Service","美国","1917年藏品","revolver","较大的转轮、平直枪管和略圆的深色握柄组成厚实轮廓。参考1917年藏品，握柄底端的小环与顶部框架留在像素图里。",nam("1963-12-251-216"),{barrel:18,grip:11,frame:2}],
  ["webley-fosbery","韦伯利福斯伯里左轮","Webley–Fosbery","英国","约1910年藏品","revolver","枪身上下分成两层，转轮外表有醒目的曲折槽纹。参考格林尼治藏品，六面枪管、核桃木柄和底端小环组成它的特别外形。",source("英国皇家格林尼治博物馆 · Webley–Fosbery","https://www.rmg.co.uk/collections/objects/rmgc-object-2410"),{barrel:19,grip:10,frame:3}],
  ["hi-power","勃朗宁Hi-Power手枪","Browning Hi-Power No.2 Mk I*","比利时设计／加拿大制造","20世纪藏品","pistol","较长滑套接宽木握柄，外露的小击锤位于尾部。参考英格利斯制造的Hi-Power藏品，前端较窄、后段饱满的比例保留下来。",nam("1985-02-83-1"),{model:"hi-power"}],
  ["walther-p38","瓦尔特P38手枪","Walther P38","德国","1943年藏品","pistol","枪管前半段露在滑套外，后端是较宽的枪身和带横纹的深色握柄。细前端与宽后段使它与方盒形手枪很好区分。",nam("1964-05-60-77"),{model:"p38"}],
  ["walther-ppks","瓦尔特PPK/S手枪","Walther PPK/S","德国式样","20世纪型号","pistol","短滑套搭配比PPK更长的PP型握柄，是一种紧凑的组合。参考博物馆的PPK/S，银灰枪身和暗色握柄以小色块分开。",source("美国国家枪械博物馆 · Walther PPK/S","https://www.nramuseum.org/guns/the-galleries/modern-firearms-1950-to-present/case-53-arms-of-law-enforcement/walther-ppk-s-semi-automatic-pistol.aspx"),{model:"ppks"}],
  ["beretta-1934","伯莱塔M1934手枪","Beretta Model 1934","意大利","1941年藏品","pistol","小巧枪身上有敞开的滑套线，前方圆枪管在两段金属之间露出来。握柄底端略向前翘，深木色与暗灰色形成短而宽的轮廓。",nam("1964-05-59-47-1"),{model:"beretta"}],
  ["remington-army","雷明顿新陆军左轮","Remington New Model Army","美国","19世纪藏品","revolver","转轮上方有完整顶框，多面长枪管下面是一条细杆。参考阿根廷国家历史博物馆藏品，黄铜护圈与暖木握柄保留在钢灰色轮廓里。",source("阿根廷国家历史博物馆 · MHNA6588","https://patrimonioargentino.cultura.gob.ar/index.php/Detail/objects/79728"),{barrel:21,grip:9,frame:4}],
  ["enfield-no2","恩菲尔德No.2左轮","Enfield No.2 Mk I","英国","约1931年藏品","revolver","转轮和上折式框架形成短而粗的枪身，握柄从尾端向下伸。参考No.2 Mk I藏品，以较短枪管、方圆握柄与细环区别于大型韦伯利。",nam("1978-11-40-1"),{barrel:12,grip:8,frame:5}],
  ["dreyse-1841","德莱赛1841针发步枪","Dreyse Model 1841","普鲁士","1841年式","historic","长木托托着细枪管，圆管形机匣在中段露出，侧面有直枪栓柄。参考布拉格军事历史研究所的1841式藏品，保留早期步枪的修长比例。",source("布拉格军事历史研究所 · 1841式步枪","https://www.vhu.cz/en/exhibit/02-pruska-pechotni-puska-vzor-1841/"),{model:"dreyse",end:34}],
  ["chassepot","夏塞波1866步枪","Chassepot Model 1866","法国","1868年藏品","historic","细长木托、三处金属箍带和中段细直枪栓组成平缓轮廓。参考新西兰国家博物馆1868年制造的藏品，木、钢和黄铜的颜色轻轻分开。",source("新西兰国家博物馆Te Papa · Chassepot","https://collections.tepapa.govt.nz/object/48154"),{model:"chassepot",end:33}],
  ["snider","斯奈德恩菲尔德步枪","Snider–Enfield Mk II","英国","约1867年藏品","historic","保留了恩菲尔德长木托与箍带，机匣处则有一个侧翻闭锁块的外形。参考Mk II藏品，尾部短矩形金属块是图里的识别点。",nam("1993-06-172-1"),{model:"snider",end:31}],
  ["martini-henry","马蒂尼亨利Mk I步枪","Martini–Henry Mk I","英国","1873年藏品","historic","短方机匣夹在枪托与长前木托之间，下方是一道杠杆护圈。参考Mk I第二式样藏品，连续木色中留出清楚的深灰矩形。",nam("1995-01-208-1"),{model:"martini",end:30}],
  ["springfield-1903","斯普林菲尔德1903步枪","Springfield Model 1903","美国","1903年式","historic","直枪托接修长护木，后部弯枪栓与前方箍带形成少数凸点。参考斯普林菲尔德兵工厂博物馆的历史介绍，枪身保持朴素的木钢两色。",source("美国国家公园局 · 斯普林菲尔德1903","https://www.nps.gov/spar/learn/historyculture/the-1903-springfield-rifle.htm"),{model:"springfield",end:28}],
  ["spencer","斯宾塞连发步枪","Spencer repeating rifle","美国","约1865年藏品","historic","粗短机匣、枪身下方的杠杆和木枪托组成紧凑后段，前方枪管较长。参考1865年前后的藏品，护圈与机匣留成独立金属轮廓。",nam("1988-05-58-1"),{model:"spencer",end:25}],
  ["winchester-1897","温彻斯特1897霰弹枪","Winchester Model 1897","美国","1897年式","shotgun","外露击锤、较短前木握把和枪管下方的细管线，组成泵动霰弹枪的特征轮廓。参考史密森尼藏品，深灰机匣夹在两段木色之间。",source("史密森尼美国历史博物馆 · Winchester 1897","https://www.si.edu/object/winchester-model-1897-slide-action-riot-shotgun%3Anmah_417434"),{model:"pump"}],
  ["double-shotgun","并列双管霰弹枪","Double-barrelled shotgun","英国","约1930年藏品","shotgun","两根枪管并排形成宽长前段，弯木托接着较小机匣，柄下只有短护圈。参考本土防卫志愿队使用的双管藏品，保留成对枪口的外形。",nam("1983-05-73-1"),{model:"double"}],
  ["l1a1","L1A1自装填步枪","L1A1 · FN FAL family","英国／比利时式样","1959年藏品","modern","独立木枪托、木前护手与向下的长弹匣，沿着细长枪身排列。参考英国早期L1A1藏品，核桃木配件和细长前端让它显得温暖而舒展。",nam("1993-07-137-1"),{model:"fal"}],
  ["g3","HK G3步枪","Heckler & Koch G3","德国","约1967年藏品","modern","长而平直的钢制机匣配木枪托、带孔前护手与绿色握柄。参考澳大利亚战争纪念馆藏品，前方圆形瞄具轮廓和直弹匣保留在图中。",source("澳大利亚战争纪念馆 · G3","https://www.awm.gov.au/collection/C268253"),{model:"g3"}],
  ["m16","M16 AR-15步枪","M16 / AR-15","美国","约1960年藏品","modern","直线枪托、提把、三角形前护木和独立握柄构成长而轻的轮廓。参考早期M16藏品，提把留成小孔，深色前护木与枪管分开。",nam("1978-11-49-1"),{model:"m16"}],
  ["l85a1","SA80 L85A1步枪","SA80 L85A1","英国","约1990年藏品","modern","握柄位于前方，弹匣留在后段枪托下，构成紧凑的无托式比例。参考带Trilux瞄具的L85A1藏品，绿色护木和上方短瞄具形成两层轮廓。",nam("1990-02-58-1"),{model:"l85"}],
  ["aug","斯太尔AUG A1步枪","Steyr AUG A1","奥地利","现代型号","modern","大块绿色枪托连着前握柄，弹匣位于握柄后方，上方细瞄具与提把结合。参考斯太尔官方AUG A1外形，短身、长前端和大护圈很好辨认。",source("STEYR ARMS 官方 · AUG A1","https://www.steyr-arms.com/en/military-law-enforcement/assault-rifles/"),{model:"aug"}],
  ["mp5","HK MP5冲锋枪","Heckler & Koch MP5","德国","20世纪藏品","smg","短枪管、宽前护手与独立握柄围着紧凑机匣，弹匣略弯。参考史密森尼MP5藏品，圆形前瞄具和收拢的枪托线让外形清楚可认。",source("史密森尼美国历史博物馆 · MP5","https://americanhistory.si.edu/collections/object/nmah_1050873"),{model:"mp5"}],
  ["pam1","阿根廷PAM1冲锋枪","PAM1","阿根廷","1982年藏品","smg","圆管形枪身接着直弹匣和细钢丝枪托，外形接近美国M3。参考阿根廷PAM1藏品，侧面小折柄和薄枪托只用几条暗色线表现。",nam("1984-06-140-1"),{model:"pam"}],
  ["bren","布伦Mk I轻机枪","Bren Mark I","英国／捷克式样","1942年藏品","machine","上方弯弹匣、细长枪管和前端两脚架构成布伦的鲜明轮廓。参考Mk I藏品，木枪托、顶部弹匣与枪身侧面小提把分成三个层次。",nam("1964-05-60-10"),{model:"bren"}],
  ["lewis","刘易斯Mk I轻机枪","Lewis Mark I","英国／美国设计","1914年藏品","machine","粗圆枪管护套和上方扁圆盘形弹匣，使前后两段宽度差别明显。参考刘易斯Mk I藏品，木托与短握柄留着暗暖色。",nam("1978-11-58-1"),{model:"lewis"}],
  ["vickers","维克斯Class C机枪","Vickers Class C","英国","约1910年藏品","machine","长圆水冷套接方形后机匣，尾端是成对小握把。参考Class C藏品，黄铜色箍圈和圆套的窄亮边点出旧金属质地。",nam("1967-10-47-1"),{model:"vickers"}],
  ["maxim","马克沁Mk I机枪","Maxim Mark I","英国","1900年藏品","machine","宽水冷套与高大的方形后机匣形成两段轮廓，底部留有安装座。参考改装Mk I藏品，套筒、铜色接口和尾部握把都以低饱和色块表现。",nam("1966-05-1-1"),{model:"maxim"}],
  ["bar","勃朗宁M1918自动步枪","Browning Automatic Rifle M1918","美国","约1940年藏品","machine","长木枪托、较宽机匣和短而宽的下置弹匣连成坚实轮廓，前木护手位于细枪管下。参考M1918藏品，木色比普通长步枪更分段。",nam("1979-10-60-1"),{model:"bar"}],
  ["hotchkiss","哈奇开斯M1909轻机枪","Hotchkiss M1909 Mk I*","法国设计／英国式样","1917年藏品","machine","枪管周围有一圈圈散热片，侧置供弹条用短铜色横线点出。参考这件Mk I*藏品的特别式样，尾部没有枪托，枪身下只留着短握柄。",nam("1978-11-61-1"),{model:"hotchkiss"}],
  ["glock-17","格洛克G17 Gen5","GLOCK 17 Gen5","奥地利","第五代型号","glock","标准尺寸的方形滑套接较长聚合物握柄，前后刻纹只留下少量细线。参考官方G17 Gen5，黑色改用游戏里的深灰绿表现，保留平直外形。",glock("g17-gen5"),{slide:32,gripHeight:16,gripWidth:10}],
  ["glock-19","格洛克G19 Gen5","GLOCK 19 Gen5","奥地利","第五代型号","glock","紧凑型G19的滑套和握柄都比G17短，仍保留同样的矩形线条与斜握柄。参考官方第五代外形，通过长短比例与G17区分。",glock("g19-gen5"),{slide:30,gripHeight:14,gripWidth:10}],
  ["glock-26","格洛克G26 Gen5","GLOCK 26 Gen5","奥地利","第五代型号","glock","小型G26的握柄明显缩短，枪身显得短而厚，前段也更收拢。参考官方第五代外形，最醒目的识别点是短握柄与较宽滑套的组合。",glock("g26-gen5"),{slide:27,gripHeight:10,gripWidth:10}],
  ["glock-34","格洛克G34 Gen5 MOS","GLOCK 34 Gen5 MOS","奥地利","第五代MOS型号","glock","长滑套向前伸出，配标准长度握柄，顶部留着MOS盖板的小平面。参考官方G34 Gen5 MOS，拉长的前段与G17、G19形成明显差别。",glock("g34-gen5-mos"),{slide:36,gripHeight:16,gripWidth:10,mos:true}],
  ["glock-43","格洛克G43","GLOCK 43","奥地利","Slimline型号","glock","G43属于较窄的小型系列，短滑套配细握柄，整体比G26显得纤细。参考官方外形，握柄宽度和短前端分别用更少的像素表现。",glock("g43"),{slide:27,gripHeight:11,gripWidth:8,slim:true}],
  ["glock-43x","格洛克G43X Rail","GLOCK 43X Rail","奥地利","Slimline Rail型号","glock","短滑套配较长的细握柄，让G43X与G43的比例一眼可分。参考官方Rail型，前下方还保留一小段导轨线；握柄保持Slimline系列的窄轮廓。",glock("g43x-rail"),{slide:27,gripHeight:14,gripWidth:8,slim:true,rail:true}],
];
export const FIREARMS = records.map(([key,name,scientific,origin,era,family,note,ref,geometry]) => ({
  id:"weapon-"+key,name,scientific,origin,era,category:"枪械",weapon:true,detail:true,
  aliases:scientific+" "+origin+" "+era, note,sources:[ref],
  firearmArt:{family,...geometry},
  w: ["pistol","revolver","glock"].includes(family) ? 50 : 78,
  h: ["machine","modern","glock"].includes(family) ? 38 : 32,
}));
export function paintAdditionalFirearm(a, {r,poly,l,loop,grip}) {
  const art=a.firearmArt;
  if(!art)return false;
  const {family,model}=art;
  if(family==="glock") {
    const x=-Math.round(art.slide/2),g=x+4,h=art.gripHeight,w=art.gripWidth;
    r(x,-10,art.slide,5,"dark");r(x+1,-10,art.slide-2,1,"metal");r(x+2,-8,art.slide-4,2,"metal");
    r(x+2,-5,art.slide-3,3,"dark");poly([[g,-3],[g+w,-3],[g+w-3,h-3],[g-4,h-3]],"dark");
    poly([[g+1,-2],[g+w-2,-2],[g+w-4,h-5],[g-2,h-5]],"metal");
    for(let yy=0;yy<h-5;yy+=3)r(g-1,yy,w-3,1,"dark");
    loop(g+w-1,-3,8,7,"dark");r(g+w,-3,5,1,"metal");l(g+w+3,-2,g+w+2,1,"dark");
    r(g-4,h-4,w+1,2,"dark");r(x+1,-12,3,2,"dark");r(x+art.slide-4,-12,2,2,"dark");
    for(let xx=x+3;xx<x+8;xx+=2)r(xx,-9,1,3,"dark");
    if(!art.slim)for(let xx=x+art.slide-8;xx<x+art.slide-3;xx+=2)r(xx,-9,1,3,"dark");
    if(art.mos)r(x+7,-11,7,1,"light");
    if(art.rail)r(x+art.slide-8,-2,6,1,"metal");
    if(art.slim)r(x+art.slide-6,-5,5,1,"metal");return true;
  }
  if(family==="revolver") {
    grip(-16,0,art.frame===2?10:8,art.grip,"woodDark");r(-12,-6,12,8,"dark");r(-11,-5,10,6);r(-10,-5,8,1,"light");
    r(-14,-8,18,2,"dark");r(0,-6,art.barrel,4);r(1,-6,art.barrel-2,1,"light");r(art.barrel-3,-8,2,2,"dark");r(-16,-9,3,4,"dark");loop(-7,2,9,6,art.frame===4?"brass":"metal");
    for(let x=-9;x<-1;x+=3)r(x,-3,1,3,"dark");
    if(art.frame===3){r(-14,0,14,2,"metal");l(-9,-4,-6,-2,"light");l(-6,-2,-3,-4,"light");}
    if(art.frame===4){r(1,-1,18,1,"dark");r(16,-2,2,3,"metal");}
    if(art.frame===1)poly([[-17,4],[-13,3],[-12,9],[-17,9]],"wood");
    if(art.frame===5)r(-16,1,7,6,"wood");
    if([2,3,5].includes(art.frame))loop(-18,art.grip-1,4,3,"brass");return true;
  }
  if(family==="pistol") {
    const small=model==="ppks"||model==="beretta",end=small?12:19;
    grip(-16,-1,9,small?10:12,"woodDark");loop(-7,1,10,6,"dark");r(-16,-8,small?28:35,6,"dark");r(-14,-7,small?24:31,3);r(-15,-9,3,2,"dark");
    if(model==="p38"){r(3,-8,16,6,"woodDark");r(1,-7,19,3);r(0,-9,3,3,"metal");r(-14,-5,3,3,"light");}
    if(model==="hi-power"){r(-18,-10,3,4,"dark");poly([[12,-8],[19,-7],[19,-3],[12,-3]],"metal");r(-14,1,5,8,"wood");}
    if(model==="ppks"){r(-15,-8,26,2,"light");r(-15,8,8,2,"dark");}
    if(model==="beretta"){r(-1,-8,11,2,"dark");r(0,-7,10,1,"light");poly([[-17,8],[-7,7],[-5,10],[-17,10]],"wood");}
    for(let x=-13;x<-7;x+=2)r(x,-6,1,3,"dark");r(end-2,-10,2,2,"dark");return true;
  }
  const stock=(tone="wood",end=-10) => {
    poly([[-35,-1],[-23,-3],[end,-1],[end+3,2],[-22,6],[-35,6]],"woodDark");
    poly([[-33,0],[-23,-2],[end,-1],[end,2],[-23,4],[-33,4]],tone);r(-35,0,2,5,"dark");
  };
  if(family==="historic") {
    stock();r(-15,-3,art.end+15,3,"dark");r(-13,-3,art.end+11,1,"light");r(-16,0,43,4,"wood");
    r(-18,-4,16,5,"metal");loop(-16,3,10,5,"dark");
    const bands=model==="chassepot"?[-8,8,23]:model==="springfield"?[10,24]:[5,20];
    for(const x of bands)r(x,-3,2,7,"dark");r(art.end-2,-5,2,2,"dark");
    if(model==="dreyse"){r(-17,-5,18,2);l(-8,-1,-6,3,"light");r(-7,2,3,2,"dark");}
    if(model==="chassepot"){r(-16,-5,16,2,"dark");l(-6,-1,-3,2,"light");}
    if(model==="snider"){r(-17,-5,10,5,"dark");r(-16,-5,7,1,"brass");r(-17,-8,3,3,"dark");}
    if(model==="martini"){r(-17,-4,13,6,"dark");r(-15,-3,10,3);loop(-18,3,15,5);r(-6,2,2,4,"metal");}
    if(model==="springfield"){r(-13,-5,11,2);l(-7,-1,-5,3,"metal");r(-6,2,3,2,"dark");r(7,-5,3,2);}
    if(model==="spencer"){r(-19,-5,16,7);r(-18,-5,12,1,"light");loop(-20,3,17,7,"metal");r(-17,0,4,2,"dark");r(12,0,10,4,"woodDark");}return true;
  }
  if(family==="shotgun") {
    stock();r(-19,-4,15,6,"dark");r(-17,-4,12,2);loop(-18,3,11,5);
    if(model==="pump"){r(-4,-4,38,3);r(-3,-4,35,1,"light");r(-3,0,32,2,"dark");r(7,0,12,4,"wood");for(let x=8;x<19;x+=3)r(x,1,1,2,"woodDark");r(-20,-7,3,3,"dark");}
    else{r(-4,-4,38,6,"dark");r(-3,-4,36,2);r(-3,0,36,1,"light");r(0,2,13,2,"wood");r(-8,-6,3,2,"dark");}return true;
  }
  if(family==="modern") {
    const bull=model==="l85"||model==="aug";
    if(bull){poly([[-32,-6],[-12,-6],[2,-2],[5,3],[-11,8],[-31,6]],"cloth");r(-31,-4,22,8,"woodDark");r(-29,-5,19,6,"cloth");grip(-1,0,6,11,"cloth");r(-20,2,6,12,"dark");r(-19,3,3,9,"metal");}
    else{stock(model==="m16"?"dark":"wood");grip(-17,1,6,10,model==="g3"?"cloth":"dark");}
    r(-18,-6,bull?35:39,5,"dark");r(-16,-6,30,1,"metal");r(13,-4,22,2);r(31,-6,2,3,"dark");
    if(model==="fal"){r(7,-5,17,5,"wood");r(-6,-1,7,12,"dark");r(-5,0,4,10);r(6,-7,17,2,"dark");r(23,-7,2,5);}
    if(model==="g3"){r(5,-6,19,6,"wood");for(let x=8;x<23;x+=4)r(x,-4,2,1,"dark");r(-8,-1,8,11,"dark");r(-7,1,5,8);loop(28,-8,5,5,"metal");}
    if(model==="m16"){poly([[3,-6],[21,-3],[3,0]],"dark");loop(-17,-11,16,5,"metal");l(28,-8,25,-3,"dark");l(28,-8,31,-3,"dark");r(-7,-1,6,9,"metal");r(-6,0,3,7,"dark");}
    if(model==="l85"){r(4,-4,12,7,"cloth");r(-17,-6,18,3);r(-15,-13,15,3,"dark");r(-10,-10,2,4);r(-1,-13,2,3,"light");loop(-4,3,12,8,"cloth");}
    if(model==="aug"){r(-4,-7,17,4,"cloth");r(-10,-12,18,3,"dark");r(-5,-9,2,3);r(5,-9,2,3);grip(13,1,4,8,"cloth");loop(-4,2,13,8,"cloth");r(-21,4,4,8,"wood");}return true;
  }
  if(family==="smg") {
    loop(-34,0,17,6,"metal");l(-33,5,-18,0);r(-18,-6,31,7,"dark");r(-17,-6,29,2);r(13,-4,19,3);grip(-16,0,7,10,"dark");
    if(model==="mp5"){r(3,-4,15,5,"woodDark");poly([[-4,0],[3,0],[3,8],[6,12],[2,13],[-3,9]],"metal");loop(26,-8,5,5,"metal");r(-8,-8,6,2);}
    else{r(-9,-5,15,6);r(-1,0,5,12,"dark");r(0,1,2,9);l(5,-3,8,1,"dark");r(7,0,2,4,"metal");r(21,-4,2,4,"dark");}return true;
  }
  if(family==="machine") {
    const heavy=model==="vickers"||model==="maxim";
    if(!heavy){if(model!=="hotchkiss")stock();grip(-18,1,5,8);}
    r(-20,-5,29,7,"dark");r(-18,-5,25,2);r(8,-4,27,3);r(32,-6,2,3,"dark");
    if(model==="bren"){poly([[-7,-5],[-7,-15],[-3,-18],[2,-17],[4,-13],[1,-5]],"dark");l(-4,-15,0,-14,"light");loop(4,-9,8,4,"metal");l(21,0,17,13,"metal");l(21,0,27,13,"metal");}
    if(model==="lewis"){r(7,-6,27,7,"dark");r(8,-6,24,2);poly([[-13,-6],[-9,-9],[5,-9],[10,-6],[5,-3],[-9,-3]],"metal");r(-8,-8,13,1,"light");r(3,-2,2,5,"dark");}
    if(heavy){r(-28,-5,17,11,"dark");r(-26,-4,13,7);r(-31,-3,3,10,"woodDark");r(-34,-3,2,9,"wood");r(-21,6,7,5,"dark");r(-11,-5,43,10,"dark");r(-9,-5,38,2,"light");r(-10,-3,40,6);r(-11,-5,2,10,"brass");r(29,-5,2,10,"brass");if(model==="maxim"){r(-28,-9,15,4,"metal");r(-17,1,5,3,"brass");r(7,-4,2,7,"dark");}else{r(-23,-8,4,3,"dark");r(27,-7,2,2);}}
    if(model==="bar"){r(-4,-1,10,10,"dark");r(-3,0,7,8);r(3,-1,15,5,"wood");r(14,-5,3,2,"dark");}
    if(model==="hotchkiss"){for(let x=4;x<20;x+=3)r(x,-7,1,8,"metal");r(-1,-3,13,2,"brass");for(let x=1;x<13;x+=3)r(x,-2,1,2,"woodDark");}return true;
  }
  throw Error("Unknown firearm drawing: " + a.id);
}
