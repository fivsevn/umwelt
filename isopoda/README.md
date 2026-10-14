# Isopoda Fugue / 等足目赋格

以等足类动物为主要对象的浏览器交互作品。两个阿西莫夫实验室承载物种与环境的科学背景资料。

[维护总入口](../MAINTENANCE.md) · [文档导航](docs/README.md) · [测试说明](tests/README.md)

## 游戏入口

- [等足目赋格](https://umwelt.fivsevn.com/isopoda/)
- [阿西莫夫形态实验室](https://umwelt.fivsevn.com/isopoda/morphology/)
- [阿西莫夫环境实验室](https://umwelt.fivsevn.com/isopoda/habitat.html)

## 本地运行

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/isopoda/](http://127.0.0.1:8765/isopoda/)。

## 目录与文档

| 位置 | 内容 |
| --- | --- |
| 根目录游戏模块、`data/`、`locales/` | 游戏流程、对白、物种与来源、翻译 |
| `morphology/`、`habitat.html`、`scenery/` | 两个实验室、形态与环境绘制 |
| `docs/` | [内容地图与现行指南](docs/README.md)、[运行模块地图](docs/runtime-map.md) |
| `tests/`、`tools/`、`dev/` | 游戏测试、专属数据检查、本地开发预览 |

## 内容维护

扩充前阅读[内容地图](docs/content-map.md)和[扩展流程](docs/expansion-guide.md)。保持物种、场景、环境、结尾及存档 ID 稳定，并同步现有语言。来源记录由共享登记表管理，具体论文归入对应实验室；游戏 Credits 保留总括来源，详见 [AGENTS.md](AGENTS.md) 与[实验室约定](docs/laboratories.md)。

## 检查

运行 `node tools/check-all.mjs` 检查全部结构与数据；只运行本游戏的 Node 测试可用 `node --test isopoda/tests/*.test.mjs`。实验室、观察流程、语言及存档的浏览器检查见[测试说明](tests/README.md)。
