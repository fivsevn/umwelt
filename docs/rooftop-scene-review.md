# 花农时代综合场景测试

`/rooftop/?stage=background` 是唯一且永久为空的场景测试页。同一页检查北天台、南阳台的材料、天气、季节、时间和六种取景，标题为“空场景 · 综合测试”。

从仓库根目录提供静态文件后，打开[本地测试页](http://127.0.0.1:4173/rooftop/?stage=background)。原稿与采样规格见[美术管线](rooftop-pixel-style.md)，发布状态见[场景核验](art/rooftop-air-coverage-01/README.md)。

## 场景与视角

“测试场景”切换北天台、南阳台。“测试视角”提供六种取景，均使用游戏共用渲染器和实际建筑：

| 选项 | URL 中的 `view` | 检查用途 |
| --- | --- | --- |
| 天台 | `terrace` | 近处地面、墙面与屋顶，可拖动观察 |
| 楼排 | `row` | 本楼及相邻楼排的整体关系 |
| 远处 | `outlook` | 天空、远景和天气氛围 |
| 小鸟 | `bird` | 游戏小鸟视角 |
| 无人机 | `drone` | 游戏无人机视角 |
| 邻居 | `neighbor` | 游戏邻居视角 |

“自定义天气”“自定义时间点”“自定义季节”提供 8 种天气、7 个时段和四季。阴天规范值为 `overcast`，旧 `cloudy` 链接与保存值继续兼容。场景、视角和环境选择同步写入 URL，刷新或复制链接可重新打开同一组合。

真实空间空气与降水按小鸟、无人机、邻居三个游戏视角验收，包括移动和变倍后的可见范围；邻居使用有效圆形镜片。天台、楼排、远处用于额外材料审核，不要求铺满特效。建筑、光影和特效共用最终屏幕像素格，模型保持完整。

例如：[南阳台、小鸟视角、秋天傍晚小雨](http://127.0.0.1:4173/rooftop/?stage=background&scene=south&view=bird&weather=rain&time=dusk&season=autumn)。

## 空场景与物品

测试页的北天台、南阳台始终没有陈列物品，东东和小猪的模型隐藏。公开观察页和综合测试只清空观察用布局，保留房间及版本元数据，不把空布局写回车库存档。综合测试使用隔离的审核会话存储；带有 `layout=local` 的旧链接也不能引入陈列。

“物品页面”打开独立的 [`/rooftop/arrange/`](../rooftop/arrange/) 车库，负责存档读取、物品编辑与恢复。车库无存档或恢复默认时，南北阳台为空，房间保留原有陈列。房间页面保持独立。

## 兼容入口

- `/rooftop/3d/` 转到综合测试，默认使用小鸟视角。
- `/rooftop/previews/pixel-01/` 转到综合测试，默认使用天台视角。
- `stage=game-model` 和 `test=1` 兼容为 `stage=background`，前者默认使用小鸟视角。

有效的南北场景、天气、时段、季节和视角参数继续带入统一页。两处跳转页不载入独立场景，关闭 JavaScript 时提供综合测试入口。

## 检查

相关 Node 检查包括 `rooftop-review.test.mjs`、`rooftop-background.test.mjs`、`rooftop-story-camera.test.mjs`、`rooftop-visible-air.test.mjs` 和 `rooftop-outdoor-raster.test.mjs`。实际浏览器检查南北切换、六种取景、环境选择及刷新、兼容跳转、窄屏控件和手帐，同时确认物品数为零、存档字节不变。
