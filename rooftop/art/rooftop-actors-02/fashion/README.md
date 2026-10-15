# 衣服的旅行

现行 60 套服装，包括首批 10 套历史造型和新增 50 套现代时装研究。运行资料和几何保存在 `rooftop/fashion/`，正式房间、游戏手帐和[本地试衣页](../preview/index.html)使用同一份定义。

## 资料

`catalog.mjs` 与 `modern.mjs`（位于运行目录）记录稳定 ID、名称、原名、年代、地区、设计者或式样、版型、配色、结构要点、小猪配套、来源、改编说明和手帐随想。资料与显示几何分开；排序年份是参考时期，不能理解为某类衣服的首次发明年份。款式研究与特定藏品转译都在设计者、原名及说明中标明，颜色、搭配和比例不冒充历史原件。

来源包括中国国家博物馆、The Met、V&A、FIT 博物馆及其 Fashion History Timeline、Musée Yves Saint Laurent Paris、ISSEY MIYAKE、Schott 和 Levi’s。逐条可点击的原始链接保存在对应资料中。新增造型以工装、针织、运动装、现代套装、日系宽松剪裁与日常街头服装为主；每套有对应小猪局部饰物。

## 原稿

- `fashion-records.json`：60 对完整尺寸、封闭面、材质、骨架及原有手部道具记录。人物根节点包含游戏的 1.16 倍尺寸。
- `fashion-actors.blend`：60 个可编辑集合、全部原生网格与关节、16 纹理像素／米物理 UV，配对排列为 10 列。浇水壶通过原生物品引用标记保留。
- 共用 `rooftop/art/rooftop-game/material-book.pxo` 和其 PNG，贴图打包在 Blend 中；本次未改动已批准的 Pixelorama 画面。
- `stage.mjs`：本地试衣台与缩略图使用运行几何和共用的多边形三角化、Pixelorama 材质与整帧采样。
- `rooftop/assets/fashion/`：人物、小猪各 60 张实际模型缩略图，供衣柜与手帐使用。

从仓库根目录执行：

```sh
node rooftop/art/rooftop-actors-02/fashion/capture-source.mjs
blender -b --python rooftop/art/rooftop-actors-02/fashion/build-source.py
blender -b --python rooftop/art/rooftop-actors-02/fashion/build-source.py -- --verify
```

验证独立重新打开 Blend，检查 60 套、封闭网格、朝外法线、物理 UV 和打包贴图。`rooftop-fashion.test.mjs` 另检查运行三角化的实体体积、资料与原稿覆盖、道具和缩略图。直接在 Blender 修改后先合回尺寸与构建逻辑，再重建，避免覆盖未回填修改。

缩略图由本地试衣页的 `window.fashionReview.thumbnail(id, 'person' | 'pig')` 导出；先等待 `document.body.dataset.ready === 'true'`。该接口只绘制实际模型，不改玩家存档。导出后下一帧恢复当前试衣视角。修改几何后同步重建原稿及两类缩略图。

## 正式接入

房间仍使用原有布局、视角、文件与活动按钮。衣柜按年代分组，选择东东服装会带上同套小猪饰物，随后仍可单独换小猪。普通页面导航保留选择，刷新随机选另一套配对；旧纯配色存档迁入 Le Smoking 配对，旧房间 JSON 仍可导入。已有玩家布置保持原样，新玩家及“恢复初始”使用最新批准的陈列。

服装资料用 `fashion:<id>` 加入手帐，沿用 `fillNotebook` 的名称／原名、正文、随想和折叠来源格式。120 张缩略图是发布资源，Blender 原稿、记录和测试页留在仓库但排除于站点发布包。
