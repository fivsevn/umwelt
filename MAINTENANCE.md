# UMWELT 维护总入口

UMWELT 由一个主页和各自独立的小游戏目录组成。主页汇集游戏入口，各游戏维护自己的内容、素材、文档和测试。根目录的三语 README 面向访问者，保留项目介绍、游戏主页、来源与许可。

## 项目结构

| 位置 | 职责与入口 |
| --- | --- |
| 根目录 HTML/CSS/JS | 桌面主页与共享窗口 |
| `tick/` | [蜱虫](tick/README.md)：交互、文档与测试 |
| `isopoda/` | [等足目与两个实验室](isopoda/README.md)：内容、科学资料与测试 |
| `rooftop/` | [花农时代](rooftop/README.md)：南北阳台、车库、房间及其原稿 |
| `ophidia/` | [体温调节](ophidia/README.md)：对白、角色与船舱原稿 |
| `assets/` | 共享音频、字体及来源与许可；花农时代的 Three.js 依赖随游戏保存在 `rooftop/3d/vendor/` |
| `docs/` | [共用文档](docs/README.md)：音频、发布及项目维护记录 |
| `tests/`、`tools/`、`.github/` | [共用测试与全仓库检查](tests/README.md)、持续检查与发布 |
| `mac/` | [桌面包装](mac/README.md)与原生检查 |

## 按任务进入

| 工作 | 入口 |
| --- | --- |
| 修改花农时代模型、贴图与画面 | [原稿](rooftop/art/README.md)、[像素管线](rooftop/docs/pixel-style.md)、[固定视觉测试](rooftop/docs/scene-review.md) |
| 修改体温调节模型与图层 | [原稿与还原](ophidia/art/README.md)、[专项检查](ophidia/tests/README.md) |
| 深化对白与资料 | [花农时代手帐](rooftop/docs/notebook.md)、[体温调节内容](ophidia/docs/maintenance.md)、[等足目内容地图](isopoda/docs/content-map.md) |
| 扩充物件或场景 | [花农时代承放](rooftop/docs/placement.md)、[等足目扩展流程](isopoda/docs/expansion-guide.md) |
| 修改共享功能或发布 | [共享音频](docs/audio.md)、[测试导航](tests/README.md)、[验证与发布](docs/deployment.md) |

## 本地开始

在仓库根目录运行，网页无需打包：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开[本地主页](http://127.0.0.1:8765/)，从主页进入游戏。各游戏 README 维护本地入口，专项测试的命令和前置条件集中在各自的 `tests/README.md`。

全仓库结构检查使用 `node tools/check-all.mjs`，覆盖范围见[测试导航](tests/README.md)。发布流程与线上验证见[验证与发布](docs/deployment.md)。

## 文档与内容归属

- 三语根 README 用于公开展示。游戏列表只列主页，顺序与主页图标一致；等足目另列两个实验室。
- 游戏 README 统一为「游戏入口、本地运行、目录与文档、内容维护、检查」。`docs/` 保存现行指南，`tests/` 保存测试、样本和辅助，`art/` 保存可编辑原稿与制作工具；没有内容时不预建空目录。
- 根 `docs/`、`tests/` 只维护跨游戏事项。专项规则在所属游戏保留一份，其他文档直接链接到正文。
- 移动文件时更新文档、命令、脚本、来源记录和发布筛选；确认仓库内没有使用者后删除旧入口，不再累积转向页或兼容命令。
- 历史记录保留当时的结论、日期、数量与验证边界；可访问路径跟随现行目录更新。研究规格和原始证据不因过时而当作重复说明删除。
- 原稿、运行导出与检查记录分别核对。扩充内容时保留稳定 ID、存档兼容、语言与来源对应关系；提案注明尚未实施。

游戏读取的 Credits、科学来源数据、字体许可具有运行或授权用途，按实际引用维护。文档整理的验证范围与需要保留的运行差异见[发布约定](docs/deployment.md#文档与目录整理验证)。
