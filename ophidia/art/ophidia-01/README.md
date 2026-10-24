# 体温调节 · 组合与出图

[原稿目录](../README.md) · [船舱](../scenes/ferry-cabin/README.md) · [棕屋蛇](../snakes/boaedon-capensis/README.md)

此目录保存当前镜头组合、预渲染素材、出图工具和固定检查页面。模型分别在船舱的 `ferry-cabin.blend` 和蛇的 `boaedon-capensis.blend` 中编辑、保存与归档。

## 当前组合

`composition.json` 记录本次使用的原稿及集合；`composition-setup.blend` 保存原有场景出图设置、角色前景镜头和三个角色细节镜头。运行：

```sh
blender -b --python ophidia/art/ophidia-01/compose_scene.py
```

脚本使用相对路径链接两份原稿，生成本地 `ophidia.blend`。主镜头与船舱灯光来自船舱原稿，角色前景镜头的焦点连接到当前蛇姿态。组合文件可以直接打开检查；每次出角色图前会重新生成。调整组合镜头时编辑 `composition-setup.blend`，调整船舱镜头时编辑船舱原稿。

`Foreground portrait camera` 保留原有方向与焦距，沿轴前移 0.10 m；每个姿态对焦头部，f/2.8。蛇保留原有位置和父级变换。接触阴影仍由船舱座垫与软靠背承接，桌沿遮挡仍来自真实桌面几何。

## 修改与出图

从仓库根目录运行：

1. 首次运行 `python3 ophidia/art/ophidia-01/restore_source.py` 还原两份原稿，在对应模型文件中修改并保存。
2. 运行 `blender -b --python ophidia/art/ophidia-01/render_character_layers.py`，重新组合并输出四个角色姿态、接触阴影和模型检查图。只出角色图时在末尾加 `-- --portrait-only`。临时渲染设置不会保存回原稿。
3. 运行 `python3 ophidia/art/ophidia-01/export_layers.py` 更新游戏角色图层、合成预览和四姿态图，需要 Pillow 与 NumPy。背景文件默认保持原样；修改船舱后运行 `blender -b --python ophidia/art/ophidia-01/render_background.py`，再为导出命令加 `--refresh-background`。
4. 检查模型和游戏画面后，运行 `python3 ophidia/art/ophidia-01/archive_source.py --asset ferry-cabin` 或 `--asset boaedon-capensis`，更新修改过的原稿分卷。

背景保留 180×320 网格、2 px 像素块和 96 色；角色以 720×1280 渲染，缩为 360×640、四姿态共享 256 色。浏览器继续叠加五张无损 WebP。

## 固定检查页

从仓库根目录运行 `python3 -m http.server 8788 --bind 127.0.0.1`，或双击 `启动本地预览.command`。

- 游戏：`http://127.0.0.1:8788/ophidia/`
- 模型检查：`http://127.0.0.1:8788/ophidia/art/ophidia-01/preview/model-review.html`
- 像素对照：`http://127.0.0.1:8788/ophidia/art/ophidia-01/preview/pixel-style/index.html`

检查页与当前渲染图持续使用同一路径；船舱照片在船舱目录，物种资料在蛇目录。各项检查命令见[测试说明](../../tests/README.md)。现有 Pages 打包排除 `art/`。
