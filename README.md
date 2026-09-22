# UMWELT

**UMWELT** 是一个个人实验项目。

项目名称借用了德国生物学家 **Jakob von Uexküll（雅各布·冯·于克斯屈尔）** 在动物知觉与行为研究中发展的 **Umwelt** 概念：不同生物并不只是处在同一个抽象“环境”里，而是通过自身的感知与行动，生活在各自具有意义的周遭世界中。

本项目借用这一概念作为名称与出发点；具体内容、游戏设计与实现均属于本项目自身。

项目主页：  
https://umwelt.fivsevn.com

当前公开项目：

**Isopoda Fugue / 等足目赋格**  
https://umwelt.fivsevn.com/isopoda/

**阿西莫夫形态实验室 / Asimov Morphology Lab**  
https://umwelt.fivsevn.com/isopoda/morphology/

**阿西莫夫环境实验室 / Asimov Habitat Lab**  
https://umwelt.fivsevn.com/isopoda/habitat.html

---

## Isopoda Fugue / 等足目赋格

一个以等足类观察、环境与记录为主题的浏览器游戏。

---

## Project

UMWELT 当前主要由静态 Web 技术构成：

- HTML
- CSS
- JavaScript
- Canvas

游戏中的等足类标本使用数据驱动的 morphology / phenotype system 描述不同品种与个体的形态差异，再由统一的整数像素 renderer 绘制到 Canvas。

当前形态系统包含：

- Cephalon
- P1–P7
- Epimera
- Pleon
- Pleotelson
- Uropods
- Antennae
- Legs
- Surface
- Pattern
- Conglobation

饲养环境同样采用程序化像素 Canvas 渲染，并将基质、枯叶、水苔、树皮、石块及其他场景元素拆分为可维护的 scenery renderer。场景系统的维护边界记录在 `isopoda/docs/reference/isopoda-scenery-system.md`。

游戏进度主要保存在浏览器本地。

开发测试：

```bash
node --test tests/*.test.mjs
```

测试目录的自动化 / 浏览器回归边界见 `tests/README.md`。

开发用视觉 / 诊断工具保留在仓库中，用于 morphology、行为、场景素材和浏览器回归检查。公开与开发页面的发布边界由 GitHub Pages workflow 明确控制。

ISOPODA 的开发入口集中在 `isopoda/README.md`，文档统一放在 `isopoda/docs/`。公开展示页与开发工具保持分离；阿西莫夫形态实验室与环境实验室虽然以“实验室”命名，但都属于正式公开页面。

---

## Data and Scientific Notes

项目中涉及真实鼠妇、分类、形态、贸易名称及自然史资料的内容，会尽可能区分资料事实、工作性判断、视觉参数和游戏模拟。

内部主要使用：

- `FACT` — 有资料支持的事实
- `REFERENCE` — 研究或视觉参考
- `TRADE` — 贸易名称、培养线或工作性身份
- `RENDER` — 视觉表现参数
- `GAME` — 游戏模拟参数
- `UNKNOWN` — 当前无法确认
- `FICTION` — 创作内容

游戏中的温度、湿度、移动速度、成长比例、行为状态以及其他模拟数值，不应被理解为真实饲养建议、生物学测量值或自然史结论。

论文、数据库及外部资料仅用于研究和事实参考，其版权与使用权仍属于各自的作者、机构或权利人。

---

## AI-Assisted Development / AI 辅助开发说明

本项目的制作过程中使用了生成式 AI 作为辅助工具。

AI 可能参与：

- 部分程序实现与代码迭代
- 技术问题分析
- 开发文档整理
- 资料检索与结构化辅助
- 测试、重构与实现建议

项目的具体主题、内容取舍、游戏结构、视觉方向以及最终版本均由 **fivsevn** 决定和维护。

AI 输出本身不被视为科学资料来源。涉及分类学、动物形态、自然史及其他事实性内容时，应尽可能回溯至论文、数据库或其他可识别的实际来源。

---

## Repository / 源码

项目代码、设计规范及部分开发记录：

https://github.com/fivsevn/umwelt

在许可证允许的范围内，可以：

- 查看源码
- 学习与研究
- 复制与分享
- 修改
- 进行非商业二次创作

本项目采用包含 `NonCommercial` 条款的许可证，属于**Source Available / 源码公开**。

---

## License / 许可协议

除非文件或内容另有明确说明，本仓库中由 **fivsevn 创作并有权授权的内容**采用：

**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**  
**CC BY-NC-SA 4.0**

完整法律文本见：

```text
LICENSE
```

官方页面：  
https://creativecommons.org/licenses/by-nc-sa/4.0/

### Attribution / 署名

分享或改编相关内容时，应提供合理署名，包括：

- 原作者：`fivsevn`
- 项目：`UMWELT`
- 原始来源
- `CC BY-NC-SA 4.0`

如果修改了原内容，也应注明已作修改。

### NonCommercial / 非商业性使用

许可内容不得主要用于商业利益或金钱报酬目的。

如需进行超出该许可证范围的商业使用，需要另行取得授权。

### ShareAlike / 相同方式共享

如果公开传播基于本项目许可内容制作的改编或衍生作品，应继续采用：

**CC BY-NC-SA 4.0**

或该许可证允许的兼容许可证。

### Scope / 许可范围

该许可证只适用于：

> 由 fivsevn 创作，并且 fivsevn 有权授权的内容。

第三方材料不会因为被包含在本仓库中而改变其原始许可证或权利状态。

---

## Third-Party Materials / 第三方内容

第三方内容继续遵循各自的许可证与权利声明。

### Fusion Pixel Font

本项目使用：

**Fusion Pixel Font / 缝合像素字体**

字体文件位于：

```text
assets/fonts/
```

相关字体及其组件按照各自原许可证发布，主要包括：

**SIL Open Font License 1.1（OFL-1.1）**

许可证文件位于：

```text
assets/fonts/OFL.txt
assets/fonts/LICENSES/
```

这些字体文件及其上游字体组件不属于本项目的 CC BY-NC-SA 4.0 授权范围。

### Scientific Sources and External References

项目中引用或链接的：

- 学术论文
- 分类数据库
- 自然史资料
- 外部网站
- 贸易名称资料
- 其他参考文献

均保留其原始版权、许可证及其他适用权利。

---

## fivsevn.com

除另有明确说明外，https://fivsevn.com 上由 **fivsevn 创作并有权授权的内容**同样采用：

**CC BY-NC-SA 4.0**

第三方引用、字体、图片、资料及其他外部内容继续遵循其各自的许可证和权利声明。

---

## Author

**fivsevn**
