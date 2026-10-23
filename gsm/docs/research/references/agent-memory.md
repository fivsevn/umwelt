# 生成代理、记忆与模型偏差

[研究总览](../README.md) · [模拟方法](../../simulation.md)

这一组资料用于约束 AI 的执行方式、信息读取和自省。代理架构与问答评测的结果不等于真实人类或守宫的认知规律，也不能替本项目证明长期社会真实性。

<a id="park-2023"></a>

## 记忆、计划与反思

**Park, J. S. et al.（2023）**。*Generative Agents: Interactive Simulacra of Human Behavior*。UIST 2023；[作者预印本 arXiv:2304.03442](https://arxiv.org/abs/2304.03442)。

**问题与发现：** 论文在 25 个角色的小镇中，将自然语言经历、按近期性／相关性／重要性检索、反思和计划结合起来；消融评估支持这些组件对行为可信度的贡献。**采用与边界：** 按处境查旧事，用有原帖依据的观察连接经历与下一步打算。原文展示的主要社会过程只有两个模拟日；本项目也由一个执行者代入多个角色，没有复现其完整架构，不能承诺长期一致性，更不能将写作可信度等同社会科学有效性。

<a id="chuang-2024"></a>

## 观点互动与模型自身倾向

**Chuang, Y.-S. et al.（2024）**。*Simulating Opinion Dynamics with Networks of LLM-based Agents*。*Findings of NAACL 2024*:3326–3346。DOI [10.18653/v1/2024.findings-naacl.211](https://doi.org/10.18653/v1/2024.findings-naacl.211)；[出版页与全文](https://aclanthology.org/2024.findings-naacl.211/)。

**问题与发现：** 研究考察 LLM 代理的观点互动，发现模型对事实准确性的倾向会推动特定问题上的共识，提示方式改变后可出现不同的观点分化。**采用与边界：** 自省时检查过快共识、口吻同化，以及模型是否替角色消除了合理差异。研究的议题、网络、提示和观点量表都有特定条件；不能推成所有模型或社会的定律，也不应为制造分歧而强加错误信念或极化剧情。

<a id="liu-2024"></a>

## 长上下文中的信息位置

**Liu, N. F. et al.（2024）**。*Lost in the Middle: How Language Models Use Long Contexts*。*Transactions of the Association for Computational Linguistics* 12:157–173。DOI [10.1162/tacl_a_00638](https://doi.org/10.1162/tacl_a_00638)；[出版页与全文](https://aclanthology.org/2024.tacl-1.9/)。

**问题与发现：** 多文档问答与键值检索实验中，相关信息位于上下文中部时，所测模型的表现往往低于位于开头或结尾时。**采用与边界：** 使用短入口、明确职责和检索路径，给摘要标出覆盖范围并保留原帖；需要细节时有目的地读取。研究不能证明本项目的文件数量、摘要长度或回看间隔最佳，也不能将当时模型的结果无条件推给后续模型；摘要始终不能替代事实来源。

<a id="wu-2025"></a>

## 长期记忆中的更新与信息不足

**Wu, D. et al.（2025）**。*LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory*。ICLR 2025；[arXiv:2410.10813](https://arxiv.org/abs/2410.10813)（2024 年首发，2025 年修订）。

**问题与发现：** 基准用长期对话中的问题评估信息提取、跨会话推理、时间推理、知识更新和信息不足时的处理，并区分索引、检索、读取三个阶段。**采用与边界：** 将公开原帖、当前状态和短交接分开，记录回看覆盖点；缺关键事实时查证或暂不执行。它评测的是助理记忆问答，不能证明角色的遗忘规律，也没有验证本项目的短摘要或回看节奏；角色忘记与维护者漏读必须分清。
