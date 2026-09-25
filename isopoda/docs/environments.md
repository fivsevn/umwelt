# 环境扩展指南

[返回文档导航](README.md) · [扩展工作流](expansion-guide.md)

先区分“同一环境的新布景”“现有模式的新环境”和“新的运行模式”。三者影响范围不同，当前系统不提供任意环境插件的自动注册。

## 1.0 上线环境范围

上线前环境数量冻结为以下顺序；除修正资料、视觉和布局外，不再横向新增自然环境：

1. `terrestrial` — 腐殖层
2. `freshwater` — 淡水腐殖池
3. `groundwater` — 地下水·石灰岩洞穴
4. `estuary` — 河口汽水带
5. `intertidal` — 潮间带岩池
6. `sandy-surf` — 沙滩浪区
7. `shallow-marine` — 近岸浅海·藻场
8. `abyssal` — 深海平原
9. `petri-dish` — 阿西莫夫的培养皿（特殊观察场景，UI 中置于自然环境之后）

游戏首页环境轮播、Habitat Lab 预设与 `SCENE_LAYOUTS` 都保持这个顺序。上线前的主要工作是完善各环境的像素材质、专属小物件、初始布局、物种池和叙事，而不是继续增加环境 ID。

## 维护位置

| 责任 | 当前文件（相对 `isopoda/`） |
| --- | --- |
| 环境 ID、名称、物种池、时长、指标与群体大小 | `habitats.mjs` |
| 存档中的环境、生态状态和空间对象 | `environment.mjs`、`engine.mjs` |
| 布景组合、布局选择与绘制入口 | `scenery/index.mjs`、`scenery/authored-layouts.mjs`、`scenery/default-layout.mjs` |
| 水景与水生运动 | `scenery/aquatic.mjs` |
| 游戏画布、缓存与动物/布景合成 | `habitat.mjs` |
| 普通水生正文、条件替换、深海对话 | `data/habitats/`、`aquatic-story.mjs` |
| 公开环境实验室 | `habitat.html`、`habitat-lab.mjs`、`habitat.css` |

## 淡水腐殖池：五阶段物质循环

淡水腐殖池不再复用三日晨/午/夜节拍。正式运行固定为五个物质阶段，每阶段两轮、每轮四项，共十轮选择，围绕同一片叶子的物质变化推进：完整叶片 → 微生物加工 → 啃食与破碎 → 悬浮碎屑 → 再沉积为新的底面。玩家选择改变后续文字的观察框架（食物、遮蔽、位置记录），不决定腐解是否发生。

正式游戏与 Habitat Lab 共用 `scenery/freshwater-stages.mjs` 中的五套阶段布局。实验室切到 FRESHWATER 后显示 MATERIAL STAGE 下拉框，每个阶段可以独立拖拽和导出；导出文件带 `materialStage` / `stageId` 元数据，并使用 `habitat-layout-freshwater-pool-stage-XX-*.json` 文件名。正文与三个观察倾向结局维护在 `data/habitats/freshwater-material.mjs`。

## 接入顺序

1. 选定稳定环境 ID 和运行模式。核对路由是否针对已有 ID 写有专门分支；复制一份配置不能证明新模式可运行。
2. 按 [物种契约](species-data-contract.md) 对齐配置中的可玩池与物种的环境资格；按 [群体契约](cohort.md) 确定人数。
3. 对齐指标、默认值、演进逻辑、动作效果和叙事条件。普通水生正文通常依据 `days * 3` 验证；淡水腐殖池使用 `sequence: freshwater-material` + `turns: 10` 的无日夜五阶段物质循环；深海使用独立 `turns` 与对话路由。
4. 布景使用共享入口和已有像素规则；新增布局核对选择器、空间对象序列化与缓存依赖。纯渲染模块不负责写生态或存档状态。
5. 接入正文、结局池、选择界面及语言显示，并验证全部分支可达。新文字遵循 [叙事契约](narrative-contract.md)。
6. 验证旧档、新局、中途反馈重载、结局归档、环境切换和两个实验室。指标/状态形状变化按 [存档兼容](save-compat.md) 设计迁移。

运行统一检查，其中 `validate-habitats.mjs` 检查配置结构；实际演进、视觉与交互仍需 [扩展验证矩阵](expansion-guide.md#验证选择) 中的测试与浏览器检查。历史水景、场景和环境记忆笔记见 [历史索引](reference/README.md)。

## 地下水：四次无日夜渗流观察

`groundwater-pulse` 固定四轮三选一：渗流 → 连通 → 外源输入 → 回落。指标为裂隙连通性、渗流强度、外源物输入；均为叙事性的相对尺度，不是实测百分比或水文预测。选项改变记录和结局倾向，不改变地下水参数；手电是观察者的视野，不作为动物趋光行为的依据。原有洞穴布局保留，水膜速度和碎屑随阶段变化。

暖色光圈支持鼠标移动和触摸定位。地图只保留玩家选择记录的入口与推测虚线，未观察的出口不补画；熄灯在反馈和结局期间持续。正文与三种观察倾向结局位于 `data/habitats/groundwater-pulse.mjs`，81 条路径由 `tests/groundwater.test.mjs` 验证。

资料依据与设计边界：

- [Francois et al., 2016](https://doi.org/10.1111/1365-2435.12484)：地下水 Proasellus 的食物来源包括沉积物生物膜；碎屑输入不等于观察到即时进食。
- [Linking Hydrogeology and Ecology in Karst Landscapes](https://www.mdpi.com/2073-4441/13/15/2106)：岩溶补给与生物连通性关系；该研究对象为桡足类，此处用于水文背景，不外推为等足目特定行为。
- [Thermal acclimation and metabolic scaling of a groundwater asellid](https://pmc.ncbi.nlm.nih.gov/articles/PMC9605946/)：Proasellus lusitanicus 的无眼、无色素等地下水适应特征。

四次事件及屏幕上的通路是这些资料启发的叙事抽象，不代表某个真实洞穴的测绘结果。
