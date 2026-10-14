# UMWELT 开发与维护文档

从这里进入各游戏的视觉制作、内容维护和扩容指南。文档描述当前仓库的实现与约定；本地检查、原稿保存和线上发布分别记录，不能互相代替。

## 游戏入口

| 游戏 | 开发文档 | 本地页面（相对仓库根目录） |
| --- | --- | --- |
| 花农时代 / Horticultural Era | [总入口](rooftop-README.md)、[维护与扩容](rooftop-maintenance.md) | `/rooftop/`、`/rooftop/arrange/`、`/rooftop/room/` |
| THERMOREGULATION / 体温调节 | [玩法、内容与检查](../ophidia/README.md)、[建模与出图](art/ophidia-01/README.md) | `/ophidia/` |
| 等足目赋格 / Isopoda Fugue | [文档导航](../isopoda/docs/README.md)、[内容地图](../isopoda/docs/content-map.md) | `/isopoda/`、`/isopoda/morphology/`、`/isopoda/habitat.html` |
| TICK.SYS | [交互与视觉说明](../tick/README.md) | `/tick/` |

## 按下一轮工作进入

| 工作 | 先读 | 核对位置 |
| --- | --- | --- |
| 调整模型、贴图与画面 | [原稿与制作资料索引](art/README.md)、[花农时代像素管线](rooftop-pixel-style.md)或[体温调节建模说明](art/ophidia-01/README.md) | 源文件、运行导出、固定本地检查页分别核对；花农时代使用[统一测试页](rooftop-scene-review.md) |
| 深化对白、手帐与资料 | [花农时代手帐](rooftop-notebook.md)、[体温调节内容维护](../ophidia/README.md#内容与扩容)、[等足目内容地图](../isopoda/docs/content-map.md) | 区分资料事实、创作文本和游戏参数；同步现有语言和资料出处 |
| 扩充物件、物种或场景 | [花农时代承放契约](rooftop-placement.md)、[等足目扩展工作流](../isopoda/docs/expansion-guide.md)、[体温调节内容维护](../ophidia/README.md#内容与扩容) | 稳定 ID、存档、来源、原稿和对应浏览器流程 |
| 修改共享功能或准备发布 | [全项目维护](maintenance.md)、[共享音频](audio.md)、[验证与发布](deployment.md) | [测试导航](../tests/README.md)及最终发布目录 |
| 制作桌面包 | [原生桌面说明](../mac/README.md) | 原生窗口、离线运行、独立存档和安装包；网页检查不能替代原生检查 |

## 本地开始

在仓库根目录运行，网页无需打包：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [本地主页](http://127.0.0.1:8765/) 或上表中的路径。花农时代的固定检查入口是 [统一测试页](http://127.0.0.1:8765/tests/browser/rooftop.html)。体温调节的专用启动器默认使用 8788；两个端口服务的都是同一仓库，浏览器检查的地址参数见[测试导航](../tests/README.md)。

结构检查从仓库根目录运行（CI 使用 Node.js 22）：

```sh
node isopoda/tools/check-all.mjs
```

此命令覆盖全仓库结构与数据契约，不启动浏览器，也不检查全部文档链接。根据改动补充对应游戏的浏览器或原稿检查。

## 文档归属

- 根目录三语 README：项目介绍、公开入口与许可说明。
- `docs/`：项目共用维护与发布说明；花农时代现行指南沿用 `rooftop-*.md` 路径。
- `docs/art/`：当前原稿、制作工具、来源与固定检查页。目录中的版本号表示制作批次，不代表整个目录已归档。
- `isopoda/docs/`：等足目的现行契约、扩展指南与提案模板。其他游戏从各自 README 进入。
- `docs/reference/`、`isopoda/docs/reference/`：带日期或版本的阶段记录。历史数量、路径和验收结果只对应记录当时；[项目历史索引](reference/README.md)、[等足目历史索引](../isopoda/docs/reference/README.md)。

每项规则只在所属文档维护，其他入口链接到它。已完成事项从待办中移除；尚未实施的想法明确标为提案，不能写成当前能力。新增或移动文档时同步上级索引、相对链接和命令入口。

游戏会读取的 `isopoda/credits*.md`、字体许可、科学来源数据和可编辑原稿各有运行或来源用途。文档清理遵循[零前端变化验证](deployment.md#文档整理的零前端变化验证)，不按文件后缀批量删除。
