// Environment evidence only. Animal-specific evidence belongs to each specimen.
export const HABITAT_REFERENCES={
 groundwater:{
  scope:'地下水 · 石灰岩洞穴 / LIMESTONE GROUNDWATER',
  entries:[
   {sourceId:'groundwater-recharge',use:'补给、渗流与颗粒搬运',note:'用于渗水、涨水、携入和退水过程的环境背景，以及画面中的颗粒移动。四阶段、各两次选择是叙事编排，不是论文给出的周期。'},
   {sourceId:'groundwater-biofilm',use:'低生产力环境中的食物来源',note:'用于湿面薄层与输入碎屑的生态背景。研究对象为 P. valdensis 与 P. cavaticus，不能据此认定所有洞穴等足类具有相同食性；对应物种的文章也列在形态实验室。'},
   {sourceId:'groundwater-survey',use:'洞穴测点与相对高程',note:'用于测点、距离、方位角和倾角的测绘表达。右上角 Δh 为相对洞口高程；−18.2 至 −19.7 m 是附近观察点的虚构设定，不是实测洞穴或物种采集记录。'}
  ],
  limits:'画面路线、观察次数、个体数量、连通数值与时间尺度均为游戏示意。不同地区的物种作比较展示，不表示它们在同一座洞穴共存。分类、体型与具体物种行为的证据见形态实验室各标本的“当前标本参考”。'
 }
};
