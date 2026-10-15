import { actorSolidGeometry } from './actor-solid.mjs';
import { buildResident, buildPig } from './residents.mjs';
import { animateActorPose } from './actor-pose.mjs';
import { createPixelMaterials, PIXEL_STYLE } from './native-materials.mjs';
import { createNativeItemLibrary } from './native-model-loader.mjs';
import { ITEM_METRES_TO_UNITS, getItemDefinition, getPlantAssembly } from '../item-catalog.mjs';
import { createOutdoorRasterPass } from './outdoor-raster.mjs';
import { resolveScenePixelGrid, pixelGridSize } from './pixel-grid.mjs';

// The review uses the same boxes, material atlas, accessory choices and joints.
export function createActorPreview(canvas) {
  const T = window.THREE, renderer = new T.WebGLRenderer({canvas, antialias:false});
  renderer.setPixelRatio(1); renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(); scene.background=new T.Color('#bbc1b8');
  const camera=new T.OrthographicCamera(-3,3,3,-3,.1,100);
  scene.add(new T.HemisphereLight('#fff9e8','#73816f',2));
  const sun=new T.DirectionalLight('#fff5df',2);sun.position.set(-3,5,4);scene.add(sun);
  const windTime={value:0},windPower={value:0},weather={wet:{value:0},rain:{value:0}};
  const style=createPixelMaterials(T,windTime,windPower,weather);
  const native=createNativeItemLibrary(T,{units:ITEM_METRES_TO_UNITS,getDefinition:getItemDefinition,getAssembly:getPlantAssembly,windTime,windPower,weather});
  const pass=createOutdoorRasterPass(T,renderer),cube=new T.BoxGeometry(1,1,1);
  const api={P:PIXEL_STYLE.palette,group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;},
    box(parent,x,y,z,w,h,d,color,kind='plain',rx=0,ry=0,rz=0){const mesh=new T.Mesh(cube,style.mat(color,kind));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.rotation.set(rx,ry,rz);parent.add(mesh);return mesh;},
    beam(parent,a,b,width,color,depth=width,kind='plain'){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),center=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);const mesh=api.box(parent,...center.toArray(),width,v.length(),depth,color,kind);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return mesh;},
    solid(parent,vertices,faces,color,kind){const mesh=new T.Mesh(actorSolidGeometry(T,vertices,faces),style.mat(color,kind));parent.add(mesh);return mesh;},
    modelApi(){return {makeNativeItem(parent,type){const root=native.make({type});parent.add(root);return root;}};}};
  let actors=null;
  function rebuild(){if(actors){native.dispose(actors.person);native.dispose(actors.pig);scene.remove(actors.person,actors.pig);}actors={...buildResident(api,scene),...buildPig(api,scene)};}
  rebuild();
  function draw({time=0,person='rest',pig='rest',facing=0,angle=.32,pitch=.22,zoom=1,sampling='source',showPerson=true,showPig=true}){
    actors.person.position.set(-.75,0,0);actors.pig.position.set(.95,0,.12);
    actors.person.rotation.y=actors.pig.rotation.y=facing;
    actors.person.visible=showPerson;actors.pig.visible=showPig;
    animateActorPose(actors,{state:person},{state:pig},time);
    const w=canvas.clientWidth,h=canvas.clientHeight,aspect=w/Math.max(1,h),span=Math.max(3.2,4.3/aspect)/zoom;
    camera.top=span/2;camera.bottom=-span/2;camera.left=-span*aspect/2;camera.right=span*aspect/2;
    camera.position.set(Math.sin(angle)*7,1.1+Math.sin(pitch)*7,Math.cos(angle)*7);camera.lookAt(0,1.1,0);camera.updateProjectionMatrix();
    const grid=resolveScenePixelGrid(devicePixelRatio,{sourceInspection:sampling==='source'}),size=pixelGridSize(w,h,grid);
    renderer.setSize(...size.output,false);canvas.style.imageRendering=sampling==='source'?'auto':'pixelated';
    if(sampling==='source')renderer.render(scene,camera);else pass.render(scene,camera,...size.output,false,grid);
    Object.assign(canvas.dataset,{actors:'blocks-v2',sampling,pixelStep:String(grid.pixelStep),personState:person,pigState:pig,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
  }
  return {rebuild,draw,ready:style.ready};
}
