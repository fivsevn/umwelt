import { prepareUpdate, finishUpdate, cancelUpdate, suggestUpdatePresentation, suggestUpdateReplies, briefUpdatePost, checkpointUpdate } from './engine/operations.js';
import { refreshIntake } from './engine/intake-refresh.js';
try {
  const [command, ...args] = process.argv.slice(2);
  const options = {}, seen = new Set();
  const usage = 'node gsm/tools/update.mjs prepare|finish|cancel|suggest|replies|brief|checkpoint [--work PATH] [--root PATH] [--post ID] [--reply-to ID | --thread ID] [--view writer|full] [--stage draft|edited]';
  if (!['prepare','finish','cancel','suggest','replies','brief','checkpoint'].includes(command) || args.length % 2) throw Error(usage);
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i+1];
    if (!['--root','--work','--thread','--post','--reply-to','--view','--stage'].includes(key) || !value ||
      seen.has(key) && !(key === '--thread' && command === 'replies')) throw Error(usage);
    if (['--post','--reply-to','--view'].includes(key) && command !== 'brief' || key === '--thread' && !['brief','replies'].includes(command) || key === '--stage' && command !== 'checkpoint') throw Error(usage);
    seen.add(key);
    if (key === '--thread' && command === 'replies') (options.threadIds ||= []).push(value);
    else options[{'--root':'root','--work':'workDirectory','--thread':'threadId','--post':'postId','--reply-to':'replyTo','--view':'view','--stage':'stage'}[key]] = value;
  }
  let result;
  if (command === 'prepare') {
    const intake = await refreshIntake(options);
    result = await prepareUpdate({...options, ...(intake.intakeReceipt ? {intakeReceipt:intake.intakeReceipt} : {})});
  } else result = await ({finish:finishUpdate,cancel:cancelUpdate,suggest:suggestUpdatePresentation,replies:suggestUpdateReplies,brief:briefUpdatePost,checkpoint:checkpointUpdate}[command])(options);
  console.log(JSON.stringify(result,null,2));
} catch(error) { console.error(error.message); process.exitCode=1; }
