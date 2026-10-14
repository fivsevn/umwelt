# THERMOREGULATION / 体温调节 / 体温調節

UMWELT 的竖屏对话游戏。桌面程序名为 **OPHIDIA.EXE**。

从仓库根目录运行：

```sh
python3 -m http.server 8788 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8788/ophidia/`。点击「坐下」开始，点击画面或右下角 ▾ 继续，也支持 Enter、Space、→。三次分支影响后续对白及结尾，选项支持数字 1 / 2。对白右上角「⋯」收纳三语言、重来和返回主页。

全部内容容纳在一页，维持 9:16 画面。无外框、对白边框或署名覆盖；底部阴影衬托对白。文字不能拖选，开启减少动态效果时仍保留缓慢船舱晃动。

`assets/` 保存 360×640 的船舱背景及 normal、curious、away、tongue 四张透明角色 WebP。模型预渲染后作像素处理；网页使用静态 HTML、CSS、JavaScript，不加载三维引擎。字体复用 `../assets/fonts/`，许可证沿用已有文件。

[当前建模源文件与出图说明](../docs/art/ophidia-01/README.md)。源码与固定检查页随仓库保存；Pages 打包只包含运行文件。
