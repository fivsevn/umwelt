# Pixelorama 原生铅笔笔触记录

本轮由实际 Pixelorama 1.2.3 的 `Pencil.draw_start / draw_move / draw_end` 完成绘制，软件自身把原 256px 工程最近邻缩成 128px，并保存原 PXO。`strokes.json` 的 738 条笔触全部使用整数坐标及一像素画笔。

此扩展只在明确带有 `--umwelt-grid` 参数、且打开旧 256px garden-atlas 工程时执行。当前 128px 成品不会重复覆盖。回放采用 Pixelorama 官方扩展接口，其绘图工具由软件提供；没有外部栅格生成。

当前 `.pxo` 可继续在 Pixelorama 正常编辑。本轮临时扩展已从应用移除，原应用配置已恢复。此目录保留在 GitHub，作为可编辑笔触及实际作者流程记录。
