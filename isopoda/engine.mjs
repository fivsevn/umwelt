import {environmentFor,changeEnvironment,ageEnvironment,environmentTarget,habitatFit,syncSceneTrace,releaseDueShells,takeShell} from './environment.mjs?v=forest-10';
import {encounterFor,encounterById,encounterText} from './encounters.mjs?v=molt-sequence-1';
import {SPECIES,speciesById} from './species-registry.mjs?v=species-39b';
import {EVENING,AMBIENT,CARE,MINI_TYPES,ENDINGS} from './content.mjs?v=interaction-story-2';
export const VERSION=4;
export const PERIODS=['晨间','午后','夜间'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash(seed,n){let x=(seed+Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return (x^(x>>>16))>>>0}
export function cohortFor(species,seed){return Array.from({length:7},(_,i)=>({id:String.fromCharCode(65+i),species:speciesById(species).id,seed:hash(seed,i+1701),stage:['S','M','L','M','L','S','M'][i]}))}
export function runSpecies(s){return [...new Set(s.cohort?.map(c=>c.species)||[s.species])].filter(id=>SPECIES.some(p=>p.id===id))}
export function createRun(species='dairy',seed=Date.now()>>>0){
 const now=new Date(),startedOn=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const p=speciesById(species);return {startedOn,version:VERSION,narrativeVersion:1,seed:seed>>>0,cohort:cohortFor(p.id,seed),day:1,period:0,stage:'choice',humidity:p.wet,temp:23,vent:55,light:54,cover:p.cover,food:1,interventions:0,quiet:0,accuracy:0,maps:0,labels:0,care:0,directTouches:0,directGrabs:0,directMoves:0,groundTaps:0,barkLifts:0,shellCollects:0,collectedShells:[],directRecords:[],interactionDiscoveries:{tap:false,grab:false,lift:false,collect:false},interactionIntent:null,observerContradictions:[],records:[],ending:null,feedback:'',scene:null};
}
function interactionState(s){
 const hadDiscoveries=!!(s.interactionDiscoveries&&typeof s.interactionDiscoveries==='object');
 s.interactionDiscoveries=hadDiscoveries?s.interactionDiscoveries:{};
 const past=Array.isArray(s.directRecords)?s.directRecords:[];
 for(const key of ['tap','grab','lift','collect']){
  const seen=key==='grab'?past.some(r=>r.type==='grab'||r.type==='place'):past.some(r=>r.type===key);
  s.interactionDiscoveries[key]=!!s.interactionDiscoveries[key]||(!hadDiscoveries&&seen);
 }
 if(!Array.isArray(s.observerContradictions))s.observerContradictions=[];
 return s.interactionDiscoveries;
}
function contradictionFor(s,type){
 if(s.stage!=='feedback')return '';
 const r=Array.isArray(s.records)?s.records.at(-1):null;
 if(!r||r.day!==s.day||r.period!==s.period)return '';
 if(r.choice==='hands-off'&&['tap','grab','place'].includes(type))return '你先选择不碰它，后来手还是进入了盒子。意图被写下，行为也被写下；它们不必替彼此作证。';
 if(r.choice==='touch-one'&&type==='grab')return '你原本只打算碰一下，手却停留得更久。尺度改变时，“一下”也不是一个稳定的单位。';
 if(r.choice==='leave'&&type==='lift')return '你先决定不再追看，随后又抬起了木片。记录中的克制和手的动作没有发生在同一个层面。';
 if(r.choice==='patient'&&type==='lift')return '你选择等待它自己出来，后来又改变了等待的条件。等待仍然发生过，只是不再是原来的等待。';
 if(['molt','unknown'].includes(r.choice)&&type==='collect')return '你先让旧壳留在原处，后来又把它收走。所谓“原处”，只维持到下一次动作。';
 return '';
}
export function recordDirectInteraction(s,event={}){
 const type=['tap','grab','place','ground','lift','collect'].includes(event.type)?event.type:null;if(!type)return null;
 const discoveries=interactionState(s);
 s.directTouches=Number.isFinite(s.directTouches)?s.directTouches:0;s.directGrabs=Number.isFinite(s.directGrabs)?s.directGrabs:0;s.directMoves=Number.isFinite(s.directMoves)?s.directMoves:0;
 s.groundTaps=Number.isFinite(s.groundTaps)?s.groundTaps:0;s.barkLifts=Number.isFinite(s.barkLifts)?s.barkLifts:0;s.shellCollects=Number.isFinite(s.shellCollects)?s.shellCollects:0;
 if(!Array.isArray(s.collectedShells))s.collectedShells=[];if(!Array.isArray(s.directRecords))s.directRecords=[];
 let shell=null;
 if(type==='tap')s.directTouches++;else if(type==='grab')s.directGrabs++;else if(type==='place')s.directMoves++;else if(type==='ground')s.groundTaps++;else if(type==='lift')s.barkLifts++;else if(type==='collect'){
  shell=takeShell(s,event.shell);if(!shell)return null;s.shellCollects++;s.collectedShells.push({...shell,collectedDay:s.day,collectedPeriod:s.period});s.collectedShells=s.collectedShells.slice(-12);
 }
 const discoveredType=type==='place'?'grab':['tap','grab','lift','collect'].includes(type)?type:null;
 if(discoveredType)discoveries[discoveredType]=true;
 s.interventions=(Number.isFinite(s.interventions)?s.interventions:0)+1;
 const env=environmentFor(s),strength=type==='tap'?1:type==='ground'?2:type==='collect'?2:type==='grab'?4:5;env.disturbance=Math.max(env.disturbance||0,strength);
 const point=event.point&&Number.isFinite(event.point.x)&&Number.isFinite(event.point.y)?{x:Math.round(event.point.x),y:Math.round(event.point.y)}:null;
 if(type==='place'&&point){env.scuffs??=[];env.scuffs.push({...point,turn:s.records.length,direct:true});env.scuffs=env.scuffs.slice(-18)}
 const specimen=/^[A-G]$/.test(event.specimen||'')?event.specimen:null,record={day:s.day,period:s.period,time:timeFor(s.seed,s.day,s.period),type,specimen,point,shell:shell?{id:shell.id,phase:shell.phase,specimen:shell.specimen}:null};
 const contradiction=contradictionFor(s,type);
 if(contradiction){
  const choice=s.records.at(-1)?.choice||null,exists=s.observerContradictions.some(x=>x.day===s.day&&x.period===s.period&&x.choice===choice);
  if(!exists){const item={day:s.day,period:s.period,type,choice,text:contradiction};s.observerContradictions.push(item);s.observerContradictions=s.observerContradictions.slice(-12)}
  record.contradiction=contradiction;s.feedback=contradiction;
  const narrative=s.records.at(-1);if(narrative&&narrative.day===s.day&&narrative.period===s.period)narrative.text=contradiction;
 }
 const intent=s.interactionIntent;
 if(intent&&intent.day===s.day&&intent.period===s.period&&intent.type===discoveredType){
  s.feedback=intent.done||s.feedback;
  const narrative=s.records.at(-1);if(narrative&&narrative.day===s.day&&narrative.period===s.period){narrative.text=s.feedback;narrative.interactionCompleted=intent.type}
  record.completedIntent=intent.type;s.interactionIntent=null;
 }
 s.directRecords.push(record);s.directRecords=s.directRecords.slice(-50);return record;
}
function directRecordForDay(s,day=s.day){
 const list=Array.isArray(s.directRecords)?s.directRecords.filter(r=>r.day===day):[];
 return [...list].reverse().find(r=>r.type==='place')||[...list].reverse().find(r=>r.type==='grab')||list.at(-1)||null;
}
export function directMemoryForDay(s,day=s.day){
 const contradiction=Array.isArray(s.observerContradictions)?[...s.observerContradictions].reverse().find(x=>x.day===day):null;if(contradiction)return contradiction.text;
 const r=directRecordForDay(s,day);if(!r)return '';const who=r.specimen?`个体 ${r.specimen}`:'一个个体';
 if(r.type==='place')return `今天你把${who}放回了另一个位置。它后来的路线从那里继续。`;
 if(r.type==='grab')return `今天${who}曾经离开土面。盒子里的移动因此停顿了一会儿。`;
 if(r.type==='collect')return '今天你收起了一片旧壳。原来的位置只剩下土和碎叶。';
 if(r.type==='lift')return '今天你抬起过木片。阴影短暂打开，随后又落回原处。';
 if(r.type==='ground')return '今天你敲到过土面。附近的触角和路线因此停顿了一下。';
 return `今天你碰过${who}。它收紧身体，后来才重新展开。`;
}
export function endingMemoryFor(s){
 const contradictions=Array.isArray(s.observerContradictions)?s.observerContradictions:[];if(contradictions.length)return '这七天里，至少有一次你写下的决定和随后发生的动作并不相同。田野笔记把两者都保留下来，而不是替其中一个作证。';
 const list=Array.isArray(s.directRecords)?s.directRecords:[];if(!list.length)return '';
 const r=[...list].reverse().find(x=>x.type==='place')||[...list].reverse().find(x=>x.type==='grab')||list.at(-1),who=r.specimen?`个体 ${r.specimen}`:'一个个体';
 if(r.type==='place')return `这七天里，${who}曾被你拿起，又被放回另一个位置。后面的路线从那里继续。`;
 if(r.type==='grab')return `这七天里，${who}曾短暂离开土面。记录没有把那次停顿从环境里删掉。`;
 if(r.type==='collect')return '这七天里，你收起过一片旧壳。它没有继续留在盒子里变薄。';
 if(r.type==='lift')return '这七天里，你抬起过木片。看见的东西与那次打开阴影的动作已经不能完全分开。';
 if(r.type==='ground')return '这七天里，你曾让土面发生过短促的震动。几条路线从那里重新开始。';
 return `这七天里，你曾碰过${who}。它收紧过身体，后来又重新展开。`;
}
export function validRun(s){return !!(s&&s.version===VERSION&&Array.isArray(s.cohort)&&s.cohort.length===7&&s.cohort.every((c,i)=>c.id===String.fromCharCode(65+i)&&SPECIES.some(p=>p.id===c.species)&&Number.isInteger(c.seed)&&['S','M','L'].includes(c.stage))&&Number.isInteger(s.day)&&s.day>=1&&s.day<=7&&Number.isInteger(s.period)&&s.period>=0&&s.period<=2&&['choice','feedback','ended'].includes(s.stage)&&Array.isArray(s.records)&&['seed','humidity','temp','vent','light','cover','food','interventions','quiet','accuracy','maps','labels','care'].every(k=>Number.isFinite(s[k])))}
export function timeFor(seed,day,period){
 const starts=[6*60,13*60,20*60],spans=[5*60,5*60,4*60];
 const minute=starts[period]+((hash(seed,period+71)+(day-1)*47)%spans[period]);
 return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
}
function pick(s,a,salt=0){return a[hash(s.seed,(s.day-1)*3+s.period+salt)%a.length]}
function ambientLine(s){
 const matched=AMBIENT.filter(a=>a.id!=='base'&&a.when(s)),direct=matched.filter(a=>a.id==='direct');
 const pool=direct.length?direct:matched.length?matched:AMBIENT.filter(a=>a.id==='base'),entry=pool[hash(s.seed,s.day*37+s.period*11+503)%pool.length];
 const lines=Array.isArray(entry?.text)?entry.text:[entry?.text].filter(Boolean);return lines.length?lines[hash(s.seed,s.day*41+s.period*13+509)%lines.length]:'';
}
function opt(id,label,delta={},text='',interaction=null){return {id,label,delta,text,...(interaction?{interaction}:{})}}
function observationTurn(s){return (s.day-1)*3+s.period}
function rawEncounterAt(s,turn){
 return encounterFor({seed:s.seed,narrativeVersion:s.narrativeVersion,day:Math.floor(turn/3)+1,period:turn%3});
}
function ambientMoltTurns(s){
 const narrative=[];for(let turn=0;turn<20;turn++)if(rawEncounterAt(s,turn)?.motion==='molt')narrative.push(turn);
 const need=Math.max(0,2-Math.min(2,narrative.length));if(!need)return [];
 const used=new Set(narrative),ranges=need===2?[[4,8],[12,16]]:[[8,15]],result=[];
 for(let i=0;i<ranges.length;i++){
  const [lo,hi]=ranges[i],span=hi-lo+1;let candidate=lo+hash(s.seed,2201+i)%span;
  for(let n=0;n<span;n++){if(!used.has(candidate)&&!result.includes(candidate))break;candidate=lo+(candidate-lo+1)%span}
  result.push(candidate);
 }
 return result.sort((a,b)=>a-b);
}
function ambientMoltFor(s){
 const turns=ambientMoltTurns(s),index=turns.indexOf(observationTurn(s));if(index<0)return null;
 const specimen=s.cohort[hash(s.seed,2309+index)%s.cohort.length],phase=index%2?'anterior':'posterior';
 const x=92+hash(s.seed,2401+index)%205,y=92+hash(s.seed,2411+index)%240,a=(hash(s.seed,2423+index)%21-10)*.06;
 return {specimen:specimen.id,phase,x,y,a,source:'ambient'};
}
export function sceneFor(s){
 const focal=s.cohort[hash(s.seed,s.day)%7],scene={id:`${s.day}.${s.period}`,title:PERIODS[s.period],kind:'text',text:'',options:[]};
 if(s.period===0){
   scene.text='';
   let keys=s.humidity>85?['air','leaf','wait']:s.food>3?['clean','air','wait']:s.humidity<58?['mist','leaf','wait']:s.day%3===0?['food','shade','wait']:s.day%2===0?['air','food','wait']:['mist','leaf','wait'];
   scene.options=keys.map(id=>opt(id,CARE[id].label,CARE[id].delta,pick(s,CARE[id].text,3)));
 }else if(s.period===2){
   scene.text=pick(s,EVENING[s.day-1]);const direct=directMemoryForDay(s);if(direct)scene.text+=' '+direct;
   scene.options=[opt('describe','只记看到的',{labels:1},pick(s,['你写下了位置、颜色和停留。句子没有替它们补上理由。','你记下“进入叶片下面”。今天到这里为止。','纸上多了几行。盒子里的土没有因此变平。','你把三个动词删成了两个名词。今天的记录因此更短。','你只写下出现和消失的位置，没有替中间补一条路线。'],8)),opt('infer','写下一个猜测',{maps:1},pick(s,['你写下“可能”，后面跟着一个很小的问号。','你留下一个假设。明天的路线也许不会配合。','这一条先放在页边，暂不抄进结论。','你在箭头旁写下“如果”。这个词暂时没有被验证。','猜测被圈在页边，没有和观察记录用同一种笔压下去。'],7)),opt('blank','留下一行空白',{quiet:1},pick(s,['空白留在原处。它不是一次漏记。','笔停下来时，最小的个体还在走。','你把本子合上了一会儿，叶片下的时间没有暂停。','这一行没有内容，但保留了它原本应该出现的位置。','你没有补完最后一句。盒子里的移动也没有等待句号。'],4))];
 }else{
   const otherTypes=MINI_TYPES.filter(type=>type!=='touch'),type=s.day===1?'touch':otherTypes[(s.day-2+hash(s.seed,50)%otherTypes.length)%otherTypes.length];scene.kind=type;
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
     scene.options=[opt('patient','等它出来',{quiet:2,accuracy:1},'你等了一小会儿。触角先伸出，身体随后越过阴影的边界。'),opt('lift-bark','轻抬木片',{},'你把手移到木片边缘。阴影下面的轮廓还没有离开。',{type:'lift',prompt:'木片就在画面中央。按住边缘。',done:'木片被抬起。你看见了更多身体，同时也看见它们迅速分散。'}),opt('leave','不再追看',{quiet:1},'你把这次记录停在触角那里。身体不必为了完成句子而出现。')];
   }else if(type==='touch'){
     scene.specimen=focal.id;scene.text=`个体 ${focal.id} 停在叶缘。触角仍在缓慢移动。你的手已经离它很近。`;
     scene.options=[opt('touch-one','碰一下',{},'你把指尖靠近它，距离只剩下一点。',{type:'tap',prompt:'它就在画面里。碰一下。',done:'它立刻收紧身体。甲片一节节合拢起来。'}),opt('take-near','拿近一点看',{},'你的手停在它上方。这个距离已经不再只是观看。',{type:'grab',prompt:'手指停在它上方。按住一会儿。',done:'它短暂离开土面。你看清了更多细节，也同时改变了它所在的位置。'}),opt('hands-off','不碰它',{quiet:1},'你把手留在盒壁外。它继续沿叶缘移动。')];
   }else if(type==='map'){
     scene.text=s.day>=5?'去哪里？':'把观察点放在哪里？';
     scene.options=[opt('shadow','阴影',{quiet:1,maps:1},'木片下面没有那么亮。一个轮廓贴着暗处停下来。'),opt('edge','边缘',{maps:1,light:4},'边缘有风，也有光。它沿着盒壁走过一段，又转回去了。'),opt('stay','留在这里',{quiet:1},'你留在这里。触角碰到了脚下的土粒。')];
   }else{
     const traceEnv=environmentFor(s),hasShell=(traceEnv.shells||[]).length>0;
     if(hasShell){const shell=traceEnv.shells[hash(s.seed,observationTurn(s)+2611)%traceEnv.shells.length];scene.encounterPlace=[shell.x,shell.y];scene.specimen=shell.specimen||scene.specimen}
     scene.text=hasShell?'甲片、碎叶和旧壳都在同一片土上。给眼前的浅色薄片选一个暂时的记录方式。':'土面上有几片浅色碎屑。它们没有因为暂时叫不出名字而离开原处。';
     scene.options=hasShell
      ?[opt('molt','记录为疑似旧壳',{labels:1,accuracy:1},'你没有移动它。稍后，一个个体在薄片旁停留，边缘出现了更小的缺口。'),opt('collect-shell','收起来',{labels:1},'你把手移到那层薄壳上方。它仍留在土面上。',{type:'collect',prompt:'那片旧壳还在土面上。按住它。',done:'旧壳离开了土面。它从环境的一部分，变成了你带走的一件东西。'}),opt('unknown','暂不命名',{quiet:1,labels:1},'你画下轮廓，把名称空着。下一次仍能找到这张图。')]
      :[opt('molt','记下轮廓',{labels:1},'你只记下颜色和位置，没有替碎屑补上来源。'),opt('unknown','暂不命名',{quiet:1,labels:1},'你画下轮廓，把名称空着。下一次仍能找到这张图。'),opt('leave-trace','留在原处',{quiet:1},'碎屑没有移动。下一次观察仍可能从这里开始。')];
   }
 }
 let encounter=encounterFor(s);
 if(observationTurn(s)===20&&encounter.motion==='molt')encounter=encounterById(hash(s.seed,2591)%2?'rest':'clean')||encounter;
 if(encounter.id==='molt-back'||encounter.id==='molt-front'){
  const moltSeen=s.records.filter(record=>record.encounter==='molt-back'||record.encounter==='molt-front').length;
  encounter=encounterById(moltSeen===0?'molt-back':'molt-front')||encounter;
 }
 const env=environmentFor(s);
 if(encounter.id==='old-shell'&&!env.shells.length)encounter=encounterById(hash(s.seed,observationTurn(s)+2511)%2?'rest':'clean')||encounter;
 scene.encounter=encounter.id;
 if(encounter.motion==='molt'){
  const moltSpecimen=s.cohort[hash(s.seed,1907)%s.cohort.length],[mx,my]=encounter.place||[190,220];
  scene.specimen=moltSpecimen.id;
  scene.moltVisual={specimen:moltSpecimen.id,phase:encounter.molt||'posterior',x:mx,y:my,a:(hash(s.seed,s.day*53+s.period*17)%13-6)*.08,source:'narrative'};
 }else{
  const ambientMolt=ambientMoltFor(s);if(ambientMolt)scene.moltVisual=ambientMolt;
 }
 if(encounter.id==='old-shell'&&env.shells.length){
  const shell=env.shells[hash(s.seed,observationTurn(s)+2521)%env.shells.length];
  scene.specimen=shell.specimen||scene.specimen;scene.encounterPlace=[shell.x,shell.y];
 }
 if(scene.moltVisual){
  const m=scene.moltVisual;scene.shellTrace={id:`molt:${scene.id}:${m.source}:${m.specimen}`,source:m.source==='narrative'?encounter.id:'ambient-molt',specimen:m.specimen,phase:m.phase,x:m.x,y:m.y,a:m.a};
 }
 scene.time=timeFor(s.seed,s.day,s.period);
 scene.activity=encounterText(encounter,s.seed);if(s.period===0){const ambient=ambientLine(s);scene.text=ambient?scene.activity+' '+ambient:scene.activity}else scene.text=s.period===2?scene.text:scene.activity+' '+scene.text;
 // Keep each response complete; the habitat carries the additional reaction.
 return scene;
}
export function ensureScene(s){
 releaseDueShells(s);environmentFor(s);
 if(s.stage==='choice'&&(s.scene?.kind==='count'||!Array.isArray(s.scene?.options)||s.scene.options.length===0))s.scene=null;
 if(!s.scene)s.scene=sceneFor(s);
 syncSceneTrace(s,s.scene);
 return s.scene;
}
export function choose(s,id){
 if(s.stage!=='choice')return false;const scene=ensureScene(s),o=scene.options.find(o=>o.id===id);if(!o)return false;
 const before=s.cohort.map(c=>habitatFit(s,c));changeEnvironment(s,id);for(const [k,v] of Object.entries(o.delta))s[k]+=v;
 s.humidity=clamp(s.humidity,35,96);s.cover=clamp(s.cover,20,94);s.light=clamp(s.light,8,85);s.food=clamp(s.food,0,6);s.vent=clamp(s.vent,20,95);
 const after=s.cohort.map(c=>habitatFit(s,c));if(after.some((v,i)=>v>before[i]+.01)&&after.every((v,i)=>v>=before[i]-.01))s.care++;
 const discoveries=interactionState(s);s.interactionIntent=o.interaction?{...o.interaction,day:s.day,period:s.period,choice:id,hint:discoveries[o.interaction.type]?'':o.interaction.prompt}:null;
 s.feedback=o.text;s.stage='feedback';s.records.push({day:s.day,period:s.period,kind:scene.kind,choice:id,label:o.label,text:o.text,time:scene.time||timeFor(s.seed,s.day,s.period),encounter:scene.encounter||null,interaction:o.interaction?.type||null});return true;
}
function endingFromPool(s,ids,salt){
 const direct=(s.directGrabs||0)+(s.directMoves||0),signature=s.interventions*11+s.quiet*17+s.maps*19+s.labels*23+s.care*29+s.accuracy*31+direct*37;
 const id=ids[hash(s.seed,salt+signature)%ids.length];return ENDINGS.find(e=>e.id===id);
}
export function endingFor(s){
 const direct=(s.directGrabs||0)+(s.directMoves||0);
 if(direct>=2||s.interventions>=12)return endingFromPool(s,['visitor','hand'],701);
 if(s.quiet>=12&&s.quiet>=s.maps&&s.quiet>=s.labels)return endingFromPool(s,['margin','stillness','shadow'],709);
 if(s.labels>=6&&s.labels>s.maps)return endingFromPool(s,['names','unnamed','grammar'],719);
 if(s.maps>=5&&s.maps>=s.labels)return endingFromPool(s,['map','arrows','scale'],727);
 if(s.care>=4)return endingFromPool(s,['instrument','gradient'],733);
 return endingFromPool(s,['witness','ordinary'],739);
}
export function advance(s){
 if(s.stage!=='feedback')return false;
 if(s.day===7&&s.period===2){s.stage='ended';s.ending=endingFor(s).id;return true}
 s.period++;if(s.period===3){s.period=0;s.day++}
 const delta=(s.vent>70?4:2)+(s.period===1?1:0);s.humidity=clamp(s.humidity-delta,35,96);
 s.temp=Math.round((22+(s.period===1?2:s.period===2?-.5:0)+(hash(s.seed,s.day)%5)*.3)*10)/10;
 s.light=clamp(s.light+(s.period===1?10:s.period===2?-22:12),8,85);
 ageEnvironment(s);s.food=clamp(s.food-(s.period===0?1:0),0,6);s.stage='choice';s.feedback='';s.interactionIntent=null;s.scene=null;ensureScene(s);return true;
}
export function migrateLegacy(old,seed=1){const s=createRun('dairy',seed);if(old&&Number.isInteger(old.day)&&old.day>=1&&old.day<=7){s.day=old.day;s.period=0;s.humidity=clamp(68+(Number(old.moisture)||0)*2,35,90);s.cover=clamp(45+(Number(old.leaves)||0)*5,20,90)}return s}

export function migrateV3(old){if(!old||old.version!==3||!SPECIES.some(p=>p.id===old.species))return null;const s={...old,version:VERSION,cohort:cohortFor(old.species,old.seed)};delete s.species;if(s.stage==='choice')s.scene=null;return validRun(s)?s:null}
