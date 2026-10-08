# 花农时代：器物、材质与空间参考

本轮只更改 rooftop 游戏。全部模型、像素纹理和纹饰由代码生成，没有新增图片素材。

用户提供的 ART OF SULLY 等十二张案例图用于分析视觉语言：厚边与凹面、暖色木头与冷色玻璃、物体底部和接缝的暗部、少量有组织的像素色块。没有复制图中的纹理或模型。

实现取舍：统一像素密度；窄倒角捕捉高光；依据相邻实心构件生成局部接触暗部；少量固定在物体上的抖动；不同陶瓷保留独立器形和绘画色。内外壁、圈足、排水孔、水槽凹腔和盆土分别生成。玉缀等垂枝先从土面越过盆沿，再向下生长；承托面以内不穿过层板，落地的末端沿地面展开。家具移动、旋转时携带支承其上的陈列。

方法参考：

- [Sparseal：Low Poly Pixel Art Workflow](https://sparseal.com/uniform/tutorials/workflow-pixel-art/) — 挤出、内缩、接缝与像素对齐。
- [RuneFist：Ambient Occlusion](https://runefist.com/creator-tools/manual/handpainted-workflow/ambient-occlusion) — 接触和围合暗部保持本地材料色族。

## 新增阳台物件

- **提梁竹篮**：疏编竹篮、厚实口沿和连续提梁，底部留出承托空间。 [传统工艺青山 Square · 別府竹細工](https://kougeihin.jp/craft/0630/)
- **棕榈扫帚**：棕榈纤维束、铜丝绑扎与长木柄；靠在自己的小支座上。 [高田耕造商店 · 棕榈箒](https://takada1948.shop-pro.jp/?pid=179120790)
- **红柄园艺剪**：弯刃、承刃、轴心螺母和两柄之间的弹簧，按园艺剪的结构绘制。 [FELCO · FELCO 2](https://world.felco.com/en-gb/products/felco-2)
- **四色纸风车**：四片折起的纸叶围绕轴心展开；木杆插在一个小底座里。 [おりがみくらぶ · 折纸图解](https://www.origami-club.com/)
- **亚麻色遮阳伞**：八片伞面、内侧伞骨、调节套环和加重底座；按阳台尺度调整比例。 [IKEA · SAMSÖ](https://www.ikea.com/sg/en/p/samsoe-parasol-tilting-beige-10311817/)
- **带龙头雨水桶**：带盖的蓄水桶架在木台上，低位水龙头、接水入口与桶壁加强筋各自连接。 [RHS · Collecting, storing and using water](https://www.rhs.org.uk/garden-jobs/water-collecting-storing-and-using)
- **两级木踏凳**：两级实木踏板、斜腿与横撑；上方留有提手孔，两层均可摆放小盆。 [IKEA · BEKVÄM 装配图](https://www.ikea.com/qa/en/assembly_instructions/bekvaem-step-stool-acacia__AA-444158-10-100.pdf)
- **铁铃与短册**：参考南部铁器吊钟的开口钟体、吊绳和纸短册，配一个独立木支架。 [OIGEN · 南部铁器风铃目录](https://pro.oigen.jp/assets/file/oigen_item202409.pdf)

## 陶瓷参考

2026-10-08逐件核对馆藏尺寸、正面和背面照片。博物馆器物按游戏尺度转译，器形与纹饰经过简化。新增七件栽培钵是花盆改作，排水孔并非原藏品特征；窄颈志野织部花器仅作陈设，不列入换盆选项。

- **常滑烧风格盆**：外缘椭圆盆，矮足与宽口参考常滑盆栽鉢。 [まるたつ · 常滑盆栽鉢](https://marutatu.shop-pro.jp/)；[传统工艺青山 Square](https://kougeihin.jp/craft/0407/)
- **信乐烧风格盆**：宽口、圆腹的育成鉢；参考信乐 ZEN Bowl 的宽深比例。 [ZEN Pottery Labo · Bowl](https://zenpotterylabo.jp/products/zen-bowl-type-7号-無釉)；[传统工艺青山 Square](https://kougeihin.jp/craft/0413/)
- **备前烧风格盆**：保留烧締土肌与火痕，选圆腹收口轮廓转成排水盆。 [しょうざん · 备前植木鉢](https://bizen-shozan.com/bizenyaki-category/floral-organs/flower-pot/)；[传统工艺青山 Square](https://kougeihin.jp/craft/0418/)
- **益子烧风格盆**：参考益子窑元的开形植木鉢，外撇口、收底与纵向削纹。 [よこやま · 开形植木鉢](https://www.shop.tougei.net/view/item/000000000509?category_page_id=ct94)；[传统工艺青山 Square](https://kougeihin.jp/craft/0404/)
- **笠间烧风格盆**：笠间器形多样，选切立圆筒与流釉；不是该产地唯一的器型。 [笠间烧协同组合 · 植木鉢展](https://kasamayaki.or.jp/akiichi/)；[传统工艺青山 Square](https://kougeihin.jp/craft/0403/)
- **美浓烧·织部风格盆**：参考织部四足四方鉢：方口、折角器身与短足，配浓绿釉。 [美浓烧协同组合 · 织部四足四方鉢](https://www.minoyaki.gr.jp/archives/2939)；[传统工艺青山 Square](https://kougeihin.jp/craft/0406/)
- **濑户染付风格盆**：染付蓝枝叶配宽口弧腹；白地留出空白。 [传统工艺青山 Square](https://kougeihin.jp/craft/0409/)
- **九谷烧风格盆**：参考九谷木瓜鉢，四瓣轮廓、低腹与彩绘；改作有排水孔的盆。 [KUTANI SEAL · 木瓜鉢](https://www.kutaniseal.com/items/101475439)；[传统工艺青山 Square](https://kougeihin.jp/craft/0405/)
- **有田烧风格盆**：轮花口沿配薄壁弧腹；参考有田轮花盛鉢后转作园艺盆。 [ARITA PORCELAIN LAB · 轮花盛鉢](https://aritaporcelainlab.com/catalog/jp/20150815/japan_autumn_20150815.pdf)；[传统工艺青山 Square](https://kougeihin.jp/craft/0424/)
- **伊万里烧风格盆**：白瓷、深蓝与赤色分区纹；选带高台的碗形转作排水盆。 [传统工艺青山 Square](https://kougeihin.jp/craft/0424/)
- **波佐见烧风格盆**：参考波佐见「いろは」荞麦杯的收底杯形，青白胎与细竖纹。 [波佐见烧 · いろは器物](https://store.hasamiyaki.jp/html/page84.html)；[传统工艺青山 Square](https://kougeihin.jp/craft/0427/)
- **京烧·清水烧风格盆**：参考京烧菊割高台小鉢，花口与显露的高台让轮廓轻一些。 [やまなか雅陶 · 菊割高台小鉢](https://www.yamanaka-gato.com/product/472)；[传统工艺青山 Square](https://kougeihin.jp/craft/0414/)
- **萩烧风格盆**：参考萩烧窑元的轮花高台鉢，乳白粉釉与花瓣口沿。 [松光山 · 轮花高台鉢](https://shokouzan.stores.jp/items/655b72164e11f10767525274)；[传统工艺青山 Square](https://kougeihin.jp/craft/0419/)
- **唐津烧风格盆**：铁绘草叶与灰黄釉，选弧腹、低高台的碗形转成园艺盆。 [传统工艺青山 Square](https://kougeihin.jp/craft/0425/)
- **砥部烧风格盆**：参考梅山窑玉缘鉢，厚圆口沿、圆腹与青花卷草纹。 [梅山窑 · 玉缘鉢](https://baizangama.jp/catalog/catalog-cat/tamabuchi/)；[传统工艺青山 Square](https://kougeihin.jp/craft/0421/)
- **小石原烧风格盆**：飞铇短点纹沿外撇器壁重复，宽口收底轮廓转作排水盆。 [传统工艺青山 Square](https://kougeihin.jp/craft/0422/)
- **丹波立杭烧风格盆**：参考丹波山椒壶的面取技法，把多面鼓腹和自然流釉转成宽口园艺盆。 [丹波立杭陶磁器协同组合 · 器物与技法](https://tanbayaki.com/tanbayaki/)；[传统工艺青山 Square](https://kougeihin.jp/craft/0415/)
- **伊贺烧风格盆**：粗土肌与不规则灰绿釉；保留手作偏心口沿，宽腹收底。 [传统工艺青山 Square](https://kougeihin.jp/craft/0411/)
- **越前烧风格盆**：参考越前壶的收口、鼓肩与圆腹，开口放宽并加排水孔。 [爱知县陶磁美术馆 · 越前壶](https://jmapps.ne.jp/aitou/det.html?data_id=538)；[传统工艺青山 Square](https://kougeihin.jp/craft/0412/)
- **壶屋烧风格盆**：厚胎圆腹与外翻厚口沿，蓝绿刷绘；以产地器物为风格转译。 [传统工艺青山 Square](https://kougeihin.jp/craft/0431/)
- **普通红陶盆**：朴素红陶，有排水孔；适合大多数中小型植物。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **黑色育苗盆**：轻便塑料盆，有排水孔；适合育苗和中小型植株。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **白色塑料盆**：浅色塑料盆，有排水孔；适合日常盆栽。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **浅陶盘**：浅盘有排水孔，供浅根多肉和低矮草花使用。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **泡沫种植箱**：白色泡沫箱，底部设排水孔；适合葱、薄荷、叶菜和草莓。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **长条种植槽**：长槽有排水孔，留株距种香草、叶菜或草莓。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **深型种植袋**：较深透气种植袋；适合番茄、辣椒和小果树。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **大型深陶盆**：深盆有排水孔；留给灌木、较大根系和酸性介质。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **吊盆**：带排水孔的吊盆，给垂枝留下空间；也可平放在花架上。 [RHS 容器栽培](https://www.rhs.org.uk/container-gardening)
- **志野芒纹浅钵**：16世纪桃山时期。按高6.4厘米、径28厘米校准浅阔器形，长石白釉，芒草铁绘位于钵内；游戏中增设排水孔。 [MIHO MUSEUM · 志野芒文鉢](https://www.miho.jp/booth/html/artcon/00000283.htm)
- **鼠志野撇口四方钵**：16世纪桃山时期。参考高5.8厘米、口径14至14.2厘米的深赤褐釉、白色掻落纹、内卷方口、圆形内底与三足，改作栽培钵。 [MIHO MUSEUM · 鼠志野向付](https://www.miho.jp/booth/html/artcon/00000293.htm)
- **志野铁绘四方向付**：16世纪桃山时期。参考高9.2厘米、口径8.5厘米的四方向付；四面分别简化蛇笼、珠串、堇草与鸢尾铁绘，游戏中增设排水孔。 [MIHO MUSEUM · 志野四方向付](https://www.miho.jp/booth/html/artcon/00000294.htm)
- **锅岛彩绘八角钵**：约1800年江户时期。按高10.2厘米、径21.3厘米校准八角折面与圈足；参考馆藏黑白照中的萝卜枝叶构图，彩色为游戏转译，并非原釉彩复原。 [Met · 八角彩绘钵，约1800年](https://www.metmuseum.org/art/collection/search/63040)
- **锅岛青花几何浅盘**：18世纪江户时期。参考高5.1厘米、径20.6厘米的浅盘：内面为青花留白同心几何纹，背面三组花枝，圈足带梳齿纹；游戏中增设排水孔。 [Met · 几何纹青花盘，18世纪](https://www.metmuseum.org/art/collection/search/50344)
- **九谷赤绘金彩钵**：19世纪早至中期江户时期，馆藏直径45.7厘米。参考内面唐狮、花草与赤绘金彩同心分区；馆方未列高度，游戏腹深和背面绘画为适配。 [Cleveland · Kutani Bowl, 1986.173](https://www.clevelandart.org/art/1986.173)
- **锅岛青瓷三足钵**：约1700年江户时期。参考高8.26厘米、径28.89厘米的轮花口浅钵，内底山亭、篱笆、树木划花及三只鬼面足；游戏中增设排水孔。 [LACMA · Nabeshima Celadon Bowl](https://collections.lacma.org/object/160060)
- **志野织部铁绘花器**：17世纪江户时期。按高20.8、腹径21.6、口径9.7厘米校准鼓腹和窄颈；白釉铁绘，肩部五道凹线作2–1–2分组。曾作花器，不用于换盆。 [MIHO MUSEUM · 志野織部徳利](https://www.miho.jp/booth/html/artcon/00000275.htm)

八角钵馆藏目前只提供黑白照片，彩色仅为游戏转译；九谷馆藏只列直径，腹深和未见的外壁纹样保留为游戏适配。模型没有引入任何馆藏图片。

## 其余家具和器具的构造参照

- [IKEA · LÄCKÖ 铁架装配](https://www.ikea.com/es/en/assembly_instructions/lacko-shelving-unit-grey-outdoor-indoor__AA-2578356-1-100.pdf)：shelf、tierstand。
- [IKEA · JOSTEIN 网格架与透明罩](https://www.ikea.com/ph/en/files/pdf/96/b5/96b5055d/fy23-ph-hfb17-outdoor-bg-t2.pdf)：wirestand、wallrack、coveredstand。
- [IKEA · RISATORP 钢网篮与木提手](https://www.ikea.com/fi/en/p/risatorp-basket-white-90281618/)：basketstand、wirebasket。
- [IKEA · IVAR 层板、框架与背撑](https://www.ikea.com/th/th/files/pdf/05/85/0585f5e5/th23-ivar_bg_a4.pdf)：woodshelf、ladderstand。
- [IKEA · NÄMMARÖ 桌凳与储物箱结构](https://www.ikea.com/us/en/files/pdf/6d/a2/6da2b97f/nammaro_feb_2024.pdf)：table、pottingbench、bench、stool、lowplatform、foamstand、gardenbench、storagechest、trellis。
- [IKEA · ASKHOLMEN 折叠椅](https://www.ikea.com/us/en/p/askholmen-chair-outdoor-foldable-dark-brown-20557502/)：foldingchair。
- [IKEA · LÄCKÖ 圆桌](https://www.ikea.com/dk/da/p/laeckoe-bord-ude-gra-40151841/)：bistrotable。
- [IKEA · FROST 折叠晾衣架](https://www.ikea.com/nl/nl/p/frost-staand-droogrek-binnen-buiten-wit-40244831/)：drying。
- [IKEA · NISSAFORS 三层推车](https://www.ikea.com/gb/en/p/nissafors-trolley-beige-40585801/)：plantcart。
- [IKEA · TARVA 床框与板条](https://www.ikea.com/us/en/p/tarva-bed-frame-white-stained-s79553979/)：room-bed。
- [IKEA · RAKKESTAD 双门衣柜装配](https://www.ikea.com/au/en/assembly_instructions/rakkestad-wardrobe-with-2-doors-black-brown__AA-2583001-1-100.pdf)：room-wardrobe。
- [IKEA · TARVA 三抽屉柜装配](https://www.ikea.com/us/en/assembly_instructions/tarva-3-drawer-dresser-pine__AA-2431378-1-100.pdf)：room-dresser。
- [IKEA · STRANDMON 扶手、翼背与木脚](https://www.ikea.com/us/en/p/strandmon-wing-chair-nordvalla-dark-gray-90359829/)：room-armchair。
- [BLANCO · 不锈钢水槽结构与材质](https://www.blanco.com/int/sinks/materials/stainless-steel-sinks/)：sink、basin。
- [IKEA · ÅKERBÄR 玻璃箱框架](https://www.ikea.com/ph/en/assembly_instructions/akerbaer-greenhouse-indoor-outdoor-white__AA-2331989-1-100.pdf)：terrarium。
- [Kew · 沃德箱的斜顶、玻璃与木框](https://www.kew.org/read-and-watch/the-wardian-case-a-history-of-plant-transportation)：wardcase。
- [IKEA · KLÄMTARE 箱壁与提手](https://www.ikea.com/gb/en/p/klaemtare-box-with-lid-in-outdoor-dark-grey-70292364/)：crate、redbox、fishbox。
- [Haws · 浇水壶的长嘴与提柄](https://haws.co.uk/collections/indoor-watering-cans?page=1)：watering。
- [IKEA · KORKGRAN 镀锌桶与木握柄](https://www.ikea.com/gb/en/p/korkgran-bucket-plant-pot-in-outdoor-galvanised-40611980/)：bucket。
- [GARDENA · 园艺铲的刀面与握柄](https://www.gardena.com/uk/products/soil-ground/garden-tools/hand-trowel/970742001.html)：tools。
- [GARDENA · 13mm 园艺软管](https://www.gardena.com/uk/products/watering/hoses/classic-hose-13-mm-12-50-m/967247201.html)：hose。
- [GARDENA · 1.25L 压力喷壶](https://www.gardena.com/au/products/tree-shrub-care/pump-pressure-sprayers/pressure-sprayer-1.25-l/970461301.html)：sprayer。
- [GARDENA · 园艺手套的指形与袖口](https://www.gardena.com/uk/products/soil-ground/gloves/planting-and-soil-gloves-10-xl/966806701.html)：gloves。
- [GARDENA · 刷头、刷毛与长柄](https://www.gardena.com/int/products/soil-ground/combisystem/scrubbing-brush/966643501.html)：brush。
- [Exo Terra · 圆形温湿度表盘与背面](https://exo-terra.com/products/heating/thermo-hygrometers/analog-hygrometer/)：thermometer。
- [RHS · 育苗容器、介质与植物标签](https://www.rhs.org.uk/getmedia/61a84ef1-1473-4647-9895-c1cd1d54f7a5/Sowing-seeds-in-a-container_RHS-Grow-With-It.pdf)：seedtray、foambox、mossbox、soilbag、labels、pot、moss。
- [Garden Trading · 搪瓷材料与器具](https://www.gardentrading.co.uk/shop-by/collection/enamel/)：enamelbowl、goldfishbowl、pond、lid。
- [高知科学馆 · 浅口宽容器与青鳉饲育](https://otepia.kochi.jp/science/tmp/%E4%BB%A4%E5%92%8C2%E5%B9%B4%E5%BA%A6%E5%B9%B4%E5%A0%B1%E3%80%90%E9%AB%98%E7%9F%A5%E3%81%BF%E3%82%89%E3%81%84%E7%A7%91%E5%AD%A6%E9%A4%A8%E3%80%91.pdf)：medakabowl。
- [Garden Trading · 宠物食碗的低沿器形](https://www.gardentrading.co.uk/journal/our-top-3-items-for-your-pets/)：pigbowl。
- [IKEA · GLADELIG 陶壶、盖钮与壶嘴](https://www.ikea.com/gb/en/p/gladelig-teapot-grey-00537548/)：teaset。
- [IKEA · VÅGSJÖN 毛巾织纹](https://www.ikea.com/us/en/p/vagsjoen-bath-sheet-dark-gray-50353612/)：towel。
- [IKEA · IDEALISK 金属滤盆](https://kw-en.publications.ikea.com/kwe-catalogue26/page/154-155)：strainer。
- [IKEA · SOLVINDEN 庭院太阳能灯](https://www.ikea.com/sa/en/files/pdf/4b/0c/4b0c9180/outdoor_english-all.pdf)：solarlamp。
- [IKEA · TERTIAL 双灯臂与灯罩装配](https://www.ikea.com/ie/en/assembly_instructions/tertial-work-lamp-dark-grey__AA-2550118-1-100.pdf)：tasklamp。
- [IKEA · SOLVINDEN 灯串与悬垂电线](https://www.ikea.com/gb/en/p/solvinden-led-lighting-chain-with-12-lights-solar-powered-beige-white-50619184/)：stringlights。
- [Met · 明代青花莲塘瓷墩](https://www.metmuseum.org/art/collection/search/50483)：ceramicseat。
- [Met · 穿孔锡灯笼](https://www.metmuseum.org/art/collection/search/4734)：tinlantern。

## 2026-10-08：物件微调与四季

继续只用程序几何、整数像素绘制和着色器，不新增图片、模型文件或远程请求。参考空调、长椅、门、灯、垃圾箱、饮水机、文件柜、汽车和神社案例的面与边关系：木板沿纹理方向留下断续色块，金属与漆面保留短高光和清楚的暗边，陶盆烧成色和建筑表面采用成块色阶，边角的使用痕迹保持局部且随种子稳定。古陶器的器形与既有纹饰保持原样。

学习资料：[Brendan Sullivan 作品集](https://www.artofsully.com/)、[Saint11：Cluster Sketching and Painting](https://saint11.art/pixel_art_articles/article2/)、[Lospec Blender Toolkit](https://lospec.com/blender-toolkit/)。借鉴色块组织、稀疏细节与清晰像素采样，不复制案例贴图。

四季依本地月份：3–5月春天、6–8月夏天、9–11月秋天、12–2月冬天。春天柳絮、夏天低处盘旋的小虫、秋天细小桂花和较大的落叶、冬天缓落雪花和少量地面薄雪；天光带有轻微季节色调。季节切换沿用天气渐变，车库提供“随月份”及四季选项并保存偏好；观察页支持 season 查询参数作预览。室内隐藏季节粒子，雨与强风压低夏季虫群，减弱动态时仍保持环境运动。

四个点阵缓冲共268粒，稳定季节最多112粒；正常季节渐变最多184粒、两个绘制批次，连续快速切换仍受268粒上限约束。轮廓由着色器绘制，颜色和尺寸只上传一次，每帧更新位置和旋转。与既有材质共用场景深度，不增加物件模型构建或纹理数量。季节是场景氛围，不是实时气象或植物生长模拟。
