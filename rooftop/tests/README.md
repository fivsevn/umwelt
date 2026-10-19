# 花农时代测试

[游戏文档](../README.md) · [全项目测试](../../tests/README.md)

从仓库根目录运行：

```sh
node --test rooftop/tests/*.test.mjs
ROOFTOP_REVIEW_ORIGIN=http://127.0.0.1:8765 node rooftop/tests/browser/rooftop-review-check.cjs
```

`browser/` 保存固定视觉测试页与浏览器回归，`fixtures/` 保存初始、历史陈列，`helpers/` 保存模型射线辅助。浏览器需要已启动的本地服务、Playwright 和 Chrome／WebKit；截图写入仓库外的 `QA_OUTPUT`。

## 浏览器回归

天台无视觉变化维护使用 `browser/rooftop-maintenance.cjs`；模块职责与对比运行方式见 [天台维护指南](../docs/maintenance.md)。

状态栏使用 `rooftop-status-journal.test.mjs` 验证北京时间、事件顺序、短暂变化过滤、重复合并和活动片段；`browser/rooftop-card-feed.cjs` 验证实际 DOM 的固定时间、4 条记录上限、固定操作位置、出入与音乐事件，以及桌面／窄屏和运行中切换减少动态偏好。

花农时代日常视觉调整使用固定入口：[browser/rooftop.html](browser/rooftop.html)。固定同一视口切换空场景、单个目录物件、固定初始组合三组，集中检查材质、光照、天气、季节、时间及原生／游戏采样，不使用个人陈列存档。运行方法及专项人物页见[统一测试说明](../docs/scene-review.md)。

天台扩容：`node --test rooftop/tests/*.test.mjs`；`browser/rooftop-expansion.cjs` 在 Chromium / WebKit 验证分类、手帐、承托、存档、昼夜灯光、透明像素、旋转与手机布局。`BASE_URL` 可指向已部署页面。

花农时代的 `rooftop-regression.yml` 在 Chromium / WebKit 自动运行维护、车库布局、房间、行动卡、兵器、模型、公开观察和季节回归。`rooftop-room.cjs` 验证房间与车库共享存档、跨页面同步、换装和活动反馈、导入导出及手机布局。维护脚本的 `COMPARE_URL` 可对照三个车库场景和三个公开入口，共 36 组画面。

透明雨衣与等概率雨天分支由 `rooftop-raincoats.test.mjs` 检查：连续降雨只抽一次、雨型过渡、雨中行走与停止园艺、室内和雨停脱衣及原稿三角化。`browser/rooftop-raincoats.cjs` 在隔离浏览器中分别固定两种结果，检查南北场景、桌面与窄屏、实际模型显隐、行走、保存内容和动态偏好切换。
