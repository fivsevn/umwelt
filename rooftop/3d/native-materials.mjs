import { NATIVE_BOOK } from "./native-book.mjs";
import { PIXEL_STYLE } from "./native-style.mjs";
export { PIXEL_STYLE } from "./native-style.mjs";

export function nativeField(kind) {
  const wrapped=kind.replace(/^wrap-/, "");
  if(NATIVE_BOOK[wrapped])return wrapped;
  const base=wrapped.replace(/^weather-/, "");
  if(NATIVE_BOOK[base])return base;
  if(base==="facade-tile")return "paving";
  if(base==="window")return "glass";
  if(base==="bag")return "cloth";
  if(base==="round-metal")return "metal";
  if(base.startsWith("pot-"))return "clay";
  if(base.startsWith("leaf"))return "leaf";
  return "paint";
}

// One native texture, shared by every object. The runtime never paints a canvas.
// In-plane metric sampling makes each visible cell a 1/8 world-unit square,
// including scaled instances and sloping folded surfaces.
export function createPixelMaterials(T, windTime, windPower, weather={wet:{value:0},rain:{value:0}}) {
  const cache=new Map(), textures=new Map();
  let loaded=false, resolveReady, rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const atlas=new T.TextureLoader().load(new URL("../assets/pixel/material-book.png",import.meta.url).href,
    texture=>{loaded=true;resolveReady(texture);},undefined,rejectReady);
  ready.catch(error=>console.error("Native Pixelorama texture failed to load:",error));
  atlas.minFilter=atlas.magFilter=T.NearestFilter;
  atlas.generateMipmaps=false; atlas.flipY=false;
  atlas.colorSpace=T.SRGBColorSpace;
  textures.set("native-book",atlas);
  const tone={value:new T.Color("#ffffff")};
  function texture(){return atlas;}
  const rect=(name)=>{const f=NATIVE_BOOK[name];return new T.Vector4(f.x/512,f.y/512,f.width/512,f.height/512);};
  function mat(color,kind="paint"){
    const key=color+":"+kind;
    if(cache.has(key))return cache.get(key);
    const name=nativeField(kind), f=NATIVE_BOOK[name],
      wind=/^(leaf|cactus)/.test(kind),
      vessel=f.mode==="vessel",
      indoor=/^(room-|skin|hair|actor-cloth|light)/.test(kind);
    const material=new T.MeshBasicMaterial({color,map:atlas,alphaTest:kind==="leaf-split"||kind.startsWith("weapon-")?.5:0});
    material.userData.kind=kind;
    material.userData.nativeField=name;
    material.defaultAttributeValues={...material.defaultAttributeValues,
      paintSeed:[0],paintInterior:[0]};
    material.extensions={...material.extensions,derivatives:true};
    material.onBeforeCompile=(shader)=>{
      Object.assign(shader.uniforms,{
        atlasRect:{value:rect(name)},innerRect:{value:rect(vessel?name+"-interior":name)},
        vesselField:{value:vessel?1:0},chartOrigin:{value:new T.Vector2(16,kind.startsWith("weapon-")?16:1)},pixelTone:tone,
        surfaceWet:weather.wet, wetFactor:{value:indoor?0:/soil/.test(kind)?.24:/wood|clay|vessel|wicker/.test(kind)?.16:.09},
      });
      shader.vertexShader="attribute float paintSeed; attribute float paintInterior; varying vec3 paintPoint; varying vec3 paintNormal; varying float interiorField; varying float pigmentSeed;\n"+shader.vertexShader;
      shader.fragmentShader="uniform vec4 atlasRect; uniform vec4 innerRect; uniform float vesselField; uniform vec2 chartOrigin; uniform vec3 pixelTone; uniform float surfaceWet; uniform float wetFactor; varying vec3 paintPoint; varying vec3 paintNormal; varying float interiorField; varying float pigmentSeed;\n"+shader.fragmentShader;
      let vertex=`#include <begin_vertex>
vec3 rootScale=max(vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz)),vec3(.00001));
paintPoint=position*rootScale;
paintNormal=normal/rootScale;
#ifdef USE_INSTANCING
paintPoint=(instanceMatrix*vec4(position,1.)).xyz*rootScale;
vec3 instanceScale=max(vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz)),vec3(.00001));
paintNormal=(mat3(instanceMatrix)*(normal/(instanceScale*instanceScale)))/rootScale;
#endif
paintNormal=normalize(paintNormal); interiorField=paintInterior; pigmentSeed=paintSeed;`;
      if(wind){
        shader.uniforms.leafTime=windTime;shader.uniforms.leafWind=windPower;
        shader.vertexShader="uniform float leafTime; uniform float leafWind;\n"+shader.vertexShader;
        vertex+=`\n#ifdef USE_INSTANCING
transformed.x+=sin(leafTime*1.8+instanceMatrix[3].x*1.5+instanceMatrix[3].z)*leafWind*${/Rigid|cactus/.test(kind)?".012":".07"}*max(0.0,instanceMatrix[3].y+position.y-.3);
#endif`;
      }
      shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>",vertex);
      shader.fragmentShader=shader.fragmentShader.replace("void main() {",`
vec3 foldedNormal(){
 vec3 n=normalize(cross(dFdx(paintPoint),dFdy(paintPoint)));
 return dot(n,paintNormal)<0.?-n:n;
}
vec2 unfoldedPoint(){
 vec3 n=foldedNormal();
 vec3 tangent=normalize(abs(n.y)>.98?vec3(1.,0.,0.):cross(vec3(0.,1.,0.),n));
 return vec2(dot(paintPoint,tangent),dot(paintPoint,normalize(cross(n,tangent))));
}
vec2 bookUv(vec2 cell,vec4 area){
 return area.xy+(clamp(cell,vec2(.5/32.),vec2(31.5/32.)))*area.zw;
}
void main() {`);
      shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`
${T.ShaderChunk.color_fragment}
#ifdef USE_MAP
 vec2 plane=unfoldedPoint();
 vec2 origin=chartOrigin;
 if(vesselField>.5){
  vec3 n=foldedNormal();
  float facet=floor((atan(n.z,n.x)+3.14159265)/(.25*3.14159265));
  origin.x=3.+2.*mod(facet,8.);
 }
 vec2 pixel=mod(floor(plane*8.0+origin),32.);
 vec2 cell=vec2((pixel.x+.5)/32.,(31.-pixel.y+.5)/32.);
 vec4 area=atlasRect;
 if(vesselField>.5 && interiorField>.5)area=innerRect;
 vec4 painted=texture2D(map,bookUv(cell,area));
 float chroma=max(max(painted.r,painted.g),painted.b)-min(min(painted.r,painted.g),painted.b);
 diffuseColor.rgb=chroma>.001?painted.rgb:diffuseColor.rgb*painted.rgb;
 diffuseColor.a*=painted.a;
#endif`);
      // Color is applied before selecting pigment, exactly once per instance.
      shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`
vec3 n=foldedNormal();
float face=n.y>.7?1.:n.y<-.7?.52:abs(n.x)>abs(n.z)?.66:.82;
diffuseColor.rgb*=face*pixelTone*(1.-surfaceWet*wetFactor);`);
    };
    material.customProgramCacheKey=()=>"native-pixelorama-metric-v2-"+(wind?(/Rigid|cactus/.test(kind)?"rigid":"leaf"):"static");
    cache.set(key,material);return material;
  }
  function updateAtmosphere(a,indoor=false){
    const night=Math.max(0,Math.min(1,a.night||0));
    tone.value.set(indoor?"#fff4db":"#ffffff");
    if(!indoor)tone.value.lerp(new T.Color("#8ca0b6"),night*.58).multiplyScalar(1-night*.33);
  }
  return {mat,cache,textures,texture,tone,ready,get loaded(){return loaded;},updateAtmosphere};
}
