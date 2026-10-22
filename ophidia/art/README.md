# 体温调节原稿

[游戏文档](../README.md) · [维护总入口](../../MAINTENANCE.md)

| 目录 | 当前原稿 |
| --- | --- |
| [scenes/ferry-cabin/](scenes/ferry-cabin/README.md) | 船舱、窗外环境、灯光与船舱镜头 |
| [snakes/boaedon-capensis/](snakes/boaedon-capensis/README.md) | 棕屋蛇四个姿态、帽子与围巾 |
| [ophidia-01/](ophidia-01/README.md) | 当前组合的镜头设置、出图工具和固定预览 |

两份模型各自保存为 Blender 4.5 LTS 工程，所需纹理已内嵌，各自的 `source/` 保存分卷和校验清单。首次使用可双击 `ophidia-01/还原建模文件.command`，或从仓库根目录运行：

```sh
python3 ophidia/art/ophidia-01/restore_source.py
```

编辑对应原稿并保存，检查后从仓库根目录运行 `python3 ophidia/art/ophidia-01/archive_source.py --asset ferry-cabin` 或 `--asset boaedon-capensis` 更新该原稿的分卷。省略 `--asset` 时处理两份原稿。还原工具会核对分卷及完整文件的 SHA256，并拒绝覆盖本地修改。

需要出图时，按[组合与出图说明](ophidia-01/README.md)生成 `ophidia-01/ophidia.blend`。运行图层继续保存在 `ophidia/assets/`。以后有实际模型时，再在 `scenes/` 或 `snakes/` 下各建独立目录。
