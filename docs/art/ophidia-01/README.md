# THERMOREGULATION · 船舱与角色建模

作品名：THERMOREGULATION / 体温调节 / 体温調節。程序名：OPHIDIA.EXE。此目录保存当前可编辑模型、建模说明、预渲染素材和固定检查页面。后续修改直接从 `ophidia.blend` 继续；目录内只保留当前版本。

## 当前源文件

`ophidia.blend` 由 Blender 4.5 LTS 制作，纹理已内嵌。仓库以 `source/` 中的分卷保存这份当前工程；首次克隆后双击 `还原建模文件.command`，或运行 `python3 docs/art/ophidia-01/restore_source.py`，即可还原完全相同的 `.blend`。还原时逐卷和完整文件均作 SHA256 校验；重复运行会直接复用已存在且校验正确的工程。餐厅包含六组卡座、连续窗列、中央过道、供餐台、备餐区、入口、楼梯及两侧外部甲板。模型是可扩展的餐厅舱段；尺寸和隐藏空间按照片关系估算。主参照为 M/S Aino 公开照片，Norrskär 与 Rhône 补充卡座木工和软垫结构，Suomi 甲板图补充通行关系。公开图片来源见 [reference/sources.json](reference/sources.json)。

桌面小物包括厚陶杯、菜单、餐具、纸巾座、调味瓶、桌牌及纸片。服务区包含固定柜、抽屉、冰箱、水槽、出水阀、滴水盘、收银机、碟杯、瓶架、茶包格与托盘。窗扣、滚帘珠链、挂钩、暖气肋片及阀门、通风格栅、电管、检修盖、灭火器、急救箱、甲板栏杆和救生圈共同构成舱内设施。

角色的科学原型是 **Boaedon capensis（Brown House Snake；棕屋蛇为项目暂译）**。暖沙褐连续皮肤、浅腹、头纹、唇鳞、侧眼及细鳞构成当前外形。紧凑盘绕承接直立前身，橄榄针织帽与锈红羊毛围巾为文学道具。头部与身体来自连续网格、UV 色纹及微起伏；针织、织纹、短绒、布边和流苏均为可编辑结构。造型是照片引导的创作重建，尺寸不作标本测量值。[物种与叙事依据](reference/species.md)

## 相机与图层

- `Portrait game camera`：船舱主镜头，42 mm；景深对焦 2.12 m、f/2.0。
- `Foreground portrait camera`：独立角色镜头，同方向与焦距，沿轴前移 0.10 m；每个姿态对焦头部，f/2.8。
- `Snake · normal / curious / away / tongue`：四个可编辑姿态集合。编辑时只显示其中一个。
- `Review · …` 与两台 `Character … detail camera`：整体舱段、平面、甲板、设施、卡座、桌面与角色细节镜头。

背景保留 180×320 网格、2 px 像素块和 96 色；角色以 720×1280 渲染，缩为 360×640、四姿态共享 256 色，不添加抖点或网页模糊。头部、帽沿和近围巾清晰，后侧盘绕略微柔化。浏览器只叠加五张无损 WebP，保留轻微场景晃动。

角色接触阴影来自原卡座座垫与软靠背的 Cycles 阴影承接面。孤立角色与承接面分别出图，合成时保留清晰透明边缘。桌沿遮挡来自真实桌面几何，并沿背景的 2 px 像素边界处理。

## 持续复用的检查页

从仓库根目录运行 `python3 -m http.server 8788 --bind 127.0.0.1`，或双击本目录的 `启动本地预览.command`。

- 游戏：`http://127.0.0.1:8788/ophidia/`
- 完整模型：`http://127.0.0.1:8788/docs/art/ophidia-01/preview/model-review.html`
- 原生合成、像素图与模型近景：`http://127.0.0.1:8788/docs/art/ophidia-01/preview/pixel-style/index.html`

模型页持续使用同一路径，包含 16 个当前视角。剖视出图临时隐藏遮挡墙顶，工程保留完整结构。此目录随仓库保存，现有 Pages 打包规则排除 `docs/`，建模文件和检查页不进入游戏站点。

## 修改与出图

1. 在 `ophidia.blend` 修改当前网格、材质、灯光或镜头并保存。`photo_body.py`、`photoreal_snake_anatomy.py`、`photoreal_snake_cloth.py` 保存身体、皮肤和衣物的构造方法；`snake_model.py` 提供当前使用的网格与材质辅助函数。
2. 运行 `blender -b --python docs/art/ophidia-01/render_character_layers.py` 输出四个角色姿态、接触阴影及模型检查图。只更新角色时，在命令末尾加 `-- --portrait-only`。脚本直接读取当前工程。
3. 运行 `python3 docs/art/ophidia-01/export_layers.py` 更新五张游戏图层、合成预览和四姿态图。需要 Pillow 与 NumPy。背景文件保持原样；修改船舱后使用 `render_background.py` 重新出图，并在导出命令后加 `--refresh-background` 更新背景。
4. 在固定游戏与模型页面检查。保存修改后的工程后，运行 `python3 docs/art/ophidia-01/archive_source.py` 更新分卷存档，让入库工程与当前画面保持一致。`check-local.cjs`、`check-model-review.cjs` 和 `check-pixel-comparison.cjs` 验证桌面、手机、窄屏与浏览器资源。`verify_body_crossings.py` 检查当前保存网格的非相邻身体表面相交。

检查输出写入临时目录；源文件、当前素材及页面持续覆盖更新，不在仓库累积历史副本。
