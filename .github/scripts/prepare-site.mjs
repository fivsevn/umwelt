// Publish tracked runtime files only; local experiments never enter the artifact.
import {execFileSync} from 'node:child_process';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,posix} from 'node:path';
import {pathToFileURL} from 'node:url';
export function publicFile(path){
 return !/^(?:\.git(?:hub|ignore)(?:\/|$)|docs\/|tests\/|isopoda\/(?:tools|dev|docs)\/)/.test(path)
  && !/(?:^|\/)(?:README[^/]*\.md|AGENTS\.md|\.DS_Store)$/.test(path);
}
export async function prepareSite(root,destination){
 root=resolve(root);destination=resolve(destination);
 const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(p=>p&&publicFile(p));
 for(const file of files){const target=resolve(destination,file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(root,file),target)}
 // Discover direct entry dependencies during deployment, before the browser's
 // module parser would discover them. Keep execution order and source untouched.
 for(const file of files.filter(p=>p.endsWith('.html'))){
  const target=resolve(destination,file);let html=await readFile(target,'utf8');const urls=new Set();
  for(const match of html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/g)){
   const entry=posix.normalize(posix.join(posix.dirname(file),match[1]));if(!files.includes(entry))continue;
   const source=await readFile(resolve(root,entry),'utf8');
   for(const dependency of source.matchAll(/\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?["'](\.[^"']+\.(?:mjs|js))["']/g)){
    const path=posix.normalize(posix.join(posix.dirname(entry),dependency[1]));if(!files.includes(path))continue;
    let url=relative(dirname(file),path).split('\\').join('/');if(!url.startsWith('.'))url='./'+url;
    if(!html.includes('href="'+url+'"')&&!html.includes("href='"+url+"'"))urls.add(url);
   }
  }
  html=html.replace('</head>',[...urls].map(url=>`<link rel="modulepreload" href="${url}">`).join('')+'</head>');
  await writeFile(target,html);
 }
 return files.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 console.log(`[site] prepared ${await prepareSite('.',process.argv[2]||'_site')} tracked public files`);
}
