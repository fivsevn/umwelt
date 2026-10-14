# 观察者像素图标

小鸟、无人机、问号与八种操作使用 16×16 手绘图形。`observer-icons/observer-icons-atlas.pxo` 是真实 Pixelorama 原稿；修改后核对原稿、导出和页面效果。导出图集为 128×128 RGBA，透明背景，最近邻取样。

观察者和操作卡片统一为 36×36 CSS 像素正方形，经过页面整体缩放后仍共用同一尺寸。图标和字体保持原来的大小。

正式页面的小鸟与无人机读取 `rooftop/assets/observers/observer-icons-atlas.png`，问号及方向、加减操作使用 Pixel 字体字符。`rooftop/observer-ui.mjs` 集中定义可访问名称、操作与状态文字；观察者与操作均为独立的 `world-card`，共用左下状态卡的字体、内距、纸面及阴影，每组同排显示，不另加外层面板。小鸟及无人机点击后更新左下角状态，问号沿用已有镜头机制。
