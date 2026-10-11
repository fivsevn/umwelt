# 花农时代空场景与发布记录

2026-10-11 当前建筑材料、天气氛围和综合测试入口的交付记录。家具重制留待下一轮，本轮保留现有物品模型、ID、承放规则和存档兼容。

## 当前入口

[游戏](https://umwelt.fivsevn.com/rooftop/)、[永久空场景综合测试](https://umwelt.fivsevn.com/rooftop/?stage=background)、[独立车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/)。测试页集合南北、六个视角、天气、时段与四季，固定不读取物品布局。旧 3D、像素样板和 game-model 测试入口统一跳转。

[文档总入口](../../rooftop-README.md)整理当前维护规则、建筑与物品原稿、资料和历史记录。[第 07 轮原稿](../rooftop-weathering-07/README.md)是当前背景材质基准；像素与 Blender 模型的输入核对见 [未改动原稿检查](unchanged-art-check.json)。

## 发布前核验

- 完整结构、语言、资料和公开入口检查通过；389 项 Node 测试全部通过，见 [完整检查日志](release-structure-check.txt)。
- 原测试页的南北、六种取景、环境刷新恢复、旧入口与存档隔离见 [浏览器记录](browser-visual-checks.json)。
- 发布分支合入已上线相机位置、窄屏圆镜修正和空阳台保护后，重新检查公开与综合测试，见 [整合后记录](integrated-browser-checks.json)。
- 发布分支保留已确认的 story-camera、optic-overlay 代码和镜头回归。背景近景材质、软阴影和季节可见度采用当前审核结果。家具模型与承放机制未修改。

Pages 最终发布状态、提交身份和线上核验将在部署完成后补录；本地检查不替代最终成品浏览器与部署结果。
