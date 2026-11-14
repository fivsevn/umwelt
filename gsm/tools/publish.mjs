import { loadContent, buildFeed, ingestBatch } from './engine/content.js';
try {
  const [command='validate',...args]=process.argv.slice(2), options={};
  let input;
  for (let i=0;i<args.length;i++) {
    const arg=args[i];
    if (['--root','--update','--context'].includes(arg)) {
      if(!args[i+1] || args[i+1].startsWith('--'))throw Error('Missing option value');
      const key=arg==='--root'?'root':'contextPath';
      if(options[key])throw Error('Duplicate option');
      options[key]=args[++i];
    } else if (['--reviewed','--ai','--backfill'].includes(arg) && !options[arg.slice(2)]) options[arg.slice(2)]=true;
    else if (!arg.startsWith('--') && !input) input=arg;
    else throw Error('Unknown or duplicate publishing option');
  }
  if(command==='ingest' && input)console.log(JSON.stringify(await ingestBatch(input,options),null,2));
  else if(['validate','build'].includes(command) && !input && Object.keys(options).every(key=>key==='root')) {
    const feed=command==='build'?await buildFeed(options.root):(await loadContent(options.root)).feed;
    console.log(JSON.stringify({status:command==='build'?'built':'valid',users:feed.users.length,posts:feed.posts.length}));
  } else throw Error('node gsm/tools/publish.mjs validate|build | ingest /outside/operation.json --reviewed --ai');
} catch(error) {console.error(error.message);process.exitCode=1;}
