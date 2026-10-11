# 花农时代空场景与发布记录

2026-10-11 当前建筑材料、天气氛围和综合测试入口的交付记录。家具重制留待下一轮，本轮保留现有物品模型、ID、承放规则和存档兼容。

## 当前入口

[游戏](https://umwelt.fivsevn.com/rooftop/)、[永久空场景综合测试](https://umwelt.fivsevn.com/rooftop/?stage=background)、[独立车库／物品页面](https://umwelt.fivsevn.com/rooftop/arrange/)。测试页集合南北、六个视角、天气、时段与四季，固定不读取物品布局。旧 3D、像素样板和 game-model 测试入口统一跳转。

[文档总入口](../../rooftop-README.md)整理当前维护规则、建筑与物品原稿、资料和历史记录。[第 07 轮原稿](../rooftop-weathering-07/README.md)是当前背景材质基准；像素与 Blender 模型的输入核对见 [未改动原稿检查](unchanged-art-check.json)。

## 发布前核验

- 完整结构、语言、资料和公开入口检查通过；392 项 Node 测试全部通过，见 [完整检查日志](release-structure-check.txt)。
- 原测试页的南北、六种取景、环境刷新恢复、旧入口与存档隔离见 [浏览器记录](browser-visual-checks.json)。
- 发布分支合入已上线相机位置、窄屏圆镜修正和空阳台保护后，重新检查公开与综合测试，见 [整合后记录](integrated-browser-checks.json)。
- 发布分支保留已确认的 story-camera、optic-overlay 代码和镜头回归。背景近景材质、软阴影和季节可见度采用当前审核结果。家具模型与承放机制未修改。
- 观察布局在验证前丢弃南北物品，仅保留已存房间与版本元数据，增加存档只读回归。浏览器资源预算与原稿检查统一为 12,000,000 字节，并核对实际加载总量等于原稿声明；当前背景为 8,717,903 字节。

## 上线结果

2026-10-12（北京时间）已上线。发布提交为 `9865cc443f739f6a876f60c1dfdf9868ba92f188`；[PR #64](https://github.com/fivsevn/umwelt/pull/64) 已合并，[Pages 发布](https://github.com/fivsevn/umwelt/actions/runs/38154604569) 成功。字体子集、完整资源 SHA 标记、最终产物的桌面／手机 Chromium 与 WebKit 检查、Pages 上传与部署均通过。

修复后的 [花农时代 16 项浏览器回归](https://github.com/fivsevn/umwelt/actions/runs/38154162434)、[完整结构检查](https://github.com/fivsevn/umwelt/actions/runs/38154162493)和[形态实验室 34 项回归](https://github.com/fivsevn/umwelt/actions/runs/38154162502)全部成功。

真实线上页面再次核验：脚本资源已标记上述发布 SHA；北台综合测试及南台雨天／黄昏／无人机切换正常，选择刷新后恢复；旧 3D 地址进入同一综合测试；物品链接进入独立车库并读取已有陈列。公开南北及旧 `layout=local` 链接保持 0 件物品、角色隐藏，车库存储原文不变，浏览器无错误。

线上 `terrace-book.png` 为 159,903 字节，SHA-256 `8fd4e9d509760c029c903debed2ce8720d32bac92ce4d5496793a3111f79fcc3`；`empty-rooftop.bin` 为 5,476,608 字节，SHA-256 `34b25d9ae868821494638a6b0f0519f95f5179ade24019cc46d52cf8dd410e92`，均与第 07 轮已核验的运行资源一致。文档总入口、综合测试与维护页的 46 个本地链接／锚点及 4 个直接验证报告已确认存在。

本条上线记录仅补充文档，不改变已部署的运行资源。家具重制继续留待下一轮。
