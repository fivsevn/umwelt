export const READOUT_REFERENCES={
 "terrestrial": {
  "scope": "腐殖层 / FOREST LITTER / 腐植層",
  "entries": [
   {
    "sourceId": "scale-woodlice",
    "use": "落叶层的湿润庇护 / Moist litter refuges / 湿った落葉の隠れ場",
    "note": "支持温湿度与庇护相关的环境主题，不提供游戏通风阈值。/ Supports moisture and shelter as habitat factors, not airflow thresholds. / 湿気と隠れ場の背景であり、通気の閾値を示さない。"
   },
   {
    "sourceId": "scale-rh",
    "use": "相对湿度 / Relative humidity / 相対湿度",
    "note": "相对湿度以百分率表示，不是土壤含水率；日语采用相対湿度。/ RH is an air-moisture percentage, not soil water content. / 相対湿度は空気の湿度で、土壌含水率ではない。"
   }
  ],
  "limits": "左侧：温度 °C、相对湿度 %、通风 0–100、光照描述。通风为场景相对指数，非 m/s。右侧：起始日期加剧情日数及七日叙事时刻，随推进变化，不随现实钟跳动。/ Left: temperature, RH, relative airflow (0–100), and light description. Airflow is not m/s. Right: start date plus narrative days and story time. / 左は温度・相対湿度・通気の相対指標・光の状態。右は開始日から進む七日間の物語時刻。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "freshwater": {
  "scope": "淡水腐殖池 / FRESHWATER LITTER POOL / 淡水の腐葉池",
  "entries": [
   {
    "sourceId": "scale-oxygen",
    "use": "溶氧与水温 / Dissolved oxygen and temperature / 溶存酸素と水温",
    "note": "以 mg/L 表示溶氧；有机质分解、水温与氧状态有关。/ DO uses mg/L; organic decay and temperature affect oxygen conditions. / 溶存酸素は mg/L で表し、有機物分解や水温に関係する。"
   },
   {
    "sourceId": "scale-leaf-transport",
    "use": "腐叶的分解与搬运 / Leaf breakdown and transport / 落葉の分解と運搬",
    "note": "支持叶片、碎片、悬浮与沉积过程，不能据此认定所有腐叶七天分解。/ Supports breakdown and transport, not a universal seven-day decay rate. / 分解と運搬の背景であり、七日間という普遍的速度ではない。"
   },
   {
    "sourceId": "scale-oxygen-ja",
    "use": "日语术语 / Japanese terminology / 日本語の用語",
    "note": "溶氧使用溶存酸素，单位 mg/L。/ Japanese DO label: 溶存酸素, mg/L. / 水温・溶存酸素の表記を参照。"
   }
  ],
  "limits": "右侧从初次观察起计 +0.0 至 +168.5 h：同一材料阶段的两次观察间隔半小时，阶段间时间跳转为叙事编排。左侧为水温、溶氧、流速与材料状态。溶氧将内部指数除以 10 显示为约 6.0–6.8 mg/L，流速为内部指数除以 10，即 3.0 cm/s；均为模拟映射，不是单位换算或实测标定。/ Elapsed time is 0–168.5 h with half-hour paired observations and authored gaps. DO = internal oxygen index / 10 (about 6.0–6.8 mg/L); flow = flow index / 10 (3.0 cm/s). These are authored mappings, not unit conversions or calibration. / 経過時間は0–168.5時間。同一段階内は30分間隔、段階間は創作上の時間省略。酸素・流速の内部指標をそれぞれ10で割る表示は、測定や単位換算ではない。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "groundwater": {
  "scope": null,
  "entries": [
   {
    "sourceId": "groundwater-recharge",
    "use": "水文连通、渗流与物质输入 / Connectivity, seepage and input / 水文的連結・浸透流・物質流入",
    "note": "三个值均以 0–100 相对刻度表示：通水路径连续程度、相对渗流强度、外源物质输入强度，不是体积流量或质量浓度；定性状态为无日光，手电是局部人工光。/ Three 0–100 indices describe connected water paths, seepage strength and incoming material, not discharge or concentration. No daylight excludes the local torch. / 三つの0–100指標は水路の連結・浸透流・物質流入の相対強度で、流量や濃度ではない。日光なしでも局所照明は存在する。"
   },
   {
    "sourceId": "scale-cave-darkness",
    "use": "洞穴暗带 / Cave dark zone / 洞窟の暗黒帯",
    "note": "无日光描述天然光条件，不否定手电局部照明；相对高程本身不能推断洞穴光照。/ No daylight describes natural light, not the local torch. Elevation alone does not determine cave lighting. / 日光なしは自然光の状態であり、局所照明とは別。比高だけでは光環境は決まらない。"
   }
  ],
  "limits": "右上保留观察点相对洞口的高程，随八次观察改变；左侧三个相对指数不重复高程。/ Eight observation-point elevations remain at right; three relative process indices remain at left. / 右の洞口からの比高は八回の観察で変化し、左の三指標とは重複しない。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "intertidal": {
  "scope": null,
  "entries": [
   {
    "sourceId": "scale-tide-terms",
    "use": "潮汐术语 / Tide terminology / 潮汐用語",
    "note": "涨潮／退潮／满潮译作 flood tide / ebb tide / high tide 与 上げ潮／下げ潮／満潮；隔水为场景连通描述。/ Tide terms follow their physical meaning; isolated describes scene connectivity. / 上げ潮・下げ潮・満潮を用い、分断は場面の水路状態を表す。"
   }
  ],
  "limits": "右侧为从低潮起的经过时间（时:分），至12:25。左侧为淹水相对指数 %、通水石隙数 /5、流势 /100 与潮况词，不将流势指数冒充 cm/s。/ Right: elapsed h:min to 12:25. Left: relative inundation %, open gaps /5, current index /100 and tide state; current index is not cm/s. / 右は干潮からの経過時:分、左は冠水指標・通水隙間数・流勢指標・潮の状態。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "sandy-surf": {
  "scope": null,
  "entries": [
   {
    "sourceId": "scale-tide-terms",
    "use": "波浪与潮汐的区别 / Waves versus tides / 波浪と潮汐",
    "note": "秒级浪洗时钟不是半日潮时钟，避免把每一阵波当作一次潮汐。/ The seconds-scale swash clock is not a semidiurnal tide clock. / 秒単位の波の遡上と半日潮を区別する。"
   },
   {
    "sourceId": "scale-practical-salinity",
    "use": "实用盐度 / Practical Salinity / 実用塩分",
    "note": "PSS-78实用盐度无量纲，游戏盐度值不加g/L；不是绝对盐度。/ PSS-78 Practical Salinity is unitless, not Absolute Salinity or g/L. / PSS-78の実用塩分は無次元で、絶対塩分やg/Lではない。"
   }
  ],
  "limits": "右侧为同一段浪洗观察的经过时间 +00:00 至 +01:09（分:秒），替代现实日期。左侧：浪位 /100、流速 cm/s、实用盐度（无量纲）、沙面描述。浪位为相对位置而非实测潮高；流速为内部流动指数的一半，是模拟映射；35左右的盐度为场景设定，不是各物种的耐受阈值。/ Right: elapsed swash time 0–69 seconds. Left: relative wash /100, flow cm/s, dimensionless practical salinity, and sand surface. Flow is half the internal index, an authored mapping; salinity near 35 is not a species tolerance limit. / 右は波打ち際の経過0–69秒。左は相対波位置・流速・無次元の実用塩分・砂面。流速は内部指標の半分という創作設定で、塩分は耐性限界ではない。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "shallow-marine": {
  "scope": null,
  "entries": [
   {
    "sourceId": "scale-daylight",
    "use": "水下光环境 / Underwater light / 水中の光",
    "note": "支持水下光衰减背景，透光值与斑驳光为藻场场景设定。/ Supports underwater light attenuation; transmission and dappled light are authored for the bed. / 水中の光減衰を背景に、透光率とまだらな光は場面設定。"
   }
  ],
  "limits": "右侧09:12–10:02随九次观察推进；左侧保持流速、相对透光、水深，新增斑驳光这一非数值状态。/ Right: nine story times from 09:12–10:02. Left: flow, relative light transmission, depth, and dappled light. / 右は九回の物語時刻。左は流速・相対透光率・水深・まだらな光。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "abyssal": {
  "scope": "深海观察点 / DEEP-SEA STATION / 深海観察点",
  "entries": [
   {
    "sourceId": "scale-pressure",
    "use": "深度与静水压力 / Depth and hydrostatic pressure / 深度と静水圧",
    "note": "每下潜约10 m增加约一个大气压；显示绝对压强近似值 0.1013 + 深度×0.01005 MPa。/ Approximately one atmosphere per 10 m; absolute pressure is approximated as 0.1013 + depth × 0.01005 MPa. / 約10 mで約1気圧増加。表示は絶対圧の近似値。"
   },
   {
    "sourceId": "scale-daylight",
    "use": "无日光与局部探灯 / No daylight, local lamp / 日光なし・局所照明",
    "note": "约1240 m处无日光，画面亮处来自观察灯。/ Around 1240 m there is no daylight; visible illumination comes from the observation lamp. / 約1240 mでは日光はなく、観察灯が局所を照らす。"
   }
  ],
  "limits": "右侧1240.0–1253.0 m为虚构观察点深度序列。左侧水温3.7–4.2 °C、绝对压强、探灯设置 %、无日光；探灯百分数不是照度 lux。深度并非缩放距离，拉远镜头不改变测点深度。不将此站冒充大王具足虫的真实采集地点；约1240 m在科学分带中属半深海，游戏沿用深海环境名称。/ Right: authored station depths 1240–1253 m. Left: 3.7–4.2 °C, absolute pressure, lamp setting %, no daylight. Lamp % is not lux; camera pullback is not depth. This is not a real collection site; scientifically this depth is bathyal. / 深度列・水温は創作。照明%はluxではなく、カメラ距離は測点深度ではない。実在の採集地点ではなく、科学的には漸深海の深度。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 },
 "petri-dish": {
  "scope": "培养皿观察 / DISH OBSERVATION / 培養皿観察",
  "entries": [
   {
    "sourceId": "scale-optics",
    "use": "倍率、对焦与照明 / Magnification, focus and illumination / 倍率・焦点・照明",
    "note": "三个独立的显微观察控制量，不用倍率推断照度或分辨率。/ Three separate optical controls; magnification does not determine illumination or resolution. / 三つの独立した操作量で、倍率だけから明るさや解像度を推定しない。"
   },
   {
    "sourceId": "scale-optics-ja",
    "use": "显微术语 / Optical terminology / 顕微鏡用語",
    "note": "依据 Nikon 中日英资料区分倍率、焦点位置与照明；isopod 为作品自创符号编码，并非科学语言翻译。/ Nikon terminology distinguishes magnification, focus position and illumination. Isopod is fictional symbol encoding, not a scientific translation. / Nikonの用語に従う。等脚類語は創作の記号表現。"
   }
  ],
  "limits": "右侧为玩家设备当地日期时间，随现实分钟变化。左侧为显示倍率（普通观察1×、镜下4–32×）、焦位 /100、照明设置 %、普通观察／合焦／失焦。普通观察中的焦位和照明明确标为预设，镜下实时响应旋钮；焦位不是距离单位，照明不是lux，倍率不是标定光学倍率。/ Right: device-local date/time. Left: display enlargement (overview 1×; scope 4–32×), focus /100, light setting %, and overview/in-focus/out-of-focus state. Overview labels stored settings explicitly; dials update live in scope. These are uncalibrated display controls. / 右は端末の現地時刻。左は表示倍率・焦点位置指標・照明設定・観察状態。全体観察では保存設定と明示し、顕微鏡内では操作に追従する。光学測定値ではない。 读数为依据环境过程编排的模拟状态，不是现场测量或饲养参数。/ Readings are authored environmental illustrations, not field measurements or husbandry parameters. / 値は環境過程に基づく創作上の模式表現で、実測値や飼育条件ではない。"
 }
};
