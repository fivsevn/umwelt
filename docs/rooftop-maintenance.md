# Rooftop 维护与扩容入口

`rooftop/arrange/` 与公开天台共用渲染器。维护时保留页面结构、样式、文案、现有物件 ID 与存档版本；新增目录项不能依赖修改旧布局。

## 页面与布局边界

- `rooftop/`：北天台与南阳台观察入口。
- `rooftop/room/`：东东的房间、衣柜与活动页面。
- `rooftop/arrange/`：车库布置页，编辑北天台、南阳台和房间。

布局继续使用 `umwelt-rooftop-layout-v1` 存储键。当前布局为 `version:2`，包含 `scenes.north`、`scenes.south`、`scenes.room`，房间迁移标记为 `roomVersion:2`。`validateLayout()` 接受历史版本 1 和当前版本；旧布局缺少房间时补入默认房间，版本 1 的南阳台坐标沿用现有迁移。不要重命名旧存储键或删除兼容分支。

默认陈列来自 `initial-layout.mjs`；车库和 `?layout=local` 读取本机布局。房间维护还需检查其自身入口的读写与共享布局同步，不能仅凭阳台测试推断房间兼容正常。

## 文件职责

- `app.mjs`：页面初始化、编辑历史、拖动、导入导出与持久化。
- `scene.mjs`：目录汇合、布局版本验证与迁移、边界、场景和物件绘制分发。
- `botany.mjs` / `plant-art.mjs` / `plant-seed.mjs`：植物与容器数据、绘制、稳定株形。
- `furniture.mjs`：家具定义与绘制。
- `initial-layout.mjs` / `room-scene.mjs`：默认陈列与房间布景。
- `room/room.mjs` / `wardrobe.mjs` / `card-feed.mjs`：房间活动、服装绘制与提示卡。
- `facing.mjs` / `styled-views.mjs` / `objects.mjs`：物件方向、材质绘制与小物目录。
- `object-references.mjs`：物件手帐的资料归属。
- `camera.mjs` / `city.mjs` / `weather.mjs` / `resident.mjs`：镜头、周边楼群、天气与人物。
- `arrange/index.html` / `rooftop.css`：布置页面结构与样式。

扩容植物从 `botany.mjs` 和 `plant-art.mjs` 入手，家具从 `furniture.mjs` 入手。保留旧 ID、植物容器限制、seed、旋转和缩放序列化约定；当前上限仍为每场景 400 件。`scene.mjs` 中的旧物件尺寸用于历史存档迁移，不能作为重复目录删除。

## 验证

运行 `node isopoda/tools/check-all.mjs` 验证完整结构与数据契约。

`tests/browser/rooftop-maintenance.cjs` 覆盖相同坐标提交保留重做、多指拖动隔离、撤销与存档。设置 `COMPARE_URL` 可逐像素对比维护前后，在 1600、1100、900、390 宽度、两个场景、初始与植物选中状态下验证画面一致。固定时间、随机值和动画帧只作用于测试浏览器。

```sh
BASE_URL=http://127.0.0.1:8773 COMPARE_URL=http://127.0.0.1:8774 node tests/browser/rooftop-maintenance.cjs
BROWSER=webkit BASE_URL=http://127.0.0.1:8773 COMPARE_URL=http://127.0.0.1:8774 node tests/browser/rooftop-maintenance.cjs
```

`rooftop-garage-layout.cjs` 检查实际响应式排布，`rooftop-plant-seed.cjs` 检查株形与复制后存档。部分早期浏览器脚本直接点击已隐藏的撤销按钮；这些检查应使用现有 Ctrl/Cmd+Z 与 Shift+Z 快捷键，无需改变前端来配合测试。

测试截图、临时对比站点和检查日志放在仓库之外；`docs/` 与 `tests/` 不进入发布产物。

结构与存档检查还可运行 `node --test tests/rooftop*.test.mjs`。浏览器脚本按任务选择：`rooftop-expansion.cjs` 检查目录、手帐、承托与导入导出，`rooftop-facing.cjs` 检查物件四面，`rooftop-garage-layout.cjs` 检查车库排布。脚本存在不表示已在当前提交运行；当前浏览器 CI 的触发路径和执行矩阵未覆盖天台专用回归。

仅整理文档时执行 [零前端变化验证](../isopoda/docs/deployment.md#文档整理的零前端变化验证)，不借整理修改运行代码或测试。

## 资料与阶段记录

[手帐资料](rooftop-notebook.md)、[绘制方向](rooftop-art-direction.md) 和 [四面结构参考](rooftop-object-views.md) 保留绘制与来源依据。早期双场景说明及目录扩容数量见 [历史索引](reference/README.md)；当前物件、场景及兼容行为以运行模块为准。
