import {environmentTarget} from './environment.mjs?v=cohort-4';
// GAME: reading cues for visible actions, never emotions or social cognition.
export const PRIORITY={'!!':5,'!':4,'◎':3,'?':2,'…':2,'♡':1,'~':1,'*':1,'o':1,'z':1};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ambientCue=(c,time)=>{
 const bucket=Math.floor((time+(c.offset||0))/5),roll=((bucket+1)*1103515245+(c.id+3)*12345)>>>0;
 if(roll%100>=18)return null;
 if(c.posture==='grooming')return ['…','*'][roll%2];
 if(c.posture==='resting')return ['…','z'][roll%2];
 if(c.posture==='probing')return ['?','…','~'][roll%3];
 if(c.moving)return ['~','o','…'][roll%3];
 return ['…','o','*'][roll%3];
};
export function actionFocus(id,state,encounter){
 const e=state.environment;
 if(['mist','wet-left','wet-all'].includes(id))return e?.wetZones[0]||{x:42,y:215};
 if(id==='food')return e?.foodNodes.at(-1)||{x:316,y:255};
 if(['leaf','gap','flat'].includes(id))return e?.leaves.at(-1)||{x:280,y:338};
 if(id==='lift')return e?.shelter||{x:190,y:215};
 return {x:encounter?.place[0]??190,y:encounter?.place[1]??215};
}
export function cueFor(c,group,encounter,state,reaction,time=0){
 const p=c.posture,focus=c.role<(encounter?.actors||1)&&c.activity!=='ambient'&&c.activity!=='wander',motion=encounter?.motion;
 if(reaction?.selected.includes(c.id)&&reaction.age<.8){
  if(reaction.mode==='disturb')return reaction.id==='lift'?'!!':'!';
  if(['mist','wet-left'].includes(reaction.id)&&p==='probing')return '!';
  if(['food','leaf','gap','flat'].includes(reaction.id)&&c.moving)return '?';
 }
 if(reaction?.mode==='disturb'&&!reaction.selected.includes(c.id))return null;
 if(p==='curled')return '◎';
 if(p==='tucked'&&motion==='defend')return '!';
 if(reaction?.mode==='disturb')return null;
 if(p==='feeding')return focus&&motion==='shell'?'…':'♡';
 if(c.occlusion>.4&&motion!=='emerge')return '~';
 const target=environmentTarget(state,c);
 if(reaction&&['mist','wet-left'].includes(reaction.id)&&target?.kind==='wet'&&Math.hypot(c.x-target.x,c.y-target.y)<18)return '~';
 if(!focus)return reaction?null:ambientCue(c,time);
 const near=Math.hypot(c.x-encounter.place[0],c.y-encounter.place[1])<52;
 if(motion==='contact'){
  if(p==='probing'&&group.some(o=>o!==c&&o.role<encounter.actors&&o.posture==='probing'&&Math.hypot(c.x-o.x,c.y-o.y)<55))return '!';
  if(near)return p==='turning'?'?':'…';
 }
 if(['orbit','disperse','parallel'].includes(motion))return ambientCue(c,time);
 if(motion==='wall'&&p==='probing')return '!';
 if(p==='grooming'||p==='molting'||p==='resting')return '…';
 if(motion==='border')return p==='probing'?'?':near?'…':null;
 if(motion==='yield'&&near)return c.moving?'…':'?';
 if(motion==='emerge'&&c.occlusion>0)return c.occlusion>.6?'?':'…';
 if(motion==='hesitate'&&near)return c.moving?'?':'…';
 if(motion==='defend')return null;
 if(motion==='follow')return encounter.id==='younger'&&c.role===1&&near?'?':ambientCue(c,time);
 if(near&&['feed','shell','gather','under'].includes(motion))return '?';
 if(motion==='climb'&&c.role>0&&near)return '?';
 return ambientCue(c,time);
}
export function createReactions(){
 let bubbles=[],seen=new Map(),lastStart=-Infinity;
 return {
  reset(){bubbles=[];seen.clear();lastStart=-Infinity},
  update(group,{encounter,state,time,reaction}){
   bubbles=bubbles.filter(b=>time<b.until&&group.some(c=>c.id===b.id));
   const candidates=[];
   for(const c of group){
    let cue=cueFor(c,group,encounter,state,reaction,time),old=seen.get(c.id);
    // A wall probe holds after impact; an unfolding animal briefly pauses.
    if(cue==='!'&&encounter?.motion==='wall'&&old?.cue==='!'&&time-old.since>.9)cue='?';
    if(encounter?.motion==='wall'&&old?.cue==='?'&&c.posture==='probing')cue='?';
    if(old?.cue==='◎'&&c.posture==='tucked')cue='…';
    if(old?.cue==='…'&&c.posture==='tucked'&&encounter?.motion==='defend')cue='…';
    if(!old||old.cue!==cue){old={cue,since:time,shown:false};seen.set(c.id,old)}
    if(!cue||old.shown||c.hidden)continue;
    // Even urgent cues get a tiny per-animal delay so a group never pops in on the exact same frame.
    const urgency=PRIORITY[cue]>=3?.04:.16,delay=(cue==='…'&&c.posture==='resting'?1.4:urgency)+c.role*.11+(c.id%3)*.05;
    if(time-old.since>=delay)candidates.push({c,cue,old});
   }
   candidates.sort((a,b)=>PRIORITY[b.cue]-PRIORITY[a.cue]||a.old.since-b.old.since||a.c.role-b.c.role);
   for(const {c,cue,old} of candidates){
    const existing=bubbles.find(b=>b.id===c.id),priority=PRIORITY[cue];
    if(existing&&existing.priority>=priority)continue;
    if(!existing&&time-lastStart<.28)continue;
    if(!existing&&bubbles.length>=3){const weakest=[...bubbles].sort((a,b)=>a.priority-b.priority)[0];if(weakest.priority>=priority)continue;bubbles=bubbles.filter(b=>b!==weakest)}
    bubbles=bubbles.filter(b=>b.id!==c.id);
    bubbles.push({id:c.id,cue,priority,start:time,until:time+(c.posture==='molting'?1.9:cue==='!!'?.8:1.15)});old.shown=true;lastStart=time;
   }
   return bubbles;
  },
  get active(){return bubbles}
 };
}
const GLYPHS={
 '!':['11','11','11','11','00','11'],
 '!!':['11011','11011','11011','11011','00000','11011'],
 '?':['01110','11011','00011','00110','00100','00000','00100'],
 '…':['00000000','00000000','11011011'],
 '♡':['0110110','1001001','1000001','0100010','0010100','0001000'],
 '~':['0000000','0110001','1001010','0000110'],
 '◎':['0011100','0100010','1001101','1010001','1011101','0100010','0011100'],
 '*':['00100','10101','01110','10101','00100'],
 'o':['01110','10001','10001','10001','01110'],
 'z':['1111','0010','0100','1111']
};
export function bubbleLayout(actor,bubble,time,view,reduced=false){
 const w=bubble.cue==='!!'?21:18,h=15,p=2;
 const rise=reduced?0:Math.min(3,Math.floor((time-bubble.start)*4));
 const left=Math.ceil((Math.max(0,view.sx)+2)/p),right=Math.floor((Math.min(384,view.sx+view.sw)-2)/p);
 const top=Math.ceil((Math.max(0,view.sy)+2)/p),bottom=Math.floor((Math.min(430,view.sy+view.sh)-2)/p);
 const ax=Math.round(actor.x/p),ay=Math.round((actor.y+(actor.lift||0))/p);
 if(ax<left||ax>right||ay<top||ay>bottom||right-left<w+2||bottom-top<h+5)return null;
 const below=ay-13-h-rise<top;
 const x=clamp(ax-Math.floor(w/2),left,right-w-1),y=clamp(below?ay+11+rise:ay-13-h-rise,top+3,bottom-h-4);
 return {x,y,w,h,below,tail:clamp(ax-x,4,w-5)};
}
export function drawReactionBubbles(ctx,bubbles,group,time,view,reduced=false){
 for(const b of bubbles){
  const actor=group.find(c=>c.id===b.id);if(!actor)continue;
  const r=bubbleLayout(actor,b,time,view,reduced);if(!r)continue;
  const {x,y,w,h,below,tail}=r;
  const cell=(xx,yy,color)=>{ctx.fillStyle=color;ctx.fillRect((x+xx)*2,(y+yy)*2,2,2)};
  const shape=new Map(),put=(xx,yy,color)=>shape.set(xx+','+yy,[xx,yy,color]);
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
   const inset=yy===0||yy===h-1?3:yy===1||yy===h-2?1:0;
   if(xx<inset||xx>=w-inset)continue;
   const edge=yy===0||yy===h-1||xx===inset||xx===w-inset-1;
   put(xx,yy,edge?'#403f34':yy===h-2?'#c0bca8':'#d7d2bd');
  }
  for(let j=0;j<4;j++)for(let k=0;k<5-j;k++)put(tail+k,below?-j:h-1+j,k===0||k===4-j||j===3?'#403f34':'#d7d2bd');
  for(const [xx,yy] of shape.values())cell(xx+1,yy+1,'#625f4c');
  for(const [xx,yy,color] of shape.values())cell(xx,yy,color);
  const glyph=GLYPHS[b.cue],gx=Math.floor((w-glyph[0].length)/2),gy=Math.floor((h-glyph.length)/2);
  glyph.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1')cell(gx+xx,gy+yy,b.cue==='♡'?'#8a645a':b.cue==='~'?'#647052':'#403f34')}));
 }
}
