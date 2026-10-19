# 东东与小猪的透明雨衣

`raincoats.blend` 保存独立可编辑的透明外衣，以及原时装 `smoking` 集合作为试穿参考。东东包含开口帽兜、长衣身、前襟和两只独立袖子；小猪包含背部罩衣、帽兜、下摆和胸前扣带。薄膜不封住面部、手脚和小猪的尾巴，衣边用细透明包边表现。

运行网格为 `rooftop/fashion/raincoat-meshes.mjs`，由 Blender 原稿导出，`raincoats.mjs` 将各片挂到原有身体、头部和手臂关节。宽袖小袖装的外层袖子沿原肩关节放宽、加长 25%，保留原服装。雨衣外出时东东的行走半径随外层扩大为 0.76，雨停恢复原值。游戏、人物预览共用几何；雨衣不改服装记录或玩家存档。材质为透明薄膜和半透明接缝，保留深度测试、关闭深度写入和实体阴影，无额外折射渲染通道。最终颗粒继续使用场景共用采样。

透明薄膜使用无色材质；试穿参考沿用已批准并打包的 Pixelorama 材质书，没有重绘原贴图。原始来源是 `rooftop/art/rooftop-game/material-book.pxo`。

```sh
# 仅初次或明确重建模型时使用；不要覆盖 Blender 中的新手改。
blender -b --python rooftop/art/rooftop-raincoats/build-source.py
# 从保存的原稿重新导出，保留手改。
blender -b --python rooftop/art/rooftop-raincoats/build-source.py -- --export
blender -b --python rooftop/art/rooftop-raincoats/build-source.py -- --verify
```

本地[试衣页](../rooftop-actors-02/preview/index.html?raincoat=true)增加「透明雨衣」开关，可切换全部 60 套、走路、正背面及原生／游戏采样。运行验证见 `rooftop/tests/rooftop-raincoats.test.mjs` 和 `rooftop/tests/browser/rooftop-raincoats.cjs`。

每段连续降雨在开始时抽一次，外穿雨衣散步和原来的屋檐／门边避雨各占 50%。两名角色共用结果，雨型、时段和南北场景切换不重抽。雨停且可见降雨消退后清除选择；下次下雨重新抽取。雨中外出仍暂停浇水和园艺，房间不穿雨衣。原有强降雨时进入门内的避雨行为继续保留在避雨分支。
