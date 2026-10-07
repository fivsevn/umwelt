// Museum-inspired garden adaptations, never claims of reproductions or antique plant pots.
const miho=(id,label)=>({label:'MIHO MUSEUM · '+label,url:'https://www.miho.jp/booth/html/artcon/'+id+'.htm'}),met=(id,label)=>({label:'Met · '+label,url:'https://www.metmuseum.org/art/collection/search/'+id});
const records=[
 ['antique-shino','志野芒纹浅钵','shallow','#d9d0bd','#eee1cd','#704b37','grass',miho('00000283','志野芒文鉢'),'16世纪桃山时期。参考长石白釉、铁绘芒草和浅阔器形，游戏中增设排水孔。'],
 ['antique-nezumi','鼠志野撇口四方钵','square','#885648','#ad7860','#dfcfac','grass',miho('00000293','鼠志野向付'),'16世纪桃山时期。此藏品烧成赤褐色；参考白色掻落纹、内卷的宽口与三足，改作浅栽培钵。'],
 ['antique-shino-square','志野铁绘四方钵','square','#d4c4a4','#e1d3b3','#7f5940','grass',miho('00000294','志野四方向付'),'参考桃山时期四方向付的厚釉、折角和铁绘纹饰；游戏中按小盆尺度改作带排水孔的器物。'],
 ['antique-nabeshima','锅岛彩绘八角钵','faceted','#dbe0d5','#b9c7c1','#4d7286','flower',met(63040,'八角彩绘钵，约1800年'),'约1800年江户时期。参考八角折面、彩绘花纹和圈足；在游戏中改作栽培钵。'],
 ['antique-nabeshima-dish','锅岛青花几何浅盘','shallow','#dae1da','#a2b8be','#395a79','blue',met(50344,'几何纹青花盘，18世纪'),'18世纪江户时期。参考青花几何纹、浅盘和带梳齿纹的圈足；游戏中增设排水孔。'],
 ['antique-kutani-red','九谷赤绘金彩钵','bowl','#c79c73','#b58a51','#a84f39','imari',{label:'Cleveland · Kutani Bowl, 1986.173',url:'https://www.clevelandart.org/art/1986.173'},'19世纪早至中期江户时期。参考赤绘、金彩、花草与密集分区装饰；按阳台陈列尺度改作小钵。'],
 ['antique-celadon','锅岛青瓷三足钵','scallop','#8cb5a8','#a9cbb8','#5f8c7b','plain',{label:'LACMA · Nabeshima Celadon Bowl',url:'https://collections.lacma.org/object/160060'},'约1700年江户时期。参考轮花口、淡青釉、划花和三足；游戏中增设排水孔。'],
 ['antique-oribe-jar','志野织部铁绘花器','jar','#c4bba5','#756655','#51453a','grass',miho('00000275','志野織部徳利'),'17世纪江户时期。参考鼓腹、窄颈与五道肩部凹线。原器未用铜绿釉，曾作花器；这里作为陈设花器，不用于换盆。'],
];
export const ANTIQUE_VESSELS=records.map(([id,name,shape,color,rim,ink,pattern,source,note])=>({id,name,shape,color,rim,ink,pattern,kind:id==='antique-oribe-jar'?'decorative':'ceramic',sources:[source],note,antique:true,shapeLabel:shape==='jar'?'陈设花器':'古陶瓷风格栽培钵'}));
export const ANTIQUE_PLANT_POTS=ANTIQUE_VESSELS.filter(p=>p.kind!=="decorative").map(p=>p.id);
