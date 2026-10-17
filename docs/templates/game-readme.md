<!-- 复制到 <game>/README.md 后填写占位内容；相对链接以游戏根目录为基准。 -->
# English Title / 中文标题

用一两句话说明游戏的内容与体验。

[维护总入口](../MAINTENANCE.md) · [共用规则](../docs/structure.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 名称与标识

| 项目 | 名称 |
| --- | --- |
| 中文 | 中文标题 |
| English | English Title |
| 日本語 | 日本語タイトル |
| 桌面文件名 | `GAME.EXE` |
| 仓库目录 | `game/` |

遵循[游戏名称规则](../docs/naming.md)。目录标识与程序文件名固定，可读标题随语言切换。

## 游戏入口

- [中文标题](https://umwelt.fivsevn.com/game/)

## 本地运行

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/game/](http://127.0.0.1:8765/game/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| `index.html`、运行模块 | 游戏页面与交互 |
| `docs/` | [维护指南](docs/README.md) |
| `tests/` | [测试命令与覆盖范围](tests/README.md) |

仅列出本游戏已有的目录；需要时补充素材、数据、翻译、原稿和子页面。

## 内容维护

说明扩充的入口、语言和来源要求、稳定 ID 与存档边界，链接到详细规则。

## 检查

从仓库根目录运行 `node tools/check-all.mjs`。在[测试说明](tests/README.md)列出本游戏的检查命令、环境与前置条件，并明确已接入 CI 的范围。
