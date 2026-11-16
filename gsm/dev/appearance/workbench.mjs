import {shells,antennas,charms} from '../../device/catalog.mjs';
import {DEFAULT_APPEARANCE,normalizeAppearance} from '../../device/selection.mjs';

const frame=document.getElementById('devicePreview'),form=document.getElementById('appearanceChoices');
const viewButtons=document.querySelectorAll('[data-view]');
function setView(value,updateURL=false){
 const view=value==='mobile'?'mobile':'desktop';
 document.body.dataset.view=view;
 for(const button of viewButtons)button.setAttribute('aria-pressed',String(button.dataset.view===view));
 if(updateURL){
  const url=new URL(location.href);
  if(view==='mobile')url.searchParams.set('view','mobile');else url.searchParams.delete('view');
  try{history.replaceState(history.state,'',url);}catch{}
 }
}
for(const button of viewButtons)button.addEventListener('click',()=>setView(button.dataset.view,true));
setView(new URL(location.href).searchParams.get('view'));
window.addEventListener('popstate',()=>setView(new URL(location.href).searchParams.get('view')));
const storageKey='gsm-appearance-workbench';
let appearance={...DEFAULT_APPEARANCE},ready=false;
try{appearance=normalizeAppearance(JSON.parse(sessionStorage.getItem(storageKey)));}catch{}
function sync(){
 for(const button of form.querySelectorAll('button'))button.setAttribute('aria-pressed',String(appearance[button.dataset.part]===button.dataset.choice));
 try{sessionStorage.setItem(storageKey,JSON.stringify(appearance));}catch{}
}
function send(){frame.contentWindow.postMessage({type:'gsm-appearance-preview',appearance},location.origin);}
for(const [part,label,items] of [['shell','外壳',shells],['antenna','天线',antennas],['charm','挂件',charms]]){
 const field=document.createElement('fieldset'),legend=document.createElement('legend'),choices=document.createElement('div');
 legend.textContent=label;choices.className='choices';field.append(legend,choices);form.append(field);
 for(const item of items){
  const button=document.createElement('button');button.type='button';button.textContent=item.labels.zh;button.dataset.part=part;button.dataset.choice=item.id;
  button.addEventListener('click',()=>{appearance={...appearance,[part]:item.id};sync();send();});choices.append(button);
 }
}
frame.addEventListener('load',()=>{ready=true;send();});
window.addEventListener('message',event=>{
 if(!ready||event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='gsm-appearance-state')return;
 appearance=normalizeAppearance(event.data.appearance);sync();
});
sync();
