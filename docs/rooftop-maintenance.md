# Rooftop 维护与扩容入口

`rooftop/arrange/` 与公开天台共用渲染器。维护时保留页面结构、样式、文案、现有物件 ID 与存档版本；新增目录项不能依赖修改旧布局。

## 文件职责

- `app.mjs`：页面初始化、编辑历史、拖动、导入导出与持久化。
- `scene.mjs`：目录汇合、布局版本验证与迁移、边界、场景和物件绘制分发。
- `botany.mjs` / `plant-art.mjs` / `plant-seed.mjs`：植物与容器数据、绘制、稳定株形。
- `furniture.mjs`：家具定义与绘制。
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
