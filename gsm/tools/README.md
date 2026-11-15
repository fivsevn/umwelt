# GSM 工具与维护

内容更新从[更新入口](../docs/README.md)进入，命令、审读与恢复只在[执行与发布](../docs/publishing.md)维护。此页说明各工具的职责。

| 入口 | 职责 |
| --- | --- |
| `update.mjs`、`engine/` | 本地抽签、完整阅读包、独立写作输入、初稿检查点、审读和收尾 |
| `engine/collect-gecko-opinions.js`、`engine/gecko-sources.js` | 按本站来源配置少量采集守宫与爬宠讨论；只更新材料，不发帖 |
| `publish.mjs`、`publish.py`、`storage.py` | GSM 原生帖子、人物资料、媒体、人工输入及页面数据构建 |
| `operation-archive.mjs` | 在本仓库保存、恢复不可变操作快照，目录说明见[操作归档](../operations/README.md) |
| `verify-live.py`、`engine/verify-live.js` | 核对实际线上文件、帖子及媒体 |
| `pocket-handset.py`、`encode-pocket-handset.py`、`pocket_gecko_charm.py`、`gecko_species_paint.py` | 掌机及物种挂件的模型、贴图与导出；参数和依据见 `pocket-handset-references.json`，验证见[测试说明](../tests/README.md) |

正式文档按职责归入 `docs/`（执行）、`environment/research-*`（生态、环境、真实观察与交流研究）、`environment/sources-*`（每日及精选案例素材）、`users/`（个体及表达研究）。原帖和媒体归 `posts/`，审计快照归 `operations/`；研究不重复建立第二套正文。临时下载、截图和草稿放仓库外，实际采用文件再进入所属目录。第三方许可文件保持原文。

## 方法与维护边界

模型职责、读取与记忆、随机输出比较、反馈修订及故障恢复的完整研究，集中在[执行、记忆与复查的研究依据](../docs/publishing.md#执行记忆与复查的研究依据)，随每轮完整阅读包提供；此处不重复维护另一份书目或执行约定。环境、社会互动和物种资料分别由环境专题维护，人物与表达由用户专题维护。

工具负责固定选择、来源摘要、文件一致性和事务恢复；执行者负责真实阅读、身体与知情判断、中文表达和看图。散列能确认读取或审读记录对应哪个版本，不能证明已经阅读、图片符合正文或社会模拟真实。测试、构建、准备、导入和线上核验各自报告实际结果，不能互相替代。

`pocket-handset-source/` 保存竖横两份可编辑 Blender 场景及八套材质与打包贴图。掌机、挂件、纹理和导出的尺寸约束及研究出处见[页面与模型检查](../tests/README.md#信息流交互)与 `pocket-handset-references.json`；模型或贴图修改后核对两种方向、全部物种与对应交互区域。表情原稿、裁切、透明边缘和确定性导出见[表情维护](../art/emotes/README.md)。
