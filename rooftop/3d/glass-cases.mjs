export function buildGlassCase(api,g,type,w,d,h) {
 const {T,box,beam,group,P}=api,wood=type==='wardcase',c=wood?'#806544':'#5c8588',kind=wood?'wood':'metal';
 const glass=new T.MeshLambertMaterial({color:'#c3d6cc',transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide,flatShading:true});
 const pane=points=>{const geo=new T.BufferGeometry(),positions=[];for(let j=1;j<points.length-1;j++)positions.push(...points[0],...points[j],...points[j+1]);geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,glass);mesh.receiveShadow=true;g.add(mesh)};
 box(g,0,.065,0,w,.13,d,wood?P.woodDark:'#557778',kind);
 box(g,0,.145,0,w*.91,.025,d*.85,'#716450','soil');
 for(const z of[-d*.48,d*.48])box(g,0,.20,z,w,.14,.065,c,kind);
 for(const x of[-w*.48,w*.48])box(g,x,.20,0,.065,.14,d,c,kind);
 const section=wood?[[-d*.45,.22],[-d*.45,h*.73],[0,h],[d*.45,h*.73],[d*.45,.22]]:
   [[-d*.45,.22],[-d*.45,h*.48],[-d*.37,h*.78],[-d*.21,h*.95],[0,h],[d*.21,h*.95],[d*.37,h*.78],[d*.45,h*.48],[d*.45,.22]];
 for(const x of[-w*.47,w*.47]) {
   pane(section.map(([z,y])=>[x,y,z]));
   for(let j=1;j<section.length;j++)beam(g,[x,section[j-1][1],section[j-1][0]],[x,section[j][1],section[j][0]],wood?.055:.039,c);
 }
 for(let j=1;j<section.length;j++) {
   const [z,y]=section[j],[zz,yy]=section[j-1];
   pane([[-w*.47,y,z],[w*.47,y,z],[w*.47,yy,zz],[-w*.47,yy,zz]]);
   if(wood||j===1||j===section.length-1||j===Math.floor(section.length/2))box(g,0,y,z,w,.043,.043,c,kind);
 }
 if(wood)for(const x of[-w*.25,0,w*.25]){
   beam(g,[x,h*.73,-d*.45],[x,h,0],.045,c);beam(g,[x,h,0],[x,h*.73,d*.45],.045,c);
 }
 else for(const x of[-w*.23,0,w*.23]) {
   for(let j=2;j<section.length-1;j++)beam(g,[x,section[j-1][1],section[j-1][0]],[x,section[j][1],section[j][0]],.026,'#8ba5a0');
 }
 // Hinges and latch connect to the frames; small broken reflections lie on glass.
 for(const x of[-w*.30,w*.30])box(g,x,h*.73,-d*.47,.12,.065,.04,'#adb5a1','metal');
 box(g,0,h*.38,d*.48,.18,.055,.04,'#abb8aa','metal');
 for(const x of[-w*.36,w*.33]){
   box(g,x,h*.50,d*.451,.025,h*.19,.009,'#b1c6b7');
   box(g,x+.031,h*.57,d*.453,.025,h*.10,.008,'#d4dfc9');
 }
 g.userData.cavity={bottom:.16,ceiling:h*.71,w:w*.87,d:d*.80};
}
