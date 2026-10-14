# 当前共用材质书

人物、衣服装饰及室外门仍使用 `material-book.pxo` 导出的 `rooftop/assets/pixel/material-book.png`。此目录保留当前材质原稿、区域定义及其必要制作核验工具，物品模型从[当前物品原稿](../rooftop-furniture-02/README.md)继续修改，建筑与房间分别见[建筑原稿](../rooftop-lowpoly-02/README.md)和[房间原稿](../rooftop-room-02/README.md)。

`material-book.pxo` 是真实 Pixelorama 原稿，含 215 个 32×32 材料区域，512×512 图集；`book-layout.json` 定义其坐标与用途。一像素 Pencil 和整数坐标绘制，保存后独立重开核对 cel RGBA 与运行 PNG。

人物使用当前 16 纹理像素／米的表面标定。不同运行对象的单位换算按各自模型接口处理，保留 `native-style.mjs`、`native-materials.mjs` 和 `native-book.mjs` 的共用机制，不通过全局替换密度数值改变画面。

已有 PXO 手改应保留，准备工具不能直接回放覆盖。原稿修改后分别核对导出、人物与门的实际页面效果，以及最终发布包。完整规则见[美术管线](../../docs/pixel-style.md)。
