# 新语言接入指南

[返回文档导航](README.md) · [现有本地化模块](../locales/README.md)

当前自然语言是 `zh`、`en`、`ja`；`isopod` 是从中文生成的虚构语言。现有三语数组和一些分支显式限定语言，向 `SUPPORTED_LANGUAGES` 添加代码并不能完成接入。本轮只记录这些边界。

## 逐域核对

| 文字域 | 接入位置（相对 `isopoda/`） | 下一轮需要处理 |
| --- | --- | --- |
| UI 与无障碍文案 | `locales/ui.mjs`、`i18n.mjs`、`index.html` | 完整键集、语言菜单、语言名、文档语言、日期及回退 |
| 陆生正文与动态句子 | `locales/game.mjs`、`runtime-locales.mjs` | 现有中文查表、动态拼句、显示刷新与保存后再显示 |
| 品种名称和注释 | `i18n.mjs`、`locales/annotations.mjs`、物种数据 | 显式语言分支与回退；不虚构常用名 |
| 水生与深海正文/结局 | `aquatic-story.mjs`、`data/habitats/` | `langIndex`、既有三元数组、碎片与反馈键解析 |
| 环境名称 | `habitats.mjs` 及其显示消费者 | 配置中的名称与界面实际解析路径 |
| Credits | `credits*.md` 及 `credits.mjs` 中的文件选择 | 新文件、加载表、段落/链接一致性 |
| 新文字池 | `data/narrative/` 及未来运行适配器 | 已有契约要求 zh/en/ja；新增语言须同时扩展契约和读取端 |
| 主页与公开实验室 | 根目录页面、`morphology/`、`habitat-lab.mjs` | 分别审计语言覆盖范围，不假定会自动继承游戏语言 |

保留原来的 zh/en/ja 索引和存档文字键。若要把数组改成语言映射，应另行设计兼容适配及测试，不把该迁移混在翻译文本中。生成的鼠妇语保持自己的编码规则。

## 检查与验收

- 更新 `tools/check-i18n.mjs` 的文字域要求，检查 `tools/validate-narrative.mjs` 中的显式语言列表/三元数组假设，以及 `tools/validate-habitats.mjs` 的名称要求。验证器放行不代表实际消费者已支持新语言。
- 检查 `i18n.mjs` 的日期及名称回退、注释和动态句子的分支，以及 `credits.mjs` 的 Credits 文件表。为新语言缺项添加能失败的测试。
- 检查字体覆盖、字体子集扫描及历史存档文字；仅在确有需要时调整字体规则。发布机制见 [发布说明](deployment.md)。
- 浏览器逐项验收到达、选择、动态反馈、日记、结局、资料库、Credits 和菜单无障碍标签；在窄屏上检查长文本、截断和溢出。切换语言后重载，确认语言保留且没有隐式回退成中文。

完整验证入口见 [测试说明](../../tests/README.md)，稳定内容身份见 [存档兼容](save-compat.md)。
