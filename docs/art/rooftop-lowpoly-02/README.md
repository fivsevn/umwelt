# 当前建筑原稿

花农时代当前建筑、地坪、墙面、屋顶及远景的可编辑原稿。后续从这里继续修改，规格见[美术管线](../../rooftop-pixel-style.md)，页面与运行契约见[维护入口](../../rooftop-README.md)。

| 文件 | 用途 |
| --- | --- |
| `game-environment.blend` | 完整建筑网格、UV、材质、相机和打包贴图 |
| `terrace-book.pxo` / `.png` | Pixelorama 主图，1024×1024，28 个材质区域 |
| `distance-facades.pxo` / `.png` | Pixelorama 远景颜色图，2048×2048 |

主图保留分层旧化、细裂缝、修补、水渍和材质色阶，整屋顶为砖红瓦面。原稿由真实 Blender 和 Pixelorama 保存，暖窗 mask 使用运行目录 `distance-lights.png`。

近景材料为 16 像素／米，最小格 0.0625 米；远景沿用同一物理格。游戏最终画面采用约 2.5 CSS 像素的完整设备方格，车库与房间为 2 CSS 像素。源纹理密度和最终画面分别检查，保持完整几何、UV 与材质绑定。

## 导出与核验

- `export-game.py`：从已保存的 Blend 导出清单、网格和打包贴图到指定目录。
- `compress-runtime.mjs`：导出后生成无损 gzip 副本及清单，解码后的模型字节保持一致。
- `check-native.py`：真实 Blender 独立重开、临时重导出，对照当前运行资源，不修改原稿。
- `check-pixelorama.py`：真实 Pixelorama 独立重开，核对 PXO cel、原生 PNG 和运行 PNG。
- `check-screen-grain.py`：读取无损网页截图，核对完整设备像素格。

从仓库根目录运行：

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python docs/art/rooftop-lowpoly-02/check-native.py
python3 docs/art/rooftop-lowpoly-02/check-pixelorama.py
node docs/art/rooftop-lowpoly-02/compress-runtime.mjs
```

Pixelorama 检查短暂使用原生扩展，结束后恢复应用配置；与其他 Pixelorama 制作串行执行。已有手改不能通过回放旧制作过程覆盖。修改后核对原稿、导出、实际游戏与最终发布包。
