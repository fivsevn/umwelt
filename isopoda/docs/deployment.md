# Static deployment and asset identity

Source HTML, CSS and module URLs are unversioned. Do not add manual `?v=` counters. The Pages workflow copies the existing public surface to `_site`, subsets the font, then runs `.github/scripts/stamp-assets.mjs _site "$GITHUB_SHA"` before uploading the artifact.

The transform adds the same full commit SHA to existing local assets in HTML, JS module imports/static filenames and CSS URLs. Relative paths, query parameters other than `v`, fragments, navigation routes and remote/data URLs are preserved. Every imported module in the artifact receives the same version so module identity is consistent. Credits' existing filename table is stamped, covering the dynamic fetch without changing its path or text. Missing explicit relative assets fail the build. Never run stamping over the checkout: `_site` is disposable output.

The stamp is deterministic/idempotent and uses no runtime bundler, redirects or public-path renames. It also versions fonts after subsetting. A rollback builds the earlier commit's artifact and thus uses that commit's query identity. Already open tabs retain their loaded module graph until navigation/reload, as before; no service worker or save migration is introduced.

Run the Node asset-stamping tests and build an artifact using the Pages exclusions. Serve both source and stamped output for browser checks. The main-game browser harness supports baseline comparison via `COMPARE_URL`, including home, game, morphology and habitat routes; morphology's existing ten-viewport suite remains independent. Main-game CSS files stay separate and unchanged.

The font subset explicitly retains `凝吃址铺`, the four characters unique to the retired MORNING pool, so literal historical save text retains the pre-cleanup glyph coverage. Removing runtime copy must not silently shrink historical-save font support.

## 文档整理的零前端变化验证

纯文档整理只修改开发 README 或 `isopoda/docs/`；不能把所有 Markdown 都当作开发文档：`credits*.md` 会由游戏加载，必须保留。字体许可和来源数据也不属于可随意清理的笔记。

1. 固定整理前的提交作为 baseline，检查 diff 中只有预期的开发文档路径；检查运行文件、素材、测试及工作流均未变动。
2. 用本仓库 `.github/workflows/pages.yml` 的同一组 rsync 排除项分别准备 baseline 与工作树的临时发布目录。逐个比较路径和文件字节（含隐藏文件），应完全一致；不要在源码目录执行资源盖章。
3. 运行 `node isopoda/tools/check-all.mjs`，检查文档的相对链接和命令入口。纯文档变更无需新增实现镜像式测试。
4. 若发布输入不一致，就不能宣称零前端变化；查清差异，涉及运行文件时补充浏览器基线比较。

比较发生在字体子集和 SHA 盖章前：发布输入完全相同，后续使用相同工具和相同版本标记才可比较最终字节。不同提交部署时资产 URL 的 SHA 会按既有机制变化，不应误认为它是界面或游戏行为变更。当前 Pages 只忽略 `README*.md` 推送，其他文档仍可能触发一次部署；本轮不为此更改工作流。
