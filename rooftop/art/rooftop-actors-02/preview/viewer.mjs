import {LOOKS,LOOK_BY_ID,DEFAULT_LOOK} from '../../../fashion/catalog.mjs';
import {createFashionStage} from '../fashion/stage.mjs';
const $=id=>document.getElementById(id),canvas=$('actors');
if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){document.body.textContent='此试衣页仅供本地查看。';throw new Error('Local fitting study only');}
const params=new URLSearchParams(location.search);
let id=Object.hasOwn(LOOK_BY_ID,params.get('look'))?params.get('look'):DEFAULT_LOOK,filter='all',angle=.25,pitch=.12,zoom=1,focus='pair',time=0,last=performance.now(),paused=false,pointer=null;
const stage=createFashionStage(canvas),cards=new Map();
for(const [index,look] of LOOKS.entries()){
 const button=document.createElement('button');button.className='look';button.dataset.look=look.id;button.setAttribute('aria-label',`${look.name}，${look.date}`);button.setAttribute('aria-pressed',String(look.id===id));
 const img=document.createElement('img');img.alt='';img.width=112;img.height=142;
 const name=document.createElement('span');name.textContent=look.name;const year=document.createElement('small');year.textContent=look.year<0?'古希腊':look.year===750?'唐':String(look.year);
 button.append(img,name,year);button.onclick=()=>select(look.id);$('catalog').append(button);cards.set(look.id,{button,img});
}
function select(next){id=next;const look=LOOK_BY_ID[id];for(const [key,{button}]of cards)button.setAttribute('aria-pressed',String(key===id));
 $('number').textContent=String(LOOKS.indexOf(look)+1).padStart(2,'0')+' / '+LOOKS.length;$('region').textContent=look.region+' · '+look.type;$('title').textContent=look.name;$('original').textContent=look.original;$('date').textContent=look.date+' / '+look.designer;
 $('stageName').textContent=look.name;$('stageDate').textContent=look.date;$('description').textContent=look.description;$('adaptation').textContent=look.adaptation;$('pigDetail').textContent=look.pig;$('personDetail').textContent=look.elements.join('、');$('source').textContent=look.source.name+' ↗';$('source').href=look.source.url;
 $('swatches').replaceChildren(...look.palette.map(color=>{const swatch=document.createElement('i');swatch.style.background=color;return swatch;}));$('elements').replaceChildren(...look.elements.map(text=>{const tag=document.createElement('span');tag.textContent=text;return tag;}));
 const url=new URL(location.href);url.searchParams.set('look',id);history.replaceState(null,'',url);document.title=look.name+' · 东东与小猪';
}
function filterCards(){const term=$('search').value.trim().toLowerCase();let count=0;for(const look of LOOKS){const match=filter==='all'||filter==='historical'&&look.year<1900||filter==='modern'&&look.year>=1900||filter==='east'&&/中国|日本/.test(look.region);const found=!term||[look.name,look.original,look.date,look.era,look.region,look.designer,look.type,...look.elements].join(' ').toLowerCase().includes(term);cards.get(look.id).button.hidden=!(match&&found);if(match&&found)count++;}$('count').textContent=count+' 套';$('empty').hidden=!!count;}
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{filter=button.dataset.filter;for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));filterCards();};$('search').oninput=filterCards;
for(const button of document.querySelectorAll('[data-focus]'))button.onclick=()=>{focus=button.dataset.focus;zoom=1;for(const b of document.querySelectorAll('[data-focus]'))b.setAttribute('aria-pressed',String(b===button));$('stageNote').textContent=focus==='hair'?'短中分 · 露额头 · 金棕分束':'短中分 · 金棕发色';};
$('front').onclick=()=>{angle=0;pitch=.02;};$('back').onclick=()=>{angle=Math.PI;pitch=.10;};$('reset').onclick=()=>{angle=.25;pitch=.12;zoom=1;};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'继续':'暂停';$('pause').setAttribute('aria-pressed',String(paused));};
function step(direction){const visible=LOOKS.filter(l=>!cards.get(l.id).button.hidden);if(!visible.length)return;let i=visible.findIndex(l=>l.id===id);select(visible[i<0?(direction>0?0:visible.length-1):(i+direction+visible.length)%visible.length].id);}
$('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);
canvas.onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!pointer)return;angle-=(e.clientX-pointer.x)*.008;pitch=Math.max(-.12,Math.min(.8,pitch+(e.clientY-pointer.y)*.006));pointer={x:e.clientX,y:e.clientY};};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(2.3,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')pitch=Math.min(.8,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.12,pitch-.1);if(e.key==='+')zoom=Math.min(2.3,zoom*1.1);if(e.key==='-')zoom=Math.max(.65,zoom/1.1);}};
select(id);filterCards();
try{await stage.ready;for(const look of LOOKS)cards.get(look.id).img.src=stage.thumbnail(look.id);document.body.dataset.ready='true';$('status').textContent='拖动转看 · 滚轮缩放 · 方向键也可以转看';
 function frame(now){if(!document.hidden){if(!paused)time+=Math.min(.1,(now-last)/1000);stage.draw({id,time,angle,pitch,zoom,focus,action:$('action').value,sampling:$('sampling').value,accessory:$('paired').checked});}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(error){$('status').textContent='试衣台加载失败，请刷新重试。';console.error(error);}
window.fashionReview={thumbnail:(id,actor='person')=>stage.thumbnail(id,actor),get state(){return {id,time,paused,focus,angle,pitch,zoom,stats:stage.stats()};}};
