import {paintBase,paintObject,initialLayout,validateLayout,asset,dimensions,freeActorPoint} from '../scene.mjs';
import {paintDongdong} from '../dongdong.mjs';
import {paintPig,wardrobe,dress,OUTFITS,DECORATIONS,ACTIVITIES} from '../wardrobe.mjs';
const $=id=>document.getElementById(id),canvas=$('room'),c=canvas.getContext('2d');let activity='rest',pigActivity='rest';
$('preview').href='https://umwelt.fivsevn.com/rooftop/';
function choices(id,items,current,select){for(const [key,value] of Object.entries(items)){const b=document.createElement('button');b.type='button';b.textContent=Array.isArray(value)?value[0]:value;b.dataset.value=key;b.setAttribute('aria-pressed',String(key===current()));b.onclick=()=>{select(key);for(const child of $(id).children)child.setAttribute('aria-pressed',String(child===b));$('caption').textContent=id==='pigActivities'?'猪猪正在'+({rest:'歇一会儿',walk:'散步'})[key]+'。':id==='activities'?'东东正在'+ACTIVITIES[key]+'。':id==='outfits'?'换好了，穿着'+OUTFITS[key][0]+'上楼。':'小猪的装饰：'+DECORATIONS[key]+'。'};$(id).append(b)}}
const wardrobeViews=[];
function groupedChoices(id,items,current,select){
 const root=$(id);root.className='wardrobe-groups';
 const groups=new Map();
 for(const [key,value] of Object.entries(items)){
  const label=Array.isArray(value)?value[0]:value,kind=label.slice(2);
  if(!groups.has(kind))groups.set(kind,[]);
  groups.get(kind).push([key,label.slice(0,2)]);
 }
 for(const [kind,variants] of groups){
  const card=document.createElement('details');card.className='wardrobe-card';
  const title=document.createElement('summary');title.textContent=kind;card.append(title);
  const colors=document.createElement('div');colors.className='categories wardrobe-colors';
  for(const [key,color] of variants){const b=document.createElement('button');b.type='button';b.textContent=color;b.dataset.value=key;b.setAttribute('aria-label',color+kind);b.onclick=()=>{select(key);sync();$('caption').textContent=id==='outfits'?'换好了，穿着'+OUTFITS[key][0]+'上楼。':'小猪的装饰：'+DECORATIONS[key]+'。'};colors.append(b)}
  card.append(colors);card.addEventListener('toggle',()=>{if(card.open)for(const other of root.children)if(other!==card)other.open=false});root.append(card);
 }
 function sync(){for(const card of root.children){let selected=false;for(const b of card.querySelectorAll('button')){const active=b.dataset.value===current();b.setAttribute('aria-pressed',String(active));selected||=active}card.classList.toggle('has-selection',selected);card.open=selected}}
 wardrobeViews.push(sync);sync();
}
groupedChoices('outfits',OUTFITS,()=>wardrobe.outfit,key=>dress('outfit',key));groupedChoices('decorations',DECORATIONS,()=>wardrobe.pig,key=>dress('pig',key));choices('activities',ACTIVITIES,()=>activity,key=>activity=key);
choices('pigActivities',{rest:'歇一会儿',walk:'散步'},()=>pigActivity,key=>pigActivity=key);
const px=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
let roomLayout=initialLayout(),personPoint=[300,240],pigPoint=[260,260];function loadRoom(){try{const saved=localStorage.getItem('umwelt-rooftop-layout-v1');roomLayout=saved?validateLayout(JSON.parse(saved)):initialLayout()}catch{roomLayout=initialLayout()}personPoint=freeActorPoint('room',roomLayout.scenes.room,300,240);pigPoint=freeActorPoint('room',roomLayout.scenes.room,260,260)}loadRoom();addEventListener('storage',loadRoom);addEventListener('pageshow',loadRoom);addEventListener('focus',loadRoom);
canvas.width=208;canvas.height=288;const floor=document.createElement('canvas');floor.width=640;floor.height=520;paintBase(floor.getContext('2d'),'room');
function frame(ms){const t=ms/1000;c.imageSmoothingEnabled=false;c.clearRect(0,0,208,288);c.save();c.translate(-196,-56);c.drawImage(floor,0,0);const sprites=roomLayout.scenes.room.map(o=>({y:o.y-(asset(o.type).furniture?dimensions(o).h/2:0),o}));if(personPoint)sprites.push({y:personPoint[1],person:{x:personPoint[0],y:personPoint[1],state:activity,facing:$('facing').value}});if(pigPoint)sprites.push({y:pigPoint[1],pig:{x:pigPoint[0],y:pigPoint[1],state:pigActivity,facing:'east'}});sprites.sort((a,b)=>a.y-b.y);for(const s of sprites)if(s.o)paintObject(c,s.o,t);else if(s.person)paintDongdong(c,s.person,t);else paintPig(c,s.pig,t);c.restore();requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.room={get outfit(){return wardrobe.outfit},get pig(){return wardrobe.pig},get activity(){return activity},get person(){return personPoint},get pigPosition(){return pigPoint},get layout(){return structuredClone(roomLayout.scenes.room)}};

$('exportRoom').onclick=()=>{loadRoom();const data={kind:'dongdong-room',version:1,wardrobe:{...wardrobe},roomVersion:roomLayout.roomVersion,objects:roomLayout.scenes.room};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dongdong-room.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('caption').textContent='房间和换装已打包。'};
$('importRoom').onclick=()=>$('roomFile').click();
$('roomFile').onchange=async()=>{const file=$('roomFile').files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.kind!=='dongdong-room'||data.version!==1||!Array.isArray(data.objects)||!OUTFITS[data.wardrobe?.outfit]||!Object.hasOwn(DECORATIONS,data.wardrobe?.pig))throw Error();loadRoom();const next=validateLayout({...roomLayout,roomVersion:data.roomVersion,scenes:{...roomLayout.scenes,room:data.objects}});localStorage.setItem('umwelt-rooftop-layout-v1',JSON.stringify(next));dress('outfit',data.wardrobe.outfit);dress('pig',data.wardrobe.pig);roomLayout=next;personPoint=freeActorPoint('room',next.scenes.room,300,240);pigPoint=freeActorPoint('room',next.scenes.room,260,260);for(const sync of wardrobeViews)sync();document.querySelector('.transfer').open=false;$('caption').textContent='房间和换装已恢复。'}catch{$('caption').textContent='这个文件无法导入，请选择导出的房间 JSON。'}finally{$('roomFile').value=''}};
