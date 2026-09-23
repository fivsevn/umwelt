# 环境扩展指南

[返回文档导航](README.md) · [扩展工作流](expansion-guide.md)

先区分“同一环境的新布景”“现有模式的新环境”和“新的运行模式”。三者影响范围不同，当前系统不提供任意环境插件的自动注册。

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

## 接入顺序

1. 选定稳定环境 ID 和运行模式。核对路由是否针对已有 ID 写有专门分支；复制一份配置不能证明新模式可运行。
2. 按 [物种契约](species-data-contract.md) 对齐配置中的可玩池与物种的环境资格；按 [群体契约](cohort.md) 确定人数。
3. 对齐指标、默认值、演进逻辑、动作效果和叙事条件。普通水生正文长度当前依据 `days * 3` 验证；深海使用独立 `turns` 与对话路由。
4. 布景使用共享入口和已有像素规则；新增布局核对选择器、空间对象序列化与缓存依赖。纯渲染模块不负责写生态或存档状态。
5. 接入正文、结局池、选择界面及语言显示，并验证全部分支可达。新文字遵循 [叙事契约](narrative-contract.md)。
6. 验证旧档、新局、中途反馈重载、结局归档、环境切换和两个实验室。指标/状态形状变化按 [存档兼容](save-compat.md) 设计迁移。

运行统一检查，其中 `validate-habitats.mjs` 检查配置结构；实际演进、视觉与交互仍需 [扩展验证矩阵](expansion-guide.md#验证选择) 中的测试与浏览器检查。历史水景、场景和环境记忆笔记见 [历史索引](reference/README.md)。
