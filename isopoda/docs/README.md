# ISOPODA 开发文档导航

这里是游戏维护与内容扩展的唯一文档入口。先按任务选指南，再查对应契约；运行代码决定当前实际行为，指南不代表功能已经实现。此次整理只涉及开发文档，下一轮再添加内容。

## 按任务进入

| 下一轮任务 | 从这里开始 | 必须同时阅读 |
| --- | --- | --- |
| 添加鼠妇品种、培养线或参考标本 | [扩展工作流：品种](expansion-guide.md#品种与标本) | [物种数据契约](species-data-contract.md)、[形态边界](morphology-renderer.md) |
| 添加环境、布景或生态指标 | [环境扩展指南](environments.md) | [群体模型](cohort.md)、[存档兼容](save-compat.md) |
| 添加事件、内容或结局 | [扩展工作流：叙事](expansion-guide.md#游戏内容与结局) | [内容地图](content-map.md)、[叙事契约](narrative-contract.md) |
| 添加一种语言 | [语言扩展指南](languages.md) | [本地化模块](../locales/README.md)、[叙事契约](narrative-contract.md) |
| 添加动画动作或交互反应 | [动作扩展指南](animation.md) | [形态边界](morphology-renderer.md)、[运动研究](../data/locomotion/README.md) |
| 开始一项扩展设计 | [提案模板](templates/expansion-proposal.md) | [扩展工作流](expansion-guide.md) |

## 两个公开实验室

[姐妹实验室维护契约](laboratories.md)：游戏新增品种、环境、动作或语言时，同步核对形态资料页与环境布置页，保持阿西莫夫的叙事包装。

## 当前维护契约

- [运行边界与公开页面](../README.md)：主页、游戏、两个实验室与稳定性规则。
- [内容地图](content-map.md)：现有内容的唯一维护位置。
- [物种数据契约](species-data-contract.md)：注册、来源、形态代理与环境资格。
- [群体模型](cohort.md)：普通环境七只、深海一只及身份连续性。
- [存档兼容](save-compat.md)：存储键、稳定 ID、索引与迁移边界。
- [叙事契约](narrative-contract.md)：文字键、现有三语结构及验证范围。
- [形态渲染边界](morphology-renderer.md)：可表达的形态与证据限制。
- [验证与发布](deployment.md)：发布排除项、字体及资源版本。
- [测试入口](../../tests/README.md)：统一检查与浏览器回归。

## 文档维护规则

1. 当前契约放在本目录；操作指南引用契约，不再复制完整字段定义或存档键表。
2. 模块目录的 README 只解释该模块，并链接回本入口。提案使用 [模板](templates/expansion-proposal.md)，明确标为待实施；不要用占位数据注册尚未完成的内容。
3. 已完成的阶段记录及旧设计放入 [历史索引](reference/README.md)。历史文档不随当前代码重写，也不能替代当前契约。
4. 不新建仓库根目录 `docs/` 作为第二套 ISOPODA 文档。公开 Credits、字体许可、来源数据具有运行或授权用途，不能当作开发文档移动或删减。
5. 只整理文档时，保持运行文件、素材、配置、发布脚本和已有测试不变；执行 [文档整理验证](deployment.md#文档整理的零前端变化验证)。
