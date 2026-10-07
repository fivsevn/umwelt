// Profiles and pigments drawn from the makers listed in docs/rooftop-art-sources.md.
// Height is relative to the mouth radius: shallow dishes, bowls and jars stay distinct.
export const VESSEL_ART = {
 tokoname:{height:.47,foot:.10,shape:'oval',body:'#a36343',rim:'#b8794e',profile:[[.71,0],[.75,.09],[.88,.55],[1,1]],sides:24},
 shigaraki:{height:1.03,body:'#b59a78',rim:'#c8ad85',profile:[[.45,0],[.61,.10],[.85,.42],[.97,.76],[1,1]],sides:24},
 bizen:{height:1.24,body:'#925541',rim:'#9e694c',profile:[[.56,0],[.74,.10],[1,.42],[.97,.66],[.83,.86],[.79,1]],sides:24},
 mashiko:{height:.93,body:'#6a4f3c',rim:'#c0a78d',profile:[[.48,0],[.60,.10],[.81,.50],[1,1]],sides:32,shape:'fluted'},
 kasama:{height:1.13,body:'#679484',rim:'#9fb8a1',profile:[[.83,0],[.89,.08],[.95,.47],[.94,.90],[.96,1]],sides:24},
 mino:{height:.70,foot:.12,body:'#476958',rim:'#658774',shape:'square',sides:24,profile:[[.69,0],[.78,.15],[.97,.87],[1,1]]},
 seto:{height:.69,foot:.09,body:'#ded8c5',rim:'#e9dfc8',profile:[[.42,0],[.59,.11],[.86,.45],[1,1]],sides:24},
 kutani:{height:.32,foot:.06,shape:'mokko',body:'#e1d5ae',rim:'#d9b561',profile:[[.75,0],[.89,.18],[1,1]],sides:32},
 arita:{height:.64,foot:.08,shape:'scallop',body:'#e1e3d9',rim:'#f0ecda',profile:[[.39,0],[.54,.10],[.81,.45],[1,1]],sides:40},
 imari:{height:.77,foot:.16,body:'#e0dbcb',rim:'#4c7183',profile:[[.47,0],[.60,.14],[.91,.64],[1,1]],sides:32},
 hasami:{height:1.00,foot:.04,body:'#e3ded0',rim:'#e5dfcd',profile:[[.65,0],[.71,.12],[.87,.62],[1,1]],sides:32},
 kyoto:{height:.49,foot:.35,shape:'scallop',body:'#d5b46a',rim:'#e7c987',profile:[[.33,0],[.56,.12],[.88,.55],[1,1]],sides:40},
 hagi:{height:.59,foot:.32,shape:'scallop',body:'#bdc6c0',rim:'#dbd6ca',profile:[[.43,0],[.60,.11],[.82,.44],[1,1]],sides:40},
 karatsu:{height:.64,foot:.12,body:'#c4b694',rim:'#d2c5a8',profile:[[.40,0],[.60,.14],[.88,.53],[1,1]],sides:24},
 tobe:{height:.83,foot:.09,body:'#e0dccb',rim:'#eae4d5',profile:[[.41,0],[.61,.12],[.87,.53],[.98,.86],[1,1]],sides:32,rolled:true},
 koishiwara:{height:.81,foot:.07,body:'#c7b995',rim:'#b09b7a',profile:[[.47,0],[.60,.13],[.78,.52],[1,1]],sides:32},
 ontayaki:{height:.96,foot:.06,body:'#906d52',rim:'#b7a384',profile:[[.62,0],[.83,.10],[1,.42],[.98,.70],[.83,1]],sides:16},
 iga:{height:.86,foot:.07,shape:'irregular',body:'#8c947b',rim:'#b4ad8a',profile:[[.60,0],[.79,.15],[1,.49],[.94,.85],[.96,1]],sides:24},
 echizen:{height:1.39,body:'#805747',rim:'#8e634d',profile:[[.58,0],[.71,.08],[1,.38],[.95,.68],[.75,.85],[.72,1]],sides:24},
 tsuboya:{height:.94,foot:.10,body:'#cfbd94',rim:'#e0cda6',profile:[[.44,0],[.64,.12],[.89,.56],[.98,.88],[1,1]],sides:32,rolled:true},
 terra:{height:1.02,body:'#b0714e',rim:'#c28b60',profile:[[.65,0],[.70,.07],[.93,.86],[1,1]],sides:24},
 plastic:{height:1.04,body:'#485b54',rim:'#637a6a',profile:[[.69,0],[.74,.08],[.96,.90],[1,1]],sides:24},
 white:{height:.99,body:'#d7d7cb',rim:'#eeead8',profile:[[.74,0],[.77,.06],[.97,.92],[1,1]],sides:24},
 shallow:{height:.43,body:'#a17c52',rim:'#c49b69',profile:[[.73,0],[.84,.14],[1,1]],sides:24},
 deep:{height:1.55,body:'#976348',rim:'#b78a62',profile:[[.65,0],[.70,.08],[.97,.93],[1,1]],sides:24},
 basket:{height:.74,body:'#a18860',rim:'#c3a77b',profile:[[.62,0],[.79,.22],[1,1]],sides:24},
};

Object.assign(VESSEL_ART, {
 'antique-shino':{height:.43,foot:.06,body:'#dfd5c0',rim:'#eadbc1',shape:'irregular',sides:32,profile:[[.61,0],[.72,.11],[.96,.62],[1,1]],interiorPaint:true},
 'antique-nezumi':{height:.57,foot:.16,feet:3,body:'#956050',rim:'#a7755c',shape:'square',sides:32,profile:[[.45,0],[.64,.20],[1,.72],[1,1],[.95,1.03]],interiorPaint:true},
 'antique-shino-square':{height:.59,foot:.09,body:'#dbcba9',rim:'#eadbb6',shape:'square',sides:32,profile:[[.68,0],[.84,.20],[1,.83],[.98,1]],interiorPaint:true},
 'antique-nabeshima':{height:.90,foot:.13,body:'#e1e4d9',rim:'#d5ddcf',sides:8,profile:[[.43,0],[.60,.09],[.85,.44],[1,1]],interiorPaint:true},
 'antique-nabeshima-dish':{height:.38,foot:.11,body:'#e1e5dc',rim:'#4e7592',sides:32,profile:[[.48,0],[.68,.08],[.92,.58],[1,1]],interiorPaint:true},
 'antique-kutani-red':{height:.62,foot:.09,body:'#d4b687',rim:'#c5a55b',sides:32,profile:[[.40,0],[.62,.11],[.88,.52],[1,1]],interiorPaint:true},
 'antique-celadon':{height:.43,foot:.18,feet:3,body:'#9dc2ae',rim:'#bbd5b8',shape:'scallop',sides:40,profile:[[.63,0],[.83,.19],[.98,.80],[1,1]]},
 'antique-oribe-jar':{height:1.86,body:'#d1c7b1',rim:'#6f6452',shape:'irregular',sides:32,profile:[[.63,0],[.69,.07],[.96,.30],[1,.51],[.88,.66],[.49,.77],[.40,.94],[.45,1]]},
});

// Pixel marks run around the exterior. The top two and last four rows stay
// unpainted so the inner wall and rolled lip have their own quiet glaze.
export function vesselPainting(id) {
 const commands=[[0,0,64,64,3]], add=(x,y,w,h,ink)=>commands.push([x,y,w,h,ink]);
 const ramp=['#000000','#404040','#808080','#bfbfbf','#ffffff','#3d617c','#7a958c','#aa5f45','#527254'];
 // Wheel rings, glaze pooling and orderly sparse dither, rather than full noise.
 for(let x=0;x<64;x+=2) for(let y=12;y<56;y+=2)
   if((x*3+y*7)%31<3) add(x,y,1,1,y>42?2:4);
 add(0,51,64,1,2); add(0,53,64,1,1);
 // Firing clouds, throwing rings and rim wear on unglazed pottery. Large marks
 // describe the curved surface; the tiny dots above are only its fine grain.
 if(['terra','deep','shallow','tokoname','bizen','echizen'].includes(id)) {
   for(const [x,y,w,h,ink] of [[3,18,12,7,2],[28,30,18,9,2],[48,17,13,5,4],
     [9,43,17,5,1],[37,46,15,4,2],[19,21,16,2,4],[2,36,10,2,4]]) {
     add(x,y,w,h,ink);add(x+3,y-2,Math.max(2,w-7),2,ink);
   }
   add(0,13,64,1,4);add(0,15,64,1,2);
   for(let x=0;x<64;x+=16){add(x+3,26,10,1,2);add(x+5,40,9,1,2);}
 }
 const path=(pts,ink,width=1)=>{for(let j=1;j<pts.length;j++){
   const [x,y]=pts[j-1],[xx,yy]=pts[j],n=Math.max(Math.abs(xx-x),Math.abs(yy-y));
   for(let k=0;k<=n;k++) add(Math.round(x+(xx-x)*k/Math.max(1,n)),Math.round(y+(yy-y)*k/Math.max(1,n)),width,width,ink);
 }};
 const sprig=(x,y,ink)=>{path([[x,y+19],[x+2,y+10],[x,y]],ink);for(let j=0;j<3;j++){path([[x+1,y+5+j*5],[x-4,y+2+j*5]],ink);path([[x+1,y+9+j*4],[x+6,y+5+j*4]],ink)}};
 if(id==='antique-kutani-red') {
   ramp[5]='#a8503a';ramp[6]='#c3a356';ramp[7]='#ece0b4';ramp[8]='#78583a';
   add(0,13,64,37,5);for(let x=0;x<64;x+=8){path([[x,14],[x+4,19],[x+8,14]],6);path([[x,48],[x+4,43],[x+8,48]],6);sprig(x+4,22,6);add(x+1,29,2,2,7)}
   for(let y=20;y<43;y+=7)add(0,y,64,1,6);
 } else if(id==='antique-nabeshima-dish') {
   for(let x=0;x<64;x+=8){path([[x,14],[x+4,20],[x+8,14]],5,2);path([[x,45],[x+4,39],[x+8,45]],5,2);for(let y=24;y<37;y+=4){add(x,y,3,2,5);add(x+4,y+2,3,2,5)}}
   for(const y of[11,22,38,49])add(0,y,64,1,5);
 } else if(id==='antique-nabeshima') {
   ramp[7]='#b96751';ramp[8]='#6b8b62';
   for(let x=0;x<64;x+=8){sprig(x+4,24,8);for(const [dx,dy]of[[0,0],[3,3],[-3,3],[0,6]])add(x+3+dx,18+dy,3,3,7);add(x+4,22,2,2,4)}
   add(0,12,64,1,5);add(0,48,64,1,5);
 } else if(['antique-shino','antique-shino-square','antique-oribe-jar','antique-nezumi'].includes(id)) {
   ramp[5]=id==='antique-nezumi'?'#e2d2ac':'#73523b';
   for(let x=3;x<64;x+=19){sprig(x+6,21,5);if(id==='antique-nezumi')path([[x,17],[x+10,17],[x+10,43],[x,43],[x,17]],5,2)}
   if(id==='antique-oribe-jar')for(const y of[12,14,21,27,29])add(0,y,64,1,1);
   for(let j=0;j<34;j++)add((j*13)%64,11+(j*7)%40,1,1,j%4?2:7);
 } else if(id==='antique-celadon') {
   ramp[5]='#739b85';for(let x=4;x<64;x+=20){path([[x,39],[x+9,24],[x+17,39],[x+17,46],[x,46],[x,39]],5);for(let j=0;j<4;j++)add(x+3+j*3,39,1,6,5)}
 } else if(['seto','tobe'].includes(id)) {
   for(let x=1;x<64;x+=16){path([[x+1,43],[x+4,37],[x+3,27],[x+9,22],[x+14,27],[x+12,32],[x+8,30]],5,2);
     for(const [dx,yy]of[[3,31],[10,37],[2,45]]){path([[x+dx,yy],[x+dx+4,yy-3],[x+dx+6,yy],[x+dx+3,yy+2],[x+dx,yy]],5)}}
   add(0,11,64,2,5);add(0,49,64,2,5);
 } else if(id==='kutani') {
   for(let x=0;x<64;x+=16){sprig(x+8,22,8);add(x+2,36,4,3,7);add(x+2,35,4,1,5);add(x+11,31,3,3,7);add(x+10,30,5,1,5)}
   add(0,13,64,1,7); add(0,47,64,1,7);
 } else if(id==='imari') {
   for(let x=0;x<64;x+=16){add(x+1,15,2,31,5);add(x+13,15,2,31,5);sprig(x+7,22,(x/16)%2?7:5);path([[x+3,17],[x+8,21],[x+12,17]],7)}
   add(0,12,64,2,5);add(0,48,64,2,5);
 } else if(id==='hasami') {
   for(let x=1;x<64;x+=4){add(x,14,1,35,5);add(x+1,16,1,30,6)}
   add(0,11,64,1,5);
 } else if(id==='karatsu') {
   ramp[5]='#675444';for(let x=4;x<64;x+=21){path([[x,45],[x+6,22],[x+8,18]],5);path([[x+2,40],[x-2,29]],5);path([[x+3,38],[x+13,29]],5);add(x+6,20,3,1,5)}
 } else if(id==='koishiwara') {
   ramp[5]='#725f4b';for(let y=16;y<50;y+=6)for(let x=1;x<64;x+=5)path([[x,y+2],[x+2,y]],5);
 } else if(id==='mino') {
   ramp[8]='#284f42';add(0,9,31,38,8);for(let x=2;x<29;x+=5)add(x,43,3,(x%4)+4,8);
   for(let x=34;x<64;x+=15){path([[x,20],[x+9,25],[x,30],[x+9,35],[x,40]],5,2)}
 } else if(['bizen','echizen'].includes(id)) {
   for(let x=3;x<64;x+=17){path([[x,13],[x+6,26],[x+5,40],[x+9,49]],7,3);path([[x+3,18],[x+6,28],[x+8,45]],4)}
   if(id==='echizen')for(let y=15;y<45;y+=9)add(0,y,64,1,2);
 } else if(['kasama','ontayaki','iga','hagi','mashiko'].includes(id)) {
   for(let x=0;x<64;x+=8){const bottom=22+(x*7)%21;add(x,10,5,bottom-10,id==='mashiko'?4:6);add(x+1,bottom,2,3,id==='iga'?8:2)}
   if(id==='hagi'){ramp[6]='#afc2c2';ramp[7]='#b0a2a9';for(let x=5;x<64;x+=13)add(x,29,4,8,7)}
   if(id==='mashiko')for(let x=0;x<64;x+=4)add(x,13,1,38,1);
 } else if(id==='kyoto') {
   for(let x=0;x<64;x+=6){add(x,10,1,38,2);add(x+1,12,1,35,4)}
 } else if(id==='arita') {
   for(let x=0;x<64;x+=6){add(x,9,1,40,2);add(x+1,11,1,36,4)}
 } else if(id==='tsuboya') {
   for(let x=2;x<64;x+=16){sprig(x+6,21,5);path([[x+1,45],[x+12,36]],8,3)}
   add(0,14,64,2,5);add(0,48,64,2,5);
 } else if(id==='shigaraki') {
   for(let j=0;j<80;j++)add((j*23)%64,12+(j*17)%41,j%3?1:2,1,j%4?2:0);
 } else if(id==='basket') {
   for(let y=10;y<53;y+=4)for(let x=0;x<64;x+=4){add(x,y,3,1,4);add(x+3,y+1,1,3,1);add(x,y+3,3,1,2)}
 } else if(id==='plastic') {
   add(0,10,64,3,1);for(let x=1;x<64;x+=8){add(x,17,1,31,2);add(x+1,17,1,31,4)}
 }
 return {size:64,ramp,commands};
}
