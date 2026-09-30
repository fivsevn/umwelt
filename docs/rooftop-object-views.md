# 天台物件四面绘制

2026-10-01。物件采用固定偏俯视像素视角。已认可的原绘制器是画风基准，四面沿用其色板、木纹、连接点、玻璃反光与层板厚度；实物资料只指导结构，不转换成正视立面图。顶面始终可见，支脚位于下方。黑色铁架使用深色铁件色板，名称与材质颜色对应。植物暂不重画。

## 实物与资料边界

作者提供的北天台照片 IMG_2205、2206、2207、2210、2212、2213、2214、2216、2217、2220、2221、2222 是主要外观参考。照片中的黑色网格花架、阶梯木架、遮雨罩、白篮架、蓝框保湿柜、蓝水池、泡沫箱与日常杂物保留其颜色和使用痕迹。以下厂商资料是同类结构参考，不能据此认定照片中的物件品牌。模型使用适合游戏像素尺度的比例，不是产品尺寸复刻。

| 物件组 | 检查四面时的依据 | 资料 |
| --- | --- | --- |
| 铁花架、格栅、网篮、晾衣架 | 独立深度、前后立柱、层板、背部斜撑；开放空间可看到植物 | [LÄCKÖ 装配图](https://www.ikea.com/es/en/assembly_instructions/lacko-shelving-unit-grey-outdoor-indoor__AA-2578356-1-100.pdf)、[JONAXEL 宽深高](https://www.ikea.com/ca/en/p/jonaxel-shelf-unit-white-70419971/) |
| 木架、木台、阶梯架 | 层板深度、台腿、台阶前低后高，不能画成侧面细线 | [IVAR 结构与尺寸](https://www.ikea.com/th/th/files/pdf/05/85/0585f5e5/th23-ivar_bg_a4.pdf) |
| 椅、长凳、圆桌 | 座面深度、椅背内外、侧面脚架；圆桌为旋转对称结构 | [ASKHOLMEN 多角度](https://www.ikea.com/us/en/p/askholmen-chair-outdoor-foldable-dark-brown-20557502/) |
| 水槽、水池 | 龙头锚点随台面转，立管竖直，池口保持上方；光滑台面无凭空出现的木纹 | [BLANCO 材质](https://www.blanco.com/int/sinks/materials/stainless-steel-sinks/) |
| 保湿柜、沃德箱 | 前门、侧框、背板、玻璃与斜顶分别绘制 | [ÅKERBÄR 装配图](https://www.ikea.com/ph/en/assembly_instructions/akerbaer-greenhouse-indoor-outdoor-white__AA-2331989-1-100.pdf)、原沃德箱 Kew 史料 |
| 箱、盘、鱼箱、土袋 | 箱体厚度、上口、前后把手、侧面深度；土袋背面接缝 | [KLÄMTARE 多角度与尺寸](https://www.ikea.com/gb/en/p/klaemtare-box-with-lid-in-outdoor-dark-grey-70292364/) |
| 浇水壶、桶、喷壶 | 壶嘴与把手在前后侧面的位置、竖直壶体 | [Haws 结构](https://haws.co.uk/pages/indoor-watering-cans)、[GARDENA 喷壶](https://www.gardena.com/au/products/tree-shrub-care/pump-pressure-sprayers/pressure-sprayer-1.25-l/970461301.html) |
| 工作灯、庭院灯、灯串 | 灯臂、灯罩、灯杆与悬挂灯泡重力固定，发光跟随灯头 | [TERTIAL 装配图](https://www.ikea.com/ie/en/assembly_instructions/tertial-work-lamp-dark-grey__AA-2550118-1-100.pdf)、原锡灯笼 Met 史料 |
| 表、工具、标签、手套、刷、毛巾、盖、盘管 | 仪表侧壳和背壳；地面物件沿地面转；参考实物保留正反材质 | [Exo Terra 表盘与背部安装](https://exo-terra.com/products/heating/thermo-hygrometers/analog-hygrometer/)、[GARDENA 手套](https://www.gardena.com/int/products/soil-ground/gloves)、北天台照片 |
| 圆盆、瓷墩、搪瓷盆、罩、滤盆、花盆 | 圆形结构保持旋转对称；椭圆盆侧面有真实短轴；釉色与连续纹样不随转向消失 | 原花盆资料和 Met 瓷墩记录，另见 `rooftop/botany.mjs` |

## 遮挡与兼容

先绘制架体，再绘制植物，最后在对应植物范围内绘制靠近观看者的结构。架子的立柱与斜撑只遮挡相交像素；柜子背板和侧遮雨布可以遮挡更大范围。放在架子前方的植物不被后方架子盖住。推断承托关系只作用于显示，不新增存档字段，原布局坐标、承重点及植物 seed 保持兼容。

绘制代码为 `rooftop/facing.mjs`；资料索引为 `rooftop/object-references.mjs`；场景遮挡入口为 `paintPlantOccluders`。所有物件使用代码生成像素，无新增图片资源。方向按钮统一为“旋转”。
