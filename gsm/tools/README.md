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

正式文档按职责归入 `docs/`（执行）、`environment/research-*`（环境与交流研究）、`environment/sources-*`（来源与材料）、`users/`（个体及表达研究）。原帖和媒体归 `posts/`，审计快照归 `operations/`；研究不重复建立第二套正文。临时下载、截图和草稿放仓库外，实际采用文件再进入所属目录。第三方许可文件保持原文。
