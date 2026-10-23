# 模型组织与社会生态框架

[研究总览](../README.md) · [执行总控](../../ai-updates.md) · [环境与外界](../../environment.md) · [社会状态](../../society.md)

这一组资料帮助描述模型、划分维护责任，以及辨认环境与互动的联系。它们不为某种守宫社会结局提供保证。具体模块数量和执行流程仍是本项目的工程选择。

<a id="parnas-1972"></a>

## 按变化责任划分模块

**Parnas, D. L.（1972）**。*On the Criteria To Be Used in Decomposing Systems into Modules*。*Communications of the ACM* 15(12):1053–1058。DOI [10.1145/361598.361623](https://doi.org/10.1145/361598.361623)；[公开教学全文](https://www.cs.lafayette.edu/~gexia/cs301/resources/parnas.html)。

**问题与发现：** 论文比较不同的系统分解方式，提出将可能变化的设计决策隐藏在模块内部，以改善修改的局部性与可理解性。**采用与边界：** 角色、环境、社会状态和执行约定各有维护位置；其他文档链接其负责者，减少重复设定。它讨论软件模块设计，不能证明任何一种文档拆分是唯一正确方案，也不说明守宫社会怎样发展；当前文件粒度要随实际维护负担调整。

<a id="grimm-2020"></a>

## 清楚描述实体、状态与过程

**Grimm, V. et al.（2020）**。*The ODD Protocol for Describing Agent-Based and Other Simulation Models: A Second Update to Improve Clarity, Replication, and Structural Realism*。*JASSS* 23(2):7。DOI [10.18564/jasss.4259](https://doi.org/10.18564/jasss.4259)；[开放全文与补充材料](https://www.jasss.org/23/2/7.html)。

**问题与发现：** ODD 为代理等模拟提供描述规范，要求交代目的、实体与状态、尺度、过程顺序、设计概念和细节，以便理解、检查与重建模型。**采用与边界：** 总控说明何时读取和推进，各模块分别保存状态或机制，区分当前事实、初始条件和待观察假设。文档清楚不代表模型已获验证；本项目并非已完成的 ODD 数值实验，也未证明结构真实性或参数可复现。

<a id="ostrom-2009"></a>

## 资源、使用者、治理与外部环境

**Ostrom, E.（2009）**。*A General Framework for Analyzing Sustainability of Social-Ecological Systems*。*Science* 325(5939):419–422。DOI [10.1126/science.1172133](https://doi.org/10.1126/science.1172133)；[PubMed 书目与摘要入口](https://pubmed.ncbi.nlm.nih.gov/19628857/)。

**问题与发现：** 框架将资源系统、资源单位、治理系统和使用者，以及更广的社会与生态环境联系起来，用于比较不同社会生态系统及其互动结果。**采用与边界：** 环境模块保存共享条件，社会模块保存实际形成的规则与关系，允许条件与行动互相反馈。该框架不意味着资源稀缺必然引发冲突或制度；人类资源治理也不能直接解释守宫生态。政治、地位和约定的发展仍需具体过程，不能靠引用预先宣布结果。

<a id="micropolis"></a>

## 补充：Micropolis 源码

**SimHacker / Micropolis 项目**。[模拟核心 `simulate.cpp`](https://github.com/SimHacker/micropolis/blob/master/MicropolisCore/src/MicropolisEngine/src/simulate.cpp)。源码参考，**不是论文或社会科学证据**；核对日期：2026-10-23，链接指向可变的 `master` 分支。

`simulate()` 将扫描和普查分阶段、按不同周期运行；`decTrafficMap()`、`decRateOfGrowthMap()` 逐步削减旧状态。这里仅借鉴分时检查、局部更新和影响消退的工程思路，不搬用城市模型的参数、社会简化或时间尺度，也不将交通记忆衰减当成人类或守宫遗忘理论。论文仍是主要研究入口。
