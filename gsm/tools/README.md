# GSM 工具与维护

内容更新从[更新入口](../docs/README.md)进入，命令、审读与恢复只在[执行与发布](../docs/publishing.md)维护。此页说明工具归属及历史来源，不另立一套更新规则。

| 入口 | 职责 |
| --- | --- |
| `update.mjs`、`engine/` | 本地抽签、完整阅读包、独立写作输入、初稿检查点、审读和收尾 |
| `engine/collect-gecko-opinions.js`、`engine/gecko-sources.js` | 按本站来源配置少量采集守宫与爬宠讨论；只更新材料，不发帖 |
| `publish.mjs`、`publish.py`、`storage.py` | GSM 原生帖子、人物资料、媒体、人工输入及页面数据构建 |
| `operation-archive.mjs` | 在本仓库保存、恢复不可变操作快照，目录说明见[操作归档](../operations/README.md) |
| `verify-live.py`、`engine/verify-live.js` | 核对实际线上文件、帖子及媒体 |
| `pocket-handset.py`、`encode-pocket-handset.py`、`pocket_gecko_charm.py`、`gecko_species_paint.py` | 掌机及物种挂件的模型、贴图与导出；参数和依据见 `pocket-handset-references.json`，验证见[测试说明](../tests/README.md) |
| `legacy/`、`simulation-dice.py`、`narrative_likes.py` | 旧操作与旧凭据的兼容核查；不作为现行内容更新入口 |

正式文档按职责归入 `docs/`（执行）、`environment/research-*`（环境与交流研究）、`environment/sources-*`（来源与材料）、`users/`（个体及表达研究）。原帖和媒体归 `posts/`，审计快照归 `operations/`；研究不重复建立第二套正文。临时下载、截图和草稿放仓库外，实际采用文件再进入所属目录。第三方许可文件保持原文。

## 移植与资料整合

系统最初参考 `fivsevn/y29/lucifer0/` 的提交 `09399767ea630b2b7cdba123250b88e03cf18371`，之后由 GSM 独立维护。2026-11-15 整理目录职责时只读核对参考仓库 `main` 提交 `2f0fd378a6359dd85841bf414e595c37d3849482`；没有修改参考仓库。本地保留完整抽签、回复、媒体、负面倾向、时段、研究、独立 writer/editor、发布审计及恢复设计，站点差异为守宫生活、原有界面和每轮两路主帖各 1–2 条。

此前读取路西法零每日材料的安排已替换为本站独立爬宠采集。旧操作仍保存当时真实的来源凭据及阅读快照，仅供历史核查；新操作只读取本站材料，不能用旧来源冒充本次采集。

旧 `environment/everyday-life.md`、`comments.md`、`meme.md`、`forum.md`、`world-trends.md` 分别合入当前研究、论坛记录、世界观及生态来源。人物与表达研究归 `users/research-character.md`、`research-speech.md`。旧 `docs/research/` 的有效参考按同一职责整合，冗长运营日志与已废弃规则可从[整合前版本](https://github.com/fivsevn/umwelt/tree/9361511f8a2128cd1562811c659417f512f2893f/gsm/docs/research)查阅，当前不再维护副本。历史抽签及点赞 JSON 是旧工具凭据，不是运行文档。

历史作者来源：`gedageda`、`backpackgecko` 的原帖为作者创作，其余旧文字由 AI 生成，含 `isopodafugue` 的旧文字；当前三个账号均按作者保留权限保护。2026-11-15 经作者要求清除旧 AI 发言后，原帖事实以现有 `posts/` 为准，旧运营日志中的人数、关系、帖数与“当前”不构成本站现状。

## 工程参考的适用范围

以下保留旧研究中的方法出处，书目阅读范围沿原笔记（2026-10-23 至 10-29），本次只做整理，不声称重新核验全部网页。这些是工程与模型方法，不是守宫的生物规律，也不能证明生成社区真实。

| 来源 | 这里保留的方法 |
| --- | --- |
| [Parnas 1972](https://doi.org/10.1145/361598.361623)、[Grimm 等 2020 ODD](https://www.jasss.org/23/2/7.html) | 按变化职责组织文件，交代实体、状态与过程顺序；目录数量和参数仍需本项目验证。旧笔记核对正文。 |
| [Lee 等 2015](https://jasss.org/18/4/4.html) | 区分随机实现和参数效应，保留固定抽签；核验范围为引言、方差及敏感性分析，不能由一次好看的结果验证设计。 |
| [Park 等 2023](https://arxiv.org/abs/2304.03442)、[Chuang 等 2024](https://aclanthology.org/2024.findings-naacl.211/) | 原帖依据、检索、记忆与角色间差异；原实验的短时段、模型与议题范围不能推广为长期守宫社会规律。 |
| [Liu 等 2024](https://aclanthology.org/2024.tacl-1.9/)、[Wu 等 LongMemEval](https://arxiv.org/abs/2410.10813) | 简短入口、明确读取范围、信息更新和不足时查证；摘要与模型记忆不能替代原帖。旧笔记为论文方法与结果阅读。 |
| [Self-Refine](https://proceedings.neurips.cc/paper_files/paper/2023/hash/91edff07232fb1b55a505a9e9f6c0ff3-Abstract-Conference.html)、[Reflexion](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html)、[Huang 等 2024](https://arxiv.org/abs/2310.01798) | 针对具体初稿给反馈，保留实际失败依据；自评不证明正确，独立审读、源材料和真实工具结果分别核验。旧笔记核对各论文方法、结果及限制。 |
| [Kephart 与 Chess 2003](https://doi.org/10.1109/MC.2003.1160055) | 在既有权限内监测、诊断、恢复并验证；架构愿景不构成任意改权限、历史或发布机制的授权。 |

旧 Micropolis 城市模拟源码只曾提供分时更新的工程启发；现行系统未运行它的交通、经济或衰减模型，因此不保留为守宫生活来源。
