import {attachRaincoat} from '../../../fashion/raincoats.mjs';
import {actorSolidGeometry} from '../../../3d/actor-solid.mjs';
import {buildFashionActors} from '../../../fashion/models.mjs';
import {createPixelMaterials,PIXEL_STYLE} from '../../../3d/native-materials.mjs';
import {animateActorPose} from '../../../3d/actor-pose.mjs';
import {createOutdoorRasterPass} from '../../../3d/outdoor-raster.mjs';
import {resolveScenePixelGrid,pixelGridSize} from '../../../3d/pixel-grid.mjs';

export function createFashionStage(canvas) {
  const T=window.THREE,renderer=new T.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color('#d2d5c9');
  scene.add(new T.HemisphereLight('#f4faf8','#7e8984',1.5));
  const rainwearLight=new T.DirectionalLight('#ffffff',1.5);rainwearLight.position.set(-3,5,4);scene.add(rainwearLight);
  const camera=new T.OrthographicCamera(-2,2,2,-2,.1,100);
  const style=createPixelMaterials(T,{value:0},{value:0},{wet:{value:0},rain:{value:0}});
  const pass=createOutdoorRasterPass(T,renderer),cube=new T.BoxGeometry(1,1,1),cache=new Map();
  const api={P:PIXEL_STYLE.palette,
    group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent?.add(g);return g;},
    box(parent,x,y,z,w,h,d,color,kind='actor-plain',rx=0,ry=0,rz=0){const m=new T.Mesh(cube,style.mat(color,kind==='plain'?'actor-plain':kind));m.position.set(x,y,z);m.scale.set(w,h,d);m.rotation.set(rx,ry,rz);parent.add(m);return m;},
    beam(parent,a,b,w,color,d=w,kind='actor-plain'){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),p=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);const m=api.box(parent,...p.toArray(),w,v.length(),d,color,kind);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;},
    solid(parent,vertices,faces,color,kind){const m=new T.Mesh(actorSolidGeometry(T,vertices,faces),style.mat(color,kind));parent.add(m);return m;}
  };
  const ground=new T.Group();scene.add(ground);
  for(const [x,z,w,d] of [[-.57,0,.93,.67],[.69,.08,.85,.98]]){const m=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:'#566350',transparent:true,opacity:.11,depthWrite:false}));m.rotation.x=-Math.PI/2;m.scale.set(w*.55,d*.55,1);m.position.set(x,-.017,z);ground.add(m);}
  let current=null;
  function select(id,accessory=true){const key=id+':'+accessory;if(current){current.person.visible=false;current.pig.visible=false;}if(!cache.has(key)){const actor=buildFashionActors(api,scene,id,accessory);actor.personRaincoat=attachRaincoat(api,actor,'person',id);actor.pigRaincoat=attachRaincoat(api,actor,'pig');cache.set(key,actor);}current=cache.get(key);current.person.visible=current.pig.visible=true;return current;}
  function draw({id,accessory=true,time=0,action='rest',angle=.25,pitch=.12,zoom=1,sampling='source',focus='pair',width=canvas.clientWidth,height=canvas.clientHeight,thumbnail=false,raincoat=false}){
    const a=select(id,accessory),isFace=focus==='hair',onlyPerson=focus==='person'||isFace,onlyPig=focus==='pig';
    a.person.position.set(onlyPerson?0:-.57,0,0);a.pig.position.set(onlyPig?0:.69,0,.08);
    a.person.visible=!onlyPig;a.pig.visible=!onlyPerson;ground.visible=!isFace&&!thumbnail;
    animateActorPose(a,{state:action,raincoat},{state:action==='walk'?'walk':'rest',raincoat},time);
    a.head.rotation.y=Math.sin(time*.7)*.025;
    const aspect=width/Math.max(1,height),base=isFace?1.00:onlyPig?1.6:2.85,fit=isFace?1.10:onlyPig?1.7:onlyPerson?1.65:2.75;
    const span=Math.max(base,fit/aspect)/zoom,targetY=isFace?1.91:onlyPig?.44:1.10;
    camera.top=span/2;camera.bottom=-span/2;camera.left=-span*aspect/2;camera.right=span*aspect/2;
    camera.position.set(Math.sin(angle)*8,targetY+Math.sin(pitch)*8,Math.cos(angle)*8);camera.lookAt(0,targetY,0);camera.updateProjectionMatrix();
    const grid=resolveScenePixelGrid(thumbnail?1:devicePixelRatio,{sourceInspection:sampling==='source'});
    const size=pixelGridSize(width,height,grid);if(canvas.width!==size.output[0]||canvas.height!==size.output[1])renderer.setSize(...size.output,false);
    renderer.setViewport(0,0,...size.output);
    pass.render(scene,camera,...size.output,false,grid);canvas.style.imageRendering=sampling==='game'?'pixelated':'auto';
    Object.assign(canvas.dataset,{look:id,sampling,focus,accessory:String(accessory),pixelStep:String(grid.pixelStep),time:time.toFixed(3),action,parts:String(a.person.children.length),ready:'true'});
  }
  function thumbnail(id,focus='person'){draw({id,focus,width:112,height:142,angle:.19,pitch:.06,thumbnail:true});return canvas.toDataURL('image/png');}
  return {draw,thumbnail,ready:style.ready,stats:()=>({variants:cache.size,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),dispose(){for(const a of cache.values())for(const root of [a.person,a.pig])root.traverse(o=>{if(o.geometry&&o.geometry!==cube)o.geometry.dispose();});cube.dispose();for(const m of style.cache.values())m.dispose();for(const t of style.textures.values())t.dispose();pass.dispose?.();renderer.dispose();}};
}
