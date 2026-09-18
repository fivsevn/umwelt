import {environmentFor,changeEnvironment,ageEnvironment,environmentTarget,habitatFit} from './environment.mjs?v=cohort-4';
import {encounterFor,encounterText} from './encounters.mjs?v=cohort-4';
import {SPECIES,speciesById} from './species.mjs?v=cohort-4';
import {EVENING,CARE,MINI_TYPES,ENDINGS} from './content.mjs?v=cohort-4';
export const VERSION=4;
export const PERIODS=['晨间','午后','夜间'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash(seed,n){let x=(seed+Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return (x^(x>>>16))>>>0}
export function cohortFor(species,seed){return Array.from({length:7},(_,i)=>({id:String.fromCharCode(65+i),species:speciesById(species).id,seed:hash(seed,i+1701),stage:['S','M','L','M','L','S','M'][i]}))}
export function runSpecies(s){return [...new Set(s.cohort?.map(c=>c.species)||[s.species])].filter(id=>SPECIES.some(p=>p.id===id))}
export function createRun(species='dairy',seed=Date.now()>>>0){
 const now=new Date(),startedOn=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const p=speciesById(species);return {startedOn,version:VERSION,seed:seed>>>0,cohort:cohortFor(p.id,seed),day:1,period:0,stage:'choice',humidity:p.wet,temp:23,vent:55,light:54,cover:p.cover,food:1,interventions:0,quiet:0,accuracy:0,maps:0,labels:0,care:0,directTouches:0,directGrabs:0,directMoves:0,directRecords:[],records:[],ending:null,feedback:'',scene:null};
}
export function recordDirectInteraction(s,event={}){
 const type=['tap','grab','place'].includes(event.type)?event.type:null;if(!type)return null;
 s.directTouches=Number.isFinite(s.directTouches)?s.directTouches:0;s.directGrabs=Number.isFinite(s.directGrabs)?s.directGrabs:0;s.directMoves=Number.isFinite(s.directMoves)?s.directMoves:0;
 if(!Array.isArray(s.directRecords))s.directRecords=[];
 if(type==='tap')s.directTouches++;else if(type==='grab')s.directGrabs++;else s.directMoves++;
 s.interventions=(Number.isFinite(s.interventions)?s.interventions:0)+1;
 const env=environmentFor(s),strength=type==='tap'?1:type==='grab'?4:5;env.disturbance=Math.max(env.disturbance||0,strength);
 const point=event.point&&Number.isFinite(event.point.x)&&Number.isFinite(event.point.y)?{x:Math.round(event.point.x),y:Math.round(event.point.y)}:null;
 if(type==='place'&&point){env.scuffs??=[];env.scuffs.push({...point,turn:s.records.length,direct:true});env.scuffs=env.scuffs.slice(-18)}
 const specimen=/^[A-G]$/.test(event.specimen||'')?event.specimen:null,record={day:s.day,period:s.period,time:timeFor(s.seed,s.day,s.period),type,specimen,point};
 s.directRecords.push(record);s.directRecords=s.directRecords.slice(-40);return record;
}
function directRecordForDay(s,day=s.day){
 const list=Array.isArray(s.directRecords)?s.directRecords.filter(r=>r.day===day):[];
 return [...list].reverse().find(r=>r.type==='place')||[...list].reverse().find(r=>r.type==='grab')||list.at(-1)||null;
}
export function directMemoryForDay(s,day=s.day){
 const r=directRecordForDay(s,day);if(!r)return '';const who=r.specimen?`个体 ${r.specimen}`:'一个个体';
 if(r.type==='place')return `今天你把${who}放回了另一个位置。它后来的路线从那里继续。`;
 if(r.type==='grab')return `今天${who}曾经离开土面。盒子里的移动因此停顿了一会儿。`;
 return `今天你碰过${who}。它收紧身体，后来才重新展开。`;
}
export function endingMemoryFor(s){
 const list=Array.isArray(s.directRecords)?s.directRecords:[];if(!list.length)return '';
 const r=[...list].reverse().find(x=>x.type==='place')||[...list].reverse().find(x=>x.type==='grab')||list.at(-1),who=r.specimen?`个体 ${r.specimen}`:'一个个体';
 if(r.type==='place')return `这七天里，${who}曾被你拿起，又被放回另一个位置。后面的路线从那里继续。`;
 if(r.type==='grab')return `这七天里，${who}曾短暂离开土面。记录没有把那次停顿从环境里删掉。`;
 return `这七天里，你曾碰过${who}。它收紧过身体，后来又重新展开。`;
}
export function validRun(s){return !!(s&&s.version===VERSION&&Array.isArray(s.cohort)&&s.cohort.length===7&&s.cohort.every((c,i)=>c.id===String.fromCharCode(65+i)&&SPECIES.some(p=>p.id===c.species)&&Number.isInteger(c.seed)&&['S','M','L'].includes(c.stage))&&Number.isInteger(s.day)&&s.day>=1&&s.day<=7&&Number.isInteger(s.period)&&s.period>=0&&s.period<=2&&['choice','feedback','ended'].includes(s.stage)&&Array.isArray(s.records)&&['seed','humidity','temp','vent','light','cover','food','interventions','quiet','accuracy','maps','labels','care'].every(k=>Number.isFinite(s[k])))}
export function timeFor(seed,day,period){
 const starts=[6*60,13*60,20*60],spans=[5*60,5*60,4*60];
 const minute=starts[period]+((hash(seed,period+71)+(day-1)*47)%spans[period]);
 return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
}
function pick(s,a,salt=0){return a[hash(s.seed,(s.day-1)*3+s.period+salt)%a.length]}
function opt(id,label,delta={},text=''){return {id,label,delta,text}}
export function sceneFor(s){
 const focal=s.cohort[hash(s.seed,s.day)%7],scene={id:`${s.day}.${s.period}`,title:PERIODS[s.period],kind:'text',text:'',options:[]};
 if(s.period===0){
   scene.text='';
   let keys=s.humidity>85?['air','leaf','wait']:s.food>3?['clean','air','wait']:s.humidity<58?['mist','leaf','wait']:s.day%3===0?['food','shade','wait']:s.day%2===0?['air','food','wait']:['mist','leaf','wait'];
   scene.options=keys.map(id=>opt(id,CARE[id].label,CARE[id].delta,pick(s,CARE[id].text,3)));
 }else if(s.period===2){
   scene.text=pick(s,EVENING[s.day-1]);const direct=directMemoryForDay(s);if(direct)scene.text+=' '+direct;
   scene.options=[opt('describe','只记看到的',{labels:1},pick(s,['你写下了位置、颜色和停留。句子没有替它们补上理由。','你记下“进入叶片下面”。今天到这里为止。','纸上多了几行。盒子里的土没有因此变平。'],8)),opt('infer','写下一个猜测',{maps:1},pick(s,['你写下“可能”，后面跟着一个很小的问号。','你留下一个假设。明天的路线也许不会配合。','这一条先放在页边，暂不抄进结论。'],7)),opt('blank','留下一行空白',{quiet:1},pick(s,['空白留在原处。它不是一次漏记。','笔停下来时，最小的个体还在走。','你把本子合上了一会儿，叶片下的时间没有暂停。'],4))];
 }else{
   const type=MINI_TYPES[(s.day-1+hash(s.seed,50)%MINI_TYPES.length)%MINI_TYPES.length];scene.kind=type;
   if(type==='water'){
     scene.text='左侧的土仍然深暗，右侧已经松散。只给一个地方补水，还是让干湿之间的距离缩短一些？';
     scene.options=[opt('wet-left','湿区少量',{humidity:5,care:1,interventions:1},'少量水留在左侧，右边仍较干。个体可以在两边之间移动。'),opt('wet-all','两边都喷',{humidity:14,interventions:1},'两侧都变暗了，原先的干湿边界缩小。下一次可以留出一块较干的地面。'),opt('wet-none','这次不补',{quiet:1},s.humidity>80?'湿度已经偏高。这次没有再增加水，盒壁上的水珠慢慢变小。':'你没有补水。湿区还在，但边缘继续向里缩。')];
   }else if(type==='route'){
     scene.specimen=focal.id;const target=environmentTarget(s,{...focal,id:s.cohort.indexOf(focal)});scene.target=target?.kind==='wet'?'湿苔':target?.kind==='shelter'?'木片':target?.kind==='food'?'食物':'叶缘';scene.text=`个体 ${focal.id} 停在岔口。先猜它会靠近哪里，再看下一段记录。`;
     scene.options=['湿苔','木片','叶缘','食物'].map((label,i)=>opt('route'+i,label,{maps:1,accuracy:label===scene.target?1:0},`它最终靠近${scene.target}。${label===scene.target?'这一次与你的猜测相同。':'与你留下的箭头不同。'}地面的差别还在那里。`));
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
 scene.activity=encounterText(encounter,s.seed);scene.text=s.period===0?scene.activity:s.period===2?scene.text:scene.activity+' '+scene.text;
 // Keep each response complete; the habitat carries the additional reaction.
 return scene;
}
export function ensureScene(s){environmentFor(s);if(s.stage==='choice'&&s.scene?.kind==='count')s.scene=null;if(!s.scene)s.scene=sceneFor(s);return s.scene}
export function choose(s,id){
 if(s.stage!=='choice')return false;const scene=ensureScene(s),o=scene.options.find(o=>o.id===id);if(!o)return false;
 const before=s.cohort.map(c=>habitatFit(s,c));changeEnvironment(s,id);for(const [k,v] of Object.entries(o.delta))s[k]+=v;
 s.humidity=clamp(s.humidity,35,96);s.cover=clamp(s.cover,20,94);s.light=clamp(s.light,8,85);s.food=clamp(s.food,0,6);s.vent=clamp(s.vent,20,95);
 const after=s.cohort.map(c=>habitatFit(s,c));if(after.some((v,i)=>v>before[i]+.01)&&after.every((v,i)=>v>=before[i]-.01))s.care++;
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
 ageEnvironment(s);s.food=clamp(s.food-(s.period===0?1:0),0,6);s.stage='choice';s.feedback='';s.scene=null;ensureScene(s);return true;
}
export function migrateLegacy(old,seed=1){const s=createRun('dairy',seed);if(old&&Number.isInteger(old.day)&&old.day>=1&&old.day<=7){s.day=old.day;s.period=0;s.humidity=clamp(68+(Number(old.moisture)||0)*2,35,90);s.cover=clamp(45+(Number(old.leaves)||0)*5,20,90)}return s}

export function migrateV3(old){if(!old||old.version!==3||!SPECIES.some(p=>p.id===old.species))return null;const s={...old,version:VERSION,cohort:cohortFor(old.species,old.seed)};delete s.species;if(s.stage==='choice')s.scene=null;return validRun(s)?s:null}
