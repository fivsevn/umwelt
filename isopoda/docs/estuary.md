# 河口汽水带：移动的条件，保留下来的记录

[返回文档导航](README.md) · [环境指南](environments.md) · [实验室契约](laboratories.md)

## 运行边界

新局采用 `estuary-observation`：落点、来水改变、与原点分开、转流、条件回撤、重访，共六次三选一。没有晨午夜，没有倒计时。守住原点记录 P 水样；跟随轮廓记录可见路线；对照两处记录 P/Q 水样。选择不改变盐度、水流或动物运动。上一轮的选择改变下一轮的记录背景，未采集的证据保持缺失。

动作、采样值和间隔是预先编排的压缩观察，不是用户停留时长的实验测量。路线在遮挡处终止；中断跟随后再次开始使用新的轮廓标识。后台群体身份仍然稳定，但不得把显示轮廓自动等同于已经重新鉴定的个体。

新增结尾 `estuary-notebook` 从本局实际证据组成六条笔记。存档和结局档案保存结构化证据，不保存当前语言的拼接句子。所有新文本使用 `estuary:v1:*` 稳定键，中文、英文、日文共用 `data/narrative/estuary.mjs:TEXT_CATALOG`，鼠妇语由中文生成。

## 场景与阿西莫夫环境实验室

`scenery/estuary-stages.mjs` 提供六个正式游戏与实验室共用的布局。沿用河口已有像素材质，保留固定岸线、木边和藻根；只有松散漂积物作轻微位移。`scenery/estuary.mjs` 共用水流、观察标记与局部路线的坐标换算。没有新增图片或字体。

实验室选择 **ESTUARY → OBSERVATION** 后，可逐个调整六个时刻。**FLOW** 切换水流预览，不改变实验室外的游戏存档。减少动态效果模式不播放此预览。实验室的比例参考标本仍可独立开关，不代表群体配置。

编辑完成后，分别导出：

```text
habitat-layout-brackish-estuary-observation-01-mark.json
habitat-layout-brackish-estuary-observation-02-arrival.json
habitat-layout-brackish-estuary-observation-03-separation.json
habitat-layout-brackish-estuary-observation-04-turn.json
habitat-layout-brackish-estuary-observation-05-ebb.json
habitat-layout-brackish-estuary-observation-06-return.json
```

每份 JSON 带 `metadata.habitat`、`sequence`、`observationIndex`、`nodeId` 和 `anchors`。导入会核对阶段身份及三个观察锚点；失败时保留原布局和阶段。旧版不带元数据的河口布局仍可作为普通编辑布景载入，需补回锚点后才能作为六阶段布局使用。

保留以下对象 ID：

| ID | 用途 |
| --- | --- |
| `estuary-origin-wood` | 固定观察点 P、路线起点 |
| `estuary-algae-base` | 观察点 Q、遮挡段 |
| `estuary-observation-runnel` | 侧沟水流、后段轮廓位置 |

移动、旋转、缩放、镜像这些对象时，标记与局部路线相应改变。固定观察点在六份正式布局中应保持一致，除非同时重写其叙事。不要只换显示坐标而不核对遮挡位置。导出文件不直接写仓库；将作者提交的 JSON 纳入共享布局是独立开发变更，需要再次执行导入、画面和存档测试。

其他精修环境的窗口、按钮、放大缩小、物种渲染和路由不变。河口只禁用会扰动动物的直接点击/抓取，不禁用观察画面的缩放与平移。

## 存档兼容

不更换 v4 存储键。新局写入 `estuaryVersion:1`，记录 `kind:estuary-observation`。旧河口存档迁移为 `estuaryLegacy:true`，继续原来的三日九轮、旧索引文字与三个旧结尾，保留反馈页和已结束状态，不把旧记录塞进新观察序列。旧记录未被删除或重排。

## 资料归属

环境实验室的“当前环境参考”关联 `estuary-noaa-circulation`，支持来水、潮流、地形与混合程度影响盐度分布的环境背景。具体读数、六轮节拍、轮廓移动及个体响应不由该资料推出；适用边界写在实验室。没有添加物种行为断言，因此形态实验室继续显示原有标本证据。Credits 不增加论文或详细环境说明。

## 验证

```sh
node --test tests/estuary.test.mjs
node isopoda/tools/check-all.mjs
NODE_PATH=/path/to/node_modules BASE_URL=http://127.0.0.1:8765 node tests/browser/estuary.cjs
BROWSER=webkit NODE_PATH=/path/to/node_modules BASE_URL=http://127.0.0.1:8765 node tests/browser/estuary.cjs
```

Node 测试穷举 3^6 = 729 条路径，核对证据隔离、生态状态不受选择影响、命名文本键、四种呈现语言、重载、旧九轮存档、遮挡、减少动态效果、布局往返及锚点变换。浏览器测试核对 320、390、1440 宽下的六轮、语言切换、反馈重载、归档、实验室六阶段、导入回滚、实际拖动与环境切换隔离。
