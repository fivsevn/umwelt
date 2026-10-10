import { BACKGROUND } from "../assets/background/empty-rooftop.mjs";
// The topology and instance transforms below come from the saved Blender source.
// Pixelorama authored the single nearest-filtered architectural texture book.
export function loadArchitecturalShell(T, parent) {
  const tone = { value: new T.Color('#ffffff') }, wet = { value: 0 }, lamps = { value: 0 };
  let state = { loaded: false, source: 'Blender', error: null };
  const root = new T.Group(); root.name = 'Blender empty rooftop and neighbourhood'; parent.add(root);
  const base = new URL('../assets/background/', import.meta.url);
  const binaryUrl=new URL(BACKGROUND.binary,base),textureUrl=new URL(BACKGROUND.texture,base);
  binaryUrl.searchParams.set('v',BACKGROUND.sha256);textureUrl.searchParams.set('v',BACKGROUND.textureSha256);
  const ready = Promise.all([
    Promise.resolve(BACKGROUND),
    fetch(binaryUrl).then(r=>{if(!r.ok)throw Error('Background mesh unavailable');return r.arrayBuffer();}),
    new Promise((resolve,reject)=>new T.TextureLoader().load(textureUrl.href,resolve,undefined,reject)),
  ]).then(([manifest,buffer,atlas])=>{
    atlas.minFilter=atlas.magFilter=T.NearestFilter;atlas.generateMipmaps=false;atlas.flipY=false;atlas.colorSpace=T.SRGBColorSpace;
    function geometry(offset,vertices){
      const data=new Float32Array(buffer,offset,vertices*8), geo=new T.BufferGeometry(),
        interleaved=new T.InterleavedBuffer(data,8);
      geo.setAttribute('position',new T.InterleavedBufferAttribute(interleaved,3,0));
      geo.setAttribute('normal',new T.InterleavedBufferAttribute(interleaved,3,3));
      geo.setAttribute('uv',new T.InterleavedBufferAttribute(interleaved,2,6));
      geo.computeBoundingSphere();return geo;
    }
    const cube=geometry(manifest.cube.offset,manifest.cube.vertices);
    for(const part of manifest.parts){
      const material=new T.MeshBasicMaterial({map:atlas,color:'#ffffff'}), [x,y,w,h]=part.rect;
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,{shellRect:{value:new T.Vector4(x,y,w,h)},shellTone:tone,shellWet:wet,shellLamps:lamps,shellGlass:{value:part.field.includes('glass')?1:0}});
        shader.vertexShader='varying vec2 shellChart; varying vec3 shellNormal; varying float shellLamp;\n'+shader.vertexShader;
        shader.fragmentShader='uniform vec4 shellRect; uniform vec3 shellTone; uniform float shellWet; uniform float shellLamps; uniform float shellGlass; varying vec2 shellChart; varying vec3 shellNormal; varying float shellLamp;\n'+shader.fragmentShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          shellChart=uv; shellNormal=normal; shellLamp=.5;
          #ifdef USE_INSTANCING
          vec3 scale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
          vec3 p=(instanceMatrix*vec4(position,1.)).xyz;
          shellNormal=normalize(mat3(instanceMatrix)*(normal/(scale*scale)));
          vec3 n=shellNormal;
          vec3 u=abs(n.y)>.98?vec3(1.,0.,0.):normalize(cross(vec3(0.,1.,0.),n));
          vec3 v=abs(n.y)>.98?vec3(0.,0.,1.):normalize(cross(n,u));
          shellChart=vec2(dot(p,u),dot(p,v))*8.;
          shellLamp=fract(sin(instanceMatrix[3].x*13.13+instanceMatrix[3].y*7.17+instanceMatrix[3].z*.19)*43758.5453);
          #endif`);
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
          vec2 pixel=mod(floor(shellChart),shellRect.zw);
          vec2 sampleUv=(shellRect.xy+pixel+.5)/512.;
          diffuseColor*=texture2D(map,sampleUv);
          vec3 n=normalize(shellNormal);
          float shade=n.y>.7?1.:n.y<-.7?.55:abs(n.x)>abs(n.z)?.76:.88;
          diffuseColor.rgb*=shade*shellTone*(1.-shellWet*.10);
          if(shellGlass>.5&&shellLamp<shellLamps*.72)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.52,.27),shellLamps*.8);`);
      };
      material.customProgramCacheKey=()=>`blender-shell-v1-${part.field}`;
      let mesh;
      if(part.mode==='instances'){
        mesh=new T.InstancedMesh(cube,material,part.count);
        const matrices=mesh.instanceMatrix.array;
        let next=part.directCount ?? part.count;
        matrices.set(new Float32Array(buffer,part.offset,next*16));
        const world=new T.Matrix4(),local=new T.Matrix4(),combined=new T.Matrix4();
        for(const assembly of part.assemblies || []){
          const parents=new Float32Array(buffer,assembly.worldOffset,assembly.worldCount*16),
            sources=new Float32Array(buffer,assembly.sourceOffset,assembly.sourceCount*16);
          for(let p=0;p<assembly.worldCount;p++){
            world.fromArray(parents,p*16);
            for(let s=0;s<assembly.sourceCount;s++){
              local.fromArray(sources,s*16);combined.multiplyMatrices(world,local).toArray(matrices,next++*16);
            }
          }
        }
        mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
      }else mesh=new T.Mesh(geometry(part.offset,part.vertices),material);
      mesh.name=part.field;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
    }
    state={loaded:true,source:'Blender',textureAuthor:'Pixelorama',bytes:buffer.byteLength,triangles:manifest.triangles,objects:manifest.objects,row:manifest.row,sixthFloor:manifest.sixthFloor,drawCalls:manifest.parts.length};
  }).catch(error=>{state.error=error.message;console.error('Blender background:',error);throw error;});
  // Keep rejection inspectable without an unhandled promise when offline.
  ready.catch(()=>{});
  return {ready,update(a){
    const night=Math.max(0,Math.min(1,a.night||0));tone.value.set('#ffffff').lerp(new T.Color('#8ca0b6'),night*.58).multiplyScalar(1-night*.33);
    wet.value=a.wetness||0;lamps.value=a.lamps||0;
  },get stats(){return {...state};}};
}
