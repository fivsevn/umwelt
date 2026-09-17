// Thin runtime shim for the observation-speed control.
// Only specimen simulation is accelerated; the surrounding UI keeps normal time.
import {stepIndividuals as baseStepIndividuals} from './behaviors.mjs?v=personality-1';
export * from './behaviors.mjs?v=personality-1';

const clocks=new WeakMap();

function multiplier(){
  const value=Number(globalThis.__ISOPODA_HABITAT_SPEED__||1);
  return Number.isFinite(value)?Math.max(1,Math.min(16,value)):1;
}

export function stepIndividuals(group,context={}){
  const speed=multiplier();
  if(speed===1){
    const time=Number(context.time||0);
    clocks.set(group,{last:time,virtual:time});
    return baseStepIndividuals(group,context);
  }

  const time=Number(context.time||0);
  let clock=clocks.get(group);
  if(!clock||clock.last===null||time<clock.last){clock={last:time,virtual:time};}
  else{
    const delta=Math.max(0,Math.min(.5,time-clock.last));
    clock.virtual+=delta*speed;
    clock.last=time;
  }
  clocks.set(group,clock);

  const originalSpeeds=group.map(actor=>actor.speed);
  for(let i=0;i<group.length;i++)group[i].speed=originalSpeeds[i]*speed;
  try{
    return baseStepIndividuals(group,{...context,time:clock.virtual});
  }finally{
    for(let i=0;i<group.length;i++)group[i].speed=originalSpeeds[i];
  }
}
