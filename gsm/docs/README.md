# Gstream 维护

[游戏维护入口](../README.md)

虚构动物社区的信息流，采用 trigger 与独立帖子包维护；发布状态以 Pages 工作流和线上页面为准。

## 页面与排版

- `/gsm/` 显示全部公开的守宫动态；`/gsm/settings/` 为独立语言设置页。两页共用 `app.mjs`、`style.css` 与固定的顶部、底栏。底栏从左到右为返回 Umwelt、stream、设置。
- 以用户导出的 390 px 手机稿为排版基准。所有尺寸保持同一列、头像列与帖子列的比例，宽屏居中且最多等比放大到 1.5 倍；高度随视口，中间的 `main` 独立滚动，滚动条隐藏，键盘与触屏仍可滚动。安全区域保留在上下固定栏内。
- 卡片宽 321 个设计像素，头像宽 42，间距 8，卡片之间间距 23；头像和卡片同顶边。标题加粗、轻微像素阴影；图在正文之前，时间与点赞位于卡片内部。点赞只显示心形与数量，两者垂直居中，点击区大于图案本身。
- 鼠尾草绿铺底，珊瑚粉标题与奶油、灰粉、淡紫卡片搭配，边缘用整数阶梯阴影和 Bayer 抖动体现厚度。全部以 HTML、CSS、文本和 SVG 绘制，原始 logo 使用 PNG，上传照片和头像使用 WebP，没有整页贴图。

## 内容与存储

发帖、注册角色、自动图片转换及单帖修改见[内容发布说明](publishing.md)。`trigger.md` 可填写每次发布的用户名和正文，`uploads/` 也支持单独上传图片发帖；`posts/` 保存每条内容；`users/README.md` 是可编辑的 Markdown 用户管理表，Actions 据此同步 `users/` 中的档案；表格控制启用和是否参加随机分配；`data/feed.mjs` 是构建结果。保留帖子 ID，避免点赞记录失去对应关系。此前本地预览的草稿、回复、关注等记录仍留在 `umwelt-gsm-preview-v1`，页面只修改点赞。

界面名称来自 `shared/games.mjs`，语言继承 `umwelt-desktop-language`。中英日切换在独立设置页生效并保存；没有译文的帖子显示原文。页面无账号登录或远端点赞接口。

## 素材

- 图标原稿与导出：[Pixelorama 说明](../art/icon/README.md)，运行图标 `assets/icon.png`。
- 头像、导航按钮与心形：`icons.mjs`；底栏为代码绘制的像素小屋、微侧面守宫头和齿轮，统一 24 × 24 网格；以选定的守宫头为细节与明暗基准，共享细深绿轮廓、奶油色亮面和向右下的轻阴影；小屋有珊瑚粉屋顶、奶油墙面与灰绿侧面，齿轮使用八枚平齿、分明的齿槽与居中的镂空轴孔，保留奶油亮面和粉色侧缘，呼应顶部的粉色与奶油色。守宫保留原有的侧脸、竖瞳、斑点和浅色下颌。底栏只显示图标。
- 守宫头构图检索参考：[Gecko Emojis / SayYesToGiygas](https://www.newgrounds.com/art/view/sayyestogiygas/gecko-emojis) 与 [San Diego Zoo 的豹纹守宫照片](https://animals.sandiegozoo.org/animals/leopard-gecko)（2026-10-19）。图案为本页独立绘制的 SVG，取长吻部、竖瞳与嘴线作为辨认特征，没有引入外部图片。
- 小屋与齿轮绘制参考：[Kenney Tiny Town](https://kenney.nl/assets/tiny-town) 的小尺寸建筑分色、[Pixelarticons Gear](https://pixelarticons.com/icon/gear/) 的像素齿口与轴孔结构，以及 [Saint11 Basic Shading](https://saint11.art/pixel_art_articles/article4/) 的定向光与色块明暗（2026-10-19）。本页重新绘制轮廓与着色，没有直接使用外部素材。
- 旧示例配图保留在 `assets/under-leaves.svg`，当前帖子不引用；上传图片在各帖的 `assets/` 中，全部转换为 WebP。用户头像原稿与档案集中在[用户目录](../users/README.md)，未设置头像的文件夹不放头像文件；运行 WebP 统一生成到 `assets/avatars/`。
- 标题装饰：`decorations.mjs`。沿用用户摆好的星光、爱心、星群与无线电位置。星群与无线电取自此前编辑器已保存的 Pixelarticons；保留 [MIT 许可](../assets/pixelarticons-LICENSE.txt)。其余装饰为本项目代码。
- 抖动算法：`dither.mjs`，不使用参考图作为运行素材。

临时编辑器仍在 `dev/visual-editor/`，保留用户草稿供回看；正式页面不依赖该目录，发布成品不包含编辑器。原始用户导出文件没有改动。其他游戏与另一个媒体项目保持独立。

[专项检查](../tests/README.md)
