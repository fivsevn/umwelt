// Environment evidence only. Animal-specific evidence belongs to each specimen.
export const HABITAT_REFERENCES={
 'sandy-surf':{scope:'沙滩浪区 / SANDY SURF / 砂浜の波打ち際',entries:[
 {sourceId:'sand-klapow-1972',use:'浪洗区出沙 / Wave-wash emergence',note:'E. chiltoni 的低潮埋藏与高潮出沙支持该物种的沙滩资格；不把采样地点扩展为所有岸段。 / Low-tide burial and high-tide emergence support habitat membership.'},
 {sourceId:'sand-jones-pierpoint-1997',use:'沙岸暴露程度 / Beach exposure',note:'E. naylori 的潮间沙岸调查和形态重描述；不同地区物种用于比较展示，不表示同一片沙滩共存。 / Intertidal records support the pool; regional species are compared, not asserted to coexist.'},
 {sourceId:'sand-jones-1970',use:'沙中埋藏 / Burial in sand / 砂への潜行',note:'E. pulchra 与 E. affinis 的沙中分布和埋藏研究支持隐藏在湿沙下的个体。 / Sand distributions and burial experiments support concealed animals. / 砂中分布と潜行の実験が背景。'},
 {sourceId:'sand-rhythm-1970',use:'游动与再埋藏 / Swimming and reburial / 遊泳と再潜行',note:'E. pulchra 的潮汐节律和浪扰动作为出沙背景；游戏没有复现生物钟。 / Tidal swimming and wave disturbance inform emergence; the game does not model the biological clock. / 潮汐に伴う遊泳を参考にするが、生物時計の再現ではない。'}],
 limits:'浪位 0–100 是场景水线上移的相对刻度；浪向由相邻观察的水位差决定，沙面词语与叙事片段对应，不是实测潮位、湿度或现场检测。右上角为九次观察的进度。 / Wash 0–100 is an authored relative shoreline level; direction follows successive scene levels and surface words follow the narrative, not field measurements. The corner shows nine-observation progress. 个体位置、几秒内的出入沙循环、抓取、挖坑和局部沙粒抖动是游戏编排，不是实测深度、速度或可靠的野外定位线索。埋藏个体也可以没有提示。E. spinigera 的沙地记录不等于同等充分的行为证据，其动作是属级示意。日期沿用观察日历，不是当地潮汐预报。 / Positions, accelerated cycles, digging, pickup and grain cues are authored, not measured depths, speeds or reliable field signs. Some animals give no cue. E. spinigera movement is a genus-level illustration, not equally supported species behaviour. Dates are not tide predictions. / 位置、短い周期、掘削と持ち上げ、砂粒の動きは創作上の表現。静かな砂にも個体がいる。'
 },
 intertidal:{scope:'潮间带岩池 / INTERTIDAL ROCK POOL / 潮間帯の潮だまり',entries:[
 {sourceId:'intertidal-noaa-period',use:'半日潮周期 / Semidiurnal cycle / 半日潮',note:'采用约 12 小时 25 分的低潮到低潮作为一轮观察；九个时刻为叙事采样，并非当地潮汐预报。 / An approximately 12 h 25 min low-to-low cycle is sampled at nine authored moments, not a local tide forecast. / 約12時間25分を九つの観察に分けた創作上の周期。'},
 {sourceId:'intertidal-bmig-granulosa',use:'石下与藻间的庇护 / Stone and weed refuges / 石と藻の隠れ場',note:'以 I. granulosa 在潮间带石下和藻间出现的资料为背景，描绘涨水连通、落水收窄的活动范围。 / Habitat occurrence informs the wet refuges; route changes are authored. / 分布資料をもとに湿った隠れ場を描く。'},
 {sourceId:'intertidal-albifrons-bmig',use:'留水石下微栖地 / Water-retaining stone refuges',note:'用于岩池旁仍保有浅水的石下区域，补充湿藻之外的停留位置。 / Under-stone shallow-water occurrence informs a different refuge from the seaweed.'},
 {sourceId:'intertidal-hirsuta-bmig',use:'潮退露出的岩隙 / Emersed crevice refuges',note:'C. hirsuta 的较高岸位记录支持退潮后仍可停留在藤壶与岩隙处的场景；没有将所有物种强制压到水线以下。未模拟干燥耐受时长、盐度耐受或死亡。 / Upper-shore occurrence informs emersed refuges, not a desiccation, salinity or survival model.'},
 {sourceId:'intertidal-barnacle-cirri',use:'藤壶的蔓足 / Barnacle cirri / フジツボの蔓脚',note:'浸水时伸足、露出后收回的环境动画参考；画面没有鉴定到具体藤壶物种。 / Immersed feeding and emersed retraction inform ambient animation; no depicted barnacle species is identified. / 水中の摂食と露出時の閉殻を参考にした模式アニメーション。'}],
 limits:'九次观察、淹水百分比、1–5 个通水石隙与流势指数都是场景尺度，不是实测数据。流势没有物理单位；淹水为相对指标，不是二维画面的像素面积。游动只为 I. granulosa 示例启用；C. hirsuta 的湿岩隙位置可在水线以上，露出阶段收窄活动，不模拟陆生生活。轨迹和速度不代表物种测量；其依据见形态实验室当前标本参考。混合展示不宣称所有物种在同一岩池共存。 / Nine observations, inundation index, 1–5 open gaps and unitless current index are authored, not measurements. Inundation is not screen pixel area. I. granulosa swimming is illustrative; routes and speeds are not measured. Species are comparative, not a co-occurrence claim. / 数値、経路、速度は創作上の模式表現で、実測ではない。'
 },
 estuary:{
  scope:'河口汽水带 / BRACKISH ESTUARY / 河口汽水域',
  entries:[{sourceId:'estuary-noaa-circulation',use:'潮流、来水与混合 / Tides, river input and mixing',note:'依据河口混合程度与盐度分布会受来水、潮流及地形影响的背景，描绘一段潮沟。不是所有河口都存在相同的分层或锋面；水流粒子不代表可见的盐度边界。 / Mixing and salinity distribution vary with river input, tides and geometry. Particles are not a visible salinity boundary.'}],
  limits:'六次观察、P/Q 水样读数、物件位置和轮廓轨迹均为叙事示意，不是实测数据、盐度耐受阈值或特定物种的行为预测。选择采集的是预先编排的一段观察，不是浏览器逐帧追踪实验。只有选中的证据进入笔记；遮挡或中断后的轮廓不认定为先前个体。各时刻的动画、标记和轨迹以可编辑锚点为参照。保留 estuary-origin-wood、estuary-algae-base、estuary-observation-runnel 三个对象 ID，分别导出六个时刻后再交由开发整合。 / The six observations, sample readings and routes are authored illustrations, not measurements or species-specific responses. Only selected evidence is saved. Keep the three named anchors and export each observation separately. / 六回の観察、値と経路は創作上の模式表現。遮蔽後の輪郭を前の個体とは同定しない。各観察を個別に書き出す。'
 },
 groundwater:{
  scope:'地下水 · 石灰岩洞穴 / LIMESTONE GROUNDWATER',
  entries:[
   {sourceId:'groundwater-recharge',use:'补给、渗流与颗粒搬运',note:'用于渗水、涨水、携入和退水过程的环境背景，以及画面中的颗粒移动。四阶段、各两次选择是叙事编排，不是论文给出的周期。'},
   {sourceId:'groundwater-biofilm',use:'低生产力环境中的食物来源',note:'用于湿面薄层与输入碎屑的生态背景。研究对象为 P. valdensis 与 P. cavaticus，不能据此认定所有洞穴等足类具有相同食性；对应物种的文章也列在形态实验室。'},
   {sourceId:'groundwater-survey',use:'洞穴测点与相对高程',note:'用于测点、距离、方位角和倾角的测绘表达。右上角 Δh 为相对洞口高程；−18.2 至 −19.7 m 是附近观察点的虚构设定，不是实测洞穴或物种采集记录。'}
  ],
  limits:'画面路线、观察次数、个体数量、连通数值与时间尺度均为游戏示意。不同地区的物种作比较展示，不表示它们在同一座洞穴共存。分类、体型与具体物种行为的证据见形态实验室各标本的“当前标本参考”。'
 }
};
