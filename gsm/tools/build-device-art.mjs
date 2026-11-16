// All handset shading and rope joins are baked before deployment. No browser
// canvas, SVG filter tree, or full-image CSS mask is needed to display a device.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {shells,charms} from '../device/catalog.mjs';
import {paintDevice} from './paint-device.mjs';
const destination=resolve(process.argv[2]??'gsm/assets/device-rendered');
await mkdir(destination,{recursive:true});
let bytes=0,count=0;
for(const shell of shells)for(const charm of charms)for(const mobile of [false,true]){
 const output=await paintDevice(shell,charm,mobile);
 await writeFile(resolve(destination,`${shell.id}-${charm.id}-${mobile?'mobile':'desktop'}.webp`),output);
 bytes+=output.length;count++;
}
console.log(`[device] ${count} static WebP appearances, ${(bytes/1024/1024).toFixed(2)} MiB total; each visitor loads one.`);
