# 实际物品组合与缩略图

全部 294 个目录缩略图由实际游戏的 `createGardenRenderer.thumbnail` 生成，复用原生 GLB、Pixelorama 图集、植物组合、默认花盆及土面。目录、手帐和摆放模型使用同一组合规则。

`audit.json` 保存每个实际模型 ID、默认花盆、参考 seed、完整可见边界、PNG 与 GLB 的 SHA256，以及原模型投影的接触点和米／像素比例。这份组合数据由目录同步工具和测试读取，需要随当前模型保持一致。

实际模型在[统一测试的物件组](http://localhost:8765/rooftop/tests/browser/rooftop.html?mode=item)核对。正式目录按可见范围加载静态缩略图，详情和摆放再加载完整模型。

改变默认花盆、原生模型或组合规则后须重新生成、核对全部边界与非空图像，再更新 `item-data.mjs` 的投影及图像，运行 `rooftop/tests/rooftop-thumbnail-consistency.test.mjs`。手动换盆、换株形和个人陈列保持不变。

生成 PNG 和 `audit.json` 后运行 `python3 rooftop/art/rooftop-thumbnail-02/sync-projections.py`。该命令核对模型、图集和 PNG 散列，由可见像素边界、接触点和米／像素比例计算 `min`／`max`，同步审计和目录中的投影字段，保留摆放与承放元数据。`min`／`max` 用于 2D 回退绘制及选中边界，不参与 3D 碰撞。
