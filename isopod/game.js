"use strict";

const $ = (s) => document.querySelector(s);
const canvas = $("#habitat");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const DAYS = [
  {
    note: "培养盒里的土还很新。五只鼠妇大多停在木片附近，偶尔沿着边缘慢慢移动。左侧的土颜色稍浅。",
    after: {
      mist: "细小的水滴落在左侧。过了一会儿，两只鼠妇从木片下爬出来，停在湿土的边缘。",
      leaf: "新叶片盖住一小块土。一只鼠妇碰到叶缘，停了一会儿，随后钻了进去。",
      wait: "没有进行处理。它们的移动很慢，像是在确认这个空间的边界。"
    },
    actions: [["mist","向左侧喷水"],["leaf","加入一片枯叶"],["wait","暂不处理"]]
  },
  {
    note: "清晨，个体主要聚集在遮蔽物下。较小的一只独自在叶片边缘活动，触角反复碰到同一处土粒。",
    after: {
      food: "食物被放在叶片旁。没有个体立刻靠近。等光线暗下来，它们才缓慢改变路线。",
      mist: "水让表层土壤变暗。原先分散的个体逐渐靠近，但并没有完全聚在一起。",
      observe: "靠近看时，最小的个体缩起身体。你的影子离开后，它再次展开。"
    },
    actions: [["food","放少量食物"],["mist","轻轻喷水"],["observe","靠近观察"]]
  },
  {
    note: "昨天靠近食物的个体，今天又经过了相似的位置。木片右下方有一条被反复经过的窄路。也可能只是那里比较平。",
    after: {
      moveLeaf: "叶片的位置改变后，原有的路线中断了。它们在新的边缘来回碰触，之后各自散开。",
      observe: "你等了很久。第三只个体沿盒壁移动了两次，每次都在同一个角落转向。",
      wait: "什么也没有改变。下午，木片下面仍然有四只；第五只不在能看见的地方。"
    },
    actions: [["moveLeaf","移动枯叶"],["observe","记录一条路线"],["wait","保持原样"]]
  },
  {
    note: "08:43，较大的个体离开木片。08:46，它在湿土边缘停下。昨天也是如此。你已经能在它出现前看向那里。",
    after: {
      mist: "喷雾改变了地面的气味和触感。记录中的路线暂时消失，新的路线绕过了你的水滴。",
      food: "食物被移到远离遮蔽物的位置。两只个体抵达过那里，但都没有停留太久。",
      observe: "它又一次在同一点转向。空间足够狭小时，重复的路线看起来很像习惯。"
    },
    actions: [["mist","改变湿润区域"],["food","把食物放远一些"],["observe","继续等待"]]
  },
  {
    note: "光亮起来时，五只个体都向遮蔽物移动。最小的个体晚了片刻。它经过的地方与你昨天留下的阴影重合。",
    after: {
      shade: "阴影停在木片与盒壁之间。几只个体很快进入其中。阴影移开后，它们仍停留了一会儿。",
      edge: "边缘没有遮蔽物，土也更干。它沿盒壁走过半圈，又回到叶片下面。",
      stay: "你留在这里。过了一阵，触角从叶片下面伸出来，碰了碰亮处的边界。"
    },
    actions: [["shade","阴影"],["edge","边缘"],["stay","留在这里"]],
    prompt: "去哪里？"
  },
  {
    note: "盒盖打开。空气流动，光从上方落下。你下意识靠近了阴影。等到震动停止，活动才重新开始。",
    after: {
      mist: "水滴很大，落地时带来短暂的震动。左边更容易呼吸。个体沿着深色土壤重新分布。",
      leaf: "叶片落下，覆盖了昨天的开阔地。下面变暗，也更安静。几只个体很快消失不见。",
      wait: "盖子保持打开了一会儿。这里没有可以避开的地方，只有可以靠近的地方。"
    },
    actions: [["mist","补充水分"],["leaf","加入遮蔽物"],["wait","暂不处理"]]
  },
  {
    note: "第七天。木片下面仍然湿润。个体数量没有变化。盒盖尚未打开，它们已经停在昨天躲藏的位置附近。",
    after: {
      open: "盖子被打开。白光铺进培养盒，熟悉的震动沿着边缘传来。五只个体各自进入最近的阴影。",
      observe: "你看着它们。它们停下来。过了一会儿，你也没有移动。"
    },
    actions: [["open","照常打开盒盖"],["observe","再看一会儿"]]
  }
];

let state = {day:1, acted:false, moisture:0, leaves:0, food:0, choiceLog:[]};
let running = false, last = 0, soundOn = false, audioCtx;
const critters = Array.from({length:5}, (_,i)=>({
  x: 78+i*49, y: 170+(i%2)*88, a: (i*.9)-.4, speed:.18+i*.016,
  turn: 40+i*33, pause: i*22, phase:i*.75, hidden:i===4
}));

function save(){ localStorage.setItem("umwelt-isopod-v1",JSON.stringify(state)); }
function load(){ try { const s=JSON.parse(localStorage.getItem("umwelt-isopod-v1")); if(s&&s.day>=1&&s.day<=7) state={...state,...s}; } catch(_){} }
function dayData(){return DAYS[state.day-1]}
function updateDay(){
  $("#dayLabel").textContent=`DAY ${state.day}`;
  $("#dayTicks").innerHTML=Array.from({length:7},(_,i)=>`<b class="${i<state.day?'on':''}"></b>`).join("");
  $("#recordNo").textContent=String(state.day).padStart(3,"0");
}
function begin(fresh=false){
  if(fresh){state={day:1,acted:false,moisture:0,leaves:0,food:0,choiceLog:[]};save()}
  $("#titleCard").hidden=true; $("#playView").hidden=false; running=true; renderTurn(); requestAnimationFrame(loop);
}
function renderTurn(){
  updateDay(); const d=dayData(); $("#observation").textContent=d.note;
  $("#actions").innerHTML=""; $("#nextBtn").hidden=true;
  if(d.prompt){ const p=document.createElement("p");p.className="action-prompt";p.textContent=d.prompt;p.style.cssText="grid-column:1/-1;margin:2px 0 5px;font:12px system-ui;letter-spacing:.08em";$("#actions").append(p); }
  d.actions.forEach(([id,label])=>{const b=document.createElement("button");b.className="action";b.textContent=label;b.disabled=state.acted;b.onclick=()=>act(id);$("#actions").append(b)});
  if(state.acted){ const prev=state.choiceLog[state.day-1]; if(prev) $("#observation").textContent=d.after[prev]; $("#nextBtn").hidden=false; }
  if(state.day>=6) $("#boxFrame").classList.add("close"); else $("#boxFrame").classList.remove("close");
}
function act(id){
  state.acted=true;state.choiceLog[state.day-1]=id;
  if(id==="mist")state.moisture++;if(["leaf","moveLeaf"].includes(id))state.leaves++;if(id==="food")state.food++;
  if(id==="shade")critters.forEach((c,i)=>{c.x=135+i*15;c.y=145+i*9;c.pause=10});
  if(id==="edge")critters[0].x=348;if(id==="stay")critters[2].x=180;
  save(); tone(130,0.055); renderTurn();
}
function next(){
  if(state.day===7){finish();return}
  state.day++;state.acted=false;save();tone(92,.05);renderTurn();window.scrollTo({top:0,behavior:"smooth"});
}
function finish(){
  running=false;localStorage.removeItem("umwelt-isopod-v1");
  $("#flash").animate([{opacity:0},{opacity:.97,offset:.45},{opacity:.97,offset:.75},{opacity:0}],{duration:3100,easing:"ease-in-out"});
  setTimeout(()=>{$("#playView").hidden=true;$("#endCard").hidden=false;drawEnd();window.scrollTo(0,0)},1600);
  tone(70,.18);
}
function tone(freq,duration){
  if(!soundOn)return;audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="square";o.frequency.value=freq;g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
}
function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function drawHabitat(t){
  const w=canvas.width,h=canvas.height;ctx.fillStyle="#443729";ctx.fillRect(0,0,w,h);
  for(let i=0;i<165;i++){const x=(i*67)%w,y=(i*113)%h;px(ctx,x,y,(i%3)+2,(i%2)+2,i%5===0?"#6f5940":"#342a21")}
  // wet patch
  ctx.fillStyle=state.moisture?"#344637":"#4b4531";ctx.fillRect(0,80,116,260);for(let i=0;i<20;i++)px(ctx,(i*31)%112,90+(i*47)%240,3,2,"#60705a");
  // leaves
  leaf(ctx,275,110,-.45,"#917b45");leaf(ctx,290,344,.35,"#745936");if(state.leaves)leaf(ctx,90,315,-.15,"#a4824d");
  // bark shelter
  ctx.save();ctx.translate(190,215);ctx.rotate(-.09);ctx.fillStyle="#5a412b";ctx.fillRect(-68,-36,136,72);ctx.fillStyle="#76583a";ctx.fillRect(-64,-32,128,8);for(let i=-55;i<60;i+=18)px(ctx,i,-20,8,46,i%36?"#4b3527":"#6b4d33");ctx.restore();
  if(state.food){px(ctx,315,252,13,10,"#ba9b62");px(ctx,327,258,8,7,"#d0af70")}
  critters.forEach((c,i)=>updateCritter(c,i,t));
  ctx.fillStyle="rgba(210,214,183,.07)";ctx.fillRect(4,4,w-8,h-8);ctx.strokeStyle="#93947c";ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
}
function leaf(c,x,y,a,color){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=color;c.beginPath();c.moveTo(-50,0);c.lineTo(-22,-23);c.lineTo(14,-29);c.lineTo(45,-10);c.lineTo(50,15);c.lineTo(14,27);c.lineTo(-24,20);c.closePath();c.fill();c.strokeStyle="#4d402a";c.lineWidth=3;c.beginPath();c.moveTo(-47,0);c.lineTo(46,2);c.stroke();for(let n=-25;n<35;n+=15){c.beginPath();c.moveTo(n,1);c.lineTo(n+13,n<0?-17:18);c.stroke()}c.restore()}
function updateCritter(c,i,t){
  if(c.hidden&&state.day<2)return;c.turn--;c.pause--;
  if(c.turn<0){c.a+=(Math.sin(t*.001+c.phase)*1.4);c.turn=45+((i*29+t*.01)%80)}
  const nearShelter=c.x>112&&c.x<270&&c.y>165&&c.y<265;
  if(c.pause<0&&!nearShelter){c.x+=Math.cos(c.a)*c.speed*2.7;c.y+=Math.sin(c.a)*c.speed*2.7}
  if(c.pause<-100){c.pause=25+(i*17)%80}
  if(c.x<22||c.x>362){c.a=Math.PI-c.a;c.x=Math.max(22,Math.min(362,c.x))}if(c.y<24||c.y>405){c.a=-c.a;c.y=Math.max(24,Math.min(405,c.y))}
  drawCritter(c,t,i)
}
function drawCritter(c,t,i){
  ctx.save();ctx.translate(Math.round(c.x),Math.round(c.y));ctx.rotate(c.a);const wig=Math.sin(t*.012+c.phase);
  ctx.strokeStyle="#25251e";ctx.lineWidth=2;for(let n=-11;n<=11;n+=5){ctx.beginPath();ctx.moveTo(n,-5);ctx.lineTo(n-3,-10+(n%2)*wig);ctx.moveTo(n,5);ctx.lineTo(n-3,10-(n%2)*wig);ctx.stroke()}
  ctx.fillStyle=i===2?"#777262":"#666557";ctx.fillRect(-15,-6,25,12);for(let n=-12;n<10;n+=5){ctx.fillStyle=n%10?"#858071":"#56564a";ctx.fillRect(n,-7,4,14)}ctx.fillStyle="#4a4b40";ctx.fillRect(10,-5,6,10);
  ctx.strokeStyle="#9a9582";ctx.beginPath();ctx.moveTo(15,-3);ctx.lineTo(22+wig*2,-8);ctx.moveTo(15,3);ctx.lineTo(22+wig*2,8);ctx.stroke();ctx.restore()
}
function loop(t){if(!running)return;if(t-last>34){drawHabitat(t);last=t}requestAnimationFrame(loop)}
function drawEnd(){const c=$("#endCanvas").getContext("2d");c.imageSmoothingEnabled=false;c.fillStyle="#efe9d0";c.fillRect(0,0,320,230);c.fillStyle="#d7d0b8";c.fillRect(0,175,320,55);for(let i=0;i<5;i++){c.save();c.translate(62+i*47,192+(i%2)*8);c.rotate((i-2)*.15);c.fillStyle="#68675b";c.fillRect(-12,-5,23,10);for(let n=-10;n<10;n+=5){c.fillStyle=n%10?"#817d70":"#56564b";c.fillRect(n,-6,3,12)}c.restore()}}

$("#startBtn").onclick=()=>begin(true);$("#continueBtn").onclick=()=>begin(false);$("#nextBtn").onclick=next;
$("#restartBtn").onclick=()=>{location.reload()};$("#soundBtn").onclick=()=>{soundOn=!soundOn;$("#soundBtn").textContent=`SOUND: ${soundOn?'ON':'OFF'}`;$("#soundBtn").setAttribute("aria-pressed",soundOn);tone(110,.05)};
canvas.onclick=()=>{$("#tapHint").classList.add("gone");$("#boxFrame").classList.toggle("close");tone(160,.035)};
load();if(localStorage.getItem("umwelt-isopod-v1"))$("#continueBtn").hidden=false;updateDay();drawHabitat(0);
