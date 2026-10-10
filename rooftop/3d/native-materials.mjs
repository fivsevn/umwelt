import { retroField, retroRect } from "./retro-surfaces.mjs";
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

// Native Pixelorama textures shared by the software-authored assets and the
// plant/weapon assets awaiting a later batch. The runtime never paints a canvas.
// In-plane metric sampling makes each visible cell a 1/8 world-unit square,
// including scaled instances and sloping folded surfaces.
export function createPixelMaterials(T, windTime, windPower, weather={wet:{value:0},rain:{value:0}}) {
  const cache=new Map(), textures=new Map();
  let loaded=false, resolveReady, rejectReady;
  const legacyReady=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const atlas=new T.TextureLoader().load(new URL("../assets/pixel/material-book.png",import.meta.url).href,
    texture=>{resolveReady(texture);},undefined,rejectReady);
  legacyReady.catch(error=>console.error("Native Pixelorama texture failed to load:",error));
  atlas.minFilter=atlas.magFilter=T.NearestFilter;
  atlas.generateMipmaps=false; atlas.flipY=false;
  atlas.colorSpace=T.SRGBColorSpace;
  textures.set("native-book",atlas);
  let resolveRetro, rejectRetro;
  const retroReady=new Promise((resolve,reject)=>{resolveRetro=resolve;rejectRetro=reject;});
  const retroAtlas=new T.TextureLoader().load(new URL("../assets/retro/terrace-surfaces.png",import.meta.url).href,
    resolveRetro,undefined,rejectRetro);
  retroAtlas.minFilter=retroAtlas.magFilter=T.NearestFilter;
  retroAtlas.generateMipmaps=false;retroAtlas.flipY=false;retroAtlas.colorSpace=T.SRGBColorSpace;
  textures.set("retro-surfaces",retroAtlas);
  const ready=Promise.all([legacyReady,retroReady]).then(()=>{loaded=true;});
  ready.catch(error=>console.error("Pixelorama material books failed to load:",error));
  const tone={value:new T.Color("#ffffff")};
  function texture(){return atlas;}
  const rect=(name)=>{const f=NATIVE_BOOK[name];return new T.Vector4(f.x/512,f.y/512,f.width/512,f.height/512);};
  function mat(color,kind="paint"){
    const key=color+":"+kind;
    if(cache.has(key))return cache.get(key);
    const name=nativeField(kind), f=NATIVE_BOOK[name],
      wind=/^(leaf|cactus)/.test(kind),
      vessel=f.mode==="vessel",
      botanical=/^(leaf|cactus|soil|canopy|petal|skin|hair|actor-cloth)/.test(name),
      indoor=/^(room-|skin|hair|actor-cloth|light)/.test(kind);
    const retroName=!vessel && !kind.startsWith("weapon-")?retroField(kind):null,
      tileSize=retroName?64:32;
    const material=new T.MeshBasicMaterial({color,map:retroName?retroAtlas:atlas,alphaTest:kind==="leaf-split"||kind.startsWith("weapon-")?.5:0});
    // Preserve the atmosphere's lamp/window contract on the painted material.
    const glowColor=new T.Color("#000000"),glowPower={value:0};
    material.userData.nativeEmission={color:glowColor,power:glowPower};
    material.userData.kind=kind;
    material.userData.nativeField=name;
    material.userData.retroField=retroName;
    material.defaultAttributeValues={...material.defaultAttributeValues,
      paintSeed:[0],paintInterior:[0]};
    material.extensions={...material.extensions,derivatives:true};
    material.onBeforeCompile=(shader)=>{
      Object.assign(shader.uniforms,{
        atlasRect:{value:retroName?new T.Vector4(...retroRect(retroName)):rect(name)},innerRect:{value:rect(vessel?name+"-interior":name)},fieldSize:{value:tileSize},
        vesselField:{value:vessel?1:0},chartOrigin:{value:new T.Vector2(tileSize/2,botanical||vessel?1:tileSize/2)},metricChart:{value:botanical?0:1},pixelTone:tone,
        glowColor:{value:glowColor},glowPower,
        surfacePigment:{value:retroName?.82:1}, surfaceWet:weather.wet, wetFactor:{value:indoor?0:/soil/.test(kind)?.24:/wood|clay|vessel|wicker/.test(kind)?.16:.09},
      });
      shader.vertexShader="uniform float metricChart; attribute float paintSeed; attribute float paintInterior; varying vec3 paintPoint; varying vec3 paintNormal; varying vec2 paintPlane; varying float paintFacet; varying float interiorField; varying float pigmentSeed;\n"+shader.vertexShader;
      shader.fragmentShader="uniform float metricChart; uniform float surfacePigment; uniform float fieldSize; uniform vec4 atlasRect; uniform vec4 innerRect; uniform float vesselField; uniform vec2 chartOrigin; uniform vec3 pixelTone; uniform vec3 glowColor; uniform float glowPower; uniform float surfaceWet; uniform float wetFactor; varying vec3 paintPoint; varying vec3 paintNormal; varying vec2 paintPlane; varying float paintFacet; varying float interiorField; varying float pigmentSeed;\n"+shader.fragmentShader;
      let vertex=`#include <begin_vertex>
vec3 rootScale=max(vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz)),vec3(.00001));
paintPoint=position*rootScale;
paintNormal=normal/rootScale;
#ifdef USE_INSTANCING
paintPoint=(instanceMatrix*vec4(position,1.)).xyz*rootScale;
vec3 instanceScale=max(vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz)),vec3(.00001));
paintNormal=(mat3(instanceMatrix)*(normal/(instanceScale*instanceScale)))/rootScale;
#endif
// Each non-plant primitive uses its own folded-face chart. Translating the
// object cannot slide the drawing, and two coplanar triangles share one grid.
if(metricChart>.5){
 #ifdef USE_INSTANCING
 paintPoint=(mat3(instanceMatrix)*position)*rootScale;
 #endif
}
paintNormal=normalize(paintNormal);
vec3 chartNormal=normalize(floor(paintNormal*100000.+.5)/100000.);
vec3 chartU=normalize(abs(chartNormal.y)>.98?vec3(1.,0.,0.)-chartNormal*chartNormal.x:cross(vec3(0.,1.,0.),chartNormal));
paintPlane=vec2(dot(paintPoint,chartU),dot(paintPoint,normalize(cross(chartNormal,chartU))));
paintFacet=floor((atan(chartNormal.z,chartNormal.x)+3.14159265+.00001)/(.25*3.14159265));
interiorField=paintInterior; pigmentSeed=paintSeed;`;
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
 vec3 tangent=normalize(abs(n.y)>.98?vec3(1.,0.,0.)-n*n.x:cross(vec3(0.,1.,0.),n));
 return vec2(dot(paintPoint,tangent),dot(paintPoint,normalize(cross(n,tangent))));
}
vec2 bookUv(vec2 cell,vec4 area){
 return area.xy+(clamp(cell,vec2(.5/fieldSize),vec2((fieldSize-.5)/fieldSize)))*area.zw;
}
void main() {`);
      shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`
${T.ShaderChunk.color_fragment}
#ifdef USE_MAP
 vec2 plane=metricChart>.5?paintPlane:unfoldedPoint();
 vec2 origin=chartOrigin;
 if(vesselField>.5){
  float facet=floor(paintFacet+.5);
  origin.x=3.+2.*mod(facet,8.);
 }
 vec2 pixel=mod(floor(plane*8.0+origin),fieldSize);
 vec2 cell=vec2((pixel.x+.5)/fieldSize,(fieldSize-1.-pixel.y+.5)/fieldSize);
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
diffuseColor.rgb*=face*surfacePigment*pixelTone*(1.-surfaceWet*wetFactor);
diffuseColor.rgb=mix(diffuseColor.rgb,max(diffuseColor.rgb,glowColor),clamp(glowPower,0.,1.));`);
    };
    material.customProgramCacheKey=()=>"native-pixelorama-metric-v2-"+(wind?(/Rigid|cactus/.test(kind)?"rigid":"leaf"):"static-retro-v1");
    cache.set(key,material);return material;
  }
  function updateAtmosphere(a,indoor=false){
    const night=Math.max(0,Math.min(1,a.night||0));
    tone.value.set(indoor?"#fff4db":"#ffffff");
    if(!indoor)tone.value.lerp(new T.Color("#8ca0b6"),night*.58).multiplyScalar(1-night*.33);
  }
  return {mat,cache,textures,texture,tone,ready,get loaded(){return loaded;},updateAtmosphere};
}
