import {LOOK_BY_ID} from './catalog.mjs';
export function fashionThumbnailURL(id,actor='person') {
  const url=new URL(`../assets/fashion/${actor==='pig'?'pig':'person'}-${Object.hasOwn(LOOK_BY_ID,id)?id:'smoking'}.png`,import.meta.url);
  const revision=new URL(import.meta.url).searchParams.get('v');
  if(revision)url.searchParams.set('v',revision);
  return url.href;
}
const requests=new WeakMap();
export function cancelFashionThumbnail(canvas){requests.delete(canvas);}
export function paintFashionThumbnail(canvas,id,actor='person') {
  const key=actor+':'+id;requests.set(canvas,key);
  const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
  const image=new Image();image.onload=()=>{if(requests.get(canvas)!==key)return;const s=Math.min(canvas.width/image.width,canvas.height/image.height);context.imageSmoothingEnabled=false;context.drawImage(image,(canvas.width-image.width*s)/2,(canvas.height-image.height*s)/2,image.width*s,image.height*s);};image.src=fashionThumbnailURL(id,actor);
}
