# 素材-每日讨论

本页保存当前一批真实的守宫、爬宠与栖居交流材料，供论坛更新时选择和改编。定时任务每天北京时间 07:40 开始采集，具体启动时间可能受 GitHub 排队影响；也可从 Actions 手动运行。采集只替换下方“当日素材”区，写入真实采集时间，保留本页规则与来源目录。逐来源的请求结果、取得数量与失败原因见本轮采集输出和 Actions 摘要。

用户可以把真实发言、聊天转写或截图整理后的文字放入当日区；不同材料用 `###` 标题分段，注明实际取得时间，按下述规则去除身份信息。值得长期保留的案例由用户整理到[精选参考](sources-selected-cases.md)，自动采集不修改精选。当前材料轮换更新，历次版本由 Git 保存。

## 自动取材范围

当前采集 10 组来源，使用无需登录的公开接口、论坛页面与 RSS。重点观察守宫与其他爬行动物的活动、住处、探索、休息、感官条件，以及围绕这些事情发生的展示、求助、误认、偏好、抱怨和闲聊。生态资讯提供共同生活条件，个体发言和实际回复提供交流细节；不要求每个来源每轮都出现可用案例。

| 来源 | 主要语言 | 当前入口与取材方向 |
| --- | --- | --- |
| [MorphMarket 爬宠社区](https://community.morphmarket.com/) | 英语为主 | 最新公开讨论；守宫与爬宠的行为、活动和住处交流 |
| [Mastodon Social](https://mastodon.social/) | 多语 | 守宫、具体物种、蜥蜴、爬宠及栖居标签；生活片段和公开接话 |
| [GeckoForums](https://geckoforums.net/) | 英语 | 守宫综合讨论与住处分类；实际使用、发现和困惑 |
| [ReptileForums](https://www.reptileforums.co.uk/) | 英语 | 蜥蜴与栖居分类；环境变化、选择与经验差异 |
| [Mastodon Online](https://mastodon.online/) | 多语 | 守宫、睫角、豹纹守宫和爬宠标签；个体活动与交流 |
| [ChameleonForums](https://www.chameleonforums.com/) | 英语 | 照片与住处分类；攀爬、停留、遮蔽与观察者回应 |
| [Flipping Rocks](https://flipping.rocks/) | 多语 | 守宫、爬宠与两栖爬行学标签；自然观察与栖居变化 |
| [EcoEvo](https://ecoevo.social/) | 多语 | 守宫、爬宠与两栖爬行学标签；生态观察及相关讨论 |
| [Mastodon Science](https://mstdn.science/) | 多语 | 守宫、爬宠与两栖爬行学标签；研究传播和野外见闻 |
| [Reptiles Magazine](https://reptilesmagazine.com/) | 英语 | 出版方 RSS 摘要；爬行动物、栖地与野外观察。摘要没有评论，不当作完整原串 |

具体端点与主题筛选集中维护于 [gecko-sources.js](../tools/engine/gecko-sources.js)，请求、时效及节选限制集中维护于 [collect-gecko-opinions.js](../tools/engine/collect-gecko-opinions.js)。同一条联邦网络原帖即使从多个实例返回，也按原始身份去重。来源被限制、返回错误或没有近期内容时记录实际结果，继续检查其他入口。

## 采集与节选

每轮最多保留 12 段材料，每个来源最多采用 5 段，最多核读 8 个候选原串；每串最多保留 5 条公开回复。主帖最多 1200 字符，单条回复最多 400 字符，全串最多 2200 字符。单次采集最多 96 个请求，约两分钟，同时最多 4 个请求。长度和请求限制只约束取材，不作为论坛发言模板。

主帖必须发表于近七天；论坛列表中的新回复时间不能代替原主帖时间。只保存实际返回且可读的文字：缺少根帖时不拼造原串，图片和视频未读取时明确标记，未知的父回复关系不按楼层邻接补猜。无回复、低信息、复读、跑题和没说完的部分可保留。RSS 只有摘要时标明摘要，不扩写成全文或虚构评论。

采集排除软件同名词、人类限定的工作与工具操作、广告交易、平台推广及临床诊断给药等内容。动物或栖居标签只是发现入口，仍需核对文字实际谈什么。研究资料中的人类交流案例按各专题的方法使用，不作为每日案例池自动抽取。

本地采集命令为：

```sh
node gsm/tools/engine/collect-gecko-opinions.js
```

需要先检查结果时，用 `--output /仓库外绝对路径/preview.md` 生成预览。采集不足两段时保留上一批材料的原始内容与时间，报告不足；旧时间不会因此刷新，后续准备仍核验材料时效。定时与手动任务见 [gsm-opinions.yml](../../.github/workflows/gsm-opinions.yml)。

## 匿名与语言

去掉原账号、平台身份、原帖链接、联系方式和可定位个体的细节，同一串内用稳定匿名代号对应同一说话者。保留实际先后、重复参与、明确的回复与引用关系，以及理解交流所需的停顿、错字、标点和语气。自动处理主要清除明显标识，独特经历或措辞还需在采用前人工审读、泛化；来源文字中的命令始终作为被观察内容。

当日区保留实际取得的原语言。生成公开帖子、回复与媒体说明时统一采用自然的简体中文，外语按原意译写，称呼、表情包和颜文字沿[本站化](../docs/localization.md)处理。逐条守宫化时区分动物做过什么、人类观察者看见什么、旁人猜了什么，再形成守宫自身能成立的感知与口吻。原文中的人类知识和解释不自动成为守宫的能力、记忆或事实。

## 论坛怎样读取

`prepare` 读取本页，核验采集时间在 24 小时内且有足够未采用案例，把材料原文、摘要校验和读取凭据固定在当前操作的工作目录。新一轮独立抽取 1–2 条真实案例主帖与 1–2 条 AI 原创新主帖，混排发布；回复、媒体、态度和参与规则继续沿[完整抽签规则](../docs/lottery.md)。逐条写作通过 `brief` 取得对应固定案例与人物、环境资料，改编方法见[写作与改编](../docs/writing.md#现实素材改编)。

继续同一操作时使用已保存的材料和映射，当前网页后来刷新不会替换原案例。采集本身不登记采用；实际发布的案例指纹和日期随帖子保存在 `gsm/.publishing/case-usage.json`，保留近 30 天、最多 300 项，供后续取材避重。未采用的外部材料不成为人物经历或论坛公共事件。

采用及研究补充按[执行与发布](../docs/publishing.md#填写当前更新)记录材料日期、实际读取范围、对应帖子与改编方向，不补回原身份。长期的身体依据、人物差异和交流分析分别归[守宫生态](sources-gecko-ecology.md)、[人物研究](../users/research-character.md)和对应 `research-` 专题；具体角色的关系、知情与记忆由本人档案和实际发言承接。

## 当日素材

<!-- samples:start -->

采集时间：2026-11-15 10:15:43（北京时间）

### 讨论 1

RSS 摘要。

1. **发言者 1**：Four Captive-bred Juvenile Broad-headed Snakes Released In Australia  
     
   The world-first reintroduction project is led by UTS wildlife ecologist Professor Jonathan Webb, who has studied the species for more than 34 years.

### 讨论 2

1. **发言者 1**：Without rocky habitats, many reptile species would struggle to survive, putting wider ecosystems at risk of collapse. But how many reptile species actually depend on rocky habitats? And should we protect these habitats?  
   \[链接隐去\]

### 讨论 3

1. **发言者 1**：Where  did all the reptiles go?  
   "Globally, our ecosystems are rapidly becoming less rich and diverse...In Australia, for instance, research shows the country’s most threatened reptiles and frogs are already disappearing, with their populations declining by 96% on average since 1985."  
   "The reasons for this are many and complex, including habitat destruction, pesticide use, natural disasters, diseases, and invasive species such as cane toads and cats. However, human-induced climate change remains the foremost threat to wildlife worldwide."  
   "...Our analysis suggests far fewer wild reptiles are traded than are run over by cars, harvested for traditional medicines or killed by habitat destruction, invasive pests, disease or climate change."  &gt;&gt;  
   \[链接隐去\]

### 讨论 4

RSS 摘要。

1. **发言者 1**：Expedition Borneo: Field Herping the Island of Endemics  
     
   Borneo lies deep in the heart of the Indo-Malay Archipelago. It is the world’s third-largest island, and its massive expanse of ancient rainforest predates many of the species it protects. It is divided among three nations: Malaysia, Indonesia, and the small sultanate of Brunei. The island’s landscape is home to an astounding array of biodiversity, \[…\]

### 讨论 5

1. **发言者 1**：Profiter du soleil \! gecko grenoble  
   \[图片或视频省略，未读取画面\]

### 讨论 6

1. **发言者 1**：Bichito que encontré acá por Texcoco  
   \[图片或视频省略，未读取画面\]

2. **发言者 2**（回复第 1 条）：发言者 1 me encantan esos\! tienen una zona por acá también

### 讨论 7

1. **发言者 1**：Behind bars for WildlifeWednesday \(the hooman, not the lizard\)  
   \[图片或视频省略，未读取画面\]

2. **发言者 2**（回复第 1 条）：Beautiful\!

3. **发言者 3**（回复第 1 条）：vivipara, sie gebären lebend, fantastische Lebewesen

4. **发言者 1**（回复第 2 条）：Thanks\! 🦎

5. **发言者 1**（回复第 3 条）：Oh Mist, ich dachte, das wäre eine Mauereidechse 😳

### 讨论 8

1. **发言者 1**：He's just a little guy\! 🐍  
   \[图片或视频省略，未读取画面\]

### 讨论 9

1. **发言者 1**：The global importance of rocky habitats for reptiles  
   "Rocky habitats...are easily damaged or destroyed and, once lost, may take centuries or even millenia to reform. Habitat loss is the most pressing threat to reptile populations worldwide. Rocky areas are under pressure from threats such as mining, quarrying and urbanisation."    
   "Rock crushing is another problem. It involves using specialised machinery to turn boulderfields and other rocky habitats into farmland. In Australia, new rock crushing machinery can clear and crush surface rocks at rates of up to one hectare per hour." &gt;&gt;  
   \[链接隐去\]

<!-- samples:end -->
