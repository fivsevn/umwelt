import { writeFileSync } from 'node:fs';
import { buildResident,buildPig } from '../../../rooftop/3d/residents.mjs';
import { OUTFITS,DECORATIONS,wardrobe } from '../../../rooftop/wardrobe.mjs';
import { PIXEL_STYLE } from '../../../rooftop/3d/native-style.mjs';
import { createRequire } from 'node:module';
const T=createRequire(import.meta.url)('../../../rooftop/3d/vendor/three.min.js'),assets=[];
for(const [actor,variants] of [['person',OUTFITS],['pig',DECORATIONS]])for(const id of Object.keys(variants)){
 wardrobe[actor==='person'?'outfit':'pig']=id;const records=[];
 const group=(parent,x=0,y=0,z=0)=>{const index=records.length,r={id:index,type:'joint',parent:parent?.sourceIndex??null,position:[x,y,z],rotation:[0,0,0],scale:[1,1,1]};records.push(r);const g={sourceIndex:index,userData:{},scale:{setScalar(s){r.scale=[s,s,s];}}};return g;};
 const box=(parent,x,y,z,w,h,d,color,kind='plain',rx=0,ry=0,rz=0)=>{records.push({id:records.length,type:'box',parent:parent.sourceIndex,position:[x,y,z],size:[w,h,d],rotation:[rx,ry,rz],color,kind});};
 const beam=(parent,a,b,width,color,depth=width,kind='plain')=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()),e=new T.Euler().setFromQuaternion(q);box(parent,...m.toArray(),width,v.length(),depth,color,kind,e.x,e.y,e.z);};
 const api={group,box,beam,P:PIXEL_STYLE.palette,modelApi(){return{makeNativeItem(parent,type){records.push({id:records.length,type:'native-prop',parent:parent.sourceIndex,model:type,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]});}};}};
 (actor==='person'?buildResident:buildPig)(api,null);assets.push({id:actor+'-'+id,actor,choice:id,records});
}
writeFileSync(new URL('./actor-records.json',import.meta.url),JSON.stringify({source:'Actual game box recipes and joint pivots',unitsPerMetre:5.6/3,assets},null,2));console.log(assets.length+' native variants captured');
