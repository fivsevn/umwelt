# 体温调节测试

[游戏文档](../README.md) · [全项目测试](../../tests/README.md)

本地服务启动后，从仓库根目录运行。需要 Playwright、Chrome 和 WebKit，`QA_OUTPUT` 指向仓库外截图目录。

```sh
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-local.cjs
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-model-review.cjs
BASE_URL=http://127.0.0.1:8788 node ophidia/tests/browser/check-pixel-comparison.cjs
```

| 脚本 | 覆盖范围 |
| --- | --- |
| `check-local.cjs` | 两种浏览器、四种宽高、三语切换、一次完整航程的三次选择、角色姿态、设置、返回与减少动态效果的实时切换 |
| `check-model-review.cjs` | [模型预览](../art/ophidia-01/preview/model-review.html)的视图、模型图片和来源入口 |
| `check-pixel-comparison.cjs` | [像素对照](../art/ophidia-01/preview/pixel-style/index.html)的图层、尺寸与显示 |

完整试玩检查没有遍历所有分支组合；修改分支时还需逐条核对受影响路线。网页预览不能替代 Blender 原稿检查。

原稿分卷工具的 11 项检查使用 Python 标准库，不需要浏览器：

```sh
python3 -m unittest discover -s ophidia/tests -p 'test_*.py' -v
```

检查覆盖单独还原、逐卷与完整文件校验、本地编辑保护及失败回滚。身体网格检查位于 `art/snakes/boaedon-capensis/verify_body_crossings.py`，命令见[蛇原稿](../art/snakes/boaedon-capensis/README.md)。

本游戏目前没有独立的 Node 测试文件；三个浏览器专项脚本尚未接入 CI。运行 `node tools/check-all.mjs` 检查共享结构，Pages 成品检查另行覆盖游戏入口。
