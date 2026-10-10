# 非植物贴面修订 2026-10-10

验收目标是正式游戏里的物件和背景，不是另做一个风格小样。每个平面的最小绘画单位是固定的 1/8 世界单位正方形；透视投影会变成平行四边形，展开后必须是正方形。几何是低面数的折面外壳，不把材质做成立方体堆叠，也不靠缩小整张游戏画面制造像素感。

## 实物照片

- [镀锌浇水壶及旧木板 / Burgon & Ball](https://www.burgonandball.com/products/sophie-conran-greenhouse-indoor-watering-can-galvanized)：已检查产品照片；长木纹、板端磨损、镀锌壶上成片的明暗，不转录照片纹理。
- [旧金属架 / 86 Vintage](https://www.86vintage.com/products/vintage-industrial-metal-shelves)：已检查架体与多层照片；背面交叉支撑、边缘掉漆、锈斑集中在连接和板边。
- [旧陶盆沉积 / Pravda](https://zahrada.pravda.sk/zahrada/clanok/670410-ocot-mydlo-citron-silna-trojka-co-porazi-spinu-aj-patogeny-ako-vycistit-hlinene-kvetinace-a-pritom-sa-nenadriet/)：已检查照片；白色沉积和湿痕是连贯区域，既有旧器物纹样保留。
- [阳台围墙转角 / OFFRoad Bulgaria](https://offroad-bulgaria.com/forum/основни-форуми/за-дома-и-семейството/ремонт-майстори-и-материали/202896-ремонт-на-балкон-и)：已检查原帖照片；墙角和压顶下面潮痕集中，墙面主体保持安静。
- [旧木门照片](https://www.freeimages.com/search/old-door)、[旧瓦屋顶照片](https://unsplash.com/photos/brown-roof-FEtIUv_x9r8)：搜索检索，辅助观察旧化位置，不作为已下载和检查的照片计数。

## 同类绘画与老游戏

回查用户给的石灯、门、文件柜、垃圾箱、空调、长椅、神社七组完整 GIF，观察纹样与平面展开图。作者页面补充检索以下九组：

- [石灯](https://www.artofsully.com/projects/rNW6E)
- [长椅](https://www.artofsully.com/projects/zeP3Z)
- [墙面](https://www.artofsully.com/projects/33eqB)
- [文件柜](https://www.artofsully.com/projects/KZV6o)
- [垃圾箱](https://www.artofsully.com/projects/8VmOG)
- [门与灯](https://www.artofsully.com/projects/eWQK3)
- [室外墙体](https://www.artofsully.com/projects/32PQB)
- [桌面](https://www.artofsully.com/projects/x0XqR)
- [空调](https://www.artofsully.com/projects/XWDP0)
- [洗衣篮](https://www.artofsully.com/projects/839Lm)

作者页面中列出文件柜 32×32、桌灯 16×32、桌面 64×64 的原生绘画尺寸。部分 CDN 图片拒绝下载，实际图像比较使用用户提供的完整 GIF，不能把这些失败下载写成已经看过的新增图像。另检索 PS1/PS2 与 Dark Cloud 场景；采用低面数外壳、低分辨率原画的制作原则，具体画风以用户确认的图 1 和 Sully 石灯为准。

## 落实到正式游戏

- Pixelorama 打开原有 material-book.pxo，只用原生 1px Pencil 改动非植物格子并导出游戏实际使用的 PNG。
- 木纹用连贯的一格宽纤维、方格木节及板端旧痕。铁架画局部露底色和成片锈痕。墙脚使用专门的矮围墙贴面，避免仅截取高墙贴图的空白区域。
- 地面在原生格子中画石板接缝、磨损角和局部干湿痕迹。屋顶保留简单斜面，瓦片接缝与旧痕在二维贴图内作画。
- 植物、土壤、花瓣及人物原有绘画格子逐字节保留；植物模型不改。容器与专项器物纹样保留。
- 木阶架的板面铺满既有承载面，不改变三个层级的 ID、顶面高度、有效尺寸或存档关系。
- 硬物贴面不再用平滑顶点法线在片元阶段推导绘画坐标：固定折面法线在顶点阶段展开，并去掉实例摆放平移。每个物件移动时，原画不滑动。
- 实际浏览器检查由仓库既有回归流程与 Pages 成品流程执行。正式游戏截图是视觉记录，软件资产截图仅是原稿检查。
