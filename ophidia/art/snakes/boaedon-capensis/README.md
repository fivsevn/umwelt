# 棕屋蛇

[原稿目录](../../README.md) · [组合与出图](../../ophidia-01/README.md)

`boaedon-capensis.blend` 保存当前蛇的 normal、curious、away、tongue 四个姿态，身体、橄榄针织帽和锈红羊毛围巾在同一文件中。每个姿态保留原有网格、材质、父级和焦点物体，纹理已内嵌。编辑时只显示一个 `Snake · …` 集合。

首次使用从仓库根目录运行：

```sh
python3 ophidia/art/ophidia-01/restore_source.py --asset boaedon-capensis
```

科学原型为 **Boaedon capensis（Brown House Snake；棕屋蛇为项目暂译）**。当前暖沙褐皮肤、浅腹、头纹、唇鳞、侧眼、紧凑盘绕与直立前身保持原样；衣帽仍是可编辑结构。造型尺寸不作标本测量值。[物种与叙事依据](reference/species.md)

`photo_body.py`、`photoreal_snake_anatomy.py`、`photoreal_snake_cloth.py` 保存身体、皮肤和衣物的构造方法，`snake_model.py` 提供网格与材质辅助函数。这些脚本按原有构造阶段使用，不应在已完成的工程上重复施加缩放或重建。

在本文件修改并保存后，运行：

```sh
python3 ophidia/art/ophidia-01/archive_source.py --asset boaedon-capensis
blender -b --python ophidia/art/snakes/boaedon-capensis/verify_body_crossings.py -- --report /tmp/ophidia-body-crossing-check.json
```

第二条命令只读检查身体网格的非相邻表面相交。也可直接使用 `ophidia/art/source_archive.py` 还原本目录的 `source/`；只取用蛇时，带走此目录和这份通用工具即可。
