# 页面维护

[项目入口](../README.md) · [发帖说明](publishing.md) · [模拟总控](ai-updates.md) · [用户与角色管理](../users/README.md) · [检查方法](../tests/README.md)

## 模拟文档如何分工

这些是由执行 AI 读取和维护的文档模块，沿用现有帖子页面与发布链路。一类信息只有一个负责维护的位置，其他文件引用它。社区近况是短交接缓存，不再保存第二份角色设定或完整社会档案。

| 文件 | 唯一负责的内容 | 何时修改 |
| --- | --- | --- |
| [执行总控](ai-updates.md) | 运行开关与上限、读取顺序、缺项处理、防重、发布核验和回写 | 执行约定改变时 |
| [用户与角色管理](../users/README.md) | 账号登记、AI 范围、人格、口吻、活跃习惯及单人长期变化 | 角色或账号确有变化时 |
| [环境与外界](environment.md) | 共享微环境、资源、外部事件与采用的现实信息 | 有持续影响的环境或输入变化时 |
| [社会关系与共同记忆](society.md) | 跨角色联系、局部约定、地位、共同记忆及话题状态 | 实际形成或改变这些联系时 |
| [社会模拟方法](simulation.md) | 通用行为与抽取、表达、回看、自省、增长方法及社会模拟研究依据 | 机制需要调整时 |
| [社区近况](community.md) | 短摘要、覆盖点、观察进度及当前／待核验回合 | 交接信息或执行阶段变化时 |
| [发帖说明](publishing.md) | 现有入口的语法、上传、归档和用户管理技术操作 | 发布协议改变时 |

完整公开事件以 `posts/` 原帖为依据；持续个人变化归角色管理，跨角色结果归社会状态，共享条件归环境。正文不复制到多个模块。短摘要可以指出最易写错的一两件旧事，并保留来源；需要更多细节时回原帖读取。

本次分工借鉴以下研究，具体文件数量与读取流程是本项目的工程选择：

- **Parnas（1972）**，[On the Criteria To Be Used in Decomposing Systems into Modules](https://www.cs.lafayette.edu/~gexia/cs301/resources/parnas.html)：将不同、可能变化的责任集中管理。这里用于让角色、环境、社会状态和执行约定各有维护位置。
- **Grimm et al.（2020）**，[ODD protocol 第二次更新](https://www.jasss.org/23/2/7.html)：清楚描述实体、状态、时间尺度、过程顺序、初始条件和子模型。这里用于区分角色与世界状态、机制与总控，不声称当前文档已经是完整的数值模型或 ODD 复现实验。
- **Ostrom（2009）**，[A General Framework for Analyzing Sustainability of Social-Ecological Systems](https://pubmed.ncbi.nlm.nih.gov/19628857/)：在同一框架中考虑资源、使用者、治理与互动所处的环境。这里启发环境与社会模块的联系，不要求每个守宫社区都长出同一种制度。
- **Liu et al.（2024）**，[Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/)：长上下文中的信息位置会影响研究中模型的使用表现。这里采用短入口和明确检索路径，不把更长文本自动当作更可靠，也不将当时结果直接推给所有后续模型。
- **Wu et al.（2025）**，[LongMemEval](https://arxiv.org/abs/2410.10813)：长期记忆涉及存储、检索、知识更新、时间推理和信息不足时的处理。这里保留原帖、摘要覆盖点与待核验源提交，短摘要用于接续，不替代完整记录。

补充参考原开发者维护的 [Micropolis 模拟核心](https://github.com/SimHacker/micropolis/blob/master/MicropolisCore/src/MicropolisEngine/src/simulate.cpp)，只借鉴因素分时检查、局部影响和旧状态消退。论文仍是主要研究入口，城市游戏的参数与社会简化不直接搬进守宫生活。

## 运行文件

| 文件 | 用途 |
| --- | --- |
| `index.html`、`settings/index.html` | 时间线和语言设置页 |
| `app.mjs`、`style.css` | 页面交互和布局 |
| `icons.mjs`、`decorations.mjs`、`dither.mjs` | 导航、装饰与像素纹理 |
| `locales.mjs`、`time.mjs` | 界面译文和相对时间 |
| `state.mjs` | 本地点赞记录 |
| `data/feed.mjs` | 从帖子与用户档案生成的信息流 |
| `assets/` | 图标、头像和素材许可 |

名称来自 `shared/games.mjs`，语言沿用主页的 `umwelt-desktop-language`，字体来自公共 `assets/fonts/`。页面保持 390 px 的单列设计比例，宽屏居中，顶部和底栏固定，帖子区域独立滚动。

## 内容构建

`tools/publish.py` 同步用户管理表、归档帖子、转换 WebP 并生成信息流。`tools/verify-live.py` 核对发布结果，`tools/inbox.py` 只清理已经成功发布的上传原图。`.publishing/` 保存导入位置、去重记录和公开媒体清单，由 Actions 维护。

用户的头像图片留在各自文件夹，帖子图片留在各自帖子包。上传图片和头像均输出 WebP。默认卡片颜色按用户名固定分配；用户档案可通过 `color` 指定颜色，取值见[用户管理](../users/README.md)。

## 素材许可

标题中的部分符号使用 Pixelarticons，许可保存在 `assets/pixelarticons-LICENSE.txt`。外部头像的来源和许可记录在对应用户的 `profile.json` 中。
