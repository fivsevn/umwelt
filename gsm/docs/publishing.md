# 执行与发布

本页说明工具命令、工作记录和上线核验。创作要求见[写作与改编](writing.md)，每次更新从[总入口](README.md)开始。

## 准备

安装 `gsm/tools/requirements.txt`，在仓库根目录运行：

```sh
python3 gsm/tools/update.py prepare
```

工具输出 `operation.json` 与 `reading.md` 的绝对路径。前者保存当前更新的抽签、观察和草稿，后者按来源路径汇集完整原文。默认工作目录位于仓库外的 `~/.local/state/umwelt/gsm/current`。指定其他工作目录时使用 `--work /outside/work`。

再次执行同一命令会恢复当前更新，保留原编号、预算与抽中的守宫，同时刷新阅读材料。用户明确指定总条数时，准备命令才加 `--count N`（整数1–20），作为主帖与回复合计上限。恢复时沿用原数量与原抽签。每次处理一份当前更新，完成后再开始下一次。

发布开关和批次硬上限集中在 [`publication.json`](../publication.json)。已有守宫的身份、公开资料与权限编辑本人 `profile.md` 的账号表；`accounts.json` 和 `profile.json` 是构建生成的读取结果，头像裁切、颜色、许可等既有技术设置保留在 `profile.json`。README 用户目录由工具生成，不再维护第二张用户表。

## 填写当前更新

在 `operation.json` 中填写 `research` 与 `posts`，其余自动字段由工具管理。实际读完 `reading.md` 后，再开展观察与写作。

| 观察字段 | 内容 |
| --- | --- |
| `category` | `news` 正式资讯、`trend` 社交话题、`daily` 日常经历 |
| `purpose` | Meme 采样填 `"meme"`，其他观察可省略；发现入口与近期原用法分别记录 |
| `kind` | `feed` 资讯、榜单或单篇材料；`thread` 实际读到回复的讨论 |
| `url` | 实际读过的原页 HTTPS 链接 |
| `visitedAt` | 实际访问时间，带时区的 ISO 时间 |
| `publishedAt` | 原始发布时间；无法确认时填 `null` |
| `summary` | 实际阅读范围、可参考的情境或交流；采用时注明改编方向 |
| `adaptedPostIds` | 本页实际用于哪些新发言，可选的帖子 ID 数组 |

观察的数量、类别和时效要求由[更新入口](README.md#每次更新)统一规定。材料不可访问时寻找可读原页；记录字段只提供检查线索，执行者仍须实际阅读。

`posts` 使用以下结构：

```json
{
  "id": "update-example-01",
  "author": "guest-example",
  "guest": { "name": "路过看看" },
  "createdAt": "2026-11-09T00:00:00+08:00",
  "replyTo": null,
  "text": "这里填写审读完成的发言。",
  "likes": 2,
  "canon": "derivative",
  "media": []
}
```

使用本次更新编号加序号形成帖子 ID。临时路人的 `author` 使用唯一 `guest-` 编号，`guest.name` 保存公开网名，也可填简短 `guest.bio`；同一身份的网名和简介保持一致。资料随帖子归档，网页自动汇集该账号的发言，常驻目录不为它建档。已有守宫使用原用户名并省略 `guest` 字段。

主帖的 `replyTo` 为 `null`；回复填写真正父帖 ID。时间使用上海时区，处在已有时间线之后、实际当前时刻之前，回复不早于父帖。间隔按发言情境安排，示例内容和时间在使用时替换。`likes` 是本条基础赞数，依据见[评论与点赞](../environment/comments.md#点赞怎样形成差异)。

## 逐串抽取回复

先把实际采用的新主帖填入 `posts`，再执行：

```sh
python3 gsm/tools/update.py replies --work /outside/work
```

接续旧串时加 `--thread 根帖ID`，多个旧串可重复该参数。工具为每个根串输出 `rootId` 和 `replyCount`，作为本次新增回复额度。回复的回复也归入最终根串计数，重复执行保持原抽取结果，实际数量可以低于额度。

抽签设置集中在 `publication.json` 的 `replyLottery`：90%的权重落在0–10条、10%的权重落在21–60条，各档内整数等概率；`maxReplies` 为一轮新增回复总上限，默认100条，`maxBatchPosts` 为主帖与回复合计硬上限，默认120条。新操作保存当时设置，恢复沿原设置继续，当前硬上限同样有效。用户指定总量时同时遵守该上限。

把采用的回复追加进同一份 `posts`，保留真正父帖与先后关系。首页展示主帖，点击评论进入帖子页面，查看原帖与整串守宫回复；回复按时间排列并标明实际回复对象，可以点赞和查看角色主页。个人主页保留该守宫的主帖和回复，`?post=帖子ID` 可直接打开对应讨论。评论来自归档的虚拟社群内容，页面不接受访客投稿。

## 生成并归档配图

确定本次实际 `posts` 后执行：

```sh
python3 gsm/tools/update.py suggest --work /outside/work
```

工具按保存的随机依据输出互不重复的 `imagePostIds`。沿这些目标实际调用 AI 生图、打开每张图片，完成正文和 `alt` 核对；生成受限时保留当前操作与已完成结果，沿原操作接续。

每个根串使用一个帖子包，正文、回复和配图一起保存；回复图片放在原根串的 `media/`。新图先放入该目录，登记 `{"src":"posts/YYYY/MM/根帖ID/media/文件名.png","alt":"实际画面的简短说明"}`。每帖最多四张，采用已经检查并可用于发布的文件。

导入器将 PNG、JPEG 等输入转换为 WebP，采用质量 82、method 6，保留画面尺寸、透明和动画；已有 WebP 沿用原字节。转换成功后同步操作文件与 Markdown 中的图片路径，核对归档后删除被替换的原图。直接编辑 Markdown 添加的图片由构建完成同一处理，转换记录支持中断后接续。

已发布内容的正文与图片只在帖子包中保存。信息流由原稿生成，发布收据只保存路径与校验值；当前工作文件在完成线上核验后清理。

## 导入与上线

`posts` 为空时，执行 `python3 gsm/tools/update.py finish --work /outside/work`，报告已做的观察和未发帖原因，结束本次更新。

有待发布发言且审读完成后执行：

```sh
python3 gsm/tools/update.py ingest --reviewed --work /outside/work
python3 gsm/tools/update.py validate
python3 gsm/tools/publish.py build
```

导入器核对当前操作、主帖与回复预算、实际作者比例、账号权限、资料变化、观察记录、配图目标、重复内容、回复关系、时间和媒体。资料在创作期间变化时，用原工作目录重新执行 `prepare`，读清变化并重新审读原草稿。

帖子 Markdown 是正文来源：

```text
posts/YYYY/MM/根帖ID/
  index.md
  replies/回复ID.md
  media/配图文件
```

回复和图片归入原根串，即使回复发生在其他月份。既有历史帖子包保持原路径。

完成[资料回写](writing.md#资料回写)，运行[相关检查](../tests/README.md)并核对手机页面。把帖子、配图、必要资料、生成信息流和账号读取结果放在同一个提交中，核对最新 `main` 后正常推送。远端有新内容时先合并、补读并检查。网页样式保持原有版本。

确认对应 GitHub Pages 发布成功后，以原工作目录执行 `finish`。工具核对线上 `https://umwelt.fivsevn.com/gsm/data/feed.mjs` 的本次发言和实际图片，成功后清理当前工作文件；失败保留记录，继续核验原发布。

## 恢复与修正

中断后使用原工作目录、原帖子 ID 和草稿。已归档且内容相同的帖子跳过，缺少部分继续补齐；同 ID 的不同内容要求核对。`gsm/.publishing/update-pending.json` 保留未完成导入清单，未完成时拒绝生成半批信息流。工作目录的锁协调准备、导入与收尾；确认原执行进程退出后再处理遗留锁。

需要重写未完成导入时执行 `python3 gsm/tools/update.py cancel --work /outside/work`。工具只撤回本次清单中仍吻合、尚未进入 Git 的新归档文件，手工变化与既有帖子保留。已经完成归档的旧帖直接编辑原 Markdown，保留 ID、作者、时间、回复关系和既有媒体，再重新校验构建。作者保留账号的正文由作者维护。

## 人工内容与头像

人工文字或图文继续编辑 [`trigger.md`](../trigger.md)，支持 `username`、`date`、`status`、`likes` 配置与 Markdown 图片；也可以只把图片放进 [`uploads/`](../uploads/)。未指定用户时从启用且“可随机分配”的账号选取，已分配作者永久归档。上线核验成功后清理对应上传原图并清空已发布的 `trigger.md` 输入；同名新图、后续新稿与待发布输入保留。AI 更新使用上面的批次入口，按实际文件归档。

新增常驻守宫：复制[模板](../users/TEMPLATE.md)到 `users/用户名/profile.md`，稳定 ID、用户名与目录保持一致，再构建。修改网名、签名、开关或权重只改该档案；停用使用“启用账号：否”，历史身份和档案保留。

头像原图放在本人目录，账号表填写文件名。留空表示保留已经分配的头像，新账号无原图时生成现有守宫默认头像。自定义照片与原图保留原有转换、裁切及许可设置，改名和改开关不会重画头像。明确需要统一已有默认头像时才使用 `python3 gsm/tools/publish.py migrate-default-avatars`；它只处理明确标记为默认生成的头像。

## 页面与构建维护

本地页面：在仓库根目录运行 `python3 -m http.server 8797 --bind 127.0.0.1`，打开 [爬爬在线](http://127.0.0.1:8797/gsm/)。页面代码在 `gsm/`，语言设置在 `settings/`，运行素材在 `assets/`，生成信息流在 `data/feed.mjs`；检查方法集中在[测试说明](../tests/README.md)。

`brand.mjs` 管16×16标志和默认头像，`physical-shell.css` 管外壳热区，`pager-screen.css` 与 `assets/lcd-matrix.svg` 管屏幕。外壳原稿和生成工具保留在 `tools/`，来源见 `tools/pocket-handset-references.json`。公共字体、部署筛选与版本标记按[仓库发布约定](../../docs/deployment.md)处理，用户与环境源文档、账号配置和工作记录不进入网页成品。
