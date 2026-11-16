export const geometry = {
  "screen": [
    262,
    355,
    557,
    754
  ],
  "bezel": [
    202,
    297,
    682,
    879
  ],
  "keys": [
    [
      351,
      1267
    ],
    [
      541,
      1284
    ],
    [
      744,
      1262
    ]
  ],
  "keyFaces": [
  "M322 1223 H379 Q383 1223 383 1228 Q383 1232 389 1233 H393 Q398 1233 398 1238 Q398 1242 403 1244 Q407 1244 407 1248 V1273 Q407 1277 402 1278 Q397 1279 396 1284 Q396 1288 391 1288 H388 Q383 1289 382 1294 Q381 1299 377 1299 H325 Q321 1299 320 1294 Q319 1289 314 1288 H309 Q305 1288 305 1284 Q304 1279 299 1278 Q293 1277 293 1273 V1248 Q293 1244 298 1243 Q303 1242 304 1238 Q304 1233 309 1233 H313 Q319 1232 319 1227 Q319 1223 322 1223 Z",
  "M509 1236 H574 Q578 1236 578 1241 Q578 1245 585 1246 H588 Q592 1246 593 1250 Q593 1255 598 1256 Q603 1257 604 1262 V1289 Q604 1295 598 1296 Q593 1297 592 1301 V1304 Q592 1308 586 1309 H581 Q575 1310 574 1315 Q574 1318 570 1318 H513 Q510 1318 509 1314 Q508 1310 501 1309 H497 Q491 1309 491 1304 V1301 Q491 1297 486 1297 Q479 1296 479 1291 V1263 Q479 1258 484 1257 Q490 1256 490 1251 Q491 1247 496 1246 H500 Q505 1245 505 1241 Q505 1236 509 1236 Z",
  "M715 1221 H772 Q776 1221 776 1226 Q776 1230 782 1231 H786 Q791 1231 791 1236 Q791 1240 796 1242 Q800 1242 800 1246 V1271 Q800 1275 795 1276 Q790 1277 789 1282 Q789 1286 784 1286 H781 Q776 1287 775 1292 Q774 1297 770 1297 H718 Q714 1297 713 1292 Q712 1287 707 1286 H702 Q698 1286 698 1282 Q697 1277 692 1276 Q686 1275 686 1271 V1246 Q686 1242 691 1241 Q696 1240 697 1236 Q697 1231 702 1231 H706 Q712 1230 712 1225 Q712 1221 715 1221 Z"
],
  "keySizes": [
    {
      "width": 133.5,
      "height": 98.25
    },
    {
      "width": 153,
      "height": 113.25
    },
    {
      "width": 133.5,
      "height": 98.25
    }
  ],
  "bodyScale": 0.95,
  "origin": [
    512,
    820
  ],
  "topPad": 160,
  "canvas": [
    1280,
    1696
  ],
  "shellCanvas": [
    1024,
    1536
  ],
  "eyelet": [
    807,
    244
  ],
  "socket": [
    253,
    167.318
  ],
  "rigWidth": 560
};

export function frontStrandMask(fit){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="1120" viewBox="0 0 560 1120"><path fill="white" fill-rule="evenodd" d="M0 0H560V1120H0Z ${fit.rear}"/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Key faces use absolute M/H/V/Q/Z coordinates on the shared shell artwork.
// Keep the same outline in the small button surface instead of clipping a full shell.
export function localKeyFace(index){
 const [x,y]=geometry.keys[index],{width,height}=geometry.keySizes[index];
 const offset=[x-width/2,y-height/2];
 return geometry.keyFaces[index].replace(/([MHVQLZ])([^MHVQLZ]*)/g,(_,command,values)=>{
  let coordinate=0;
  return command+values.replace(/-?\d+(?:\.\d+)?/g,value=>{
   const axis=command==='H'?0:command==='V'?1:coordinate++%2;
   return Number((Number(value)-offset[axis]).toFixed(3));
  });
 });
}
