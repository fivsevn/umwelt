# 扩展工作流

[返回文档导航](README.md)

本指南是下一轮实施入口，不启用新内容，不预先承诺品种、环境或动作的数量。现有文件位置见 [内容地图](content-map.md)，字段规则见相应契约。

## 共用流程

1. 用 [扩展提案模板](templates/expansion-proposal.md) 说明玩家能体验什么、涉及哪些模块和稳定 ID；区分科学依据、工作判断与游戏参数。
2. 确认属于现有机制的数据扩展，还是需要先改动路由、状态、渲染或语言支持。现在并非所有内容都能通过新增数据文件自动接入。
3. 明确保存、重载、旧档、资料库和多语言的影响；有破坏性变更时先设计迁移及样本。不要为文档调整升级存档版本。
4. 实施时把数据、消费者、语言覆盖及必要验证作为同一完整变更。禁止只登记 ID 却留下无法进入的内容。
5. 从仓库根目录运行 `node isopoda/tools/check-all.mjs`，再按下表完成相关浏览器验证。科学资料的真实性仍需单独核对。

## 品种与标本

以 [物种契约](species-data-contract.md) 为准：先决定正式物种、培养线、水生可玩或仅供参考的归属，再通过物种与来源 manifest 追加注册。保持现有 ID 和拼接顺序；不要将历史 13 个条目当成完整目录。

交付时同时检查证据引用、形态代理、显示尺度、运动档案、环境双向资格、名称与注释翻译，以及资料库解锁和分页。水生可玩资格不能只改物种侧；参考标本不能误入抽签池。

## 游戏内容与结局

- 陆生：`../content.mjs` 管理观察、照料与结局文字，`../encounters.mjs` 管理遭遇编排；`../engine.mjs` 仍负责场景组装、分支与部分现有文字。增加结局对象不等于添加可达分支。
- 普通水生：`../data/habitats/stories.mjs` 与 `story-alternates.mjs` 管理正文，`../aquatic-story.mjs` 管理选择和结局，`../habitats.mjs` 提供环境配置。新条件需要同步运行分支和验证器允许的条件。
- 深海：`../data/habitats/abyssal-dialogue.mjs` 与水生路由共同管理节点、选项、碎片和结局。当前是 15 回合单体观察，不套用普通三日模式。
- 全新文字池：遵循 [叙事契约](narrative-contract.md) 的 `TEXT_CATALOG` 规则；自动发现仅发生在验证阶段，运行时仍需消费者。不要建立内容副本。

既有水生索引、深海选项身份及存档中的文字键不可随意重排。新增结局需覆盖“能达到、不会误触发、重载后仍正确、归档后可显示”；分支可达性不是 schema 验证能够证明的。

## 验证选择

所有实施都先运行统一检查。下面列出应重点关注的已有测试，并非新增功能已被完整覆盖的承诺；新条件仍需自己的有效测试。

| 改动 | 重点自动验证（位于 `tests/`） | 浏览器验收 |
| --- | --- | --- |
| 品种 | `species-registry.test.mjs`、`data-contracts.test.mjs`、`cohort.test.mjs`、`morphology.test.mjs` | 抽取、到达、资料库、形态实验室 |
| 环境 | `habitats.test.mjs`、`environment.test.mjs`、`authored-layouts.test.mjs`、`scene-codec.test.mjs` | 选择环境、布景、交互、继续游戏、环境实验室 |
| 内容与结局 | `isopoda.test.mjs`、`habitats.test.mjs`、`fieldnotes.test.mjs`、`data-contracts.test.mjs` | 选择、反馈、结局、归档与中途重载 |
| 语言 | `i18n-singleton.test.mjs`、i18n 和 narrative 检查 | 所有文字域、切换后重载、长文本、字体、Credits |
| 动作 | `pixel-life.test.mjs`、`locomotion.test.mjs`、`interaction.test.mjs`、`reactions.test.mjs` | 各体型/阶段、移动与防御、遮挡、速度切换、两个实验室 |

浏览器命令及比较规则见 [测试说明](../../tests/README.md)。有意新增内容时，为预期变化制定验收；保留未涉及页面和行为的基线。
