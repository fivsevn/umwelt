# 船舱

[原稿目录](../../README.md) · [组合与出图](../../ophidia-01/README.md)

`ferry-cabin.blend` 保存完整餐厅舱段、窗外环境、舱内灯光、世界设置、主镜头与船舱检查镜头；窗景的预渲染场景也保留在文件中。纹理已内嵌。

首次使用从仓库根目录运行：

```sh
python3 ophidia/art/ophidia-01/restore_source.py --asset ferry-cabin
```

餐厅包含六组卡座、连续窗列、中央过道、供餐台、备餐区、入口、楼梯及两侧外部甲板。桌面小物、服务区设备和舱内设施均保留现有结构。尺寸和隐藏空间按照片关系作创作估算。主参照为 M/S Aino 公开照片，Norrskär 与 Rhône 补充卡座木工和软垫结构，Suomi 甲板图补充通行关系；资料见 [reference/sources.json](reference/sources.json)。

`Portrait game camera` 保留当前船舱构图：42 mm，景深对焦 2.12 m、f/2.0。船舱检查镜头位于 `Review · new saloon complementary cameras`，检查用补光默认关闭。

在本文件修改并保存后，运行：

```sh
python3 ophidia/art/ophidia-01/archive_source.py --asset ferry-cabin
```

也可直接使用 `ophidia/art/source_archive.py` 对本目录的 `source/` 还原或归档。只取用船舱时，带走此目录和这份通用工具即可。
