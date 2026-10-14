# 花农时代 / Horticultural Era

围绕阳台植物、器物与日常观察展开的游戏，包含南北阳台、车库布置与东东的房间。

[维护总入口](../MAINTENANCE.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 游戏入口

- [花农时代](https://umwelt.fivsevn.com/rooftop/)
- [车库／布置](https://umwelt.fivsevn.com/rooftop/arrange/)
- [东东的房间](https://umwelt.fivsevn.com/rooftop/room/)

## 本地运行

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/rooftop/](http://127.0.0.1:8765/rooftop/)。视觉调整使用[统一测试页](http://127.0.0.1:8765/rooftop/tests/browser/rooftop.html)，在同一页查看空场景、物件图册与初始组合。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| 根目录模块、`3d/`、`arrange/`、`room/` | 观察、渲染、陈列编辑与房间 |
| `assets/` | 游戏实际读取的模型、贴图和图标 |
| `art/` | [Blender、Pixelorama 原稿与制作工具](art/README.md) |
| `docs/` | [维护、制作管线、承放、手帐与来源指南](docs/README.md) |
| `tests/` | [自动测试、浏览器回归、固定视觉测试页及样本](tests/README.md) |

## 内容维护

从当前 Blender 和 Pixelorama 原稿继续修改，原稿、运行导出与实际画面分别核对。游戏的像素表现由共享采样控制，完整器形与承放结构保留。扩充物件前阅读[承放关系](docs/placement.md)与 [AGENTS.md](AGENTS.md)；来源、存档及模块约定见[维护与扩容](docs/maintenance.md)。

## 检查

运行 `node tools/check-all.mjs` 检查全项目，或用 `node --test rooftop/tests/*.test.mjs` 检查本游戏。实际布置、存档、房间和固定视觉页面按[测试说明](tests/README.md)核对。
