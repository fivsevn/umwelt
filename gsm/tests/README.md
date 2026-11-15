# GSM 检查

## 本地引擎与素材

在仓库根目录执行：

```sh
npm ci --prefix gsm/tools/engine
python3 -m pip install -r gsm/tools/requirements.txt
node --test gsm/tests/*.test.mjs tests/site-artifact.test.mjs
python3 -m unittest discover -s gsm/tests -p 'test_*.py'
node gsm/tools/publish.mjs validate
node gsm/tools/publish.mjs build
node tools/check-all.mjs
```

检查覆盖素材过滤、真实顺序与引用边界、匿名、去重、请求预算、失败保留、快照冻结、抽签、独立写作输入、审读、操作恢复、账号权限、原生存储及媒体归档。测试材料在隔离目录运行。

## 页面

安装 Playwright 与 Chromium、WebKit，启动仓库根目录的本地 HTTP 服务。以 `BASE_URL=http://127.0.0.1:8797 BROWSER=chromium node gsm/tests/browser/feed.cjs` 运行信息流检查，切换 `BROWSER=webkit` 检查另一种浏览器。同目录 `profile.cjs`、`comments.cjs`、`lcd.cjs` 分别检查个人页、讨论串和显示层。

覆盖三键导航、八套外壳、三语、点赞及持久化、作者入口、回复父关系、前进后退、窄屏和横屏、键盘与存储不可用回退。`QA_OUTPUT` 指定仓库外截图目录。

## 成品与上线

`tests/browser/published-artifact.cjs` 检查最终站点成品。成品排除工具、人物源配置、上传原图、草稿和操作资料，只发布页面运行文件与公开清单内媒体。实际线上内容由 `gsm/tools/verify-live.py` 和 `gsm/tools/engine/verify-live.js` 核对。内容发布与收尾见[执行与发布](../docs/publishing.md)。
