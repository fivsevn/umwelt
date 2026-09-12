import {encounterFor,encounterText,responseMode} from './encounters.mjs?v=pixel-life-6';
import {SPECIES,speciesById} from './species.mjs?v=pixel-life-6';
import {MORNING,EVENING,AMBIENT,CARE,MINI_TYPES,ENDINGS} from './content.mjs?v=pixel-life-6';
export const VERSION=3;
export const PERIODS=['晨间','午后','夜间'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash(seed,n){let x=(seed+Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return (x^(x>>>16))>>>0}
export function createRun(species='dairy',seed=Date.now()>>>0){
 const p=speciesById(species);return {version:VERSION,seed:seed>>>0,species:p.id,day:1,period:0,stage:'choice',humidity:p.wet,temp:23,vent:55,light:54,cover:p.cover,food:1,interventions:0,quiet:0,accuracy:0,maps:0,labels:0,care:0,records:[],ending:null,feedback:'',scene:null};
}
export function validRun(s){return !!(s&&s.version===VERSION&&SPECIES.some(p=>p.id===s.species)&&Number.isInteger(s.day)&&s.day>=1&&s.day<=7&&Number.isInteger(s.period)&&s.period>=0&&s.period<=2&&['choice','feedback','ended'].includes(s.stage)&&Array.isArray(s.records)&&['seed','humidity','temp','vent','light','cover','food','interventions','quiet','accuracy','maps','labels','care'].every(k=>Number.isFinite(s[k])))}
export function timeFor(seed,day,period){
 const starts=[6*60,13*60,20*60],spans=[5*60,5*60,4*60];
 const minute=starts[period]+((hash(seed,period+71)+(day-1)*47)%spans[period]);
 return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
}
function pick(s,a,salt=0){return a[hash(s.seed,(s.day-1)*3+s.period+salt)%a.length]}
function opt(id,label,delta={},text=''){return {id,label,delta,text}}
export function sceneFor(s){
 const p=speciesById(s.species),salt=hash(s.seed,s.day),scene={id:`${s.day}.${s.period}`,title:PERIODS[s.period],kind:'text',text:'',options:[]};
 if(s.period===0){
   scene.text=pick(s,MORNING[s.day-1]);const extra=AMBIENT.filter(e=>e.when(s));if(extra.length)scene.text+=' '+pick(s,extra,5).text;
   let keys=s.humidity>85?['air','leaf','wait']:s.food>3?['clean','air','wait']:s.humidity<58?['mist','leaf','wait']:s.day%3===0?['food','shade','wait']:s.day%2===0?['air','food','wait']:['mist','leaf','wait'];
   scene.options=keys.map(id=>opt(id,CARE[id].label,CARE[id].delta,pick(s,CARE[id].text,3)));
 }else if(s.period===2){
   scene.text=pick(s,EVENING[s.day-1])+' '+p.notes[(s.day-1)%3];
   scene.options=[opt('describe','只记看到的',{labels:1},pick(s,['你写下了位置、颜色和停留。句子没有替它们补上理由。','你记下“进入叶片下面”。今天到这里为止。','纸上多了几行。盒子里的土没有因此变平。'],8)),opt('infer','写下一个猜测',{maps:1},pick(s,['你写下“可能”，后面跟着一个很小的问号。','你留下一个假设。明天的路线也许不会配合。','这一条先放在页边，暂不抄进结论。'],7)),opt('blank','留下一行空白',{quiet:1},pick(s,['空白留在原处。它不是一次漏记。','笔停下来时，最小的个体还在走。','你把本子合上了一会儿，叶片下的时间没有暂停。'],4))];
 }else{
   const type=MINI_TYPES[(s.day-1+hash(s.seed,50)%7)%7];scene.kind=type;
   if(type==='count'){
     scene.count=2+salt%4;scene.text='观察片段已停格。数一数这几只露在叶外的个体；藏着的暂不计入。';
     scene.options=(scene.count===5?[3,4,5]:[scene.count-1,scene.count,scene.count+1]).map(n=>opt('count'+n,n+' 只',{accuracy:n===scene.count?1:0},n===scene.count?'这次露在外面的数量对上了。木片下面的数量仍然空着。':`停格里是 ${scene.count} 只。颜色和碎叶挨在一起，很容易少看或多看一只。`));
   }else if(type==='water'){
     scene.text='左侧的土仍然深暗，右侧已经松散。只给一个地方补水，还是让干湿之间的距离缩短一些？';
     scene.options=[opt('wet-left','湿区少量',{humidity:5,care:1,interventions:1},'少量水留在左侧，右边仍较干。个体可以在两边之间移动。'),opt('wet-all','两边都喷',{humidity:14,interventions:1},'两侧都变暗了，原先的干湿边界缩小。下一次可以留出一块较干的地面。'),opt('wet-none','这次不补',{quiet:1},s.humidity>80?'湿度已经偏高。这次没有再增加水，盒壁上的水珠慢慢变小。':'你没有补水。湿区还在，但边缘继续向里缩。')];
   }else if(type==='route'){
     scene.target=(s.humidity<p.wet-5?'湿苔':s.cover>65?'木片':'叶缘');scene.text='一只停在岔口。先猜它会靠近哪里，再看下一段记录。';
     scene.options=['湿苔','木片','叶缘'].map((label,i)=>opt('route'+i,label,{maps:1,accuracy:label===scene.target?1:0},`它最终靠近${scene.target}。${label===scene.target?'这一次与你的猜测相同。':'与你留下的箭头不同。'}地面的差别还在那里。`));
   }else if(type==='shelter'){
     scene.text='一片枯叶有两个放置位置：贴地，或在石粒上留一条缝。选好后看它们怎样经过。';
     scene.options=[opt('gap','留一条窄缝',{cover:8,care:1,interventions:1},'叶片被石粒稍稍撑起。一只从下面穿过，另一只停在入口。'),opt('flat','平放叶片',{cover:5,interventions:1},'叶片贴着土。一只沿外缘绕过去，没有进入下面。'),opt('old','保留原处',{quiet:1},'叶片没动。它们继续沿着原来的边缘经过。')];
   }else if(type==='pause'){
     scene.text='木片边缘露出触角。想看清身体，需要再等一会儿。';
     scene.options=[opt('patient','等它出来',{quiet:2,accuracy:1},'你等了一小会儿。触角先伸出，身体随后越过阴影的边界。'),opt('lift','轻抬木片',{interventions:2,light:8},'木片被抬起。你看见了更多身体，同时也看见它们迅速分散。'),opt('leave','不再追看',{quiet:1},'你把这次记录停在触角那里。身体不必为了完成句子而出现。')];
   }else if(type==='map'){
     scene.text=s.day>=5?'去哪里？':'把观察点放在哪里？';
     scene.options=[opt('shadow','阴影',{quiet:1,maps:1},'木片下面没有那么亮。一个轮廓贴着暗处停下来。'),opt('edge','边缘',{maps:1,light:4},'边缘有风，也有光。它沿着盒壁走过一段，又转回去了。'),opt('stay','留在这里',{quiet:1},'你留在这里。触角碰到了脚下的土粒。')];
   }else{
     scene.text='甲片、碎叶和旧壳都在同一片土上。给眼前的浅色薄片选一个暂时的记录方式。';
     scene.options=[opt('molt','记录为疑似旧壳',{labels:1,accuracy:1},'你没有移动它。稍后，一个个体在薄片旁停留，边缘出现了更小的缺口。'),opt('remove','当作残渣取走',{interventions:1},'薄片被取走。你失去了继续观察它的机会，盒子空出很小一块。'),opt('unknown','暂不命名',{quiet:1,labels:1},'你画下轮廓，把名称空着。下一次仍能找到这张图。')];
   }
 }
 const encounter=encounterFor(s);scene.encounter=encounter.id;scene.time=timeFor(s.seed,s.day,s.period);
 scene.activity=encounterText(encounter,s.seed);scene.text=scene.activity+' '+scene.text;
 for(const option of scene.options)option.text+=' '+encounter[responseMode(option.id)];
 return scene;
}
export function ensureScene(s){if(!s.scene)s.scene=sceneFor(s);return s.scene}
export function choose(s,id){
 if(s.stage!=='choice')return false;const scene=ensureScene(s),o=scene.options.find(o=>o.id===id);if(!o)return false;
 const before=s.humidity;for(const [k,v] of Object.entries(o.delta))s[k]+=v;
 s.humidity=clamp(s.humidity,35,96);s.cover=clamp(s.cover,20,94);s.light=clamp(s.light,8,85);s.food=clamp(s.food,0,6);s.vent=clamp(s.vent,20,95);
 if(Math.abs(s.humidity-speciesById(s.species).wet)<Math.abs(before-speciesById(s.species).wet))s.care++;
 s.feedback=o.text;s.stage='feedback';s.records.push({day:s.day,period:s.period,kind:scene.kind,choice:id,label:o.label,text:o.text,time:scene.time||timeFor(s.seed,s.day,s.period),encounter:scene.encounter||null});return true;
}
export function endingFor(s){
 let id='ordinary';if(s.interventions>=11)id='visitor';else if(s.quiet>=17)id='margin';else if(s.labels>=7)id='names';else if(s.maps>=6)id='map';else if(s.care>=5)id='instrument';return ENDINGS.find(e=>e.id===id);
}
export function advance(s){
 if(s.stage!=='feedback')return false;
 if(s.day===7&&s.period===2){s.stage='ended';s.ending=endingFor(s).id;return true}
 s.period++;if(s.period===3){s.period=0;s.day++}
 const delta=(s.vent>70?4:2)+(s.period===1?1:0);s.humidity=clamp(s.humidity-delta,35,96);
 s.temp=Math.round((22+(s.period===1?2:s.period===2?-.5:0)+(hash(s.seed,s.day)%5)*.3)*10)/10;
 s.light=clamp(s.light+(s.period===1?10:s.period===2?-22:12),8,85);
 s.food=clamp(s.food-(s.period===0?1:0),0,6);s.stage='choice';s.feedback='';s.scene=null;ensureScene(s);return true;
}
export function migrateLegacy(old,seed=1){const s=createRun('dairy',seed);if(old&&Number.isInteger(old.day)&&old.day>=1&&old.day<=7){s.day=old.day;s.period=0;s.humidity=clamp(68+(Number(old.moisture)||0)*2,35,90);s.cover=clamp(45+(Number(old.leaves)||0)*5,20,90)}return s}
