# 当前建筑原稿

花农时代当前建筑、地坪、墙面、屋顶及远景的可编辑原稿。后续从这里继续修改，规格见[美术管线](../../docs/pixel-style.md)，页面与运行契约见[维护入口](../../README.md)。

`game-environment.blend` 是后续游戏场景的持续建筑依据，必须随仓库保留，并与运行资源同步更新。它是独立的游戏化模型；继续制作不需要打开仓库外的现实地点沙盘，也不要用旧制作脚本回放覆盖已保存的手改。

| 文件 | 用途 |
| --- | --- |
| `game-environment.blend` | 完整建筑网格、UV、材质、相机和打包贴图 |
| `terrace-book.pxo` / `.png` | Pixelorama 主图，1024×1024，保留现有命名材质分区 |
| `distance-facades.pxo` / `.png` | Pixelorama 远景颜色图，2048×2048 |

主图保留分层旧化、细裂缝、修补、水渍和材质色阶，整屋顶为砖红瓦面。原稿由真实 Blender 和 Pixelorama 保存，暖窗 mask 使用运行目录 `distance-lights.png`。

2026-10-14 主体表面细化：继续编辑已保存的游戏化模型和 Pixelorama 主图，重画 `north-floor`、`south-floor`、`plaster`、`stained-plaster`、`cap`、`cement`、`home-roof-north`、`home-roof-south` 八个区域。保留 1024×1024、16 纹理像素／米、原透明度和其余区域的全部像素。旧化按施工和受水位置组织：地坪为有浅接缝的水泥面，修补覆盖局部旧缝，细裂缝从真实凹角分支，两处落水口的干燥残迹按已保存模型的 UV 位置绘制；墙面区分旧灰浆、脱落涂层、补灰及局部水路，剥落边缘有缺口、余留涂层和少量连片的露砂。完整表面保留大面积安静底色，细颗粒集中在材料破损范围内。

红瓦按整片瓦的烧制色差、搭接唇、弧面色阶和少量替换瓦组织图案；檐口的苔藓仅保留局部连片痕迹。Blender 为南北两条檐口各补 109 片有完整内外表面的低模瓦，名义宽 0.375 米、进深 0.5 米，最高起伏 0.04 米。原有坡屋顶、楼体、阳台、地坪及所有旧构件的网格、法线、UV、绑定和对象变换保留；没有改变建筑比例和原有位置。新瓦的 1,526 个面另核对正交材料格。远景烘焙颜色图、窗灯图、光影代码和镜头未调整。真实 Pixelorama 独立重开后与 PNG、Blend 打包图片、游戏运行图片逐字节核对；真实 Blender 重开并重新导出，结果与运行资源一致。新增 3,488 个三角面，背景资源传输量增加约 15 KB（约 0.75%），绘制分组数保持 408。当前原稿与运行资源一起随仓库保存。当前证据见 `main-surface-validation.json`。

实际材料参考采用 NPS 的[混凝土保护资料](https://www.nps.gov/orgs/1739/upload/preservation-brief-15-concrete.pdf)第 7 页实拍与第 7—8 页的裂缝、剥落和染色说明，[灰泥保护资料](https://www.nps.gov/orgs/1739/upload/preservation-brief-22-stucco.pdf)第 8 页实拍及第 7 页的受水位置说明，以及[粘土瓦保护资料](https://www.nps.gov/orgs/1739/upload/preservation-brief-30-clay-tile-roofs.pdf)第 8—9 页的搭接、檐口和瓦片色差细节。灰泥资料第 6 页檐下的深色在原文中是复原涂色，不能作为漏水染色证据；本轮没有这样误用。低模插画用于材料分区、瓦片层次和细节密度参考，未作为现实建筑的形制依据。参考图及资料未嵌入游戏原稿。

六栋近邻楼的楼宽、层高和坡屋顶已修正，解决西侧重复缩放造成的变形。结构修复时逐一核验 942 栋建筑，最大参考至运行顶点换算误差小于 0.4 毫米。后续制作保留已有楼体与相对位置，周围六栋增补 399 个檐沟、落水管和屋脊收边构件。935 栋远景楼体和屋顶共 15,723 个三角面，保留全部轮廓，以轻量楼体、烘焙立面及较弱的颜料对比呈现背景。

源文件共享完整构件网格并清理未使用副本；窗灯图使用无损灰度与透明度编码，盒体完整变换通过调整排列改善压缩。当前源模型约 6.76 MB，压缩网格与贴图合计传输约 2.06 MB。只保留当前正确的原稿与核验摘要 `main-surface-validation.json`。

`export-game.py` 仅对经过实际顶点及拓扑验证的六面盒体使用立方体实例化，固定单位盒体基底保留旋转与剪切。坡屋顶和复杂外形走原生网格导出；不能仅凭对象标记或八个顶点判定为立方体。近邻以独立位置变换定位，避免重复施加原始坐标转换。

2026-10-16 窗灯归属修复：2,388 个建筑窗面在 Blender 对象上保存 `window_light: true`，导出时按此标记分组为 `windowLight`。车辆玻璃、水面、晾晒衣物、实心门板和深色圆形构件保留原有颜料，不参与窗灯。未标记的新构件默认不发光；新增窗面时须明确设置对象标记。原稿独立重开后核对网格、法线、UV、材质绑定、对象变换及打包贴图；运行导出逐一对照全部几何与实例变换，均保持一致。三角面数仍为 435,019，绘制分组从 408 增至 410，网格二进制大小不变。远景窗灯遮罩未改。核验结果见 `window-emission-validation.json`。

近景材料为 16 像素／米，最小格 0.0625 米；远景沿用同一物理格。游戏最终画面采用约 2.2 CSS 像素的完整设备方格，车库与房间为 2 CSS 像素。源纹理密度和最终画面分别检查，保持完整几何、UV 与材质绑定。

## 导出与核验

- `export-game.py`：从已保存的 Blend 导出清单、网格和打包贴图到指定目录。
- `compress-runtime.mjs`：导出后生成无损 gzip 副本及清单，解码后的模型字节保持一致。
- `check-native.py`：真实 Blender 独立重开、临时重导出，对照当前运行资源，不修改原稿。
- `check-export-geometry.py`：检查盒体复用条件、带剪切的盒体、坡屋顶排除、面拓扑与法线朝向。
- `check-pixelorama.py`：真实 Pixelorama 独立重开，核对 PXO cel、原生 PNG 和运行 PNG。
- `check-screen-grain.py`：读取无损网页截图，核对完整设备像素格。

从仓库根目录运行：

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python rooftop/art/rooftop-lowpoly-02/check-native.py
python3 rooftop/art/rooftop-lowpoly-02/check-pixelorama.py
node rooftop/art/rooftop-lowpoly-02/compress-runtime.mjs
```

Pixelorama 检查短暂使用原生扩展，结束后恢复应用配置；与其他 Pixelorama 制作串行执行。已有手改不能通过回放旧制作过程覆盖。修改后核对原稿、导出、实际游戏与最终发布包。
