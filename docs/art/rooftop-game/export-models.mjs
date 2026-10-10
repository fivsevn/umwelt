// Pure mesh authoring, without a browser, DOM, WebGL renderer or saved-game writes.
import vm from "node:vm";
import {readFileSync,writeFileSync} from "node:fs";
import {gzipSync} from "node:zlib";
import {buildObject} from "../../../rooftop/3d/object-models.mjs";
import {buildStand} from "../../../rooftop/3d/stand-models.mjs";
import {buildVessel} from "../../../rooftop/3d/vessel-models.mjs";
import {buildFoliage} from "../../../rooftop/3d/plant-models.mjs";
import {buildCactusBody} from "../../../rooftop/3d/cactus-models.mjs";
import {buildWaterBowl} from "../../../rooftop/3d/water-models.mjs";
import {buildWashstation} from "../../../rooftop/3d/washstation.mjs";
import {buildGlassCase} from "../../../rooftop/3d/glass-cases.mjs";
import {populateWater} from "../../../rooftop/3d/water-life.mjs";
import {latheSurface,leafSurface} from "../../../rooftop/3d/model-surfaces.mjs";
import {soilSurface} from "../../../rooftop/3d/soil-surface.mjs";
import {plantPotSpec} from "../../../rooftop/3d/plant-pots.mjs";
import {plantPaintKind} from "../../../rooftop/3d/plant-materials.mjs";
import {coarseSides,PIXEL_STYLE} from "../../../rooftop/3d/native-style.mjs";
import {nativeField} from "../../../rooftop/3d/native-materials.mjs";
import {modelRandom} from "../../../rooftop/3d/model-random.mjs";
import {surfaceSeed} from "../../../rooftop/3d/surface-variation.mjs";
import {ASSETS,SCENES} from "../../../rooftop/scene.mjs";
import {resolveSupports,contactOffset} from "../../../rooftop/3d/spatial-layout.mjs";
import {PLANTS,POTS} from "../../../rooftop/botany.mjs";
import {INITIAL_LAYOUT} from "../../../rooftop/initial-layout.mjs";
const here=new URL("./",import.meta.url),context={console:{warn(){}}};
vm.runInNewContext(readFileSync(new URL("../../../rooftop/3d/vendor/three.min.js",here),"utf8"),context);
const T=context.THREE, P=PIXEL_STYLE.palette, api={T,P,rng:modelRandom};
function foliage(g){for(let p=g;p;p=p.parent)if(p.userData.foliage)return p.userData.foliage;return null;}
api.group=(g,x=0,y=0,z=0)=>{const q=new T.Group();q.position.set(x,y,z);g.add(q);return q;};
api.shade=(color,v)=>"#"+new T.Color(color).multiplyScalar(v).getHexString();
api.mat=(color,kind="paint")=>{const m=new T.MeshBasicMaterial({color});m.userData.kind=kind;return m;};
api.surface=(g,geo,x,y,z,w,h,d,color,kind="paint")=>{const m=new T.Mesh(geo,api.mat(color,kind));m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);return m;};
api.box=(g,x,y,z,w,h,d,color,kind="paint",rx=0,ry=0,rz=0)=>{if(Math.min(w,h,d)<=0)return;const m=api.surface(g,new T.BoxGeometry(1,1,1),x,y,z,w,h,d,color,kind==="paint"?(foliage(g)||kind):kind);m.rotation.set(rx,ry,rz);};
api.cyl=(g,x,y,z,rt,rb,h,color,sides=8,kind="paint")=>api.surface(g,new T.CylinderGeometry(rt,rb,h,coarseSides(sides),1,false),x,y,z,1,1,1,color,kind);
api.beam=(g,a,b,width,color,depth=width,kind="paint")=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);const m=api.surface(g,new T.BoxGeometry(1,1,1),...mid.toArray(),width,v.length(),depth,color,kind);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());};
api.ellipsoid=(g,x,y,z,rx,ry,rz,color,kind="paint")=>{
 kind=typeof kind==="string"?kind:"wrap-paint";
 return kind==="petal"?api.box(g,x,y,z,rx*2,ry*2,rz*2,color,kind):api.surface(g,new T.SphereGeometry(1,6,3).toNonIndexed(),x,y,z,rx,ry,rz,color,kind==="paint"?(foliage(g)||kind):kind);
};
api.profile=(g,points,sides,color,kind="clay",shape="round",ribs=0)=>api.surface(g,latheSurface(T,points,coarseSides(sides,shape,ribs),shape,ribs),0,0,0,1,1,1,color,kind);
api.soil=(g,x,y,z,w,d,{shape="round",sides=24,color=P.soil}={})=>api.surface(g,soilSurface(T,shape,sides,4),x,y,z,w/2,Math.min(.045,Math.min(w,d)*.065),d/2,color,"soil");
api.blade=(g,start,end,width,color,teeth=false,fleshy=false)=>{
 const v=new T.Vector3(...end).sub(new T.Vector3(...start)),length=Math.max(.001,v.length()),side=new T.Vector3(v.z,0,-v.x);
 if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();
 const normal=v.clone().cross(side).normalize(),leaf=api.group(g,...start);
 leaf.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side,normal,v.normalize()));leaf.scale.set(width,length,length);
 return api.surface(leaf,leafSurface(T,[0,0,0],[0,0,1],1,teeth,fleshy),0,0,0,1,1,1,color,foliage(g)||"leaf");
};
api.cactusBody=(g,...args)=>buildCactusBody(api,g,...args);
api.stand=(g,...args)=>buildStand(api,g,...args);
api.basin=(g,...args)=>buildWashstation(api,g,...args);
api.terrarium=(g,w,d,h)=>buildGlassCase(api,g,"terrarium",w,d,h);
api.makePot=(g,id,r=.46,h=.38,empty=false)=>buildVessel(api,g,POTS.find(p=>p.id===id)||POTS[0],r,h,{empty});
api.registerWater=()=>{};api.registerMotion=()=>{};
api.fishSchool=(g,width,depth,level,goldfish=false)=>populateWater(api,g,{width,depth,level,goldfish,count:goldfish?3:5});
api.waterSurface=(g,w,d,level,round=false)=>{const m=api.surface(g,round?new T.CircleGeometry(.5,8):new T.PlaneGeometry(1,1),0,level,0,w,d,1,"#749993","water");m.rotation.x=-Math.PI/2;m.material.transparent=true;m.material.opacity=.56;};
api.waterBowl=(g,...args)=>buildWaterBowl(api,g,...args);
api.modelApi=()=>api;
const assets=[],errors=[];
for(const a of ASSETS){
 const root=new T.Group();root.name=a.id;root.userData.paintSeed=surfaceSeed(1835);
 try {
  const plant=PLANTS.find(p=>p.id===a.id);
  if(plant){const spec=plantPotSpec(plant),h=api.makePot(root,plant.defaultPot,spec.radius,spec.height),g=api.group(root,0,h-.044,0);g.userData.foliage=plantPaintKind(plant);buildFoliage(api,g,plant,{seed:1835,potRadius:spec.radius,potTop:h});root.scale.setScalar(plant.id==="barrel"?1.15:1.38);}
  else buildObject(api,root,a,{type:a.id,seed:1835,scale:1,rotation:0});
  root.updateMatrixWorld(true);
  const batches=new Map();
  root.traverse(m=>{
   if(!m.isMesh)return;
   const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry;
   geo.computeVertexNormals();
   const p=geo.attributes.position,uv=geo.attributes.uv,kind=m.material.userData.kind||(m.material.transparent?"glass":"paint"),name=nativeField(kind),opacity=m.material.transparent?m.material.opacity:1;
   const key=name+":"+opacity;
   if(!batches.has(key))batches.set(key,{field:name,kind,opacity,seed:root.userData.paintSeed,positions:[],uvs:[],innerUvs:[],planes:[],shade:[],colors:[]});
   const b=batches.get(key),color=m.material.color||new T.Color("#ffffff");
   const sx=new T.Vector3().setFromMatrixColumn(m.matrixWorld,0).length(),sy=new T.Vector3().setFromMatrixColumn(m.matrixWorld,1).length(),sz=new T.Vector3().setFromMatrixColumn(m.matrixWorld,2).length(),inner=geo.attributes.paintInteriorUv;
   for(let i=0;i<p.count;i+=3){
    const local=Array.from({length:3},(_,j)=>new T.Vector3(p.getX(i+j)*sx,p.getY(i+j)*sy,p.getZ(i+j)*sz));
    const n=local[1].clone().sub(local[0]).cross(local[2].clone().sub(local[0])).normalize(),tangent=Math.abs(n.y)>.98?new T.Vector3(1,0,0):new T.Vector3(0,1,0).cross(n).normalize(),vertical=n.clone().cross(tangent).normalize(),shade=n.y>.7?1:n.y<-.7?.52:Math.abs(n.x)>Math.abs(n.z)?.66:.82;
    for(let j=0;j<3;j++){
     const q=new T.Vector3(p.getX(i+j),p.getY(i+j),p.getZ(i+j)).applyMatrix4(m.matrixWorld);if(!q.toArray().every(Number.isFinite))throw Error("Nonfinite vertex");b.positions.push(...q.toArray().map(v=>+v.toFixed(6)));b.uvs.push(uv?uv.getX(i+j):0,uv?uv.getY(i+j):0);b.innerUvs.push(inner?inner.getX(i+j):.5,inner?inner.getY(i+j):.5);b.colors.push(color.r,color.g,color.b);b.planes.push(local[j].dot(tangent),local[j].dot(vertical));b.shade.push(shade);
    }
   }
  });
  assets.push({id:a.id,name:a.name,plant:!!plant,meshes:[...batches.values()]});
 }catch(e){errors.push({id:a.id,message:e.message});}
}
if(errors.length){console.error(errors);process.exit(1);}
const report={softwareTarget:"Blender",assets:assets.length,triangles:assets.reduce((n,a)=>n+a.meshes.reduce((n,m)=>n+m.positions.length/9,0),0),errors};
const placements=Object.fromEntries(Object.entries(INITIAL_LAYOUT.scenes).map(([name,items])=>{const relations=resolveSupports(items);return[name,items.map(o=>({...o,renderHeight:(relations.get(o.id)?.height||0)+.02,renderContact:contactOffset(o)}))];}));
writeFileSync(new URL("model-authoring.json.gz",here),gzipSync(JSON.stringify({report,assets,scenes:SCENES,initialLayout:INITIAL_LAYOUT,placements}),{level:9}));
writeFileSync(new URL("model-audit.json",here),JSON.stringify({...report,perAsset:assets.map(a=>({id:a.id,meshes:a.meshes.length,triangles:a.meshes.reduce((n,m)=>n+m.positions.length/9,0)}))},null,2)+"\n");
console.log(report);
