// Original faceted street props. Large silhouette planes carry the construction;
// sparse pixel panels carry seams and fittings, sharing the garden's paint system.
export function carShell(T, rings) {
  const positions=[], uvs=[];
  const face=(points,uv=[[0,0],[1,0],[1,1],[0,1]])=>{
    for(const k of [0,1,2,0,2,3]) {positions.push(...points[k]);uvs.push(...uv[k]);}
  };
  const corners=([w,y,front,back])=>[[-w/2,y,front],[w/2,y,front],[w/2,y,back],[-w/2,y,back]];
  const bottom=corners(rings[0]),top=corners(rings.at(-1));
  face([...bottom].reverse());face(top);
  for(let j=1;j<rings.length;j++) {
    const a=corners(rings[j-1]),b=corners(rings[j]);
    for(let k=0;k<4;k++)face([a[k],a[(k+1)%4],b[(k+1)%4],b[k]]);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  g.computeVertexNormals();g.userData.transient=true;return g;
}

const carGeometryCache=new WeakMap();
export function buildStreetCar(api, parent, color) {
  const {T,box,cyl,group,surface}=api;
  // One immutable source per shape. The normal scene compiler owns the GPU
  // attributes and instances every car's paint and transform from these sources.
  let cache=carGeometryCache.get(T);if(!cache)carGeometryCache.set(T,cache=new Map());
  const geometry=(key,create)=>{if(!cache.has(key))cache.set(key,create());return cache.get(key);};
  const mesh=(geometry,ink,kind)=>surface(parent,geometry,0,0,0,1,1,1,ink,kind);
  mesh(geometry('body',()=>carShell(T,[[1.61,.19,1.69,-1.69],[1.76,.32,1.74,-1.74],
    [1.73,.58,1.67,-1.65],[1.55,.66,1.40,-1.47]])),color,'metal');
  mesh(geometry('cabin',()=>carShell(T,[[1.55,.64,.77,-1.08],[1.30,1.04,.37,-.79],
    [1.27,1.095,.34,-.75]])),color,'paint');
  // Sloping glass follows the actual cabin rather than standing on a rectangular box.
  const pane=(points)=>{
    const geo=geometry('glass:'+JSON.stringify(points),()=>{const geometry=new T.BufferGeometry(),positions=[];
    for(const k of[0,1,2,0,2,3])positions.push(...points[k]);
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));
    geometry.computeVertexNormals();geometry.userData.transient=true;
    return geometry;});mesh(geo,'#ffffff','panel-glass');
  };
  pane([[-.70,.694,.746],[.70,.694,.746],[.59,1.022,.42],[-.59,1.022,.42]]);
  pane([[.69,.687,-1.077],[-.69,.687,-1.077],[-.59,1.023,-.822],[.59,1.023,-.822]]);
  for(const side of[-1,1]) {
    const x=side;
    const sidePane=points=>pane(side>0?points:[...points].reverse());
    sidePane([[x*.777,.685,.682],[x*.777,.685,-.035],[x*.651,1.015,-.035],[x*.651,1.015,.323]]);
    sidePane([[x*.777,.685,-.091],[x*.777,.685,-1.026],[x*.651,1.015,-.738],[x*.651,1.015,-.091]]);
    box(parent,x*.778,.85,-.063,.035,.37,.056,'#253843','metal',0,0,-side*.33);
    box(parent,x*.801,.653,-.12,.027,.025,1.78,'#c3c9c6','metal');
    // Door seams, inset handle and restrained broad wear: painted at 64 texels.
    const doorGeo=geometry('doors',()=>new T.PlaneGeometry(1.67,.35));
    const doors=group(parent,side*.879,.443,-.11);doors.rotation.y=side*Math.PI/2;
    surface(doors,doorGeo,0,0,0,1,1,1,color,'livery-car');
    box(parent,x*.884,.31,0,.037,.07,3.09,'#283541','metal');
    box(parent,x*.839,.82,.46,.16,.11,.23,'#26333c','metal');
    box(parent,x*.929,.835,.46,.016,.066,.16,'#a6c1c6','metal');
    for(const z of[-1.09,1.04]) {
      const wheel=group(parent,x*.856,.265,z);wheel.rotation.z=-side*Math.PI/2;
      cyl(wheel,0,0,0,.31,.31,.165,'#20272e',12,'paint');
      cyl(wheel,0,.089,0,.219,.219,.019,'#8a98a3',12,'metal');
      cyl(wheel,0,.101,0,.081,.081,.026,'#c8d2d1',8,'metal');
      for(let k=0;k<6;k++) {
        const a=k*Math.PI/3;
        box(wheel,Math.cos(a)*.146,.105,Math.sin(a)*.146,.046,.012,.11,'#283642','metal',0,-a,0);
      }
    }
    box(parent,x*.62,.51,1.717,.31,.14,.034,'#dbe6e5','enamel');
    box(parent,x*.791,.51,1.692,.07,.13,.043,'#c38339','paint');
    box(parent,x*.60,.51,-1.703,.35,.13,.035,'#9b4038','paint');
  }
  for(const sign of[-1,1]) {
    box(parent,0,.312,sign*1.755,1.65,.091,.068,'#25323c','metal');
    box(parent,0,.362,sign*1.763,1.58,.035,.027,'#bbc5c7','metal');
  }
  box(parent,0,.508,1.725,.73,.135,.031,'#25333a','metal');
  for(const y of[.477,.512,.547])box(parent,0,y,1.748,.68,.013,.015,'#a3b5bd','metal');
  box(parent,0,.269,1.794,.41,.131,.024,'#e4e5da','enamel');
  for(const x of[-.13,-.06,.035,.12])box(parent,x,.267,1.81,.024,.057,.009,'#303e49','paint');
}

export function buildStreetLantern(api,parent) {
  const {box,cyl,beam,P}=api,ink='#2b4058';
  cyl(parent,0,.10,0,.19,.24,.20,ink,8,'metal');
  cyl(parent,0,1.78,0,.052,.082,3.37,ink,8,'metal');
  cyl(parent,0,.37,0,.13,.18,.33,ink,8,'metal');
  cyl(parent,0,1.28,0,.12,.09,.26,'#344d67',8,'metal');
  cyl(parent,0,2.69,0,.095,.145,.23,ink,8,'metal');
  for(const y of[.28,.58,.72,1.09,1.45,2.13,2.57,2.83,3.16])
    cyl(parent,0,y,0,.10,.12,.055,'#445e77',8,'metal');
  for(const x of[-.067,.067])box(parent,x,1.81,0,.028,.55,.05,'#3b536b','metal');
  box(parent,.15,2.91,0,.17,.08,.08,ink,'metal');
  cyl(parent,0,3.35,0,.20,.15,.13,ink,8,'metal');
  box(parent,0,3.63,0,.30,.48,.30,'#d0c776','light');
  for(const x of[-.18,.18])for(const z of[-.18,.18])
    beam(parent,[x,3.36,z],[x*1.25,3.91,z*1.25],.036,ink);
  cyl(parent,0,3.97,0,.09,.32,.20,ink,4,'metal');
  cyl(parent,0,4.08,0,.06,.10,.09,'#4f6881',8,'metal');
  box(parent,0,3.35,0,.42,.055,.42,P.metalDark,'metal');
}
