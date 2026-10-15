import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {buildFashionActors} from '../../../fashion/models.mjs';
import {buildResidentTools} from '../../../3d/resident-tools.mjs';
import {PIXEL_STYLE} from '../../../3d/native-style.mjs';
import {LOOKS} from '../../../fashion/catalog.mjs';
const T=createRequire(import.meta.url)('../../../3d/vendor/three.min.js');
const assets=[];
for(const look of LOOKS){const records=[];
 const api={P:PIXEL_STYLE.palette,group(parent,x=0,y=0,z=0){const r={id:records.length,type:'joint',parent:parent?.sourceIndex??null,position:[x,y,z],rotation:[0,0,0],scale:[1,1,1]};records.push(r);return{sourceIndex:r.id,userData:{},scale:{setScalar(s){r.scale=[s,s,s];}}};},
 box(parent,x,y,z,w,h,d,color,kind='actor-plain',rx=0,ry=0,rz=0){records.push({id:records.length,type:'box',parent:parent.sourceIndex,position:[x,y,z],size:[w,h,d],rotation:[rx,ry,rz],color,kind});},
 beam(parent,a,b,w,color,d=w,kind='actor-plain'){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),center=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()),e=new T.Euler().setFromQuaternion(q);api.box(parent,...center.toArray(),w,v.length(),d,color,kind,e.x,e.y,e.z);},
 solid(parent,vertices,faces,color,kind){records.push({id:records.length,type:'solid',parent:parent.sourceIndex,position:[0,0,0],rotation:[0,0,0],vertices,faces,color,kind});}};
 api.modelApi=()=>({makeNativeItem(parent,type){records.push({id:records.length,type:'native-prop',parent:parent.sourceIndex,model:type,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]});}});
 const actors=buildFashionActors(api,null,look.id);actors.person.scale.setScalar(1.16);
 buildResidentTools(api,actors.arms);assets.push({id:look.id,name:look.name,records});
}
writeFileSync(new URL('./fashion-records.json',import.meta.url),JSON.stringify({source:'Shared game wardrobe: complete paired models and original pig anatomy',unitsPerMetre:5.6/3,assets},null,2));
console.log('Captured',assets.length,'paired looks,',assets.reduce((n,a)=>n+a.records.length,0),'parts and joints');
