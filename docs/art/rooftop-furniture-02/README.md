# 当前物品原稿

花农时代当前 294 件物品使用 Blender 模型和 Pixelorama 原生贴图。完整结构保留厚度、内壁、背面、底部及连接处；承托面、开口、内底、孔洞和净高由实际模型登记。全部物品为 16 纹理像素／米，画面颗粒使用游戏的共享低采样。

## 最终原稿

| 家族 | 原稿 | 内容 |
| --- | --- | --- |
| `everyday` | `everyday.blend`、`everyday-atlas.pxo` | 架子、桌凳、容器、水池台、工具与晾晒物 |
| `rooms-vessels` | `rooms-vessels.blend`、`rooms-vessels-atlas.pxo` | 居室家具和八件馆藏陶瓷转译 |
| `ceramics-extra` | `ceramics-extra.blend`、`ceramics-extra-atlas.pxo` | 十六件具体名目陶瓷 |
| `pots-retained` | `pots-retained.blend`、`pots-retained-atlas.pxo` | 二十款窑口风格盆和九款常用栽培容器 |
| `plants-retained` | `plants-retained.blend`、`plants-retained-atlas.pxo` | 一百一十种植物 |
| `accents` | `accents.blend`、`accents-atlas.pxo` | 灯、收音机与茶具 |
| `collection` | `collection.blend`、`collection-atlas.pxo` | 六十六款枪械和二十款兵器 |

每个家族的 `*-layout.blend` 保存建模与物理 UV；最终 `.blend` 内嵌原生贴图。`catalog.json` 和 `texture-layout.json` 保留模型资料、实际尺寸、稳定 ID、承放和面 UV。植物、盆器、收藏、枪械与兵器沿用当前名称、来源和选择机制。

馆藏尺寸与游戏尺寸分别记录。未见的背面、内壁或未测量尺寸标明推定，窑口风格盆不标作有确切年代的古董。资料见[器物来源](../../rooftop-art-sources.md)、`vessels-research.json` 及 `ceramics-extra/research.json`；逐件来源也保存在游戏手帐。

## 接入与检查

`assetlib.py` 及家族制作工具负责原生 Blender 建模、导出和核验；`paint-native.py` 通过真实 Pixelorama 绘制与保存。先保护已有手改，修改并重开原稿后再导出，不能直接回放脚本覆盖当前原稿。

正式资源位于 `rooftop/assets/items/`。`sync-runtime-catalog.py` 根据实际 GLB、家族资料和缩略图组合数据同步正式目录与承放资料，统一比例为 `ITEM_METRES_TO_UNITS = 5.6 / 3`。承托面来自真实板顶或容器内底，已填土／水的物件不提供空腔。

目录标记为 `native-items-294-v1`。初始陈列共 118 件；旧目录首次进入车库或房间时恢复当前初始布局，新版个人陈列和主动清空布局正常保留。具体存档和承放契约见[维护与扩容](../../rooftop-maintenance.md)及[承放关系](../../rooftop-placement.md)。

[统一测试的物件组](http://localhost:8765/tests/browser/rooftop.html?mode=item)展开全部 294 件物件图册，可分类、搜索；点击同页近看实际模型，旋转、放大并核对原生／游戏采样，返回保留列表位置。场景组查看完整建筑，初始组合组查看固定陈列和人物。运行 `启动物品页.command` 打开同一测试入口。

铁架的主要细杆在游戏视距下使用有界显示补偿，保留空隙；“看模型”还原原始几何，补偿不写入原稿和导出资源。目录缩略图由[实际模型组合工具](../rooftop-thumbnail-02/README.md)生成，只按可见范围加载，详情与摆放再加载完整模型。
