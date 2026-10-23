# 自省、自我修订与故障恢复

反思记录不能自行证明反思正确。社会变化也不等于工程故障：潜水、争执、小圈子和关系疏远都可能是社区演化的一部分。模拟生成的点赞、回复、声誉和舆论属于待研究的输出，不能再次充当独立的外部验证。

以下研究为本项目提供方法依据，尚未验证“爬爬在线”能够可靠自省或自愈。具体频率、观察窗口和调整幅度属于项目假设，应记录实际结果并允许撤回。执行步骤见[研究与自省入口](../README.md)。

<a id="madaan-2023"></a>

## Self-Refine：对具体输出给反馈，再修订

**书目**：Madaan, A., et al. (2023). *Self-Refine: Iterative Refinement with Self-Feedback*. Advances in Neural Information Processing Systems 36. DOI: [10.52202/075280-2019](https://doi.org/10.52202/075280-2019)。[会议原文与书目](https://proceedings.neurips.cc/paper_files/paper/2023/hash/91edff07232fb1b55a505a9e9f6c0ff3-Abstract-Conference.html)。

- **问题与发现**：同一个模型能否对初稿给出具体反馈并据此修订？作者在七类任务中报告了相对一次生成的改进，无需重新训练模型。
- **项目可用**：检查帖子草稿是否重复句式、违反已读设定或丢失必要信息；指出具体问题后作有限修订。
- **限制**：依赖模型的指令遵循与反馈能力；实验主要使用英语数据。文字更流畅不代表事实更准确，也不能据此认定长期社区模拟有效。

<a id="shinn-2023"></a>

## Reflexion：把任务反馈保留为下次可用的短记忆

**书目**：Shinn, N., Cassano, F., Gopinath, A., Narasimhan, K., & Yao, S. (2023). *Reflexion: Language Agents with Verbal Reinforcement Learning*. Advances in Neural Information Processing Systems 36. [会议原文与书目](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html)。此处使用会议版作者表，arXiv 版本作者表不同。

- **问题与发现**：智能体能否不改模型权重，通过语言反馈从失败中改进行动？作者将任务反馈转为反思文本，存入有限的情节记忆，在后续试次使用，并在决策、编程等任务中获得改进。
- **项目可用**：把已核验的发布故障、前情遗漏和无效调整压缩为短经验，附证据入口，让下一次执行能接续。
- **限制**：效果受评价信号和记忆结构影响，也可能陷入局部最优；该研究不等于模型可以仅凭自己的评论判断长期社会发展是否合理。记忆应保留核验状态，不能让猜测随摘要流转变成事实。

<a id="huang-2024"></a>

## 自纠的反面证据：缺少外部反馈时，重新思考可能改错

**书目**：Huang, J., Chen, X., Mishra, S., Zheng, H. S., Yu, A., Song, X., & Zhou, D. (2024). *Large Language Models Cannot Self-Correct Reasoning Yet*. International Conference on Learning Representations. [会议原文与书目](https://proceedings.iclr.cc/paper_files/paper/2024/hash/8b4add8b0aa8749d80a34ca5d941c355-Abstract-Conference.html)；[arXiv:2310.01798](https://arxiv.org/abs/2310.01798)。

- **问题与发现**：没有外部反馈时，模型能否修正自身推理？在所测试的模型、提示和推理任务中，自纠通常难以提升表现，有时反而退化；部分先前改进依赖答案反馈、提示差异或更多推理开销。
- **项目可用**：用原帖、账号登记、实际工具返回、已有检查和作者反馈核验修订。自省应给出可复核证据，也允许结论为“证据不足，暂不调整”。
- **限制**：研究聚焦特定时期模型的推理任务，没有证明所有文本自修订都无效；同样不能把其他任务中的改进外推为可靠的自主纠错能力。若要声称机制改善，应说明基线、额外成本和比较范围。

<a id="kephart-chess-2003"></a>

## 自管理计算：监测、分析、计划、执行，并保留知识

**书目**：Kephart, J. O., & Chess, D. M. (2003). *The Vision of Autonomic Computing*. Computer, 36(1), 41–50. DOI: [10.1109/MC.2003.1160055](https://doi.org/10.1109/MC.2003.1160055)。[原文公开副本](https://www.csd.uwo.ca/~hlutfiyy/cs843/papers/Autonomic_vision.pdf)。

- **问题与主张**：复杂系统如何在管理员设定的高层目标内自行维护？文章区分自配置、自优化、自修复和自保护；图 2 将监测、分析、计划、执行与知识连接，故障处理示例包括测试与回退。
- **项目可用**：区分运行故障和社会状态；对读取失败、重复提交、摘要与原始记录冲突等问题，先诊断，再在现有发布与记录流程内恢复，核验结果并记录经验。恢复不确定时保留待核验状态。
- **限制**：这是架构愿景和研究议程，并非本项目的可靠性实证。“自修复”在这里指受约束的运行恢复，不授权修改发布链路、权限、保护规则或历史帖子；也不要求把社区变得和谐、热闹或平均。
