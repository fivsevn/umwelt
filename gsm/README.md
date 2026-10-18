# Gstream / 爬爬在线

仿 X／微博的轻互动信息流，后续优先制作；当前仅制作占位图标与入口。

[维护总入口](../MAINTENANCE.md) · [共用规则](../docs/structure.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 名称与标识

| 项目 | 名称 |
| --- | --- |
| 中文 | 爬爬在线 |
| English | Gstream |
| 日本語 | ジー投稿 |
| 桌面文件名 | `GSM.BIO` |
| 仓库目录 | `gsm/` |

遵循[游戏名称规则](../docs/naming.md)，与另一个媒体项目独立维护。

## 游戏入口

[线上占位页](https://umwelt.fivsevn.com/gsm/)。当前仅开放占位，平台功能仍在制作中。

## 本地运行

从仓库根目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，打开 [/gsm/](http://127.0.0.1:8765/gsm/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| `index.html` | 简单占位页，复用公共样式与语言切换 |
| `assets/icon.png` | 当前 32 × 32 透明像素图标 |
| `art/icon/` | Pixelorama 原稿、笔触记录与导出说明 |
| `docs/` | [范围与替换方法](docs/README.md) |
| `tests/` | [核对入口](tests/README.md) |

## 内容维护

本轮只含图标与占位页，平台功能尚未实施。三语名称统一读取 `shared/games.mjs`；字体及占位页组件从公共目录引用。

图标从 [Pixelorama 原稿](art/icon/icon.pxo) 继续编辑，按[制作说明](art/icon/README.md)导出到固定路径。项目特有内容留在本目录。

## 检查

从仓库根目录运行 `node tools/check-all.mjs`。三语与预览核对方法见[测试说明](tests/README.md)。
