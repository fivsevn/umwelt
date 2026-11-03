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

## 当前解剖校正与检查

当前原稿保留四个姿态、针织帽、连续围巾和船舱中的角色呈现比例。蛇本体调整了吻部、颈部过渡、内嵌虹膜、竖瞳和独立透明眼罩；头盾、眼周鳞、上下唇鳞与颏盾分别可选。躯干背鳞重新沿连续皮肤排列，以面属性 `scale_id` 选择；宽腹鳞与成对尾下鳞以 `scute_id` 选择。

背鳞采用更短、更薄的搭接叶片，沿鳞行加入小幅连续偏移及单片大小变化；头鳞减薄并沿皮肤法线着色，减少硬壳般的亮边。皮肤具有细微色斑、微表面纹理和随位置变化的粗糙度。虹膜与透明眼罩分别处理漫反射和反光，避免两层同时产生不自然的亮斑。检查图保持原有灯光与镜头。

依据及边界见 [物种与叙事依据](reference/species.md)。这是照片和物种描述引导的数字模型；当前船舱中的放大比例属于角色呈现，不代表本种实际体长。连续皮肤可用 `validate_anatomy.py` 检查；本地检查报告不入库，也不代替与实物照片逐项比对。

- `render_review.py`：原有船舱灯光中的面部、衣料和全身近景。
- `render_anatomy.py`：临时隐藏服饰，用中性灯光检查侧面、背面和腹面；不把检查设置写回原稿。
- `validate_anatomy.py`：四姿态的闭合皮肤、连通性、退化面、鳞片及服饰检查。
- `refine_anatomy.py`：本次校正的可复查步骤。输入为校正前原稿，使用 `--source` 和 `--output` 指定；已校正的原稿不能重复执行。

从仓库根目录检查当前模型：

```sh
blender -b --python-exit-code 1 --python ophidia/art/snakes/boaedon-capensis/render_anatomy.py -- --source ophidia/art/snakes/boaedon-capensis/boaedon-capensis.blend --output ophidia/art/snakes/boaedon-capensis/review
blender -b --python-exit-code 1 --python ophidia/art/snakes/boaedon-capensis/validate_anatomy.py -- --source ophidia/art/snakes/boaedon-capensis/boaedon-capensis.blend --report /tmp/ophidia-anatomy-validation.json
```

## 围巾

围巾采用重新建立的一张连续闭合布带和锈红配色：绕颈一圈，在前侧形成松单结，两端自然垂下。从长端出发，可连续追踪经过结心、绕颈段、返回结心并穿出短端的完整路径。结内布带收窄，离开结后逐渐展开。主体、细布边、凸起纱线、短绒与捻线流苏分别可编辑；织纹沿实距 UV 随布面弯曲。流苏为三股细线，长短和弯曲略有不同。

织物表面采用 Poly Haven 的 [Poly Wool Herringbone](https://polyhaven.com/a/poly_wool_herringbone) 扫描纹理，再以材质保留锈红色；贴图已内嵌原稿，来源、作者与 CC0 许可见 [纹理说明](reference/wool/LICENSE.txt)。

`retie_scarf.py` 以包含已确认蛇体、帽子和围巾支撑位置的原稿为输入，通过 `--source` 和 `--output` 指定文件，仅重建围巾。面属性 `scarf_region` 标记长端、结中两股、左右过渡、绕颈和短端，便于逐段检查；`scarf_textile.py` 提供织物材质及纤维工具，并优先复用原稿内嵌贴图。系法参照 [绕一圈后打单结](https://www.gentlemansgazette.com/how-to-tie-a-scarf/) 与 [单结的上下穿绕](https://www.animatedknots.com/half-knot)。

`validate_scarf.py` 检查闭合布带、有限坐标、与主皮肤的间隙、非相邻三角形穿插，以及绕颈圈数和结中交叉的上下顺序；加 `--baseline` 可核对蛇体和帽子的几何未变。检查报告通过 `--report` 输出到仓库外；褶皱与布料接触同时结合原生渲染检查。

[穿绕检查图](review/scarf-tying-structure.png)按布带路径分色，便于观察结心的上下关系；模型中的布带仍是一张连续网格。

织物近景可运行 `render_review.py -- --views scarf`；该镜头临时生成，不修改组合原稿。
