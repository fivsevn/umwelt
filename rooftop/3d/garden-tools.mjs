// Construction sketches based on Haws cans, galvanised buckets and GARDENA
// pressure bottles. All curved bodies are closed faceted meshes.
export function buildGardenTool(api,g,type) {
 const {box,beam,cyl,group,profile,ellipsoid,P}=api;
 const ring=(parent,r,y,thickness,col)=>profile(parent,[[r-thickness,y-.015],[r+thickness,y-.015],[r+thickness,y+.015],[r-thickness,y+.015],[r-thickness,y-.015]],24,col,'metal');
 const path=(pts,t,col)=>{for(let j=1;j<pts.length;j++)beam(g,pts[j-1],pts[j],t,col)};
 if(type==='watering') {
   const c='#718b7d';
   const body=group(g,-.15,0,0);body.scale.z=.76;
   profile(body,[[.001,.025],[.28,.025],[.34,.09],[.35,.43],[.30,.50],[.13,.53],[.13,.48],[.28,.43],[.29,.09],[.001,.08],[.001,.025]],24,c,'metal');
   ring(body,.34,.085,.015,'#adc0ac');ring(body,.35,.42,.012,'#8fa99a');ring(body,.14,.526,.015,'#c0c4a8');
   // Long neck connects low on the body, keeping the water path below the filler.
   path([[.15,.12,0],[.35,.22,0],[.78,.46,0],[1.08,.62,0]],.068,c);
   const rose=group(g,1.1,.64,0);rose.rotation.z=-.9;
   cyl(rose,0,0,0,.095,.055,.07,'#a99a69',16,'metal');
   cyl(rose,0,.04,0,.094,.094,.011,'#d4bd86',16,'metal');
   for(let j=0;j<17;j++){const a=j*2.4,rr=Math.sqrt(j/17)*.076;box(rose,Math.cos(a)*rr,.048,Math.sin(a)*rr,.012,.003,.012,'#6d7056')}
   // Two open handles: a rear tipping grip and a carrying arch over the filler.
   path([[-.41,.14,0],[-.61,.18,0],[-.67,.31,0],[-.63,.48,0],[-.42,.48,0]],.041,c);
   path([[-.15,.46,-.22],[-.15,.71,-.19],[-.15,.78,-.08],[-.15,.78,.08],[-.15,.71,.19],[-.15,.46,.22]],.040,c);
   for(const z of[-.23,.23])box(g,-.15,.46,z,.08,.06,.025,'#bcc5b1','metal');
   return true;
 }
 if(type==='bucket') {
   profile(g,[[.001,.025],[.31,.025],[.33,.06],[.43,.65],[.44,.69],[.40,.69],[.39,.64],[.29,.095],[.001,.095],[.001,.025]],24,'#a5b3af','metal');
   ring(g,.43,.68,.023,'#c6cec0');ring(g,.33,.08,.017,'#718b87');
   // Wire bail hinges on riveted ears, with an actual turned wood grip.
   for(const s of[-1,1]){box(g,s*.427,.59,0,.048,.09,.075,'#829a94','metal');box(g,s*.457,.59,0,.020,.03,.03,'#d0d2bd')}
   path([[-.45,.59,0],[-.44,.81,0],[-.31,1.02,0],[-.14,1.10,0],[.14,1.10,0],[.31,1.02,0],[.44,.81,0],[.45,.59,0]],.027,'#c1cdc2');
   const grip=group(g,0,1.10,0);grip.rotation.z=Math.PI/2;cyl(grip,0,0,0,.042,.042,.28,P.woodLight,12,'wood');
   return true;
 }
 if(type==='sprayer') {
   profile(g,[[.001,0],[.24,0],[.32,.05],[.34,.16],[.34,.60],[.31,.76],[.20,.82],[.001,.82],[.001,0]],24,'#c6cdbb','enamel');
   ring(g,.33,.09,.009,'#93a99c');
   cyl(g,0,.855,0,.23,.23,.10,'#466b6d',16,'metal');
   cyl(g,0,.982,0,.044,.044,.17,'#afb9af',12,'metal');
   box(g,0,1.08,0,.27,.055,.10,'#9d7852','paint');
   // Pump grip, nozzle and trigger are separate and connected to the cap.
   path([[-.20,.89,0],[-.39,.89,0],[-.39,.67,0],[-.28,.60,0]],.073,'#426669');
   box(g,-.31,.952,0,.20,.047,.09,'#b8905e');
   beam(g,[.16,.88,0],[.43,.91,0],.065,'#739690');
   const nozzle=group(g,.46,.91,0);nozzle.rotation.z=-Math.PI/2;cyl(nozzle,0,0,0,.043,.052,.09,'#c1a274',12,'metal');
   box(g,0,.43,.342,.055,.44,.012,'#8da698');
   for(let j=0;j<5;j++)box(g,.045,.24+j*.075,.342,j%2?.045:.075,.012,.012,'#566f6a');
   return true;
 }
 return false;
}
