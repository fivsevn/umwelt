# 花农时代器物与材质资料

[花农时代文档入口](../README.md)

当前目录由 294 件独立原生模型组成。植物与盆器来源在 `rooftop/botany.mjs`，当前器物的逐项来源随 `item-data.mjs` 中的目录记录提供；`notebook.mjs` 汇合来源，`native-item-notes.mjs` 维护描述与随想。上游记录与生成关系见[手帐数据职责](notebook.md#数据职责)，物品原稿与研究记录见[当前物品原稿](../art/rooftop-furniture-02/README.md)。这些资料与游戏手帐同步维护，名称、物件 ID、科学名和适盆规则保持稳定。

## 来源与制作边界

- 按具体器物完成厚度、内壁、背面、底部、开口、排水孔和真实承放面；来源尺寸与游戏适配尺寸分别记录。
- 有馆藏依据的器物保留馆藏链接、年代与已知尺寸。未见的背面、内壁和未测量的尺寸标明推定，不将游戏适配写成原藏品事实。
- 窑口风格盆表示视觉转译，不标作有确切年代的古董。新增日用品不编造外部引用。
- 原稿保留当前模型与 Pixelorama 图集。研究使用公开来源链接，仓库不存参考照片、地图截图、真实住宅地址或位置坐标。
- 木、金属、陶瓷、塑料和织物各按其使用部位绘制旧化；物理材料格统一为 16 像素／米，画面颗粒由最终共享低采样控制。

294 件物件的材料调整、结构增补及检查结果见[物件修改记录](../art/rooftop-furniture-02/object-detail/README.md)。修改从当前 Blender 和 Pixelorama 原稿继续，参考图片未存入仓库，来源链接保留。

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
