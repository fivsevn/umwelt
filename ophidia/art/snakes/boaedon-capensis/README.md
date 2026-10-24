# 棕屋蛇

[原稿目录](../../README.md) · [组合与出图](../../ophidia-01/README.md)

`boaedon-capensis.blend` 是可继续编辑的 Blender 4.5 LTS 原稿，包含 `normal`、`curious`、`away`、`tongue` 四个静态姿态。每态在独立的 `Snake · …` 集合中，编辑时只显示一个姿态。

身体、颈部与头部是一张连续闭合的主皮肤；实体鳞片、眼睛、嘴线、帽子和围巾分别可选、可编辑。鳞片网格可按面属性 `scale_id` 选择单片。皮肤颜色图片已内嵌。帽子为橄榄色针织帽，锈红围巾由连续绕颈、搭接和垂落的布带构成。

首次使用，从仓库根目录还原原稿：

```sh
python3 ophidia/art/ophidia-01/restore_source.py --asset boaedon-capensis
```

直接打开原稿修改。保存后更新分卷：

```sh
python3 ophidia/art/ophidia-01/archive_source.py --asset boaedon-capensis
```

游戏图层的重出和导出见[组合与出图](../../ophidia-01/README.md)。只出角色近景可运行 `blender -b --python ophidia/art/snakes/boaedon-capensis/render_review.py`。

科学原型为 **Boaedon capensis（Brown House Snake；棕屋蛇为项目暂译）**，造型包含艺术调整。[物种与叙事依据](reference/species.md)

帽子针织曲线参考 Keenan Crane（2023）[A Simple Parametric Model of Plain-Knit Yarns](https://www.cs.cmu.edu/~kmcrane/Projects/Other/YarnCurve.pdf)，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 注明来源。
