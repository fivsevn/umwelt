// Deployment-only URL transform. Never rename assets or alter navigation URLs.
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function stampAssets(directory,sha){
 if(!/^[a-f0-9]{40}$/i.test(sha))throw new Error('A full commit SHA is required');
 const root=resolve(directory);let count=0;
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=resolve(dir,entry.name);
  if(entry.isDirectory()){await walk(file);continue}
  if(!['.html','.css','.js','.mjs'].includes(extname(file)))continue;
  let source=await readFile(file,'utf8');
  // Quoted static URLs and unquoted CSS url(). Only known asset extensions qualify.
  const pattern=/(?:(["'`])([^"'`\s<>]+)\1|url\(([^\s)'"`]+)\))/g;
  const matches=[...source.matchAll(pattern)];
  for(const m of matches.reverse()){
   const url=m[2]||m[3];
   if(/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url)||url.includes('${'))continue;
   const parsed=new URL(url,'https://assets.invalid/');
   if(!/\.(?:m?js|css|woff2?|ttf|png|svg|jpe?g|webp|gif|ico|md)$/.test(parsed.pathname))continue;
   const path=url.split(/[?#]/)[0];
   const target=path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path);
   if(relative(root,target).startsWith('..'))throw new Error(`Asset escapes artifact: ${url}`);
   // Bare strings can be copy or filename fragments; only real files are asset URLs.
   const exists=await stat(target).then(s=>s.isFile(),()=>false);
   if(!exists){if(path.startsWith('./')||path.startsWith('../'))throw new Error(`Missing asset ${file}: ${url}`);continue}
   parsed.searchParams.set('v',sha);
   const stamped=path+parsed.search+parsed.hash;
   const replacement=m[1]?m[1]+stamped+m[1]:`url(${stamped})`;
   source=source.slice(0,m.index)+replacement+source.slice(m.index+m[0].length);count++;
  }
  await writeFile(file,source);
 }}
 await walk(root);return count;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 console.log(`[assets] stamped ${await stampAssets(process.argv[2]||'_site',process.argv[3]||process.env.GITHUB_SHA||'')} URLs`);
}
