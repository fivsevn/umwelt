import {readFile,access} from 'node:fs/promises';
const root=new URL('../morphology/',import.meta.url);
const [page,app,style]=await Promise.all(['index.html','app.mjs','style.css'].map(p=>readFile(new URL(p,root),'utf8')));
const errors=[];
const expect=(condition,message)=>{if(!condition)errors.push(message)};
expect(page.includes('src="./app.mjs"'),'canonical page must load its module directly');
expect(page.includes('href="./style.css"'),'canonical page must load its stylesheet directly');
expect(!/<iframe|srcdoc|<base|<style/i.test(page),'page must not nest documents or inject layout styles');
expect(app.includes('speciesCount=SPECIES.length'),'specimen counts must come from the registry');
expect(app.includes("from '../species-registry.mjs'"),'page must use the shared species registry');
expect(!/!important|nth-child|@import/.test(style),'layout must not depend on override stacks or positional patches');
expect(style.includes('.dossier')&&style.includes("'inspector' 'viewer' 'layers' 'dossier' 'references'"),'narrow reading order and dossier styling must be explicit');
for(const asset of [...style.matchAll(/url\(['"]?([^)'"\s]+)/g)]){
 try{await access(new URL(asset[1],root))}catch{errors.push(`missing stylesheet asset: ${asset[1]}`)}
}
if(errors.length){for(const error of errors)console.error(`[morphology page] ${error}`);process.exitCode=1}
else console.log('[morphology page] OK — direct document, shared registry, canonical assets and two-state layout.');
