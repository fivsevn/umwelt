# 东东房间建筑背景

这份原稿只包含房间固定结构：有真实厚度的地面与墙体、贯通窗洞与门洞、独立透明玻璃、窗框与窗台、收起的百叶窗与世界地图、固定壁灯、门框、门板及两面把手。家具、植物容器、东东和小猪由已有游戏系统管理，未加入背景。

房间继续采用原来的开放剖面：南侧敞开、东侧保留低墙、顶部不加遮挡观察的屋顶。地面仍为 10×14 游戏单位；存档中的房间多边形、人物水平位置和门中心不变。墙高为 2.7 米，门为 2.1×0.8 米，匹配当前物品比例。窗横向位置和宽度沿用旧开口，窗台为 0.85 米，窗高为 1.45 米。

## 原稿与运行资源

- `room-background/room-background-layout.blend`：冻结的完整建模及物理 UV 原稿。
- `room-background/room-background.blend`：原生 Pixelorama 贴图绑定、内嵌后的最终原稿。
- `room-background/room-background-atlas.pxo`：真实一像素 Pencil 绘制的可编辑 Pixelorama 原稿。
- `rooftop/assets/room/room-background.glb`、`room-background-atlas.png`：当前运行模型和纹理。
- `obstacle-boundaries.json`：固定结构的实际实体边界、地面和固定窗台承托记录。

每个面采用独立的正交 UV；源材料网格为 16 像素／米，每像素对应 6.25 厘米。游戏端继续使用共享最终低采样；纹理密度与屏幕颗粒分别检查。墙面统一采用天台现有灰绿色，木地板、窗台及门把手的旧化来自室内接触和使用，不套用室外雨痕。

## 坐标与动态门

统一比例为 `ITEM_METRES_TO_UNITS = 5.6 / 3`。原稿的 Blender 坐标为 `[runtimeX, -runtimeZ, runtimeY] / ITEM_METRES_TO_UNITS`；GLB 导出为 Y-up，接入时整体乘统一比例一次。不能将源文件再归零、放在地面上或按边界重新居中，否则会改变房间与人物的位置。

门框和门板采用独立 `part_role`：`room-door-frame` 有 4 个固定实体；`room-door-leaf` 有 14 个实体，包含内外面板、两面把手与门轴节。门的投影框中心为 `[-4.9, 0.02, 4]`，旋转为 `-π/2`；门轴在该框内 `[-0.7466666667, 0, 0]`，世界坐标为 `[-4.9, 0.02, 3.2533333333]`。完整数值见目录中的 `door` 记录。

游戏可由 `createRoomDoor` 创建原有互动框和轴，再由 `mountRoomDoorLeaves` 把载入的全部 `room-door-leaf` 实体以保持世界变换的方式挂到门轴。门的动画继续使用 `doors.room.hinge.rotation.y`，投影拾取继续使用 `doors.room.frame`。固定框留在背景内；玻璃允许透视，不应成为内容拾取障碍。

## 制作与检查

`build-room-background.py` 复用家具第二版的原生 Blender Builder，但输出限定于本目录。`paint-native.py room-background` 复用同一套 Pixelorama Pencil、保存和独立重开核对；`room-background/patterns.py` 提供纯 Python 的物理表面颜料记录，不生成位图。

当前背景在原布局边界内保留统一墙色、世界地图与收起的百叶窗；门窗位置和互动铰链保持原坐标。布局冻结后不修改模型或 UV。最终完成后运行原生 Blender `final` 导出和独立 `verify`；`room-background/inspect-source.py final` 另核对闭合实体、真实门窗洞、门板坐标、物理 UV 和透明材质。检查结果与源文件分开保存，未来手动修改原稿后须重新导出，不能仅重放脚本覆盖已有手改。

房间与车库共享当前初始陈列和个人存档，采用 2 CSS 像素目标采样；公开观察不写回陈列。修改后检查门动画、拾取、人物通行、三页面共享存档与最终发布包。
