# Thermoregulation / 体温调节

渡轮窗边的竖屏对话游戏，桌面程序名为 **OPHIDIA.EXE**。

[维护总入口](../MAINTENANCE.md) · [共用规则](../docs/structure.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 名称与标识

| 项目 | 名称 |
| --- | --- |
| 中文 | 体温调节 |
| English | Thermoregulation |
| 日本語 | 体温調節 |
| 桌面文件名 | `OPHIDIA.EXE` |
| 仓库目录 | `ophidia/` |

遵循[游戏名称规则](../docs/naming.md)。目录标识与程序文件名固定，可读标题随语言切换。

## 游戏入口

- [体温调节](https://umwelt.fivsevn.com/ophidia/)

## 本地运行

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/ophidia/](http://127.0.0.1:8765/ophidia/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| `index.html`、`game.js`、`style.css` | 页面、三语对白、选择分支与交互 |
| `assets/` | 船舱背景和四个角色姿态 |
| `art/` | [建模原稿、分卷、来源与固定预览](art/README.md) |
| `docs/` | [玩法、内容扩充与存档边界](docs/README.md) |
| `tests/` | [游戏、模型预览和像素对照检查](tests/README.md) |

## 内容维护

对白与选项同步维护中文、英文和日文，增加选择时同步分支连接与检查。当前只持久化语言设置，航程刷新后重新开始。建模分别从船舱与蛇的 Blender 原稿继续，修改后更新各自分卷；出图时使用组合工程；具体步骤见[维护指南](docs/maintenance.md#内容与扩容)和[建模说明](art/ophidia-01/README.md)。

## 检查

运行 `node tools/check-all.mjs` 检查全项目结构；本游戏的完整试玩、模型与像素对照分别运行 `ophidia/tests/browser/` 下的三个脚本，命令与范围见[测试说明](tests/README.md)。这些专项脚本尚未接入 CI；Pages 的入口检查不能替代完整剧情与原稿检查。
