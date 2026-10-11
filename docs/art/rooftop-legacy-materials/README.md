# 花农时代旧材质制作代码

2026-10-10 从正式资源目录归档的五个模块。当前游戏使用 `rooftop/3d/native-materials.mjs` 和 Pixelorama 导出的 `rooftop/assets/pixel/material-book.png`；本目录不进入 Pages 发布包。

| 文件 | 保留用途 |
| --- | --- |
| `pixel-materials.mjs` | 旧材质参数与笔画计划；`../rooftop-game/prepare-book.mjs` 仍引用它 |
| `environment-paintings.mjs` | 旧建筑和铺地绘制配方 |
| `resident-paintings.mjs` | 旧皮肤、头发与衣料配方 |
| `paint-recipes.mjs` | 旧材质笔画配方 |
| `contact-paint.mjs` | 旧接触暗部算法及历史测试 |

归档只调整导入路径，保留算法、参数和历史测试。`face-paintings.mjs`、`vessel-art.mjs` 和 `weathering.mjs` 仍被正式模型依赖，留在 `rooftop/3d/`。

此目录保留制作依据，不作为新一轮背景、家具或角色的视觉验收标准。不要运行旧原稿生成命令覆盖已有 PXO 或 Blend。当前结构和重制顺序见 [仓库梳理与视觉重制边界](../../rooftop-rebuild.md)。
